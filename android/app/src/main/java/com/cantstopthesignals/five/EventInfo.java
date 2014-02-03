package com.cantstopthesignals.five;

import java.util.Calendar;

public class EventInfo implements Comparable<EventInfo> {
    public long id;
    public String title;
    public Calendar startTime;
    public Calendar endTime;

    public EventInfo(long id, String title, Calendar startTime, Calendar endTime) {
        this.id = id;
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder("EventInfo[");
        sb.append("id:").append(id);
        sb.append(", title:\"").append(title);
        sb.append("\", startTime:").append(startTime.getTime());
        sb.append(", endTime:").append(endTime.getTime());
        return sb.append("]").toString();
    }

    @Override
    public int compareTo(EventInfo eventInfo) {
        return startTime.compareTo(eventInfo.startTime);
    }
}
