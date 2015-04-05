package com.cantstopthesignals.five.layout;

import android.os.SystemClock;
import android.util.Log;
import android.util.Pair;

import com.cantstopthesignals.five.Rect;
import com.cantstopthesignals.five.Util;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class Calc {
    private static final String TAG = "LayoutCalc";

    private List<EventLayout> mEvents = new ArrayList<>();
    private List<HorzSplit> mHorzSplits = new ArrayList<>();
    private List<EventLayout> mEventsByDuration = new ArrayList<>();

    private List<TimePoint> mTimePoints;
    private TimeMap mTimeMap;
    private TimeMap mLinearTimeMap;
    private TimeMap mCondenseRestrictTimeMap;
    private Params mParams;
    private Calendar mMinTime;
    private Calendar mMaxTime;

    public Calc(Params params) {
        mParams = params;
        mMinTime = mParams.minTime;
        mMaxTime = mParams.maxTime;
    }

    public void setEvents(EventLayout... events) {
        List<EventLayout> eventList = new ArrayList<>(events.length);
        Collections.addAll(eventList, events);
        setEvents(eventList);
    }

    public void setEvents(List<EventLayout> events) {
        mEvents = new ArrayList<>(events);
        Collections.sort(mEvents, new Comparator<EventLayout>() {
            @Override
            public int compare(EventLayout lhs, EventLayout rhs) {
                return lhs.startTime.compareTo(rhs.startTime);
            }
        });
        mEventsByDuration = new ArrayList<>(mEvents);
        Collections.sort(mEventsByDuration, new Comparator<EventLayout>() {
            @Override
            public int compare(EventLayout lhs, EventLayout rhs) {
                long lhsDuration = lhs.endTime.getTimeInMillis() - lhs.startTime.getTimeInMillis();
                long rhsDuration = rhs.endTime.getTimeInMillis() - rhs.startTime.getTimeInMillis();
                return (int) (rhsDuration - lhsDuration);
            }
        });
    }

    public void setHorzSplits(List<HorzSplit> horzSplits) {
        mHorzSplits = horzSplits;
    }

    /**
     * Set a time map which will be used to restrict condensing of the layout
     * smaller than this map.
     */
    public void setCondensingRestriction(TimeMap timeMap) {
        mCondenseRestrictTimeMap = timeMap;
    }

    public void calc() {
        if (mEvents == null) {
            throw new NullPointerException("mEvents should not be null");
        }
        long startTime = SystemClock.elapsedRealtime();
        calcTimeRange();
        calcTimePoints();
        assignEventsToColumns();
        calcColumnCounts();
        positionTimePoints();
        calcInitialTimePointConstraints();
        enforceHorzSplitHeights();
        enforceMinEventHeight();
        enforceCondenseRestriction();
        resolveTimePointConstraints();
        calcTimeMap();
        calcLinearTimes();
        calcLinearTimeMap();
        calcTimeAxisPatches();
        positionEvents();
        long calcTimeMillis = SystemClock.elapsedRealtime() - startTime;
        if (calcTimeMillis > 10) {
            Log.d(TAG, "calc() finished in " + calcTimeMillis + "ms");
        }
    }

    public TimeMap getTimeMap() {
        return mTimeMap;
    }

    public TimeMap getLinearTimeMap() {
        return mLinearTimeMap;
    }

    public List<TimePoint> getTimePoints() {
        return mTimePoints;
    }

    public Calendar getMinTime() {
        return mMinTime;
    }

    public Calendar getMaxTime() {
        return mMaxTime;
    }

    public List<EventLayout> getEvents() {
        return mEvents;
    }

    private void calcTimeRange() {
        if (mMinTime == null) {
            for (EventLayout event : mEvents) {
                if (mMinTime == null || mMinTime.after(event.startTime)) {
                    mMinTime = (Calendar) event.startTime.clone();
                }
            }
        }
        if (mMaxTime == null) {
            for (EventLayout event : mEvents) {
                if (mMaxTime == null || mMaxTime.before(event.endTime)) {
                    mMaxTime = (Calendar) event.endTime.clone();
                }
            }
        }
        if (mMinTime == null) {
            throw new NullPointerException("mMinTime should not be null");
        }
        if (mMaxTime == null) {
            throw new NullPointerException("mMaxTime should not be null");
        }
    }

    private void calcTimePoints() {
        Map<String, TimePoint> timePointMap = new HashMap<>();
        if (this.mMinTime != null) {
            TimePoint minTimePoint = new TimePoint(this.mMinTime);
            timePointMap.put(minTimePoint.key, minTimePoint);
        }
        if (this.mMaxTime != null) {
            TimePoint maxTimePoint = new TimePoint(mMaxTime);
            timePointMap.put(maxTimePoint.key, maxTimePoint);
        }

        // Create time points for all horz splits
        for (HorzSplit horzSplit : mHorzSplits) {
            String startKey = TimePoint.getKey(horzSplit.time, true);
            TimePoint startPoint = timePointMap.get(startKey);
            if (startPoint == null) {
                startPoint = new TimePoint(horzSplit.time, true);
                timePointMap.put(startPoint.key, startPoint);
            }
            startPoint.linearTimeAnchor = true;
            horzSplit.startTimePoint = startPoint;
            String endKey = TimePoint.getKey(horzSplit.time);
            TimePoint endPoint = timePointMap.get(endKey);
            if (endPoint == null) {
                endPoint = new TimePoint(horzSplit.time);
                timePointMap.put(endPoint.key, endPoint);
            }
            endPoint.linearTimeAnchor = true;
            horzSplit.endTimePoint = endPoint;
        }

        // Create all relevant time points for the start and end times of all events.
        for (EventLayout event : mEvents) {
            String startKey = TimePoint.getKey(event.startTime);
            TimePoint startPoint = timePointMap.get(startKey);
            if (startPoint == null) {
                startPoint = new TimePoint(event.startTime);
                timePointMap.put(startPoint.key, startPoint);
            }
            event.startTimePoint = startPoint;
            String endKey = TimePoint.getKey(event.endTime, true);
            if (!timePointMap.containsKey(endKey)) {
                endKey = TimePoint.getKey(event.endTime);
            }
            TimePoint endPoint = timePointMap.get(endKey);
            if (endPoint == null) {
                endPoint = new TimePoint(event.endTime);
                timePointMap.put(endPoint.key, endPoint);
            }
            event.endTimePoint = endPoint;
        }

        mTimePoints = new ArrayList<>(timePointMap.values());
        Collections.sort(mTimePoints, new Comparator<TimePoint>() {
            @Override
            public int compare(TimePoint t1, TimePoint t2) {
                return t1.key.compareTo(t2.key);
            }
        });

        TimePoint lastTimePoint = null;
        for (TimePoint timePoint : mTimePoints) {
            if (lastTimePoint != null) {
                lastTimePoint.next = timePoint;
            }
            lastTimePoint = timePoint;
        }

        // Populate openEvents with events that span this time point.
        int minEventIdx = 0;
        for (int i = 0, iCount = mTimePoints.size(); i < iCount; i++) {
            TimePoint timePoint = mTimePoints.get(i);
            for (int j = minEventIdx, jCount = mEvents.size(); j < jCount; j++) {
                EventLayout event = mEvents.get(j);
                if (event.endTime.compareTo(timePoint.time) <= 0) {
                    // Event ended before this time point, do not revisit it again,
                    // but make sure to not skip over any continuing events, so only
                    // increment.
                    if (minEventIdx == j) {
                        minEventIdx++;
                    }
                } else if (event.startTime.compareTo(timePoint.time) > 0) {
                    // Event started after this time point, we are done working with this
                    // time point.
                    break;
                } else {
                    // Event started at or before this time point, and ended after this
                    // time point.
                    timePoint.openEvents.add(event);
                    event.timePoints.add(timePoint);
                }
            }
            if (minEventIdx >= mEvents.size()) {
                // All events have been passed.
                break;
            }
        }
    }

    private void assignEventsToColumns() {
        for (EventLayout event : mEventsByDuration) {
            Set<Integer> usedColumns = new HashSet<>();
            for (TimePoint timePoint : event.timePoints) {
                for (EventLayout neighborEvent : timePoint.openEvents) {
                    if (neighborEvent.columnAssigned) {
                        usedColumns.add(neighborEvent.column);
                    }
                }
            }
            int column = 0;
            while (usedColumns.contains(column)) {
                column++;
            }
            event.column = column;
            event.columnAssigned = true;
        }
    }

    private void calcColumnCounts() {
        for (EventLayout event : mEvents) {
            event.columnCount = event.column + 1;
        }
        for (TimePoint timePoint : mTimePoints) {
            timePoint.columnCount = 0;
        }
        // WARNING: non-linear performance
        boolean done = false;
        while (!done) {
            done = true;
            for (EventLayout event : mEvents) {
                for (TimePoint timePoint : mTimePoints) {
                    int columnCount = Math.max(event.columnCount, timePoint.columnCount);
                    if (columnCount != event.columnCount || columnCount != timePoint.columnCount) {
                        event.columnCount = timePoint.columnCount = columnCount;
                        done = false;
                    }
                }
            }
        }
    }

    private void positionTimePoints() {
        for (TimePoint timePoint : mTimePoints) {
            timePoint.yPos = Util.round(Util.msToHourFloat(
                    timePoint.time.getTimeInMillis() - mMinTime.getTimeInMillis())
                    * mParams.distancePerHour);
        }
    }

    private void calcInitialTimePointConstraints() {
        for (TimePoint timePoint : mTimePoints) {
            timePoint.minHeight = mParams.minTimePointSpacing;
            if (timePoint.next != null) {
                int timeBasedMinHeight = (int) Math.ceil(Util.msToHourFloat(
                        timePoint.next.time.getTimeInMillis() - timePoint.time.getTimeInMillis()) *
                        mParams.minDistancePerHour);
                timePoint.minHeight = Math.max(timePoint.minHeight, timeBasedMinHeight);
            }
        }
    }

    private void enforceHorzSplitHeights() {
        for (HorzSplit horzSplit : mHorzSplits) {
            horzSplit.startTimePoint.minHeight = Math.max(
                    horzSplit.startTimePoint.minHeight, horzSplit.height);
        }
    }

    private void enforceMinEventHeight() {
        // Apply minimum height constraints to time points such that once resolved
        // each event will have minimum sizing obeyed.
        for (EventLayout event : mEvents) {
            // Heuristic: find the time point in [start and end) that has the largest
            // time gap and make it the victim of the constraint.
            TimePoint maxTimeGapTimePoint = null;
            long maxTimeGap = 0;
            int totalMinHeights = 0;
            TimePoint timePointIter = event.startTimePoint;
            while (timePointIter != event.endTimePoint) {
                long timeGap = timePointIter.next.time.getTimeInMillis()
                        - timePointIter.time.getTimeInMillis();
                if (timeGap > maxTimeGap || maxTimeGapTimePoint == null) {
                    maxTimeGap = timeGap;
                    maxTimeGapTimePoint = timePointIter;
                }
                totalMinHeights += timePointIter.minHeight;
                timePointIter = timePointIter.next;
            }
            if (mParams.minEventHeight > totalMinHeights) {
                maxTimeGapTimePoint.minHeight += mParams.minEventHeight - totalMinHeights;
            }
        }
    }

    private void enforceCondenseRestriction() {
        // If a condensing restriction is in place, make sure the layout
        // does not condense below the provided time map.
        if (mCondenseRestrictTimeMap == null) {
            return;
        }
        for (TimePoint timePoint : mTimePoints) {
            if (timePoint.next != null) {
                int yPosStart = mCondenseRestrictTimeMap.timeToYPos(
                        timePoint.time);
                int yPosEnd = mCondenseRestrictTimeMap.timeToYPos(
                        timePoint.next.time);
                timePoint.minHeight = Math.max(timePoint.minHeight,
                        yPosEnd - yPosStart);
            }
        }
    }

    private void resolveTimePointConstraints() {
        for (TimePoint timePoint : mTimePoints) {
            TimePoint nextTimePoint = timePoint.next;
            if (timePoint.next == null || timePoint.minHeight == 0 || timePoint.yPos < 0) {
                continue;
            }
            nextTimePoint.yPos = Math.max(nextTimePoint.yPos,
                    timePoint.yPos + timePoint.minHeight);
        }
    }

    private void calcTimeMap() {
        List<Calendar> timeList = new ArrayList<>();
        List<Integer> yPosList = new ArrayList<>();
        for (TimePoint timePoint : mTimePoints) {
            timeList.add(timePoint.time);
            yPosList.add(timePoint.yPos);
        }
        mTimeMap = new TimeMap(timeList, yPosList, mParams.distancePerHour);
    }

    private void calcLinearTimes() {
        if (mTimePoints.isEmpty()) {
            return;
        }
        // Map all time points to linear hour time.
        Calendar hourIter = Util.hourFloor(mMinTime);
        int timePointIdx = 0;
        while (timePointIdx < mTimePoints.size()) {
            TimePoint timePoint = mTimePoints.get(timePointIdx);
            Calendar nextHour = Util.hourAddSafe(hourIter);
            if (timePoint.time.compareTo(hourIter) < 0) {
                timePoint.linearTimeYPos = timePoint.yPos;
                timePointIdx++;
                continue;
            } else if (timePoint.time.compareTo(nextHour) >= 0) {
                hourIter = nextHour;
                continue;
            }
            int hourIterYPos = mTimeMap.timeToYPos(hourIter);
            int hourHeight = mTimeMap.timeToYPos(nextHour) - hourIterYPos;
            float linearTimeYPos = hourHeight * Util.msToHourFloat(
                    timePoint.time.getTimeInMillis() - hourIter.getTimeInMillis()) + hourIterYPos;
            if (!timePoint.linearTimeAnchor && Math.abs(timePoint.yPos - linearTimeYPos)
                    >= mParams.patchMinYPosDiff) {
                timePoint.linearTimeYPos = Util.round(linearTimeYPos);
            } else {
                timePoint.linearTimeYPos = timePoint.yPos;
            }
            timePointIdx++;
        }
    }

    private void calcLinearTimeMap() {
        // Add all relevant hours with direct maps to non-linear yPos to enforce
        // matching at each hour.
        final List<Pair<Calendar, Integer>> timeAndYPosList = new ArrayList<>();
        final Set<Calendar> hourTimeSet = new HashSet<>();
        Util.forEachHourWrap(mMinTime, mMaxTime, new Util.HourIterationCallback() {
            @Override
            public void callback(Calendar hour, Calendar nextHour, boolean isLast) {
                int yPos = mTimeMap.timeToYPos(hour);
                timeAndYPosList.add(Pair.create(hour, yPos));
                hourTimeSet.add(hour);
            }
        });

        // Stitch in linear time yPos from time points.
        for (TimePoint timePoint : mTimePoints) {
            if (!hourTimeSet.contains(timePoint.time)) {
                timeAndYPosList.add(Pair.create(timePoint.time, timePoint.linearTimeYPos));
            }
        }

        Collections.sort(timeAndYPosList, new Comparator<Pair<Calendar, Integer>>() {
            @Override
            public int compare(Pair<Calendar, Integer> p1, Pair<Calendar, Integer> p2) {
                return p1.first.compareTo(p2.first);
            }
        });

        List<Calendar> timeList = new ArrayList<>();
        List<Integer> yPosList = new ArrayList<>();
        for (Pair<Calendar, Integer> entry : timeAndYPosList) {
            timeList.add(entry.first);
            yPosList.add(entry.second);
        }
        mLinearTimeMap = new TimeMap(timeList, yPosList,
                mParams.distancePerHour);
    }

    /** Calculate whether time axis patches are needed for any events */
    private void calcTimeAxisPatches() {
        for (EventLayout event : mEvents) {
            // An event needs a patch if its start or end time point needs a patch
            // line.
            if (event.startTimePoint.linearTimeYPos != event.startTimePoint.yPos ||
                    event.endTimePoint.linearTimeYPos != event.endTimePoint.yPos) {
                event.hasTimeAxisPatch = true;
                event.attachedToTimeAxisPatch = event.column == 0 &&
                        event.timePoints.size() == 1;
            }
        }
        // If an event is neighbors with an event that has a time axis patch, or
        // neighbors of a neighbor, it becomes a neighbor.
        // WARNING: non-linear performance
        boolean done = false;
        while (!done) {
            done = true;
            for (TimePoint timePoint : mTimePoints) {
                boolean matchingNeighbor = false;
                for (EventLayout event : timePoint.openEvents) {
                    if (event.hasTimeAxisPatch || event.neighborHasTimeAxisPatch) {
                        matchingNeighbor = true;
                        break;
                    }
                }
                if (!matchingNeighbor) {
                    continue;
                }
                for (EventLayout event : timePoint.openEvents) {
                    if (!event.neighborHasTimeAxisPatch && !event.hasTimeAxisPatch) {
                        event.neighborHasTimeAxisPatch = true;
                        done = false;
                    }
                }
            }
        }
    }

    private void positionEvents() {
        for (EventLayout event : mEvents) {
            int layoutWidth = mParams.layoutWidth;
            boolean shiftForTimeAxisPatch = event.hasTimeAxisPatch ||
                    event.neighborHasTimeAxisPatch;
            if (shiftForTimeAxisPatch) {
                layoutWidth -= mParams.timeAxisPatchWidth;
            }
            int columnWidth = Util.round(layoutWidth / event.columnCount);
            int x = columnWidth * event.column;
            if (shiftForTimeAxisPatch) {
                x += mParams.timeAxisPatchWidth;
            }
            int width = columnWidth;
            if (event.column == event.columnCount - 1) {
                width = layoutWidth - (columnWidth * (event.columnCount - 1));
            }
            int height = event.endTimePoint.yPos - event.startTimePoint.yPos;
            event.rect = new Rect(x, event.startTimePoint.yPos, width, height);
        }
    }
}
