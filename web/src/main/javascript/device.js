// Copyright cantstopthesignals@gmail.com

goog.provide('five.device');

goog.require('goog.Uri');
goog.require('goog.userAgent');


/** @return {boolean} */
five.device.isTouch = function() {
  if (!goog.isDef(five.device.isTouch_)) {
    var param = five.device.getUriParam_('touch');
    if (param) {
      five.device.isTouch_ = param == 'true' || param == '1';
    } else {
      five.device.isTouch_ = !!('ontouchstart' in window);
    }
  }
  return five.device.isTouch_;
};

/** @return {boolean} */
five.device.isMobile = function() {
  if (!goog.isDef(five.device.isMobile_)) {
    var param = five.device.getUriParam_('mobile');
    if (param) {
      five.device.isMobile_ = param == 'true' || param == '1';
    } else {
      five.device.isMobile_ = goog.userAgent.MOBILE;
    }
  }
  return five.device.isMobile_;
};

/** @return {boolean} */
five.device.isWebView = function() {
  if (!goog.isDef(five.device.isWebView_)) {
    var param = five.device.getUriParam_('webview');
    if (param) {
      five.device.isWebView_ = (param == 'true' || param == '1');
    } else {
      five.device.isWebView_ = !!('Android' in window);
    }
  }
  return five.device.isWebView_;
};

/** @return {string} */
five.device.getJsMode = function() {
  if (!goog.isDef(five.device.jsMode_)) {
    var param = five.device.getUriParam_('jsmode');
    five.device.jsMode_ = param || 'optimized';
  }
  return five.device.jsMode_;
};

/** @return {boolean} */
five.device.isJsModeUncompiled = function() {
  return five.device.getJsMode() == 'uncompiled';
};

/** @return {boolean} */
five.device.isServiceWorkerEnabled = function() {
  if (!goog.isDef(five.device.isServiceWorkerEnabled_)) {
    var param = five.device.getUriParam_('serviceWorkerEnabled');
    if (goog.isDef(param)) {
      five.device.isServiceWorkerEnabled_ = (param == 'true' || param == '1');
    } else {
      five.device.isServiceWorkerEnabled_ = true;
    }
  }
  return five.device.isServiceWorkerEnabled_;
};

/** @return {boolean} */
five.device.isDebug = function() {
  if (!goog.isDef(five.device.isDebug_)) {
    var param = five.device.getUriParam_('Debug');
    five.device.isDebug_ = param == 'true';
  }
  return five.device.isDebug_;
};

five.device.getUriParam_ = function(name) {
  if (!five.device.uri_) {
    five.device.uri_ = new goog.Uri(window.location.href);
  }
  return five.device.uri_.getParameterValue(name);
};

/** @type {boolean} */
five.device.isTouch_;

/** @type {boolean} */
five.device.isMobile_;

/** @type {boolean} */
five.device.isWebView_;

/** @type {boolean} */
five.device.isDebug_;

/** @type {string} */
five.device.jsMode_;

/** @type {boolean} */
five.device.isServiceWorkerEnabled_;

/** @type {goog.Uri} */
five.device.uri_;
