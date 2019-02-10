package com.cantstopthesignals.five;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.app.Fragment;
import android.app.LoaderManager;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.CursorLoader;
import android.content.Intent;
import android.content.Loader;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.provider.CalendarContract.Events;
import android.support.design.widget.FloatingActionButton;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.TimeZone;
import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;

public class CalendarFragment extends Fragment {
    private static final String TAG = "CalendarFragment";

    private static final Uri DEBUG_URI = Uri.parse("http://localhost:8888/?jsmode=uncompiled&Debug=true");
    private static final Uri RELEASE_URI = Uri.parse("https://five-minutes-cssignal.appspot.com/");

    private static final String KEY_START_TIME = "startTime";
    private static final String KEY_END_TIME = "endTime";

    private static final String JAVASCRIPT_INTERFACE_NAME = "Android";

    private static final String ARG_CALENDAR_INFO = "calendar_info";

    private static final String EVENTS_ETAG = Events.SYNC_DATA4;

    private static final String[] EVENTS_PROJECTION = new String[] {
            Events._ID,
            Events.TITLE,
            Events.DTSTART,
            Events.DTEND,
            EVENTS_ETAG
    };
    private static final int EVENTS_PROJECTION_ID_INDEX = 0;
    private static final int EVENTS_PROJECTION_TITLE_INDEX = 1;
    private static final int EVENTS_PROJECTION_DTSTART_INDEX = 2;
    private static final int EVENTS_PROJECTION_DTEND_INDEX = 3;
    private static final int EVENTS_PROJECTION_ETAG_INDEX = 4;

    private static final int CALENDAR_EVENTS_LOADER_ID = 0;

    private CalendarInfo mCalendarInfo;
    private WebView mWebView;
    private WebAppInterface mWebAppInterface;

    private List<String> mLoadEventsJsCallbacks = new ArrayList<>();
    private String mLoadEventsDefaultJsCallback;

    private FloatingActionButton mFab;
    private Menu mMenu;
    private List<ButtonInfo> mButtonInfos = new ArrayList<>();

    public boolean matchesCalendar(CalendarInfo calendarInfo) {
        return mCalendarInfo.equals(calendarInfo);
    }

    private static class ButtonInfo {
        public ButtonInfo(String id, int resId) {
            this.id = id;
            this.resId = resId;
        }

        public final String id;
        public final int resId;
        public String jsCallback;
    }

    private ButtonInfo getButtonById(String buttonId) {
        for (ButtonInfo buttonInfo : mButtonInfos) {
            if (buttonInfo.id.equals(buttonId)) {
                return buttonInfo;
            }
        }
        return null;
    }

    private ButtonInfo getButtonByResId(int resId) {
        for (ButtonInfo buttonInfo : mButtonInfos) {
            if (buttonInfo.resId == resId) {
                return buttonInfo;
            }
        }
        return null;
    }

    private static class RunOnUiThreadSync<ReturnValue> implements Runnable {
        public ReturnValue returnValue;
        public RuntimeException exception;

        private final Activity mActivity;
        private final Callable<ReturnValue> mCallable;
        private final Semaphore mSemphore = new Semaphore(0);

        public RunOnUiThreadSync(Activity activity, Callable<ReturnValue> callable) {
            mActivity = activity;
            mCallable = callable;
        }

        @Override
        public void run() {
            try {
                returnValue = mCallable.call();
            } catch (RuntimeException e) {
                exception = e;
            } catch (Exception e) {
                exception = new RuntimeException(e);
            }
            mSemphore.release();
        }

        public ReturnValue call() {
            mActivity.runOnUiThread(this);
            mSemphore.acquireUninterruptibly();
            if (exception != null) {
                throw exception;
            }
            return returnValue;
        }
    }

    private void runOnUiThreadSync(final Runnable runnable) {
        new RunOnUiThreadSync<Void>(getActivity(), () -> {
            runnable.run();
            return null;
        }).call();
    }

