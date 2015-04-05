package com.cantstopthesignals.five.layout;

import java.util.Calendar;

public class HorzSplit {
    public final Calendar time;
    public final int height;

    public TimePoint startTimePoint;
    public TimePoint endTimePoint;

    public HorzSplit(Calendar time, int height) {
        this.time = time;
        this.height = height;
    }
}
