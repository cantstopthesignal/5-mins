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
%>

<!DOCTYPE html>
<!-- Copyright 2012 Cant Stop The Signals -->
<html>
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
        <script type="text/javascript" src="js/main-<%= jsMode.getName() %>.js"></script>
        <%
      }
    %>
    <!-- Google Analytics -->
    <script>
      (function() {
        var gaDate = new Date();
        window['loadGoogleAnalytics'] = function() {
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*gaDate;a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
          ga('create', 'UA-31450279-1', 'auto');
          ga('send', 'pageview');
        }
      })();
    </script>
    <!-- End Google Analytics -->
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
