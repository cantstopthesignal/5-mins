// Copyright cantstopthesignals@gmail.com

goog.provide('five.Dialog');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
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
  goog.dom.classes.add(this.el, 'dialog-container');

  this.backgroundEl_ = document.createElement('div');
  goog.dom.classes.add(this.backgroundEl_, 'dialog-background');
  this.el.appendChild(this.backgroundEl_);

  this.contentEl_ = document.createElement('div');
  goog.dom.classes.add(this.contentEl_, 'dialog');
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
};

five.Dialog.prototype.hide = function() {
  goog.dom.removeNode(this.el);
};

five.Dialog.prototype.reposition = function() {
  this.contentEl_.style.marginLeft = -(this.contentEl_.offsetWidth/2) + 'px';
  this.contentEl_.style.marginTop = -(this.contentEl_.offsetHeight/2) + 'px';
};
