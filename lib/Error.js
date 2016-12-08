'use strict';

var utils = require('./utils');

module.exports = _Error;

/**
 * Generic Error klass to wrap any errors returned by workamajig-node
 */
function _Error(raw) {
  this.populate.apply(this, arguments);
  this.stack = (new Error(this.message)).stack;
}

// Extend Native Error
_Error.prototype = Object.create(Error.prototype);

_Error.prototype.type = 'GenericError';
_Error.prototype.populate = function(type, message) {
  this.type = type;
  this.message = message;
};

_Error.extend = utils.protoExtend;

/**
 * Create subclass of internal Error klass
 * (Specifically for errors returned from Workamajig's REST API)
 */
var WorkamajigError = _Error.WorkamajigError = _Error.extend({
  type: 'WorkamajigError',
  populate: function(raw) {
    // Move from prototype def (so it appears in stringified obj)
    this.type = this.type;

    this.stack = (new Error(raw.message)).stack;
    this.rawType = raw.type;
    this.code = raw.code;
    this.param = raw.param;
    this.message = raw.message;
    this.detail = raw.detail;
    this.raw = raw;
    this.requestId = raw.requestId;
    this.statusCode = raw.statusCode;
  },
});

/**
 * Helper factory which takes raw workamajig errors and outputs wrapping instances
 */
WorkamajigError.generate = function(rawWorkamajigError) {
  switch (rawWorkamajigError.type) {
    case 'authentication_error':
      return new _Error.WorkamajigAuthenticationError(rawWorkamajigError.type);
    case 'invalid_request_error':
      return new _Error.WorkamajigInvalidRequestError(rawWorkamajigError.type);
    case 'api_error':
      return new _Error.WorkamajigAPIError(rawWorkamajigError.type);
  }
  return new _Error('Generic', rawWorkamajigError.type || 'Unknown Error');
};

// Specific Workamajig Error types:
_Error.WorkamajigInvalidRequestError = WorkamajigError.extend({type: 'WorkamajigInvalidRequestError'});
_Error.WorkamajigAPIError = WorkamajigError.extend({type: 'WorkamajigAPIError'});
_Error.WorkamajigAuthenticationError = WorkamajigError.extend({type: 'WorkamajigAuthenticationError'});
_Error.WorkamajigPermissionError = WorkamajigError.extend({type: 'WorkamajigPermissionError'});
_Error.WorkamajigRateLimitError = WorkamajigError.extend({type: 'WorkamajigRateLimitError'});
_Error.WorkamajigConnectionError = WorkamajigError.extend({type: 'WorkamajigConnectionError'});
