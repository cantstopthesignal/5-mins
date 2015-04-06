package com.cantstopthesignals.five;

public class Rect {
    public int left;
    public int top;
    public int width;
    public int height;

    public Rect(int left, int top, int width, int height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    public int getRight() {
        return left + width;
    }

    public int getBottom() {
        return top + height;
    }

    @Override
    public boolean equals(Object other) {
        if (!(other instanceof Rect)) {
            return false;
        }
        Rect otherRect = (Rect) other;
        return left == otherRect.left && top == otherRect.top && width == otherRect.width
                && height == otherRect.height;
    }

    @Override
    public String toString() {
        return "Rect<" + left + "," + top + "-" + width + "," + height + ">";
    }

    public Rect intersection(Rect other) {
        int x0 = Math.max(left, other.left);
        int x1 = Math.min(left + width, other.left + other.width);

        if (x0 <= x1) {
            int y0 = Math.max(top, other.top);
            int y1 = Math.min(top + height, other.top + other.height);

            if (y0 <= y1) {
                return new Rect(x0, y0, x1 - x0, y1 - y0);
            }
        }
        return null;
    }
}
