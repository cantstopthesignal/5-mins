// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeMarker');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.TimeMarker = function(time) {
  /** @type {goog.date.DateTime} */
  this.time_ = time;
};
goog.inherits(five.TimeMarker, five.Component);


/** @type {five.EventsScrollBox} */
five.TimeMarker.prototype.owner_;

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

/** @param {goog.date.DateTime} time */
five.TimeMarker.prototype.setTime = function(time) {
  this.time_ = time;
  if (this.el && this.owner_) {
    this.layout();
  }
};

five.TimeMarker.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'time-marker');
};

five.TimeMarker.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  this.layout();
  parentEl.appendChild(this.el);
};

five.TimeMarker.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  var rect = this.owner_.getTimeMarkerRect(this.time_);
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

/** @override */
five.TimeMarker.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};
