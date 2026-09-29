import React, { useEffect, useRef, useState } from 'react';

function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export default function AnimatedNumber({
  value,
  format = (val) => Math.round(val).toLocaleString(),
  duration = 1400,
  className = '',
  ...props
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const targetVal = Number(value) || 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = startVal + (targetVal - startVal) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetVal);
        prevValueRef.current = targetVal;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      {...props}
    >
      {format(displayValue)}
    </span>
  );
}
