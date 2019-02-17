// Copyright cantstopthesignals@gmail.com

goog.provide('five.Dialog');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.Dialog = function() {
  goog.base(this);

  /** @type {Element} */
  this.contentEl_;

  /** @type {Element} */
  this.backgroundEl_;
};
goog.inherits(five.Dialog, five.Component);

five.Dialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  this.el.tabIndex = '0';
  goog.dom.classlist.add(this.el, 'dialog-container');

  this.backgroundEl_ = document.createElement('div');
  goog.dom.classlist.add(this.backgroundEl_, 'dialog-background');
  this.el.appendChild(this.backgroundEl_);

  this.contentEl_ = document.createElement('div');
  goog.dom.classlist.add(this.contentEl_, 'dialog');
  this.el.appendChild(this.contentEl_);
};

five.Dialog.prototype.getContentEl = function() {
  return this.contentEl_;
};

five.Dialog.prototype.getBackgroundEl = function() {
  return this.backgroundEl_;
};

/** @param {Element=} opt_parentEl */
five.Dialog.prototype.show = function(opt_parentEl) {
  if (!this.el) {
    this.createDom();
  }
  goog.asserts.assert(this.el);
  var parentEl = opt_parentEl || document.body;
  parentEl.appendChild(this.el);
  this.reposition();

  this.eventHandler.
      listen(window, goog.events.EventType.RESIZE, this.handleWindowResize_);
};

five.Dialog.prototype.hide = function() {
  goog.dom.removeNode(this.el);

  this.eventHandler.
      unlisten(window, goog.events.EventType.RESIZE, this.handleWindowResize_);
};

five.Dialog.prototype.handleWindowResize_ = function() {
  this.reposition();
}

five.Dialog.prototype.reposition = function() {
  this.contentEl_.style.marginLeft = -(this.contentEl_.offsetWidth/2) + 'px';
  if (!goog.dom.classlist.contains(this.contentEl_, 'no-center-vertically')) {
    this.contentEl_.style.marginTop = -(this.contentEl_.offsetHeight/2) + 'px';
  }
};
