'use strict';

var Promise = require('bluebird');
var isPlainObject = require('lodash.isplainobject');
var workamajigMethod = require('./WorkamajigMethod');
var utils = require('./utils');

module.exports = {

  create: workamajigMethod({
    method: 'POST',
  }),

  list: workamajigMethod({
    method: 'GET',
  }),

  retrieve: workamajigMethod({
    method: 'GET',
    path: '/{id}',
    urlParams: ['id'],
  }),

  update: workamajigMethod({
    method: 'POST',
    path: '{id}',
    urlParams: ['id'],
  }),

  // Avoid 'delete' keyword in JS
  del: workamajigMethod({
    method: 'DELETE',
    path: '{id}',
    urlParams: ['id'],
  }),

};
