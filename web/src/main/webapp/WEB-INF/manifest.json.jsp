<%@ page trimDirectiveWhitespaces="true" %>
<%@ page contentType="text/json;charset=UTF-8" language="java" %>
<%@ page import="com.cantstopthesignals.five.JsMode" %>
<%
  JsMode jsMode = JsMode.fromString(request.getParameter("jsmode"));
  if (jsMode == null) {
    jsMode = JsMode.OPTIMIZED;
  }
  String appName = (jsMode == JsMode.OPTIMIZED ? "5 minutes" : "5 debug");
  String startUrl = (jsMode == JsMode.OPTIMIZED ? "/" : "/?jsmode=" + jsMode.getName());
%>
{
  "short_name": "<%= appName %>",
  "name": "<%= appName %>",
  "icons": [
    {
      "src": "/images/logo32.png",
      "type": "image/png",
      "sizes": "32x32",
      "purpose": "any maskable"
    },
    {
      "src": "/images/logo128.png",
      "type": "image/png",
      "sizes": "128x128",
      "purpose": "any maskable"
    },
    {
      "src": "/images/logo256.png",
      "type": "image/png",
      "sizes": "256x256",
      "purpose": "any maskable"
    },
    {
      "src": "/images/logo512.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "any maskable"
    }
  ],
  "start_url": "<%= startUrl %>",
  "display": "standalone",
  "scope": "/",
  "description": "<%= appName %>"
}
