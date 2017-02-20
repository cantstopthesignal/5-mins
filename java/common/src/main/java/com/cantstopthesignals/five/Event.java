package com.cantstopthesignals.five;

import com.google.api.client.util.DateTime;

public class Event {
    private final com.google.api.services.calendar.model.Event modelEvent;

    public Event(com.google.api.services.calendar.model.Event modelEvent) {
        this.modelEvent = modelEvent;
    }

    public String getId() {
        return modelEvent.getId();
    }

    public String getSummary() {
        return modelEvent.getSummary();
    }

    public long getStartTime() {
        DateTime start = modelEvent.getStart().getDateTime();
        if (start == null) {
            start = modelEvent.getStart().getDate();
        }
        return start.getValue();
    }

    public long getEndTime() {
        DateTime end = modelEvent.getEnd().getDateTime();
        if (end == null) {
            end = modelEvent.getEnd().getDate();
        }
        if (end == null) {
            throw new IllegalStateException("Did not expect an event with no end time. id: " + getId() + ", summary: "
                    + getSummary() + ", startTime: " + getStartTime());
        }
        return end.getValue();
    }
}
