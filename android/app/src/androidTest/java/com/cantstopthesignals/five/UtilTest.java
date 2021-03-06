package com.cantstopthesignals.five;

import org.junit.Test;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

import static org.junit.Assert.assertEquals;

public class UtilTest {

    private static final SimpleDateFormat LEGACY_ISO_DATE_FORMAT =
            new SimpleDateFormat("yyyyMMdd'T'HHmmss");

    public class HourIterationResult {
        public final Calendar hour;
        public final Calendar nextHour;
        public final boolean isLast;

        public HourIterationResult(Calendar hour, Calendar nextHour, boolean isLast) {
            this.hour = hour;
            this.nextHour = nextHour;
            this.isLast = isLast;
        }
    }

    @Test
    public void testConvertFromString() throws Exception {
        String isoString = "2019-02-27T22:10:00.000Z";
        Calendar date = Util.dateFromIsoString(isoString);
        date.setTimeZone(TimeZone.getTimeZone("UTC"));
        assertEquals("UTC", date.getTimeZone().getID());
        assertEquals(2019, date.get(Calendar.YEAR));
        assertEquals(1, date.get(Calendar.MONTH));
        assertEquals(27, date.get(Calendar.DATE));
        assertEquals(22, date.get(Calendar.HOUR_OF_DAY));
        assertEquals(10, date.get(Calendar.MINUTE));
        assertEquals(0, date.get(Calendar.SECOND));
        assertEquals(isoString, Util.dateToIsoString(date));
    }

    @Test
    public void testConvertToIsoString() throws Exception {
        Calendar date = Calendar.getInstance();
        date.setTimeInMillis(1548630246000L);
        String isoString = Util.dateToIsoString(date);
        assertEquals("2019-01-27T23:04:06.000Z", isoString);
        assertEquals(date.getTimeInMillis(), Util.dateFromIsoString(isoString).getTimeInMillis());
    }

