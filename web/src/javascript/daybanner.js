// Copyright cantstopthesignals@gmail.com

goog.provide('five.DayBanner');

goog.require('five.Component');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.i18n.DateTimeFormat');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.DayBanner = function(date) {
  goog.base(this);

  /** @type {!goog.date.DateTime} */
  this.date_ = date;
};
goog.inherits(five.DayBanner, five.Component);

five.DayBanner.DATE_FORMAT = new goog.i18n.DateTimeFormat('EEEE, MMMM d');

/** @type {five.EventsTimeline} */
five.DayBanner.prototype.owner_;

/** @param {five.EventsTimeline} owner */
five.DayBanner.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

five.DayBanner.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'day-banner');

  this.el.appendChild(document.createTextNode(''));
  this.updateDisplay_();
};

/** @override */
five.DayBanner.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};

/** @param {!goog.date.DateTime} date */
five.DayBanner.prototype.setDate = function(date) {
  this.date_ = date;
  if (this.el) {
    this.updateDisplay_();
  }
};

/** @param {goog.math.Rect} rect */
five.DayBanner.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setWidth(this.el, rect.width);
};

five.DayBanner.prototype.updateDisplay_ = function() {
  var dayText = five.DayBanner.DATE_FORMAT.format(this.date_);
  this.el.firstChild.data = dayText;
};
