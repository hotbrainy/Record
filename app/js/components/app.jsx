'use strict';

var React = require('react');
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;
var Header = require('app/components/header.jsx');

var auth = require('app/auth.js');
var ref = require('app/ref.js');

module.exports = React.createClass({
  displayName: 'App',

  mixins: [Router.Navigation],

  getInitialState() {
    return {
      auth: null,
      user: null
    };
  },

  componentDidMount() {
    window.addEventListener('authSuccess', (e) => {
      if (this.state.auth) { return; }
      ref.child(`users/${e.detail.uid}`).on('value', (snap) => {
        this.setState({
          auth: true,
          user: snap.val()
        });
      });
      ref.child(`users/${e.detail.uid}/lastLogin`).set((new Date).toJSON());
    });
    window.addEventListener('authRequired', (e) => {
      this.setState({
        auth: false,
        user: null
      }, this.transitionTo('login'));
    });

    // Initialze authentication
    auth();
  },

  render() {
    return (
      <main className="frame">
        <Header user={this.state.user} />
        <div className="app">
          <RouteHandler />
        </div>
      </main>
    )
  }
});
