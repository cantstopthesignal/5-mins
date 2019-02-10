// Copyright cantstopthesignals@gmail.com

goog.provide('five.EventTheme');


/**
 * @constructor
 */
five.EventTheme = function(bgColor, borderColor, selectedBgColor,
    selectedBorderColor, proposedBgColor, proposedBorderColor,
    proposedSelectedBgColor, proposedSelectedBorderColor) {
  /** @type {string} */
  this.bgColor = bgColor;

  /** @type {string} */
  this.borderColor = borderColor;

  /** @type {string} */
  this.selectedBgColor = selectedBgColor;

  /** @type {string} */
  this.selectedBorderColor = selectedBorderColor;

  /** @type {string} */
  this.proposedBgColor = proposedBgColor;

  /** @type {string} */
  this.proposedBorderColor = proposedBorderColor;

  /** @type {string} */
  this.proposedSelectedBgColor = proposedSelectedBgColor;

  /** @type {string} */
  this.proposedSelectedBorderColor = proposedSelectedBorderColor;
};

/** @type {!five.EventTheme} */
five.EventTheme.BLUE = new five.EventTheme('rgba(200, 200, 255, 0.8)', '#88f',
    'rgba(150, 150, 220, 0.8)', '#66d', 'rgba(150, 220, 150, 0.8)', '#4b4',
    'rgba(100, 180, 100, 0.8)', '#292');

/** @type {!five.EventTheme} */
five.EventTheme.ORANGE = new five.EventTheme('rgba(255, 173, 70, 0.8)', '#CB7403',
    'rgba(225, 141, 38, 0.8)', '#aB5400', 'rgba(150, 220, 150, 0.8)', '#4b4',
    'rgba(100, 180, 100, 0.8)', '#292');

/** @type {!five.EventTheme} */
five.EventTheme.DEFAULT = five.EventTheme.BLUE;

/** @type {!five.EventTheme} */
five.EventTheme.TODO = five.EventTheme.ORANGE;
