'use strict';

var routes = [
  // Below is an example of a generic handler for anything we expect to go to our microservice ecosystem
  {
    prefix: '/api',
    pin: 'role:api,cmd:*',
    map: {
      '*': {
        GET: true,
        POST: true,
        DELETE: true,
        PUT: true
      }
    }
  }
];

module.exports = routes;