'use strict';

const handleError = require('./common').handleError;

function UserPlugin() {
  var seneca = this;

  // Message handlers
  // TODO: Create a higher order function to wrap authenticated routes vs. non-authenticated routes
  seneca.add('role:user,version:*,cmd:*,method:*', noMatch);
  seneca.add('role:user,version:1.0.0,cmd:register,method:POST', register);

  function register(payload, done) {
    done(null, {
      firstName: payload.data.firstName,
      lastName: payload.data.lastName
    });
  }
  function noMatch(payload, done) {
    handleError(404, payload, 'Unknown service call', done);
  }
}

module.exports = UserPlugin;