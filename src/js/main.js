/*
 * The following goog.* methods are adapted from the Google closure toolkit
 * See http://closure-library.googlecode.com/ for the full closure library
 */
var goog = {};
goog.global = this;

goog.abstractMethod = function() {
  throw new Error('unimplemented abstract method');
};

/**
 * @param {Function} fn
 * @param {Object|undefined} selfObj
 * @param {...*} var_args
 * @return {!Function}
 */
goog.bind = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };
  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};

/**
 * @param {Function} fn
 * @param {...*} var_args
 * @return {!Function}
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};

goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};

goog.asserts = {};

/**
 * @param {boolean} condition
 * @param {string=} opt_message
 */
goog.asserts.assert = function(condition, opt_message) {
  if (!condition) {
    throw new Error(opt_message || 'Assert failed');
  }
};

goog.dom = {};
goog.dom.classes = {};

goog.dom.classes.set = function(element, className) {
  element.className = className;
};

goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == 'function' ?
      className.split(/\s+/) : [];
};

/**
 * @param {Element} element
 * @param {...string} var_args
 */
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = Array.prototype.slice.call(arguments, 1);

  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(' ');

  return b;
};

/**
 * @param {Element} element
 * @param {...string} var_args
 */
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = Array.prototype.slice.call(arguments, 1);

  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(' ');

  return b;
};

goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for (var i = 0; i < args.length; i++) {
    if (Array.prototype.indexOf.call(classes, args[i]) < 0) {
      classes.push(args[i]);
      rv++;
    }
  }
  return rv == args.length;
};

goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for (var i = 0; i < classes.length; i++) {
    if (Array.prototype.indexOf.call(args, classes[i]) >= 0) {
      Array.prototype.splice.call(classes, i--, 1);
      rv++;
    }
  }
  return rv == args.length;
};

goog.dom.classes.has = function(element, className) {
  return goog.dom.classes.get(element).indexOf(className) >= 0;
};

goog.dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classes.add(element, className);
  } else {
    goog.dom.classes.remove(element, className);
  }
};

goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};

goog.string = {};

goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};

goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};

goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
    } while (order == 0);
  }

  return order;
};

goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};

goog.userAgent = {};

goog.userAgent.getUserAgentString = function() {
  return goog.global['navigator'] ? goog.global['navigator'].userAgent : null;
};

goog.userAgent.getNavigator = function() {
  return goog.global['navigator'];
};

goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;

  var ua;
  if (ua = goog.userAgent.getUserAgentString()) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf('Opera') == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('MSIE') != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('WebKit') != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ &&
        ua.indexOf('Mobile') != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ &&
        !goog.userAgent.detectedWebkit_ && navigator.product == 'Gecko';
  }
};

goog.userAgent.init_();

goog.userAgent.OPERA = goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.detectedMobile_;

goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || '';
};

goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();

goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Mac');
  goog.userAgent.detectedWindows_ = goog.string.contains(
      goog.userAgent.PLATFORM, 'Win');
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Linux');
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() &&
      goog.string.contains(goog.userAgent.getNavigator()['appVersion'] || '',
          'X11');
};

goog.userAgent.initPlatform_();

goog.userAgent.MAC = goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.detectedX11_;

goog.userAgent.determineVersion_ = function() {
 var version = '', re;

  if (goog.userAgent.OPERA && goog.global['opera']) {
    var operaVersion = goog.global['opera'].version;
    version = typeof operaVersion == 'function' ? operaVersion() : operaVersion;
  } else {
    if (goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/;
    } else if (goog.userAgent.IE) {
      re = /MSIE\s+([^\);]+)(\)|;)/;
    } else if (goog.userAgent.WEBKIT) {
      // WebKit/125.4
      re = /WebKit\/(\S+)/;
    }
    if (re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : '';
    }
  }
  if (goog.userAgent.IE) {
   var docMode = goog.userAgent.getDocumentMode_();
    if (docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};

goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global['document'];
  return doc ? doc['documentMode'] : undefined;
};

goog.userAgent.VERSION = goog.userAgent.determineVersion_();

goog.userAgent.isVersionCache_ = {};

/**
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] ||
      (goog.userAgent.isVersionCache_[version] =
          goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};

var main = {};

window.onload = function() {
};
