package com.cantstopthesignals.five;

import com.cantstopthesignals.five.layout.CalcTest;

import org.junit.runner.RunWith;
import org.junit.runners.Suite;

@RunWith(Suite.class)
@Suite.SuiteClasses({
        CalcTest.class,
        UtilTest.class
})
public class AllTests {}
