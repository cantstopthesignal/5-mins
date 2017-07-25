package com.cantstopthesignals.five;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Calendar;
import java.util.Date;

public class DumpMain {
    private static void usage() {
        System.out.println("Usage: dump [--calendar CALENDAR_ID] [--output-csv-file CSV_FILE] ");
        System.out.println("    [--years YEARS] [--months MONTHS]");
        System.exit(1);
    }

    public static void main(String[] args) throws IOException {
        String calendarIdArg = null;
        String outputCsvFilename = null;
        int startMonthsAgo = 0;
        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--calendar":
                    i++;
                    calendarIdArg = args[i];
                    break;
                case "--output-csv-file":
                    i++;
                    outputCsvFilename = args[i];
                    break;
                case "--years":
                    i++;
                    startMonthsAgo += 12 * Integer.valueOf(args[i]);
                    break;
                case "--months":
                    i++;
                    startMonthsAgo += Integer.valueOf(args[i]);
                    break;
                default:
                    usage();
                    return;
            }
        }

        com.google.api.services.calendar.Calendar service = CalendarApi.getCalendarService();

        if (calendarIdArg == null) {
            System.out.println("*** Error: Select a calendar and pass it as the --calendar <calendarId> argument");
            CalendarApi.printAvailableCalendars(service);
            System.exit(1);
        }
        if (startMonthsAgo == 0) {
            startMonthsAgo = 5 * 12;
        }

        CSVPrinter csvPrinter = null;
        if (outputCsvFilename != null) {
            if (!new File(outputCsvFilename).isAbsolute()) {
                throw new IllegalArgumentException("output csv file path should be absolute");
            }
            csvPrinter = new CSVPrinter(new FileWriter(outputCsvFilename), CSVFormat.DEFAULT);
            csvPrinter.printRecord("id", "summary", "startTime", "endTime");
        }

        Calendar endTime = Calendar.getInstance();
        Calendar startTime = (Calendar) endTime.clone();
        startTime.add(Calendar.MONTH, -startMonthsAgo);
        CheckedIterator<Event, IOException> eventIterator = CalendarApi.loadEvents(service, calendarIdArg, startTime, endTime);
        int totalEvents = 0;
        while (eventIterator.hasNext()) {
            Event event = eventIterator.next();
            totalEvents++;
            System.out.printf("%s (%s)\n", event.getSummary(), new Date(event.getStartTime()));
            if (csvPrinter != null) {
                csvPrinter.printRecord(event.getId(), event.getSummary(), event.getStartTime(), event.getEndTime());
            }
        }
        eventIterator.checkException();
        if (csvPrinter != null) {
            csvPrinter.close();
        }
        System.out.println("Total events: " + totalEvents);
    }
}
