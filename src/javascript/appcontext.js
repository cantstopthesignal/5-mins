// Copyright cantstopthesignals@gmail.com

goog.provide('five.AppContext');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.AppContext = function() {
  /** @type {Object.<five.Service>} */
  this.serviceMap_ = {};
};
goog.inherits(five.AppContext, goog.events.EventTarget);

/**
 * @param {string} serviceId
 * @param {five.Service} service
 */
five.AppContext.prototype.register = function(serviceId, service) {
  goog.asserts.assert(!this.get(serviceId));
  this.serviceMap_[serviceId] = service;
  this.registerDisposable(service);
};

/**
 * @param {string} serviceId
 * @return {five.Service}
 */
five.AppContext.prototype.get = function(serviceId) {
  return this.serviceMap_[serviceId] || null;
};

/** @override */
five.AppContext.prototype.disposeInternal = function() {
  delete this.serviceMap_;
  goog.base(this, 'disposeInternal');
};

