// Copyright cantstopthesignals@gmail.com

goog.provide('five.device');

goog.require('goog.Uri');


/** @return {!five.device.Density} */
five.device.getDensity = function() {
  if (!five.device.density_) {
    var uri = new goog.Uri(window.location.href);
    var densityParam = uri.getParameterValue('density');
    if (densityParam && goog.object.contains(five.device.Density,
        densityParam)) {
      five.device.density_ = /** @type {five.device.Density} */ (densityParam);
    } else if (window['devicePixelRatio'] >= 1.5) {
      five.device.density_ = five.device.Density.HIGH;
    } else {
      five.device.density_ = five.device.Density.NORMAL;
    }
  }
  return five.device.density_;
};

/** @type {five.device.Density} */
five.device.density_;

/** @enum {string} */
five.device.Density = {
  HIGH: 'high',
  NORMAL: 'normal'
};
