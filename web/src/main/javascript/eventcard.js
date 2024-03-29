// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventCard');

goog.require('five.Component');
goog.require('five.EventTheme');
goog.require('five.deviceParams');
goog.require('five.util');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.classlist');
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

/** @enum {string} */
five.EventCard.EventType = {
  MOUSEDOWN_INSIDE: goog.events.getUniqueId('mousedown_inside')
};

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
five.EventCard.prototype.theme_ = five.EventTheme.DEFAULT;

/** @type {boolean} */
five.EventCard.prototype.selected_ = false;

/** @type {boolean} */
five.EventCard.prototype.proposed_ = false;

/** @type {goog.math.Rect} */
five.EventCard.prototype.rect_;

/** @type {goog.math.Rect} */
five.EventCard.prototype.visibleRect_;

/** @type {boolean} */
five.EventCard.prototype.wasAttachedToPatch_;

/** @type {Element} */
five.EventCard.prototype.contentEl_;

/** @type {Element} */
five.EventCard.prototype.dateRangeEl_;

/** @type {Element} */
five.EventCard.prototype.syncStatusEl_;

/** @type {Element} */
five.EventCard.prototype.summaryEl_;

/** @type {boolean} */
five.EventCard.prototype.straddlingVisibleTop_ = false;

/** @return {!five.Event} */
five.EventCard.prototype.getEvent = function() {
  return this.event_;
};

/** @return {!goog.date.DateTime} */
five.EventCard.prototype.getStartTime = function() {
  return this.event_.getStartTime();
};

/** @return {!goog.date.DateTime} */
five.EventCard.prototype.getEndTime = function() {
  return this.event_.getEndTime();
};

/** @param {five.TimeAxisPatch} patch */
five.EventCard.prototype.setTimeAxisPatch = function(patch) {
  goog.dispose(this.timeAxisPatch_);
  this.timeAxisPatch_ = patch;
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setEventTheme(this.theme_);
    this.timeAxisPatch_.setSelected(this.selected_);
    this.timeAxisPatch_.setProposed(this.proposed_);
  }
  this.timeAxisPatchUpdated();
};

/** @return {five.TimeAxisPatch} */
five.EventCard.prototype.getTimeAxisPatch = function() {
  return this.timeAxisPatch_;
};

/** @param {five.EventTheme} theme */
five.EventCard.prototype.maybeSetTheme_ = function(theme) {
  if (this.theme_ == theme) {
    return;
  }
  this.theme_ = theme;
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setEventTheme(this.theme_);
  }
  if (this.el) {
    this.updateThemeDisplay_();
  }
};

/**
 * @param {five.Event.SummaryType} summaryType
 * @return {five.EventTheme}
 */
five.EventCard.prototype.getThemeForSummaryType_ = function(summaryType) {
  if (summaryType == five.Event.SummaryType.TODO) {
    return five.EventTheme.TODO;
  }
  return five.EventTheme.DEFAULT;
};

five.EventCard.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'event-card');

  this.contentEl_ = document.createElement('div');
  this.el.appendChild(this.contentEl_);

  this.syncStatusEl_ = document.createElement('div');
  goog.dom.classlist.add(this.syncStatusEl_, 'sync-status');
  goog.dom.classlist.add(this.syncStatusEl_, 'changed-icon');
  goog.style.setElementShown(this.syncStatusEl_, false);
  this.contentEl_.appendChild(this.syncStatusEl_);

  this.dateRangeEl_ = document.createElement('div');
  goog.dom.classlist.add(this.dateRangeEl_, 'date-range');
  this.contentEl_.appendChild(this.dateRangeEl_);

  this.summaryEl_ = document.createElement('span');
  this.contentEl_.appendChild(this.summaryEl_);

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
  var summaryInfo = five.Event.SummaryInfo.fromSummary(this.event_.getSummary());

  var dateRangeText = five.EventCard.toTimeString_(this.getStartTime());
  var minuteDiff = five.util.msToMin(this.getEndTime().getTime() -
      this.getStartTime().getTime());
  if (minuteDiff != 5) {
    dateRangeText += ' - ' + five.EventCard.toTimeString_(this.getEndTime());
  }
  if (summaryInfo.isEstimate()) {
    dateRangeText = '~' + dateRangeText;
  }
  goog.dom.setTextContent(this.dateRangeEl_, dateRangeText);

  var newTheme = this.getThemeForSummaryType_(summaryInfo.getType());
  this.maybeSetTheme_(newTheme);

  goog.dom.setTextContent(this.summaryEl_, summaryInfo.getShortenedSummary());
  this.el.setAttribute('title', this.event_.getSummary());

  this.updateSyncStatusDisplay_();
};

five.EventCard.prototype.updateSyncStatusDisplay_ = function() {
  goog.style.setElementShown(this.syncStatusEl_, this.event_.hasMutations() && !this.proposed_);
};

