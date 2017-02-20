'use strict';

var React = require('react/addons');
var _     = require('lodash');
var num   = require('numeral');
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

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
  displayName: 'Add Product',

  statusMenuItems: ( () => {
    return STATUSES.map( (s) => {
      return {payload: s, text: s}
    });
  })(),

  getInitialState() {
    return {
      showAddProductForm: false,
      status: STATUSES[0],
      action: 'IDOL'
    }
  },

  toggleAddProductForm() {
    this.setState({
      showAddProductForm: !this.state.showAddProductForm
    })
  },
  _onChangeName(e) {
    this.setState({ name: e.target.value });
  },
  _onChangeProductCode(e) {
    this.setState({ productCode: e.target.value.trim() });
  },
  _onChangeStatus(e, index, menuItem) {
    this.setState({ status: menuItem.payload });
  },
  _onChangeQty(e) {
    this.setState({ qty: e.target.value });
  },

  createNew(e) {
    e.preventDefault();
    this.setState({
      action: 'SAVING'
    });
    var id = this.state.productCode;
    var name = this.state.name.trim();
    var status = this.state.status;
    if (this.state.qty) {
      var qty = Number(this.state.qty);
    } else {
      var qty = 0;
    }
    ref.child(`products/${id}`).transaction( (current) => {
      if (current === null) {
        return {
          id: id,
          name: name,
          status: status,
          createdOn: (new Date).toJSON(),
          qty: qty,
          createdBy: ref.getAuth().uid
        };
      } else {
        let err = new Error('Product code already exists')
        err.code = 'ID_TAKEN';
        this.onError(err);
        return;
      }
    }, (error, committed, snapshot) => {
      if (error) {
        this.onError(error);
      } else if (!committed) {
        // id taken
      } else {
        this.onSuccess(snapshot.val());
      }
    });
  },

  onSuccess(val) {
    console.log(val);
    e = new CustomEvent('message', {
      detail: {
        type: 'success', 
        payload: val
      }
    });
    window.dispatchEvent(e);
    this.setState({
      action: 'IDOL',
      showAddProductForm: false
    });
  },

  onError(err) {
    console.log(err);
  },

  render() {
    return (
      <div className="add-product">
        <RaisedButton
          label={this.state.showAddProductForm ? 'Cancel' : '+ Add Product'}
          onClick={this.toggleAddProductForm} />
        <ReactCSSTransitionGroup transitionName="slide-in">
          { this.state.showAddProductForm && (
            <div key="add-form">
              <Paper zDepth={1} className="paper-container">
                <form onSubmit={this.createNew}>
                  <h3>Add New Product</h3>
                  <div>
                    <TextField
                      value={this.state.name}
                      onChange={this._onChangeName}
                      hintText="Full Product Name"
                      floatingLabelText="Product Name" />
                  </div>
                  <div>
                    <TextField
                      value={this.state.productCode}
                      onChange={this._onChangeProductCode}
                      hintText="UC-00000 (no spaces)"
                      floatingLabelText="Product Code" />
                  </div>
                  <div>
                    <TextField
                      value={this.state.qty}
                      onChange={this._onChangeQty}
                      hintText="0 (optional - numbers only, no units)"
                      floatingLabelText="Quantity" />
                  </div>
                  <div>
                    <label>Status: </label>
                    <DropDownMenu
                      onChange={this._onChangeStatus}
                      menuItems={this.statusMenuItems} />
                  </div>
                  <p>
                    <RaisedButton
                      secondary={true}
                      type="submit"
                      label="Save New Product +" />
                  </p>
                </form>
              </Paper>
            </div>
          ) }
        </ReactCSSTransitionGroup>
      </div>
    )
  }
})
