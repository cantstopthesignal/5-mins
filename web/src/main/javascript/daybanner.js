// Copyright cantstopthesignals@gmail.com

goog.provide('five.DayBanner');

goog.require('five.Component');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.i18n.DateTimeFormat');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.DayBanner = function(date) {
  goog.base(this);

  /** @type {!goog.date.DateTime} */
  this.date_ = date;
};
goog.inherits(five.DayBanner, five.Component);

five.DayBanner.DATE_FORMAT = new goog.i18n.DateTimeFormat('EEEE, MMMM d');

/** @enum {string} */
five.DayBanner.EventType = {
  CLICK: goog.events.getUniqueId('click')
};

/** @type {five.EventsTimeline} */
five.DayBanner.prototype.owner_;

/** @type {Element} */
five.DayBanner.prototype.dateSpanEl_;

/** @param {five.EventsTimeline} owner */
five.DayBanner.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

five.DayBanner.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'day-banner');

  this.dateSpanEl_ = document.createElement('span');
  this.dateSpanEl_.appendChild(document.createTextNode(''));
  this.el.appendChild(this.dateSpanEl_);

  this.updateDisplay_();

  this.eventHandler.
      listen(this.dateSpanEl_, goog.events.EventType.MOUSEDOWN, this.handleMouseDown_);
};

/** @override */
five.DayBanner.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};

/** @return {!goog.date.DateTime} */
five.DayBanner.prototype.getDate = function() {
  return this.date_;
};

/** @param {!goog.date.DateTime} date */
five.DayBanner.prototype.setDate = function(date) {
  this.date_ = date.clone();
  if (this.el) {
    this.updateDisplay_();
  }
};

/** @param {goog.math.Rect} rect */
five.DayBanner.prototype.setRect = function(rect) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setWidth(this.el, rect.width);
};

/** @return {number} */
five.DayBanner.prototype.getHeight = function() {
  return (this.el ? this.el.offsetHeight : 0);
}

five.DayBanner.prototype.updateDisplay_ = function() {
  var dayText = five.DayBanner.DATE_FORMAT.format(this.date_);
  this.dateSpanEl_.firstChild.data = dayText;
};

/** @param {goog.events.BrowserEvent} e */
five.DayBanner.prototype.handleMouseDown_ = function(e) {
  e.preventDefault();
  e.stopPropagation();

  var event = new goog.events.Event(five.DayBanner.EventType.CLICK);
  event.shiftKey = e.shiftKey;
  this.dispatchEvent(event);
};
