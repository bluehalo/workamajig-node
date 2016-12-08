'use strict';

var WorkamajigResource = require('../WorkamajigResource');
var workamajigMethod = WorkamajigResource.method;
var utils = require('../utils');

module.exports = WorkamajigResource.extend({

  path: 'projects',

  includeBasic: [
    'create', 'list', 'update', 'del',
    'setMetadata', 'getMetadata',
  ],

  retrieve: workamajigMethod({
    method: 'GET',
  }),

});
