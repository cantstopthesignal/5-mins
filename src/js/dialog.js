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
};
goog.inherits(five.Dialog, five.Component);

five.Dialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'dialog');
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
  this.el.style.marginLeft = -(this.el.offsetWidth/2) + 'px';
  this.el.style.marginTop = -(this.el.offsetHeight/2) + 'px';
};
