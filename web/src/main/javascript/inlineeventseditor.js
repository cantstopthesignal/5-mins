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

/** @type {Element} */
five.InlineEventsEditor.prototype.topButtonBar_;

/** @type {Element} */
five.InlineEventsEditor.prototype.bottomButtonBar_;

/** @type {boolean} */
five.InlineEventsEditor.prototype.mouseHover_ = false;

/** @type {boolean} */
five.InlineEventsEditor.prototype.mouseHoverTop_ = false;

five.InlineEventsEditor.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classes.add(this.el, 'inline-events-editor');

  this.topButtonBar_ = document.createElement('div');
  goog.dom.classes.add(this.topButtonBar_, 'button-bar');
  this.el.appendChild(this.topButtonBar_);

  this.bottomButtonBar_ = document.createElement('div');
  goog.dom.classes.add(this.bottomButtonBar_, 'button-bar');
  this.el.appendChild(this.bottomButtonBar_);

  var moveUpButton = this.createArrowButton_(true, this.topButtonBar_);
  var moveDownButton = this.createArrowButton_(false, this.topButtonBar_);
  this.createSpacer_(this.topButtonBar_);
  var moveStartUpButton = this.createArrowButton_(true, this.topButtonBar_);
  var moveStartDownButton = this.createArrowButton_(false, this.topButtonBar_);
  var moveEndUpButton = this.createArrowButton_(true, this.bottomButtonBar_);
  var moveEndDownButton = this.createArrowButton_(false, this.bottomButtonBar_);

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.el, goog.events.EventType.DBLCLICK, this.handleDblClick_).
      listen(this.el, goog.events.EventType.MOUSEOVER, this.handleMouseOver_).
      listen(this.el, goog.events.EventType.MOUSEOUT, this.handleMouseOut_).
      listen(moveUpButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.both, -5)).
      listen(moveDownButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.both, 5)).
      listen(moveStartUpButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.start, -5)).
      listen(moveStartDownButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.start, 5)).
      listen(moveEndUpButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.end, -5)).
      listen(moveEndDownButton, goog.events.EventType.CLICK, goog.partial(
          this.handleButtonClick_, five.EventMoveEvent.end, 5)).
      listen(moveStartUpButton, goog.events.EventType.MOUSEDOWN, goog.partial(
          this.handleMoveStartMouseDown_)).
      listen(moveStartDownButton, goog.events.EventType.MOUSEDOWN, goog.partial(
          this.handleMoveStartMouseDown_)).
      listen(moveEndUpButton, goog.events.EventType.MOUSEDOWN, goog.partial(
          this.handleMoveEndMouseDown_)).
      listen(moveEndDownButton, goog.events.EventType.MOUSEDOWN, goog.partial(
          this.handleMoveEndMouseDown_));
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

/** @param {Element} parentEl */
five.InlineEventsEditor.prototype.createSpacer_ = function(parentEl) {
  var spacer = document.createElement('div');
  goog.dom.classes.add(spacer, 'spacer');
  parentEl.appendChild(spacer);
  return spacer;
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

  var rect;
  goog.array.forEach(this.events, function(event) {
    var eventRect = event.getRect();
    if (eventRect) {
      if (rect) {
        rect.boundingRect(eventRect);
      } else {
        rect = eventRect.clone();
      }
    }
  });

  goog.style.showElement(this.el, !!rect);
  if (rect) {
    if (this.mouseHover_) {
      var oldPosition = goog.style.getPosition(this.el);
      var oldSize = goog.style.getBorderBoxSize(this.el);
      rect.left = oldPosition.x;
      rect.width = oldSize.width;
    }
    goog.style.setPosition(this.el, rect.left, rect.top);
    goog.style.setBorderBoxSize(this.el, rect.getSize());
  }
};

/** @override */
five.InlineEventsEditor.prototype.getScrollAnchorData = function() {
  if (this.mouseHover_) {
    var pos = goog.style.getPageOffsetTop(this.mouseHoverTop_ ?
        this.topButtonBar_ : this.bottomButtonBar_);
    return {'pos': pos};
  }
  return null;
}

/** @override */
five.InlineEventsEditor.prototype.getScrollAnchorDeltaY = function(oldData) {
  var data = this.getScrollAnchorData();
  if (!data || !oldData || !('pos' in oldData) || !('pos' in data)) {
    return 0;
  }
  return data['pos'] - oldData['pos'];
};

/** @param {goog.events.Event} e */
five.InlineEventsEditor.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/** @param {goog.events.Event} e */
five.InlineEventsEditor.prototype.handleDblClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/** @param {goog.events.BrowserEvent} e */
five.InlineEventsEditor.prototype.handleMouseOver_ = function(e) {
  if (e.relatedTarget && goog.dom.contains(this.el, e.relatedTarget)) {
    return;
  }
  this.mouseHover_ = true;
  this.mouseHoverTop_ = goog.dom.contains(this.topButtonBar_, e.target);
};

/** @param {goog.events.BrowserEvent} e */
five.InlineEventsEditor.prototype.handleMouseOut_ = function(e) {
  if (e.relatedTarget && goog.dom.contains(this.el, e.relatedTarget)) {
    return;
  }
  this.mouseHover_ = false;
};

/** @param {goog.events.BrowserEvent} e */
five.InlineEventsEditor.prototype.handleMoveStartMouseDown_ = function(e) {
  var event = new goog.events.Event(
      five.EventsEditor.EventType.MOUSEDOWN_MOVE_START_CONTROL);
  this.dispatchEvent(event);
};

/** @param {goog.events.BrowserEvent} e */
five.InlineEventsEditor.prototype.handleMoveEndMouseDown_ = function(e) {
  var event = new goog.events.Event(
      five.EventsEditor.EventType.MOUSEDOWN_MOVE_END_CONTROL);
  this.dispatchEvent(event);
};

/**
 * @param {!Function} eventConstructor
 * @param {!number} minutes
 * @param {goog.events.Event} e
 */
five.InlineEventsEditor.prototype.handleButtonClick_ = function(
    eventConstructor, minutes, e) {
  e.preventDefault();
  this.dispatchEvent(new eventConstructor(minutes));
};
