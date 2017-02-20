'use strict';

var ref = require('app/ref.js');
var cookieJar = require('lib/cookie.js');

ref.onAuth(function(data) {
  if (!data) {
    var e = new CustomEvent('authRequired');
    window.dispatchEvent(e);
  }
});

/**
 * Auth module
 * @param cb {Function} (authRequired, authData)
 **/

ref.onAuth( function(authData) {
  if (authData) {
    // login success
    console.log("AUTH SUCCESS", authData);
  } else {
    // no more auth
    console.log("AUTH REMOVED");
  }
});

var auth = function (cb) {
  // Check for auth in cookies
  if (cookieJar.hasItem('auth')) {
    // First check if the Firebase ref is already authed
    if (ref.getAuth()) { return auth.authNotRequired(cb); }

    console.log('hi');

    // Retreive the auth data from cookies and check the expiry
    let authData = JSON.parse(cookieJar.getItem('auth'));
    if (authData.expires < Date.now()) { return auth.authRequired(cb, 'Login Expired'); }

    // Check the token in Firebase
    ref.authWithCustomToken(authData.token, function(err, payload) {
      if (err) {
        return auth.authRequired(cb, err);
      } else {
        return auth.authNotRequired(cb);
      }
    });
  } else {
    return auth.authRequired(cb, 'Unauthenticated');
  }
}

Object.defineProperties(auth, {
  "isAuthed": {
    enumerable: true,
    set: function(val) {return !!val} // Force Boole value
  },
  "authNotRequired": {
    value: function(cb) {
      auth.isAuthed = true;
      var data = ref.getAuth();
      cb && cb(null, data);

      var e = new CustomEvent('authSuccess', {'detail': data});
      window.dispatchEvent(e);
    }
  },
  "authRequired": {
    value: function(cb, err) {
      if (!(err instanceof Error)) {
        err = new Error(err);
      }
      cb && cb(err);

      var e = new CustomEvent('authRequired', {'detail': err});
      window.dispatchEvent(e);
    }
  },
  "authWithPassword": {
    value: function(email, pass, cb) {
      ref.authWithPassword({email: email, password: pass}, function(err, data) {
        if (err) {
          cb && cb(err);

          let e = new CustomEvent('authFailed', {'detail': err});
          window.dispatchEvent(e);
        } else {
          // emit auth-success
          auth.isAuthed = true;
          cookieJar.setItem('auth',
                            JSON.stringify(data),
                            new Date(data.expires*1000),
                            '/');
          cb && cb(null, data);

          let e = new CustomEvent('authSuccess', {'detail': data});
          window.dispatchEvent(e);
        }
      })
    }
  }
});

module.exports = auth
