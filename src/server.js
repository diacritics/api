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
        this.diacriticsURL = "https://git.io/vXK2F";
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
                    fn = `filterBy${fn}`;
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
     * Searches for a specific metadata information inside the context and
     * returns an array containing all found language codes
     * @param {string} key - The metadata name
     * @param {string} value - The metadata value to search for
     * @return {array} - An array of found language codes
     */
    findByMetadata(key, value, context) {
        let ret = [];
        for(let lang in context) {
            if(context.hasOwnProperty(lang)) {
                const meta = context[lang]["metadata"];
                if(typeof meta[key] !== "undefined") {
                    if(meta[key].toLowerCase() === value.toLowerCase()) {
                        ret.push(lang);
                    }
                }
            }
        }
        return ret;
    }

    /**
     * Filters the database by language: Either a ISO 639-1 language code, the
     * language written in English or in the native language
     * @param {string} lang - The language to filter
     * @param {object} context - The filter context
     * @return {object}
     */
    filterByLanguage(lang, context) {
        lang = lang.toLowerCase();
        let ret = {};
        if(typeof context[lang] !== "undefined") {
            ret[lang] = context[lang];
            return ret;
        }
        const byLang = this.findByMetadata("language", lang, context);
        if(byLang.length) {
            ret[byLang[0]] = context[byLang[0]];
            return ret;
        }
        const byNative = this.findByMetadata("native", lang, context);
        if(byNative.length) {
            ret[byNative[0]] = context[byNative[0]];
            return ret;
        }
        return {
            "message": "Language was not found"
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
