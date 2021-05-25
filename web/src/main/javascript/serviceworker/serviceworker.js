// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceWorker');

goog.require('five.ServiceAuth');
goog.require('five.ServiceCalendarApi');
goog.require('five.ServiceWorkerApi');
goog.require('five.SyncHandler');
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
  /** @type {!five.SyncHandler} */
  this.syncHandler_ = new five.SyncHandler();

  /** @type {goog.async.Deferred} */
  this.dbDeferred_;

  /** @type {goog.async.Deferred} */
  this.lastManifestDeferred_;

  /** @type {!five.ServiceAuth} */
  this.serviceAuth_ = new five.ServiceAuth();

  /** @type {!five.ServiceCalendarApi} */
  this.serviceCalendarApi_ = new five.ServiceCalendarApi(this.serviceAuth_);

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.ServiceWorker, goog.events.EventTarget);

/** @enum {string} */
five.ServiceWorker.EventType = {
  SYNC: 'sync'
};

/** @type {string} */
five.ServiceWorker.CACHE_NAME = "default-cache";

/** @type {string} */
five.ServiceWorker.LAST_MANIFEST_DB_NAME = 'lastManifest';

/** @type {string} */
five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME = 'store';

/** @type {string} */
five.ServiceWorker.LAST_MANIFEST_DB_VALUE_KEY = 'value';

/** @type {goog.log.Logger} */
five.ServiceWorker.prototype.logger_ = goog.log.getLogger('five.ServiceWorker');

five.ServiceWorker.prototype.start = function() {
  this.logger_.info('start');

  this.serviceAuth_.start();

  this.eventHandler_.
      listen(self, goog.events.EventType.INSTALL, this.handleInstall_).
      listen(self, goog.events.EventType.ACTIVATE, this.handleActivate_).
      listen(self, goog.events.EventType.FETCH, this.handleFetch_).
      listen(self, goog.events.EventType.MESSAGE, this.handleMessage_).
      listen(self, five.ServiceWorker.EventType.SYNC, this.handleSync_);
};

/** @return {goog.async.Deferred} */
five.ServiceWorker.prototype.getDb_ = function() {
  if (this.dbDeferred_) {
    return this.dbDeferred_.branch();
  }

  this.dbDeferred_ = goog.db.openDatabase(
    five.ServiceWorker.LAST_MANIFEST_DB_NAME, 1,
    function(ev, db, tx) {
      db.createObjectStore(five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME);
    });
  this.dbDeferred_.addErrback(function(err) {
    this.logger_.severe('Failed to open database: ' + err, err);
  }, this);

  return this.dbDeferred_.branch();
};

five.ServiceWorker.prototype.getLastManifestDeferred_ = function() {
  if (this.lastManifestDeferred_) {
    return this.lastManifestDeferred_.branch();
  }

  this.lastManifestDeferred_ = this.getDb_().addCallback(function(db) {
    var getTx = db.createTransaction([five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME]);
    var store = getTx.objectStore(five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME);
    var request = store.get(five.ServiceWorker.LAST_MANIFEST_DB_VALUE_KEY);
    return request.addErrback(function(err) {
      this.logger_.severe('Failed to read last manifest value: ' + err, err);
    }, this);
  }, this);

  return this.lastManifestDeferred_.branch();
};

five.ServiceWorker.prototype.saveLastManifest_ = function(lastManifestData) {
  this.getDb_().addCallback(function(db) {
    var putTx = db.createTransaction(
      [five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME],
      goog.db.Transaction.TransactionMode.READ_WRITE);
    var store = putTx.objectStore(five.ServiceWorker.LAST_MANIFEST_DB_STORE_NAME);
    var request = store.put(lastManifestData, five.ServiceWorker.LAST_MANIFEST_DB_VALUE_KEY);
    request.addErrback(function(err) {
      this.logger_.severe('Failed to store last manifest value: ' + err, err);
    }, this);
  }, this);
};

/** @param {!goog.events.BrowserEvent} e */
five.ServiceWorker.prototype.handleInstall_ = function(e) {
  this.logger_.info('handleInstall_');

  var event = e.getBrowserEvent();
  event.waitUntil(self['skipWaiting']());
};

/** @param {!goog.events.BrowserEvent} e */
five.ServiceWorker.prototype.handleActivate_ = function(e) {
  this.logger_.info('handleActivate_');

  var event = e.getBrowserEvent();
  event.waitUntil(self['clients'].claim());
};

/** @param {!goog.events.BrowserEvent} e */
five.ServiceWorker.prototype.handleFetch_ = function(e) {
  var event = e.getBrowserEvent();
  var url = new URL(event.request.url);
  if (self.location.origin != url.origin ||
      url.pathname == '/manifest.txt' ||
      url.pathname.startsWith('/debug/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    self.caches.match(event.request).
      then(function(response) {
        if (response) {
          return response;
        }
        return self.fetch(event.request).then(function(response) {
          if (response.status == 200) {
            var cachedResponse = response.clone();
            self.caches.open(five.ServiceWorker.CACHE_NAME).
              then(function(cache) {
                cache.put(event.request, cachedResponse);
              });
          }
          return response;
        });
    }));
};

/** @param {!goog.events.BrowserEvent} e */
five.ServiceWorker.prototype.handleMessage_ = function(e) {
  var event = e.getBrowserEvent();
  var command = event.data[five.ServiceWorkerApi.MESSAGE_COMMAND_KEY];

  if (command == five.ServiceWorkerApi.COMMAND_CHECK_APP_UPDATE_AVAILABLE) {
    this.handleCheckAppUpdateMessage_(e);
  } else if (command == five.ServiceWorkerApi.COMMAND_CALENDAR_API_RPC) {
    this.serviceCalendarApi_.handleMessage(e);
  } else if (command == five.ServiceWorkerApi.COMMAND_AUTH_RPC) {
    this.serviceAuth_.handleMessage(e);
  }
}

/**
 * @param {!goog.events.BrowserEvent} e
 */
five.ServiceWorker.prototype.handleCheckAppUpdateMessage_ = function(e) {
  var event = e.getBrowserEvent();
  self.fetch('/manifest.txt')
    .then(response => response.text())
    .then(function(manifestData) {
      this.getLastManifestDeferred_().addCallback(function(lastManifestData) {
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
        var message = {};
        message[five.ServiceWorkerApi.MESSAGE_COMMAND_KEY] =
            five.ServiceWorkerApi.COMMAND_UPDATE_AVAILABLE;
        event.source.postMessage(message);

        self.caches.delete(five.ServiceWorker.CACHE_NAME);
      }, this);

      this.lastManifestDeferred_ = goog.async.Deferred.succeed(manifestData);
    }.bind(this))
    .catch(function(err) {
      this.logger_.info('handleMessage_: checkAppUpdateAvailable: error fetching manifest: '
          + err, err);
    }.bind(this));
};

/** @param {!goog.events.BrowserEvent} e */
five.ServiceWorker.prototype.handleSync_ = function(e) {
  this.logger_.info('handleSync_');

  var event = e.getBrowserEvent();
  event.waitUntil(this.syncHandler_.handleSync()
    .catch(err => {
      this.logger_.severe('handleSync_ failed: ' + err, err);
    }));
};
