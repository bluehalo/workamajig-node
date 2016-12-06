'use strict';

var http = require('http');
var https = require('https');
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

/**
 * Encapsulates request logic for a Workamajig Resource
 */
function WorkamajigResource(workamajig, urlData) {
  this._workamajig = workamajig;
  this._urlData = urlData || {};

  this.basePath = utils.makeURLInterpolator(workamajig.getApiField('basePath'));
  this.path = utils.makeURLInterpolator(this.path);

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
  requestDataProcessor: null,

  // String that overrides the base API endpoint. If `overrideHost` is not null
  // then all requests for a particular resource will be sent to a base API
  // endpoint as defined by `overrideHost`.
  overrideHost: null,

  createFullPath: function(commandPath, urlData) {
    return path.join(
      this.basePath(urlData),
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

  _timeoutHandler: function(timeout, req, callback) {
    var self = this;
    return function() {
      var timeoutErr = new Error('ETIMEDOUT');
      timeoutErr.code = 'ETIMEDOUT';

      req._isAborted = true;
      req.abort();

      callback.call(
        self,
        new Error.WorkamajigConnectionError({
          message: 'Request aborted due to timeout being reached (' + timeout + 'ms)',
          detail: timeoutErr,
        }),
        null
      );
    }
  },

  _responseHandler: function(req, callback) {
    var self = this;
    return function(res) {
      var response = '';

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        response += chunk;
      });
      res.on('end', function() {
        var headers = res.headers || {};

        try {
          response = JSON.parse(response);
          if (response.error) {
            var err;

            response.error.statusCode = res.statusCode;
            response.error.requestId = headers['request-id'];

            if (res.statusCode === 401) {
              err = new Error.WorkamajigAuthenticationError(response.error);
            } else if (res.statusCode === 403) {
              err = new Error.WorkamajigPermissionError(response.error);
            } else if (res.statusCode === 429) {
              err = new Error.WorkamajigRateLimitError(response.error);
            } else {
              err = Error.WorkamajigError.generate(response.error);
            }
            return callback.call(self, err, null);
          }
        } catch (e) {
          return callback.call(
            self,
            new Error.WorkamajigAPIError({
              message: 'Invalid JSON received from the Workamajig API',
              response: response,
              exception: e,
              requestId: headers['request-id'],
            }),
            null
          );
        }
        // Expose res object
        Object.defineProperty(response, 'lastResponse', {
          enumerable: false,
          writable: false,
          value: res,
        });
        callback.call(self, null, response);
      });
    };
  },

  _errorHandler: function(req, callback) {
    var self = this;
    return function(error) {
      if (req._isAborted) {
        // already handled
        return;
      }
      callback.call(
        self,
        new Error.WorkamajigConnectionError({
          message: 'An error occurred with our connection to Workamajig',
          detail: error,
        }),
        null
      );
    }
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
      // Use specified auth token or use default from this workamajig instance:
      'Authorization': auth ?
        'Basic ' + new Buffer(auth + ':').toString('base64') :
        this._workamajig.getApiField('auth'),
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': requestData.length,
      'User-Agent': 'Workamajig/v1 NodeBindings/' + this._workamajig.getConstant('PACKAGE_VERSION'),
    };

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
      var timeout = self._workamajig.getApiField('timeout');
      var isInsecureConnection = self._workamajig.getApiField('protocol') == 'http';

      var host = self.overrideHost || self._workamajig.getApiField('host');

      var req = (
        isInsecureConnection ? http : https
      ).request({
        host: host,
        port: self._workamajig.getApiField('port'),
        path: path,
        method: method,
        agent: self._workamajig.getApiField('agent'),
        headers: headers,
        ciphers: 'DEFAULT:!aNULL:!eNULL:!LOW:!EXPORT:!SSLv2:!MD5',
      });

      req.setTimeout(timeout, self._timeoutHandler(timeout, req, callback));
      req.on('response', self._responseHandler(req, callback));
      req.on('error', self._errorHandler(req, callback));

      req.on('socket', function(socket) {
        socket.on((isInsecureConnection ? 'connect' : 'secureConnect'), function() {
          // Send payload; we're safe:
          req.write(requestData);
          req.end();
        });
      });
    }
  },

};

module.exports = WorkamajigResource;
