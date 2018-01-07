/*!***************************************************
 * diacritics API
 * http://diacritics.io/
 * Copyright (c) 2016–2018 The Diacritics Authors
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
'use strict';
const express = require('express');

/**
 * Server
 */
class Server {

  /**
   * Initializes a new server instance
   * @param {number} [port=8080]
   */
  constructor(port = 8080) {
    this.port = port;
    this.app = express();
  }

  /**
   * Initialization callback
   * @callback Server~initCallback
   */
  /**
   * Initializes routing
   * @param {Server~initCallback} cb - A callback function
   */
  initializeRouting(cb) {
    // initialize dynamic versioned routing, e.g. /v1/ if the class exists
    const recursive = (i, end) => {
      try {
        // eslint-disable-next-line global-require
        const DatabaseFilter = require(`./v${i}/database-filter`),
          dbFilter = new DatabaseFilter();
        dbFilter.init().then(() => {
          this.app.get(`/v${i}/`, (req, res) => {
            res.json(dbFilter.filter(req.query));
          });
          recursive(++i, end);
        });
      } catch (e) {
        end(--i); // require failed, version not found
      }
    };
    recursive(1, lastVersion => {
      this.app.get('/', (req, res) => {
        res.redirect(`/v${lastVersion}/${req.url.split('/').pop()}`);
      });
      this.app.use((req, res) => {
        res.status(404).send('Sorry, something went wrong');
      });
      cb();
    });
  }

  /**
   * Start callback
   * @callback Server~startCallback
   * @param {number} port - The port of the server
   */
  /**
   * Starts the server
   * @param {Server~startCallback} cb - A callback function
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
