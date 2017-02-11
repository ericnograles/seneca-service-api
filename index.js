'use strict';

const Seneca = require('seneca');
const Express = require('express');
const Web = require('seneca-web');
const BodyParser = require('body-parser');
const Routes = require('./common/routes');
const APIPlugin = require('./plugins/api');
const UserPlugin = require('./plugins/user');

const app = Express();
app.use(BodyParser.json({ type: 'application/*json' }));
app.use(BodyParser.urlencoded({extended: true}));

// TODO: Add Passport support and point handler to our OAuth handler

const config = {
  routes: Routes,
  adapter: require('seneca-web-adapter-express'),
  context: app
};

const seneca = Seneca()
  .use(APIPlugin)
  .use(UserPlugin)
  .use(Web, config)
  .ready(() => {
    const server = seneca.export('web/context')();
    const port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`server started on: ${port}`);
    })
  });