package com.cantstopthesignals.five;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;

public class ManifestTextServlet extends HttpServlet {
  private static final Set<String> EXCLUDED_BASE_PATHS = new HashSet<>();
  static {
    EXCLUDED_BASE_PATHS.add("META-INF");
    EXCLUDED_BASE_PATHS.add("WEB-INF");
    EXCLUDED_BASE_PATHS.add(".google");
    EXCLUDED_BASE_PATHS.add("debug");
    EXCLUDED_BASE_PATHS.add("etc");
    EXCLUDED_BASE_PATHS.add("source-context.json");
    EXCLUDED_BASE_PATHS.add("source-contexts.json");
  }

  private static final int CACHE_AGE_SECONDS = 60 * 5;

  private static final String CHECKSUM_PROPERTY_NAME = "checksum";
  private static final String CHECKSUM_PROPERTIES_FILE = "checksum.properties";

  public void doGet(HttpServletRequest req, HttpServletResponse resp)
      throws IOException {
    resp.setContentType("text/plain");

    Calendar cacheExpires = Calendar.getInstance();
    cacheExpires.add(Calendar.SECOND, CACHE_AGE_SECONDS);
    resp.setDateHeader("Expires", cacheExpires.getTimeInMillis());
    resp.setHeader("Cache-Control", "max-age=" + CACHE_AGE_SECONDS);

    PrintWriter writer = resp.getWriter();
    writer.println("# Manifest");
    writer.println("# Version " + getFilesChecksum());
    writer.println();

    File rootDir = new File(getServletContext().getRealPath(getServletContext().getContextPath()));
    List<String> relativeFilenames = new ArrayList<>(Arrays.asList(rootDir.list()));
    relativeFilenames.sort(null);
    for (String relativeFilename : relativeFilenames) {
      if (!EXCLUDED_BASE_PATHS.contains(relativeFilename)) {
        printWarFiles(writer, rootDir, new File(relativeFilename));
      }
    }
  }

  private String getFilesChecksum() throws IOException {
    Properties properties = new Properties();
    InputStream inputStream = getClass().getClassLoader().getResourceAsStream(
        CHECKSUM_PROPERTIES_FILE);
    properties.load(inputStream);
    return properties.getProperty(CHECKSUM_PROPERTY_NAME);
  }

  private void printWarFiles(PrintWriter writer, File rootDir, File relativeFile) {
    File absoluteFile = new File(rootDir, relativeFile.toString());
    if (absoluteFile.isFile()) {
      writer.println("/" + relativeFile.toString());
    } else {
      String[] childFilenamesArray = absoluteFile.list();
      if (childFilenamesArray != null) {
        List<String> childFilenames = new ArrayList<>(Arrays.asList(childFilenamesArray));
        childFilenames.sort(null);
        for (String childFilename : childFilenames) {
          printWarFiles(writer, rootDir, new File(relativeFile, childFilename));
        }
      }
    }
  }
}
