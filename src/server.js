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
            // filter by parameter position
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
                    message: "Invalid filter parameter"
                });
                return;
            }
            res.json(response);
        });
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
        if(typeof context[lang] !== "undefined") {
            let ret = {};
            ret[lang] = context[lang];
            return ret;
        }
        for(let i in context) {
            if(context.hasOwnProperty(i)) {
                const chkLanguage = context[i]["metadata"]["language"],
                    chkNative = context[i]["metadata"]["native"];
                let ret = {};
                ret[i] = context[i];
                if(chkLanguage.toLowerCase() === lang) {
                    return ret;
                }
                if(chkNative.toLowerCase() === lang) {
                    return ret;
                }
            }
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
