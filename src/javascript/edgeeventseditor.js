// Copyright cantstopthesignals@gmail.com

goog.provide('five.EdgeEventsEditor');

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
five.EdgeEventsEditor = function() {
  goog.base(this);
};
goog.inherits(five.EdgeEventsEditor, five.EventsEditor);

/** @type {Element} */
five.EdgeEventsEditor.prototype.editSummaryButton_;

five.EdgeEventsEditor.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'edge-events-editor');

  var topButtonBar = document.createElement('div');
  goog.dom.classes.add(topButtonBar, 'button-bar');
  this.el.appendChild(topButtonBar);

  var shadow = document.createElement('div');
  goog.dom.classes.add(shadow, 'shadow');
  topButtonBar.appendChild(shadow);

  var bottomButtonBar = document.createElement('div');
  goog.dom.classes.add(bottomButtonBar, 'button-bar');
  this.el.appendChild(bottomButtonBar);

  shadow = document.createElement('div');
  goog.dom.classes.add(shadow, 'shadow');
  bottomButtonBar.appendChild(shadow);

  var dupButton = this.createIconButton_(topButtonBar, true);
  dupButton.appendChild(document.createTextNode('D'));
  this.editSummaryButton_ = this.createIconButton_(topButtonBar, true);
  this.editSummaryButton_.appendChild(document.createTextNode('ES'));

  var moveUpButton = this.createArrowButton_(true, topButtonBar);
  var moveDownButton = this.createArrowButton_(false, topButtonBar);
  var moveStartUpButton = this.createArrowButton_(true, topButtonBar);
  var moveStartDownButton = this.createArrowButton_(false, topButtonBar);
  var moveEndUpButton = this.createArrowButton_(true, bottomButtonBar);
  var moveEndDownButton = this.createArrowButton_(false, bottomButtonBar);

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(dupButton, goog.events.EventType.CLICK,
          this.handleDupButtonClick_).
      listen(this.editSummaryButton_, goog.events.EventType.CLICK,
          this.handleEditSummaryButtonClick_).
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
five.EdgeEventsEditor.prototype.createArrowButton_ = function(up,
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
five.EdgeEventsEditor.prototype.createIconButton_ = function(parentEl,
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
five.EdgeEventsEditor.prototype.getType = function() {
  return five.EventsEditor.Type.EDGE;
};

five.EdgeEventsEditor.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner);
  goog.style.showElement(this.el, this.events.length > 0);
  goog.style.showElement(this.editSummaryButton_, this.events.length == 1);
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
  goog.style.setPosition(this.el, 0, rect.top);
  goog.style.setHeight(this.el, rect.height);
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleDupButtonClick_ = function(e) {
  this.dispatchEvent(five.Event.EventType.DUPLICATE);
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleEditSummaryButtonClick_ = function(e) {
  goog.asserts.assert(this.events.length == 1);
  this.events[0].dispatchEvent(five.Event.EventType.EDIT_SUMMARY);
};

/**
 * @param {!Function} eventConstructor
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleButtonClick_ = function(
    eventConstructor, e) {
  e.preventDefault();
  this.dispatchEvent(new eventConstructor());
};
