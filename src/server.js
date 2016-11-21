/*!***************************************************
 * diacritics
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
"use strict";
const express = require("express"),
    fetch = require("node-fetch");

class API {

    /**
     * Initializes the API
     */
    constructor() {
        this.diacriticsURL = "https://git.io/vXN2T";
        this.app = express();
        this.port = 8080;
        this.initializeRouting();
        fetch(this.diacriticsURL).then(res => {
            return res.json();
        }).then(json => {
            this.database = json;
            this.start();
        });
    }

    /**
     * Initializes routing
     */
    initializeRouting() {
        this.app.get("/", (req, res) => {
            // filter in the arrangement of parameters
            const url = decodeURI(req.url).replace(/^\/[\?]?/gmi, ""),
                parts = url.split("&");
            let response = this.database;
            for(let part of parts) {
                if(!part) { // empty: no parameter
                    continue;
                }
                const [key, value] = part.split("=");
                if(req.query[key] && value === req.query[key]) {
                    let fn = this.capitalizeFirstLetter(key.toLowerCase());
                    fn = `handle${fn}Filter`;
                    if(typeof this[fn] === "function") {
                        response = this[fn](value, response);
                        if(typeof response.message !== "undefined") { // error
                            res.json(response);
                            return;
                        }
                        continue;
                    }
                }
                res.json({
                    message: `Invalid filter parameter '${key}'`
                });
                return;
            }
            res.json(response);
        });
    }

    /**
     * An object that has the language code as the key and an array of language
     * variants as the value
     * @typedef API~findByMetadataReturn
     * @type {object.<array>}
     */
    /**
     * Searches for a specific metadata information inside the context and
     * returns all found language and variant codes
     * @param {string} key - The metadata name
     * @param {string} value - The metadata value to search for
     * @param {object} context - The filter context (database, can already be
     * filtered)
     * @return {API~findByMetadataReturn}
     */
    findByMetadata(key, value, context) {
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
        for(let lang in context) {
            if(context.hasOwnProperty(lang)) {
                for(let variant in context[lang]) {
                    if(context[lang].hasOwnProperty(variant)) {
                        const meta = context[lang][variant]["metadata"];
                        if(typeof meta[key] === "undefined") {
                            continue; // e.g. "variant" isn't always available
                        } else if(Array.isArray(meta[key])) { // e.g. continent
                            for(let item of meta[key]) {
                                if(addIfEqual(item, value, lang, variant)) {
                                    break;
                                }
                            }
                        } else {
                            addIfEqual(meta[key], value, lang, variant);
                        }
                    }
                }
            }
        }
        return ret;
    }

    /**
     * Filters the context (database) by the given language object containing
     * languages and language variants
     * @param {API~findByMetadataReturn} langObj
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
     * Checks whether the given language is available in the database and if so,
     * filters the database using <code>findByMetadata</code> and
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
        const byLang = this.findByMetadata("language", lang, context);
        if(Object.keys(byLang).length) {
            return this.filterByLanguage(byLang, context);
        }
        const byNative = this.findByMetadata("native", lang, context);
        if(Object.keys(byNative).length) {
            return this.filterByLanguage(byNative, context);
        }
        return {
            "message": "Language was not found"
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
        const matches = this.findByMetadata("variant", variant, context);
        if(Object.keys(matches).length) {
            return this.filterByLanguage(matches, context);
        }
        return {
            "message": "Variant was not found"
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
        const matches = this.findByMetadata("alphabet", alphabet, context);
        if(Object.keys(matches).length) {
            return this.filterByLanguage(matches, context);
        }
        return {
            "message": "Alphabet was not found"
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
        const matches = this.findByMetadata("continent", continent, context);
        if(Object.keys(matches).length) {
            return this.filterByLanguage(matches, context);
        }
        return {
            "message": "Continent was not found"
        };
    }

    /**
     * Capitalizes the first letter of the provided string
     * @param {string} str
     * @return {string}
     */
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Starts the server
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`Server started: http://localhost:${this.port}`);
        });
    }
}

new API();
