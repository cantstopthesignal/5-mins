package com.cantstopthesignals.five.layout;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class TimePoint {
    public final Calendar time;
    public final boolean startsSplit;
    public final String key;

    public TimePoint next;
    public int yPos;
    public int linearTimeYPos;
    public boolean linearTimeAnchor;
    public int minHeight;
    public List<EventLayout> openEvents = new ArrayList<>();
    public int columnCount;

    public TimePoint(Calendar time) {
        this(time, false);
    }

    public TimePoint(Calendar time, boolean startsSplit) {
        this.time = time;
        this.startsSplit = startsSplit;
        this.key = getKey(time, startsSplit);
    }

    public static String getKey(Calendar time) {
        return getKey(time, false);
    }

    public static String getKey(Calendar time, boolean startsSplit) {
        return time.getTimeInMillis() + "_" + (startsSplit ? "1" : "2");
    }
}
