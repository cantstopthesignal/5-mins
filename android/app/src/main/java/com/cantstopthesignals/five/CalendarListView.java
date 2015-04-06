package com.cantstopthesignals.five;

import android.content.Context;
import android.graphics.Canvas;
import android.util.AttributeSet;
import android.view.ViewGroup;

import com.cantstopthesignals.five.layout.Calc;
import com.cantstopthesignals.five.layout.EventLayout;
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
        if (mEventCards.isEmpty()) {
            return;
        }
        List<EventLayout> eventLayouts = new ArrayList<>();
        for (EventCardView eventCard : mEventCards) {
            Event event = eventCard.getEvent();
            eventLayouts.add(new EventLayout(event.startTime, event.endTime));
        }
        int eventCardBorderWidth = getResources().getDimensionPixelSize(R.dimen.event_card_border_width);

        Params params = new Params();
        params.distancePerHour = getResources().getDimensionPixelSize(R.dimen.distance_per_hour);
        params.minDistancePerHour = getResources().getDimensionPixelSize(R.dimen.min_distance_per_hour);
        params.minTimePointSpacing = getResources().getDimensionPixelSize(R.dimen.min_time_point_spacing);
        params.minEventHeight = getResources().getDimensionPixelSize(R.dimen.min_event_height);
        params.timeAxisPatchWidth = getResources().getDimensionPixelSize(R.dimen.time_axis_patch_width);
        params.patchMinYPosDiff = getResources().getDimensionPixelSize(R.dimen.patch_min_y_pos_diff);
        params.layoutWidth = right - left - eventCardBorderWidth;
        Calc calc = new Calc(params);
        calc.setEvents(eventLayouts);
        calc.calc();

        for (int i = 0, count = mEventCards.size(); i < count; i++) {
            EventCardView eventCard = mEventCards.get(i);
            EventLayout eventLayout = eventLayouts.get(i);
            eventCard.layout(eventLayout.rect.left, eventLayout.rect.top,
                    eventLayout.rect.getRight() + eventCardBorderWidth,
                    eventLayout.rect.getBottom() + eventCardBorderWidth);
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
