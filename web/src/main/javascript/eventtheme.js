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
five.EventTheme.BLUE = new five.EventTheme('rgba(100, 100, 180, 0.8)', '#77e',
    'rgba(80, 80, 170, 0.8)', '#55c', 'rgba(80, 160, 80, 0.8)', '#4a4',
    'rgba(60, 140, 60, 0.8)', '#393');

/** @type {!five.EventTheme} */
five.EventTheme.ORANGE = new five.EventTheme('rgba(225, 141, 38, 0.8)', '#ed9225',
    'rgba(199, 121, 28, 0.8)', '#e68b1b00', 'rgba(80, 160, 80, 0.8)', '#4a4',
    'rgba(100, 180, 100, 0.8)', '#292');

/** @type {!five.EventTheme} */
five.EventTheme.DEFAULT = five.EventTheme.BLUE;

/** @type {!five.EventTheme} */
five.EventTheme.TODO = five.EventTheme.ORANGE;
