<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ page import="com.google.appengine.api.users.User" %>
<%@ page import="com.google.appengine.api.users.UserService" %>
<%@ page import="com.google.appengine.api.users.UserServiceFactory" %>
<%
  String jsMode = request.getParameter("jsmode");
  if (jsMode == null) {
    jsMode = "optimized";
  }
  UserService userService = UserServiceFactory.getUserService();
  User user = userService.getCurrentUser();
%>

<!DOCTYPE html>
<!-- Copyright 2012 Cant Stop The Signals -->
<html>
  <head>
    <title>5 minutes</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <script type="text/javascript">
      var userEmail = "<%= user.getEmail() %>";
    </script>
    <script type="text/javascript" src="js/main_<%= jsMode %>.js"></script>
    <link rel="stylesheet" href="css/main.css" type="text/css" />
    <link rel="shortcut icon" href="about:blank" />
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
  <body>
    <div class="footer">
      Contact by
      <a href="mailto:cantstopthesignals@gmail.com">Email</a> or
      <a target="_blank" href="http://www.reddit.com/user/CantStopTheSignal/">Reddit</a>
      &nbsp;
      <a target="_blank" href="https://github.com/cantstopthesignal/5-mins">Project source</a>
    </div>
  </body>
</html>
