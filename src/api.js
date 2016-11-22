/*!***************************************************
 * diacritics
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
"use strict";
const express = require("express"),
    fetch = require("node-fetch");

/**
 * API
 */
class API {

    constructor() {
        this.diacriticsURL = "https://git.io/vXN2T";
        this.app = express();
        this.port = parseInt(process.argv.slice(2)[0]);
        this.database = {};
        this.initializeFilterRoute();
        this.initializeErrorRoute();
    }

    /**
     * Initializes the filter route
     */
    initializeFilterRoute() {
        this.app.get("/", (req, res) => {
            let response = this.database;
            for(let query in req.query) {
                const [key, value] = [query, req.query[query]];
                let fn = key.toLowerCase();
                fn = `handle${fn.charAt(0).toUpperCase()}${fn.slice(1)}Filter`;
                if(typeof this[fn] === "function") {
                    response = this[fn](value, response);
                    if(typeof response !== "object" || response === null) {
                        throw new Error("Invalid filter response");
                    } else if(typeof response.message !== "undefined") {
                        res.json(response);
                        return;
                    } else if(!Object.keys(response).length) {
                        res.json({
                            "message": "No entries found"
                        });
                        return;
                    }
                } else {
                    res.json({
                        "message": `Invalid filter parameter '${key}'`
                    });
                    return;
                }
            }
            res.json(response);
        });
    }

    /**
     * Initializes the error route
     */
    initializeErrorRoute() {
        this.app.use((req, res) => {
            res.status(404).send({
                "message": "Sorry, something went wrong"
            });
        });
    }

    /**
     * @callback API~forEachLanguageVariantCb
     * @param {string} lang - The language
     * @param {string} variant - The language variant
     * @param {object} json - The data of the language variant
     */
    /**
     * Calls the callback for each language variant (including the standard
     * language)
     * @param {object} context
     * @param {API~forEachLanguageVariantCb} cb
     */
    forEachLanguageVariant(context, cb) {
        for(let lang in context) {
            if(context.hasOwnProperty(lang)) {
                for(let variant in context[lang]) {
                    if(context[lang].hasOwnProperty(variant)) {
                        cb(lang, variant, context[lang][variant]);
                    }
                }
            }
        }
    }

    /**
     * An object that has the language code as the key and an array of language
     * variants as the value
     * @typedef API~findLanguageByMetadataReturn
     * @type {object.<array>}
     */
    /**
     * Searches for a specific metadata information inside the context and
     * returns all found language and variant codes
     * @param {string} key - The metadata name
     * @param {string} value - The metadata value to search for
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {API~findLanguageByMetadataReturn}
     */
    findLanguageByMetadata(key, value, context) {
        const addIfEqual = (a, b, lang, variant) => {
            if(a.toLowerCase() === b.toLowerCase()) {
                if(typeof ret[lang] === "undefined") {
                    ret[lang] = [];
                }
                ret[lang].push(variant);
                return true;
            }
            return false;
        };
        let ret = {};
        this.forEachLanguageVariant(context, (lang, variant, json) => {
            const meta = json["metadata"];
            if(typeof meta[key] === "undefined") {
                return; // e.g. "variant" isn't always available
            } else if(Array.isArray(meta[key])) { // e.g. continent
                for(let item of meta[key]) {
                    if(addIfEqual(item, value, lang, variant)) {
                        break;
                    }
                }
            } else {
                addIfEqual(meta[key], value, lang, variant);
            }
        });
        return ret;
    }

    /**
     * Filters the context (database) by the given language object containing
     * languages and language variants
     * @param {API~findLanguageByMetadataReturn} langObj
     * @param {object} context - The filter context (database)
     * @return {object} - The filtered database
     */
    filterByLanguage(langObj, context) {
        let ret = {};
        for(let lang in langObj) {
            if(langObj.hasOwnProperty(lang)) {
                for(let variant of langObj[lang]) {
                    if(typeof ret[lang] === "undefined") {
                        ret[lang] = {};
                    }
                    ret[lang][variant] = context[lang][variant];
                }
            }
        }
        return ret;
    }

    /**
     * Removes data from the given context, based on the return value of the
     * filter function
     * @param {API~filterByData} filterFn
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @param {string} [property=null] - The property name of a mapping
     * information, e.g. <code>base</code> that will be passed to the filter
     * function. If the property is <code>null</code> the diacritic (key) itself
     * will be passed to the filter function
     * @return {object} - The filtered database
     */
    removeNonMatchingData(filterFn, context, property = null) {
        context = JSON.parse(JSON.stringify(context)); // clone without ref
        this.forEachLanguageVariant(context, (lang, variant, json) => {
            for(let char in json.data) {
                if(json.data.hasOwnProperty(char)) {
                    let param;
                    if(property === null) {
                        param = char;
                    } else {
                        param = json.data[char].mapping[property];
                    }
                    if(!filterFn(param)) {
                        delete context[lang][variant].data[char];
                    }
                }
            }
        });
        return context;
    }

