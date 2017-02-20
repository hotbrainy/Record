'use strict';

var React         = require('react');
var Router        = require('react-router');
var App           = require('app/components/app.jsx');
var Home          = require('app/components/home.jsx');
var Login         = require('app/components/login.jsx');
var Manage        = require('app/components/manage.jsx');

var Route         = Router.Route;
var DefaultRoute  = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var Redirect      = Router.Redirect;

var RedirectAll = React.createClass({
  displayName: 'Redirect All',
  render() {
    return (
      <Redirect to="home" />
    );
  }
});

module.exports = (
  <Route name="app" handler={App} path="/">
    <DefaultRoute handler={Home} name="home" />
    <NotFoundRoute handler={RedirectAll} />

    <Route name="login" handler={Login} path="/login/?" />
    <Route name="manage" handler={Manage} path="/manage/?" />
  </Route>
)
