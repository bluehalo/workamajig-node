'use strict';

require('./testUtils');

var Error = require('../lib/Error');
var expect = require('chai').expect;

describe('Error', function() {
  it('Populates with type and message params', function() {
    var e = new Error('FooError', 'Foo happened');
    expect(e).to.have.property('type', 'FooError');
    expect(e).to.have.property('message', 'Foo happened');
    expect(e).to.have.property('stack');
  });

  describe('WorkamajigError', function() {
    it('Generates specific instance depending on error-type', function() {
      expect(Error.WorkamajigError.generate({type: 'authentication_error'}))
        .to.be.instanceOf(Error.WorkamajigAuthenticationError);
      expect(Error.WorkamajigError.generate({type: 'invalid_request_error'}))
        .to.be.instanceOf(Error.WorkamajigInvalidRequestError);
      expect(Error.WorkamajigError.generate({type: 'api_error'}))
        .to.be.instanceOf(Error.WorkamajigAPIError);
    });
  });
});
