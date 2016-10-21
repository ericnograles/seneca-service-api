'use strict';

var plugins = [
  // Below is an example of a generic handler for anything we expect to go to our microservice ecosystem
  {
    prefix: '/api/v1',
    pin: 'role:service,cmd:*',
    map: {
      '*': {
        GET: true,
        POST: true,
        DELETE: true,
        PUT: true
      }
    }
  },
  // Below is an example of a route that's contained within the API that might not go out to a microservice
  {
    prefix: '/api/custom',
    pin: 'role:custom,cmd:*',
    map: {
      '*': {
        GET: true,
        POST: true,
        DELETE: true,
        PUT: true
      }
    }
  },
];

module.exports = plugins;