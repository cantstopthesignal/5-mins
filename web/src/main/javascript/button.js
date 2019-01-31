// Copyright cantstopthesignals@gmail.com

goog.provide('five.Button');

goog.require('five.Component');
goog.require('five.device');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');


/**
 * @constructor
 * @param {string|Node} caption
 * @extends {five.Component}
 */
five.Button = function(caption) {
  goog.base(this);

  if (goog.isString(caption)) {
    caption = document.createTextNode(caption);
  }

  /** @type {Node} */
  this.captionEl_ = caption;
};
goog.inherits(five.Button, five.Component);

five.Button.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'button');
  if (five.device.isTouch()) {
    goog.dom.classlist.add(this.el, 'touch');
  }

  this.el.appendChild(this.captionEl_);
};
