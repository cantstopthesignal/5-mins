// Copyright cantstopthesignals@gmail.com

goog.provide('five.InlineEventsEditor');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventMoveEvent');
goog.require('five.EventsEditor');
goog.require('five.deviceParams');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');


/**
 * @constructor
 * @extends {five.EventsEditor}
 */
five.InlineEventsEditor = function() {
  goog.base(this);
};
goog.inherits(five.InlineEventsEditor, five.EventsEditor);

five.InlineEventsEditor.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'inline-events-editor');

  var topButtonBar = document.createElement('div');
  goog.dom.classes.add(topButtonBar, 'button-bar');
  this.el.appendChild(topButtonBar);

  var bottomButtonBar = document.createElement('div');
  goog.dom.classes.add(bottomButtonBar, 'button-bar');
  this.el.appendChild(bottomButtonBar);

  var moveUpButton = this.createArrowButton_(true, topButtonBar);
  var moveDownButton = this.createArrowButton_(false, topButtonBar);
  var moveStartUpButton = this.createArrowButton_(true, topButtonBar);
  var moveStartDownButton = this.createArrowButton_(false, topButtonBar);
  var moveEndUpButton = this.createArrowButton_(true, bottomButtonBar);
  var moveEndDownButton = this.createArrowButton_(false, bottomButtonBar);

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(moveUpButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.bothEarlier)).
      listen(moveDownButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.bothLater)).
      listen(moveStartUpButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.startEarlier)).
      listen(moveStartDownButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.startLater)).
      listen(moveEndUpButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.endEarlier)).
      listen(moveEndDownButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.endLater));
};

/**
 * @param {boolean} up
 * @param {Element} parentEl
 */
five.InlineEventsEditor.prototype.createArrowButton_ = function(up,
    parentEl) {
  var button = document.createElement('button');
  goog.dom.classes.add(button, 'button');
  var arrow = document.createElement('div');
  goog.dom.classes.add(arrow, 'arrow');
  goog.dom.classes.add(arrow, up ? 'up' : 'down');
  button.appendChild(arrow);
  parentEl.appendChild(button);
  return button;
};

/**
 * @param {Element} parentEl
 * @param {boolean=} opt_floatRight
 */
five.InlineEventsEditor.prototype.createIconButton_ = function(parentEl,
    opt_floatRight) {
  var button = document.createElement('button');
  goog.dom.classes.add(button, 'button');
  if (opt_floatRight) {
    button.style.cssFloat = 'right';
  }
  parentEl.appendChild(button);
  return button;
};

/** @override */
five.InlineEventsEditor.prototype.getType = function() {
  return five.EventsEditor.Type.INLINE;
};

five.InlineEventsEditor.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner);
  goog.style.showElement(this.el, this.events.length > 0);
  if (!this.events.length) {
    return;
  }
  var rect;
  goog.array.forEach(this.events, function(event) {
    if (rect) {
      rect.boundingRect(event.getRect());
    } else {
      rect = event.getRect().clone();
    }
  });
  goog.asserts.assert(rect);
  goog.style.setPosition(this.el, rect.left, rect.top);
  goog.style.setBorderBoxSize(this.el, rect.getSize());
};

/**
 * @param {goog.events.Event} e
 */
five.InlineEventsEditor.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * @param {!Function} eventConstructor
 * @param {goog.events.Event} e
 */
five.InlineEventsEditor.prototype.handleButtonClick_ = function(
    eventConstructor, e) {
  e.preventDefault();
  this.dispatchEvent(new eventConstructor());
};
