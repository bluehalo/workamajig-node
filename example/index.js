'use strict';

require('dotenv').config({path: 'config.env'});

var WORKAMAJIG_CONFIG = {
  host: process.env.WORKAMAJIG_CLIENT_URL,
  version: process.env.WORKAMAJIG_API_VERSION,
  accessToken: process.env.WORKAMAJIG_ACCESS_TOKEN,
  userToken: process.env.WORKAMAJIG_USER_TOKEN,
};

var workamajig = require('../lib/workamajig')(WORKAMAJIG_CONFIG);

var API_RESOURCE = 'projects';
var API_COMMAND = 'list';

var API_PARAMS = {};

workamajig[API_RESOURCE][API_COMMAND](API_PARAMS)
  .then(function(results) {
    console.log('Results: %j', results);
  })
  .catch(function(err) {
    console.error('Error: %o', err);
  });
