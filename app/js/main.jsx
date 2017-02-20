'use strict';

var React = require('react');
window.React = React;

var injectTapEventPlugin = require("react-tap-event-plugin");
    injectTapEventPlugin();

var Router = require('react-router');
var Routes = require('app/routes.jsx');

if (window.navigator.standalone) {
  document.body.classList.add('web-app');
}

Router.run(Routes, Router.HistoryLocation, function (Handler) {
  React.render( <Handler />, document.body);
});
