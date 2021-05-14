// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceWorker');

goog.require('goog.asserts');
goog.require('goog.db');
goog.require('goog.db.Transaction');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.ServiceWorker = function() {
  /** @type {goog.async.Deferred} */
  this.dbDeferred_ = new goog.async.Deferred();

  /** @type {goog.async.Deferred} */
  this.lastManifestDeferred_ = new goog.async.Deferred();

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.ServiceWorker, goog.events.EventTarget);

/** @type {string} */
five.ServiceWorker.CACHE_NAME = "default-cache";

/** @type {string} */
five.ServiceWorker.LAST_MANIFEST_DB_NAME = 'lastManifest';

/** @type {string} */
five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME = 'store';

/** @type {string} */
five.ServiceWorker.LAST_MANIFEST_DB_VALUE_KEY = 'value';

/** @type {goog.log.Logger} */
five.ServiceWorker.prototype.logger_ = goog.log.getLogger('five.App');

five.ServiceWorker.prototype.start = function() {
  this.logger_.info('start');

  this.eventHandler_.
      listen(self, goog.events.EventType.INSTALL, this.handleInstall_).
      listen(self, goog.events.EventType.ACTIVATE, this.handleActivate_).
      listen(self, goog.events.EventType.FETCH, this.handleFetch_).
      listen(self, goog.events.EventType.MESSAGE, this.handleMessage_);
};

five.ServiceWorker.prototype.loadDbAndLastManifest_ = function() {
  var dbDeferred = goog.db.openDatabase(
    five.ServiceWorker.LAST_MANIFEST_DB_NAME, 1,
    function(ev, db, tx) {
      db.createObjectStore(five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME);
    });
  dbDeferred.addCallbacks(function(db) {
      var getTx = db.createTransaction([five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME]);
      var request = getTx.objectStore(five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME).
        get(five.ServiceWorker.LAST_MANIFEST_DB_VALUE_KEY);
      request.addCallbacks(function(result) {
          this.lastManifestDeferred_.callback(result || null);
        }, function(err) {
          this.logger_.severe('Failed to read last manifest value: ' + err, err);
        }, this);
    }, function(err) {
      this.logger_.severe('Failed to open last manifest database: ' + err, err);
    }, this);

  dbDeferred.chainDeferred(goog.asserts.assertObject(this.dbDeferred_));
};

five.ServiceWorker.prototype.saveLastManifest_ = function(lastManifestData) {
  this.dbDeferred_.addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME);
    store.put(lastManifestData, five.ServiceWorker.LAST_MANIFEST_DB_VALUE_KEY);
    putTx.wait().addErrback(function(err) {
      this.logger_.severe('Failed to store last manifest value: ' + err, err);
    }, this);
  }, this);
};

five.ServiceWorker.prototype.handleInstall_ = function(e) {
  this.logger_.info('handleInstall_');

  self['skipWaiting']();
};

five.ServiceWorker.prototype.handleActivate_ = function(e) {
  this.logger_.info('handleActivate_');

  this.loadDbAndLastManifest_();

  var event = e.getBrowserEvent();
  event.waitUntil(self['clients'].claim());
};

five.ServiceWorker.prototype.handleFetch_ = function(e) {
  var event = e.getBrowserEvent();
  var url = new URL(event.request.url);
  if (self.location.origin != url.origin ||
      url.pathname.startsWith('/debug/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    self['caches'].match(event.request).
      then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request).then(function(response) {
          if (response.status == 200) {
            var cachedResponse = response.clone();
            self['caches'].open(five.ServiceWorker.CACHE_NAME).
              then(function(cache) {
                cache.put(event.request, cachedResponse);
              });
          }
          return response;
        });
    }));
};

five.ServiceWorker.prototype.handleMessage_ = function(e) {
  var event = e.getBrowserEvent();

  if (event.data['command'] == 'checkAppUpdateAvailable') {
    fetch('/manifest.txt')
      .then(response => response.text())
      .then(function(manifestData) {
        this.lastManifestDeferred_.addCallback(function(lastManifestData) {
          if (manifestData && lastManifestData != manifestData) {
            this.saveLastManifest_(manifestData);
          }

          if (lastManifestData == null) {
            this.logger_.info('handleMessage_: checkAppUpdateAvailable: first manifest');
            return;
          }

          if (lastManifestData == manifestData) {
            this.logger_.info('handleMessage_: checkAppUpdateAvailable: manifest matches');
            return;
          }

          this.logger_.info('handleMessage_: checkAppUpdateAvailable: manifest updated!');
          event.source.postMessage({'command': 'updateAvailable'});

          self['caches'].delete(five.ServiceWorker.CACHE_NAME);
        }, this);

        this.lastManifestDeferred_ = goog.async.Deferred.succeed(manifestData);
      }.bind(this))
      .catch(function(err) {
        this.logger_.info('handleMessage_: checkAppUpdateAvailable: error fetching manifest: '
            + err, err);
      }.bind(this));
  }
};
