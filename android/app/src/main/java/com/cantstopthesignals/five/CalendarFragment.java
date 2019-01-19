package com.cantstopthesignals.five;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.app.Fragment;
import android.app.LoaderManager;
import android.content.ContentResolver;
import android.content.CursorLoader;
import android.content.Loader;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.provider.CalendarContract.Events;
import android.util.Log;
import android.view.LayoutInflater;
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

public class CalendarFragment extends Fragment {
    private static final String TAG = "CalendarFragment";

    private static final Uri DEBUG_URI = Uri.parse("http://localhost:8888/?jsmode=uncompiled&Debug=true");
    private static final Uri RELEASE_URI = Uri.parse("https://five-minutes-cssignal.appspot.com/");

    private static final String KEY_START_TIME = "startTime";
    private static final String KEY_END_TIME = "endTime";

    private static final String JAVASCRIPT_INTERFACE_NAME = "Android";

    private static final String ARG_CALENDAR_INFO = "calendar_info";

    private static final String[] EVENTS_PROJECTION = new String[] {
            Events._ID,
            Events.TITLE,
            Events.DTSTART,
            Events.DTEND,
            Events.SYNC_DATA4 // etag
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

    public boolean matchesCalendar(CalendarInfo calendarInfo) {
        return mCalendarInfo.equals(calendarInfo);
    }

    public static class WebAppInterface {
        CalendarFragment mFragment;

        /** Instantiate the interface and set the context */
        public WebAppInterface(CalendarFragment fragment) {
            mFragment = fragment;
        }

        @JavascriptInterface
        public String loadCalendarData() {
            Log.d(TAG, "loadCalendarData()");
            JSONObject result = new JSONObject();
            try {
                result.put("summary", mFragment.mCalendarInfo.displayName);
                result.put("id", mFragment.mCalendarInfo.id);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            return result.toString();
        }

        @JavascriptInterface
        public String loadEvents(long calendarId, long startTime, long endTime, String jsCallback) {
            if (calendarId != mFragment.mCalendarInfo.id) {
                throw new IllegalArgumentException("Unexpected calendar: " + calendarId);
            }
            Calendar startTimeCalendar = Calendar.getInstance();
            startTimeCalendar.setTimeInMillis(startTime);
            Calendar endTimeCalendar = Calendar.getInstance();
            endTimeCalendar.setTimeInMillis(endTime);
            Log.d(TAG, "loadEvents(" + calendarId + ", " + startTimeCalendar + ", "
                    + endTimeCalendar + ", '" + jsCallback + "')");
            mFragment.loadCalendarEvents(startTimeCalendar, endTimeCalendar, jsCallback);
            JSONObject result = new JSONObject();
            try {
                result.put("success", true);
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            return result.toString();
        }

        public void onEventsLoaded(String jsCallback, List<Event> events) {
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
            mFragment.mWebView.evaluateJavascript(
                    jsCallback + "(" + result.toString() +  ");", null);
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
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        mCalendarInfo = getArguments().getParcelable(ARG_CALENDAR_INFO);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_calendar, container, false);
    }

    @Override
    public void onViewCreated(View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

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

        mWebAppInterface = new WebAppInterface(this);

        mWebView.addJavascriptInterface(mWebAppInterface, JAVASCRIPT_INTERFACE_NAME);

        if (BuildConfig.DEBUG) {
            mWebView.clearCache(true);
        }
        mWebView.loadUrl(getWebUri().toString());
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_example) {
            syncCalendar();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private static Uri getWebUri() {
        if (BuildConfig.DEBUG) {
            return DEBUG_URI;
        } else {
            return RELEASE_URI;
        }
    }

    private void loadCalendarEvents(Calendar startTime, Calendar endTime, String jsCallback) {
        if (!isAdded()) {
            Log.w(TAG, "Not attached");
            return;
        }

        Bundle args = new Bundle();
        args.putLong(KEY_START_TIME, startTime.getTimeInMillis());
        args.putLong(KEY_END_TIME, endTime.getTimeInMillis());
        getLoaderManager().restartLoader(CALENDAR_EVENTS_LOADER_ID, args,
                new LoaderCallback(jsCallback));
    }

    public void syncCalendar() {
        Log.d(TAG, "syncCalendar()");
        Account[] accounts = AccountManager.get(getContext()).getAccounts();
        for (Account account : accounts) {
            if (account.name.equals(mCalendarInfo.accountName)) {
                String authority = CalendarContract.Calendars.CONTENT_URI.getAuthority();
                Bundle extras = new Bundle();
                extras.putBoolean(ContentResolver.SYNC_EXTRAS_MANUAL, true);
                extras.putBoolean(ContentResolver.SYNC_EXTRAS_EXPEDITED, true);
                ContentResolver.requestSync(account, authority, extras);
                return;
            }
        }
        Log.e(TAG, "Failed to find account to sync calendar");
    }

    class LoaderCallback implements LoaderManager.LoaderCallbacks<Cursor> {
        final String mJsCallback;

        LoaderCallback(String jsCallback) {
            mJsCallback = jsCallback;
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
                            + Events.DTSTART + " >= ?) AND (" + Events.DTEND + " <= ?))");
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
                Calendar startTime = Calendar.getInstance();
                startTime.setTimeInMillis(cursor.getLong(EVENTS_PROJECTION_DTSTART_INDEX));
                Calendar endTime = Calendar.getInstance();
                endTime.setTimeInMillis(cursor.getLong(EVENTS_PROJECTION_DTEND_INDEX));
                String etag = cursor.getString(EVENTS_PROJECTION_ETAG_INDEX);
                eventList.add(new Event(
                        cursor.getLong(EVENTS_PROJECTION_ID_INDEX),
                        cursor.getString(EVENTS_PROJECTION_TITLE_INDEX),
                        startTime, endTime, etag));
            }
            Log.d(TAG, eventList.size() + " events loaded");
            Collections.sort(eventList);

            mWebAppInterface.onEventsLoaded(mJsCallback, eventList);
        }

        @Override
        public void onLoaderReset(Loader<Cursor> loader) {
        }
    }
}
