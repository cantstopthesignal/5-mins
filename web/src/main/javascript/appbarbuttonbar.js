// Copyright cantstopthesignals@gmail.com

goog.provide('five.AppBarButtonBar');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.Spinner');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events.EventType');


/**
 * @constructor
 * @extends {five.Component}
 */
five.AppBarButtonBar = function() {
  goog.base(this);

  /** @type {!Array.<!five.Button>} */
  this.buttons_ = [];
};
goog.inherits(five.AppBarButtonBar, five.Component);

five.AppBarButtonBar.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'app-bar-button-bar');
};

/** @param {!five.Button} button */
five.AppBarButtonBar.prototype.addButton = function(button) {
  this.buttons_.push(button);
  button.render(this.el);
};
