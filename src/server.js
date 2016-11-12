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
