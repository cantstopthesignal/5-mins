package com.cantstopthesignals.five.layout;

import android.test.MoreAsserts;
import android.util.Log;

import com.cantstopthesignals.five.Rect;
import com.cantstopthesignals.five.Util;

import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

public class CalcTest {
    private static final String TAG = "CalcTest";

    private Params params;
    private Calc calc;
    private Calendar baseTime;

    @Before
    public void setUp() throws Exception {
        params = new Params();
        params.timeAxisPatchWidth = 0;
        params.layoutWidth = 300;
        calc = new Calc(params);
        baseTime = Util.dayFloor(Calendar.getInstance());
    }

    @Test
    public void testNoEvents() throws Exception {
        Params params = new Params();
        params.minTime = Calendar.getInstance();
        params.maxTime = (Calendar) params.minTime.clone();
        calc = new Calc(params);
        calc.calc();
    }

    @Test
    public void testSingleEvent() throws Exception {
        EventLayout event = createEvent(60, 30, "event1");
        calc.setEvents(event);
        calc.calc();

        assertEventColumn(event, 0, 1);
        assertRectEquals(event.rect, 0, 0, 300, 25);
        assertTimePoint(60, event.startTimePoint);
        assertTimePoint(60 + 30, event.endTimePoint);
        assertTimePoints(event.timePoints, 60);
        assertTimePoints(calc.getTimePoints(), 60, 60 + 30);
        assertEvents(calc.getTimePoints().get(0).openEvents, event);
        assertEvents(calc.getTimePoints().get(1).openEvents);
    }

    @Test
    public void testTwoEventsNonOverlapping() throws Exception {
        EventLayout event1 = createEvent(60, 30, "event1");
        EventLayout event2 = createEvent(120, 30, "event2");
        List<EventLayout> events = new ArrayList<>();
        events.add(event1);
        events.add(event2);
        calc.setEvents(events);
        calc.calc();

        assertEventColumn(event1, 0, 1);
        assertRectEquals(event1.rect, 0, 0, 300, 25);
        assertTimePoints(event1.timePoints, 60);

        assertEventColumn(event2, 0, 1);
        assertRectEquals(event2.rect, 0, 50, 300, 25);
        assertTimePoints(event2.timePoints, 120);

        assertTimePoints(calc.getTimePoints(), 60, 60 + 30, 120, 120 + 30);
        assertEvents(calc.getTimePoints().get(0).openEvents, event1);
        assertEvents(calc.getTimePoints().get(1).openEvents);
        assertEvents(calc.getTimePoints().get(2).openEvents, event2);
        assertEvents(calc.getTimePoints().get(3).openEvents);

        assertEventRectsDoNotOverlap(events);
    }

    @Test
    public void testTwoEventsTouching() throws Exception {
        EventLayout event1 = createEvent(60, 30, "event1");
        EventLayout event2 = createEvent(90, 30, "event2");
        List<EventLayout> events = new ArrayList<>();
        events.add(event1);
        events.add(event2);
        calc.setEvents(events);
        calc.calc();

        assertEventColumn(event1, 0, 1);
        assertRectEquals(event1.rect, 0, 0, 300, 25);
        assertTimePoints(event1.timePoints, 60);

        assertEventColumn(event2, 0, 1);
        assertRectEquals(event2.rect, 0, 25, 300, 25);
        assertTimePoints(event2.timePoints, 90);

        assertTimePoints(calc.getTimePoints(), 60, 90, 90 + 30);
        assertEvents(calc.getTimePoints().get(0).openEvents, event1);
        assertEvents(calc.getTimePoints().get(1).openEvents, event2);
        assertEvents(calc.getTimePoints().get(2).openEvents);

        assertEventRectsDoNotOverlap(events);
    }

    @Test
    public void testTwoEventsSameTime() throws Exception {
        EventLayout event1 = createEvent(60, 30, "event1");
        EventLayout event2 = createEvent(60, 30, "event2");
        List<EventLayout> events = new ArrayList<>();
        events.add(event1);
        events.add(event2);
        calc.setEvents(events);
        calc.calc();

        assertEventColumn(event1, 0, 2);
        assertRectEquals(event1.rect, 0, 0, 150, 25);
        assertTimePoints(event1.timePoints, 60);

        assertEventColumn(event2, 1, 2);
        assertRectEquals(event2.rect, 150, 0, 150, 25);
        assertTimePoints(event2.timePoints, 60);

        assertTimePoints(calc.getTimePoints(), 60, 60 + 30);
        assertEvents(calc.getTimePoints().get(0).openEvents, event1, event2);
        assertEvents(calc.getTimePoints().get(1).openEvents);

        assertEventRectsDoNotOverlap(events);
    }

