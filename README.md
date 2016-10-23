# seneca-service-api

## Overview

This is a sample of a Web API entrypoint into a microservice ecosystem.  This is the Web API in which clients will interact with a domain's entire microservice architecture.  This was built using [Express](http://expressjs.com/) and [Seneca](http://senecajs.org/)

## Goals

1. **Conventions-based service routing:** Developers should never touch this codebase save for one-off custom routes or infrastructure changes, such as logging and monitoring
  * **Note**: Only applies for AMQP services
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

## Service Ecosystem Examples

* [seneca-amqp-service](https://github.com/ericnograles/seneca-amqp-service)
* [seneca-tcp-service](https://github.com/ericnograles/seneca-tcp-service)

## Developer's Note

While Seneca does support TCP and HTTP point-to-point microservices, I am of the opinion that a pure AMQP/message broker implementation is ideal for several reasons:

1. Allows for a purely dynamic, conventions based development flow. Developers can release services at will, and as long as it follows the Service API's conventions, the Service API will never have to be altered
1. AMQP and similar message brokers offers durability.  If messages fail, they can be retried at a later time.  This is great for "push style" integrations, such as social media firehoses.
  * AMQP in particular also offers features around guaranteed delivery and transactions. This is highly useful for many common "CRUD" type use cases.
1. Easier infrastructure integration.  With a point-to-point system, you have to deal potentially with firewall and security concerns.  AMQP is a standard port and is designed for high throughput.
1. Going point-to-point may also lead to unintended complexity.  In essence, developers might have to deal with things like durability and guaranteed delivery and "roll their own" solution vs. having it out of the box with a message broker.
1. While some developers are concerned with the "hops" between the API to the MQ to the Service and back, the latency introduced is minimal.  Observed response times at load for a baseline call hovered at around 150ms.

## Conventions

### Service Routes

* Anything sent to `/api/v1` will attempt to send to a service handling a specific role
  * Routes are only two deep (e.g. `/api/v1/twitter/tweets`)
  * The first part of the path will be mapped to the `role` of a Seneca microservice
  * The second part of the path will be mapped to the `cmd` of a Seneca microservice
  * If no second part is specified, the `cmd` is defaulted to `index`
  * **Example**: `/api/v1/twitter/tweets` = `role:twitter,cmd:tweets`
* Calls made to services that do not exist will get a 500 HTTP status code
* Calls made to commands in services that do not exist will get a 404 HTTP status code

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
  "method": "GET", // req.method
  "query": {
    // The contents of req.query
  }, 
  "data": {
    // The contents of req.body.data
  }
}
```

### Custom Routes

* Anything sent to `/api/custom` will be one-off routes. These can be internal calls to the Web API or perhaps specialized service calls

## TODO / Nice to Haves

1. Add [Winston](https://github.com/winstonjs/winston) logging
