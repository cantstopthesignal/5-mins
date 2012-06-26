// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeMarker');

goog.require('five.Component');
goog.require('five.TimeMarkerTheme');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @param {!goog.date.DateTime} time
 * @param {five.TimeMarkerTheme=} opt_theme
 * @constructor
 * @extends {five.Component}
 */
five.TimeMarker = function(time, opt_theme) {
  /** @type {!goog.date.DateTime} */
  this.time_ = time;

  /** @type {!five.TimeMarkerTheme} */
  this.theme_ = opt_theme || five.TimeMarkerTheme.DEFAULT;
};
goog.inherits(five.TimeMarker, five.Component);

five.TimeMarker.toTimeString_ = function(date) {
  var str = date.toUsTimeString(false, false, false);
  return str;
};

/** @type {five.EventsTimeline} */
five.TimeMarker.prototype.owner_;

/** @type {Element} */
five.TimeMarker.prototype.labelEl_;

/** @type {five.TimeAxisPatchMarker} */
five.TimeMarker.prototype.timeAxisPatchMarker_;

/** @param {five.EventsTimeline} owner */
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
  this.el.style.borderColor = this.theme_.color;

  if (five.deviceParams.getShowTimeMarkerLabels()) {
    this.labelEl_ = document.createElement('div');
    goog.dom.classes.add(this.labelEl_, 'time-marker-label');
    this.labelEl_.style.color = this.theme_.labelColor;

    this.labelEl_.appendChild(document.createTextNode(
        five.TimeMarker.toTimeString_(this.time_)));
  }
};

five.TimeMarker.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  this.layout();
  parentEl.appendChild(this.el);
  if (this.labelEl_) {
    parentEl.appendChild(this.labelEl_);
  }
};

five.TimeMarker.prototype.setVisible = function(visible) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.showElement(this.el, visible);
  if (this.labelEl_) {
    goog.style.showElement(this.labelEl_, visible);
  }
};

five.TimeMarker.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  this.owner_.layoutTimeMarker(this);
};

five.TimeMarker.prototype.setRect = function(rect) {
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

five.TimeMarker.prototype.setLabelRect = function(rect) {
  if (!this.labelEl_) {
    return;
  }
  goog.style.setPosition(this.labelEl_, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.labelEl_, rect.getSize());
};

/** @param {five.TimeAxisPatchMarker} patchMarker */
five.TimeMarker.prototype.setTimeAxisPatchMarker = function(patchMarker) {
  goog.dispose(this.timeAxisPatchMarker_);
  this.timeAxisPatchMarker_ = patchMarker;
  if (this.timeAxisPatchMarker_) {
    this.timeAxisPatchMarker_.setTheme(this.theme_);
  }
};

/** @return {five.TimeAxisPatchMarker} */
five.TimeMarker.prototype.getTimeAxisPatchMarker = function() {
  return this.timeAxisPatchMarker_;
};

/** @override */
five.TimeMarker.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.dispose(this.timeAxisPatchMarker_);
  goog.base(this, 'disposeInternal');
};
