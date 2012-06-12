// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventCard');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.style');

/**
 * @param {!five.Event} event
 * @constructor
 * @extends {five.Component}
 */
five.EventCard = function(event) {
  goog.base(this);

  /** @type {!five.Event} */
  this.event_ = event;

  this.event_.attachDisplay(this);
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

/** @type {goog.math.Rect} */
five.EventCard.prototype.rect_;

/** @return {!five.Event} */
five.EventCard.prototype.getEvent = function() {
  return this.event_;
};

/** @return {goog.date.DateTime} */
five.EventCard.prototype.getStartTime = function() {
  return this.event_.getStartTime();
};

/** @return {goog.date.DateTime} */
five.EventCard.prototype.getEndTime = function() {
  return this.event_.getEndTime();
};

/** @param {five.TimeAxisPatch} patch */
five.EventCard.prototype.setTimeAxisPatch = function(patch) {
  goog.dispose(this.timeAxisPatch_);
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
  this.el.tabIndex = 0;
  var dateRangeEl = document.createElement('div');
  goog.dom.classes.add(dateRangeEl, 'date-range');
  this.el.appendChild(dateRangeEl);
  this.el.appendChild(document.createTextNode(this.event_.getSummary()));

  this.updateDisplay();

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.el, goog.events.EventType.KEYDOWN, this.handleKeyDown_);
};

/** @override */
five.EventCard.prototype.disposeInternal = function() {
  this.event_.detachDisplay(this);
  goog.dispose(this.timeAxisPatch_);
  goog.base(this, 'disposeInternal');
};

five.EventCard.prototype.updateDisplay = function() {
  var dateRangeEl = this.getElementByClass('date-range');
  goog.dom.removeChildren(dateRangeEl);
  dateRangeEl.appendChild(document.createTextNode(
      five.EventCard.toTimeString_(this.getStartTime()) + ' - ' +
      five.EventCard.toTimeString_(this.getEndTime())));
};

/** @param {goog.math.Rect} rect */
five.EventCard.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  this.rect_ = rect;
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
  goog.dom.classes.enable(this.el, 'micro-height', rect.height < 26);
  goog.dom.classes.enable(this.el, 'short-height', rect.height >= 26 &&
      rect.height < 30);
  goog.dom.classes.enable(this.el, 'large-height', rect.height >= 44);
};

/** @return {goog.math.Rect} */
five.EventCard.prototype.getRect = function() {
  return this.rect_;
};

/** @param {boolean} selected */
five.EventCard.prototype.setSelected = function(selected) {
  if (!this.el) {
    this.createDom();
  }
  goog.dom.classes.enable(this.el, 'selected', selected);
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setSelected(selected);
  }
};

five.EventCard.prototype.timeAxisPatchUpdated = function() {
  goog.dom.classes.enable(this.el, 'attached-to-patch',
      !!this.timeAxisPatch_ && this.timeAxisPatch_.getAttachedToEvent());
};

/** @param {goog.events.BrowserEvent} e */
five.EventCard.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  var event = new goog.events.Event(goog.dom.classes.has(this.el, 'selected') ?
      five.Event.EventType.DESELECT : five.Event.EventType.SELECT);
  event.shiftKey = e.shiftKey;
  this.dispatchEvent(event);
};

/** @param {goog.events.BrowserEvent} e */
five.EventCard.prototype.handleKeyDown_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.UP) {
    if (this.dispatchEvent(five.EventMoveEvent.bothEarlier())) {
      e.preventDefault();
    }
  } else if (e.keyCode == goog.events.KeyCodes.DOWN) {
    if (this.dispatchEvent(five.EventMoveEvent.bothLater())) {
      e.preventDefault();
    }
  }
};
