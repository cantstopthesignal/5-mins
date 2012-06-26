// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventCard');

goog.require('five.Component');
goog.require('five.deviceParams');
goog.require('five.util');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.dom.Range');
goog.require('goog.events.EventType');
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

/** @type {five.EventTheme} */
five.EventCard.prototype.theme_;

/** @type {boolean} */
five.EventCard.prototype.selected_ = false;

/** @type {goog.math.Rect} */
five.EventCard.prototype.rect_;

/** @type {Element} */
five.EventCard.prototype.dateRangeEl_;

/** @type {Element} */
five.EventCard.prototype.summaryEl_;

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
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setEventTheme(this.theme_);
  }
  this.timeAxisPatchUpdated();
};

/** @return {five.TimeAxisPatch} */
five.EventCard.prototype.getTimeAxisPatch = function() {
  return this.timeAxisPatch_;
};

/** @param {five.EventTheme} theme */
five.EventCard.prototype.setTheme = function(theme) {
  this.theme_ = theme;
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setEventTheme(this.theme_);
  }
  if (this.el) {
    this.updateThemeDisplay_();
  }
};

five.EventCard.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'event-card');
  this.dateRangeEl_ = document.createElement('div');
  goog.dom.classes.add(this.dateRangeEl_, 'date-range');
  this.el.appendChild(this.dateRangeEl_);
  this.summaryEl_ = document.createElement('span');
  this.el.appendChild(this.summaryEl_);

  this.updateDisplay();
  this.updateThemeDisplay_();

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.el, goog.events.EventType.DBLCLICK, this.handleDblClick_).
      listen(this.el, goog.events.EventType.MOUSEDOWN, this.handleMouseDown_);
};

/** @override */
five.EventCard.prototype.disposeInternal = function() {
  this.event_.detachDisplay(this);
  goog.dispose(this.timeAxisPatch_);
  goog.base(this, 'disposeInternal');
};

five.EventCard.prototype.updateDisplay = function() {
  var dateRangeText = five.EventCard.toTimeString_(this.getStartTime());
  var minuteDiff = five.util.msToMin(this.getEndTime().getTime() -
      this.getStartTime().getTime());
  if (minuteDiff != 5) {
    dateRangeText += ' - ' + five.EventCard.toTimeString_(this.getEndTime());
  }
  goog.dom.setTextContent(this.dateRangeEl_, dateRangeText);
  goog.dom.setTextContent(this.summaryEl_, this.event_.getSummary());
};

five.EventCard.prototype.updateThemeDisplay_ = function() {
  if (!this.theme_) {
    return;
  }
  this.el.style.borderColor = this.selected_ ? this.theme_.selectedBorderColor :
      this.theme_.borderColor;
  this.el.style.backgroundColor = this.selected_ ? this.theme_.selectedBgColor :
      this.theme_.bgColor;
};

/** @param {goog.math.Rect} rect */
five.EventCard.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  this.rect_ = rect;
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
  goog.dom.classes.enable(this.el, 'micro-height',
      rect.height < five.deviceParams.getEventCardMinShortHeight());
  goog.dom.classes.enable(this.el, 'short-height',
      rect.height >= five.deviceParams.getEventCardMinShortHeight() &&
      rect.height < five.deviceParams.getEventCardMinNormalHeight());
  goog.dom.classes.enable(this.el, 'large-height',
      rect.height >= five.deviceParams.getEventCardMinLargeHeight());
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
  this.selected_ = selected;
  goog.dom.classes.enable(this.el, 'selected', this.selected_);
  this.updateThemeDisplay_();
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setSelected(this.selected_);
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
five.EventCard.prototype.handleDblClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  goog.dom.Range.clearSelection(window);
  this.dispatchEvent(five.Event.EventType.EDIT_SUMMARY);
};

/** @param {goog.events.BrowserEvent} e */
five.EventCard.prototype.handleMouseDown_ = function(e) {
  if (e.shiftKey) {
    e.preventDefault();
  }
};
