package com.cantstopthesignals.five;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

class EventOperations {
    static abstract class Operation {
        enum Type {
            CREATE,
            SAVE,
            DELETE
        }

        abstract Type getType();
    }

    static class Create extends Operation {
        final EventPatch eventPatch;

        private Create(EventPatch eventPatch) {
            this.eventPatch = eventPatch;
        }

        private static Create fromJson(JSONObject jsonObject) throws JSONException {
            JSONObject eventData = jsonObject.getJSONObject("eventData");
            EventPatch eventPatch = EventPatch.fromJson(eventData);
            return new Create(eventPatch);
        }

        @Override
        Type getType() {
            return Type.CREATE;
        }
    }

    static class Save extends Operation {
        final Event event;
        final EventPatch eventPatch;

        private Save(Event event, EventPatch eventPatch) {
            this.event = event;
            this.eventPatch = eventPatch;
        }

        private static Save fromJson(JSONObject jsonObject) throws JSONException {
            JSONObject eventData = jsonObject.getJSONObject("eventData");
            Event event = Event.fromJson(eventData);
            JSONObject eventPatchData = jsonObject.getJSONObject("eventPatchData");
            EventPatch eventPatch = EventPatch.fromJson(eventPatchData);
            return new Save(event, eventPatch);
        }

        @Override
        Type getType() {
            return Type.SAVE;
        }
    }

    static class Delete extends Operation {
        final Event event;

        private Delete(Event event) {
            this.event = event;
        }

        private static Delete fromJson(JSONObject jsonObject) throws JSONException {
            JSONObject eventData = jsonObject.getJSONObject("eventDeleteData");
            Event event = Event.fromJson(eventData);
            return new Delete(event);
        }

        @Override
        Type getType() {
            return Type.DELETE;
        }
    }

    final List<Operation> operations;

    private EventOperations(List<Operation> operations) {
        this.operations = operations;
    }

    static EventOperations fromJson(JSONArray operationsData) throws JSONException {
        List<Operation> operations = new ArrayList<>();

        for (int i = 0; i < operationsData.length(); i++) {
            JSONObject operationItem = operationsData.getJSONObject(i);
            switch (operationItem.getString("type")) {
                case "create":
                    operations.add(Create.fromJson(operationItem));
                    break;
                case "save":
                    operations.add(Save.fromJson(operationItem));
                    break;
                case "delete":
                    operations.add(Delete.fromJson(operationItem));
                    break;
                default:
                    throw new IllegalArgumentException("Unexpected type");
            }
        }

        return new EventOperations(operations);
    }
}
