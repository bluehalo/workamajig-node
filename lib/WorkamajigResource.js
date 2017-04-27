'use strict';

var request = require('request');
var objectAssign = require('object-assign');
var path = require('path');
var Promise = require('bluebird');

var utils = require('./utils');
var Error = require('./Error');

var hasOwn = {}.hasOwnProperty;

// Provide extension mechanism for Resource Sub-Classes
WorkamajigResource.extend = utils.protoExtend;

// Expose method-creator & prepared (basic) methods
WorkamajigResource.method = require('./WorkamajigMethod');
WorkamajigResource.BASIC_METHODS = require('./WorkamajigMethod.basic');

var jsonDataGenerator = require('./JsonDataGenerator');
/**
 * Encapsulates request logic for a Workamajig Resource
 */
function WorkamajigResource(workamajig, urlData) {
  this._workamajig = workamajig;
  this._urlData = urlData || {};

  this.basePath = utils.makeURLInterpolator(workamajig.getApiField('basePath'));
  this.path = utils.makeURLInterpolator(this.path);
  this.apiVersion = utils.makeURLInterpolator(workamajig.getApiField('version'));

  if (this.includeBasic) {
    this.includeBasic.forEach(function(methodName) {
      this[methodName] = WorkamajigResource.BASIC_METHODS[methodName];
    }, this);
  }

  this.initialize.apply(this, arguments);
}

WorkamajigResource.prototype = {

  path: '',

  initialize: function() {},

  // Function to override the default data processor. This allows full control
  // over how a WorkamajigResource's request data will get converted into an HTTP
  // body. This is useful for non-standard HTTP requests. The function should
  // take method name, data, and headers as arguments.
  requestDataProcessor: function(method, data, headers){
    data = data || {};

    if(method === 'POST') {
      return jsonDataGenerator(method, data, headers);
    }
    return data;
  },

  // String that overrides the base API endpoint. If `overrideHost` is not null
  // then all requests for a particular resource will be sent to a base API
  // endpoint as defined by `overrideHost`.
  overrideHost: null,

  createFullPath: function(commandPath, urlData) {
    return path.join(
      this.basePath(urlData),
      this.apiVersion(urlData),
      this.path(urlData),
      typeof commandPath == 'function' ?
        commandPath(urlData) : commandPath
    ).replace(/\\/g, '/'); // ugly workaround for Windows
  },

  createUrlData: function() {
    var urlData = {};
    // Merge in baseData
    for (var i in this._urlData) {
      if (hasOwn.call(this._urlData, i)) {
        urlData[i] = this._urlData[i];
      }
    }
    return urlData;
  },

  wrapTimeout: function(promise, callback) {
    if (callback) {
      // Ensure callback is called outside of promise stack.
      return promise.then(function(res) {
        setTimeout(function() { callback(null, res) }, 0);
      }, function(err) {
        setTimeout(function() { callback(err, null); }, 0);
      });
    }

    return promise;
  },

  _request: function(method, path, data, auth, options, callback) {
    var self = this;
    var requestData;

    if (self.requestDataProcessor) {
      requestData = self.requestDataProcessor(method, data, options.headers);
    } else {
      requestData = utils.stringifyRequestData(data || {});
    }

    var apiVersion = this._workamajig.getApiField('version');

    var headers = {
      'APIAccessToken': this._workamajig.getApiField('accessToken'),
      'UserToken': this._workamajig.getApiField('userToken'),
      'Accept': 'application/json',
      'User-Agent': 'Workamajig/NodeBindings/' + this._workamajig.getConstant('PACKAGE_VERSION'),
    };

    if (method === 'POST') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    if (apiVersion) {
      headers['Workamajig-Version'] = apiVersion;
    }

    // Grab client-user-agent before making the request:
    this._workamajig.getClientUserAgent(function(cua) {
      headers['X-Workamajig-Client-User-Agent'] = cua;

      if (options.headers) {
        objectAssign(headers, options.headers);
      }

      makeRequest();
    });

    function makeRequest() {
      console.log(self.overrideHost + "  looook   " + self._workamajig.getApiField('host'));
      var host = self.overrideHost || self._workamajig.getApiField('host');

      var requestConfig = {
        baseUrl: host,
        uri: path,
        method: method,
        agent: self._workamajig.getApiField('agent'),
        headers: headers,
        ciphers: 'DEFAULT:!aNULL:!eNULL:!LOW:!EXPORT:!SSLv2:!MD5',
      };
      debugger;
      if(method === 'POST'){
        requestConfig.body = requestData;
      } else {
        requestConfig.qs = requestData;
      }

      var req = request(requestConfig, function(err, resp, body) {
        if (err) {
          return callback(new Error.WorkamajigConnectionError({
              message: 'An error occurred with our connection to Workamajig',
              detail: err,
            })
          );
        }
        try {
          body = JSON.parse(body);
          if (resp.statusCode >= 400) {
            var wmjError;
            if (resp.statusCode === 401) {
              wmjError = new Error.WorkamajigAuthenticationError({type: body.description});
            } else if (resp.statusCode === 403) {
              wmjError = new Error.WorkamajigPermissionError({type: body.description});
            } else if (resp.statusCode === 429) {
              wmjError = new Error.WorkamajigRateLimitError({type: body.description});
            } else {
              wmjError = Error.WorkamajigError.generate({type: body.description});
            }
            return callback.call(self, wmjError, null);
          } else if(resp.statusCode == 207) {
            return callback.call(self, Error.WorkamajigError.generateMultiCodeError(body.errors));
          }
        } catch (e) {
          console.log(e);
          return callback.call(
            self,
            new Error.WorkamajigAPIError({
              message: 'Invalid JSON received from the Workamajig API',
              response: resp,
              exception: e,
            }),
            null
          );
        }
        callback.call(self, null, body);
      });
    }
  },

};

module.exports = WorkamajigResource;
