// Copyright cantstopthesignals@gmail.com

goog.provide('five.SyncHandler');

goog.require('goog.events.EventTarget');
goog.require('goog.log');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.SyncHandler = function() {
  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler_);
};
goog.inherits(five.SyncHandler, goog.events.EventTarget);

/** @type {goog.log.Logger} */
five.SyncHandler.prototype.logger_ = goog.log.getLogger('five.SyncHandler');

/** @return {!IThenable} */
five.SyncHandler.prototype.handleSync = function() {
    this.logger_.info('handleSync start');
  return new Promise(resolve => {
    self.setTimeout(() => {
      this.logger_.info('handleSync timeout');
      resolve();
    }, 1000);
  });
};
