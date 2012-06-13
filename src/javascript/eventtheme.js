// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventTheme');


/**
 * @constructor
 */
five.EventTheme = function(bgColor, borderColor, selectedBgColor,
    selectedBorderColor) {
  /** @type {string} */
  this.bgColor = bgColor;

  /** @type {string} */
  this.borderColor = borderColor;

  /** @type {string} */
  this.selectedBgColor = selectedBgColor;

  /** @type {string} */
  this.selectedBorderColor = selectedBorderColor;
};

/** @type {!five.EventTheme} */
five.EventTheme.BLUE = new five.EventTheme('rgba(200, 200, 255, 0.8)', '#88f',
    'rgba(150, 150, 220, 0.8)', '#66d');

/** @type {!five.EventTheme} */
five.EventTheme.ORANGE = new five.EventTheme('#FFAD46', '#CB7403', '#dF8D26',
    '#aB5400');

/** @type {!five.EventTheme} */
five.EventTheme.DEFAULT = five.EventTheme.ORANGE;
