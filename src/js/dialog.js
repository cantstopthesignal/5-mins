// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.Dialog');

goog.require('fivemins.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.Dialog = function() {
  goog.base(this);
};
goog.inherits(fivemins.Dialog, fivemins.Component);

fivemins.Dialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'dialog');
};

/** @param {Element=} opt_parentEl */
fivemins.Dialog.prototype.show = function(opt_parentEl) {
  if (!this.el) {
    this.createDom();
  }
  goog.asserts.assert(this.el);
  var parentEl = opt_parentEl || document.body;
  parentEl.appendChild(this.el);
  this.reposition();
};

fivemins.Dialog.prototype.hide = function() {
  goog.dom.removeNode(this.el);
};

fivemins.Dialog.prototype.reposition = function() {
  this.el.style.marginLeft = -(this.el.offsetWidth/2) + 'px';
  this.el.style.marginTop = -(this.el.offsetHeight/2) + 'px';
};
