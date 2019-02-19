package com.cantstopthesignals.five;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.Activity;
import android.app.Fragment;
import android.app.LoaderManager;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.CursorLoader;
import android.content.Intent;
import android.content.Loader;
import android.content.OperationApplicationException;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.RemoteException;
import android.provider.CalendarContract;
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

import com.android.calendarcommon2.DateException;
import com.android.calendarcommon2.Duration;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.Callable;
import java.util.concurrent.Semaphore;

public class CalendarFragment extends Fragment {
    private static final String TAG = "CalendarFragment";

    private static final Uri DEBUG_URI = Uri.parse("http://localhost:8888/?jsmode=uncompiled&Debug=true");
    private static final Uri RELEASE_URI = Uri.parse("https://five-minutes-cssignal.appspot.com/");

    private static final String JAVASCRIPT_INTERFACE_NAME = "Android";

    private static final String ARG_CALENDAR_INFO = "calendar_info";

    private static final String EVENTS_ETAG = CalendarContract.Events.SYNC_DATA4;

    private static final String[] EVENTS_PROJECTION = new String[] {
            CalendarContract.Events._ID,
            CalendarContract.Events.TITLE,
            CalendarContract.Events.DTSTART,
            CalendarContract.Events.DTEND,
            CalendarContract.Events.DURATION,
            CalendarContract.Events.RRULE,
            CalendarContract.Events.RDATE,
            CalendarContract.Events.ORIGINAL_ID,
            CalendarContract.Events.ORIGINAL_INSTANCE_TIME,
            CalendarContract.Events.DELETED,
            CalendarContract.Events.STATUS,
            EVENTS_ETAG
    };

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
        ButtonInfo(String id, int resId) {
            this.id = id;
            this.resId = resId;
        }

        public final String id;
        final int resId;
        String jsCallback;
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
        ReturnValue returnValue;
        RuntimeException exception;

        private final Activity mActivity;
        private final Callable<ReturnValue> mCallable;
        private final Semaphore mSemphore = new Semaphore(0);

