package com.cantstopthesignals.five.insights;

import com.cantstopthesignals.five.EventsCsv;
import com.google.common.annotations.VisibleForTesting;
import org.apache.commons.csv.CSVRecord;
import java.util.Calendar;

class Event {
    private final String summary;
    private final String[] splitSummaries;
    private final Calendar startTime;
    private final Calendar endTime;

    private Event(String summary, Calendar startTime, Calendar endTime) {
        this.summary = summary;
        this.startTime = startTime;
        this.endTime = endTime;
        this.splitSummaries = splitSummary(summary);
    }

    @VisibleForTesting
    static String[] splitSummary(String summary) {
        return summary.split(";[ ]?");
    }

    static Event fromCsv(CSVRecord record) {
        String summary = record.get(EventsCsv.COLUMN_SUMMARY).toLowerCase();
        Calendar startTime = Calendar.getInstance();
        startTime.setTimeInMillis(Long.parseLong(record.get(EventsCsv.COLUMN_START_TIME)));
        Calendar endTime = Calendar.getInstance();
        endTime.setTimeInMillis(Long.parseLong(record.get(EventsCsv.COLUMN_END_TIME)));
        return new Event(summary, startTime, endTime);
    }

    String[] getSplitSummaries() {
        return splitSummaries;
    }

    long getDurationMs() {
        return endTime.getTimeInMillis() - startTime.getTimeInMillis();
    }
}
