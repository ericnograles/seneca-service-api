'use strict';

module.exports = function serviceRoutes() {
  var seneca = this;

  seneca.add('role:service,cmd:*', (msg, done) => {
    // TODO: Why does .json not work from body parser?
    var body = JSON.parse(msg.args.body || "{}");
    var params = msg.args.params[0].split('/');

    if (params.length > 2) {
      done(null, {error: 'Unrecognized path'});
    } else {
      // Convention: the role is the first parameter, the command is the second
      // If there is no command specified, we send the payload to the "index" command of the role in question
      var role = params[0];
      var cmd = params.length > 1 ? params[1] : 'index';
      var pin = `role:${role},cmd:${cmd}`;

      var client = require('seneca')()
          .use('seneca-amqp-transport')
          .client({
            type: 'amqp',
            pin: pin,
            url: process.env.AMQP_URL || 'amqp://127.0.0.1'
          });

      client.act(pin, {
        method: msg.request$.method,
        query: msg.request$.query,
        data: body.data
      }, (err, res) => {
        // Warning: not doing a client.close() leaves the response queue hanging
        client.close();

        // FYI, done(err) will bring down the entire process, use with care
        if (err || res.error) {
          var statusCode;
          if (err) {
            statusCode = 500;
          } else {
            statusCode = res.statusCode;
          }

          // Set the proper status code for HTTP
          msg.response$.status(statusCode);
          done(null, {error: err || res.error});
        } else {
          done(null, res);
        }
      });
    }
  });
};