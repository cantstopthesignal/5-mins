// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventsEditor');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventMoveEvent');
goog.require('five.deviceParams');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');


/**
 * Base class for events editors.
 * @constructor
 * @extends {five.Component}
 */
five.EventsEditor = function() {
  goog.base(this);

  /** @type {Array.<!five.EventCard>} */
  this.events = [];
  
  /** @type {boolean} */
  this.visible_ = false;
};
goog.inherits(five.EventsEditor, five.Component);

/** @enum {number} */
five.EventsEditor.Type = {
  INLINE: 1,
  EDGE: 2
};

/** @enum {string} */
five.EventsEditor.EventType = {
  SHOW: goog.events.getUniqueId('show'),
  HIDE: goog.events.getUniqueId('hide')
};

/** @type {five.EventsTimeline} */
five.EventsEditor.prototype.owner;

/** @param {five.EventsTimeline} owner */
five.EventsEditor.prototype.setOwner = function(owner) {
  this.owner = owner;
  if (!this.owner) {
    goog.dom.removeNode(this.el);
  }
};

/** @return {Array.<!five.EventCard>} */
five.EventsEditor.prototype.getEvents = function() {
  return this.events;
};

/** @param {Array.<!five.EventCard>} events */
five.EventsEditor.prototype.setEvents = function(events) {
  this.events = goog.array.clone(events);
  this.setVisible(this.events.length > 0);
  if (this.el && this.owner) {
    this.layout();
  }
};

/** @override */
five.EventsEditor.prototype.disposeInternal = function() {
  delete this.owner;
  delete this.events;
  goog.base(this, 'disposeInternal');
};

/** @param {boolean} visible */
five.EventsEditor.prototype.setVisible = function(visible) {
  if (this.visible_ == visible) {
    return;
  }
  this.visible_ = visible;
  if (this.el) {
    goog.style.showElement(this.el, this.visible_);
  }
  this.dispatchEvent(this.visible_ ? five.EventsEditor.EventType.SHOW :
      five.EventsEditor.EventType.HIDE);
};

/** @return {boolean} */
five.EventsEditor.prototype.isVisible = function() {
  return this.visible_;
};

five.EventsEditor.prototype.render = function(parentEl) {
  goog.base(this, 'render', parentEl);
  goog.style.showElement(this.el, this.visible_);
};

/** @return {!five.EventsEditor.Type} */
five.EventsEditor.prototype.getType = goog.abstractMethod;

five.EventsEditor.prototype.layout = goog.abstractMethod;
