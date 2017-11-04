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

/**
 * @param {string} className
 * @return {!goog.array.ArrayLike}
 */
five.Component.prototype.getElementsByClass = function(className) {
  return goog.dom.getElementsByClass(className, this.el);
};

/**
 * @param {string} className
 * @return {Element}
 */
five.Component.prototype.getElementByClass = function(className) {
  return goog.dom.getElementByClass(className, this.el);
};

/** @override */
five.Component.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el);
  delete this.el;
  goog.base(this, 'disposeInternal');
};
