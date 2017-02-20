package com.cantstopthesignals.five;

import com.google.api.services.calendar.model.Event;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class UpdateFromCsvMain {
    private static void usage() {
        System.out.println("Usage: updateFromCsv --calendar CALENDAR_ID --input-csv-file CSV_FILE [--dry-run]");
        System.exit(1);
    }

    public static void main(String[] args) throws IOException {
        String calendarIdArg = null;
        String inputCsvFilename = null;
        boolean dryRun = false;
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--calendar":
                    i++;
                    calendarIdArg = args[i];
                    break;
                case "--input-csv-file":
                    i++;
                    inputCsvFilename = args[i];
                    break;
                case "--dry-run":
                    dryRun = true;
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
        if (!new File(inputCsvFilename).isAbsolute()) {
            throw new IllegalArgumentException("input csv file path should be absolute");
        }

        com.google.api.services.calendar.Calendar service = CalendarApi.getCalendarService();

        if (calendarIdArg == null) {
            System.out.println("*** Error: Select a calendar and pass it as the --calendar <calendarId> argument");
            CalendarApi.printAvailableCalendars(service);
            System.exit(1);
        }

        CSVParser csvParser = new CSVParser(new FileReader(inputCsvFilename),
                CSVFormat.DEFAULT.withFirstRecordAsHeader());

        Map<String, Integer> headerMap = csvParser.getHeaderMap();
        int idColumn = headerMap.getOrDefault("id", -1);
        if (idColumn < 0) {
            throw new IllegalArgumentException("Csv file should have an id column");
        }
        int summaryColumn = headerMap.getOrDefault("summary", -1);
        if (summaryColumn < 0) {
            throw new IllegalArgumentException("Csv file should have a summary column");
        }
        int newSummaryColumn = headerMap.getOrDefault("newSummary", -1);
        if (newSummaryColumn < 0) {
            throw new IllegalArgumentException("Csv file should have a newSummary column");
        }

        String dryRunPrefix = dryRun ? "[dry_run] " : "";

        Set<String> uniqueUpdateTuples = new HashSet<>();

        int numEvents = 0;
        int numUpdatedEvents = 0;
        for (CSVRecord record : csvParser) {
            numEvents++;
            String eventId = record.get(idColumn);
            String summary = record.get(summaryColumn);
            String newSummary = record.get(newSummaryColumn).trim();
            if (!newSummary.isEmpty() && !summary.equals(newSummary)) {
                String updateTuple = "\"" + summary + "\" -> \"" + newSummary + "\"";
                boolean isUniqueTuple = uniqueUpdateTuples.add(updateTuple);
                System.out.println(dryRunPrefix + "Update id:" + eventId + "; summary:\"" + summary + "\" -> \""
                        + newSummary + "\"" + (isUniqueTuple ? " UNIQUE" : ""));

                if (!dryRun) {
                    Event modelEvent = service.events().get(calendarIdArg, eventId).execute();
                    if (!modelEvent.getSummary().equals(summary)) {
                        System.out.println("Warning: Unexpected initial summary: found \"" + modelEvent.getSummary()
                                + "\" but expected \"" + summary + "\" id:" + eventId);
                        continue;
                    }
                    modelEvent.setSummary(newSummary);
                    service.events().update(calendarIdArg, eventId, modelEvent)
                            .execute();
                }

                numUpdatedEvents++;
            }
        }
        System.out.println("Total events: " + numEvents);
        System.out.println("Total events updated: " + numUpdatedEvents);
        System.out.println("Total unique summary update tuples: " + uniqueUpdateTuples.size());
    }
}
