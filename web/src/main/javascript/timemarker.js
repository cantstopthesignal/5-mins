// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeMarker');
goog.provide('five.TimeMarker.Component');

goog.require('five.Component');
goog.require('five.TimeMarkerTheme');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @param {!goog.date.DateTime} time
 * @param {five.TimeMarkerTheme=} opt_theme
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.TimeMarker = function(time, opt_theme) {
  /** @type {!goog.date.DateTime} */
  this.time_ = time;

  /** @type {!five.TimeMarkerTheme} */
  this.theme_ = opt_theme || five.TimeMarkerTheme.DEFAULT;

  /** @type {!Array.<!five.TimeMarker.Component>} */
  this.components_ = [];
};
goog.inherits(five.TimeMarker, goog.events.EventTarget);

/** @type {boolean} */
five.TimeMarker.prototype.visible_ = true;

/** @return {goog.date.DateTime} */
five.TimeMarker.prototype.getTime = function() {
  return this.time_;
};

/** @param {!goog.date.DateTime} time */
five.TimeMarker.prototype.setTime = function(time) {
  this.time_ = time;
  goog.array.forEach(this.components_, function(component) {
    component.setTime(this.time_);
  }, this);
};

five.TimeMarker.prototype.isVisible = function() {
  return this.visible_;
};

five.TimeMarker.prototype.setVisible = function(visible) {
  this.visible_ = visible;
  goog.array.forEach(this.components_, function(component) {
    component.setVisible(visible);
  }, this);
};

/** @return {!five.TimeMarker.Component} */
five.TimeMarker.prototype.createComponent = function() {
  var component = new five.TimeMarker.Component(this, this.time_, this.theme_);
  this.components_.push(component);
  return component;
};

/** @param {!five.TimeMarker.Component} component */
five.TimeMarker.prototype.releaseComponent = function(component) {
  var index = this.components_.indexOf(component);
  goog.asserts.assert(index >= 0);
  this.components_.splice(index, 1);
};

/**
 * @param {!five.TimeMarker} timeMarker
 * @param {!goog.date.DateTime} time
 * @param {!five.TimeMarkerTheme} theme
 * @constructor
 * @extends {five.Component}
 */
five.TimeMarker.Component = function(timeMarker, time, theme) {
  /** @type {!five.TimeMarker} */
  this.timeMarker_ = timeMarker;

  /** @type {!goog.date.DateTime} */
  this.time_ = time;

  /** @type {!five.TimeMarkerTheme} */
  this.theme_ = theme;
};
goog.inherits(five.TimeMarker.Component, five.Component);

five.TimeMarker.Component.toTimeString_ = function(date) {
  var str = date.toUsTimeString(false, false, false);
  return str;
};

/** @type {five.EventsTimeline} */
five.TimeMarker.Component.prototype.owner_;

/** @type {Element} */
five.TimeMarker.Component.prototype.labelEl_;

/** @type {boolean} */
five.TimeMarker.Component.prototype.visible_ = true;

/** @type {five.TimeAxisPatchMarker} */
five.TimeMarker.Component.prototype.timeAxisPatchMarker_;

/** @param {five.EventsTimeline} owner */
five.TimeMarker.Component.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

/** @return {goog.date.DateTime} */
five.TimeMarker.Component.prototype.getTime = function() {
  return this.time_;
};

/** @param {!goog.date.DateTime} time */
five.TimeMarker.Component.prototype.setTime = function(time) {
  this.time_ = time;
  if (this.el && this.owner_) {
    this.layout();
  }
  if (this.labelEl_) {
    this.labelEl_.firstChild.data = five.TimeMarker.Component.toTimeString_(
        this.time_);
  }
};

five.TimeMarker.Component.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'time-marker');
  this.el.style.borderColor = this.theme_.color;

  if (five.deviceParams.getShowTimeMarkerLabels()) {
    this.labelEl_ = document.createElement('div');
    goog.dom.classlist.add(this.labelEl_, 'time-marker-label');
    this.labelEl_.style.color = this.theme_.labelColor;

    this.labelEl_.appendChild(document.createTextNode(
        five.TimeMarker.Component.toTimeString_(this.time_)));
  }
};

five.TimeMarker.Component.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  this.layout();
  parentEl.appendChild(this.el);
  if (this.labelEl_) {
    parentEl.appendChild(this.labelEl_);
  }
};

five.TimeMarker.Component.prototype.setVisible = function(visible) {
  if (!this.el) {
    this.createDom();
  }
  this.visible_ = visible;
  goog.style.setElementShown(this.el, visible);
  if (this.labelEl_) {
    goog.style.setElementShown(this.labelEl_, visible);
  }
  if (this.timeAxisPatchMarker_) {
    this.timeAxisPatchMarker_.setVisible(this.visible_);
  }
};

five.TimeMarker.Component.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  this.owner_.layoutTimeMarker(this);
};

five.TimeMarker.Component.prototype.setRect = function(rect) {
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

five.TimeMarker.Component.prototype.setLabelRect = function(rect) {
  if (!this.labelEl_) {
    return;
  }
  goog.style.setPosition(this.labelEl_, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.labelEl_, rect.getSize());
};

/** @param {five.TimeAxisPatchMarker} patchMarker */
five.TimeMarker.Component.prototype.setTimeAxisPatchMarker = function(patchMarker) {
  goog.dispose(this.timeAxisPatchMarker_);
  this.timeAxisPatchMarker_ = patchMarker;
  if (this.timeAxisPatchMarker_) {
    this.timeAxisPatchMarker_.setTheme(this.theme_);
    this.timeAxisPatchMarker_.setVisible(this.visible_);
  }
};

/** @return {five.TimeAxisPatchMarker} */
five.TimeMarker.Component.prototype.getTimeAxisPatchMarker = function() {
  return this.timeAxisPatchMarker_;
};

/** @override */
five.TimeMarker.Component.prototype.disposeInternal = function() {
  delete this.owner_;
  this.timeMarker_.releaseComponent(this);
  goog.dispose(this.timeAxisPatchMarker_);
  goog.base(this, 'disposeInternal');
};
