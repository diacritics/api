/*!***************************************************
 * diacritics
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
"use strict";
const express = require("express");

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
        this.app = express();
    }

    /**
     * Routing callback
     * @callback API~routingCallback
     */
    /**
     * Initializes routing
     * @param {API~routingCallback} cb - A callback function
     */
    initializeRouting(cb) {
        // initialize dynamic versioned routing, e.g. /v1/ if the class exists
        const recursive = (i, end) => {
            try {
                let dbFilter = require(`./v${i}/database-filter`);
                dbFilter = new dbFilter();
                dbFilter.init().then(() => {
                    this.app.get(`/v${i}/`, (req, res) => {
                        res.json(dbFilter.filter(req.query));
                    });
                    recursive(++i, end);
                });
            } catch(e) {
                end(); // require failed, version not found
            }
        };
        recursive(1, () => {
            this.app.use((req, res) => {
                res.status(404).send("Sorry, something went wrong");
            });
            cb();
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
        this.initializeRouting(() => {
            this.app.listen(this.port, () => {
                cb(this.port);
            });
        });
    }
}

module.exports = Server;
