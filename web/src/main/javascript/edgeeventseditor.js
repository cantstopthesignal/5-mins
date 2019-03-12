// Copyright cantstopthesignals@gmail.com

goog.provide('five.EdgeEventsEditor');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventEditEvent');
goog.require('five.EventMoveEvent');
goog.require('five.EventSnapToEvent');
goog.require('five.EventsEditor');
goog.require('five.PointerDownMoveControlEvent');
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
five.EdgeEventsEditor.prototype.editButton_;

/** @type {Element} */
five.EdgeEventsEditor.prototype.proposeAboveButton_;

/** @type {Element} */
five.EdgeEventsEditor.prototype.proposeBelowButton_;

five.EdgeEventsEditor.prototype.createDom = function() {
  goog.base(this, 'createDom');
  goog.dom.classlist.add(this.el, 'edge-events-editor');

  this.topButtonBar_ = document.createElement('div');
  goog.dom.classlist.add(this.topButtonBar_, 'button-bar');
  this.el.appendChild(this.topButtonBar_);

  var shadow = document.createElement('div');
  goog.dom.classlist.add(shadow, 'shadow');
  this.topButtonBar_.appendChild(shadow);

  this.bottomButtonBar_ = document.createElement('div');
  goog.dom.classlist.add(this.bottomButtonBar_, 'button-bar');
  this.el.appendChild(this.bottomButtonBar_);

  shadow = document.createElement('div');
  goog.dom.classlist.add(shadow, 'shadow');
  this.bottomButtonBar_.appendChild(shadow);

  // top left buttons
  this.proposeAboveButton_ = this.createIconButton_(this.topButtonBar_);
  goog.dom.classlist.add(this.proposeAboveButton_, 'propose-button');

  // top right buttons
  var moveStartDownButton = this.createArrowButton_(false, this.topButtonBar_, true);
  var moveStartUpButton = this.createArrowButton_(true, this.topButtonBar_, true);
  var moveDownButton = this.createArrowButton_(false, this.topButtonBar_, true);
  var moveUpButton = this.createArrowButton_(true, this.topButtonBar_, true);

  // bottom left buttons
  this.proposeBelowButton_ = this.createIconButton_(this.bottomButtonBar_);
  goog.dom.classlist.add(this.proposeBelowButton_, 'propose-button');
  var dupButton = this.createIconButton_(this.bottomButtonBar_);
  goog.dom.classlist.add(dupButton, 'duplicate-button');
  this.editButton_ = this.createIconButton_(this.bottomButtonBar_);
  goog.dom.classlist.add(this.editButton_, 'edit-button');
  var deleteButton = this.createIconButton_(this.bottomButtonBar_);
  goog.dom.classlist.add(deleteButton, 'delete-button');

  // bottom right buttons
  var moveEndDownButton = this.createArrowButton_(false, this.bottomButtonBar_, true);
  var moveEndUpButton = this.createArrowButton_(true, this.bottomButtonBar_, true);
  var nowButton = this.createIconButton_(this.bottomButtonBar_, true);
  goog.dom.classlist.add(nowButton, 'now-button');

  this.eventHandler.
      listen(this.el, goog.events.EventType.CLICK, this.handleClick_).
      listen(this.el, goog.events.EventType.DBLCLICK, this.handleDblClick_).
      listen(this.el, goog.events.EventType.MOUSEDOWN, this.handleMouseDown_).
      listen(deleteButton, goog.events.EventType.CLICK,
          this.handleDeleteButtonClick_).
      listen(dupButton, goog.events.EventType.CLICK,
          this.handleDupButtonClick_).
      listen(this.editButton_, goog.events.EventType.CLICK,
          this.handleEditButtonClick_).
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
      listen(moveUpButton, goog.events.EventType.TOUCHSTART,
          this.handleMoveTouchStart_).
      listen(moveDownButton, goog.events.EventType.TOUCHSTART,
          this.handleMoveTouchStart_).
      listen(moveStartUpButton, goog.events.EventType.TOUCHSTART,
          this.handleMoveStartTouchStart_).
      listen(moveStartDownButton, goog.events.EventType.TOUCHSTART,
          this.handleMoveStartTouchStart_).
      listen(moveEndUpButton, goog.events.EventType.TOUCHSTART,
          this.handleMoveEndTouchStart_).
      listen(moveEndDownButton, goog.events.EventType.TOUCHSTART,
          this.handleMoveEndTouchStart_).
      listen(moveUpButton, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_).
      listen(moveDownButton, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_).
      listen(moveStartUpButton, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_).
      listen(moveStartDownButton, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_).
      listen(moveEndUpButton, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_).
      listen(moveEndDownButton, goog.events.EventType.TOUCHMOVE,
          this.handleTouchMove_).
      listen(nowButton, goog.events.EventType.CLICK,
          this.handleNowButtonClick_).
      listen(this.proposeAboveButton_, goog.events.EventType.CLICK,
          this.handleProposeAboveButtonClick_).
      listen(this.proposeBelowButton_, goog.events.EventType.CLICK,
          this.handleProposeBelowButtonClick_);
};

