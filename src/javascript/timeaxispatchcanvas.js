//Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeAxisPatchCanvas');

goog.require('five.Component');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.math.Coordinate');
goog.require('goog.object');
goog.require('goog.style');


/**
 * @constructor
 * @extends {five.Component}
 */
five.TimeAxisPatchCanvas = function(width) {
  /** @type {number} */
  this.width_ = width;

  /** @type {Object.<five.TimeAxisPatch>} */
  this.patchMap_ = {};

  /** @type {Object.<five.TimeAxisPatchMarker>} */
  this.markerMap_ = {};

  /** @type {goog.math.Coordinate} */
  this.pos_ = new goog.math.Coordinate(0, 0);
};
goog.inherits(five.TimeAxisPatchCanvas, five.Component);

/** @type {Object} */
five.TimeAxisPatchCanvas.prototype.ctx_;

/** @type {number} */
five.TimeAxisPatchCanvas.prototype.batchUpdateDepth_ = 0;

/** @type {boolean} */
five.TimeAxisPatchCanvas.prototype.paintNeeded_ = false;

/** @type {number} */
five.TimeAxisPatchCanvas.prototype.topOffset_ = 0;

/** @type {number} */
five.TimeAxisPatchCanvas.prototype.height_ = 0;

five.TimeAxisPatchCanvas.prototype.createDom = function() {
  goog.asserts.assert(!this.el);
  this.el = document.createElement('canvas');
  goog.dom.classes.add(this.el, 'time-axis-patch-canvas');
  this.el.setAttribute('width', this.width_ + 'px');
  this.ctx_ = this.el.getContext('2d');
};

five.TimeAxisPatchCanvas.prototype.addPatch = function(patch) {
  patch.setOwner(this);
  var patchUid = goog.getUid(patch);
  goog.asserts.assert(!goog.object.containsKey(this.patchMap_, patchUid));
  this.patchMap_[patchUid] = patch;
  this.paint();
};

five.TimeAxisPatchCanvas.prototype.removePatch = function(patch) {
  patch.setOwner(null);
  delete this.patchMap_[goog.getUid(patch)];
  if (!this.isDisposed()) {
    this.paint();
  }
};

five.TimeAxisPatchCanvas.prototype.addMarker = function(marker) {
  marker.setOwner(this);
  var markerUid = goog.getUid(marker);
  goog.asserts.assert(!goog.object.containsKey(this.markerMap_, markerUid));
  this.markerMap_[markerUid] = marker;
  this.paint();
};

five.TimeAxisPatchCanvas.prototype.removeMarker = function(marker) {
  marker.setOwner(null);
  delete this.markerMap_[goog.getUid(marker)];
  if (!this.isDisposed()) {
    this.paint();
  }
};

five.TimeAxisPatchCanvas.prototype.setPosition = function(pos) {
  this.pos_ = pos;
  goog.style.setPosition(this.el, this.pos_.x, this.pos_.y + this.topOffset_);
};

five.TimeAxisPatchCanvas.prototype.paint = function() {
  if (this.batchUpdateDepth_) {
    this.paintNeeded_ = true;
  } else {
    this.doPaint_();
  }
};

five.TimeAxisPatchCanvas.prototype.startBatchUpdate = function() {
  this.batchUpdateDepth_++;
};

five.TimeAxisPatchCanvas.prototype.finishBatchUpdate = function() {
  this.batchUpdateDepth_--;
  goog.asserts.assert(this.batchUpdateDepth_ >= 0);
  if (!this.batchUpdateDepth_ && this.paintNeeded_) {
    this.doPaint_();
  }
};

five.TimeAxisPatchCanvas.prototype.doPaint_ = function() {
  this.doPaintUpdateRect_();

  this.ctx_.clearRect(0, 0, this.width_, this.height_);

  this.ctx_.lineWidth = 1;
  this.ctx_.lineCap = 'square';

  goog.object.forEach(this.patchMap_, function(patch) {
    if (patch.getAttachedToEvent()) {
      this.fillPatch_(patch);
    }
  }, this);
  goog.object.forEach(this.patchMap_, function(patch) {
    this.strokePatch_(patch);
  }, this);
  goog.object.forEach(this.markerMap_, function(marker) {
    this.strokeMarker_(marker);
  }, this);

  this.paintNeeded_ = false;
};

