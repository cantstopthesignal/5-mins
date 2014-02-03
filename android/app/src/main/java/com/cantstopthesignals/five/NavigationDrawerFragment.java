package com.cantstopthesignals.five;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.app.ActionBar;
import android.app.Activity;
import android.app.Fragment;
import android.app.LoaderManager;
import android.content.Context;
import android.content.CursorLoader;
import android.content.Loader;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.database.Cursor;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.provider.CalendarContract.Calendars;
import android.support.v4.app.ActionBarDrawerToggle;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

/**
 * Fragment used for managing interactions for and presentation of a navigation drawer.
 * See the <a href="https://developer.android.com/design/patterns/navigation-drawer.html#Interaction">
 * design guidelines</a> for a complete explanation of the behaviors implemented here.
 */
public class NavigationDrawerFragment extends Fragment
        implements LoaderManager.LoaderCallbacks<Cursor> {
    private static final String ACCOUNT_TYPE_GOOGLE = "com.google";

    /** Remember the user's account name selection */
    private static final String PREF_SELECTED_ACCOUNT_NAME = "selected_account_name";

    /** Remember the user's calendar id selection */
    private static final String PREF_SELECTED_CALENDAR_ID = "selected_calendar_id";

    /** Remember if the user has learned how to use the drawer */
    private static final String PREF_USER_LEARNED_DRAWER = "navigation_drawer_learned";

    private static String[] CALENDARS_PROJECTION = new String[] {
            Calendars._ID,
            Calendars.CALENDAR_DISPLAY_NAME
    };
    private static final int CALENDARS_PROJECTION_ID_INDEX = 0;
    private static final int CALENDARS_PROJECTION_DISPLAY_NAME_INDEX = 1;

    private static final int CALENDAR_LIST_LOADER_ID = 0;

    /**
     * A pointer to the current callbacks instance (the Activity).
     */
    private NavigationDrawerCallbacks mCallbacks;

    /**
     * Helper component that ties the action bar to the navigation drawer.
     */
    private ActionBarDrawerToggle mDrawerToggle;

    private DrawerLayout mDrawerLayout;
    private ListView mCalendarListView;
    private Spinner mAccountSpinner;
    private View mFragmentContainerView;

    private Account[] mAccounts;
    private CalendarInfo[] mCalendars;

    private String mCurrentAccountName;
    private long mCurrentCalendarId;

    private boolean mFromSavedInstanceState;
    private boolean mUserLearnedDrawer;

    public NavigationDrawerFragment() {
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        SharedPreferences sp = PreferenceManager.getDefaultSharedPreferences(getActivity());
        mUserLearnedDrawer = sp.getBoolean(PREF_USER_LEARNED_DRAWER, false);
        mCurrentAccountName = sp.getString(PREF_SELECTED_ACCOUNT_NAME, null);
        mCurrentCalendarId = sp.getLong(PREF_SELECTED_CALENDAR_ID, 0);

        if (savedInstanceState != null) {
            mFromSavedInstanceState = true;
        }

        AccountManager accountManager = AccountManager.get(getActivity());
        mAccounts = accountManager.getAccountsByType(ACCOUNT_TYPE_GOOGLE);

        selectAccount(mCurrentAccountName);
    }

    @Override
    public void onActivityCreated(Bundle savedInstanceState) {
        super.onActivityCreated(savedInstanceState);
        // Indicate that this fragment would like to influence the set of actions in the action bar.
        setHasOptionsMenu(true);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        View drawerView = inflater.inflate(
                R.layout.fragment_navigation_drawer, container, false);

        mAccountSpinner = (Spinner) drawerView.findViewById(R.id.account_spinner);
        mAccountSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectAccount(mAccounts[position].name);
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {
            }
        });
        mAccountSpinner.setAdapter(new AccountListAdapter(getActivity(), mAccounts));

        mCalendarListView = (ListView) drawerView.findViewById(R.id.calendar_picker);
        mCalendarListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                selectCalendar(mCalendars[position].id);
            }
        });

        return drawerView;
    }

    public boolean isDrawerOpen() {
        return mDrawerLayout != null && mDrawerLayout.isDrawerOpen(mFragmentContainerView);
    }

    /**
     * Users of this fragment must call this method to set up the navigation drawer interactions.
     *
     * @param fragmentId   The android:id of this fragment in its activity's layout.
     * @param drawerLayout The DrawerLayout containing this fragment's UI.
     */
    public void setUp(int fragmentId, DrawerLayout drawerLayout) {
        mFragmentContainerView = getActivity().findViewById(fragmentId);
        mDrawerLayout = drawerLayout;

        // set a custom shadow that overlays the main content when the drawer opens
        mDrawerLayout.setDrawerShadow(R.drawable.drawer_shadow, GravityCompat.START);
        // set up the drawer's list view with items and click listener

        ActionBar actionBar = getActionBar();
        actionBar.setDisplayHomeAsUpEnabled(true);
        actionBar.setHomeButtonEnabled(true);

        // ActionBarDrawerToggle ties together the the proper interactions
        // between the navigation drawer and the action bar app icon.
        mDrawerToggle = new ActionBarDrawerToggle(
                getActivity(),
                mDrawerLayout,
                R.drawable.ic_drawer,
                R.string.navigation_drawer_open,
                R.string.navigation_drawer_close) {
            @Override
            public void onDrawerClosed(View drawerView) {
                super.onDrawerClosed(drawerView);
                if (!isAdded()) {
                    return;
                }

                getActivity().invalidateOptionsMenu(); // calls onPrepareOptionsMenu()
            }

            @Override
            public void onDrawerOpened(View drawerView) {
                super.onDrawerOpened(drawerView);
                if (!isAdded()) {
                    return;
                }

                if (!mUserLearnedDrawer) {
                    // The user manually opened the drawer; store this flag to prevent auto-showing
                    // the navigation drawer automatically in the future.
                    mUserLearnedDrawer = true;
                    SharedPreferences sp = PreferenceManager
                            .getDefaultSharedPreferences(getActivity());
                    sp.edit().putBoolean(PREF_USER_LEARNED_DRAWER, true).apply();
                }

                getActivity().invalidateOptionsMenu(); // calls onPrepareOptionsMenu()
            }
        };

        // If the user hasn't 'learned' about the drawer, open it to introduce them to the drawer,
        // per the navigation drawer design guidelines.
        if (!mUserLearnedDrawer && !mFromSavedInstanceState) {
            mDrawerLayout.openDrawer(mFragmentContainerView);
        }

        // Defer code dependent on restoration of previous instance state.
        mDrawerLayout.post(new Runnable() {
            @Override
            public void run() {
                mDrawerToggle.syncState();
            }
        });

        mDrawerLayout.setDrawerListener(mDrawerToggle);
    }

    private void selectAccount(String accountName) {
        boolean accountNameChanged = (mCurrentAccountName != null && accountName != null
                && !mCurrentAccountName.equals(accountName));
        if (mCurrentAccountName != null) {
            mCurrentAccountName = accountName;
            if (accountNameChanged) {
                SharedPreferences sp = PreferenceManager
                        .getDefaultSharedPreferences(getActivity());
                sp.edit().putString(PREF_SELECTED_ACCOUNT_NAME, accountName).apply();
                mCurrentCalendarId = 0;
            }
            loadCalendarList();
        }
    }

    private void selectCalendar(long calendarId) {
        int position = 0;
        CalendarInfo calendarInfo = null;
        for (int i = 0, count = mCalendars.length; i < count; i++) {
            if (mCalendars[i].id == calendarId) {
                position = i;
                calendarInfo = mCalendars[i];
                break;
            }
        }
        if (calendarInfo != null) {
            if (mCurrentCalendarId != 0 && mCurrentCalendarId != calendarId) {
                SharedPreferences sp = PreferenceManager
                        .getDefaultSharedPreferences(getActivity());
                sp.edit().putLong(PREF_SELECTED_CALENDAR_ID, calendarInfo.id).apply();
            }
            mCurrentCalendarId = calendarId;
            if (mCalendarListView != null) {
                mCalendarListView.setItemChecked(position, true);
            }
            if (mDrawerLayout != null) {
                mDrawerLayout.closeDrawer(mFragmentContainerView);
            }
        }
        if (mCallbacks != null) {
            mCallbacks.onNavigationDrawerCalendarSelected(calendarInfo);
        }
    }

    private void loadCalendarList() {
        getLoaderManager().restartLoader(CALENDAR_LIST_LOADER_ID, null, this);
    }

    @Override
    public Loader<Cursor> onCreateLoader(int loaderId, Bundle args) {
        switch (loaderId) {
            case CALENDAR_LIST_LOADER_ID:
                CursorLoader cursorLoader = new CursorLoader(getActivity());
                cursorLoader.setUri(Calendars.CONTENT_URI);
                cursorLoader.setSelection("((" + Calendars.ACCOUNT_TYPE + " = ?) AND ("
                        + Calendars.ACCOUNT_NAME + " = ?))");
                cursorLoader.setSelectionArgs(new String[] {ACCOUNT_TYPE_GOOGLE,
                        mCurrentAccountName});
                cursorLoader.setProjection(CALENDARS_PROJECTION);
                return cursorLoader;
        }
        return null;
    }

    @Override
    public void onLoadFinished(Loader<Cursor> loader, Cursor cursor) {
        List<CalendarInfo> calendarList = new ArrayList<CalendarInfo>();
        while (cursor.moveToNext()) {
            calendarList.add(new CalendarInfo(mCurrentAccountName,
                    cursor.getLong(CALENDARS_PROJECTION_ID_INDEX),
                    cursor.getString(CALENDARS_PROJECTION_DISPLAY_NAME_INDEX)));
        }
        mCalendars = calendarList.toArray(new CalendarInfo[0]);
        mCalendarListView.setAdapter(new CalendarListAdapter(getActivity(), mCalendars));
        selectCalendar(mCurrentCalendarId);
    }

    @Override
    public void onLoaderReset(Loader<Cursor> loader) {
        mCalendarListView.setAdapter(null);
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        try {
            mCallbacks = (NavigationDrawerCallbacks) activity;
        } catch (ClassCastException e) {
            throw new ClassCastException("Activity must implement NavigationDrawerCallbacks.");
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        mCallbacks = null;
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Forward the new configuration the drawer toggle component.
        mDrawerToggle.onConfigurationChanged(newConfig);
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        // If the drawer is open, show the global app actions in the action bar. See also
        // showGlobalContextActionBar, which controls the top-left area of the action bar.
        if (mDrawerLayout != null && isDrawerOpen()) {
            inflater.inflate(R.menu.global, menu);
            showGlobalContextActionBar();
        }
        super.onCreateOptionsMenu(menu, inflater);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (mDrawerToggle.onOptionsItemSelected(item)) {
            return true;
        }

        if (item.getItemId() == R.id.action_example) {
            Toast.makeText(getActivity(), "Example action.", Toast.LENGTH_SHORT).show();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    /**
     * Per the navigation drawer design guidelines, updates the action bar to show the global app
     * 'context', rather than just what's in the current screen.
     */
    private void showGlobalContextActionBar() {
        ActionBar actionBar = getActionBar();
        actionBar.setDisplayShowTitleEnabled(true);
        actionBar.setNavigationMode(ActionBar.NAVIGATION_MODE_STANDARD);
        actionBar.setTitle(R.string.app_name);
    }

    private ActionBar getActionBar() {
        return getActivity().getActionBar();
    }

    /**
     * Callbacks interface that all activities using this fragment must implement.
     */
    public static interface NavigationDrawerCallbacks {
        void onNavigationDrawerCalendarSelected(CalendarInfo calendarInfo);
    }

    private class AccountListAdapter extends ArrayAdapter<Account> {
        private Context mContext;

        public AccountListAdapter(Context context, Account[] accounts) {
            super(context, R.layout.account_list_item, accounts);
            mContext = context;
        }

        @Override
        public View getDropDownView(int position, View convertView, ViewGroup parent) {
            return getView(position, convertView, parent);
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            LayoutInflater inflater = (LayoutInflater) mContext
                    .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            TextView rowView = (TextView) inflater.inflate(R.layout.account_list_item, parent, false);
            Account account = getItem(position);
            rowView.setText(account.name);
            return rowView;
        }
    }

    private class CalendarListAdapter extends ArrayAdapter<CalendarInfo> {
        private Context mContext;

        public CalendarListAdapter(Context context, CalendarInfo[] calendars) {
            super(context, R.layout.calendar_list_item, calendars);
            mContext = context;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            LayoutInflater inflater = (LayoutInflater) mContext
                    .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            TextView rowView = (TextView) inflater.inflate(R.layout.calendar_list_item, parent, false);
            CalendarInfo calendar = getItem(position);
            rowView.setText(calendar.displayName);
            return rowView;
        }
    }
}
