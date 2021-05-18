// Copyright cantstopthesignals@gmail.com

goog.provide('five.FloatingActionButton');

goog.require('five.Component');
goog.require('five.device');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.style');


/**
 * @constructor
 * @param {string} iconClass
 * @extends {five.Component}
 */
five.FloatingActionButton = function(iconClass) {
  goog.base(this);

  /** @type {string} */
  this.iconClass_ = iconClass;
};
goog.inherits(five.FloatingActionButton, five.Component);

five.FloatingActionButton.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'floating-action-button');

  var spanEl = document.createElement('span');
  goog.dom.classlist.add(spanEl, this.iconClass_);
  this.el.appendChild(spanEl);
};
