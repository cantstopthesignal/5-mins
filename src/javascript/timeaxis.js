// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeAxis');

goog.require('five.Component');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.date.Date');
goog.require('goog.date.DateRange');
goog.require('goog.date.Interval');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.object');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.TimeAxis = function() {
  goog.base(this);

  /** @type {!Array.<!five.TimeAxis.Entry>} */
  this.entries_ = [];

  /** @type {!Object.<five.TimeAxis.Entry>} */
  this.amPmVisibleEntryMap_ = {};
};
goog.inherits(five.TimeAxis, five.Component);

/** @type {goog.date.DateTime} */
five.TimeAxis.prototype.startDate_;

/** @type {goog.date.DateTime} */
five.TimeAxis.prototype.endDate_;

/** @type {five.EventsTimeline} */
five.TimeAxis.prototype.owner_;

/** @type {goog.math.Rect} */
five.TimeAxis.prototype.visibleRect_;

/** @type {boolean} */
five.TimeAxis.prototype.layoutOccurred_;

/** @param {five.EventsTimeline} owner */
five.TimeAxis.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

five.TimeAxis.prototype.setDateRange = function(startDate, endDate) {
  this.startDate_ = startDate;
  this.endDate_ = endDate;
  this.maybeRenderEntries_();
};

five.TimeAxis.prototype.createDom = function() {
  goog.base(this, 'createDom');
  this.maybeRenderEntries_();
};

/** @override */
five.TimeAxis.prototype.disposeInternal = function() {
  goog.disposeAll(this.entries_);
  goog.base(this, 'disposeInternal');
};

five.TimeAxis.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  goog.array.forEach(this.entries_, function(entry) {
    this.owner_.layoutTimeAxisEntry(entry);
  }, this);
  this.layoutOccurred_ = true;
  this.updateAmPmVisibility_();
};

five.TimeAxis.prototype.updateVisibleRegion = function(visibleRect) {
  this.visibleRect_ = visibleRect;
  if (!this.el) {
    return;
  }
  this.updateAmPmVisibility_();
};

five.TimeAxis.prototype.maybeRenderEntries_ = function() {
  if (!this.startDate_ || !this.endDate_ || !this.el || !this.owner_) {
    return;
  }
  var foundEntryKeys = {};
  var entryMap = {};
  goog.object.forEach(this.entries_, function(entry) {
    entryMap[entry.getHour().toString()] = entry;
  }, this);
  five.util.forEachHourRangeWrap(this.startDate_, this.endDate_, function(
      hour, nextHour) {
    var entryKey = hour.toString();
    var entry = entryMap[entryKey];
    if (!entry) {
      entry = new five.TimeAxis.Entry(hour, nextHour);
      entry.render(this.el);
      entryMap[entryKey] = entry;
    }
    foundEntryKeys[entryKey] = true;
  }, this);
  for (var entryKey in entryMap) {
    if (!(entryKey in foundEntryKeys)) {
      goog.dispose(entryMap[entryKey]);
    }
  }
  this.entries_ = goog.object.getValues(entryMap);
  this.entries_.sort(function(a, b) {
    return goog.date.Date.compare(a.getHour(), b.getHour());
  });
};

five.TimeAxis.prototype.updateAmPmVisibility_ = function() {
  if (!this.el || !this.layoutOccurred_ || !this.visibleRect_) {
    return;
  }
  var visibleBottom = this.visibleRect_.top + this.visibleRect_.height;
  var firstIndex = -goog.array.binarySelect(this.entries_, function(entry) {
    return (this.visibleRect_.top - entry.timeBoxRect.top) || 1;
  }, this) - 1;
  var lastAmPmEntry;
  var foundEntryKeys = {};
  for (var i = Math.max(0, firstIndex); i < this.entries_.length; i++) {
    var entry = this.entries_[i];
    if (entry.timeBoxRect.top > visibleBottom) {
      break;
    }
    if (!lastAmPmEntry || lastAmPmEntry.isPm != entry.isPm) {
      var entryKey = entry.getHour().toString();
      entry.setAmPmVisible(true);
      foundEntryKeys[entryKey] = true;
      this.amPmVisibleEntryMap_[entryKey] = entry;
      lastAmPmEntry = entry;
    }
  }
  var keysToRemove = {};
  goog.object.forEach(this.amPmVisibleEntryMap_, function(entry, entryKey) {
    if (!(entryKey in foundEntryKeys)) {
      entry.setAmPmVisible(false);
      keysToRemove[entryKey] = true;
    }
  });
  for (var entryKey in keysToRemove) {
    delete this.amPmVisibleEntryMap_[entryKey];
  }
};

/**
 * @param {!goog.date.DateTime} hour
 * @param {!goog.date.DateTime} nextHour
 * @constructor
 * @extends {five.Component}
 */
five.TimeAxis.Entry = function(hour, nextHour) {
  /** @type {!goog.date.DateTime} */
  this.hour_ = hour;

  /** @type {boolean} */
  this.isPm = this.hour_.getHours() >= 12;

  /** @type {!goog.date.DateTime} */
  this.nextHour_ = nextHour;
};
goog.inherits(five.TimeAxis.Entry, five.Component);

/** @type {Element} */
five.TimeAxis.Entry.prototype.timeBoxEl_;

/** @type {goog.math.Rect} */
five.TimeAxis.Entry.prototype.timeBoxRect;

/** @type {Element} */
five.TimeAxis.Entry.prototype.amPmEl_;

/** @type {boolean} */
five.TimeAxis.Entry.prototype.amPmVisible_ = false;

/** @return {!goog.date.DateTime} */
five.TimeAxis.Entry.prototype.getHour = function() {
  return this.hour_;
};

/** @return {!goog.date.DateTime} */
five.TimeAxis.Entry.prototype.getNextHour = function() {
  return this.nextHour_;
};

five.TimeAxis.Entry.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'time-axis');

  this.timeBoxEl_ = document.createElement('div');
  goog.dom.classes.add(this.timeBoxEl_, 'time-box');
  var hours = (this.hour_.getHours() % 12) || 12;
  this.timeBoxEl_.appendChild(document.createTextNode('' + hours));
  this.el.appendChild(this.timeBoxEl_);

  this.amPmEl_ = document.createElement('div');
  goog.dom.classes.add(this.amPmEl_, 'ampm');
  this.amPmEl_.appendChild(document.createTextNode(this.isPm ? 'PM' : 'AM'));
  goog.style.showElement(this.amPmEl_, this.amPmVisible_);
  this.timeBoxEl_.appendChild(this.amPmEl_);
};

five.TimeAxis.Entry.prototype.setAmPmVisible = function(visible) {
  if (this.amPmVisible_ != visible && this.el) {
    goog.style.showElement(this.amPmEl_, visible);
  }
  this.amPmVisible_ = visible;
};

five.TimeAxis.Entry.prototype.setTimeBoxRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  this.timeBoxRect = rect;
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setHeight(this.el, rect.height);
  goog.style.setWidth(this.timeBoxEl_, rect.width);
};
