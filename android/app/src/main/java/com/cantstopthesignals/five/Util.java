package com.cantstopthesignals.five;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class Util {
    private static final SimpleDateFormat ISO_DATE_FORMAT = new SimpleDateFormat(
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    private static final TimeZone UTC = TimeZone.getTimeZone("UTC");
    static {
        ISO_DATE_FORMAT.setTimeZone(UTC);
    }

    public static int round(float in) {
        return Math.round(in + 0.0001f);
    }

    public static long roundLong(float in) {
        return Math.round((double) in + 0.0001d);
    }

    public static long hourToMs(long hour) {
        return hour * 3600000;
    }

    public static float msToHourFloat(long ms) {
        return ms / 3600000f;
    }

    public static long secToMs(long sec) {
        return sec * 1000;
    }

    public static long msToSec(long ms) {
        return roundLong(ms / 1000f);
    }

    public static long msToMin(long ms) {
        return roundLong(ms / 1000f / 60f);
    }

    public static Calendar hourFloor(Calendar date) {
        Calendar hourFloor = (Calendar) date.clone();
        hourFloor.set(Calendar.MINUTE, 0);
        hourFloor.set(Calendar.SECOND, 0);
        hourFloor.set(Calendar.MILLISECOND, 0);
        return hourFloor;
    }

    public static Calendar hourCeil(Calendar date) {
        Calendar hourCeil = hourFloor(date);
        if (date.compareTo(hourCeil) > 0) {
            return hourAddSafe(hourCeil);
        }
        return hourCeil;
    }

    /**
     * Safely add an hour to a date without the risk of daylight savings issues.
     */
    public static Calendar hourAddSafe(Calendar date) {
        return hourAddSafe(date, 1);
    }

    /**
     * Safely add an hour to a date without the risk of daylight savings issues.
     */
    public static Calendar hourAddSafe(Calendar date, int hours) {
        Calendar newDate = (Calendar) date.clone();
        newDate.add(Calendar.HOUR, hours);
        return newDate;
    }

    public static Calendar dayFloor(Calendar date) {
        Calendar dayFloor = (Calendar) date.clone();
        dayFloor.set(Calendar.HOUR_OF_DAY, 0);
        dayFloor.set(Calendar.MINUTE, 0);
        dayFloor.set(Calendar.SECOND, 0);
        dayFloor.set(Calendar.MILLISECOND, 0);
        return dayFloor;
    }

    public static Calendar roundToFiveMinutes(Calendar date) {
        Calendar hourBase = hourAddSafe(hourFloor(date), -1);
        int factor = 1000 * 60 * 5;
        long newTime = Util.roundLong((date.getTimeInMillis() - hourBase.getTimeInMillis()) /
                (float) factor) * factor + hourBase.getTimeInMillis();
        Calendar newDate = Calendar.getInstance();
        newDate.setTimeInMillis(newTime);
        return newDate;
    }

    public interface HourIterationCallback {
        void callback(Calendar hour, Calendar nextHour, boolean isLast);
    }

    /**
     * Call fn for each hour range surrounding startTime and endTime.
     * fn is called with arguments (hour, nextHour, isLast).
     */
    public static void forEachHourRangeWrap(Calendar startTime, Calendar endTime,
            HourIterationCallback fn) {
        forEachHourWrapInternal(startTime, endTime, fn, false);
    }

    /**
     * Call fn for each hour surrounding startTime and endTime.
     * fn is called with arguments (hour, nextHour, isLast).
     */
    public static void forEachHourWrap(Calendar startTime, Calendar endTime,
            HourIterationCallback fn) {
        forEachHourWrapInternal(startTime, endTime, fn, true);
    }

    private static void forEachHourWrapInternal(Calendar startTime, Calendar endTime,
            HourIterationCallback fn, boolean callWithFinal) {
        Calendar hourIter = hourFloor(startTime);
        long maxTime = endTime.getTimeInMillis();
        boolean firstIter = true;
        while (hourIter.getTimeInMillis() < maxTime || firstIter) {
            Calendar nextHour = hourAddSafe(hourIter);
            boolean isLast = nextHour.getTimeInMillis() >= maxTime && !callWithFinal;
            fn.callback(hourIter, nextHour, isLast);
            firstIter = false;
            hourIter = nextHour;
        }
        if (callWithFinal) {
            fn.callback(hourIter, null, true);
        }
    }

    public static Calendar dateFromIsoString(String str) {
        try {
            Date date = ISO_DATE_FORMAT.parse(str);
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(date);
            return calendar;
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }

    public static String dateToIsoString(Calendar date) {
        return ISO_DATE_FORMAT.format(date.getTime());
    }
}
