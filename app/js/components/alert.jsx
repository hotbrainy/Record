var React = require('react');
var _     = require('lodash');

var __alert = function(opts) {
  var openEvent = new CustomEvent("__alert:open", { detail: opts });
  window.dispatchEvent(openEvent);
  return __alert;
};

__alert.open = __alert.bind(this);

__alert.close = function(opts) {
  var closeEvent = new CustomEvent("__alert:close", {detail: opts});
  window.dispatchEvent(closeEvent);
  return __alert;
};

__alert.Alert = React.createClass({
  displayName: "alert",

  openAlert(e) {
    var options = _.defaults(e.detail, {
      title: "Notice",
      type: "alert",
      body: "",
      addtionalButtons: [],
      closeable: true,
      background: false,
      onOkay: () => {
        var closeEvent = new CustomEvent("__alert:close");
        window.dispatchEvent(closeEvent);
      }
    });
    this.setState
  },

  closeAlert(e) {

  },

  updateAlert(e) {

  },

  getInitialState() {
    return {
      open: false,
      options: null
    };
  },

  componentWillMount() {
    window.addEventListener("__alert:open", this.openAlert);
    window.addEventListener("__alert:close", this.closeAlert);
    window.addEventListener("__alert:update", this.updateAlert);
  },

  componentWillUnmount() {
    window.removeEventListener("__alert:open", this.openAlert);
    window.removeEventListener("__alert:close", this.closeAlert);
    window.removeEventListener("__alert:update", this.updateAlert);
  }, 

  render() { return (
    {this.state.open && (
      <div className="alert-modal">

      </div>
    )}
  )}
});

module.exports = __alert;
