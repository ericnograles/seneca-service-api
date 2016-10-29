# seneca-service-api

## Overview

This is a Web API entrypoint into a microservice ecosystem. This is the Web API in which clients will interact with a domain's entire microservice architecture.  This was built using [Express](http://expressjs.com/) and [Seneca](http://senecajs.org/)

## Goals

1. **Conventions-based service routing:** Developers should never touch this codebase save for one-off custom routes or infrastructure changes, such as logging and monitoring
  * **Note**: Only applies for AMQP services. Services handlers defined right in the API requires code changes.
1. **Standardized error handling**: Error payloads are well understood and can specify the HTTP status codes the Web API will return
1. **Service client agnosticism**: Services can be over any protocol, be it HTTP, TCP, AMQP, or any other type of transport.

## Prerequisites

1. [RabbitMQ](https://www.rabbitmq.com/install-homebrew.html)
1. [Node Version Manager](https://github.com/creationix/nvm)
1. [Yarn](https://yarnpkg.com/)
1. `nvm install 6.9.0`
1. `nvm alias default 6.9.0`

## Installation

1. Clone this repo
1. `yarn install`
1. `npm start`
1. The Web API will be served up the port specified by the `PORT` environment variable, or on port 3001

## Conventions

### Service Routes

* The base route is `/api`
* Routes are, at a minimum, expected to be two deep after the base (e.g. `/api/v1/user`)
  * The first part of the path will be mapped to the `version` of a Seneca service
  * The second part of the path will be mapped to the `role` of a Seneca microservice
  * (Optional) The third part of the path will be mapped to the `cmd` of a Seneca microservice
    * If none is specified, the `cmd` is defaulted to `index`
  * The `method` is also passed in as part of what a service listens to. This corresponds with the `req.method` that Express evaluates.
* A call to this API expects a header value assigned to the `x-service-protocol` header.  This indicates to the API what transport the service is listening on
  * Valid Values 
    * `local`: A service listening on the API itself, like a traditional "monolithic" Web API
    * `tcp`:  A service listening over TCP. 
      * If you create a service in this manner, the Web API will look for a configuration literal for the `role` specified in the route under `/common/config/tcp.js`
        * e.g. If you define a TCP service that listens for role `facebook` for version `v1`, it corresponds to an API call of `/api/v1/facebook`
    * `amqp`: A service listening over an AMQP message broker, such as RabbitMQ. 
      * If you create a service in this manner, the Web API will attempt to connect to the message brokeer using the `AMQP_URL` environment variable. Otherwise, it defaults to `amqp://127.0.0.1`
      * The same routing convention above applies.  Specify the proper `role` and optional `cmd` in your AMQP service to handle the route you desire
* Calls made to services that do not exist will get a 500 HTTP status code
* Calls made to commands in services that do not exist will get a 404 HTTP status code

### Important Note About Version Scheme

* Note that Seneca AMQP services do not seem to work with versions using a dot notation (e.g. 1.0.0 or v1.0.0), so it is recommended that the version scheme be in sequential whole number
  * I have an [Issue to seneca-amqp-transport](https://github.com/senecajs/seneca-amqp-transport/issues/66) open to investigate as of 10/29/16

### Service Payloads

* For anything that had a body payload to be sent to a microservice (e.g. for a POST or PUT), the API expects it to be in the following structure when it is sent to the API (i.e. `req.body` in Express)

```javascript
{
  "data": {
    // This literal should store anything that the microservice will need
  }
}
```

* The standard payload to be sent to microservices will be as follows

```javascript
{
  "query": {
    // The contents of req.query
  }, 
  "headers": {
    // The contents of req.headers  
  },
  "data": {
    // The contents of req.body.data
  }
}
```

## TODO / Nice to Haves

1. Add [Winston](https://github.com/winstonjs/winston) logging
