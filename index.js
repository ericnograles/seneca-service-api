'use strict';

var Seneca = require('seneca');
var Express = require('express');
var Web = require('seneca-web');
var BodyParser = require('body-parser');
var Routes = require('./common/routes');
var ServicePlugin = require('./common/plugins/service');
var CustomPlugin = require('./common/plugins/custom');

var app = Express();
app.use(BodyParser.json({ type: 'application/*json' }));
app.use(BodyParser.urlencoded({extended: true}));

var config = {
  routes: Routes,
  adapter: require('seneca-web-adapter-express'),
  context: app
};

var seneca = Seneca()
  .use(ServicePlugin)
  .use(CustomPlugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')();
    var port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`server started on: ${port}`);
    })
  });