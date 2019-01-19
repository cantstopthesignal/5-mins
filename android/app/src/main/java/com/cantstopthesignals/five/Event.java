package com.cantstopthesignals.five;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

public class Event implements Comparable<Event> {
    public long id;
    public String title;
    public Calendar startTime;
    public Calendar endTime;
    public String etag;

    public Event(long id, String title, Calendar startTime, Calendar endTime, String etag) {
        this.id = id;
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.etag = etag;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder("EventInfo[");
        sb.append("id:").append(id);
        sb.append(", title:\"").append(title);
        sb.append("\", startTime:").append(startTime.getTime());
        sb.append(", endTime:").append(endTime.getTime());
        return sb.append("]").toString();
    }

    public JSONObject toJson() throws JSONException {
        JSONObject json = new JSONObject();
        json.put("kind", "calendar#event");
        json.put("id", Long.toString(id));
        json.put("summary", title);
        JSONObject startJson = new JSONObject();
        startJson.put("dateTime", Util.dateToIsoString(startTime));
        json.put("start", startJson);
        JSONObject endJson = new JSONObject();
        endJson.put("dateTime", Util.dateToIsoString(endTime));
        json.put("end", endJson);
        json.put("etag", etag);
        return json;
    }

    @Override
    public int compareTo(Event event) {
        return startTime.compareTo(event.startTime);
    }
}
