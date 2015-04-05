package com.cantstopthesignals.five.layout;

import com.cantstopthesignals.five.Rect;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class EventLayout {
    public final Calendar startTime;
    public final Calendar endTime;

    public List<TimePoint> timePoints = new ArrayList<>();
    public TimePoint startTimePoint;
    public TimePoint endTimePoint;

    public int column;
    public boolean columnAssigned;
    public int columnCount;

    public boolean hasTimeAxisPatch;
    public boolean neighborHasTimeAxisPatch;
    public boolean attachedToTimeAxisPatch;

    public Rect rect;

    public EventLayout(Calendar startTime, Calendar endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
