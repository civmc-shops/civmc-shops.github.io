import React from "react";

export default function StarRating({ rating, outOf = 5, size = 22 }) {
  const fullStars = Math.floor(rating);
  const decimal = rating - fullStars;
  const stars = [];

  for (let i = 0; i < outOf; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} fill="#ffd700" size={size} />);
    } else if (i === fullStars && decimal > 0) {
      stars.push(
        <PartialStar key={i} percent={decimal} size={size} />
      );
    } else {
      stars.push(<Star key={i} fill="#444" size={size} />);
    }
  }

  return (
    <span style={{ display: "inline-flex", verticalAlign: "middle" }}>{stars}</span>
  );
}

function Star({ fill, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ display: "block" }}
    >
      <polygon
        points="10,1 12.59,7.36 19.51,7.36 13.96,11.63 16.55,17.99 10,13.72 3.45,17.99 6.04,11.63 0.49,7.36 7.41,7.36"
        fill={fill}
        stroke="#222"
        strokeWidth="1"
      />
    </svg>
  );
}

function PartialStar({ percent, size }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
      {/* Filled part */}
      <span style={{
        position: "absolute",
        overflow: "hidden",
        width: `${percent * size}px`,
        height: size,
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: "none"
      }}>
        <Star fill="#ffd700" size={size} />
      </span>
      {/* Empty part (outline) */}
      <span style={{
        position: "absolute",
        width: size,
        height: size,
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: "none"
      }}>
        <Star fill="#444" size={size} />
      </span>
    </span>
  );
}