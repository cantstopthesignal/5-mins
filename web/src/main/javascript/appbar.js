// Copyright cantstopthesignals@gmail.com

goog.provide('five.AppBar');

goog.require('five.AppBarButtonBar');
goog.require('five.AppBarMainMenu');
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
five.AppBar = function() {
  goog.base(this);

  /** @type {five.Spinner} */
  this.spinner_ = new five.Spinner(true);
  this.registerDisposable(this.spinner_);

  /** @type {five.AppBarButtonBar} */
  this.buttonBar_ = new five.AppBarButtonBar();
  this.registerDisposable(this.buttonBar_);

  /** @type {five.AppBarMainMenu} */
  this.mainMenu_ = new five.AppBarMainMenu();
  this.registerDisposable(this.mainMenu_);
};
goog.inherits(five.AppBar, five.Component);

five.AppBar.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'app-bar');

  this.buttonBar_.render(this.el);
  this.spinner_.render(this.el);

  var appIconEl = document.createElement('div');
  goog.dom.classlist.add(appIconEl, 'app-icon');
  goog.dom.classlist.add(appIconEl, 'app-bar-icon');
  appIconEl.appendChild(document.createElement('div'));
  goog.dom.classlist.add(goog.asserts.assertElement(appIconEl.firstChild), 'inner');
  this.el.appendChild(appIconEl);

  this.mainMenu_.render(this.el);
};

five.AppBar.prototype.getButtonBar = function() {
  return this.buttonBar_;
};

five.AppBar.prototype.getMainMenu = function() {
  return this.mainMenu_;
};

five.AppBar.prototype.getSpinner = function() {
  return this.spinner_;
};
