'use strict';

var React = require('react');
var _ = require('lodash');
var num = require('numeral');
var ref = require('app/ref.js');

module.exports = React.createClass({
  displayName: 'Home Page',

  getInitialState() {
    return {
      products: [],
      sort: "name",
      reverseSort: true
    };
  },

  onValueChange: null,

  componentWillMount() {
    this.onValueChange = ref.child("products").on("value", (snap) => {
      if (!this.isMounted()) return;
      this.setState({
        products: (_.isArray(snap.val()) ? snap.val() : _.values(snap.val()))
      });
    })
  },

  componentWillUnmount() {
    ref.child("products").off("value", this.onValueChange);
  },

  changeSort(sort) {
    if (sort === this.state.sort) {
      this.setState({
        reverseSort: !this.state.reverseSort
      });
    } else {
      this.setState({
        sort: sort
      });
    }
  },

  render() {
    var products = _(this.state.products)
      .sortByOrder([this.state.sort], [this.state.reverseSort])
      .map( (product) => {
        if (product.status in ['CURRENT', 'SPECIAL']) return;
        return (
          <tr className={`pr status-${product.status}`} key={product.name}>
            <th>
              <span className="product-name">{product.name}</span>
              <br />
              <small className="product-code">{product.id}</small>
            </th>
            <td>{Number(product.qty) == 0 ? '—' : num(product.qty).format('0,0')+' ft²'}</td>
          </tr>
        );
      })
      .compact()
      .value();

    return (
      <div className="page home-page">
        <h2>Inventory Overview</h2>
        {products.length === 0 && (<p>Loading inventory data...</p>)}
        {products.length > 0 && (
          <table className="sortable">
            <thead>
              <tr>
                <th
                  className={this.state.sort === 'name' ? 'active' : ''}
                  onClick={this.changeSort.bind(this, 'name')}>
                  Name
                </th>
                <th
                  className={this.state.sort === 'qty' ? 'active' : ''}
                  onClick={this.changeSort.bind(this, 'qty')}>
                  Sq.Ft.
                </th>
              </tr>
            </thead>
            <tbody>
              {products}
            </tbody>
          </table>
        )}
      </div>
    )
  }
});
