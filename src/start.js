/*!***************************************************
 * diacritics
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
"use strict";
const API = require("./server");

new API().start(port => {
    console.log(`Server started: http://localhost:${port}`);
});
