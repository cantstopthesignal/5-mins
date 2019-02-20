<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.cantstopthesignals.five.JsMode" %>
<%@ page import="com.cantstopthesignals.five.MobileMode" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>
<%
  JsMode jsMode = JsMode.fromString(request.getParameter("jsmode"));
  if (jsMode == null) {
    jsMode = JsMode.OPTIMIZED;
  }
  MobileMode mobileMode = MobileMode.fromRequest(request);

  boolean offlineEnabled = !"0".equals(request.getParameter("offlineEnabled"));
  String manifestAttribute = "";
  if (jsMode != JsMode.UNCOMPILED && offlineEnabled) {
    manifestAttribute = "manifest=\"manifest.txt\"";
  }
%>

<!DOCTYPE html>
<!-- Copyright 2012 Cant Stop The Signals -->
<html <%= manifestAttribute %>>
  <head>
    <title>5 minutes</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta rel="icon" href="/images/logo32.png" sizes="32x32" />
    <%
      if (mobileMode == MobileMode.TRUE) {
        %>
        <meta name="viewport" content="width=device-width, initial-scale=1.0,
            user-scalable=no">
        <%
      }
      if (jsMode == JsMode.UNCOMPILED) {
        %>
        <script type="text/javascript" src="debug/lib/closure-library/closure/goog/base.js"></script>
        <script type="text/javascript" src="debug/src/deps.js"></script>
        <script type="text/javascript">
          goog.require('five.main');
        </script>
        <%
      } else {
        if (jsMode == JsMode.DEBUG) {
          %><script type="text/javascript">CLOSURE_NO_DEPS = true;</script><%
        }
        %>
        <script type="text/javascript" src="js/main<%= jsMode.getName() %>.js"></script>
        <%
      }
    %>
    <script type="text/javascript">
      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-31450279-1']);
      _gaq.push(['_trackPageview']);
      (function() {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') +
            '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
      })();
    </script>
  </head>
  <body class="main">
    <div class="app"></div>
    <div class="footer">
      Contact by
      <a href="mailto:cantstopthesignals@gmail.com">Email</a> or
      <a target="_blank" href="http://www.reddit.com/user/CantStopTheSignal/">Reddit</a>
      &nbsp;
      <a target="_blank" href="https://github.com/cantstopthesignal/5-mins">Project source</a>
    </div>
  </body>
</html>
