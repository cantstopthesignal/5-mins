package com.cantstopthesignals.five.layout;

import com.cantstopthesignals.five.Util;

import java.util.Calendar;
import java.util.List;

/**
 * Helper object to provide a map from times to pixels.
 */
public class TimeMap {
    private final List<Calendar> mTimeList;
    private final List<Integer> mYPosList;
    private final int mMillisPerDist;

    public TimeMap(List<Calendar> timeList, List<Integer> yPosList, int defaultDistancePerHour) {
        mTimeList = timeList;
        mYPosList = yPosList;
        mMillisPerDist = 60 * 60 * 1000 / defaultDistancePerHour;
        if (mTimeList.size() != mYPosList.size()) {
            throw new IllegalStateException("mTimeList and mYPosList should have same length");
        }
    }

    public int timeToYPos(Calendar time) {
        long timestamp = time.getTimeInMillis();
        int beforeIndex = -1;
        for (int i = 0, count = mTimeList.size(); i < count; i++) {
            if (time.compareTo(mTimeList.get(i)) <= 0) {
                break;
            }
            beforeIndex = i;
        }
        int afterIndex = beforeIndex + 1;
        if (beforeIndex < 0 || afterIndex >= mTimeList.size()) {
            if (beforeIndex != -1 && afterIndex != mTimeList.size()) {
                throw new IllegalStateException();
            }
            int anchorYPos;
            long anchorTimestamp;
            if (beforeIndex < 0) {
                // Timestamp is before first timestamp.
                anchorYPos = mYPosList.get(0);
                anchorTimestamp = mTimeList.get(0).getTimeInMillis();
            } else {
                // Timestamp is after first timestamp.
                anchorYPos = mYPosList.get(mYPosList.size() - 1);
                anchorTimestamp = mTimeList.get(mTimeList.size() - 1).getTimeInMillis();
            }
            return Util.round((timestamp - anchorTimestamp)
                    / mMillisPerDist) + anchorYPos;
        }
        int beforeYPos = mYPosList.get(beforeIndex);
        int afterYPos = mYPosList.get(afterIndex);
        long beforeTimestamp = mTimeList.get(beforeIndex).getTimeInMillis();
        long afterTimestamp = mTimeList.get(afterIndex).getTimeInMillis();
        return Util.round((timestamp - beforeTimestamp) *
                (afterYPos - beforeYPos) /
                (Math.max(1, afterTimestamp - beforeTimestamp))) + beforeYPos;
    }

    public Calendar yPosToTime(int yPos) {
        int beforeIndex = -1;
        for (int i = 0, count = mYPosList.size(); i < count; i++) {
            if (yPos <= mYPosList.get(i)) {
                break;
            }
            beforeIndex = i;
        }
        int afterIndex = beforeIndex + 1;
        if (beforeIndex < 0 || afterIndex >= mYPosList.size()) {
            int anchorYPos;
            long anchorTimestamp;
            if (beforeIndex != -1 && afterIndex != mYPosList.size()) {
                throw new IllegalStateException();
            }
            if (beforeIndex < 0) {
                // Position is before first position.
                anchorYPos = mYPosList.get(0);
                anchorTimestamp = mTimeList.get(0).getTimeInMillis();
            } else {
                // Position is after last position.
                anchorYPos = mYPosList.get(mYPosList.size() - 1);
                anchorTimestamp = mTimeList.get(mTimeList.size() - 1).getTimeInMillis();
            }
            long timestamp = Util.roundLong((yPos - anchorYPos) * mMillisPerDist) +
                    anchorTimestamp;
            Calendar time = Calendar.getInstance();
            time.setTimeInMillis(timestamp);
            return time;
        }
        int beforeYPos = mYPosList.get(beforeIndex);
        int afterYPos = mYPosList.get(afterIndex);
        long beforeTimestamp = mTimeList.get(beforeIndex).getTimeInMillis();
        long afterTimestamp = mTimeList.get(afterIndex).getTimeInMillis();
        long timestamp = Util.roundLong((yPos - beforeYPos) *
                (afterTimestamp - beforeTimestamp) /
                (Math.max(1, afterYPos - beforeYPos))) + beforeTimestamp;
        Calendar time = Calendar.getInstance();
        time.setTimeInMillis(timestamp);
        return time;
    }
}
