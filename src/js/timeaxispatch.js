//Copyright cantstopthesignals@gmail.com

goog.provide('fivemins.TimeAxisPatch');

goog.require('goog.asserts');
goog.require('goog.events.EventTarget');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
fivemins.TimeAxisPatch = function() {
};
goog.inherits(fivemins.TimeAxisPatch, goog.events.EventTarget);

/** @type {fivemins.TimeAxisPatchCanvas} */
fivemins.TimeAxisPatch.prototype.owner_;

/** @type {boolean} */
fivemins.TimeAxisPatch.prototype.attachedToEvent_ = false;

/** @type {number} */
fivemins.TimeAxisPatch.prototype.axisTop = false;

/** @type {number} */
fivemins.TimeAxisPatch.prototype.axisBottom;

/** @type {number} */
fivemins.TimeAxisPatch.prototype.eventTop;

/** @type {number} */
fivemins.TimeAxisPatch.prototype.eventBottom;

/** @type {string} */
fivemins.TimeAxisPatch.prototype.eventBgColor = 'rgba(200, 200, 255, 0.8)';

/** @type {string} */
fivemins.TimeAxisPatch.prototype.eventBorderColor = '#88f';

/** @return {fivemins.TimeAxisPatchCanvas} */
fivemins.TimeAxisPatch.prototype.getOwner = function() {
  return this.owner_;
};

/** @param {fivemins.TimeAxisPatchCanvas} owner */
fivemins.TimeAxisPatch.prototype.setOwner = function(owner) {
  this.owner_ = owner;
};

/** @return {boolean} */
fivemins.TimeAxisPatch.prototype.getAttachedToEvent = function() {
  return this.attachedToEvent_;
};

fivemins.TimeAxisPatch.prototype.setParams = function(axisTop, axisBottom,
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

fivemins.TimeAxisPatch.prototype.disposeInternal = function() {
  if (this.owner_) {
    this.owner_.removePatch(this);
    goog.asserts.assert(!this.owner_);
  }
  goog.base(this, 'disposeInternal');
};
