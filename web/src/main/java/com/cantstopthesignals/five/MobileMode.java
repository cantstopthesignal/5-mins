package com.cantstopthesignals.five;

import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;

public enum MobileMode {
  TRUE("true", "1"),
  FALSE("false", "0");

  private final String name;
  private final String altName;

  private static Map<String, MobileMode> byNameMap
      = new HashMap<String, MobileMode>();
  static {
    for (MobileMode mobileMode : values()) {
      byNameMap.put(mobileMode.getName(), mobileMode);
      byNameMap.put(mobileMode.getAltName(), mobileMode);
    }
  }

  MobileMode(String name, String altName) {
    this.name = name;
    this.altName = altName;
  }

  public static MobileMode fromRequest(HttpServletRequest request) {
    String mobileParam = request.getParameter("mobile");
    if (mobileParam != null) {
      MobileMode mobileMode = byNameMap.get(mobileParam);
      if (mobileMode != null) {
        return mobileMode;
      }
    }
    if (request.getHeader("User-agent").indexOf("Mobile") >= 0) {
      return MobileMode.TRUE;
    }
    return MobileMode.FALSE;
  }

  public String getName() {
    return name;
  }

  public String getAltName() {
    return altName;
  }
}
