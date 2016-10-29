'use strict';

module.exports = function apiPlugin() {
  var seneca = this;

  seneca.add('role:api,cmd:*', (msg, done) => {
    // TODO: Why does .json not work from body parser?
    var body = JSON.parse(msg.args.body || "{}");
    var params = msg.args.params[0].split('/');

    if (params.length > 3) {
      msg.response$.status(500);
      done(null, {message: 'Unsupported path'});
    } else {
      // Convention: the version is the first parameter, the role is the second parameter, the command is the third parameter
      // At a minimum, the path must be two deep, specifying a version and role.  If no role is specified in the path, we default to "index"
      // Finally, we also specify what method was passed in
      var version = params[0];
      var role = params[1];
      var cmd = params.length > 2 ? params[2] : 'index';
      var method = msg.request$.method;
      var pin = `role:${role},version:${version},cmd:${cmd},method:${method}`;

      var clientProtocol = msg.request$.headers['x-service-protocol'] || 'local';
      var clientConfig = {
        pin: pin
      };
      var clientLibrary = 'seneca-transport';

      if (clientProtocol === 'amqp') {
        clientConfig.type = 'amqp';
        clientConfig.url = process.env.AMQP_URL || 'amqp://127.0.0.1';
        clientLibrary = 'seneca-amqp-transport';
      } else if (clientProtocol === 'tcp') {
        var tcpConfigurations = require('../common/config/tcp');
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
        var client;
        if (clientProtocol !== 'local') {
          client = require('seneca')()
            .use(clientLibrary)
            .client(clientConfig);
        } else {
          // A call to a handler inside this process
          client = this;
        }

        client.act(pin, {
          query: msg.request$.query,
          headers: msg.request$.headers,
          data: body.data
        }, (err, res) => {
          // Warning: not doing a client.close() leaves the response queue hanging
          if (clientProtocol !== 'local') {
            client.close();
          }

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