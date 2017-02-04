'use strict';

module.exports = APIPlugin;

/**
 * The API Plugin is a conventions-based way to handle distributed architecture in Seneca.  It essentially is a catch-all route handler for
 * the 'api' route and has conventions on how to route commands to a microservice ecosystem.
 */
function APIPlugin() {
  const seneca = this;

  // Seneca pin matching to function handlers
  seneca.add('role:api,cmd:*', handleAPIRoutes);

  /**
   * The standard Seneca function for handling a pin match.  In this case, we match everything that gets passed to /api
   * @param msg
   * @param respond
   */
  function handleAPIRoutes(msg, respond) {
    // TODO: Why does .json not work from body-parser automatically?
    let body = JSON.parse(msg.args.body || "{}");
    let params = msg.args.params[0].split('/');

    if (params.length > 3 || params.length < 2) {
      handleError({message: 'Unsupported path'}, 500, msg, respond)
    } else {
      try {
        let pin = determinePin(params, msg.request$.method);
        let transport = determineTransport(msg, pin);

        // Configure the client
        let client;
        if (transport.clientProtocol !== 'local') {
          client = require('seneca')()
            .use(transport.clientLibrary)
            .client(transport.clientConfig);
        } else {
          // A call to a handler inside this process
          client = this;
        }

        // Two flags below ensure that timeouts (e.g. microservice is down on AMQP) do not bring down the API
        msg.fatal$ = false;
        client.fixedargs.fatal$ = false;

        client.act(pin, {
          query: msg.request$.query,
          headers: msg.request$.headers,
          data: body.data,

          // default$ is the payload Seneca will return if the pin provided isn't handled by anything
          default$: {message: 'Unknown path', pin: pin}
        }, (err, res) => {
          // Warning: not doing a client.close() leaves the response queue hanging
          if (transport.clientProtocol !== 'local') {
            client.close();
          }

          // FYI, respond(err) will bring down the entire process, use with care!
          if (err || res.error) {
            let statusCode = res.statusCode || 500;
            handleError(err || res.error, statusCode, msg, respond);
          } else {
            respond(null, res);
          }
        });
      } catch (err) {
        msg.response$.status(500);
        respond(null, err);
      }
    }
  }

  /**
   * The pin is the pattern that will be used to dispatch the Seneca command. Our convention is a Role, Version, Cmd, and Method.
   * @param params {Array} - The full route being invoked broken out to an array
   * @param method {String} - The HTTP method of the message being handled
   * @returns {Object}
   */
  function determinePin(params, method) {
    // Convention: the version is the first parameter, the role is the second parameter, the command is the third parameter
    // At a minimum, the path must be two deep, specifying a version and role.  If no role is specified in the path, we default to "index"
    // Finally, we also specify what method was passed in
    let version = params[0];
    let role = params[1];
    let cmd = params.length > 2 ? params[2] : 'index';
    return {
      role: role,
      version: version,
      cmd: cmd,
      method: method
    }
  }

  /**
   * We follow a specific convention for determining where the Seneca command will be dispatched.  By default, this API assumes that anything listening for
   * patterns will live in this same codebase (i.e. a monolith). However, a developer can override this by setting an 'x-service-protocol' header.
   * The understood values currently are tcp and amqp.
   *
   * If 'tcp' is passed, it is also expected that the developer specify the TCP configuration under ../common/config/tcp.
   *
   * If 'amqp' is passed, it is expected that the API is running with an AMQP_URL environment variable with a URI to a proper AMQP server, or it
   * defaults to the local instance of AMQP.
   *
   * @param msg {Object} - The original msg from Seneca
   * @param pin {Object} - The pin as provided by determinePin()
   * @returns {{clientLibrary: string, clientProtocol: (*|string), clientConfig: {pin: *, type: (*|string)}}}
   */
  function determineTransport(msg, pin) {
    let clientProtocol = msg.request$.headers['x-service-protocol'] || 'local';
    let clientConfig = {
      pin: pin,
      type: clientProtocol
    };
    let clientLibrary = 'seneca-transport';

    if (clientProtocol === 'amqp') {
      clientConfig.url = process.env.AMQP_URL || 'amqp://127.0.0.1';
      clientLibrary = 'seneca-amqp-transport';
    } else if (clientProtocol === 'tcp') {
      let tcpConfigurations = require('../common/config/tcp');
      let key = pin.role.toUpperCase();
      if (tcpConfigurations[key]) {
        clientConfig.host = tcpConfigurations[key].HOST;
        clientConfig.port = tcpConfigurations[key].PORT;
      } else {
        throw new Error('Unrecognized service call')
      }
    }

    return {
      clientLibrary,
      clientProtocol,
      clientConfig
    };
  }

  /**
   * handleError will sanitize an error output if it is detected.  It will also invalidate a user's JWT in our local
   * redis cache if a 401 is returned from any service interaction. Note that this might not apply to future service integrations
   * and may need refinement.
   * @param error
   * @param statusCode
   * @param msg
   * @param respond
   */
  function handleError(error, statusCode, msg, respond) {
    // Sanitized error outputs
    // .msg = Seneca Error
    // .message = Plugin error
    let errorPayload = {
      message: error.message || error.msg
    };

    msg.response$.status(statusCode);
    respond(null, errorPayload);
  }
}