five.TimeAxisPatchCanvas.prototype.fillPatch_ = function(patch) {
  var theme = patch.eventTheme;
  this.ctx_.fillStyle = patch.selected ? theme.selectedBgColor :
      theme.bgColor;
  this.ctx_.beginPath();
  this.ctx_.moveTo(0, this.yPosToCanvas_(patch.axisTop));
  this.ctx_.lineTo(1, this.yPosToCanvas_(patch.axisTop));
  this.ctx_.lineTo(this.width_ - 1, this.yPosToCanvas_(patch.eventTop));
  this.ctx_.lineTo(this.width_, this.yPosToCanvas_(patch.eventTop));
  this.ctx_.lineTo(this.width_, this.yPosToCanvas_(patch.eventBottom));
  this.ctx_.lineTo(this.width_ - 1, this.yPosToCanvas_(patch.eventBottom));
  this.ctx_.lineTo(1, this.yPosToCanvas_(patch.axisBottom));
  this.ctx_.lineTo(0, this.yPosToCanvas_(patch.axisBottom));
  this.ctx_.closePath();
  this.ctx_.fill();
};

five.TimeAxisPatchCanvas.prototype.strokePatch_ = function(patch) {
  var theme = patch.eventTheme;
  this.ctx_.strokeStyle = patch.selected ? theme.selectedBorderColor :
      theme.borderColor;
  this.ctx_.lineWidth = 1;
  this.strokePatchLine_(patch.axisTop, patch.eventTop);
  this.strokePatchLine_(patch.axisBottom, patch.eventBottom);
  if (patch.getAttachedToEvent()) {
    this.ctx_.beginPath();
    this.ctx_.moveTo(0, this.yPosToCanvas_(patch.axisTop) + 0.5);
    this.ctx_.lineTo(0, this.yPosToCanvas_(patch.axisBottom) + 0.5);
    this.ctx_.stroke();
  }
};

five.TimeAxisPatchCanvas.prototype.strokeMarker_ = function(marker) {
  this.ctx_.strokeStyle = marker.theme.color;
  this.ctx_.lineWidth = 2;
  this.strokePatchLine_(marker.axisYPos + 0.5, marker.eventYPos + 0.5);
};

five.TimeAxisPatchCanvas.prototype.strokePatchLine_ = function(
    axisYPos, eventYPos) {
  this.ctx_.beginPath();
  this.ctx_.moveTo(0, this.yPosToCanvas_(axisYPos) + 0.5);
  this.ctx_.lineTo(1, this.yPosToCanvas_(axisYPos) + 0.5);
  this.ctx_.lineTo(this.width_ - 1, this.yPosToCanvas_(eventYPos) + 0.5);
  this.ctx_.lineTo(this.width_, this.yPosToCanvas_(eventYPos) + 0.5);
  this.ctx_.stroke();
};

five.TimeAxisPatchCanvas.prototype.doPaintUpdateRect_ = function() {
  var minYPos = null, maxYPos = null;
  goog.object.forEach(this.patchMap_, function(patch) {
    var min = Math.min(patch.axisTop, patch.eventTop);
    if (minYPos === null || min < minYPos) {
      minYPos = min;
    }
    var max = Math.max(patch.axisBottom, patch.eventBottom);
    if (maxYPos === null || max > maxYPos) {
      maxYPos = max;
    }
  }, this);
  goog.object.forEach(this.markerMap_, function(marker) {
    var min = Math.min(marker.axisYPos, marker.eventYPos);
    if (minYPos === null || min < minYPos) {
      minYPos = min;
    }
    var max = Math.max(marker.axisYPos, marker.eventYPos);
    if (maxYPos === null || max > maxYPos) {
      maxYPos = max;
    }
  }, this);
  var oldTopOffset = this.topOffset_;
  this.topOffset_ = minYPos || 0;
  if (oldTopOffset != this.topOffset_) {
    goog.style.setPosition(this.el, this.pos_.x, this.pos_.y + this.topOffset_);
  }
  var oldHeight = this.height_;
  this.height_ = maxYPos - minYPos + 1;
  if (oldHeight != this.height_) {
    this.el.setAttribute('height', this.height_ + 'px');
  }
};

five.TimeAxisPatchCanvas.prototype.yPosToCanvas_ = function(yPos) {
  return yPos - this.topOffset_;
};
