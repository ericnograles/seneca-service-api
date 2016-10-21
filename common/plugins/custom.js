'use strict';

module.exports = function customRoutes() {
  var seneca = this;
  seneca.add('role:custom,cmd:*', (msg, done) => {
    done(null, {message: 'TODO: Implement custom route'})
  });
};