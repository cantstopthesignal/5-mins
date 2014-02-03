package com.cantstopthesignals.five;

import android.os.Parcel;
import android.os.Parcelable;

public class CalendarInfo implements Parcelable {
    public final String accountName;
    public final long id;
    public final String displayName;

    public CalendarInfo(String accountName, long id, String displayName) {
        this.accountName = accountName;
        this.id = id;
        this.displayName = displayName;
    }

    public CalendarInfo(Parcel in) {
        accountName = in.readString();
        id = in.readLong();
        displayName = in.readString();
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
