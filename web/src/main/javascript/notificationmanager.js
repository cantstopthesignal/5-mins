// Copyright cantstopthesignals@gmail.com

goog.provide('five.NotificationManager');

goog.require('five.Component');
goog.require('five.Service');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
goog.require('goog.events.EventType');


/**
 * @param {!five.AppBar} appBar
 * @constructor
 * @extends {five.Component}
 * @implements {five.Service}
 */
five.NotificationManager = function(appBar) {
  goog.base(this);

  /** @type {!five.AppBar} */
  this.appBar_ = appBar;
};
goog.inherits(five.NotificationManager, five.Component);

five.NotificationManager.SERVICE_ID = 's' + goog.getUid(
    five.NotificationManager);

/**
 * @param {!five.AppContext} appContext
 * @return {!five.NotificationManager}
 */
five.NotificationManager.get = function(appContext) {
  return /** @type {!five.NotificationManager} */ (goog.asserts.assertObject(
      appContext.get(five.NotificationManager.SERVICE_ID)));
};

/** @enum {string} */
five.NotificationManager.Level = {
  ERROR: 'error',
  INFO: 'info'
};

/** @type {number} */
five.NotificationManager.DEFAULT_SHOW_DURATION_MS_ = 5000;

/** @type {number} */
five.NotificationManager.prototype.showTimeoutId_;

/** @param {!five.AppContext} appContext */
five.NotificationManager.prototype.register = function(appContext) {
  appContext.register(five.NotificationManager.SERVICE_ID, this);
};

five.NotificationManager.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'notification');
};

/** @override */
five.NotificationManager.prototype.disposeInternal = function() {
  this.clearShowTimeout_();
  goog.base(this, 'disposeInternal');
};

/**
 * @param {string} message
 * @param {number=} opt_duration
 * @param {five.NotificationManager.Level=} opt_level
 */
five.NotificationManager.prototype.show = function(message, opt_duration, opt_level) {
  if (!this.el) {
    this.createDom();
  }
  goog.asserts.assert(this.el);
  var parentEl = document.body;
  parentEl.appendChild(this.el);

  var level = opt_level || five.NotificationManager.Level.ERROR;

  goog.dom.setTextContent(this.el, message);
  goog.dom.classlist.enable(this.el, 'info', level == five.NotificationManager.Level.INFO);

  this.clearShowTimeout_();
  this.showTimeoutId_ = window.setTimeout(goog.bind(this.hide, this),
      opt_duration || five.NotificationManager.DEFAULT_SHOW_DURATION_MS_);

  this.reposition();
};

five.NotificationManager.prototype.hide = function() {
  this.clearShowTimeout_();
  goog.dom.removeNode(this.el);
};

five.NotificationManager.prototype.reposition = function() {
  var width = this.el.offsetWidth;
  var height = this.el.offsetHeight;
  if (width > this.appBar_.el.offsetWidth / 2) {
    goog.style.setStyle(this.el, 'top', this.appBar_.el.offsetHeight + 'px');
    goog.style.setStyle(this.el, 'marginTop', '');
  } else {
    goog.style.setStyle(this.el, 'top', (this.appBar_.el.offsetHeight / 2) +
        'px');
    goog.style.setStyle(this.el, 'marginTop', -(height/2) + 'px');
  }
  goog.style.setStyle(this.el, 'left', '50%');
  goog.style.setStyle(this.el, 'marginLeft', -(width/2) + 'px');
};

five.NotificationManager.prototype.clearShowTimeout_ = function() {
  if (this.showTimeoutId_) {
    window.clearTimeout(this.showTimeoutId_);
    delete this.showTimeoutId_;
  }
};
