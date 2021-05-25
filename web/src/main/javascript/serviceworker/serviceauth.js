// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceAuth');

goog.require('five.BaseAuth');
goog.require('goog.log');


/**
 * Service calendar api wrapper. Communicates with the service worker client
 * @constructor
 * @extends {five.BaseAuth}
 */
five.ServiceAuth = function() {
  goog.base(this);

  /** @type {string} */
  this.authorizationHeaderValue_;

  /** @type {!goog.async.Deferred} */
  this.authDeferred_ = new goog.async.Deferred();

  /** @type {MessagePort} */
  this.clientPort_;

  /** @type {goog.async.Deferred} */
  this.dbDeferred_;
};
goog.inherits(five.ServiceAuth, five.BaseAuth);

/** @type {!string} */
five.ServiceAuth.RPC_NAME_KEY = 'rpcName';

/** @type {!string} */
five.ServiceAuth.RPC_REQUEST_KEY = 'rpcRequest';

/** @type {!string} */
five.ServiceAuth.RPC_REGISTER = 'register';

/** @type {!string} */
five.ServiceAuth.RPC_AUTHORIZATION_CHANGED = 'authorizationChanged';

/** @type {!string} */
five.ServiceAuth.RPC_RESTART = 'restart';

/** @type {!string} */
five.ServiceAuth.DB_NAME_ = 'auth';

/** @type {!string} */
five.ServiceAuth.AUTH_DB_STORE_NAME_ = 'auth';

/** @type {!string} */
five.ServiceAuth.AUTHORIZATION_HEADER_VALUE_KEY = 'authorizationHeader';

/** @type {goog.log.Logger} */
five.ServiceAuth.prototype.logger_ = goog.log.getLogger(
    'five.ServiceAuth');

five.ServiceAuth.prototype.start = function() {
  goog.asserts.assert(!this.authDeferred_.hasFired());
  this.getDb_()
    .addCallback(db => {
      db.createTransaction([five.ServiceAuth.AUTH_DB_STORE_NAME_])
        .objectStore(five.ServiceAuth.AUTH_DB_STORE_NAME_)
        .get(five.ServiceAuth.AUTHORIZATION_HEADER_VALUE_KEY)
        .addCallback(value => {
          if (value) {
            this.authorizationHeaderValue_ = value;
            this.authDeferred_.callback(null);
          } else {
            this.authDeferred_.errback(Error('No cached auth header available'));
          }
        })
        .addErrback(function(err) {
          this.authDeferred_.errback(err);
        });
    })
    .addErrback(err => {
      this.authDeferred_.errback(err);
    });
};

/** @param {!goog.events.BrowserEvent} e */
five.ServiceAuth.prototype.handleMessage = function(e) {
  var event = e.getBrowserEvent();
  var rpcName = event.data[five.ServiceAuth.RPC_NAME_KEY];
  if (rpcName == five.ServiceAuth.RPC_AUTHORIZATION_CHANGED) {
    this.handleAuthorizationChangedMessage_(event);
  } else if (rpcName == five.ServiceAuth.RPC_REGISTER) {
    this.clientPort_ = event.ports[0];
  } else {
    throw Error('Unexpected message ' + event);
  }
};

/** @param {Event} event */
five.ServiceAuth.prototype.handleAuthorizationChangedMessage_ = function(event) {
  this.authorizationHeaderValue_ = event.data[five.ServiceAuth.RPC_REQUEST_KEY];
  if (!this.authDeferred_.hasFired()) {
    this.authDeferred_.callback(null);
  }
  this.getDb_().addCallback(db => {
    var putTx = db.createTransaction(
      [five.ServiceAuth.AUTH_DB_STORE_NAME_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(five.ServiceAuth.AUTH_DB_STORE_NAME_);
    store.put(this.authorizationHeaderValue_, five.ServiceAuth.AUTHORIZATION_HEADER_VALUE_KEY);
    putTx.wait()
      .addErrback(err => {
        this.logger_.severe('Failed to store auth header: ' + err, err);
      });
  });
};

/** @override */
five.ServiceAuth.prototype.restart = function() {
  if (!this.clientPort_) {
    this.logger_.severe('Cannot restart auth: no client registered');
    return;
  }

  if (!this.authDeferred_.hasFired()) {
    return;
  }
  this.authDeferred_ = new goog.async.Deferred();
  var message = {};
  message[five.ServiceAuth.RPC_NAME_KEY] = five.ServiceAuth.RPC_RESTART;
  this.clientPort_.postMessage(message);
};

/** @override */
five.ServiceAuth.prototype.isTokenValid = function() {
  return true;
};

/** @override */
five.ServiceAuth.prototype.getAuthDeferred = function() {
  return this.authDeferred_.branch();
};

/** @override */
five.ServiceAuth.prototype.getAuthorizationHeaderValue = function() {
  return this.authorizationHeaderValue_;
};

/** @return {!goog.async.Deferred} */
five.ServiceAuth.prototype.getDb_ = function() {
  if (this.dbDeferred_) {
    return this.dbDeferred_.branch();
  }

  this.dbDeferred_ = goog.db.openDatabase(
      five.ServiceAuth.DB_NAME_, 1,
      function(ev, db, tx) {
        if (ev.oldVersion < 1) {
          db.createObjectStore(five.ServiceAuth.AUTH_DB_STORE_NAME_);
        }
      });
  this.dbDeferred_.addErrback(function(err) {
    this.logger_.severe('Failed to open database: ' + err, err);
  }, this);

  return this.dbDeferred_.branch();
};
