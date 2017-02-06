'use strict';

var WorkamajigResource = require('../WorkamajigResource');
var workamajigMethod = WorkamajigResource.method;
var utils = require('../utils');

module.exports = WorkamajigResource.extend({

  path: 'projects',

  includeBasic: [
    'list',
  ],

  /*
   * For all possible project creation parameters
   * @see http://help.workamajig.com/api-projects
   */
  create: workamajigMethod({
    method: 'POST',
    required: ['projectName']
  })

});
