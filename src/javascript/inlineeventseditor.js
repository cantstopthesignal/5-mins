// Copyright cantstopthesignals@gmail.com

goog.provide('five.InlineEventsEditor');

goog.require('five.Component');
goog.require('five.Event');
goog.require('five.EventMoveEvent');
goog.require('five.deviceParams');
goog.require('five.layout.HorzSplit');
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


/** @type {five.EventsTimeline} */
five.InlineEventsEditor.prototype.owner_;

/** @type {five.layout.HorzSplit} */
five.InlineEventsEditor.prototype.topSplit_;

/** @type {five.layout.HorzSplit} */
five.InlineEventsEditor.prototype.bottomSplit_;

/** @param {five.EventsTimeline} owner */
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
  this.events_ = goog.array.clone(events);
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

  var shadow = document.createElement('div');
  goog.dom.classes.add(shadow, 'shadow');
  topButtonBar.appendChild(shadow);

  var bottomButtonBar = document.createElement('div');
  goog.dom.classes.add(bottomButtonBar, 'button-bar');
  this.el.appendChild(bottomButtonBar);

  shadow = document.createElement('div');
  goog.dom.classes.add(shadow, 'shadow');
  bottomButtonBar.appendChild(shadow);

  var dupButton = document.createElement('button');
  goog.dom.classes.add(dupButton, 'button');
  dupButton.style.cssFloat = 'right';
  topButtonBar.appendChild(dupButton);

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

five.InlineEventsEditor.prototype.render = function(parentEl) {
  if (!this.el) {
    this.createDom();
  }
  goog.style.showElement(this.el, false);
  parentEl.appendChild(this.el);
};

five.InlineEventsEditor.prototype.preLayout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  if (!this.events_.length) {
    if (this.topSplit_) {
      this.owner_.removeHorzSplit(this.topSplit_);
      delete this.topSplit_;
    }
    if (this.bottomSplit_) {
      this.owner_.removeHorzSplit(this.bottomSplit_);
      delete this.bottomSplit_;
    }
    return;
  }
  var topSplitTime;
  var bottomSplitTime;
  goog.array.forEach(this.events_, function(event) {
    if (!topSplitTime || goog.date.Date.compare(event.getStartTime(),
        topSplitTime) < 0) {
      topSplitTime = event.getStartTime();
    }
    if (!bottomSplitTime || goog.date.Date.compare(event.getEndTime(),
        bottomSplitTime) > 0) {
      bottomSplitTime = event.getEndTime();
    }
  });
  if (!this.topSplit_ || goog.date.Date.compare(topSplitTime,
      this.topSplit_.getTime()) != 0) {
    if (this.topSplit_) {
      this.owner_.removeHorzSplit(this.topSplit_);
      delete this.topSplit_;
    }
    this.topSplit_ = new five.layout.HorzSplit(topSplitTime,
        five.deviceParams.getInlineEventsEditorHeight());
    this.owner_.addHorzSplit(this.topSplit_);
  }
  if (!this.bottomSplit_ || goog.date.Date.compare(bottomSplitTime,
      this.bottomSplit_.getTime()) != 0) {
    if (this.bottomSplit_) {
      this.owner_.removeHorzSplit(this.bottomSplit_);
      delete this.bottomSplit_;
    }
    this.bottomSplit_ = new five.layout.HorzSplit(bottomSplitTime,
        five.deviceParams.getInlineEventsEditorHeight());
    this.owner_.addHorzSplit(this.bottomSplit_);
  }
};

five.InlineEventsEditor.prototype.layout = function() {
  goog.asserts.assert(this.el);
  goog.asserts.assert(this.owner_);
  goog.style.showElement(this.el, this.events_.length > 0);
  if (!this.events_.length) {
    return;
  }
  var rect;
  goog.array.forEach(this.events_, function(event) {
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
five.InlineEventsEditor.prototype.disposeInternal = function() {
  delete this.owner_;
  goog.base(this, 'disposeInternal');
};


/**
 * @param {goog.events.Event} e
 */
five.InlineEventsEditor.prototype.handleClick_ = function(e) {
  e.preventDefault();
  e.stopPropagation();
};

/**
 * @param {goog.events.Event} e
 */
five.InlineEventsEditor.prototype.handleDupButtonClick_ = function(e) {
  this.dispatchEvent(five.Event.EventType.DUPLICATE);
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
