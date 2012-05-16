// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventsScrollBox');

goog.require('fivemins.Component');
goog.require('fivemins.EventCard');
goog.require('fivemins.EventListLayout');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.style');

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.EventsScrollBox = function() {
  goog.base(this);

  /** @type {Array.<fivemins.EventCard>} */
  this.eventCards_ = [];

  /** @type {Array.<Element>} */
  this.timeIndicatorEls_ = [];
};
goog.inherits(fivemins.EventsScrollBox, fivemins.Component);

/** @type {number} */
fivemins.EventsScrollBox.DEFAULT_HOUR_PIXEL_HEIGHT = 45;

/** @type {goog.date.DateTime} */
fivemins.EventsScrollBox.prototype.startDate_;

/** @type {goog.date.DateTime} */
fivemins.EventsScrollBox.prototype.endDate_;

/** @type {number} */
fivemins.EventsScrollBox.prototype.scale_ = 1.0;

fivemins.EventsScrollBox.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'events-scroll-box');
};

fivemins.EventsScrollBox.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el);
  goog.asserts.assert(this.startDate_);
  goog.asserts.assert(this.endDate_);
  this.createDom();

  this.renderTimeIndicators_();
  this.renderEvents_();
  parentEl.appendChild(this.el);
  this.layout_();
};

fivemins.EventsScrollBox.prototype.resize = function(opt_width, opt_height) {
  var height = opt_height || this.el.parentNode.offsetHeight;
  goog.style.setBorderBoxSize(this.el, new goog.math.Size(undefined, height));
};

fivemins.EventsScrollBox.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
  if (this.el) {
    this.renderTimeIndicators_();
  }
};

fivemins.EventsScrollBox.prototype.setEvents = function(events) {
  goog.array.forEach(this.eventCards_, function(eventCard) {
    goog.dispose(eventCard);
  }, this);
  this.eventCards_ = goog.array.map(events, function(event) {
    return new fivemins.EventCard(event);
  }, this);
  if (this.el) {
    this.renderEvents_();
    this.layout_();
  }
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
    this.el.appendChild(timeEl);
    this.timeIndicatorEls_.push(timeEl);
    hourIter.add(new goog.date.Interval(goog.date.Interval.HOURS, 1));
    timeEl.style.height = (this.timeToPixel_(hourIter) - topPos) + 'px';
  }
};

fivemins.EventsScrollBox.prototype.renderEvents_ = function() {
  goog.array.forEach(this.eventCards_, function(eventCard) {
    eventCard.render(this.el);
  }, this);
};

fivemins.EventsScrollBox.prototype.layout_ = function() {
  var layoutEvents = goog.array.map(this.eventCards_, function(eventCard) {
    var layoutEvent = new fivemins.EventListLayout.Event(
        eventCard.getStartTime(), eventCard.getEndTime());
    layoutEvent.eventCard = eventCard;
    return layoutEvent;
  }, this);
  var layout = new fivemins.EventListLayout();
  layout.setLayoutWidth(goog.style.getContentBoxSize(this.el).width);
  layout.setEvents(layoutEvents);
  layout.calc();
  goog.array.forEach(layoutEvents, function(layoutEvent) {
    var eventCard = layoutEvent.eventCard;
    eventCard.setRect(layoutEvent.rect);
  }, this);
  goog.dispose(layout);
};

fivemins.EventsScrollBox.prototype.timeToPixel_ = function(date) {
  var startTime = this.startDate_.valueOf();
  var time = date.valueOf();
  return ((time - startTime) / 1000 / 60 / 60) *
      fivemins.EventsScrollBox.DEFAULT_HOUR_PIXEL_HEIGHT * this.scale_;
};