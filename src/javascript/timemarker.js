// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeMarker');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @param {!goog.date.DateTime} time
 * @param {five.TimeMarker.Color=} opt_color
 * @constructor
 * @extends {five.Component}
 */
five.TimeMarker = function(time, opt_color) {
  /** @type {!goog.date.DateTime} */
  this.time_ = time;

  /** @type {!five.TimeMarker.Color} */
  this.color_ = opt_color || five.TimeMarker.Color.DEFAULT;
};
goog.inherits(five.TimeMarker, five.Component);

/** @enum {string} */
five.TimeMarker.Color = {
  DEFAULT: 'default-color',
  NOW: 'now-color',
  CURSOR: 'cursor-color'
};

five.TimeMarker.toTimeString_ = function(date) {
  var str = date.toUsTimeString(false, false, false);
  if (date.getHours() >= 12) {
    str += 'p';
  }
  return str;
};

/** @type {five.EventsScrollBox} */
five.TimeMarker.prototype.owner_;

/** @type {Element} */
five.TimeMarker.prototype.labelEl_;

/** @param {five.EventsScrollBox} owner */
five.TimeMarker.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

/** @return {goog.date.DateTime} */
five.TimeMarker.prototype.getTime = function() {
  return this.time_;
};

/** @param {!goog.date.DateTime} time */
five.TimeMarker.prototype.setTime = function(time) {
  this.time_ = time;
  if (this.el && this.owner_) {
    this.layout();
  }
  if (this.labelEl_) {
    this.labelEl_.firstChild.data = five.TimeMarker.toTimeString_(this.time_);
  }
};

five.TimeMarker.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'time-marker');
  goog.dom.classes.add(this.el, this.color_);

  this.labelEl_ = document.createElement('div');
  goog.dom.classes.add(this.labelEl_, 'time-marker-label');
  goog.dom.classes.add(this.labelEl_, this.color_);

  this.labelEl_.appendChild(document.createTextNode(
      five.TimeMarker.toTimeString_(this.time_)));
};

five.TimeMarker.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  this.layout();
  parentEl.appendChild(this.el);
  parentEl.appendChild(this.labelEl_);
};

five.TimeMarker.prototype.setVisible = function(visible) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.showElement(this.el, visible);
  goog.style.showElement(this.labelEl_, visible);
};

five.TimeMarker.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  var rect = this.owner_.getTimeMarkerRect(this.time_);
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
  var labelRect = this.owner_.getTimeMarkerLabelRect(this.time_);
  goog.style.setPosition(this.labelEl_, labelRect.left, labelRect.top);
  goog.style.setBorderBoxSize(this.labelEl_, labelRect.getSize());
};

/** @override */
five.TimeMarker.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};