        RunOnUiThreadSync(Activity activity, Callable<ReturnValue> callable) {
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

        ReturnValue call() {
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
        WebAppInterface(CalendarFragment fragment) {
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
        public String applyEventOperations(long calendarId, String operationsString) throws JSONException {
            JSONArray operationsData = new JSONArray(operationsString);
            Log.d(TAG,"applyEventOperations(" + operationsString + ")");
            EventOperations eventOperations = EventOperations.fromJson(operationsData);
            return mFragment.runOnUiThreadSync(() -> {
                EventOperationResults results = mFragment.applyEventOperations(
                        calendarId, eventOperations);
                return results.toJson().toString();
            });
        }

        @JavascriptInterface
        public void openEventEditor(long calendarId, String eventIdString) throws JSONException {
            final long eventId = Long.parseLong(eventIdString);
            Log.d(TAG,"openEventEditor(" + calendarId + ", " + eventIdString + ")");
            mFragment.runOnUiThreadSync(() -> mFragment.openEventEditor(calendarId, eventId));
        }

        void onEventsLoaded(List<Event> events) {
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
                .setData(CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startTime.getTimeInMillis())
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTime.getTimeInMillis())
                .putExtra(CalendarContract.Events.TITLE, "");
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

        mLoadEventsDefaultJsCallback = null;
        mLoadEventsJsCallbacks.clear();

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

        getLoaderManager().restartLoader(CALENDAR_EVENTS_LOADER_ID, null,
                new EventsLoaderCallback(startTime, endTime));
    }

    private EventOperationResults applyEventOperations(
            long calendarId, EventOperations eventOperations) {
        ArrayList<ContentProviderOperation> providerOperations = new ArrayList<>();
        for (EventOperations.Operation operation : eventOperations.operations) {
            switch (operation.getType()) {
                case CREATE:
                    providerOperations.add(getCreateEventOperation(
                            calendarId, (EventOperations.Create) operation));
                    break;
                case SAVE:
                    providerOperations.add(getSaveEventOperation(
                            calendarId, (EventOperations.Save) operation));
                    break;
                case DELETE:
                    providerOperations.add(getDeleteEventOperation(
                            calendarId, (EventOperations.Delete) operation));
                    break;
                default:
                    throw new IllegalArgumentException("Unexpected type");
            }
        }

        ContentResolver cr = getActivity().getContentResolver();
        ContentProviderResult[] providerResults;
        try {
            providerResults = cr.applyBatch(CalendarContract.AUTHORITY, providerOperations);
        } catch (OperationApplicationException e) {
            throw new RuntimeException(e);
        } catch (RemoteException e) {
            throw new RuntimeException(e);
        }

        EventOperationResults results = new EventOperationResults();
        for (int i = 0; i < eventOperations.operations.size(); i++) {
            EventOperations.Operation operation = eventOperations.operations.get(i);
            switch (operation.getType()) {
                case CREATE:
                    results.add(getCreateEventResult(providerResults[i]));
                    break;
                case SAVE:
                    results.add(getSaveEventResult((EventOperations.Save) operation,
                            providerResults[i]));
                    break;
                case DELETE:
                    results.add(getDeleteEventResult((EventOperations.Delete) operation,
                            providerResults[i]));
                    break;
                default:
                    throw new IllegalArgumentException("Unexpected type");
            }
        }

        return results;
    }

    private ContentProviderOperation getCreateEventOperation(
            long calendarId, EventOperations.Create createOperation) {
        EventPatch eventPatch = createOperation.eventPatch;
        if (eventPatch.title == null || eventPatch.startTime == null
                || eventPatch.endTime == null) {
            throw new IllegalArgumentException("Missing fields in create event patch");
        }
        return ContentProviderOperation.newInsert(CalendarContract.Events.CONTENT_URI)
                .withValue(CalendarContract.Events.TITLE, eventPatch.title)
                .withValue(CalendarContract.Events.DTSTART, eventPatch.startTime.getTimeInMillis())
                .withValue(CalendarContract.Events.DTEND, eventPatch.endTime.getTimeInMillis())
                .withValue(CalendarContract.Events.CALENDAR_ID, calendarId)
                .withValue(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID())
                .build();
    }

    private EventOperationResults.Result getCreateEventResult(ContentProviderResult operationResult) {
        ContentResolver cr = getActivity().getContentResolver();
        if (operationResult.uri == null) {
            throw new NullPointerException("eventUri is null");
        }
        Cursor cursor = cr.query(operationResult.uri, EVENTS_PROJECTION, null, null,
                null,null);
        if (!cursor.moveToNext()) {
            return new EventOperationResults.Error("Could not find created event");
        }
        Event createdEvent = eventFromCursor(cursor);
        if (createdEvent == null) {
            return new EventOperationResults.Error("Unexpected created event cursor");
        }
        return new EventOperationResults.Save(createdEvent);
    }

    private ContentProviderOperation getSaveEventOperation(
            long calendarId, EventOperations.Save saveOperation) {
        Event event = saveOperation.event;
        EventPatch eventPatch = saveOperation.eventPatch;
        ContentValues values = new ContentValues();
        if (eventPatch.title != null) {
            values.put(CalendarContract.Events.TITLE, eventPatch.title);
        }
        if (eventPatch.startTime != null) {
            values.put(CalendarContract.Events.DTSTART,
                    eventPatch.startTime.getTimeInMillis());
        }
        if (eventPatch.endTime != null) {
            values.put(CalendarContract.Events.DTEND, eventPatch.endTime.getTimeInMillis());
        }
        if (event.id != null) {
            String where = CalendarContract.Events.CALENDAR_ID + "=? AND "
                    + CalendarContract.Events._ID + "=?";
            ArrayList<String> selectionArgs = new ArrayList<>();
            selectionArgs.add(Long.toString(calendarId));
            selectionArgs.add(Long.toString(event.id));
            if (event.etag != null) {
                where += " AND " + EVENTS_ETAG + "=?";
                selectionArgs.add(event.etag);
            }

            return ContentProviderOperation.newUpdate(CalendarContract.Events.CONTENT_URI)
                    .withValues(values)
                    .withSelection(where, selectionArgs.toArray(new String[selectionArgs.size()]))
                    .build();
        } else {
            if (event.originalId == null) {
                throw new NullPointerException("event.originalId is null");
            }
            if (event.originalInstanceTime == null) {
                throw new NullPointerException("event.originalInstanceTime is null");
            }
            if (!values.containsKey(CalendarContract.Events.TITLE)) {
                values.put(CalendarContract.Events.TITLE, event.title);
            }
            if (!values.containsKey(CalendarContract.Events.DTSTART)) {
                values.put(CalendarContract.Events.DTSTART, event.startTime.getTimeInMillis());
            }
            if (!values.containsKey(CalendarContract.Events.DTEND)) {
                values.put(CalendarContract.Events.DTEND, event.endTime.getTimeInMillis());
            }
            values.put(CalendarContract.Events.CALENDAR_ID, calendarId);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            values.put(CalendarContract.Events.ORIGINAL_ID, event.originalId);
            values.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME,
                    event.originalInstanceTime.getTimeInMillis());

            return ContentProviderOperation.newInsert(CalendarContract.Events.CONTENT_URI)
                    .withValues(values)
                    .build();
        }
    }

    private EventOperationResults.Result getSaveEventResult(
            EventOperations.Save saveOperation, ContentProviderResult operationResult) {
        Event event = saveOperation.event;
        Uri eventUri;
        if (event.id != null) {
            int rowsUpdated = operationResult.count;
            if (rowsUpdated > 1) {
                throw new IllegalStateException("Updated more than one row!");
            } else if (rowsUpdated == 0) {
                return new EventOperationResults.Error("Expected to update a row during save");
            }
            eventUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, event.id);
        } else {
            eventUri = operationResult.uri;
            if (eventUri == null) {
                throw new NullPointerException("eventUri is null (repeated instance)!");
            }
        }
        ContentResolver cr = getActivity().getContentResolver();
        Cursor cursor = cr.query(eventUri, EVENTS_PROJECTION, null, null,
                null,null);
        if (!cursor.moveToNext()) {
            return new EventOperationResults.Error("Could not find saved or created event");
        }
        Event savedEvent = eventFromCursor(cursor);
        if (savedEvent == null) {
            return new EventOperationResults.Error("Unexpected saved event cursor");
        }
        return new EventOperationResults.Save(savedEvent);
    }

