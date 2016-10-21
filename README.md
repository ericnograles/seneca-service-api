# lids-loyalty-main-api

## Overview

This is a sample of a Web API entrypoint into a microservice ecosystem.  This is the Web API in which clients will interact with a domain's entire microservice architecture.  This was built using [Express](http://expressjs.com/) and [Seneca](http://senecajs.org/)

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
1. The Web API will be served up on `localhost:3001` by default

## Goals

1. **Conventions-based service routing:** Developers should never touch this codebase save for one-off custom routes or infrastructure changes, such as logging and monitoring
1. **Standardized error handling**: Error payloads are well understood and can specify the HTTP status codes the Web API will return
1. **Service client agnosticism**: Services can be over any protocol, be it HTTP, TCP, AMQP, or any other type of transport.

## Conventions

### Service Routes

* Anything sent to `/api/v1` will attempt to send to a service handling a specific role
  * Routes are only two deep (e.g. `/api/v1/twitter/tweets`)
  * The first part of the path will be mapped to the `role` of a Seneca microservice
  * The second part of the path will be mapped to the `cmd` of a Seneca microservice
  * If no second part is specified, the `cmd` is defaulted to `index`
* For this version, it is assumed that all services will be listening via AMQP
* Calls made to services that do not exist will get a 500 HTTP status code
* Calls made to commands in services that do not exist will get a 404 HTTP status code

### Service Payloads

* For anything that had a body payload to be sent to a microservice (e.g. for a POST or PUT), the API expects it to be in the following structure when it is sent to the API

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
    // The contents of req.body
  }
}
```

### Custom Routes

* Anything sent to `/api/custom` will be one-off routes. These can be internal calls to the Web API or perhaps specialized service calls

## TODO / Nice to Haves

1. Develop a convention to switch the client for a service call. Perhaps utilize a query string?  e.g. `http://localhost:3001/api/v1/facebook/feed?client=tcp` can configure the client with a proper TCP Seneca client?
1. Add [Winston](https://github.com/winstonjs/winston) logging
