// Copyright cantstopthesignals@gmail.com

goog.provide('five.Component');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.style');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.Component = function() {
  goog.base(this);

  /** @type {goog.events.EventHandler} */
  this.eventHandler = new goog.events.EventHandler(this);
  this.registerDisposable(this.eventHandler);
};
goog.inherits(five.Component, goog.events.EventTarget);

/** @type {Element} */
five.Component.prototype.el;

five.Component.prototype.createDom = function() {
  goog.asserts.assert(!this.el);
  this.el = document.createElement('div');
};

five.Component.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  parentEl.appendChild(this.el);
};

/** @override */
five.Component.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el);
  delete this.el;
  goog.base(this, 'disposeInternal');
};
