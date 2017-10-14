package com.cantstopthesignals.five.insights;

import java.util.ArrayList;
import java.util.List;

class EventGroup {
    private final List<Event> events = new ArrayList<>();
    private final String summary;
    private long totalDurationMs;

    EventGroup(String summary) {
        this.summary = summary;
    }

    void add(Event event, float weight) {
        events.add(event);
        totalDurationMs += event.getDurationMs() * weight;
    }

    void addAll(EventGroup eventGroup) {
        events.addAll(eventGroup.events);
        totalDurationMs += eventGroup.totalDurationMs;
    }

    String getSummary() {
        return summary;
    }

    List<Event> getEvents() {
        return events;
    }

    long getTotalDurationMs() {
        return totalDurationMs;
    }
}