    @Test
    public void testForEachHourRangeWrap_oneInstant() throws Exception {
        Calendar date = dateFromIsoStringLegacy("20120526T110000");
        HourIterationResult[] expected = new HourIterationResult[]{
                new HourIterationResult(date,
                        dateFromIsoStringLegacy("20120526T120000"),
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(date, date));

        date = dateFromIsoStringLegacy("20120526T111000");
        expected = new HourIterationResult[]{
                new HourIterationResult(
                        dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(date, date));
    }

    @Test
    public void testForEachHourWrap_oneInstant() throws Exception {
        Calendar date = dateFromIsoStringLegacy("20120526T110000");
        HourIterationResult[] expected = new HourIterationResult[]{
                new HourIterationResult(date,
                        dateFromIsoStringLegacy("20120526T120000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T120000"),
                        null,
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourWrap(date, date));

        date = dateFromIsoStringLegacy("20120526T111000");
        expected = new HourIterationResult[]{
                new HourIterationResult(dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T120000"),
                        null,
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourWrap(date, date));
    }

    @Test
    public void testForEachHourRangeWrap_oneHour() throws Exception {
        Calendar startDate = dateFromIsoStringLegacy("20120526T110000");
        Calendar endDate = (Calendar) startDate.clone();
        endDate.add(Calendar.HOUR, 1);

        HourIterationResult[] expected = new HourIterationResult[]{
                new HourIterationResult(dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(startDate,
                endDate));

        startDate = dateFromIsoStringLegacy("20120526T113000");
        endDate = (Calendar) startDate.clone();
        endDate.add(Calendar.HOUR, 1);

        expected = new HourIterationResult[]{
                new HourIterationResult(dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T120000"),
                        dateFromIsoStringLegacy("20120526T130000"),
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(startDate,
                endDate));
    }

    @Test
    public void testForEachHourWrap_oneHour() throws Exception {
        Calendar startDate = dateFromIsoStringLegacy("20120526T110000");
        Calendar endDate = (Calendar) startDate.clone();
        endDate.add(Calendar.HOUR, 1);

        HourIterationResult[] expected = new HourIterationResult[]{
                new HourIterationResult(dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T120000"),
                        null,
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate,
                endDate));

        startDate = dateFromIsoStringLegacy("20120526T113000");
        endDate = (Calendar) startDate.clone();
        endDate.add(Calendar.HOUR, 1);

        expected = new HourIterationResult[]{
                new HourIterationResult(dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T120000"),
                        dateFromIsoStringLegacy("20120526T130000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T130000"),
                        null,
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourWrap(startDate,
                endDate));
    }

    @Test
    public void testForEachHourRangeWrap_aFewHours() throws Exception {
        Calendar startDate = dateFromIsoStringLegacy("20120526T110000");
        Calendar endDate = (Calendar) startDate.clone();
        endDate.add(Calendar.HOUR, 3);

        HourIterationResult[] expected = new HourIterationResult[]{
                new HourIterationResult(dateFromIsoStringLegacy("20120526T110000"),
                        dateFromIsoStringLegacy("20120526T120000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T120000"),
                        dateFromIsoStringLegacy("20120526T130000"),
                        false),
                new HourIterationResult(dateFromIsoStringLegacy("20120526T130000"),
                        dateFromIsoStringLegacy("20120526T140000"),
                        true)
        };
        assertForEachHourWrapOutput(expected, doForEachHourRangeWrap(startDate,
                endDate));
    }

    private HourIterationResult[] doForEachHourRangeWrap(Calendar startDate, Calendar endDate) {
        final List<HourIterationResult> output = new ArrayList<>();
        Util.forEachHourRangeWrap(startDate, endDate, new Util.HourIterationCallback() {
            @Override
            public void callback(Calendar hour, Calendar nextHour, boolean isLast) {
                output.add(new HourIterationResult(hour, nextHour, isLast));
            }
        });
        return output.toArray(new HourIterationResult[output.size()]);
    }

    private HourIterationResult[] doForEachHourWrap(Calendar startDate, Calendar endDate) {
        final List<HourIterationResult> output = new ArrayList<>();
        Util.forEachHourWrap(startDate, endDate, new Util.HourIterationCallback() {
            @Override
            public void callback(Calendar hour, Calendar nextHour, boolean isLast) {
                output.add(new HourIterationResult(hour, nextHour, isLast));
            }
        });
        return output.toArray(new HourIterationResult[output.size()]);
    }

    private void assertForEachHourWrapOutput(HourIterationResult[] expected,
            HourIterationResult[] actual) {
        assertEquals("Output and actual array lengths don't match",
                expected.length, actual.length);
        for (int i = 0; i < expected.length; i++) {
            assertTimesEqualOrNull("Hour " + expected[i].hour + " doesn't match " +
                    actual[i].hour + "; iter " + i, expected[i].hour, actual[i].hour);
            assertTimesEqualOrNull("Next Hour " + expected[i].nextHour + " doesn't match " +
                    actual[i].nextHour + "; iter " + i, expected[i].nextHour, actual[i].nextHour);
            assertEquals("isLast status does not match",
                    expected[i].isLast, actual[i].isLast);
        }
    }

    @Test
    public void testRoundToFiveMinutes() throws Exception {
        class Helper {
            public void doTest(String expected, String input) {
                assertEquals(Util.dateToIsoString(dateFromIsoStringLegacy(expected)),
                        Util.dateToIsoString(Util.roundToFiveMinutes(
                                dateFromIsoStringLegacy(input))));
            }
        }
        Helper helper = new Helper();
        helper.doTest("20120526T110000", "20120526T110000");
        helper.doTest("20120526T110000", "20120526T110001");
        helper.doTest("20120526T110000", "20120526T110045");
        helper.doTest("20120526T110000", "20120526T110229");
        helper.doTest("20120526T110500", "20120526T110230");
        helper.doTest("20120526T111000", "20120526T110900");
        helper.doTest("20120526T114500", "20120526T114455");
        helper.doTest("20120526T115500", "20120526T115729");
        helper.doTest("20120526T120000", "20120526T115730");
        helper.doTest("20120526T120000", "20120526T115930");
    }

    @Test
    public void testHourFloor() throws Exception {
        class Helper {
            public void doTest(String expected, String input) {
                assertEquals(dateFromIsoStringLegacy(expected),
                        Util.hourFloor(dateFromIsoStringLegacy(input)));
            }
        }
        Helper helper = new Helper();
        helper.doTest("20120526T110000", "20120526T110000");
        helper.doTest("20120526T110000", "20120526T110001");
        helper.doTest("20120526T110000", "20120526T110900");
        helper.doTest("20120526T110000", "20120526T115930");
        helper.doTest("20120526T120000", "20120526T120000");
    }

    @Test
    public void testDayFloor() throws Exception {
        class Helper {
            public void doTest(String expected, String input) {
                assertEquals(Util.dateToIsoString(dateFromIsoStringLegacy(expected)),
                        Util.dateToIsoString(Util.dayFloor(dateFromIsoStringLegacy(input))));
            }
        }
        Helper helper = new Helper();
        helper.doTest("20120526T000000", "20120526T110000");
        helper.doTest("20120526T000000", "20120526T110001");
        helper.doTest("20120526T000000", "20120526T165930");
        helper.doTest("20120527T000000", "20120527T120000");
    }

    @Test
    public void testHourAddSafe() throws Exception {
        Calendar start = dateFromIsoStringLegacy("20120526T110000");
        Calendar expected = (Calendar) start.clone();
        expected.add(Calendar.HOUR, 1);
        assertTimesEqualOrNull("Should be equal", expected,
                Util.hourAddSafe(start));
    }

    private void assertTimesEqualOrNull(String msg, Calendar time1, Calendar time2) {
        assertEquals(msg, time1 == null, time2 == null);
        if (time1 != null) {
            assertEquals(msg, time1, time2);
        }
    }

    private static Calendar dateFromIsoStringLegacy(String str) {
        try {
            Date date = LEGACY_ISO_DATE_FORMAT.parse(str);
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(date);
            return calendar;
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }
}
