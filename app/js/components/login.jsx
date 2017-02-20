'use strict';

var React = require('react/addons');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var Router = require('react-router');

var Mui = require('material-ui');

var TextField = Mui.TextField;
var RaisedButton = Mui.RaisedButton;
var Paper = Mui.Paper;

var auth = require('app/auth.js');

module.exports = React.createClass({
  displayName: 'Login',

  mixins: [Router.Navigation],

  getInitialState() {
    return {
      status: "IDOL",
      error: null
    };
  },

  componentWillMount() {
    if (auth.isAuthed) {
      this.goBack();
    }
  },

  login(e) {
    e.preventDefault();
    this.setState({
      status: "AUTHENTICATING"
    });
    var email = e.target[0].value.trim();
    var pass = e.target[1].value.trim();

    if (email === '' || pass === '') { return; }

    auth.authWithPassword(email, pass, (err, data) => {
      if (err) {
        console.log(err);
        this.setState({
          error: err.message,
          status: "IDOL"
        })
      } else {
        console.log(data);
        this.transitionTo("home");
      }
    });
  },

  dismiss() {
    this.setState({
      error: null
    });
  },

  render() {
    console.log(this.state);
    return (
      <div className="page login-page">
        <h2>Login Required</h2>
        <Paper zDepth={1}>
          <form id="login" className="login" onSubmit={this.login}>
            <p>
              <TextField type="email" name="email" hintText="Login email" />
            </p>
            <p>
              <TextField type="password" name="password" hintText="Password" />
            </p>
            <RaisedButton type="submit">
              <span className="mui-raised-button-label">
                {this.state.status === "IDOL" ? "Login" : "Authenticating..."}
              </span>
            </RaisedButton>
          </form>
          <ReactCSSTransitionGroup transitionName="message">
            { this.state.error && (
              <p
                key="message"
                className="message message-error"
                onClick={this.dismiss}>
                {this.state.error}
              </p>
            ) }
          </ReactCSSTransitionGroup>
        </Paper>
      </div>
    );
  }
})
