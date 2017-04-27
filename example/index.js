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
var API_COMMAND = 'create';
var API_PARAMS = {
    "projectName":"API Project Test 3",
    "client": "1",
    "startDate":"2017-03-05",
    "projectStatus":"EST"
   };

// workamajig[API_RESOURCE][API_COMMAND](API_PARAMS)
//   .then(function(results) {
//     console.log('Create Results: %j', results);
//     workamajig[API_RESOURCE].list({'projectKey':results.success[0].projectKey});
//   })
//   .catch(function(err) {
//     console.error('Error: %o', err);
//   });
workamajig[API_RESOURCE].list({projectKey:'aTVKSDh4c05sdDBZU205MlByWk1TZz090'})
  .then(function(results) {
    console.log('List Results: %j', results);
  })
  .catch(function(err) {
    console.error('Error: %o', err);
  });