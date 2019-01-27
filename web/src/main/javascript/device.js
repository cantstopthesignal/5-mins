// Copyright cantstopthesignals@gmail.com

goog.provide('five.device');

goog.require('goog.Uri');
goog.require('goog.userAgent');


/** @return {!five.device.Density} */
five.device.getDensity = function() {
  if (!goog.isDef(five.device.density_)) {
    five.device.density_ = five.device.Density.NORMAL;
  }
  return five.device.density_;
};

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
      five.device.isWebView_ = param == 'true' || param == '1';
    } else {
      five.device.isWebView_ = !!('Android' in window);
    }
  }
  return five.device.isWebView_;
};

five.device.getUriParam_ = function(name) {
  if (!five.device.uri_) {
    five.device.uri_ = new goog.Uri(window.location.href);
  }
  return five.device.uri_.getParameterValue(name);
};

/** @type {five.device.Density} */
five.device.density_;

/** @type {boolean} */
five.device.isTouch_;

/** @type {boolean} */
five.device.isMobile_;

/** @type {boolean} */
five.device.isWebView_;

/** @type {goog.Uri} */
five.device.uri_;

/** @enum {string} */
five.device.Density = {
  HIGH: 'high',
  NORMAL: 'normal'
};
