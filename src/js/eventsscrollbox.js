// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventsScrollBox');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.EventsScrollBox = function() {
  /** @type {Array.<Object>} */
  this.events_ = [];

  /** @type {Array.<Element>} */
  this.timeIndicatorEls_ = [];

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
};
goog.inherits(fivemins.EventsScrollBox, goog.events.EventTarget);

/** @type {number} */
fivemins.EventsScrollBox.DEFAULT_HOUR_PIXEL_HEIGHT = 45;

/** @type {goog.date.DateTime} */
fivemins.EventsScrollBox.prototype.startDate_;

/** @type {goog.date.DateTime} */
fivemins.EventsScrollBox.prototype.endDate_;

/** @type {Element} */
fivemins.EventsScrollBox.prototype.el_;

/** @type {number} */
fivemins.EventsScrollBox.prototype.scale_ = 1.0;

fivemins.EventsScrollBox.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el_);
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  this.el_ = document.createElement('div');
  this.el_.className = 'events-scroll-box';
  this.renderTimeIndicators_();
  this.renderEvents_();
  parentEl.appendChild(this.el_);
};

fivemins.EventsScrollBox.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
  if (this.el_) {
    this.renderTimeIndicators_();
  }
};

fivemins.EventsScrollBox.prototype.setEvents = function(events) {
  this.events_ = events;
  this.renderEvents_();
};

fivemins.EventsScrollBox.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el_);
  delete this.el_;
  goog.dispose(this.eventHandler_);
  goog.base(this, 'disposeInternal');
};

fivemins.EventsScrollBox.prototype.renderTimeIndicators_ = function() {
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  goog.array.forEach(this.timeIndicatorEls_, function(el) {
    goog.dom.removeNode(el);
  });
  this.timeIndicatorEls_ = [];
  var hourIter = this.startDate_.clone();
  while (goog.date.Date.compare(hourIter, this.endDate_) < 0) {
    var timeStr = hourIter.toUsTimeString(false, true, true);
    var timeEl = document.createElement('div');
    timeEl.className = 'time-indicator';
    var timeBoxEl = document.createElement('div');
    timeBoxEl.className = 'time-box';
    timeBoxEl.appendChild(document.createTextNode(timeStr));
    timeEl.appendChild(timeBoxEl);
    var topPos = this.timeToPixel_(hourIter);
    timeEl.style.top = topPos + 'px';
    this.el_.appendChild(timeEl);
    this.timeIndicatorEls_.push(timeEl);
    hourIter.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
    timeEl.style.height = (this.timeToPixel_(hourIter) - topPos) + 'px';
  }
};

fivemins.EventsScrollBox.prototype.timeToPixel_ = function(date) {
  var startTime = this.startDate_.valueOf();
  var time = date.valueOf();
  return ((time - startTime) / 1000 / 60 / 60) *
      fivemins.EventsScrollBox.DEFAULT_HOUR_PIXEL_HEIGHT * this.scale_;
};

fivemins.EventsScrollBox.prototype.renderEvents_ = function() {
};
