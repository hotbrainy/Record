'use strict';

var React = require('react');
var _     = require('lodash');
var num   = require('numeral');

var Mui = require('material-ui');
var Paper = Mui.Paper;
var DropDownMenu = Mui.DropDownMenu;
var RadioButtonGroup = Mui.RadioButtonGroup;
var RadioButton = Mui.RadioButton;
var TextField = Mui.TextField;
var RaisedButton = Mui.RaisedButton;

var ref = require('app/ref.js');
var STATUSES = require('app/constants.js').statuses;

module.exports = React.createClass({
  displayName: 'Product Updater',

  getInitialState() {
    return {};
  },

  onValueChange: null,
  firebaseValue: null,

  ref() { return ref.child(`products/${this.props.id}`) },

  componentWillMount() {
    this.onValueChange = this.ref().on('value', (snap) => {
      this.firebaseValue = snap.val();
      this.setState(snap.val());
    });
  },

  componentWillUnmount() {
    this.ref().off('value', this.onValueChange);
  },

  saveChanges() {
    var current = _.clone(this.firebaseValue);
    this.ref().update({
      status: this.state.status
    }, (err) => {
      if (err) {
        console.log('Update failed');
      } else {
        this.ref().child('changes').push({
          status: {
            newValue: this.state.status,
            prevValue: current.status
          },
          changedOn: (new Date()).toJSON(),
          changedBy: ref.getAuth().uid
        });
        var e = new CustomEvent('ValueUpdated', {'detail': {id: this.props.id}});
        window.dispatchEvent(e);
      }
    });
  },

  createTransaction(e) {
    e.preventDefault();
    var type = this.state.transactionType;
    var qty = Number(this.state.transactionQty);

    // Use to compare old data against changes
    var old = null;

    // TODO create some better validation
    // don't use JS confirm...

    if (confirm(
      `Are you sure you want to create transaction:
        ${type} ${num(qty).format('0,0')+' sq.ft.'}`
    )) {

      // Create a record of the transaction, and keep a reference of the ID
      var pushRef = ref.child('transactions').push()
      // then set the data for the transaction
      pushRef.set({
        type: type,
        qty: qty,
        user: ref.getAuth().uid,
        createdOn: (new Date()).toJSON(),
        product: this.props.id
      }, (err) => {

        if (err) {
          // TODO throw an event when there are errors like this...
          console.log(err);
        } else {

          // Update the data in the products data set
          this.ref().transaction( (current) => {
            old = _.clone(current);
            var newQty = current.qty + (type === "ADD" ? qty : -qty);
            current.qty = newQty;
            return current;
          }, (err, commited, snap) => {

            if (err) {
              // TODO throw an error event...
              console.log(err);
            } else {

              // Keep track of changes made to a product
              ref().child('changes').push({
                qty: {
                  newValue: snap.val().qty,
                  prevValue: old.qty
                },
                transaction: pushRef.key(),
                changedOn: (new Date()).toJSON(),
                changedBy: ref.getAuth().uid,
                product: this.props.id
              });
              this.toggleTransactionForm();
            }
          });
        }
      });
    }
  },

  statusUpdate(e) {
    this.setState({
      status: e.target.value
    });
  },

  _onChangeTransactionQty(e) {
    this.setState({ transactionQty: e.target.value });
  },
  _onChangeTransactionType(e, selected) {
    this.setState({ transactionType: selected });
  },
  toggleTransactionForm() {
    this.setState({ showTransactionForm: !this.state.showTransactionForm });
  },

  render() {
    return (
      !_.isEmpty(this.state) && (
        <div className="product-updater">
          <h3>{this.state.name} <small>{this.state.id}</small></h3>
          <div className="info">
            <div className="qty">
              <strong>Qty: </strong>
              {num(this.state.qty).format('0,0')+' sq.ft.'}
            </div>
            <div className="status">
              <strong>Status: </strong>
              <select value={this.state.status} onChange={this.statusUpdate}>
                {STATUSES.map( (s) => {
                  return (<option key={s} value={s}>{s}</option>)
                })}
              </select>
            </div>
          </div>
          <div className="controls">
            {!_.matches(this.firebaseValue)(this.state) && (
              <RaisedButton
                label="Save Changes"
                secondary={true}
                className="save"
                onClick={this.saveChanges} />
            )}
            <RaisedButton
              label={this.state.showTransactionForm ? "Cancel Transaction" : "+ Add a Transaction"}
              className="add-transaction"
              onClick={this.toggleTransactionForm} />
          </div>
          {this.state.showTransactionForm && (
            <Paper zDepth={1} className="transaction-form">
              <form onSubmit={this.createTransaction}>
                <label>Type: </label>
                <RadioButtonGroup
                  name="transactionType"
                  onChange={this._onChangeTransactionType}>
                  <RadioButton value="ADD" label="Add" />
                  <RadioButton value="REMOVE" label="Remove" />
                </RadioButtonGroup>
                <TextField
                  value={this.state.transactionQty}
                  onChange={this._onChangeTransactionQty}
                  hintText="0 (numbers only, no units)"
                  floatingLabelText="Quantity" />
                <p>
                  <RaisedButton
                    type="submit"
                    label="Create Transaction"
                    secondary={true} />
                </p>
              </form>
            </Paper>
          )}
        </div>
      )
    )
  }
});
