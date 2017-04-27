'use strict';

var WorkamajigResource = require('../WorkamajigResource');
var workamajigMethod = WorkamajigResource.method;
var utils = require('../utils');

module.exports = WorkamajigResource.extend({

  path: 'projects',

  /*
   * For all possible project creation parameters
   * @see http://help.workamajig.com/api-projects
   */
  list: workamajigMethod({
    method: 'GET',
    required: ['projectKey'],
  }),

  create: workamajigMethod({
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })

});
