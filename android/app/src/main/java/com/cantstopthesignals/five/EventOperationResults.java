package com.cantstopthesignals.five;

import android.graphics.Color;
import android.text.SpannableString;
import android.text.style.ForegroundColorSpan;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

class EventOperationResults {
    abstract static class Result {
        abstract Object toJson() throws JSONException;
        abstract CharSequence toCharSequence();
    }

    static class Save extends Result {
        final Event event;

        Save(Event event) {
            this.event = event;
        }

        @Override
        JSONObject toJson() throws JSONException {
            return event != null ? event.toJson() : null;
        }

        public CharSequence toCharSequence() {
            return "Save: " + event.id + " " + event.title;
        }
    }

    static class Delete extends Result {
        final Long eventId;
        final Long originalEventId;

        Delete(Long eventId, Long originalEventId) {
            this.eventId = eventId;
            this.originalEventId = originalEventId;
        }

        @Override
        Boolean toJson() throws JSONException {
            return true;
        }

        public CharSequence toCharSequence() {
            return "Delete: id=" + eventId + ", originalId: " + originalEventId;
        }
    }

    static class Error extends Result {
        final String error;

        Error(String error) {
            this.error = error;
        }

        @Override
        JSONObject toJson() throws JSONException {
            JSONObject json = new JSONObject();
            json.put("error", error);
            return json;
        }

        public CharSequence toCharSequence() {
            SpannableString str = new SpannableString("Error: " + error + "!");
            str.setSpan(new ForegroundColorSpan(Color.RED), 0, str.length(), 0);
            return str;
        }
    }

    private final List<Result> results = new ArrayList<>();

    public List<Result> getResults() {
        return results;
    }

    EventOperationResults() {
    }

    void add(Result result) {
        results.add(result);
    }

    JSONArray toJson() throws JSONException {
        JSONArray resultsJson = new JSONArray();
        for (Result result : results) {
            resultsJson.put(result.toJson());
        }
        return resultsJson;
    }

    public CharSequence toCharSequence() {
        CharSequence string = "" + results.size() + " results:";
        int i = 0;
        for (Result result : results) {
            string = string + "\n" + i + ": " + result.toCharSequence();
            i++;
        }
        return string;
    }
}
