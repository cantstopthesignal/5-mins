// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.Component');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.style');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.Component = function() {
  goog.base(this);

  /** @type {goog.events.EventHandler} */
  this.eventHandler = new goog.events.EventHandler(this);
};
goog.inherits(fivemins.Component, goog.events.EventTarget);

/** @type {Element} */
fivemins.Component.prototype.el;

fivemins.Component.prototype.createDom = function() {
  goog.asserts.assert(!this.el);
  this.el = document.createElement('div');
};

fivemins.Component.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el);
  delete this.el;
  goog.dispose(this.eventHandler_);
  delete this.eventHandler_;
  goog.base(this, 'disposeInternal');
};
