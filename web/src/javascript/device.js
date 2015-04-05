// Copyright cantstopthesignals@gmail.com

goog.provide('five.device');

goog.require('goog.Uri');
goog.require('goog.userAgent');


/** @return {!five.device.Density} */
five.device.getDensity = function() {
  if (!goog.isDef(five.device.density_)) {
    if (five.device.isMobile()) {
      var densityParam = five.device.getUriParam_('density');
      if (densityParam && goog.object.contains(five.device.Density,
          densityParam)) {
        five.device.density_ = /** @type {five.device.Density} */ (
            densityParam);
      } else if (window['devicePixelRatio'] >= 1.5) {
        five.device.density_ = five.device.Density.HIGH;
      } else {
        five.device.density_ = five.device.Density.NORMAL;
      }
    } else {
      five.device.density_ = five.device.Density.NORMAL;
    }
  }
  return five.device.density_;
};

/** @return {boolean} */
five.device.isTouch = function() {
  if (!goog.isDef(five.device.isTouch_)) {
    var touchParam = five.device.getUriParam_('touch');
    if (touchParam) {
      five.device.isTouch_ = touchParam == 'true' || touchParam == '1';
    } else {
      five.device.isTouch_ = !!('ontouchstart' in window);
    }
  }
  return five.device.isTouch_;
};

/** @return {boolean} */
five.device.isMobile = function() {
  if (!goog.isDef(five.device.isMobile_)) {
    var mobileParam = five.device.getUriParam_('mobile');
    if (mobileParam) {
      five.device.isMobile_ = mobileParam == 'true' || mobileParam == '1';
    } else {
      five.device.isMobile_ = goog.userAgent.MOBILE;
    }
  }
  return five.device.isMobile_;
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

/** @type {goog.Uri} */
five.device.uri_;

/** @enum {string} */
five.device.Density = {
  HIGH: 'high',
  NORMAL: 'normal'
};