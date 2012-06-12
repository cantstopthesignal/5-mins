// Copyright cantstopthesignals@gmail.com

goog.provide('five.InlineEventsEditor');

goog.require('five.Component');
goog.require('five.EventMoveEvent');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.style');

/**
 * @constructor
 * @extends {five.Component}
 */
five.InlineEventsEditor = function() {
  goog.base(this);

  /** @type {Array.<!five.EventCard>} */
  this.events_ = [];
};
goog.inherits(five.InlineEventsEditor, five.Component);


/** @type {five.EventsScrollBox} */
five.InlineEventsEditor.prototype.owner_;

/** @param {five.EventsScrollBox} owner */
five.InlineEventsEditor.prototype.setOwner = function(owner) {
  this.owner_ = owner;
  if (!this.owner_) {
    goog.dom.removeNode(this.el);
  }
};

/** @return {Array.<!five.EventCard>} */
five.InlineEventsEditor.prototype.getEvents = function() {
  return this.events_;
};

/** @param {Array.<!five.EventCard>} events */
five.InlineEventsEditor.prototype.setEvents = function(events) {
  this.events_ = events;
  if (this.el && this.owner_) {
    this.layout();
  }
};

five.InlineEventsEditor.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'inline-events-editor');

  var topButtonBar = document.createElement('div');
  goog.dom.classes.add(topButtonBar, 'button-bar');
  this.el.appendChild(topButtonBar);

  var bottomButtonBar = document.createElement('div');
  goog.dom.classes.add(bottomButtonBar, 'button-bar');
  this.el.appendChild(bottomButtonBar);

  var moveUpButton = this.createButtonDom_('\u25B2', topButtonBar);
  var moveDownButton = this.createButtonDom_('\u25BC', topButtonBar);
  var moveStartUpButton = this.createButtonDom_('\u25B2', topButtonBar);
  var moveStartDownButton = this.createButtonDom_('\u25BC', topButtonBar);
  var moveEndUpButton = this.createButtonDom_('\u25B2', bottomButtonBar);
  var moveEndDownButton = this.createButtonDom_('\u25BC', bottomButtonBar);

  this.eventHandler.
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

five.InlineEventsEditor.prototype.createButtonDom_ = function(buttonText,
    parentEl) {
  var button = document.createElement('button');
  goog.dom.classes.add(button, 'button');
  button.appendChild(document.createTextNode(buttonText));
  parentEl.appendChild(button);
  return button;
};

five.InlineEventsEditor.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.showElement(this.el, false);
  parentEl.appendChild(this.el);
};

five.InlineEventsEditor.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  goog.style.showElement(this.el, this.events_.length > 0);
  if (!this.events_.length) {
    return;
  }
  var rect = null;
  goog.array.forEach(this.events_, function(event) {
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

/** @override */
five.InlineEventsEditor.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};

/**
 * @param {!Function} eventConstructor
 * @param {goog.events.Event} e
 */
five.InlineEventsEditor.prototype.handleButtonClick_ = function(
    eventConstructor, e) {
  e.preventDefault();
  e.stopPropagation();
  this.dispatchEvent(new eventConstructor());
};
