package com.cantstopthesignals.five;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

import java.util.List;

public class CalendarListView extends View {
    private final Paint mTextPaint;
    private List<EventInfo> mEvents;

    public CalendarListView(Context context) {
        this(context, null);
    }

    public CalendarListView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CalendarListView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);

        mTextPaint = new Paint();
        mTextPaint.setColor(Color.BLUE);
    }

    public void setEvents(List<EventInfo> events) {
        mEvents = events;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if (mEvents == null) {
            return;
        }
        canvas.drawText(mEvents.size() + " events loaded", 50, 50, mTextPaint);
    }
}
