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
import java.util.Calendar;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

class CalendarApi {
    /** Application name. */
    private static final String APPLICATION_NAME = "5-Minutes";

    /** Directory to store user credentials for this application. */
    private static final java.io.File DATA_STORE_DIR = new java.io.File(
            System.getProperty("user.home"), ".credentials/5mins-calendar");

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

    static CheckedIterator<Event, IOException> loadEvents(
            com.google.api.services.calendar.Calendar service,
            String calendarId, Calendar startTime, Calendar endTime) {
        return new CheckedIterator<Event, IOException>() {
            Iterator<com.google.api.services.calendar.model.Event> batch;
            String nextPageToken;

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
            public Event next() {
                return new Event(batch.next());
            }

            private void loadBatch() throws IOException {
                Events eventsResult = service.events().list(calendarId)
                        .setMaxResults(250)
                        .setTimeMin(new DateTime(startTime.getTimeInMillis()))
                        .setTimeMax(new DateTime(endTime.getTimeInMillis()))
                        .setOrderBy("startTime")
                        .setSingleEvents(true)
                        .setPageToken(nextPageToken)
                        .execute();
                batch = eventsResult.getItems().iterator();
                nextPageToken = eventsResult.getNextPageToken();
            }
        };
    }

    static void printAvailableCalendars(com.google.api.services.calendar.Calendar service) throws IOException {
        System.out.println("Available calendars:");
        CalendarList calendars = service.calendarList().list().execute();
        for (CalendarListEntry calendar : calendars.getItems()) {
            System.out.println("  Summary:" + calendar.getSummary() + "; id:" + calendar.getId());
        }
    }
}
