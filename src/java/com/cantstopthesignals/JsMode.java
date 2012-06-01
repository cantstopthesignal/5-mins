package com.cantstopthesignals;

import java.util.HashMap;
import java.util.Map;

public enum JsMode {
  UNCOMPILED("uncompiled"),
  DEBUG("debug"),
  OPTIMIZED("optimized");

  private final String name;

  private static Map<String, JsMode> byNameMap = new HashMap<String, JsMode>();
  static {
    for (JsMode jsMode : values()) {
      byNameMap.put(jsMode.getName(), jsMode);
    }
  }

  JsMode(String name) {
    this.name = name;
  }

  public static JsMode fromString(String name) {
    return byNameMap.get(name);
  }

  public String getName() {
    return name;
  }
}
