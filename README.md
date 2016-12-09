##A Node Request-based API wrapper for the Workamajig API

###Installation
```
npm install workamajig --save
```

###Documentation

See http://help.workamajig.com/api-overview for API documentation.

###Configuration

Pass in a config object with the required params:
```
var workamajig = require('workamajig')({
  accessToken: WORKAMAJIG_ACCESS_TOKEN,
  userToken  : WORKAMAJIG_USER_TOKEN,
  subdomain  : WORKAMAJIG_API_BASE_URL,
  apiVersion : WORKAMAJIG_API_VERSION
});
```

###API Overview

Every resource is accessed via your workamajig instance:
```
// workamajig.{ RESOURCE_NAME }.{ METHOD_NAME }
```

Every resource method accepts an optional callback as the last argument:
```
workamajig.projects.create(
  { someFoo: 'bar' },
  function(err, project) {
      err; // null if no error occurred
      project; // the created project object
  }
);
```

Additionally, every resource method returns a promise, so you don't have to use the regular callback, E.g.
```
// Create a new project and then a new task for that project:
workamajig.projects.create({
  someFoo: 'bar'
  }).then(function(project) {
    workamajig.task.create(project.id, {
      someTask: 'taskFoo'
    });
  }).then(function(task) {
    // Task created on the project
  }).catch(function(err){
    // Handle some error
  });
```

###Available resources & methods

Where you see ```params``` it is a plain JavaScript object, e.g. ```{ someFoo: 'bar' }```

- activities
- contacts
- opportunities
- projects
- services
- tasks
- timesheets
- todos
- users

###Development

Run all tests:
```
$ npm install
$ npm test
```

Run a single test suite:
```
$ npm run mocha -- test/Error.spec.js
```
