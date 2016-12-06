'use strict';

// NOTE: testUtils should be require'd before anything else in each spec file!

require('mocha');
// Ensure we are using the 'as promised' libs before any tests are run:
require('chai').use(require('chai-as-promised'));

var utils = module.exports = {

  getUserWorkamajigKey: function() {
    var key = process.env.WORKAMAJIG_TEST_API_KEY || 'tGN0bIwXnHdwOa85VABjPdSn8nWY7G7I';

    return key;
  },

  getSpyableWorkamajig: function() {
    // Provide a testable workamajig instance
    // That is, with mock-requests built in and hookable

    var Workamajig = require('../lib/workamajig');
    var workamajigInstance = Workamajig('fakeAuthToken');

    workamajigInstance.REQUESTS = [];

    for (var i in workamajigInstance) {
      if (workamajigInstance[i] instanceof Workamajig.WorkamajigResource) {
        // Override each _request method so we can make the params
        // available to consuming tests (revealing requests made on
        // REQUESTS and LAST_REQUEST):
        workamajigInstance[i]._request = function(method, url, data, auth, options, cb) {
          var req = workamajigInstance.LAST_REQUEST = {
            method: method,
            url: url,
            data: data,
            headers: options.headers || {},
          };
          if (auth) {
            req.auth = auth;
          }
          workamajigInstance.REQUESTS.push(req);
          cb.call(this, null, {});
        };
      }
    }

    return workamajigInstance;
  },

  /**
   * A utility where cleanup functions can be registered to be called post-spec.
   * CleanupUtility will automatically register on the mocha afterEach hook,
   * ensuring its called after each descendent-describe block.
   */
  CleanupUtility: (function() {
    CleanupUtility.DEFAULT_TIMEOUT = 20000;

    function CleanupUtility(timeout) {
      var self = this;
      this._cleanupFns = [];
      this._workamajig = require('../lib/workamajig')(
        utils.getUserWorkamajigKey(),
        'latest'
      );
      afterEach(function(done) {
        this.timeout(timeout || CleanupUtility.DEFAULT_TIMEOUT);
        return self.doCleanup(done);
      });
    }

    CleanupUtility.prototype = {

      doCleanup: function(done) {
        var cleanups = this._cleanupFns;
        var total = cleanups.length;
        var completed = 0;
        for (var fn; fn = cleanups.shift();) {
          var promise = fn.call(this);
          if (!promise || !promise.then) {
            throw new Error('CleanupUtility expects cleanup functions to return promises!');
          }
          promise.then(function() {
            // cleanup successful
            ++completed;
            if (completed === total) {
              done();
            }
          }, function(err) {
            // not successful
            throw err;
          });
        }
        if (total === 0) {
          done();
        }
      },
      add: function(fn) {
        this._cleanupFns.push(fn);
      },
      deleteActivity: function(itemId) {
        this.add(function() {
          return this._workamajig.activities.del(itemId);
        });
      },
      deleteContact: function(itemId) {
        this.add(function() {
          return this._workamajig.contacts.del(itemId);
        });
      },
      deleteOpportunity: function(itemId) {
        this.add(function() {
          return this._workamajig.opportunities.del(itemId);
        });
      },
      deleteProject: function(itemId) {
        this.add(function() {
          return this._workamajig.projects.del(itemId);
        });
      },
      deleteTimesheet: function(itemId) {
        this.add(function() {
          return this._workamajig.timesheets.del(itemId);
        });
      },
      deleteTodo: function(itemId) {
        this.add(function() {
          return this._workamajig.todos.del(itemId);
        });
      },
      deleteZapier: function(itemId) {
        this.add(function() {
          return this._workamajig.zapier.del(itemId);
        });
      },
    };

    return CleanupUtility;
  }()),

};
