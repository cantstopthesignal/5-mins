// Copyright cantstopthesignals@gmail.com

goog.provide('five.ServiceWorker');

goog.require('goog.asserts');
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
  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.ServiceWorker, goog.events.EventTarget);

/** @type {goog.log.Logger} */
five.ServiceWorker.prototype.logger_ = goog.log.getLogger('five.App');

/** @type {string} */
five.ServiceWorker.CACHE_NAME = "default-cache";

/** @type {string} */
five.ServiceWorker.prototype.lastManifest_;

five.ServiceWorker.prototype.start = function() {
  this.logger_.info('start');

  this.eventHandler_.
      listen(self, goog.events.EventType.INSTALL, this.handleInstall_).
      listen(self, goog.events.EventType.ACTIVATE, this.handleActivate_).
      listen(self, goog.events.EventType.FETCH, this.handleFetch_).
      listen(self, goog.events.EventType.MESSAGE, this.handleMessage_);
};

five.ServiceWorker.prototype.handleInstall_ = function(e) {
  this.logger_.info('handleInstall_');

  self['skipWaiting']();
};

five.ServiceWorker.prototype.handleActivate_ = function(e) {
  this.logger_.info('handleActivate_');

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
    this.logger_.info('handleMessage_: checkAppUpdateAvailable');

    fetch('/manifest.txt')
      .then(response => response.text())
      .then(function(data) {
        if (this.lastManifest_ == null) {
          this.logger_.info('handleMessage_: checkAppUpdateAvailable: first manifest');
          this.lastManifest_ = data;
          return;
        }
        if (this.lastManifest_ == data) {
         this.logger_.info('handleMessage_: checkAppUpdateAvailable: manifest matches');
          return;
        }

        this.logger_.info('handleMessage_: checkAppUpdateAvailable: manifest updated!');
        this.lastManifest_ = data;

        event.source.postMessage({'command': 'updateAvailable'});

        self['caches'].delete(five.ServiceWorker.CACHE_NAME);
      }.bind(this));
  }
};
