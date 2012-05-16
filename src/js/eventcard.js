// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventCard');

goog.require('fivemins.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.style');

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.EventCard = function(event) {
  /** @type {Object} */
  this.event_ = event;

  var startDateStr = event['start']['dateTime'];
  goog.asserts.assertString(startDateStr);
  /** @type {goog.date.DateTime} */
  this.startTime_ = new goog.date.DateTime(new Date(startDateStr));

  var endDateStr = event['end']['dateTime'];
  goog.asserts.assertString(endDateStr);
  /** @type {goog.date.DateTime} */
  this.endTime_ = new goog.date.DateTime(new Date(endDateStr));
};
goog.inherits(fivemins.EventCard, fivemins.Component);

/** @return {goog.date.DateTime} */
fivemins.EventCard.prototype.getStartTime = function() {
  return this.startTime_;
};

/** @return {goog.date.DateTime} */
fivemins.EventCard.prototype.getEndTime = function() {
  return this.endTime_;
};

fivemins.EventCard.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'event-card');
  this.el.appendChild(document.createTextNode(this.event_['summary']));
};

fivemins.EventCard.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  parentEl.appendChild(this.el);
};

/** @param {goog.math.Rect} rect */
fivemins.EventCard.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};