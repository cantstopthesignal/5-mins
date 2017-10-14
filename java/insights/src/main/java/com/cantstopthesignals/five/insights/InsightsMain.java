package com.cantstopthesignals.five.insights;

import com.cantstopthesignals.five.EventsCsv;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class InsightsMain {

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
            String[] summaries = event.getSplitSummaries();
            for (String summary : summaries) {
                EventGroup eventsWithSummary = eventsBySummary.computeIfAbsent(
                    summary, s -> new EventGroup(summary));
                eventsWithSummary.add(event, 1.0f / summaries.length);
            }
            totalDurationMs += event.getDurationMs();
        }

        List<EventGroup> sortedEventsBySummary = new ArrayList<>();
        sortedEventsBySummary.addAll(eventsBySummary.values());
        sortedEventsBySummary.sort((a, b) -> -Long.compare(a.getTotalDurationMs(), b.getTotalDurationMs()));
        EventGroup otherEvents = new EventGroup("other");
        for (EventGroup eventGroup : sortedEventsBySummary) {
            long durationHours = TimeUnit.MILLISECONDS.toHours(eventGroup.getTotalDurationMs());
            if (durationHours >= 1) {
                System.out.println("EventGroup[" + eventGroup.getSummary() + "] count: "
                        + eventGroup.getEvents().size() + " totalDurationHours: "
                        + durationHours);
            } else {
                otherEvents.addAll(eventGroup);
            }
        }
        System.out.println("EventGroup[other] count: "
                + otherEvents.getEvents().size() + " totalDurationHours: "
                + TimeUnit.MILLISECONDS.toHours(otherEvents.getTotalDurationMs()));

        System.out.println("Total events: " + events.size());
        System.out.println("Total duration hours: " + TimeUnit.MILLISECONDS.toHours(totalDurationMs));
    }

    private static List<Event> readEventsFromCsv(Reader csvReader) throws IOException {
        CSVParser parser = new CSVParser(csvReader, CSVFormat.DEFAULT.withFirstRecordAsHeader());
        Map<String, Integer> headerMap = parser.getHeaderMap();
        if (!headerMap.containsKey(EventsCsv.COLUMN_SUMMARY)) {
            throw new IllegalArgumentException(String.format("Csv file should have a %s column", EventsCsv.COLUMN_SUMMARY));
        }
        if (!headerMap.containsKey(EventsCsv.COLUMN_START_TIME)) {
            throw new IllegalArgumentException(String.format("Csv file should have a %s column", EventsCsv.COLUMN_START_TIME));
        }
        if (!headerMap.containsKey(EventsCsv.COLUMN_END_TIME)) {
            throw new IllegalArgumentException(String.format("Csv file should have a %s column", EventsCsv.COLUMN_END_TIME));
        }

        List<Event> events = new ArrayList<>();
        for (CSVRecord record : parser) {
            events.add(Event.fromCsv(record));
        }
        return events;
    }

}
