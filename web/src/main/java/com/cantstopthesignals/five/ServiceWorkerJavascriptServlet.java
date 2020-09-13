package com.cantstopthesignals.five;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Calendar;

public class ServiceWorkerJavascriptServlet extends HttpServlet {
  private static final int CACHE_AGE_SECONDS = 24 * 60 * 60;

  public void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    resp.setContentType("text/javascript");

    Calendar cacheExpires = Calendar.getInstance();
    cacheExpires.add(Calendar.SECOND, CACHE_AGE_SECONDS);
    resp.setDateHeader("Expires", cacheExpires.getTimeInMillis());
    resp.setHeader("Cache-Control", "max-age=" + CACHE_AGE_SECONDS);
    resp.addHeader("Service-Worker-Allowed", "/");

    JsMode jsMode = JsMode.fromString(req.getParameter("jsmode"));
    if (jsMode == null) {
      jsMode = JsMode.OPTIMIZED;
    }

    String fileName = jsMode == JsMode.DEBUG ?
        "js/serviceWorker-optimized.js" :
        "js/serviceWorker-debug.js";

    File rootDir = new File(getServletContext().getRealPath(getServletContext().getContextPath()));
    File filePath = new File(rootDir, fileName);

    OutputStream outputStream = resp.getOutputStream();

    InputStream inputStream = new FileInputStream(filePath);
    byte[] buffer = new byte[1024];
    int numRead;
    while ((numRead = inputStream.read(buffer)) > 0) {
      outputStream.write(buffer, 0, numRead);
    }
  }
}
