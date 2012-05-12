// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.EventCard');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.style');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
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

  /** @type {goog.events.EventHandler} */
  this.eventHandler_ = new goog.events.EventHandler(this);
};
goog.inherits(fivemins.EventCard, goog.events.EventTarget);

/** @type {Element} */
fivemins.EventCard.prototype.el_;

/** @return {goog.date.DateTime} */
fivemins.EventCard.prototype.getStartTime = function() {
  return this.startTime_;
};

/** @return {goog.date.DateTime} */
fivemins.EventCard.prototype.getEndTime = function() {
  return this.endTime_;
};

fivemins.EventCard.prototype.render = function(parentEl) {
  goog.asserts.assert(!this.el_);
  this.el_ = document.createElement('div');
  this.el_.className = 'event-card';
  this.el_.appendChild(document.createTextNode(this.event_['summary']));
  parentEl.appendChild(this.el_);
};

/** @param {goog.math.Rect} rect */
fivemins.EventCard.prototype.setRect = function(rect) {
  goog.style.setPosition(this.el_, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el_, rect.getSize());
};

fivemins.EventCard.prototype.disposeInternal = function() {
  goog.dom.removeNode(this.el_);
  delete this.el_;
  goog.dispose(this.eventHandler_);
  goog.base(this, 'disposeInternal');
};
