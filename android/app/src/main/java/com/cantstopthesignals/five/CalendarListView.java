package com.cantstopthesignals.five;

import android.content.Context;
import android.graphics.Canvas;
import android.util.AttributeSet;
import android.view.ViewGroup;

import com.cantstopthesignals.five.layout.Calc;
import com.cantstopthesignals.five.layout.Params;

import java.util.ArrayList;
import java.util.List;

public class CalendarListView extends ViewGroup {
    private List<EventCardView> mEventCards = new ArrayList<>();

    public CalendarListView(Context context) {
        this(context, null);
    }

    public CalendarListView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CalendarListView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        Params params = new Params();
        Calc calc = new Calc(params);

        int yPos = 0;
        int width = right - left;
        for (EventCardView eventCard : mEventCards) {
            eventCard.layout(0, yPos, width, yPos + 50);
            yPos += 50;
        }
    }

    public void setEvents(List<Event> events) {
        for (EventCardView oldEventCard : mEventCards) {
            removeView(oldEventCard);
        }
        mEventCards.clear();
        for (Event event : events) {
            EventCardView eventCard = new EventCardView(getContext());
            eventCard.setEvent(event);
            addView(eventCard);
            mEventCards.add(eventCard);
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
    }
}
