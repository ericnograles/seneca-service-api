'use strict';

var Seneca = require('seneca');
var Express = require('express');
var Web = require('seneca-web');
var BodyParser = require('body-parser');
var Routes = require('./common/routes');
var APIPlugin = require('./plugins/api');
var UserPlugin = require('./plugins/user');

var app = Express();
app.use(BodyParser.json({ type: 'application/*json' }));
app.use(BodyParser.urlencoded({extended: true}));

// TODO: Add Passport support and point handler to our OAuth handler

var config = {
  routes: Routes,
  adapter: require('seneca-web-adapter-express'),
  context: app
};

var seneca = Seneca()
  .use(APIPlugin)
  .use(UserPlugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')();
    var port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`server started on: ${port}`);
    })
  });