    private <ReturnValue> ReturnValue runOnUiThreadSync(final Callable<ReturnValue> callable) {
        return new RunOnUiThreadSync<>(getActivity(), callable).call();
    }

    public static class WebAppInterface {
        CalendarFragment mFragment;

        /** Instantiate the interface and set the context */
        public WebAppInterface(CalendarFragment fragment) {
            mFragment = fragment;
        }

        @JavascriptInterface
        public void addButton(final String buttonId, final String jsCallback) {
            mFragment.runOnUiThreadSync(() -> {
                ButtonInfo buttonInfo = mFragment.getButtonById(buttonId);
                if (buttonInfo == null) {
                    int resId;
                    if ("refresh".equals(buttonId)) {
                        resId = R.id.action_refresh;
                    } else if ("save".equals(buttonId)) {
                        resId = R.id.action_save;
                    } else if ("now".equals(buttonId)) {
                        resId = R.id.action_now;
                    } else if ("propose".equals(buttonId)) {
                        resId = R.id.action_propose;
                    } else {
                        throw new IllegalArgumentException("Unexpected button id: " + buttonId);
                    }
                    buttonInfo = new ButtonInfo(buttonId, resId);
                    mFragment.mButtonInfos.add(buttonInfo);
                    if (buttonInfo.resId == R.id.action_propose) {
                        mFragment.mFab.show();
                    } else {
                        mFragment.mMenu.findItem(buttonInfo.resId).setVisible(true);
                    }
                }
                buttonInfo.jsCallback = jsCallback;
            });
        }

        @JavascriptInterface
        public void setButtonVisible(String buttonId, boolean isVisible) {
            mFragment.runOnUiThreadSync(() -> {
                ButtonInfo buttonInfo = mFragment.getButtonById(buttonId);
                if (buttonInfo == null) {
                    throw new IllegalArgumentException("Button not found: " + buttonId);
                }
                if (mFragment.mMenu == null) {
                    throw new IllegalStateException("Menu is null");
                }
                mFragment.mMenu.findItem(buttonInfo.resId).setVisible(isVisible);
            });
        }

