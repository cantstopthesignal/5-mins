// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventCard');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.EventCard = function(event) {
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
goog.inherits(five.EventCard, five.Component);

five.EventCard.toTimeString_ = function(date) {
  var str = date.toUsTimeString(false, false, true);
  if (date.getHours() >= 12) {
    str += 'p';
  }
  return str;
};

/** @type {five.TimeAxisPatch} */
five.EventCard.prototype.timeAxisPatch_;

/** @return {goog.date.DateTime} */
five.EventCard.prototype.getStartTime = function() {
  return this.startTime_;
};

/** @return {goog.date.DateTime} */
five.EventCard.prototype.getEndTime = function() {
  return this.endTime_;
};

/** @param {five.TimeAxisPatch} patch */
five.EventCard.prototype.setTimeAxisPatch = function(patch) {
  if (this.timeAxisPatch_) {
    goog.dispose(this.timeAxisPatch_);
  }
  this.timeAxisPatch_ = patch;
  this.timeAxisPatchUpdated();
};

/** @return {five.TimeAxisPatch} */
five.EventCard.prototype.getTimeAxisPatch = function() {
  return this.timeAxisPatch_;
};

five.EventCard.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'event-card');
  var dateRangeEl = document.createElement('div');
  goog.dom.classes.add(dateRangeEl, 'date-range');
  dateRangeEl.appendChild(document.createTextNode(
      five.EventCard.toTimeString_(this.startTime_) + ' - ' +
      five.EventCard.toTimeString_(this.endTime_)));
  this.el.appendChild(dateRangeEl);
  this.el.appendChild(document.createTextNode(this.event_['summary']));
};

five.EventCard.prototype.disposeInternal = function() {
  goog.dispose(this.timeAxisPatch_);
  goog.base(this, 'disposeInternal');
};

/** @param {goog.math.Rect} rect */
five.EventCard.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
  goog.dom.classes.enable(this.el, 'micro-height', rect.height < 26);
  goog.dom.classes.enable(this.el, 'short-height', rect.height >= 26 &&
      rect.height < 30);
  goog.dom.classes.enable(this.el, 'large-height', rect.height >= 44);
};

five.EventCard.prototype.timeAxisPatchUpdated = function() {
  goog.dom.classes.enable(this.el, 'attached-to-patch',
      !!this.timeAxisPatch_ && this.timeAxisPatch_.getAttachedToEvent());
};