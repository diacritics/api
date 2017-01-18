/*!***************************************************
 * diacritics
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
"use strict";
const fetch = require("node-fetch");

/**
 * DatabaseFilter
 */
class DatabaseFilter {

    /**
     * Initializes a new DatabaseFilter instance. This method will be called
     * from one of the versioned database filter classes. See e.g. ./v1/
     * @param {string} databaseURL - The URL that points to the JSON database
     */
    constructor(databaseURL) {
        this.databaseURL = databaseURL;
        this.database = {};
    }

    /**
     * Loads and parses the database. This method will be called from the server
     * while its initialization
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, reject) => {
            fetch(this.databaseURL).then(res => {
                return res.json();
            }).then(json => {
                this.database = json;
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * An object containing one or multiple properties to filter. Have a look
     * at the API spec to see the supported filter properties
     * @see {@link https://github.com/diacritics/api/tree/master/spec}
     * @typedef DatabaseFilter~filter
     * @type {object.<string>}
     */
    /**
     * Filters the database by the given filters. This is the method called
     * from the server class on each request and should return the JSON response
     * for the user
     * @param {DatabaseFilter~filter} [filters]
     * @return {object}
     */
    filter(filters = {}) {
        let response = this.database;
        for(let query of Object.keys(filters)) {
            const [key, value] = [query, filters[query]];
            let fn = key.toLowerCase();
            fn = `handle${fn.charAt(0).toUpperCase()}${fn.slice(1)}Filter`;
            if(typeof this[fn] === "function") {
                response = this[fn](value, response);
                if(typeof response !== "object" || response === null) {
                    return {
                        "message": "Invalid filter response"
                    };
                } else if(typeof response.message !== "undefined") {
                    return response;
                } else if(!Object.keys(response).length) {
                    return {
                        "message": "No entries found"
                    };
                }
            } else {
                return {
                    "message": `Invalid filter parameter '${key}'`
                };
            }
        }
        return response;
    }

    /**
     * @callback DatabaseFilter~forEachLanguageVariantCb
     * @param {string} lang - The language
     * @param {string} variant - The language variant
     * @param {object} json - The data of the language variant
     */
    /**
     * Iterates over each language variant – including the standard language –
     * and calls the callback
     * @param {object} context
     * @param {DatabaseFilter~forEachLanguageVariantCb} cb
     */
    forEachLanguageVariant(context, cb) {
        for(let lang of Object.keys(context)) {
            for(let variant of Object.keys(context[lang])) {
                cb(lang, variant, context[lang][variant]);
            }
        }
    }

    /**
     * An object that has the language code as the key and an array of language
     * variants as the value
     * @typedef DatabaseFilter~findLanguageByMetadataReturn
     * @type {object.<array>}
     */
    /**
     * Searches for a specific metadata information inside the context and
     * returns all found language and variant codes
     * @param {string} key - The metadata name
     * @param {string} value - The metadata value to search for. Can also be
     * a string that contains multiple values separated by a comma
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {DatabaseFilter~findLanguageByMetadataReturn}
     */
    findLanguageByMetadata(key, value, context) {
        value = value.includes(",") ? value.split(",") : [value];
        let ret = {};
        this.forEachLanguageVariant(context, (lang, variant, json) => {
            let meta = json["metadata"][key];
            if(typeof meta === "undefined") {
                return; // e.g. "variant" isn't always available
            }
            meta = typeof meta === "string" ? [meta] : meta;
            // compare if meta contains the specified value case insensitive
            meta = meta.map(v => v.toLowerCase());
            value = value.map(v => v.toLowerCase());
            if(meta.some(v => value.includes(v))) {
                if(typeof ret[lang] === "undefined") {
                    ret[lang] = [];
                }
                ret[lang].push(variant);
            }
        });
        return ret;
    }

    /**
     * Filters the context (database) by the given language object containing
     * languages and language variants
     * @param {DatabaseFilter~findLanguageByMetadataReturn} langObj
     * @param {object} context - The filter context (database)
     * @return {object} - The filtered database
     */
    filterByLanguage(langObj, context) {
        let ret = {};
        for(let lang of Object.keys(langObj)) {
            for(let variant of langObj[lang]) {
                if(typeof ret[lang] === "undefined") {
                    ret[lang] = {};
                }
                ret[lang][variant] = context[lang][variant];
            }
        }
        return ret;
    }

    /**
     * Removes data from the given context, based on the return value of the
     * filter function
     * @param {DatabaseFilter~filterByData} filterFn
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
            for(let char of Object.keys(json.data)) {
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
        });
        return context;
    }

    /**
     * A function that will be called to filter. It should return true when the
     * given value is to be kept, otherwise false
     * @callback DatabaseFilter~filterByData
     * @param {string} value - The value of the specified property
     */
    /**
     * Filters the given context by the given data property
     * @param {DatabaseFilter~filterByData} filterFn
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
            for(let char of Object.keys(json.data)) {
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
     * Filters the given context (database) by the given language variant,
     * either a metadata property <code>variant</code> or the language code
     * @param {string} variant - The language variant to filter
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {object} - The filtered database
     */
    handleVariantFilter(variant, context) {
        let ret = {};
        this.forEachLanguageVariant(context, (lang, langVariant, json) => {
            if(langVariant === variant) {
                ret[lang] = {};
                ret[lang][langVariant] = json;
            }
        });
        if(Object.keys(ret).length) {
            return ret;
        }
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
}

module.exports = DatabaseFilter;
