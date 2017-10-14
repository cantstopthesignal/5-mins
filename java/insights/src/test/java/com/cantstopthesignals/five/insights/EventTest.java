package com.cantstopthesignals.five.insights;

import org.junit.Test;
import static org.junit.Assert.assertArrayEquals;

public class EventTest {
    @Test
    public void testSplitSummary() {
        assertArrayEquals(Event.splitSummary("simple summary"), new String[] {"simple summary"});
        assertArrayEquals(Event.splitSummary("two; parts"), new String[] {"two", "parts"});
        assertArrayEquals(Event.splitSummary("two;parts"), new String[] {"two", "parts"});
        assertArrayEquals(Event.splitSummary("three; parts; summary: complex"),
                new String[] {"three", "parts", "summary: complex"});
    }
}
