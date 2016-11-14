# Diacritics API Specification

> Route and filter specification for the diacritics API


## Structure of the API

The API provides just one route, `/`. If you're calling it without any parameter, the response will be the entire diacritics database. But, you can provide one or more of the following parameters to filter the response. The response will be filtered according to the given parameter positions. For example if you request `/?continent=EU&alphabet=Latn` then the response will be first filtered by content and by alphabet afterwards.

Please note that specifying some parameters in combination makes so sense. For example filtering by language and then by continent. The other way around it would make sense.

Please also note that the database specification including its properties can be found in [its repository](https://github.com/diacritics/database/tree/master/spec).

## Filter Parameters

### language

Filters the response by language. Can be one of the following case insensitive values:

- [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code (e.g. `de`)
- The language written in English
- The language written in the native language

**Example**: `/?language=de`

###  alphabet

Filters the response by alphabet. Must be a [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) code, e.g. `Latn`.

**Example**: `/?alphabet=Latn`

### continent

Filters the response by continent. Must be a [ISO-3166](https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29) continent code, e.g. `EU`.

**Example**: `/?continent=EU`

### diacritic

Filters the response by a specific diacritic. An example would be `ü`.

**Example**: `/?diacritic=ü`

### base

Filters the response by a specific `base` value. An example would be `u` in case of `ü`.

**Example**: `/?base=u`

### decompose

Filters the response by a specific `decompose` value. An example would be `ue` in case of `ü`.

**Example**: `/?decompose=ue`
