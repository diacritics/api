# Diacritics API Specification

The meaning behind this API is to filter information of the [diacritics database](https://github.com/diacritics/database/) in a structured form. The API uses the files inside the [dist branch](https://github.com/diacritics/database/tree/dist) as a basis. To make sure processes that depend on the API will still work even if the structure changes, it provides basic versioned routes:

- [/v1/](./v1/)
