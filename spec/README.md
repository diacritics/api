# Diacritics API Specification

> Route specification for the diacritics API

## /

Response => Entire diacritics database

## /lang/:lang

Response => The diacritics database of the specified language

`:lang` can be one of the following case insensitive values:

- [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code (e.g. `de`)
- The language written in English
- The language written in the native language
