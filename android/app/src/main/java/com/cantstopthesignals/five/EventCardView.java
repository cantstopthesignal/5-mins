package com.cantstopthesignals.five;

import android.content.Context;
import android.widget.TextView;

public class EventCardView extends TextView {
    private Event mEvent;

    public EventCardView(Context context) {
        super(context);
    }

    public void setEvent(Event event) {
        mEvent = event;
        setText(mEvent.title);
    }
}
