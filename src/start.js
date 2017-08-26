/*!***************************************************
 * diacritics API
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/vXK2G
 *****************************************************/
'use strict';
const Server = require('./server');

new Server(process.env.PORT).start(port => {
  console.log(`Server started: http://localhost:${port}`);
});
