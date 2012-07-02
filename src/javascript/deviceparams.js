// Copyright cantstopthesignals@gmail.com

goog.provide('five.deviceParams');

goog.require('five.device');


/** @constructor */
five.deviceParams.DeviceParams = function() {
  var isHighDensity = five.device.getDensity() == five.device.Density.HIGH;
  var isTouch = five.device.isTouch();

  this.timeAxisWidth = isHighDensity ? 48 : 40;
  this.timeAxisPatchWidth = isHighDensity ? 25 : 15;
  this.defaultHourHeight = isHighDensity ? 64 : 45;
  this.minEventHeight = isHighDensity ? 25 : 17;

  this.eventCardMinShortHeight = isHighDensity ? 46 : 26;
  this.eventCardMinNormalHeight = isHighDensity ? 50 : 30;
  this.eventCardMinLargeHeight = isHighDensity ? 74 : 44;

  this.timelineMinWidth = isHighDensity ? 600 : 400;
  this.timelineMaxWidth = isHighDensity ? 850 : 600;

  this.showTimeMarkerLabels = !isHighDensity;
  this.enableCursorTimeMarker = !isTouch;
};
goog.addSingletonGetter(five.deviceParams.DeviceParams);

goog.scope(function() {
  var getInstance = five.deviceParams.DeviceParams.getInstance;

  /** @return {number} */
  five.deviceParams.getTimeAxisWidth = function() {
    return getInstance().timeAxisWidth;
  };

  /** @return {number} */
  five.deviceParams.getTimeAxisPatchWidth = function() {
    return getInstance().timeAxisPatchWidth;
  };

  /** @return {number} */
  five.deviceParams.getDefaultHourHeight = function() {
    return getInstance().defaultHourHeight;
  };

  /** @return {number} */
  five.deviceParams.getMinEventHeight = function() {
    return getInstance().minEventHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardMinShortHeight = function() {
    return getInstance().eventCardMinShortHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardMinNormalHeight = function() {
    return getInstance().eventCardMinNormalHeight;
  };

  /** @return {number} */
  five.deviceParams.getEventCardMinLargeHeight = function() {
    return getInstance().eventCardMinLargeHeight;
  };

  /** @return {number} */
  five.deviceParams.getTimelineMinWidth = function() {
    return getInstance().timelineMinWidth;
  };

  /** @return {number} */
  five.deviceParams.getTimelineMaxWidth = function() {
    return getInstance().timelineMaxWidth;
  };

  /** @return {boolean} */
  five.deviceParams.getShowTimeMarkerLabels = function() {
    return getInstance().showTimeMarkerLabels;
  };

  /** @return {boolean} */
  five.deviceParams.getEnableCursorTimeMarker = function() {
    return getInstance().enableCursorTimeMarker;
  };
});
