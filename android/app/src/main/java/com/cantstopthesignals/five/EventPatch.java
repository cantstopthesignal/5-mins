package com.cantstopthesignals.five;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

public class EventPatch {
    public String title;
    public Calendar startTime;
    public Calendar endTime;
    public String etag;

    public EventPatch(String title, Calendar startTime, Calendar endTime, String etag) {
        this.title = title;
        this.startTime = startTime;
        this.endTime = endTime;
        this.etag = etag;
    }

    public static EventPatch fromJson(JSONObject jsonObject) throws JSONException {
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

        return new EventPatch(title, startTime, endTime, etag);
    }
}
