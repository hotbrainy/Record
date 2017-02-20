'use strict';

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var Mui = require('material-ui');
var FlatButton = Mui.FlatButton;

var ref = require('app/ref.js');

/**
 * This is a controlled component
 * Updates are pass down thought props from app.jsx
 */

module.exports = React.createClass({
  displayName: 'Header',

  menu() {
    if (!this.props.user) { return []; }
    var _menu = [
      {to: 'home', name: '🏠'},
    ];
    if (this.props.user.admin || this.props.user.editor) {
      _menu.push({to: 'manage', name: '📝'});
    }
    return _menu;
  },

  logout() {
    ref.unauth();
  },

  render() {
    return (
      <header>
        {window.navigator.standalone && (<div  className="status-bar" />)}
        <div className="topbar">
          {!this.props.user && (
            <h2 className="loading">Authenticating...</h2>
          )}
          <nav>
            <ul>
              {this.menu().map( (m) => { return (
                <li key={m.name}>
                  <Link to={m.to}>
                    <FlatButton>{m.name}</FlatButton>
                  </Link>
                </li>
              ) })}
              {this.props.user && (
                <li className="logout">
                  <FlatButton
                    onClick={this.logout}>
                    🚫
                  </FlatButton>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    )
  }
});
