"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    const label = metric.name;
    const value = Math.round(metric.rating === "good" ? metric.value : metric.value * 100) / 100;

    console.log(
      `%c[Web Vital] ${label}: ${value}ms (${metric.rating})`,
      `color: ${
        metric.rating === "good"
          ? "green"
          : metric.rating === "needs-improvement"
            ? "orange"
            : "red"
      }; font-weight: bold;`
    );

    if (typeof window !== "undefined") {
      window.__WEB_VITALS = window.__WEB_VITALS || [];
      window.__WEB_VITALS.push({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
      });
    }
  });

  return null;
}

declare global {
  interface Window {
    __WEB_VITALS: Array<{
      name: string;
      value: number;
      rating: string;
      timestamp: number;
    }>;
  }
}