    @Test
    public void testLongEventWithTwoOverlaps() throws Exception {
        List<EventLayout> events = new ArrayList<>();
        events.add(createEvent(0, 180, "event1"));
        events.add(createEvent(0, 60, "event2"));
        events.add(createEvent(120, 60, "event3"));
        calc.setEvents(events);
        calc.calc();

        assertEventColumn(events.get(0), 0, 2);
        assertRectEquals(events.get(0).rect, 0, 0, 150, 150);
        assertTimePoints(events.get(0).timePoints, 0, 60, 120);

        assertEventColumn(events.get(1), 1, 2);
        assertRectEquals(events.get(1).rect, 150, 0, 150, 50);
        assertTimePoints(events.get(1).timePoints, 0);

        assertEventColumn(events.get(2), 1, 2);
        assertRectEquals(events.get(2).rect, 150, 100, 150, 50);
        assertTimePoints(events.get(2).timePoints, 120);

        assertTimePoints(calc.getTimePoints(), 0, 60, 120, 180);
        assertEvents(calc.getTimePoints().get(0).openEvents, events.get(0), events.get(1));
        assertEvents(calc.getTimePoints().get(1).openEvents, events.get(0));
        assertEvents(calc.getTimePoints().get(2).openEvents, events.get(0), events.get(2));
        assertEvents(calc.getTimePoints().get(3).openEvents);

        assertEventRectsDoNotOverlap(events);
    }

    @Test
    public void testShortEventsInSeries() throws Exception {
        List<EventLayout> events = new ArrayList<>();
        events.add(createEvent(0, 5, "event1"));
        events.add(createEvent(5, 5, "event2"));
        events.add(createEvent(10, 10, "event3"));
        params.distancePerHour = 50;
        params.minDistancePerHour = 30;
        params.minEventHeight = 15;
        calc = new Calc(params);
        calc.setEvents(events);
        calc.calc();

        assertTimePoints(calc.getTimePoints(), 0, 5, 10, 20);

        assertEventColumn(events.get(0), 0, 1);
        assertRectEquals(events.get(0).rect, 0, 0, 300, 15);
        assertEventColumn(events.get(1), 0, 1);
        assertRectEquals(events.get(1).rect, 0, 15, 300, 15);
        assertEventColumn(events.get(2), 0, 1);
        assertRectEquals(events.get(2).rect, 0, 30, 300, 15);

        assertEventRectsDoNotOverlap(events);

        assertTimeMapsHoursYPos(calc, 0, 78);
    }

    @Test
    public void testManyShortEventsInSeries() throws Exception {
        List<EventLayout> events = new ArrayList<>();
        events.add(createEvent(0, 5, "event1"));
        events.add(createEvent(5, 5, "event2"));
        events.add(createEvent(10, 10, "event3"));
        events.add(createEvent(20, 10, "event4"));
        events.add(createEvent(30, 15, "event5"));
        events.add(createEvent(45, 60, "event6"));
        params.distancePerHour = 50;
        params.minDistancePerHour = 30;
        params.minEventHeight = 15;
        calc = new Calc(params);
        calc.setEvents(events);
        calc.calc();

        assertTimePoints(calc.getTimePoints(), 0, 5, 10, 20, 30, 45, 60 + 45);

        assertEventColumn(events.get(0), 0, 1);
        assertRectEquals(events.get(0).rect, 0, 0, 300, 15);
        assertEventColumn(events.get(1), 0, 1);
        assertRectEquals(events.get(1).rect, 0, 15, 300, 15);
        assertEventColumn(events.get(2), 0, 1);
        assertRectEquals(events.get(2).rect, 0, 30, 300, 15);
        assertEventColumn(events.get(3), 0, 1);
        assertRectEquals(events.get(3).rect, 0, 45, 300, 15);
        assertEventColumn(events.get(4), 0, 1);
        assertRectEquals(events.get(4).rect, 0, 60, 300, 15);
        assertEventColumn(events.get(5), 0, 1);
        assertRectEquals(events.get(5).rect, 0, 75, 300, 30);

        assertEventRectsDoNotOverlap(events);

        assertTimeMapsHoursYPos(calc, 0, 83, 118);
    }

    @Test
    public void testComplexGolden1() throws Exception {
        List<EventLayout> events = new ArrayList<>();
        events.add(createEvent(-15, 60, "event1"));
        events.add(createEvent(55, 2 * 60 + 5, "event2"));
        events.add(createEvent(3 * 60, 8 * 60, "event3"));
        events.add(createEvent(3 * 60 + 15, 5 * 60 + 45, "event4"));
        events.add(createEvent(3 * 60 + 15, 10 * 60 + 5, "event5"));
        events.add(createEvent(9*60 + 50, 10, "event6"));
        params.distancePerHour = 50;
        params.minDistancePerHour = 30;
        params.minEventHeight = 15;
        calc = new Calc(params);
        calc.setEvents(events);
        calc.calc();

        assertTimePoints(calc.getTimePoints(), -15, 45, 55, 180, 195, 540, 590, 600,
                660, 800);

        assertEventColumn(events.get(0), 0, 1);
        assertRectEquals(events.get(0).rect, 0, 0, 300, 50);
        assertEventColumn(events.get(1), 0, 1);
        assertRectEquals(events.get(1).rect, 0, 58, 300, 105);
        assertEventColumn(events.get(2), 1, 3);
        assertRectEquals(events.get(2).rect, 100, 163, 100, 400);
        assertEventColumn(events.get(3), 2, 3);
        assertRectEquals(events.get(3).rect, 200, 175, 100, 288);
        assertEventColumn(events.get(4), 0, 3);
        assertRectEquals(events.get(4).rect, 0, 175, 100, 504);
        assertEventColumn(events.get(5), 2, 3);
        assertRectEquals(events.get(5).rect, 200, 504, 100, 15);

        assertEventRectsDoNotOverlap(events);

        assertTimeMapsHoursYPos(calc, -37, 13, 62, 113, 163, 213, 263, 313, 363,
                413, 463, 519, 563, 613, 662, 712);
    }

