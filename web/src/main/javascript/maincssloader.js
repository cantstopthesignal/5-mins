// Copyright cantstopthesignals@gmail.com

goog.provide('five.mainCssLoader');

goog.require('five.device');


five.mainCssLoader.load = function() {
  var pathPrefix = five.device.isJsModeUncompiled() ? '/debug/src' : '';

  function loadStylesheet(path) {
    var stylesheetEl = document.createElement('link');
    stylesheetEl.setAttribute('rel', 'stylesheet');
    stylesheetEl.setAttribute('type', 'text/css');
    stylesheetEl.setAttribute('href', pathPrefix + path);
    document.head.appendChild(stylesheetEl);
  }

  loadStylesheet('/css/main.css');
  if (five.device.isMobile()) {
    loadStylesheet('/css/mainmobile.css');
  }

  var uri = new goog.Uri(window.location.href);
  var zoom = parseFloat(uri.getParameterValue('zoom') || '1');
  var fixedWidth = uri.getParameterValue('width');
  if (fixedWidth) {
    document.documentElement.style.width = fixedWidth + 'px';
  } else if (zoom != 1) {
    document.documentElement.style.width = Math.floor(100 / zoom) + '%';
  }
  var fixedHeight = uri.getParameterValue('height');
  if (fixedHeight) {
    document.documentElement.style.height = fixedHeight + 'px';
  } else if (zoom != 1) {
    document.documentElement.style.height = Math.floor(100 / zoom) + '%';
  }
  if (zoom != 1) {
    var transformOrigin = 'top left';
    var transform = 'scale(' + zoom + ',' + zoom + ')';
    document.documentElement.style.transformOrigin = transformOrigin;
    document.documentElement.style.mozTransformOrigin = transformOrigin;
    document.documentElement.style.webkitTransformOrigin = transformOrigin;
    document.documentElement.style.transform = transform;
    document.documentElement.style.mozTransform = transform;
    document.documentElement.style.webkitTransform = transform;
  }
};
