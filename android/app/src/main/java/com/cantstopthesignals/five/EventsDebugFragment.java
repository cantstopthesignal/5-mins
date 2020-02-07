package com.cantstopthesignals.five;

import android.app.Fragment;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.style.ForegroundColorSpan;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class EventsDebugFragment extends Fragment {
    private static final String TAG = "EventsDebugFragment";

    private LinearLayout mContentView = null;

    private Map<Long, Event> mEventsBackup = new HashMap<>();
    private List<Event> mDeletedEvents = new ArrayList<>();
    private Set<Long> mTrackedEventIds = new HashSet<>();
    private SharedPreferences mEventTextSharedPreferences = null;
    private static SimpleDateFormat sDateTimeFormat =
            new SimpleDateFormat("MM-dd HH:mm:ss", Locale.US);

    private final String BACKUP_EVENTS_KEY = "EVENTS";
    private final String DELETED_KEY = "DELETED";
    private final String TRACKED_KEY = "TRACKED";

    public EventsDebugFragment() {
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        loadEventTextSharedPreferences();
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        return inflater.inflate(
                R.layout.fragment_events_debug, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        mContentView = view.findViewById(R.id.content);
    }

    private void loadEventTextSharedPreferences() {
        if (mEventTextSharedPreferences != null) {
            throw new RuntimeException("Expected null shared prefs");
        }
        mEventTextSharedPreferences = getActivity().getSharedPreferences(
                "EventDebug", Context.MODE_PRIVATE);
        Set<String> backup = mEventTextSharedPreferences.getStringSet(
                BACKUP_EVENTS_KEY, new HashSet<String>());
        Set<String> deletedEvents = mEventTextSharedPreferences.getStringSet(
                DELETED_KEY, new HashSet<String>());
        Set<String> trackedEventIdStrings = mEventTextSharedPreferences.getStringSet(
                TRACKED_KEY, new HashSet<String>());
        try {
            for (String backupStr : backup) {
                Event event = Event.fromJson(new JSONObject(backupStr));
                mEventsBackup.put(event.id, event);
            }
            for (String deletedStr : deletedEvents) {
                Event event = Event.fromJson(new JSONObject(deletedStr));
                mDeletedEvents.add(event);
            }
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
        for (String trackedEventIdString : trackedEventIdStrings) {
            mTrackedEventIds.add(Long.valueOf(trackedEventIdString));
        }
    }

    private void saveEventTextSharedPreferences() {
        Set<String> backup = new HashSet<>();
        Set<String> deletedEvents = new HashSet<>();
        Set<String> trackedEventIdStrings = new HashSet<>();
        try {
            for (Event event : mEventsBackup.values()) {
                backup.add(event.toJson().toString());
            }
            for (Event event : mDeletedEvents) {
                deletedEvents.add(event.toJson().toString());
            }
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
        for (Long trackedEventId : mTrackedEventIds) {
            trackedEventIdStrings.add(Long.toString(trackedEventId));
        }
        mEventTextSharedPreferences.edit()
                .putStringSet(BACKUP_EVENTS_KEY, backup)
                .putStringSet(DELETED_KEY, deletedEvents)
                .putStringSet(TRACKED_KEY, trackedEventIdStrings)
                .apply();
    }

    public void onEventsLoaded(List<Event> events, Calendar startTime, Calendar endTime) {
        Map<Long, Event> currentEvents = new HashMap<>();
        for (Event event : events) {
            if (event.id == null) {
                continue;
            }
            currentEvents.put(event.id, event);
            if (!mEventsBackup.containsKey(event.id)) {
                mEventsBackup.put(event.id, event);
            }
        }

        Map<Long, Event> newBackups = new HashMap<>();
        for (long id : mEventsBackup.keySet()) {
            if (currentEvents.containsKey(id)) {
                newBackups.put(id, currentEvents.get(id));
            } else {
                Event deletedEvent = mEventsBackup.get(id);
                if (!deletedEvent.startTime.after(endTime) &&
                        !deletedEvent.endTime.before(startTime) &&
                        mTrackedEventIds.contains(id)) {
                    mDeletedEvents.add(deletedEvent);
                } else {
                    mTrackedEventIds.remove(id);
                }
            }
        }
        mEventsBackup = newBackups;

        saveEventTextSharedPreferences();

        generateEventDebugViewAndAlert(true);
    }

    private void generateEventDebugViewAndAlert(boolean showToast) {
        mContentView.removeAllViews();

        Collections.sort(mDeletedEvents,
                (event1, event2) -> -event1.endTime.compareTo(event2.endTime));

        if (mDeletedEvents.size() != 0) {
            String deletedStr = "";
            for (Event deletedEvent : mDeletedEvents) {
                if (deletedStr.length() > 40) {
                    deletedStr += ", ...";
                    break;
                }
                if (!deletedStr.isEmpty()) {
                    deletedStr += ", ";
                }
                deletedStr += "\"" + deletedEvent.title + "\"";
            }
            String msg = "5-mins";            if (!deletedStr.isEmpty()) {
                msg += "; " + mDeletedEvents.size() + " deleted: " + deletedStr;
            }
            if (showToast) {
                SpannableString msgSpannable = new SpannableString(msg);
                msgSpannable.setSpan(new ForegroundColorSpan(Color.RED), 0, msgSpannable.length(), 0);
                Toast.makeText(getActivity(), msgSpannable, Toast.LENGTH_LONG).show();
            }

            TextView textView = new TextView(getActivity());
            textView.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
            textView.setText(msg + "\n");
            mContentView.addView(textView);
        }

        if (!mTrackedEventIds.isEmpty()) {
            TextView textView = new TextView(getActivity());
            textView.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
            textView.setText(mTrackedEventIds.size() + " tracked\n");
            mContentView.addView(textView);
        }

        int index = 0;
        for (Event deletedEvent : mDeletedEvents) {
            TextView textView = new TextView(getActivity());
            textView.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
            textView.setText("Deleted Event " + deletedEvent.id + " " +
                    sDateTimeFormat.format(deletedEvent.startTime.getTime()) + " - " +
                    sDateTimeFormat.format(deletedEvent.endTime.getTime()) + ": " +
                    deletedEvent.title);
            textView.setBackgroundColor(
                    (index % 2) == 0 ? Color.argb(255, 80, 80, 80) : 0);
            mContentView.addView(textView);
            index++;
        }

        LinearLayout buttonBar = new LinearLayout(getActivity());
        buttonBar.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        buttonBar.setOrientation(LinearLayout.HORIZONTAL);
        mContentView.addView(buttonBar);

        Button clearButton = new Button(getActivity());
        LinearLayout.LayoutParams clearButtonLayoutParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT);
        clearButtonLayoutParams.weight = .5f;
        clearButton.setLayoutParams(clearButtonLayoutParams);
        clearButton.setText("Clear");
        clearButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mDeletedEvents.clear();
                mTrackedEventIds.clear();
                saveEventTextSharedPreferences();

                hide();

                generateEventDebugViewAndAlert(false);
            }
        });
        buttonBar.addView(clearButton);

        Button closeButton = new Button(getActivity());
        LinearLayout.LayoutParams closeButtonLayoutParams = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT);
        closeButtonLayoutParams.weight = .5f;
        closeButton.setLayoutParams(closeButtonLayoutParams);
        closeButton.setText("Close");
        closeButton.setOnClickListener(v -> hide());
        buttonBar.addView(closeButton);
    }

    public void handleEventOperationResults(EventOperationResults results) {
        int numCreate = 0;
        int numSave = 0;
        int numDeleteMatch = 0;
        int numDeleteUnmatch = 0;
        int numDeleteNull = 0;
        for (EventOperationResults.Result result : results.getResults()) {
            if (result instanceof EventOperationResults.Save) {
                EventOperationResults.Save saveResult = (EventOperationResults.Save) result;
                if (mEventsBackup.containsKey(saveResult.event.id)) {
                    numSave++;
                } else {
                    numCreate++;
                }
                mEventsBackup.put(saveResult.event.id, saveResult.event);
                mTrackedEventIds.add(saveResult.event.id);
            } else if (result instanceof  EventOperationResults.Delete) {
                EventOperationResults.Delete deleteResult = (EventOperationResults.Delete) result;
                if (deleteResult.eventId != null) {
                    if (mEventsBackup.containsKey(deleteResult.eventId)) {
                        mEventsBackup.remove(deleteResult.eventId);
                        numDeleteMatch++;
                    } else {
                        numDeleteUnmatch++;
                    }
                    mTrackedEventIds.remove(deleteResult.eventId);
                } else {
                    numDeleteNull++;
                }
            }
        }
        String extras = "";
        if (numCreate > 0) {
            extras += (!extras.isEmpty() ? ", " : "") + numCreate + " Created";
        }
        if (numSave > 0) {
            extras += (!extras.isEmpty() ? ", " : "") + numSave + " Saved";
        }
        if (numDeleteMatch > 0) {
            extras += (!extras.isEmpty() ? ", " : "") + numDeleteMatch + " DeleteMatched";
        }
        if (numDeleteUnmatch > 0) {
            extras += (!extras.isEmpty() ? ", " : "") + numDeleteUnmatch + " DeleteUnmatch";
        }
        if (numDeleteNull > 0) {
            extras += (!extras.isEmpty() ? ", " : "") + numDeleteNull + " DeleteNull";
        }

        CharSequence msg = results.toCharSequence() +
                (!extras.isEmpty() ? "\n(" + extras + ")" : "");

        Toast.makeText(getActivity(), msg, Toast.LENGTH_LONG).show();
    }

    private void hide() {
        getFragmentManager().beginTransaction().hide(this).commitAllowingStateLoss();
    }
}
