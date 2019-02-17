package com.cantstopthesignals.five;

import android.provider.CalendarContract;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

public class Event implements Comparable<Event> {
    public Long id;
    public String title;
    public Calendar startTime;
    public Calendar endTime;
    public int status;
    public String etag;
    public Long originalId;
    public Calendar originalInstanceTime;

    public Event(Long id, String title, Calendar startTime, Calendar endTime, int status,
                 String etag, Long originalId, Calendar originalInstanceTime) {
        if (id == null && (originalId == null || originalInstanceTime == null)) {
            throw new IllegalArgumentException("Invalid ids for event");
        }
        this.id = id;
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.etag = etag;
        this.originalId = originalId;
        this.originalInstanceTime = originalInstanceTime;
    }

    public static Event fromJson(JSONObject jsonObject) throws JSONException {
        Long id = null;
        if (jsonObject.has("id")) {
            id = jsonObject.getLong("id");
        }

        String etag = null;
        if (jsonObject.has("etag")) {
            etag = jsonObject.getString("etag");
        }

        String title = null;
        if (jsonObject.has("summary")) {
            title = jsonObject.getString("summary");
        }

        Calendar startTime = null;
        if (jsonObject.has("start")) {
            startTime = Util.dateFromIsoString(
                    jsonObject.getJSONObject("start").getString("dateTime"));
        }

        Calendar endTime = null;
        if (jsonObject.has("end")) {
            endTime = Util.dateFromIsoString(
                    jsonObject.getJSONObject("end").getString("dateTime"));
        }

        Long originalId = null;
        if (jsonObject.has("originalId")) {
            originalId = jsonObject.getLong("originalId");
        }

        Calendar originalInstanceTime = null;
        if (jsonObject.has("originalInstanceTime")) {
            originalInstanceTime = Util.dateFromIsoString(
                    jsonObject.getJSONObject("originalInstanceTime").getString("dateTime"));
        }

        return new Event(id, title, startTime, endTime, CalendarContract.Events.STATUS_CONFIRMED,
                etag, originalId, originalInstanceTime);
    }

    public String toString() {
        StringBuilder sb = new StringBuilder("EventInfo[");
        sb.append("id:").append(id);
        sb.append(", originalId:").append(originalId);
        sb.append(", title:\"").append(title);
        sb.append("\", startTime:").append(startTime.getTime());
        sb.append(", endTime:").append(endTime.getTime());
        return sb.append("]").toString();
    }

    public JSONObject toJson() throws JSONException {
        JSONObject json = new JSONObject();
        json.put("kind", "calendar#event");
        if (id != null) {
            json.put("id", Long.toString(id));
        }
        json.put("summary", title);
        JSONObject startJson = new JSONObject();
        startJson.put("dateTime", Util.dateToIsoString(startTime));
        json.put("start", startJson);
        JSONObject endJson = new JSONObject();
        endJson.put("dateTime", Util.dateToIsoString(endTime));
        json.put("end", endJson);
        if (etag != null) {
            json.put("etag", etag);
        }
        if (originalId != null) {
            json.put("originalId", originalId);
        }
        if (originalInstanceTime != null) {
            JSONObject originalInstanceTimeJson = new JSONObject();
            originalInstanceTimeJson.put("dateTime",
                    Util.dateToIsoString(originalInstanceTime));
            json.put("originalInstanceTime", originalInstanceTimeJson);
        }
        return json;
    }

    @Override
    public int compareTo(Event event) {
        return startTime.compareTo(event.startTime);
    }
}
