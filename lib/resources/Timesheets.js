'use strict';

var WorkamajigResource = require('../WorkamajigResource');
var workamajigMethod = WorkamajigResource.method;
var utils = require('../utils');

/**
 * Parameters
 // timesheetKey: optional
 //       providing the id will only return one record
 // status: optional
 //       valid values are unsubmitted, submitted, rejected, approved   <NB: defaults to unsubmitted >
 // userKey: optional
 //       used to limit the result set to only one user
 // startdate: optional (mmddyyyy)
 //       the start date of the first time sheet returned.  Make sure single digit days are prefixed with a zero..
 // includeTime: optional
 //       boolean - set this to 1 if you want to get all of the time entries associated with this timesheet
 // includeService: optional
 //       boolean - set this to 1 if you want to get all of the service entries associated with this timesheet.
 */

module.exports = WorkamajigResource.extend({

  path: 'timesheets',

  includeBasic: [
    'list',
  ],

});