        @JavascriptInterface
        public String loadCalendarData() {
            Log.d(TAG, "loadCalendarData()");
            return mFragment.runOnUiThreadSync(() -> {
                JSONObject result = new JSONObject();
                try {
                    result.put("summary", mFragment.mCalendarInfo.displayName);
                    result.put("id", mFragment.mCalendarInfo.id);
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                return result.toString();
            });
        }

        @JavascriptInterface
        public void loadEvents(long calendarId, long startTime, long endTime, String jsCallback)
                throws JSONException {
            if (calendarId != mFragment.mCalendarInfo.id) {
                throw new IllegalArgumentException("Unexpected calendar: " + calendarId);
            }
            final Calendar startTimeCalendar = Calendar.getInstance();
            startTimeCalendar.setTimeInMillis(startTime);
            final Calendar endTimeCalendar = Calendar.getInstance();
            endTimeCalendar.setTimeInMillis(endTime);
            Log.d(TAG, "loadEvents(" + calendarId + ", " + startTimeCalendar + ", "
                    + endTimeCalendar + ", '" + jsCallback + "')");
            mFragment.runOnUiThreadSync(() -> {
                mFragment.mLoadEventsJsCallbacks.add(jsCallback);
                mFragment.loadCalendarEvents(startTimeCalendar, endTimeCalendar);
                mFragment.syncCalendar(true);
            });
        }

        @JavascriptInterface
        public void registerEventsListener(String jsCallback) {
            mFragment.runOnUiThreadSync(() -> {
                mFragment.mLoadEventsDefaultJsCallback = jsCallback;
            });
        }

        @JavascriptInterface
        public void requestSync() {
            mFragment.runOnUiThreadSync(() -> {
                mFragment.syncCalendar(false);
            });
        }

        @JavascriptInterface
        public String createEvent(long calendarId, String eventDataString) throws JSONException {
            JSONObject eventData = new JSONObject(eventDataString);
            Log.d(TAG,"createEvent(" + eventDataString + ")");
            EventPatch eventPatch = EventPatch.fromJson(eventData);
            return mFragment.runOnUiThreadSync(() -> {
                Event event = mFragment.createEvent(calendarId, eventPatch);
                return event.toJson().toString();
            });
        }

        @JavascriptInterface
        public String saveEvent(final long calendarId, String eventIdString,
                String eventPatchDataString) throws JSONException {
            final long eventId = Long.parseLong(eventIdString);
            JSONObject eventPatchData = new JSONObject(eventPatchDataString);
            EventPatch eventPatch = EventPatch.fromJson(eventPatchData);
            Log.d(TAG,"saveEvent(" + calendarId + ", " + eventId + ", "
                    + eventPatchDataString + ")");
            return mFragment.runOnUiThreadSync(() -> {
                Event event = mFragment.saveEvent(calendarId, eventId, eventPatch);
                return event.toJson().toString();
            });
        }

        @JavascriptInterface
        public void deleteEvent(long calendarId, String eventIdString) throws JSONException {
            final long eventId = Long.parseLong(eventIdString);
            Log.d(TAG,"deleteEvent(" + calendarId + ", " + eventIdString + ")");
            if (!mFragment.runOnUiThreadSync(
                    () -> mFragment.deleteEvent(calendarId, eventId))) {
                throw new RuntimeException("Could not delete event " + eventId);
            }
        }

        @JavascriptInterface
        public void openEventEditor(long calendarId, String eventIdString) throws JSONException {
            final long eventId = Long.parseLong(eventIdString);
            Log.d(TAG,"openEventEditor(" + calendarId + ", " + eventIdString + ")");
            mFragment.runOnUiThreadSync(() -> mFragment.openEventEditor(calendarId, eventId));
        }

        public void onEventsLoaded(List<Event> events) {
            JSONObject result = new JSONObject();
            try {
                result.put("kind", "calendar#events");
                JSONArray items = new JSONArray();
                for (Event event : events) {
                    items.put(event.toJson());
                }
                result.put("items", items);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            String jsCallback = mFragment.mLoadEventsDefaultJsCallback;
            if (!mFragment.mLoadEventsJsCallbacks.isEmpty()) {
                jsCallback = mFragment.mLoadEventsJsCallbacks.remove(0);
            }
            if (jsCallback != null) {
                mFragment.mWebView.evaluateJavascript(
                        jsCallback + "(" + result.toString() + ");", null);
            }
        }
    }

    public static CalendarFragment newInstance(CalendarInfo calendarInfo) {
        CalendarFragment fragment = new CalendarFragment();
        Bundle args = new Bundle();
        args.putParcelable(ARG_CALENDAR_INFO, calendarInfo);
        fragment.setArguments(args);
        return fragment;
    }

    public CalendarFragment() {
        WebView.setWebContentsDebuggingEnabled(true);
    }

    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        mCalendarInfo = getArguments().getParcelable(ARG_CALENDAR_INFO);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setHasOptionsMenu(true);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_calendar, container, false);
    }

    @Override
    public void onViewCreated(View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        mFab = view.findViewById(R.id.fab);
        mFab.setOnClickListener(fabView -> maybeInvokeJavascriptButton(R.id.action_propose));

        mWebView = view.findViewById(R.id.webview);
        mWebView.setWebViewClient(new WebViewClient());
        mWebView.setWebChromeClient(new WebChromeClient());

        WebSettings webSettings = mWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);

        mWebAppInterface = new WebAppInterface(this);

        mWebView.addJavascriptInterface(mWebAppInterface, JAVASCRIPT_INTERFACE_NAME);

