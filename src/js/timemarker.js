// Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.TimeMarker');

goog.require('fivemins.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.style');

/**
 * @constructor
 * @extends {fivemins.Component}
 */
fivemins.TimeMarker = function(time) {
  /** @type {goog.date.DateTime} */
  this.time_ = time;
};
goog.inherits(fivemins.TimeMarker, fivemins.Component);


/** @type {fivemins.EventScrollBox} */
fivemins.TimeMarker.prototype.owner_;

/** @param {fivemins.EventScrollBox} owner */
fivemins.TimeMarker.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

/** @return {goog.date.DateTime} */
fivemins.TimeMarker.prototype.getTime = function() {
  return this.time_;
};

/** @param {goog.date.DateTime} time */
fivemins.TimeMarker.prototype.setTime = function(time) {
  this.time_ = time;
  if (this.el && this.owner_) {
    this.layout();
  }
};

fivemins.TimeMarker.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'time-marker');
};

fivemins.TimeMarker.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  this.layout();
  parentEl.appendChild(this.el);
};

fivemins.TimeMarker.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  var rect = this.owner_.getTimeMarkerRect(this.time_);
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

fivemins.TimeMarker.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};
