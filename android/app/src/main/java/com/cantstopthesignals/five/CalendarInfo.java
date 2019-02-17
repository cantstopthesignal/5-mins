package com.cantstopthesignals.five;

import android.os.Parcel;
import android.os.Parcelable;

import java.util.TimeZone;

public class CalendarInfo implements Parcelable {
    public final String accountName;
    public final long id;
    public final String displayName;
    public final String timeZone;

    public CalendarInfo(String accountName, long id, String displayName, String timeZone) {
        this.accountName = accountName;
        this.id = id;
        this.displayName = displayName;
        this.timeZone = timeZone;
    }

    public CalendarInfo(Parcel in) {
        accountName = in.readString();
        id = in.readLong();
        displayName = in.readString();
        timeZone = in.readString();
    }

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof CalendarInfo)) {
            return false;
        }
        CalendarInfo other = (CalendarInfo) obj;
        return accountName.equals(other.accountName)
                && id == other.id
                && displayName.equals(other.displayName);
    }

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel out, int flags) {
        out.writeString(accountName);
        out.writeLong(id);
        out.writeString(displayName);
        out.writeString(timeZone);
    }

    public static Creator<CalendarInfo> CREATOR = new Creator<CalendarInfo>() {
        @Override
        public CalendarInfo createFromParcel(Parcel in) {
            return new CalendarInfo(in);
        }

        @Override
        public CalendarInfo[] newArray(int size) {
            return new CalendarInfo[size];
        }
    };
}
