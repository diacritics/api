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
            res.json(this.database);
        });
        this.app.get("/lang/:lang", (req, res) => {
            res.json(this.filterByLanguage(req.params.lang));
        });
    }

    /**
     * Filters the database by language: Either a ISO 639-1 language code, the
     * language written in English or in the native language
     * @param {string} lang - The language to filter
     * @return {object}
     */
    filterByLanguage(lang) {
        lang = lang.toLowerCase();
        if(typeof this.database[lang] !== "undefined") {
            return this.database[lang];
        }
        for(let i in this.database) {
            if(this.database.hasOwnProperty(i)) {
                const chkLanguage = this.database[i]["metadata"]["language"],
                    chkNative = this.database[i]["metadata"]["native"];
                if(chkLanguage.toLowerCase() === lang) {
                    return this.database[i];
                }
                if(chkNative.toLowerCase() === lang) {
                    return this.database[i];
                }
            }
        }
        return {
            "message": "Language was not found"
        };
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
