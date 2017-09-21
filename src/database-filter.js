/*!***************************************************
 * diacritics API
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
'use strict';
const fetch = require('node-fetch');

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
    for (let query of Object.keys(filters)) {
      const [key, values] = [
          query.trim().toLowerCase(),
          // convert values divided by comma into array and filter empty values
          filters[query].toLowerCase().split(',').filter(val => {
            return val;
          }).map(val => val.trim())
        ],
        fn = `handle${key.charAt(0).toUpperCase()}${key.slice(1)}Filter`;
      if (!values.length) {
        return {
          'message': `No values for parameter '${key}' provided`
        };
      } else if (typeof this[fn] === 'function') {
        response = this[fn](values, response);
        if (typeof response !== 'object' || response === null) {
          return {
            'message': 'Invalid filter response'
          };
        } else if (typeof response.message !== 'undefined') {
          return response;
        } else if (!Object.keys(response).length) {
          return {
            'message': 'No entries found'
          };
        }
      } else {
        return {
          'message': `Invalid filter parameter '${key}'`
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
    for (let lang of Object.keys(context)) {
      for (let variant of Object.keys(context[lang])) {
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
   * Searches for a one or multiple metadata information (inside an array)
   * inside the context and returns all found languages with their variants
   * @param {string} key - The metadata name
   * @param {string[]} values - The metadata values to search for
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {DatabaseFilter~findLanguageByMetadataReturn}
   */
  findLanguageByMetadata(key, values, context) {
    let ret = {};
    this.forEachLanguageVariant(context, (lang, variant, json) => {
      let meta = json['metadata'][key];
      if (typeof meta === 'undefined') {
        return; // e.g. "variant" isn't always available
      }
      meta = typeof meta === 'string' ? [meta] : meta;
      // compare case insensitive. Sources like `variant` may not always be
      // case insensitive by default
      meta = meta.map(v => v.toLowerCase());
      if (meta.some(v => values.includes(v))) {
        if (typeof ret[lang] === 'undefined') {
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
    for (let lang of Object.keys(langObj)) {
      for (let variant of langObj[lang]) {
        if (typeof ret[lang] === 'undefined') {
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
      for (let char of Object.keys(json.data)) {
        let param;
        if (property === null) {
          param = char;
        } else {
          param = json.data[char].mapping[property];
        }
        if (!filterFn(param)) {
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
      for (let char of Object.keys(json.data)) {
        let param;
        if (property === null) {
          param = char;
        } else {
          param = json.data[char].mapping[property];
        }
        if (filterFn(param)) {
          if (typeof matchingLanguages[lang] === 'undefined') {
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
   * Joins the provided value array into a message conform string
   * @param {string[]} values
   * @returns {string}
   */
  joinValues(values) {
    return `'${values.join('\', \'')}'`;
  }

  /**
   * Merges n languages together. Each language is an object containing an array
   * of language variants. This method is necessary as Object.assign() doesn't
   * merge deep arrays too
   * @param {DatabaseFilter~findLanguageByMetadataReturn} languages
   * @return {object} - A merged object
   */
  mergeLanguages(...languages) {
    let ret = {};
    languages.forEach(language => {
      for (let lang of Object.keys(language)) {
        if (typeof ret[lang] === 'undefined') {
          ret[lang] = [];
        }
        for (let variant of language[lang]) {
          if (!ret[lang].includes(variant)) {
            ret[lang].push(variant);
          }
        }
      }
    });
    return ret;
  }

  // Language Filters-----------------------------------------------------------

  /**
   * Checks whether the given languages are available in the database and if so,
   * filters the database using <code>findLanguageByMetadata</code> and
   * <code>filterByLanguage</code>.
   * Language can either be a ISO 639-1 language code, the language written in
   * English or in the native language
   * @param {string[]} languages - The languages to filter (one or multiple)
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleLanguageFilter(languages, context) {
    let ret = {};
    // filter by the languages keys itself
    this.forEachLanguageVariant(context, (lang, variant) => {
      if (languages.includes(lang)) {
        if (typeof ret[lang] === 'undefined') {
          ret[lang] = [];
        }
        ret[lang].push(variant);
      }
    });
    // filter by metadata properties languages and native
    const byLang = this.findLanguageByMetadata('language', languages, context),
      byNative = this.findLanguageByMetadata(
        'languageNative', languages, context
      );
    ret = this.mergeLanguages(ret, byLang, byNative);
    if (Object.keys(ret).length) {
      return this.filterByLanguage(ret, context);
    } else {
      return {
        'message': `Languages ${this.joinValues(languages)} weren't found`
      };
    }
  }

  /**
   * Filters the given context (database) by the given language variant,
   * either the language code, the language variant written in English or
   * written in the native language
   * @param {string[]} variants - The language variants to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleVariantFilter(variants, context) {
    let ret = {};
    this.forEachLanguageVariant(context, (lang, langVariant) => {
      if (variants.includes(langVariant)) {
        if (typeof ret[lang] === 'undefined') {
          ret[lang] = [];
        }
        ret[lang].push(langVariant);
      }
    });
    // filter by metadata properties variant and variantNative
    const byVariant = this.findLanguageByMetadata('variant', variants, context),
      byVariantNative = this.findLanguageByMetadata(
        'variantNative', variants, context
      );
    ret = this.mergeLanguages(ret, byVariant, byVariantNative);
    if (Object.keys(ret).length) {
      return this.filterByLanguage(ret, context);
    } else {
      return {
        'message': `Variants ${this.joinValues(variants)} weren't found`
      };
    }
  }

  // Metadata Filters-----------------------------------------------------------

  /**
   * Filters the given context (database) by the given alphabets. alphabets must
   * be ISO 15924 codes, e.g. "Latn"
   * @param {string[]} alphabets - The alphabets to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleAlphabetFilter(alphabets, context) {
    let ret = {};
    const matches = this.findLanguageByMetadata(
      'alphabet', alphabets, context
    );
    if (Object.keys(matches).length) {
      ret = this.filterByLanguage(matches, context);
    }
    if (Object.keys(ret).length) {
      return ret;
    } else {
      const join = this.joinValues(alphabets);
      return {
        'message': `Alphabetss ${join} weren't found`
      };
    }
  }

  /**
   * Filters the given context (database) by the given continents. Continents
   * must be ISO ISO-3166 continents codes, e.g. "EU"
   * @param {string[]} continents - The continents to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleContinentFilter(continents, context) {
    let ret = {};
    const matches = this.findLanguageByMetadata(
      'continent', continents, context
    );
    if (Object.keys(matches).length) {
      ret = this.filterByLanguage(matches, context);
    }
    if (Object.keys(ret).length) {
      return ret;
    } else {
      const join = this.joinValues(continents);
      return {
        'message': `Continents ${join} weren't found`
      };
    }
  }

  /**
   * Filters the given context (database) by the given countries, e.g. "DE"
   * @param {string[]} countries - The countries to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleCountryFilter(countries, context) {
    let ret = {};
    const matches = this.findLanguageByMetadata(
      'country', countries, context
    );
    if (Object.keys(matches).length) {
      ret = this.filterByLanguage(matches, context);
    }
    if (Object.keys(ret).length) {
      return ret;
    } else {
      const join = this.joinValues(countries);
      return {
        'message': `Countries ${join} weren't found`
      };
    }
  }

  // Data Filters---------------------------------------------------------------

  /**
   * Filters the given context (database) by the given diacritics
   * @param {string[]} diacritics - The diacritics to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleDiacriticFilter(diacritics, context) {
    const ret = this.filterByData(val => {
      return diacritics.includes(val);
    }, context);
    if (Object.keys(ret).length) {
      return ret;
    } else {
      const join = this.joinValues(diacritics);
      return {
        'message': `Diacritics ${join} weren't found`
      };
    }
  }

  /**
   * Filters the given context (database) by the given base characters
   * @param {string[]} bases - The base characters to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleBaseFilter(bases, context) {
    const ret = this.filterByData(val => {
      return bases.includes(val);
    }, context, 'base');
    if (Object.keys(ret).length) {
      return ret;
    } else {
      const join = this.joinValues(bases);
      return {
        'message': `Bases ${join} weren't found`
      };
    }
  }

  /**
   * Filters the given context (database) by the given decompose values
   * @param {string[]} decomposes - The decompose values to filter
   * @param {object} context - The filter context (database, can already be
   * filtered)
   * @return {object} - The filtered database
   */
  handleDecomposeFilter(decomposes, context) {
    const ret = this.filterByData(val => {
      return decomposes.includes(val);
    }, context, 'decompose');
    if (Object.keys(ret).length) {
      return ret;
    } else {
      const join = this.joinValues(decomposes);
      return {
        'message': `Decomposes ${join} weren't found`
      };
    }
  }
}

module.exports = DatabaseFilter;
