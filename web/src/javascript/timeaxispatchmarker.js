// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeAxisPatchMarker');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.TimeAxisPatchMarker = function() {
  goog.base(this);
};
goog.inherits(five.TimeAxisPatchMarker, goog.events.EventTarget);

/** @type {five.TimeAxisPatchCanvas} */
five.TimeAxisPatchMarker.prototype.owner_;

/** @type {five.TimeMarkerTheme} */
five.TimeAxisPatchMarker.prototype.theme;

/** @type {boolean} */
five.TimeAxisPatchMarker.prototype.visible = true;

/** @type {number} */
five.TimeAxisPatchMarker.prototype.axisYPos;

/** @type {number} */
five.TimeAxisPatchMarker.prototype.eventYPos;

/** @return {five.TimeAxisPatchCanvas} */
five.TimeAxisPatchMarker.prototype.getOwner = function() {
  return this.owner_;
};

/** @param {five.TimeAxisPatchCanvas} owner */
five.TimeAxisPatchMarker.prototype.setOwner = function(owner) {
  this.owner_ = owner;
};

/** @param {five.TimeMarkerTheme} theme */
five.TimeAxisPatchMarker.prototype.setTheme = function(theme) {
  this.theme = theme;
};

/** @param {boolean} visible */
five.TimeAxisPatchMarker.prototype.setVisible = function(visible) {
  this.visible = visible;
  if (this.owner_) {
    this.owner_.paint();
  }
};

/**
 * @param {number} axisYPos
 * @param {number} eventYPos
 */
five.TimeAxisPatchMarker.prototype.setParams = function(axisYPos, eventYPos) {
  this.axisYPos = axisYPos;
  this.eventYPos = eventYPos;
  if (this.owner_) {
    this.owner_.paint();
  }
};

/** @override */
five.TimeAxisPatchMarker.prototype.disposeInternal = function() {
  if (this.owner_) {
    this.owner_.removeMarker(this);
    goog.asserts.assert(!this.owner_);
  }
  goog.base(this, 'disposeInternal');
};
