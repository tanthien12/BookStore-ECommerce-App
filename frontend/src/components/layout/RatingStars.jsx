// RatingStars.jsx
import React from "react";
import { FiStar } from "react-icons/fi";

export default function RatingStars({ value = 0, onChange, size = 22 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((num) => (
        <FiStar
          key={num}
          size={size}
          onClick={() => onChange?.(num)}
          className={`cursor-pointer transition-all ${
            value >= num
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}
