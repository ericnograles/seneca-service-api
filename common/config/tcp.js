// This file contains all configuration for TCP-based services in the ecosystem
// Note that going with a non-AMQP based microservice ecosystem removes the "dynamic" capability of AMQP.
// That is, everytime you add a service via TCP, you also must add config here.
// With AMQP, you can spin up services at will and not worry about modifying the service-api, as it is run by convention

const TCP_CONFIG = {
  FACEBOOK: {
    HOST: '0.0.0.0', // i.e. a local TCP service,
    PORT: 30301
  }
};

module.exports = TCP_CONFIG;