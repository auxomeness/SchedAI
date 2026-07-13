"use client";

import { useEffect, useState } from "react";

export function BottomAurora() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function handleScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const documentElement = document.documentElement;
        const distanceFromBottom = documentElement.scrollHeight - window.scrollY - window.innerHeight;
        const revealDistance = Math.min(520, window.innerHeight * 0.62);
        const nextProgress = 1 - Math.max(0, Math.min(1, distanceFromBottom / revealDistance));
        setProgress(nextProgress);
      });
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[4vh] left-0 right-0 z-0 h-[68vh] origin-bottom overflow-hidden opacity-100 transition-transform duration-200 ease-out"
      style={{
        transform: `scaleY(${progress})`,
        maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.38) 12%, rgba(0,0,0,0.84) 26%, black 42%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.38) 12%, rgba(0,0,0,0.84) 26%, black 42%)"
      }}
    >
      <svg className="h-full w-full" viewBox="0 0 1440 520" preserveAspectRatio="none" fill="none">
        <defs>
          <filter id="schedai-aurora-blur" x="-90" y="-90" width="1620" height="720" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <filter id="schedai-aurora-ridge-blur" x="-90" y="-90" width="1620" height="720" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="13" />
          </filter>
          <linearGradient id="schedai-aurora-gradient" x1="0" y1="520" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#071A5E" />
            <stop offset="0.13" stopColor="#075DFF" />
            <stop offset="0.29" stopColor="#72BFFF" />
            <stop offset="0.41" stopColor="#EAF7FF" />
            <stop offset="0.53" stopColor="#FFE64D" />
            <stop offset="0.66" stopColor="#FF9A00" />
            <stop offset="0.78" stopColor="#FF2A1F" />
            <stop offset="0.9" stopColor="#FF00B8" />
            <stop offset="1" stopColor="#FFD1F2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g filter="url(#schedai-aurora-blur)">
          {[
            [-130, 250],
            [20, 305],
            [170, 370],
            [320, 435],
            [470, 505],
            [620, 560],
            [770, 520],
            [920, 455],
            [1070, 390],
            [1220, 320],
            [1370, 260]
          ].map(([x, height], index) => (
            <rect
              key={`${x}-${height}`}
              x={x}
              y={520 - height}
              width="220"
              height={height + 70}
              rx="76"
              fill="url(#schedai-aurora-gradient)"
              opacity={index % 2 === 0 ? 0.98 : 0.9}
            />
          ))}
        </g>
        <g filter="url(#schedai-aurora-ridge-blur)" opacity="0.82">
          {[
            [-120, 245],
            [-20, 255],
            [80, 315],
            [180, 330],
            [280, 400],
            [380, 415],
            [480, 500],
            [580, 515],
            [680, 565],
            [780, 520],
            [880, 470],
            [980, 430],
            [1080, 380],
            [1180, 340],
            [1280, 290],
            [1380, 245]
          ].map(([x, height], index) => (
            <rect
              key={`ridge-${x}-${height}`}
              x={x}
              y={520 - height}
              width="128"
              height={height + 90}
              rx="34"
              fill="url(#schedai-aurora-gradient)"
              opacity={index % 3 === 0 ? 0.72 : 0.58}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
