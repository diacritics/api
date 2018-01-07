/*!***************************************************
 * diacritics API
 * http://diacritics.io/
 * Copyright (c) 2016–2018 The Diacritics Authors
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
'use strict';
const DatabaseFilter = require('./../database-filter');

/**
 * DatabaseFilterV1
 */
class DatabaseFilterV1 extends DatabaseFilter {

  /**
   * Initializes a new DatabaseFilterV1 instance
   */
  constructor() {
    super('https://git.io/vXK2F');
  }
}

module.exports = DatabaseFilterV1;
