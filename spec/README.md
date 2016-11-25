# Diacritics API Specification

> Route and filter specification for the diacritics API

## General

The API provides just one route, `/`. If you're calling it without any parameter, the response will be the entire diacritics database. But, you can provide one or more of the following parameters to filter the response. They are divided into two types, metadata filters and data filters, because they are returning different data. You can combine them if you need.

Please note that the database specification including its properties can be found in [its repository](https://github.com/diacritics/database/tree/master/spec).

## Metadata Filter Parameters

These filters don't manipulate the actual data, therefore the response will be almost identical like specified in [the specification](https://github.com/diacritics/database/tree/master/spec#31-diacriticsjson). The only difference is that it will only list languages or language variants that are matching the specified metadata filters.

Note that metadata filter names and values are handled case insensitive.

### language

Filters the response by language. Can be one of the following case insensitive values:

- [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code (e.g. `de`)
- The language written in English
- The language written in the native language

**Example**: `/?language=de`

### variant

Filters the response by a language variant. Must be either written in English, e.g. `Austria` or the language variant code, e.g. `at`.

**Example**: `/?variant=Austria`

###  alphabet

Filters the response by alphabet. Must be a [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) code, e.g. `Latn`.

**Example**: `/?alphabet=Latn`

### continent

Filters the response by continent. Must be a [ISO-3166](https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29) continent code, e.g. `EU`.

**Example**: `/?continent=EU`

## Data Filter Parameters

These filters will only list languages or language variants that are matching the specified data filters, just like the metadata filters. Additionally, they will only list the mapping information that match the filters.

### diacritic

Filters the response by a specific diacritic. An example would be `ü`.  
Please note that you might need to encode the diacritic, e.g. using [`encodeURI()`](http://www.w3schools.com/jsref/jsref_encodeuri.asp).

**Example**: `/?diacritic=%C3%BC`

### base

Filters the response by a specific `base` value. An example would be `u` in case of `ü`.

**Example**: `/?base=u`

### decompose

Filters the response by a specific `decompose` value. An example would be `ue` in case of `ü`.

**Example**: `/?decompose=ue`

## Fallback

If an invalid filter parameter is passed, the API will response a JSON containing a property `message` indicating the error message. Example:

```javascript
{
    "message": "Language was not found"
}
```