/** @type {boolean} */
five.EdgeEventsEditor.prototype.mouseDownTop_ = true;

/**
 * @param {boolean} up
 * @param {Element} parentEl
 * @param {boolean=} opt_floatRight
 */
five.EdgeEventsEditor.prototype.createArrowButton_ = function(up,
    parentEl, opt_floatRight) {
  var button = document.createElement('button');
  goog.dom.classlist.add(button, 'button');
  var arrow = document.createElement('div');
  goog.dom.classlist.add(arrow, 'arrow');
  goog.dom.classlist.add(arrow, up ? 'up' : 'down');
  button.appendChild(arrow);
  if (opt_floatRight) {
    button.style.cssFloat = 'right';
  }
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
  goog.dom.classlist.add(button, 'button');
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
  goog.style.setElementShown(this.el, this.events.length > 0);
  goog.style.setElementShown(this.editButton_, this.events.length == 1);
  goog.style.setElementShown(this.proposeAboveButton_, this.events.length == 1);
  goog.style.setElementShown(this.proposeBelowButton_, this.events.length == 1);
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

/** @override */
five.EdgeEventsEditor.prototype.getScrollAnchorData = function() {
  var pos = goog.style.getPageOffsetTop(this.mouseDownTop_ ? this.topButtonBar_
      : this.bottomButtonBar_);
  return {'pos': pos};
}

/** @override */
five.EdgeEventsEditor.prototype.getScrollAnchorDeltaY = function(oldData) {
  var data = this.getScrollAnchorData();
  if (!data || !oldData || !('pos' in oldData) || !('pos' in data)) {
    return 0;
  }
  return data['pos'] - oldData['pos'];
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/** @param {goog.events.Event} e */
five.EdgeEventsEditor.prototype.handleDblClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/** @param {goog.events.BrowserEvent} e */
five.EdgeEventsEditor.prototype.handleMouseDown_ = function(e) {
  if (e.relatedTarget && goog.dom.contains(this.el, e.relatedTarget)) {
    return;
  }
  this.mouseDownTop_ = goog.dom.contains(this.topButtonBar_, e.target);
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleDeleteButtonClick_ = function(e) {
  this.dispatchEvent(five.Event.EventType.DELETE);
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
five.EdgeEventsEditor.prototype.handleEditButtonClick_ = function(e) {
  goog.asserts.assert(this.events.length == 1);
  this.events[0].dispatchEvent(new five.EventEditEvent());
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleNowButtonClick_ = function(e) {
  this.dispatchEvent(five.EventSnapToEvent.now(five.EventSnapToEvent.Anchor.AUTO));
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleProposeAboveButtonClick_ = function(e) {
  goog.asserts.assert(this.events.length == 1);
  this.dispatchEvent(new five.EventsProposeEvent(this.events[0].getStartTime()));
};

/**
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleProposeBelowButtonClick_ = function(e) {
  goog.asserts.assert(this.events.length == 1);
  this.dispatchEvent(new five.EventsProposeEvent(this.events[0].getEndTime()));
};

/**
 * @param {!Function} eventConstructor
 * @param {!number} minutes
 * @param {goog.events.Event} e
 */
five.EdgeEventsEditor.prototype.handleButtonClick_ = function(
    eventConstructor, minutes, e) {
  e.preventDefault();
  this.dispatchEvent(new eventConstructor(minutes));
};

/** @param {goog.events.BrowserEvent} e */
five.EdgeEventsEditor.prototype.handleMoveTouchStart_ = function(e) {
  this.dispatchEvent(five.PointerDownMoveControlEvent.both());
};

/** @param {goog.events.BrowserEvent} e */
five.EdgeEventsEditor.prototype.handleMoveStartTouchStart_ = function(e) {
  this.dispatchEvent(five.PointerDownMoveControlEvent.start());
};

/** @param {goog.events.BrowserEvent} e */
five.EdgeEventsEditor.prototype.handleMoveEndTouchStart_ = function(e) {
  this.dispatchEvent(five.PointerDownMoveControlEvent.end());
};

/** @param {goog.events.BrowserEvent} e */
five.EdgeEventsEditor.prototype.handleTouchMove_ = function(e) {
  e.preventDefault();
};