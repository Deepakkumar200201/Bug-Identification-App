import { useEffect, useRef, useState } from "react";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  baseColor?: string;
  progressColor?: string;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  baseColor = "#E5E7EB",
  progressColor = "#4CAF50"
}: ProgressRingProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [offset, setOffset] = useState(0);
  
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Calculate the stroke-dashoffset value based on progress
    const progressOffset = circumference - (progress / 100) * circumference;
    setOffset(progressOffset);
  }, [progress, circumference]);

  return (
    <div className="relative h-16 w-16">
      <svg className="progress-ring" width={size} height={size}>
        <circle
          className="progress-ring-circle"
          stroke={baseColor}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          ref={circleRef}
          className="progress-ring-circle"
          stroke={progressColor}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-lg font-bold text-primary">{progress}%</span>
        <span className="text-xs text-gray-500">Confidence</span>
      </div>
    </div>
  );
}
