import React from "react";

export default function RatingStars({ value = 0, size = 16 }) {
    const full = Math.floor(value);
    return (
        <span className="inline-flex items-center gap-[2px]">
            {[0, 1, 2, 3, 4].map((i) => (
                <span
                    key={i}
                    style={{ fontSize: size, lineHeight: 1 }}
                    className={i < full ? "text-yellow-500" : "text-gray-300"}
                >
                    ★
                </span>
            ))}
        </span>
    );
}