    private EventLayout createEvent(int startMinute, int duration, String name) {
        Calendar startTime = (Calendar) baseTime.clone();
        startTime.add(Calendar.MINUTE, startMinute);
        Calendar endTime = (Calendar) startTime.clone();
        endTime.add(Calendar.MINUTE, duration);
        String desc = startMinute + " for " + duration + " \"" + name;
        return new TestEventLayout(startTime, endTime, name, desc);
    }

    private void assertRectEquals(Rect rect, int x, int y, int width, int height) {
        Rect expectedRect = new Rect(x, y, width, height);
        assertEquals("Rects are not equal, expected " + expectedRect.toString() +
                " but was " + rect.toString(), expectedRect, rect);
    }

    private void assertEventColumn(EventLayout event, int column, int columnCount) {
        assertEquals(column, event.column);
        assertEquals(columnCount, event.columnCount);
        assertEquals(true, event.columnAssigned);
    }

    private void assertTimePoint(int expectedMinute, TimePoint timePoint) {
        assertEquals(expectedMinute,
                (timePoint.time.getTimeInMillis() - baseTime.getTimeInMillis()) /
                (1000 * 60));
    }

    private void assertTimePoints(List<TimePoint> timePoints, Integer... expectedMinutes) {
        List<Integer> actualMinutes = new ArrayList<>();
        for (TimePoint timePoint : timePoints) {
            actualMinutes.add((int) ((timePoint.time.getTimeInMillis() - baseTime.getTimeInMillis())
                    / (1000 * 60)));
        }
        MoreAsserts.assertContentsInOrder(actualMinutes, expectedMinutes);
    }

    private void assertEvents(List<EventLayout> events, EventLayout... expectedEvents) {
        MoreAsserts.assertContentsInOrder(events, expectedEvents);
    }

    private void assertEventRectsDoNotOverlap(List<EventLayout> events) {
        for (int i = 0; i < events.size(); i++) {
            EventLayout event1 = events.get(i);
            for (int j = i + 1; j < events.size(); j++) {
                EventLayout event2 = events.get(j);
                Rect intersect = event1.rect.intersection(event2.rect);
                if (intersect != null && intersect.width != 0 && intersect.height != 0) {
                    fail("Event rects overlap: " + event1.rect.toString() + ", " +
                            event2.rect.toString() + "; overlap: " + intersect.toString());
                }
            }
        }
    }

    private void assertTimeMapsHoursYPos(Calc calc, Integer... expectedYPosList) {
        assertTimeMapHoursYPos(calc.getTimeMap(), calc.getMinTime(), calc.getMaxTime(),
                expectedYPosList);
        assertTimeMapHoursYPos(calc.getLinearTimeMap(), calc.getMinTime(),
                calc.getMaxTime(), expectedYPosList);
    }

    private void assertTimeMapHoursYPos(final TimeMap timeMap, Calendar minTime, Calendar maxTime,
            Integer... expectedYPosList) {
        final List<Integer> actualYPosList = new ArrayList<>();
        Util.forEachHourWrap(minTime, maxTime, new Util.HourIterationCallback() {
            @Override
            public void callback(Calendar hour, Calendar nextHour, boolean isLast) {
                actualYPosList.add(timeMap.timeToYPos(hour));
            }
        });
        MoreAsserts.assertContentsInOrder(actualYPosList, expectedYPosList);
    }

    private static class TestEventLayout extends EventLayout {
        public String name;
        private String mDesc;

        public TestEventLayout(Calendar startTime, Calendar endTime, String name, String desc) {
            super(startTime, endTime);
            this.name = name;
            mDesc = desc;
        }

        @Override
        public String toString() {
            return "Event<" + mDesc + ">";
        }
    }

    public void dumpCalc(Calc calc) {
        Log.d(TAG, "Events:");
        for (EventLayout event : calc.getEvents()) {
            Log.d(TAG, "  " + event.toString() + ", column=" + event.column + "/"
                    + event.columnCount);
        }
        Log.d(TAG, "TimePoints:");
        for (TimePoint timePoint : calc.getTimePoints()) {
            long timePointMin = Util.msToMin(timePoint.time.getTimeInMillis()
                    - baseTime.getTimeInMillis());
            Log.d(TAG, "  TimePoint<" + timePointMin + ", columnCount=" + timePoint.columnCount
                    + ">");
            Log.d(TAG, "    OpenEvents:");
            for (EventLayout openEvent : timePoint.openEvents) {
                Log.d(TAG, "      " + openEvent.toString() + ", column=" + openEvent.column + "/"
                        + openEvent.columnCount);
            }
        }
    }
}