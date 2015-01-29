package com.cantstopthesignals.five;

import android.app.Activity;
import android.app.Fragment;
import android.app.LoaderManager;
import android.content.CursorLoader;
import android.content.Loader;
import android.database.Cursor;
import android.os.Bundle;
import android.provider.CalendarContract.Events;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.List;

public class CalendarFragment extends Fragment implements LoaderManager.LoaderCallbacks<Cursor> {
    private static final String TAG = "CalendarFragment";

    private static final String ARG_CALENDAR_INFO = "calendar_info";

    private static final String[] EVENTS_PROJECTION = new String[] {
            Events._ID,
            Events.TITLE,
            Events.DTSTART,
            Events.DTEND
    };
    private static final int EVENTS_PROJECTION_ID_INDEX = 0;
    private static final int EVENTS_PROJECTION_TITLE_INDEX = 1;
    private static final int EVENTS_PROJECTION_DTSTART_INDEX = 2;
    private static final int EVENTS_PROJECTION_DTEND_INDEX = 3;

    private static final int CALENDAR_EVENTS_LOADER_ID = 0;

    private CalendarInfo mCalendarInfo;
    private Calendar mStartTime;
    private Calendar mEndTime;
    private CalendarListView mCalendarList;

    public static CalendarFragment newInstance(CalendarInfo calendarInfo) {
        CalendarFragment fragment = new CalendarFragment();
        Bundle args = new Bundle();
        args.putParcelable(ARG_CALENDAR_INFO, calendarInfo);
        fragment.setArguments(args);
        return fragment;
    }

    public CalendarFragment() {
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        mCalendarInfo = getArguments().getParcelable(ARG_CALENDAR_INFO);
        ((MainActivity) activity).onCalendarFragmentAttached(mCalendarInfo);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_main, container, false);
    }

    @Override
    public void onViewCreated(View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        mCalendarList = (CalendarListView) view.findViewById(R.id.calendar_list);
    }

    @Override
    public void onResume() {
        super.onResume();
        updateTimeRange();
        loadCalendarEvents();
    }

    private void updateTimeRange() {
        Calendar startTime = Calendar.getInstance();
        startTime.setTime(new Date());
        startTime.set(Calendar.HOUR_OF_DAY, 0);
        startTime.set(Calendar.MINUTE, 0);
        startTime.set(Calendar.SECOND, 0);
        startTime.set(Calendar.MILLISECOND, 0);
        startTime.add(Calendar.DAY_OF_MONTH, -1);
        Calendar endTime = (Calendar) startTime.clone();
        endTime.add(Calendar.DAY_OF_MONTH, 4);
        mStartTime = startTime;
        mEndTime = endTime;
    }

    private void loadCalendarEvents() {
        getLoaderManager().restartLoader(CALENDAR_EVENTS_LOADER_ID, null, this);
    }

    @Override
    public Loader<Cursor> onCreateLoader(int loaderId, Bundle bundle) {
        switch (loaderId) {
            case CALENDAR_EVENTS_LOADER_ID:
                CursorLoader loader = new CursorLoader(getActivity());
                loader.setUri(Events.CONTENT_URI);
                loader.setSelection("((" + Events.CALENDAR_ID + " = ?) AND ("
                        + Events.DTSTART + " >= ?) AND (" + Events.DTEND + " <= ?))");
                loader.setSelectionArgs(new String[]{Long.toString(mCalendarInfo.id),
                        Long.toString(mStartTime.getTimeInMillis()),
                        Long.toString(mEndTime.getTimeInMillis())
                });
                loader.setProjection(EVENTS_PROJECTION);
                return loader;
        }
        return null;
    }

    @Override
    public void onLoadFinished(Loader<Cursor> loader, Cursor cursor) {
        List<EventInfo> eventList = new ArrayList<>();
        while (cursor.moveToNext()) {
            Calendar startTime = Calendar.getInstance();
            startTime.setTimeInMillis(cursor.getLong(EVENTS_PROJECTION_DTSTART_INDEX));
            Calendar endTime = Calendar.getInstance();
            endTime.setTimeInMillis(cursor.getLong(EVENTS_PROJECTION_DTEND_INDEX));
            eventList.add(new EventInfo(
                    cursor.getLong(EVENTS_PROJECTION_ID_INDEX),
                    cursor.getString(EVENTS_PROJECTION_TITLE_INDEX),
                    startTime, endTime));
        }
        Log.d(TAG, eventList.size() + " events loaded");
        Collections.sort(eventList);
        mCalendarList.setEvents(eventList);
    }

    @Override
    public void onLoaderReset(Loader<Cursor> loader) {
    }
}
