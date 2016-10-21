'use strict';

module.exports = function serviceRoutes() {
  var seneca = this;

  seneca.add('role:service,cmd:*', (msg, done) => {
    // TODO: Why does .json not work from body parser?
    var body = JSON.parse(msg.args.body || "{}");
    var params = msg.args.params[0].split('/');

    if (params.length > 2) {
      msg.response$.status(500);
      done(null, {message: 'Unrecognized path'});
    } else {
      // Convention: the role is the first parameter, the command is the second
      // If there is no command specified, we send the payload to the "index" command of the role in question
      var role = params[0];
      var cmd = params.length > 1 ? params[1] : 'index';
      var pin = `role:${role},cmd:${cmd}`;
      var clientProtocol = msg.request$.query.protocol || 'amqp';
      var clientConfig = {
        pin: pin,
        type: clientProtocol
      };
      var clientLibrary = 'seneca-transport';

      if (clientProtocol === 'amqp') {
        clientConfig.url = process.env.AMQP_URL || 'amqp://127.0.0.1';
        clientLibrary = 'seneca-amqp-transport';
      } else if (clientProtocol === 'tcp') {
        var tcpConfigurations = require('../config/tcp');
        var key = role.toUpperCase();
        if (tcpConfigurations[key]) {
          clientConfig.host = tcpConfigurations[key].HOST;
          clientConfig.port = tcpConfigurations[key].PORT;
        } else {
          msg.response$.status(500);
          return done(null, {message: 'Unrecognized service call'});
        }
      }

      try {
        // Configure the client
        var client = require('seneca')()
          .use(clientLibrary)
          .client(clientConfig);

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
            var errorPayload = {};

            // Sanitized error outputs
            if (err) {
              errorPayload.message = err.msg;
            } else if (res.error) {
              errorPayload.message = res.error.message;
            }

            if (err) {
              statusCode = 500;
            } else {
              statusCode = res.statusCode;
            }

            // Set the proper status code for HTTP
            msg.response$.status(statusCode);
            done(null, errorPayload);
          } else {
            done(null, res);
          }
        });
      } catch (err) {
        msg.response$.status(500);
        done(null, err);
      }
    }
  });
};