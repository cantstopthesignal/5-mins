// Copyright cantstopthesignals@gmail.com

goog.provide('five.TimeMarkerTheme');


/**
 * @constructor
 */
five.TimeMarkerTheme = function(color, labelColor) {
  /** @type {string} */
  this.color = color;

  /** @type {string} */
  this.labelColor = labelColor;
};

/** @type {!five.TimeMarkerTheme} */
five.TimeMarkerTheme.NOW = new five.TimeMarkerTheme('rgba(255, 0, 0, 0.4)',
    'rgba(255, 0, 0, 0.8)');

/** @type {!five.TimeMarkerTheme} */
five.TimeMarkerTheme.CURSOR = new five.TimeMarkerTheme('rgba(0, 0, 255, 0.2)',
    'rgba(0, 0, 255, 0.8)');

/** @type {!five.TimeMarkerTheme} */
five.TimeMarkerTheme.DEFAULT = new five.TimeMarkerTheme('rgba(0, 255, 0, 0.4)',
    'rgba(0, 255, 0, 0.8)');
