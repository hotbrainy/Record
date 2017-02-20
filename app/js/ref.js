'use strict';

var Firebase = require('firebase');
if (ref == null) {
  var ref = new Firebase('https://record.firebaseio.com/');
}

module.exports = ref;
