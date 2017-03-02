'use strict';

var fs = require('fs');

module.exports = function(filePath) {
  try {
    var manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    var manifest = {};
  }
  let stylesheets = [];
  let scripts     = [];
  for (let key in manifest) {
    let val = manifest[key];
    if (/(\.css)$/.test(val)) {
      stylesheets.push(val);
    } else if (/(\.js)$/.test(val)) {
      scripts.push(val);
    }
  }
  return {
    stylesheets: stylesheets,
    scripts: scripts
  };
}
