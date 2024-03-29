// Copyright cantstopthesignals@gmail.com

goog.provide('five.IdleTracker');

goog.require('goog.date.DateTime');
goog.require('goog.events');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
five.IdleTracker = function() {
  goog.base(this);

  /** @type {number} */
  this.userActiveTime_ = goog.now();

  /** @type {boolean} */
  this.userActive_ = true;

  /** @type {goog.events.Key} */
  this.globalMouseMoveListenerKey_ = goog.events.listen(document,
      goog.events.EventType.MOUSEMOVE,
      this.handleUserActivity_, false, this);

  /** @type {goog.events.Key} */
  this.globalKeyPressListenerKey_ = goog.events.listen(document,
      goog.events.EventType.KEYPRESS,
      this.handleUserActivity_, false, this);

  /** @type {goog.events.Key} */
  this.visibilityChangedListenerKey_ = goog.events.listen(document,
      goog.events.EventType.VISIBILITYCHANGE,
      this.handleVisibilityChange_, false, this);

  /** @type {goog.events.Key} */
  this.onlineListenerKey_ = goog.events.listen(window,
      goog.events.EventType.ONLINE,
      this.handleOnline_, false, this);

  /** @type {number} */
  this.idleIntervalId_ = window.setTimeout(goog.bind(this.handleIdleTimeout_, this),
      five.IdleTracker.IDLE_TIMEOUT_MS_);
};
goog.inherits(five.IdleTracker, goog.events.EventTarget);

/** @type {number} */
five.IdleTracker.IDLE_TIMEOUT_MS_ = 5 * 60 * 1000;

/** @enum {string} */
five.IdleTracker.EventType = {
  IDLE: goog.events.getUniqueId('idle'),
  ACTIVE: goog.events.getUniqueId('active')
};

/** @type {goog.log.Logger} */
five.IdleTracker.prototype.logger_ = goog.log.getLogger('five.IdleTracker');

five.IdleTracker.prototype.handleUserActivity_ = function() {
  this.userActiveTime_ = goog.now();
  if (!this.userActive_) {
    this.userActive_ = true;
    this.dispatchEvent(five.IdleTracker.EventType.ACTIVE);

    if (this.idleTimeoutId_) {
      window.clearTimeout(this.idleTimeoutId_);
      delete this.idleTimeoutId_;
    }
    this.idleTimeoutId_ = window.setTimeout(goog.bind(this.handleIdleTimeout_, this),
        five.IdleTracker.IDLE_TIMEOUT_MS_);
  }
};

five.IdleTracker.prototype.handleIdleTimeout_ = function() {
  delete this.idleTimeoutId_;
  if (this.userActive_) {
    this.userActive_ = false;
    this.dispatchEvent(five.IdleTracker.EventType.IDLE);
  }
};

five.IdleTracker.prototype.handleVisibilityChange_ = function() {
  if (document.visibilityState == 'visible') {
    this.handleUserActivity_();
  }
};

five.IdleTracker.prototype.handleOnline_ = function() {
  this.handleUserActivity_();
};

/** @override */
five.IdleTracker.prototype.disposeInternal = function() {
  if (this.globalMouseMoveListenerKey_) {
    goog.events.unlistenByKey(this.globalMouseMoveListenerKey_);
    delete this.globalMouseMoveListenerKey_;
  }
  if (this.globalKeyPressListenerKey_) {
    goog.events.unlistenByKey(this.globalKeyPressListenerKey_);
    delete this.globalKeyPressListenerKey_;
  }
  if (this.visibilityChangedListenerKey_) {
    goog.events.unlistenByKey(this.visibilityChangedListenerKey_);
    delete this.visibilityChangedListenerKey_;
  }
  if (this.onlineListenerKey_) {
    goog.events.unlistenByKey(this.onlineListenerKey_);
    delete this.onlineListenerKey_;
  }
  if (this.idleIntervalId_) {
    window.clearInterval(this.idleIntervalId_);
    delete this.idleIntervalId_;
  }
  goog.base(this, 'disposeInternal');
};
