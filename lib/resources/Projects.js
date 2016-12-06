'use strict';

var WorkamajigResource = require('../WorkamajigResource');
var workamajigMethod = WorkamajigResource.method;
var utils = require('../utils');

module.exports = WorkamajigResource.extend({

  path: 'projects',

  includeBasic: [
    'create', 'list', 'retrieve', 'update', 'del',
    'setMetadata', 'getMetadata',
  ],

  /**
   * Project: Task methods
   */
  createTask: workamajigMethod({
    method: 'POST',
    path: '/{projectId}/tasks',
    urlParams: ['projectId'],
  }),

});
