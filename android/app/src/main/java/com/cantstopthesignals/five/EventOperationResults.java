package com.cantstopthesignals.five;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

class EventOperationResults {
    abstract static class Result {
        abstract Object toJson() throws JSONException;
    }

    static class Create extends Result {
        final Event event;

        Create(Event event) {
            this.event = event;
        }

        @Override
        JSONObject toJson() throws JSONException {
            return event != null ? event.toJson() : null;
        }
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
    }

    static class Delete extends Result {
        Delete() {
        }

        @Override
        Boolean toJson() throws JSONException {
            return true;
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
    }

    private final List<Result> results = new ArrayList<>();

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
}