        boolean clearCache = BuildConfig.DEBUG;
        reload(clearCache);
    }

    private void createEventForNextHour() {
        Calendar startTime = Calendar.getInstance();
        startTime = Util.roundToFiveMinutes(startTime);
        Calendar endTime = (Calendar) startTime.clone();
        endTime.add(Calendar.HOUR, 1);
        Intent intent = new Intent(Intent.ACTION_INSERT)
                .setData(Events.CONTENT_URI)
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startTime.getTimeInMillis())
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTime.getTimeInMillis())
                .putExtra(Events.TITLE, "");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        super.onCreateOptionsMenu(menu, inflater);
        mMenu = menu;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_clear_cache) {
            reload(true);
            return true;
        }

        if (maybeInvokeJavascriptButton(item.getItemId())) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private boolean maybeInvokeJavascriptButton(int resId) {
        ButtonInfo buttonInfo = getButtonByResId(resId);
        if (buttonInfo != null && buttonInfo.jsCallback != null) {
            mWebView.evaluateJavascript(
                    buttonInfo.jsCallback + "();", null);
            return true;
        }
        return false;
    }

    private void reload(boolean clearCache) {
        for (ButtonInfo buttonInfo : mButtonInfos) {
            if (buttonInfo.resId == R.id.action_propose) {
                mFab.hide();
            } else {
                mMenu.findItem(buttonInfo.resId).setVisible(false);
            }
        }
        mButtonInfos.clear();

        if (clearCache) {
            mWebView.clearCache(true);
        }
        mWebView.loadUrl(getWebUri().toString());
    }

    private static Uri getWebUri() {
        if (BuildConfig.DEBUG) {
            return DEBUG_URI;
        } else {
            return RELEASE_URI;
        }
    }

    private void loadCalendarEvents(Calendar startTime, Calendar endTime) {
        if (!isAdded()) {
            Log.w(TAG, "Not attached");
            return;
        }

        Bundle args = new Bundle();
        args.putLong(KEY_START_TIME, startTime.getTimeInMillis());
        args.putLong(KEY_END_TIME, endTime.getTimeInMillis());
        getLoaderManager().restartLoader(CALENDAR_EVENTS_LOADER_ID, args, new LoaderCallback());
    }

    private Event createEvent(long calendarId, EventPatch eventPatch) {
        if (eventPatch.title == null || eventPatch.startTime == null
                || eventPatch.endTime == null) {
            throw new IllegalArgumentException("Missing fields in create event patch");
        }
        ContentResolver cr = getActivity().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(Events.TITLE, eventPatch.title);
        values.put(Events.DTSTART, eventPatch.startTime.getTimeInMillis());
        values.put(Events.DTEND, eventPatch.endTime.getTimeInMillis());
        values.put(Events.CALENDAR_ID, calendarId);
        values.put(Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
        Uri eventUri = cr.insert(Events.CONTENT_URI, values);
        if (eventUri == null) {
            throw new NullPointerException("eventUri is null");
        }
        Cursor cursor = cr.query(eventUri, EVENTS_PROJECTION, null, null,
                null,null);
        if (!cursor.moveToNext()) {
            throw new RuntimeException("Could not find created event");
        }
        return eventFromCursor(cursor);
    }

    private Event saveEvent(long calendarId, long eventId, EventPatch eventPatch) {
        ContentResolver cr = getActivity().getContentResolver();
        Uri eventUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId);
        ContentValues event = new ContentValues();
        if (eventPatch.title != null) {
            event.put(Events.TITLE, eventPatch.title);
        }
        if (eventPatch.startTime != null) {
            event.put(Events.DTSTART, eventPatch.startTime.getTimeInMillis());
        }
        if (eventPatch.endTime != null) {
            event.put(Events.DTEND, eventPatch.endTime.getTimeInMillis());
        }
        int rowsUpdated = cr.update(eventUri, event, null, null);
        if (rowsUpdated > 1) {
            throw new IllegalStateException("Updated more than one row!");
        } else if (rowsUpdated == 0) {
            return null;
        }
        Cursor cursor = cr.query(eventUri, EVENTS_PROJECTION, null, null,
                null,null);
        if (!cursor.moveToNext()) {
            throw new RuntimeException("Could not find saved event");
        }
        return eventFromCursor(cursor);
    }

    private boolean deleteEvent(long calendarId, long eventId) {
        ContentResolver cr = getActivity().getContentResolver();
        Uri eventUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId);
        ContentValues event = new ContentValues();
        event.put(Events.DELETED, true);
        int rowsDeleted = cr.update(eventUri, event, null, null);
        if (rowsDeleted > 1) {
            throw new IllegalStateException("Deleted more than one row!");
        }
        return rowsDeleted > 0;
    }

    private void openEventEditor(long calendarId, long eventId) {
        Uri uri = ContentUris.withAppendedId(Events.CONTENT_URI, eventId);
        Intent intent = new Intent(Intent.ACTION_VIEW)
                .setData(uri);
        startActivity(intent);
    }

    private void syncCalendar(boolean expedited) {
        Log.d(TAG, "syncCalendar()");
        Account[] accounts = AccountManager.get(getContext()).getAccounts();
        for (Account account : accounts) {
            if (account.name.equals(mCalendarInfo.accountName)) {
                String authority = CalendarContract.Calendars.CONTENT_URI.getAuthority();
                Bundle extras = new Bundle();
                if (expedited) {
                    extras.putBoolean(ContentResolver.SYNC_EXTRAS_MANUAL, true);
                    extras.putBoolean(ContentResolver.SYNC_EXTRAS_EXPEDITED, true);
                }
                ContentResolver.requestSync(account, authority, extras);
                return;
            }
        }
        Log.e(TAG, "Failed to find account to sync calendar");
    }

    class LoaderCallback implements LoaderManager.LoaderCallbacks<Cursor> {

        LoaderCallback() {
        }

        @Override
        public Loader<Cursor> onCreateLoader(int loaderId, Bundle args) {
            switch (loaderId) {
                case CALENDAR_EVENTS_LOADER_ID:
                    long startTime = args.getLong(KEY_START_TIME);
                    long endTime = args.getLong(KEY_END_TIME);

                    CursorLoader loader = new CursorLoader(getActivity());
                    loader.setUri(Events.CONTENT_URI);
                    loader.setSelection("((" + Events.CALENDAR_ID + " = ?) AND ("
                            + Events.DTSTART + " >= ?) AND (" + Events.DTEND + " <= ?) AND ("
                            + Events.DELETED + " != 1))");
                    loader.setSelectionArgs(new String[]{Long.toString(mCalendarInfo.id),
                            Long.toString(startTime),
                            Long.toString(endTime)
                    });
                    loader.setProjection(EVENTS_PROJECTION);
                    return loader;
            }
            return null;
        }

        @Override
        public void onLoadFinished(Loader<Cursor> loader, Cursor cursor) {
            List<Event> eventList = new ArrayList<>();
            while (cursor.moveToNext()) {
                eventList.add(eventFromCursor(cursor));
            }
            Log.d(TAG, eventList.size() + " events loaded");
            Collections.sort(eventList);

            mWebAppInterface.onEventsLoaded(eventList);
        }

        @Override
        public void onLoaderReset(Loader<Cursor> loader) {
        }
    }

    private Event eventFromCursor(Cursor cursor) {
        Calendar startTime = Calendar.getInstance();
        startTime.setTimeInMillis(cursor.getLong(EVENTS_PROJECTION_DTSTART_INDEX));
        Calendar endTime = Calendar.getInstance();
        endTime.setTimeInMillis(cursor.getLong(EVENTS_PROJECTION_DTEND_INDEX));
        String etag = cursor.getString(EVENTS_PROJECTION_ETAG_INDEX);
        return new Event(
                cursor.getLong(EVENTS_PROJECTION_ID_INDEX),
                cursor.getString(EVENTS_PROJECTION_TITLE_INDEX),
                startTime, endTime, etag);
    }
}
