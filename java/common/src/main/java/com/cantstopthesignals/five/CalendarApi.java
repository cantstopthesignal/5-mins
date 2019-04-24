package com.cantstopthesignals.five;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.CalendarList;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Events;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

class CalendarApi {
    /** Application name. */
    private static final String APPLICATION_NAME = "5-Minutes";

    /** Directory to store user credentials for this application. */
    private static final java.io.File DATA_STORE_DIR = new java.io.File(
            System.getProperty("user.home"), ".credentials/5mins-calendar");

    private static final int MAX_REQUEST_RETRIES = 2;

    /** Global instance of the {@link FileDataStoreFactory}. */
    private static FileDataStoreFactory DATA_STORE_FACTORY;

    /** Global instance of the JSON factory. */
    private static final JsonFactory JSON_FACTORY =
            JacksonFactory.getDefaultInstance();

    /** Global instance of the HTTP transport. */
    private static HttpTransport HTTP_TRANSPORT;

    /** Global instance of the scopes required.
     *
     * If modifying these scopes, delete your previously saved credentials
     * at ~/.credentials/5mins-calendar
     */
    private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR);

    static {
        try {
            HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
            DATA_STORE_FACTORY = new FileDataStoreFactory(DATA_STORE_DIR);
        } catch (Throwable t) {
            t.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Creates an authorized Credential object.
     * @return an authorized Credential object.
     * @throws IOException on error
     */
    private static Credential authorize() throws IOException {
        // Load client secrets.
        InputStream in = CalendarApi.class.getResourceAsStream("/client_secret.json");
        GoogleClientSecrets clientSecrets =
                GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

        // Build flow and trigger user authorization request.
        GoogleAuthorizationCodeFlow flow =
                new GoogleAuthorizationCodeFlow.Builder(
                        HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                        .setDataStoreFactory(DATA_STORE_FACTORY)
                        .setAccessType("offline")
                        .build();
        Credential credential = new AuthorizationCodeInstalledApp(
                flow, new LocalServerReceiver()).authorize("user");
        System.out.println(
                "Credentials saved to " + DATA_STORE_DIR.getAbsolutePath());
        return credential;
    }

    /**
     * Build and return an authorized Calendar client service.
     * @return an authorized Calendar client service
     * @throws IOException on error
     */
    static com.google.api.services.calendar.Calendar getCalendarService() throws IOException {
        Credential credential = authorize();
        return new com.google.api.services.calendar.Calendar.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    private static class TimeSegmentedEventLoader
            extends CheckedIterator<com.google.api.services.calendar.model.Event, IOException> {
        private final com.google.api.services.calendar.Calendar service;
        private final String calendarId;
        private final Calendar startTime;
        private final Calendar endTime;

        private Set<String> previousEventIds = new HashSet<>();
        private Iterator<com.google.api.services.calendar.model.Event> batch;
        private Calendar batchEndTime;

        TimeSegmentedEventLoader(com.google.api.services.calendar.Calendar service,
                                 String calendarId, Calendar startTime, Calendar endTime) {
            this.service = service;
            this.calendarId = calendarId;
            this.startTime = startTime;
            this.endTime = endTime;
        }

        @Override
        public boolean hasNext() {
            if (hasException()) {
                return false;
            }
            if (batch == null || (!batch.hasNext() && batchEndTime != null)) {
                try {
                    loadBatch();
                } catch (IOException e) {
                    setException(e);
                    return false;
                }
            }
            return batch.hasNext();
        }

        @Override
        public com.google.api.services.calendar.model.Event next() {
            return batch.next();
        }

        private void loadBatch() throws IOException {
            ArrayList<com.google.api.services.calendar.model.Event> batchEvents = new ArrayList<>();
            while (batchEvents.isEmpty()) {
                Calendar batchStartTime;
                if (batchEndTime != null) {
                    batchStartTime = batchEndTime;
                } else {
                    batchStartTime = startTime;
                }
                batchEndTime = (Calendar) batchStartTime.clone();
                batchEndTime.add(Calendar.MONTH, 3);
                if (batchEndTime.after(endTime)) {
                    batchEndTime = endTime;
                }
                PagedEventLoader batchLoader = new PagedEventLoader(
                    service, calendarId, batchStartTime, batchEndTime);
                while (batchLoader.hasNext()) {
                    com.google.api.services.calendar.model.Event event = batchLoader.next();
                    if (!previousEventIds.contains(event.getId())) {
                        batchEvents.add(event);
                        previousEventIds.add(event.getId());
                    }
                }
                batchLoader.checkException();
                if (batchEndTime.equals(endTime)) {
                    batchEndTime = null;
                    break;
                }
            }
            batch = batchEvents.iterator();
        }
    }

    private static class PagedEventLoader
            extends CheckedIterator<com.google.api.services.calendar.model.Event, IOException> {
        private final com.google.api.services.calendar.Calendar service;
        private final String calendarId;
        private final Calendar startTime;
        private final Calendar endTime;

        private Iterator<com.google.api.services.calendar.model.Event> batch;
        private String nextPageToken;

        PagedEventLoader(com.google.api.services.calendar.Calendar service,
                         String calendarId, Calendar startTime, Calendar endTime) {
            this.service = service;
            this.calendarId = calendarId;
            this.startTime = startTime;
            this.endTime = endTime;
        }

        @Override
        public boolean hasNext() {
            if (hasException()) {
                return false;
            }
            if (batch == null || (!batch.hasNext() && nextPageToken != null)) {
                try {
                    loadBatch();
                } catch (IOException e) {
                    setException(e);
                    return false;
                }
            }
            return batch.hasNext();
        }

        @Override
        public com.google.api.services.calendar.model.Event next() {
            return batch.next();
        }

        private void loadBatch() throws IOException {
            int retriesLeft = MAX_REQUEST_RETRIES;
            Events eventsResult;
            while (true) {
                try {
                    eventsResult = service.events().list(calendarId)
                        .setMaxResults(250)
                        .setTimeMin(new DateTime(startTime.getTimeInMillis()))
                        .setTimeMax(new DateTime(endTime.getTimeInMillis()))
                        .setOrderBy("startTime")
                        .setSingleEvents(true)
                        .setPageToken(nextPageToken)
                        .execute();
                    break;
                } catch (IOException e) {
                    if ((retriesLeft--) < 0) {
                        throw e;
                    }
                }
            }
            batch = eventsResult.getItems().iterator();
            nextPageToken = eventsResult.getNextPageToken();
        }
    }

    private static class EventConverter extends CheckedIterator<Event, IOException> {
        private CheckedIterator<com.google.api.services.calendar.model.Event, IOException> iterator;

        EventConverter(CheckedIterator<
                com.google.api.services.calendar.model.Event, IOException> iterator) {
            this.iterator = iterator;
        }

        @Override
        public boolean hasNext() {
            if (hasException()) {
                return false;
            }
            boolean hasNext = iterator.hasNext();
            try {
                iterator.checkException();
            } catch (IOException e) {
                setException(e);
                return false;
            }
            return hasNext;
        }

        @Override
        public Event next() {
            return new Event(iterator.next());
        }
    }

    static CheckedIterator<Event, IOException> loadEvents(
            com.google.api.services.calendar.Calendar service,
            String calendarId, Calendar startTime, Calendar endTime) {
        return new EventConverter(
            new TimeSegmentedEventLoader(service, calendarId, startTime, endTime));
    }

    static void printAvailableCalendars(com.google.api.services.calendar.Calendar service) throws IOException {
        System.out.println("Available calendars:");
        CalendarList calendars = service.calendarList().list().execute();
        for (CalendarListEntry calendar : calendars.getItems()) {
            System.out.println("  Summary:" + calendar.getSummary() + "; id:" + calendar.getId());
        }
    }
}