    private ContentProviderOperation getDeleteEventOperation(
            long calendarId, EventOperations.Delete deleteOperation) {
        Event event = deleteOperation.event;
        if (event.originalId == null) {
            if (event.id == null) {
                throw new NullPointerException("event.id is null");
            }
            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.DELETED, true);
            String where = CalendarContract.Events.CALENDAR_ID + "=? AND "
                    + CalendarContract.Events._ID + "=?";
            ArrayList<String> selectionArgs = new ArrayList<>();
            selectionArgs.add(Long.toString(calendarId));
            selectionArgs.add(Long.toString(event.id));
            if (event.etag != null) {
                where += " AND " + EVENTS_ETAG + "=?";
                selectionArgs.add(event.etag);
            }

            return ContentProviderOperation.newUpdate(CalendarContract.Events.CONTENT_URI)
                    .withValues(values)
                    .withSelection(where, selectionArgs.toArray(new String[selectionArgs.size()]))
                    .build();
        } else if (event.id == null) {
            if (event.originalInstanceTime == null) {
                throw new NullPointerException("event.originalInstanceTime is null");
            }
            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.DTSTART,
                    event.originalInstanceTime.getTimeInMillis());
            values.put(CalendarContract.Events.DTEND,
                    event.originalInstanceTime.getTimeInMillis() + 60 * 60 * 1000);
            values.put(CalendarContract.Events.CALENDAR_ID, calendarId);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            values.put(CalendarContract.Events.ORIGINAL_ID, event.originalId);
            values.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME,
                    event.originalInstanceTime.getTimeInMillis());
            values.put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED);

            return ContentProviderOperation.newInsert(CalendarContract.Events.CONTENT_URI)
                    .withValues(values)
                    .build();
        } else {
            if (event.id == null) {
                throw new NullPointerException("event.id is null");
            }
            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED);
            String where = CalendarContract.Events.CALENDAR_ID + "=? AND "
                    + CalendarContract.Events._ID + "=?";
            ArrayList<String> selectionArgs = new ArrayList<>();
            selectionArgs.add(Long.toString(calendarId));
            selectionArgs.add(Long.toString(event.id));
            if (event.etag != null) {
                where += " AND " + EVENTS_ETAG + "=?";
                selectionArgs.add(event.etag);
            }

            return ContentProviderOperation.newUpdate(CalendarContract.Events.CONTENT_URI)
                    .withValues(values)
                    .withSelection(where, selectionArgs.toArray(new String[selectionArgs.size()]))
                    .build();
        }
    }

    private EventOperationResults.Result getDeleteEventResult(
            EventOperations.Delete deleteOperation, ContentProviderResult operationResult) {
        Event event = deleteOperation.event;
        if (event.originalId == null) {
            int rowsUpdated = operationResult.count;
            if (rowsUpdated > 1) {
                throw new IllegalStateException("Deleted more than one row!");
            }
            return new EventOperationResults.Delete();
        } else if (event.id == null) {
            Uri eventUri = operationResult.uri;
            if (eventUri == null) {
                return new EventOperationResults.Error("eventUri is null (repeated instance)!");
            }
            return new EventOperationResults.Delete();
        } else {
            int rowsUpdated = operationResult.count;
            if (rowsUpdated > 1) {
                throw new IllegalStateException("Updated more than one row (repeated instance)!");
            } else if (rowsUpdated == 0) {
                return new EventOperationResults.Error(
                        "Expected to update one row (repeated instance)!");
            }
            return new EventOperationResults.Delete();
        }
    }

    private void openEventEditor(long calendarId, long eventId) {
        Uri uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventId);
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

    class EventsLoaderCallback implements LoaderManager.LoaderCallbacks<Cursor> {
        Calendar mStartTime;
        Calendar mEndTime;

        EventsLoaderCallback(Calendar startTime, Calendar endTime) {
            mStartTime = startTime;
            mEndTime = endTime;
        }

        @Override
        public Loader<Cursor> onCreateLoader(int loaderId, Bundle args) {
            switch (loaderId) {
                case CALENDAR_EVENTS_LOADER_ID: {
                    CursorLoader loader = new CursorLoader(getActivity());
                    loader.setUri(CalendarContract.Events.CONTENT_URI);
                    loader.setSelection("("
                            + CalendarContract.Events.CALENDAR_ID + "=? AND "
                            + CalendarContract.Events.DTSTART + "<=? AND ("
                            + CalendarContract.Events.DTEND + ">=? OR "
                            + CalendarContract.Events.LAST_DATE + ">=? OR ("
                            + CalendarContract.Events.DTEND + " is null AND "
                            + CalendarContract.Events.LAST_DATE + " is null)) AND "
                            + CalendarContract.Events.DELETED + " != 1)");
                    loader.setSelectionArgs(new String[]{Long.toString(mCalendarInfo.id),
                            Long.toString(mEndTime.getTimeInMillis()),
                            Long.toString(mStartTime.getTimeInMillis()),
                            Long.toString(mStartTime.getTimeInMillis())
                    });
                    loader.setProjection(EVENTS_PROJECTION);
                    return loader;
                }
            }
            return null;
        }

        @Override
        public void onLoadFinished(Loader<Cursor> loader, Cursor cursor) {
            List<RecurringEvent> recurringEvents = new ArrayList<>();
            List<Event> events = new ArrayList<>();
            Map<Long, HashSet<Long>> overriddenInstances = new HashMap<>();
            while (cursor.moveToNext()) {
                Event event = eventFromCursor(cursor);
                if (event != null) {
                    if (event.status != CalendarContract.Events.STATUS_CANCELED) {
                        events.add(event);
                    }
                    if (event.originalId != null) {
                        HashSet<Long> timestampSet = overriddenInstances.get(event.originalId);
                        if (timestampSet == null) {
                            timestampSet = new HashSet<>();
                            overriddenInstances.put(event.originalId, timestampSet);
                        }
                        timestampSet.add(event.originalInstanceTime.getTimeInMillis());
                    }
                    continue;
                }
                RecurringEvent recurringEvent = recurringEventFromCursor(cursor);
                if (recurringEvent != null) {
                    recurringEvents.add(recurringEvent);
                    continue;
                }
                throw new IllegalStateException("Unexpected cursor content");
            }

            for (RecurringEvent recurringEvent : recurringEvents) {
                events.addAll(recurringEvent.generateEvents(mStartTime, mEndTime,
                        overriddenInstances.get(recurringEvent.id)));
            }

            Log.d(TAG, events.size() + " events loaded");
            Collections.sort(events);

            mWebAppInterface.onEventsLoaded(events);
        }

        @Override
        public void onLoaderReset(Loader<Cursor> loader) {
        }
    }

    private Event eventFromCursor(Cursor cursor) {
        int idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events._ID);
        int titleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.TITLE);
        int dtStartIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.DTSTART);
        int dtEndIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.DTEND);
        int originalIdIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.ORIGINAL_ID);
        int originalInstanceTimeIndex = cursor.getColumnIndexOrThrow(
                CalendarContract.Events.ORIGINAL_INSTANCE_TIME);
        int statusIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.STATUS);
        int deletedIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.DELETED);
        int etagIndex = cursor.getColumnIndexOrThrow(EVENTS_ETAG);

        if (cursor.getInt(deletedIndex) != 0) {
            return null;
        }

        int status = cursor.getInt(statusIndex);

        Calendar startTime = Calendar.getInstance();
        startTime.setTimeInMillis(cursor.getLong(dtStartIndex));
        Calendar endTime = Calendar.getInstance();

        if (status == CalendarContract.Events.STATUS_CANCELED) {
            endTime.setTimeInMillis(startTime.getTimeInMillis());
            endTime.add(Calendar.HOUR, 1);
        } else if (!cursor.isNull(dtEndIndex)) {
            endTime.setTimeInMillis(cursor.getLong(dtEndIndex));
        } else {
            return null;
        }

        Long originalId = cursor.isNull(originalIdIndex) ? null : cursor.getLong(originalIdIndex);
        Calendar originalInstanceTime = null;
        if (!cursor.isNull(originalIdIndex)) {
            originalId = cursor.getLong(originalIdIndex);
            originalInstanceTime = Calendar.getInstance();
            originalInstanceTime.setTimeInMillis(cursor.getLong(originalInstanceTimeIndex));
        }

        return new Event(
                cursor.getLong(idIndex),
                cursor.getString(titleIndex),
                startTime,
                endTime,
                status,
                cursor.getString(etagIndex),
                originalId,
                originalInstanceTime);
    }

    private RecurringEvent recurringEventFromCursor(Cursor cursor) {
        int idIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events._ID);
        int titleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.TITLE);
        int dtStartIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.DTSTART);
        int durationIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.DURATION);
        int rruleIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.RRULE);
        int rdateIndex = cursor.getColumnIndexOrThrow(CalendarContract.Events.RDATE);

        if (cursor.isNull(durationIndex)) {
            return null;
        }

        Calendar startTime = Calendar.getInstance();
        startTime.setTimeInMillis(cursor.getLong(dtStartIndex));

        Duration duration = new Duration();
        try {
            duration.parse(cursor.getString(durationIndex));
        } catch (DateException e) {
            throw new RuntimeException(e);
        }

        return new RecurringEvent(
                cursor.getLong(idIndex),
                cursor.getString(titleIndex),
                startTime,
                duration,
                cursor.getString(rruleIndex),
                cursor.getString(rdateIndex),
                mCalendarInfo.timeZone);
    }
}
