package com.cantstopthesignals.five;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class InsightsMain {
    private static final String COLUMN_SUMMARY = "summary";
    private static final String COLUMN_START_TIME = "startTime";
    private static final String COLUMN_END_TIME = "endTime";

    private static void usage() {
        System.out.println("Usage: insights --input-csv-file CSV_FILE --categories-csv-file CSV_FILE");
        System.exit(1);
    }

    public static void main(String[] args) throws IOException {
        String inputCsvFilename = null;
        String categoriesCsvFilename = null;
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--input-csv-file":
                    i++;
                    inputCsvFilename = args[i];
                    break;
                case "--categories-csv-file":
                    i++;
                    categoriesCsvFilename = args[i];
                    break;
                default:
                    usage();
                    return;
            }
        }
        if (inputCsvFilename == null) {
            usage();
            return;
        }

        List<Event> events = readEventsFromCsv(new FileReader(inputCsvFilename));
        Map<String, EventGroup> eventsBySummary = new HashMap<>();

        long totalDurationMs = 0;
        for (Event event : events) {
            EventGroup eventsWithSummary = eventsBySummary.computeIfAbsent(
                    event.summary, summary -> new EventGroup());
            eventsWithSummary.add(event);
            totalDurationMs += event.getDurationMs();
        }

        List<EventGroup> sortedEventsBySummary = new ArrayList<>();
        sortedEventsBySummary.addAll(eventsBySummary.values());
        sortedEventsBySummary.sort((a, b) -> -Long.compare(a.getTotalDurationMs(), b.getTotalDurationMs()));
        EventGroup otherEvents = new EventGroup();
        for (EventGroup eventGroup : sortedEventsBySummary) {
            long durationHours = TimeUnit.MILLISECONDS.toHours(eventGroup.getTotalDurationMs());
            if (durationHours >= 1) {
                System.out.println("EventGroup[" + eventGroup.events.get(0).summary + "] count: "
                        + eventGroup.events.size() + " totalDurationHours: "
                        + durationHours);
            } else {
                otherEvents.addAll(eventGroup.events);
            }
        }
        System.out.println("EventGroup[other] count: "
                + otherEvents.events.size() + " totalDurationHours: "
                + TimeUnit.MILLISECONDS.toHours(otherEvents.getTotalDurationMs()));

        System.out.println("Total events: " + events.size());
        System.out.println("Total duration hours: " + TimeUnit.MILLISECONDS.toHours(totalDurationMs));
    }

    private static List<Event> readEventsFromCsv(Reader csvReader) throws IOException {
        CSVParser parser = new CSVParser(csvReader, CSVFormat.DEFAULT.withFirstRecordAsHeader());
        Map<String, Integer> headerMap = parser.getHeaderMap();
        if (!headerMap.containsKey(COLUMN_SUMMARY)) {
            throw new IllegalArgumentException(String.format("Csv file should have a %s column", COLUMN_SUMMARY));
        }
        if (!headerMap.containsKey(COLUMN_START_TIME)) {
            throw new IllegalArgumentException(String.format("Csv file should have a %s column", COLUMN_START_TIME));
        }
        if (!headerMap.containsKey(COLUMN_END_TIME)) {
            throw new IllegalArgumentException(String.format("Csv file should have a %s column", COLUMN_END_TIME));
        }

        List<Event> events = new ArrayList<>();
        for (CSVRecord record : parser) {
            events.add(Event.fromCsv(record));
        }
        return events;
    }

    private static class Event {
        private final String summary;
        private final Calendar startTime;
        private final Calendar endTime;

        Event(String summary, Calendar startTime, Calendar endTime) {
            this.summary = summary;
            this.startTime = startTime;
            this.endTime = endTime;
        }

        static Event fromCsv(CSVRecord record) {
            String summary = record.get(COLUMN_SUMMARY).toLowerCase();
            Calendar startTime = Calendar.getInstance();
            startTime.setTimeInMillis(Long.parseLong(record.get(COLUMN_START_TIME)));
            Calendar endTime = Calendar.getInstance();
            endTime.setTimeInMillis(Long.parseLong(record.get(COLUMN_END_TIME)));
            return new Event(summary, startTime, endTime);
        }

        long getDurationMs() {
            return endTime.getTimeInMillis() - startTime.getTimeInMillis();
        }
    }

    private static class EventGroup {
        final List<Event> events = new ArrayList<>();
        private long totalDurationMs;

        void add(Event event) {
            events.add(event);
            totalDurationMs += event.getDurationMs();
        }

        void addAll(List<Event> events) {
            for (Event event : events) {
                add(event);
            }
        }

        long getTotalDurationMs() {
            return totalDurationMs;
        }
    }
}
