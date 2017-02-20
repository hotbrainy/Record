'use strict';

var React = require('react');
var _ = require('lodash');

var ref = require('app/ref.js');

var Updater = require('app/components/updater.jsx');
var Create = require('app/components/create.jsx');

module.exports = React.createClass({
  displayName: 'Manage',

  getInitialState() {
    return {
      keys: []
    }
  },

  onValueChange: null,

  componentWillMount() {
    this.onValueChange = ref.child('products').on('value', (snap) => {
      this.setState({
        keys: _.keys(snap.val())
      });
    })
  },

  componentWillUnmount() {
    ref.child('products').off('value', this.onValueChange);
  },

  render() {
    return (
      <div className="manage-page page">
        <h2>Manage Inventory</h2>
        <Create />

        {this.state.keys.map( (k) => { return (
          <Updater key={k} id={k} />
        )})}
      </div>
    )
  }
})
