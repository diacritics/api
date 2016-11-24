/*!***************************************************
 * diacritics
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
"use strict";
const DatabaseFilter = require("./database-filter"),
    express = require("express");

/**
 * Server
 */
class Server {

    /**
     * Initializes a new server instance
     * @param {number} [port]
     */
    constructor(port = 8080) {
        this.port = port;
        this.dbFilter = new DatabaseFilter();
        this.app = express();
        this.initializeRouting();
    }

    /**
     * Initializes routing
     */
    initializeRouting() {
        this.app.get("/", (req, res) => {
            res.json(this.dbFilter.filter(req.query));
        });
        this.app.use((req, res) => {
            res.status(404).send("Sorry, something went wrong");
        });
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
        this.dbFilter.init().then(() => {
            this.app.listen(this.port, () => {
                cb(this.port);
            });
        });
    }
}

module.exports = Server;