    /**
     * A function that will be called to filter. It should return true when the
     * given value is to be kept, otherwise false
     * @callback API~filterByData
     * @param {string} value - The value of the specified property
     */
    /**
     * Filters the given context by the given data property
     * @param {API~filterByData} filterFn
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @param {string} [property=null] - The property name of a mapping
     * information, e.g. <code>base</code> that will be passed to the filter
     * function. If the property is <code>null</code> the diacritic (key) itself
     * will be passed to the filter function
     * @return {object} - The filtered database
     */
    filterByData(filterFn, context, property = null) {
        let matchingLanguages = {};
        this.forEachLanguageVariant(context, (lang, variant, json) => {
            for(let char in json.data) {
                if(json.data.hasOwnProperty(char)) {
                    let param;
                    if(property === null) {
                        param = char;
                    } else {
                        param = json.data[char].mapping[property];
                    }
                    if(filterFn(param)) {
                        if(typeof matchingLanguages[lang] === "undefined") {
                            matchingLanguages[lang] = [];
                        }
                        matchingLanguages[lang].push(variant);
                    }
                }
            }
        });
        context = this.filterByLanguage(matchingLanguages, context);
        context = this.removeNonMatchingData(filterFn, context, property);
        return context;
    }

    /**
     * Checks whether the given language is available in the database and if so,
     * filters the database using <code>findLanguageByMetadata</code> and
     * <code>filterByLanguage</code>.
     * Language can either be a ISO 639-1 language code, the language written in
     * English or in the native language
     * @param {string} lang - The language to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleLanguageFilter(lang, context) {
        lang = lang.toLowerCase();
        if(typeof context[lang] !== "undefined") {
            let ret = {};
            ret[lang] = context[lang];
            return ret;
        }
        const byLang = this.findLanguageByMetadata("language", lang, context),
            byNative = this.findLanguageByMetadata("native", lang, context);
        if(Object.keys(byLang).length) {
            return this.filterByLanguage(byLang, context);
        }
        if(Object.keys(byNative).length) {
            return this.filterByLanguage(byNative, context);
        }
        return {
            "message": `Language '${lang}' was not found`
        };
    }

    /**
     * Filters the given context (database) by the given variant
     * @param {string} variant - The language variant to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleVariantFilter(variant, context) {
        const matches = this.findLanguageByMetadata(
            "variant", variant, context
        );
        if(Object.keys(matches).length) {
            return this.filterByLanguage(matches, context);
        }
        return {
            "message": `Variant '${variant}' was not found`
        };
    }

    /**
     * Filters the given context (database) by the given alphabet. Alphabet must
     * be a ISO 15924 code, e.g. Latn
     * @param {string} alphabet - The alphabet to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleAlphabetFilter(alphabet, context) {
        const matches = this.findLanguageByMetadata(
            "alphabet", alphabet, context
        );
        if(Object.keys(matches).length) {
            return this.filterByLanguage(matches, context);
        }
        return {
            "message": `Alphabet '${alphabet}' was not found`
        };
    }

    /**
     * Filters the given context (database) by the given continent. Continent
     * must be a ISO ISO-3166 continent code, e.g. EU
     * @param {string} continent - The continent to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleContinentFilter(continent, context) {
        const matches = this.findLanguageByMetadata(
            "continent", continent, context
        );
        if(Object.keys(matches).length) {
            return this.filterByLanguage(matches, context);
        }
        return {
            "message": `Continent '${continent}' was not found`
        };
    }

    /**
     * Filters the given context (database) by the given diacritic
     * @param {string} diacritic - The diacritic to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleDiacriticFilter(diacritic, context) {
        const ret = this.filterByData(val => {
            return val === diacritic;
        }, context);
        if(Object.keys(ret).length) {
            return ret;
        }
        return {
            "message": `Diacritic '${diacritic}' was not found`
        };
    }

    /**
     * Filters the given context (database) by the given base character
     * @param {string} base - The base character to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleBaseFilter(base, context) {
        const ret = this.filterByData(val => {
            return val === base;
        }, context, "base");
        if(Object.keys(ret).length) {
            return ret;
        }
        return {
            "message": `Base character '${base}' was not found`
        };
    }

    /**
     * Filters the given context (database) by the given decompose value
     * @param {string} decompose - The decompose value to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleDecomposeFilter(decompose, context) {
        const ret = this.filterByData(val => {
            return val === decompose;
        }, context, "decompose");
        if(Object.keys(ret).length) {
            return ret;
        }
        return {
            "message": `Decompose value '${decompose}' was not found`
        };
    }

    /**
     * Start callback
     * @callback API~startCallback
     * @param {number} port - The port of the server
     */
    /**
     * Starts the server
     * @param {API~startCallback} cb - A callback function
     */
    start(cb) {
        fetch(this.diacriticsURL).then(res => {
            return res.json();
        }).then(json => {
            this.database = json;
            this.app.listen(this.port, () => {
                cb(this.port);
            });
        });
    }
}

module.exports = API;
