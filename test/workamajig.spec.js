'use strict';

var testUtils = require('./testUtils');
var Promise = require('bluebird');
var workamajig = require('../lib/workamajig')(
  testUtils.getUserWorkamajigKey(),
  'latest'
);

var expect = require('chai').expect;

var exp_year = new Date().getFullYear() + 1;

var PROJECT_DETAILS = {
  description: 'Some project',
};

describe('Workamajig Module', function() {
  var cleanup = new testUtils.CleanupUtility();
  this.timeout(20000);

  describe('GetClientUserAgent', function() {
    it('Should return a user-agent serialized JSON object', function() {
      return expect(new Promise(function(resolve, reject) {
        workamajig.getClientUserAgent(function(c) {
          resolve(JSON.parse(c));
        });
      })).to.eventually.have.property('lang', 'node');
    });
  });

  describe('GetClientUserAgentSeeded', function() {
    it('Should return a user-agent serialized JSON object', function() {
      var userAgent = {lang: 'node'};
      var d = Promise.defer();
      workamajig.getClientUserAgentSeeded(userAgent, function(c) {
        d.resolve(JSON.parse(c));
      });
      return expect(d.promise).to.eventually.have.property('lang', 'node');
    });

    it('Should URI-encode user-agent fields', function() {
      var userAgent = {lang: 'ï'};
      var d = Promise.defer();
      workamajig.getClientUserAgentSeeded(userAgent, function(c) {
        d.resolve(JSON.parse(c));
      });
      return expect(d.promise).to.eventually.have.property('lang', '%C3%AF');
    })
  });

  describe('setTimeout', function() {
    it('Should define a default equal to the node default', function() {
      expect(workamajig.getApiField('timeout')).to.equal(require('http').createServer().timeout);
    });
    it('Should allow me to set a custom timeout', function() {
      workamajig.setTimeout(900);
      expect(workamajig.getApiField('timeout')).to.equal(900);
    });
    it('Should allow me to set null, to reset to the default', function() {
      workamajig.setTimeout(null);
      expect(workamajig.getApiField('timeout')).to.equal(require('http').createServer().timeout);
    });
  });

  describe('Callback support', function() {
    describe('Any given endpoint', function() {
      it('Will call a callback if successful', function() {
        return expect(new Promise(function(resolve, reject) {
          workamajig.projects.create({
            description: 'Some project'
          }, function(err, project) {
            console.log('PROJECT: %o', project);
            cleanup.deleteProject(project.id);
            resolve('Called!');
          });
        })).to.eventually.equal('Called!');
      });

      it('Will expose HTTP response object', function() {
        return expect(new Promise(function(resolve, reject) {
          workamajig.projects.create({
            description: 'Some project'
          }, function(err, project) {
            cleanup.deleteProject(project.id);
            var headers = project.lastResponse.headers;
            expect(headers).to.contain.keys('request-id');
            resolve('Called!');
          });
        })).to.eventually.equal('Called!');
      });

      it('Given an error the callback will receive it', function() {
        return expect(new Promise(function(resolve, reject) {
          workamajig.projects.createTask('nonExistentProjectId', {task: {}}, function(err, project) {
            if (err) {
              resolve('ErrorWasPassed');
            } else {
              reject('NoErrorPassed');
            }
          });
        })).to.eventually.become('ErrorWasPassed');
      });
    });
  });
});