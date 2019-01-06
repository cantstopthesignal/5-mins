// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsSummaryDialog');

goog.require('five.Dialog');
goog.require('goog.asserts');
goog.require('goog.async.Deferred');
goog.require('goog.debug.Logger');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');

/**
 * @param {!five.AppContext} appContext
 * @param {!string} title
 * @param {!Array.<!five.Event>} events
 * @param {!goog.date.DateTime} startTime
 * @param {!goog.date.DateTime} endTime
 * @constructor
 * @extends {five.Dialog}
 */
five.EventsSummaryDialog = function(appContext, title, events, startTime, endTime) {
  goog.base(this);

  /** @type {!five.AppContext} */
  this.appContext_ = appContext;

  /** @type {!five.NotificationManager} */
  this.notificationManager_ = five.NotificationManager.get(this.appContext_);

  /** @type {!string} */
  this.title_ = title;

  /** @type {!Array.<!five.Event>} */
  this.events_ = events;

  /** @type {!goog.date.DateTime} */
  this.startTime_ = startTime;

  /** @type {!goog.date.DateTime} */
  this.endTime_ = endTime;

  /** @type {Element} */
  this.oldFocusEl_;
};
goog.inherits(five.EventsSummaryDialog, five.Dialog);

/** @type {Element} */
five.EventsSummaryDialog.prototype.summaryEl_;

five.EventsSummaryDialog.prototype.createDom = function() {
  goog.base(this, 'createDom');
  var contentEl = this.getContentEl();

  goog.dom.classes.add(contentEl, 'events-summary-dialog');

  var headerEl = document.createElement('div');
  goog.dom.classes.add(headerEl, 'title');
  headerEl.appendChild(document.createTextNode(this.title_));
  contentEl.appendChild(headerEl);

  this.summaryEl_ = document.createElement('div');
  goog.dom.classes.add(this.summaryEl_, 'summary');
  this.summaryEl_.setAttribute('tabindex', '0');
  contentEl.appendChild(this.summaryEl_);

  var doneButtonEl = document.createElement('div');
  goog.dom.classes.add(doneButtonEl, 'button');
  this.eventHandler.listen(doneButtonEl, goog.events.EventType.CLICK,
      this.handleDoneClick_);
  doneButtonEl.appendChild(document.createTextNode('Done'));
  contentEl.appendChild(doneButtonEl);

  this.createSummary_();

  this.eventHandler.
      listen(this.el, goog.events.EventType.KEYUP, this.handleKeyUp_);
};

/** @override */
five.EventsSummaryDialog.prototype.show = function() {
  goog.base(this, 'show');

  this.oldFocusEl_ = document.activeElement;
  this.summaryEl_.focus();
};

/** @override */
five.EventsSummaryDialog.prototype.hide = function() {
  goog.base(this, 'hide');
  if (this.oldFocusEl_) {
    this.oldFocusEl_.focus();
  }
  goog.dispose(this);
};

five.EventsSummaryDialog.prototype.createSummary_ = function() {
  var summaryDurationMap = {};

  goog.array.forEach(this.events_, function(event) {
    var startTimeCapped = Math.max(event.getStartTime(), this.startTime_.getTime());
    var endTimeCapped = Math.min(event.getEndTime(), this.endTime_.getTime());

    var matchedDuration = endTimeCapped - startTimeCapped;
    if (matchedDuration <= 0) {
      return;
    }

    var summaries = event.getSplitSummaries();
    matchedDuration /= summaries.length;
    for (var i = 0; i < summaries.length; i++) {
      summaryDurationMap[summaries[i]] = (summaryDurationMap[summaries[i]] || 0) +
          matchedDuration;
    }
  }, this);

  var summaryDurationList = [];
  for (var summary in summaryDurationMap) {
    summaryDurationList.push([summary, summaryDurationMap[summary]]);
  }
  summaryDurationList.sort(function(a, b) {return b[1] - a[1];});

  var tableEl = document.createElement('table');

  goog.array.forEach(summaryDurationList, function(entry) {
    var summary = entry[0];
    var duration = entry[1];
    var durationMins = Math.floor(summaryDurationMap[summary] / 1000 / 60);
    var hours = Math.floor(durationMins / 60);
    var mins = durationMins - hours * 60;
    var hoursStr = (hours > 0 ? "" + hours + " hours " : "");
    var minutesStr = mins + " minutes";

    var rowEl = document.createElement('tr');
    var hoursCell = document.createElement('td');
    goog.dom.classes.add(hoursCell, 'hours');
    hoursCell.appendChild(document.createTextNode(hoursStr));
    rowEl.appendChild(hoursCell);
    var minutesCell = document.createElement('td');
    goog.dom.classes.add(minutesCell, 'minutes');
    minutesCell.appendChild(document.createTextNode(minutesStr));
    rowEl.appendChild(minutesCell);
    var summaryCell = document.createElement('td');
    summaryCell.appendChild(document.createTextNode(summary));
    rowEl.appendChild(summaryCell);
    tableEl.appendChild(rowEl);
  }, this);

  this.summaryEl_.appendChild(tableEl);
}

five.EventsSummaryDialog.prototype.done_ = function() {
  this.hide();
};

five.EventsSummaryDialog.prototype.handleDoneClick_ = function() {
  this.done_();
};

/** @param {goog.events.BrowserEvent} e */
five.EventsSummaryDialog.prototype.handleKeyUp_ = function(e) {
  if (e.keyCode == goog.events.KeyCodes.ESC ||
      e.keyCode == goog.events.KeyCodes.ENTER) {
    this.done_();
    e.preventDefault();
  }
};