five.EventCard.prototype.updateThemeDisplay_ = function() {
  if (!this.theme_) {
    return;
  }
  var borderColor;
  var bgColor;
  if (this.proposed_) {
    if (this.selected_) {
      borderColor = this.theme_.proposedSelectedBorderColor;
      bgColor = this.theme_.proposedSelectedBgColor;
    } else {
      borderColor = this.theme_.proposedBorderColor;
      bgColor = this.theme_.proposedBgColor;
    }
  } else if (this.selected_) {
    borderColor = this.theme_.selectedBorderColor;
    bgColor = this.theme_.selectedBgColor;
  } else {
    borderColor = this.theme_.borderColor;
    bgColor = this.theme_.bgColor;
  }
  this.el.style.borderColor = borderColor;
  this.el.style.backgroundColor = bgColor;
  this.syncStatusEl_.style.backgroundColor = bgColor;
};

/** @param {goog.math.Rect} rect */
five.EventCard.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  if (goog.math.Rect.equals(this.rect_, rect)) {
    return;
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
  if (!this.rect_ || this.rect_.height != rect.height) {
    goog.dom.classlist.enable(this.el, 'micro-height',
        rect.height < five.deviceParams.getEventCardMinShortHeight());
    goog.dom.classlist.enable(this.el, 'short-height',
        rect.height >= five.deviceParams.getEventCardMinShortHeight() &&
        rect.height < five.deviceParams.getEventCardMinNormalHeight());
    goog.dom.classlist.enable(this.el, 'large-height',
        rect.height >= five.deviceParams.getEventCardMinLargeHeight());
  }
  this.rect_ = rect;
  this.updateVisibleRegion_();
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
  goog.dom.classlist.enable(this.el, 'selected', this.selected_);
  this.updateThemeDisplay_();
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setSelected(this.selected_);
  }
};

/** @return {boolean} */
five.EventCard.prototype.isProposed = function() {
  return this.proposed_;
};

/** @param {boolean} proposed */
five.EventCard.prototype.setProposed = function(proposed) {
  if (!this.el) {
    this.createDom();
  }
  this.proposed_ = proposed;
  goog.dom.classlist.enable(this.el, 'proposed', this.proposed_);
  this.updateThemeDisplay_();
  this.updateSyncStatusDisplay_();
  if (this.timeAxisPatch_) {
    this.timeAxisPatch_.setProposed(this.proposed_);
  }
};

five.EventCard.prototype.timeAxisPatchUpdated = function() {
  var attachedToPatch = !!this.timeAxisPatch_ && this.timeAxisPatch_.getAttachedToEvent();
  if (this.wasAttachedToPatch_ === attachedToPatch) {
    return;
  }
  goog.dom.classlist.enable(this.el, 'attached-to-patch', attachedToPatch);
  this.wasAttachedToPatch_ = attachedToPatch;
};

five.EventCard.prototype.setVisibleRect = function(visibleRect) {
  this.visibleRect_ = visibleRect;
  this.updateVisibleRegion_();
};

five.EventCard.prototype.updateVisibleRegion_ = function() {
  if (!this.rect_ || !this.visibleRect_) {
    return;
  }
  var straddlingVisibleTop = (this.rect_.top < this.visibleRect_.top &&
    this.rect_.top + this.rect_.height > this.visibleRect_.top);
  if (straddlingVisibleTop) {
    var contentHeight = this.contentEl_.offsetHeight;
    var paddingTop = '';
    if (this.rect_.height - contentHeight > 20) {
      paddingTop = Math.max(0, this.visibleRect_.top - this.rect_.top) + 3 + 8;
      paddingTop = Math.min(paddingTop, this.rect_.height - contentHeight - 3);
    }
    this.el.style.paddingTop = paddingTop + 'px';
    this.straddlingVisibleTop_ = true;
  } else if (this.straddlingVisibleTop_) {
    this.el.style.paddingTop = '';
    this.straddlingVisibleTop_ = false;
  }
};

/**
 * @param {boolean} select
 * @param {boolean} shiftKey
 */
five.EventCard.prototype.dispatchSelectionEvent = function(select, shiftKey) {
  var event = new goog.events.Event(select ?
      five.Event.EventType.SELECT : five.Event.EventType.DESELECT);
  event.shiftKey = shiftKey;
  this.dispatchEvent(event);
};

/** @param {goog.events.BrowserEvent} e */
five.EventCard.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  this.dispatchSelectionEvent(!goog.dom.classlist.contains(this.el, 'selected'),
      e.shiftKey);
};

/** @param {goog.events.BrowserEvent} e */
five.EventCard.prototype.handleDblClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
  goog.dom.Range.clearSelection(window);
  this.dispatchEvent(new five.EventEditEvent(true));
};

/** @param {goog.events.BrowserEvent} e */
five.EventCard.prototype.handleMouseDown_ = function(e) {
  var pos = goog.style.getRelativePosition(e, this.el);
  var size = goog.style.getSize(this.el);
  var hitBoxMargin = five.deviceParams.getEventCardHitBoxMargin();
  if (pos.x < hitBoxMargin || pos.y < hitBoxMargin ||
      pos.x > size.width - hitBoxMargin || pos.y > size.height - hitBoxMargin) {
    return;
  }
  var event = new goog.events.Event(five.EventCard.EventType.MOUSEDOWN_INSIDE);
  this.dispatchEvent(event);
};
