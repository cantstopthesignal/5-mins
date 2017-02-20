package com.cantstopthesignals.five;

import java.util.Iterator;

abstract class CheckedIterator<T, E extends Exception> implements Iterator<T> {
    private E exception;

    protected void setException(E exception) {
        this.exception = exception;
    }

    /** Subclasses should call this method in hasNext and return false if an exception was posted */
    protected boolean hasException() {
        return exception != null;
    }

    public void checkException() throws E {
        if (exception != null) {
            throw exception;
        }
    }
}
