// Copyright cantstopthesignals@gmail.com

goog.provide('five.AppBarMainMenu');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.Spinner');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');


/**
 * @constructor
 * @extends {five.Component}
 */
five.AppBarMainMenu = function() {
  goog.base(this);
};
goog.inherits(five.AppBarMainMenu, five.Component);

/** @type {Element} */
five.AppBarMainMenu.prototype.titleEl_;

five.AppBarMainMenu.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'app-bar-main-menu');

  var menuArrowEl = document.createElement('div');
  goog.dom.classes.add(menuArrowEl, 'arrow');
  menuArrowEl.appendChild(document.createElement('div'));
  goog.dom.classes.add(menuArrowEl.firstChild, 'inner');
  this.el.appendChild(menuArrowEl);

  this.titleEl_ = document.createElement('div');
  goog.dom.classes.add(this.titleEl_, 'title');
  this.el.appendChild(this.titleEl_);
};

/** @param {string} title */
five.AppBarMainMenu.prototype.setTitle = function(title) {
  goog.dom.setTextContent(this.titleEl_, title);
};
