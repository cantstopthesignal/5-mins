// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeAxisPatch');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.TimeAxisPatch = function() {
  goog.base(this);
};
goog.inherits(five.TimeAxisPatch, goog.events.EventTarget);

/** @type {five.TimeAxisPatchCanvas} */
five.TimeAxisPatch.prototype.owner_;

/** @type {boolean} */
five.TimeAxisPatch.prototype.attachedToEvent_ = false;

/** @type {five.EventTheme} */
five.TimeAxisPatch.prototype.eventTheme;

/** @type {boolean} */
five.TimeAxisPatch.prototype.selected = false;

/** @type {number} */
five.TimeAxisPatch.prototype.axisTop;

/** @type {number} */
five.TimeAxisPatch.prototype.axisBottom;

/** @type {number} */
five.TimeAxisPatch.prototype.eventTop;

/** @type {number} */
five.TimeAxisPatch.prototype.eventBottom;

/** @return {five.TimeAxisPatchCanvas} */
five.TimeAxisPatch.prototype.getOwner = function() {
  return this.owner_;
};

/** @param {five.TimeAxisPatchCanvas} owner */
five.TimeAxisPatch.prototype.setOwner = function(owner) {
  this.owner_ = owner;
};

/** @return {boolean} */
five.TimeAxisPatch.prototype.getAttachedToEvent = function() {
  return this.attachedToEvent_;
};

/** @param {five.EventTheme} eventTheme */
five.TimeAxisPatch.prototype.setEventTheme = function(eventTheme) {
  this.eventTheme = eventTheme;
};

/**
 * @param {number} axisTop
 * @param {number} axisBottom
 * @param {number} eventTop
 * @param {number} eventBottom
 * @param {boolean} attachedToEvent
 */
five.TimeAxisPatch.prototype.setParams = function(axisTop, axisBottom,
    eventTop, eventBottom, attachedToEvent) {
  this.axisTop = axisTop;
  this.axisBottom = axisBottom;
  this.eventTop = eventTop;
  this.eventBottom = eventBottom;
  this.attachedToEvent_ = attachedToEvent;
  if (this.owner_) {
    this.owner_.paint();
  }
};

/** @param {boolean} selected */
five.TimeAxisPatch.prototype.setSelected = function(selected) {
  this.selected = selected;
  if (this.owner_) {
    this.owner_.paint();
  }
};

/** @override */
five.TimeAxisPatch.prototype.disposeInternal = function() {
  if (this.owner_) {
    this.owner_.removePatch(this);
    goog.asserts.assert(!this.owner_);
  }
  goog.base(this, 'disposeInternal');
};
