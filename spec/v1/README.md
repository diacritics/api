# Diacritics API v1 Specification

> Route and filter specification for the diacritics API v1

## General

The basic route of API v1 is `/v1/`, the full URL is http://api.diacritics.io/v1/. If you're calling it without any parameter, the response will be the entire diacritics database. But, you can provide one or more of the following parameters to filter the response. Filters are processed in the sequence as they are handed over.  
 Filters are divided into three types, language filters, metadata filters and data filters. You can combine all of them.

The corresponding database specification including its properties can be found in [its repository](https://github.com/diacritics/database/tree/master/spec).

## Language Filters

These filters don't manipulate the actual data, therefore the response will be identical like specified in [the specification](https://github.com/diacritics/database/tree/master/spec#31-diacriticsjson). However, they will only return languages / language variants that are matching the specified filters.

Note that language filter names and values are handled case insensitive.

### language

Filters the response by a language. Must be one or multiple of the following values:

- [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code (e.g. `de`)
- The language written in English (e.g. `German`)
- The language written in the native language (e.g. `Deutsch`)

**Example**: `/v1/?language=de`

Multiple values must be specified by using a comma:

**Example**: `/v1/?language=German,es`

### variant

Filters the response by a language variant. Must be one or multiple of the following values:

- The language variant code (e.g. `ch`). Returns all variants regardless of the root language (if there's no `language` filter. May be multiple)
- The language variant written in English. Returns only the corresponding variant (e.g. `Swiss German` only returns the `de-CH` variant)
- The language variant written in the native language. Returns only the corresponding variant (e.g. `Swiss German` only returns the `de-CH` variant)

**Example**: `/v1/?variant=German`

Multiple values must be specified by using a comma:

**Example**: `/v1/?variant=de,ch`

## Metadata Filters

These filters don't manipulate the actual data, therefore the response will be identical like specified in [the specification](https://github.com/diacritics/database/tree/master/spec#31-diacriticsjson). However, they will only return languages / language variants that are matching the specified filters.

Note that metadata filter names and values are handled case insensitive.

###  alphabet

Filters the response by an alphabet. Must be one or multiple [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) codes, e.g. `Latn`.

**Example**: `/v1/?alphabet=Latn`

Multiple values must be specified by using a comma:

**Example**: `/v1/?alphabet=Latn,Jpan`

### continent

Filters the response by a continent. Must be one or multiple [ISO-3166](https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29) continent codes, e.g. `EU`.

**Example**: `/v1/?continent=EU`

Multiple values must be specified by using a comma:

**Example**: `/v1/?continent=EU,OC`

### country

Filters the response by one or multiple countries, e.g. `DE`.

**Example**: `/v1/?country=DE`

Multiple values must be specified by using a comma:

**Example**: `/v1/?country=DE,AT`

## Data Filters

These filters will only return languages / language variants that are matching the specified data filters, just like the language and metadata filters. Additionally, they will only return those mapping information that match the specified filters.

### diacritic

Filters the response by one or multiple specific diacritic characters. An example would be `ü`.  
Please note that you might need to encode the diacritic, e.g. using [`encodeURI()`](http://www.w3schools.com/jsref/jsref_encodeuri.asp).

**Example**: `/v1/?diacritic=%C3%BC`

Multiple values must be specified by using a comma:

**Example**: `/v1/?diacritic=%C3%BC,%C3%B6`

### base

Filters the response by one or multiple specific `base` values. An example would be `u` in case of `ü`.

**Example**: `/v1/?base=u`

Multiple values must be specified by using a comma:

**Example**: `/v1/?base=u,o`

### decompose

Filters the response by one or multiple specific `decompose` values. An example would be `ue` in case of `ü`.

**Example**: `/v1/?decompose=ue`

Multiple values must be specified by using a comma:

**Example**: `/v1/?decompose=ue,oe`

## Fallback

If an invalid filter parameter is passed, or the provided parameter value couldn't be found, the API will response a JSON containing a property `message` indicating the error message. Example:

```javascript
{
    "message": "Languages 'te', 'st' weren't found"
}
```

Note: The API will only return error messages in case all provided parameter values couldn't be found. For example if you pass a language filter with two languages that exist, and one language that doesn't exist, it'll return these two found languages. This behavior was chosen to make it possible to define a huge list of languages, even if they're not all available yet. And if they are, they'll be automatically included in future.
