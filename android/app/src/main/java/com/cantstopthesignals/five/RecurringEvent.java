package com.cantstopthesignals.five;

import android.provider.CalendarContract;

import com.android.calendarcommon2.Duration;
import com.google.ical.compat.javautil.DateIterator;
import com.google.ical.compat.javautil.DateIteratorFactory;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.HashSet;
import java.util.TimeZone;

public class RecurringEvent implements Comparable<RecurringEvent> {
    public long id;
    public String title;
    public Calendar startTime;
    public Duration duration;
    public String rrule;
    public String rdate;

    public RecurringEvent(long id, String title, Calendar startTime, Duration duration, String rrule,
            String rdate, String timeZone) {
        this.id = id;
        this.title = title;
        this.startTime = startTime;
        this.duration = duration;
        this.rrule = rrule;
        this.rdate = rdate;
    }

    public Collection<Event> generateEvents(Calendar rangeStartTime, Calendar rangeEndTime,
            HashSet<Long> overriddenInstances) {
        ArrayList<Event> events = new ArrayList<>();

        DateIterator dateIterator;
        try {
            if (rrule != null) {
                dateIterator = DateIteratorFactory.createDateIterator("RRULE:" + rrule,
                        startTime.getTime(), TimeZone.getTimeZone("UTC"), true);
            } else if (rdate != null) {
                dateIterator = DateIteratorFactory.createDateIterator("RDATE:" + rdate,
                        startTime.getTime(), TimeZone.getTimeZone("UTC"), true);
            } else {
                throw new IllegalStateException("Expected an rrule or rdate");
            }
        } catch (ParseException e) {
            throw new IllegalArgumentException(e);
        }

        dateIterator.advanceTo(rangeStartTime.getTime());
        while (dateIterator.hasNext()) {
            Calendar instanceStartTime = Calendar.getInstance();
            instanceStartTime.setTime(dateIterator.next());
            if (instanceStartTime.after(rangeEndTime)) {
                break;
            }
            if (overriddenInstances != null
                    && overriddenInstances.contains(instanceStartTime.getTimeInMillis())) {
                continue;
            }
            Calendar instanceEndTime = (Calendar) instanceStartTime.clone();
            duration.addTo(instanceEndTime);
            events.add(new Event(null, this.title, instanceStartTime, instanceEndTime,
                    CalendarContract.Events.STATUS_CONFIRMED, null, id,
                    (Calendar) instanceStartTime.clone()));
        }

        return events;
    }

    @Override
    public int compareTo(RecurringEvent event) {
        return startTime.compareTo(event.startTime);
    }
}
