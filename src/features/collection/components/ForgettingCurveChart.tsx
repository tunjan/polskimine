import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { ReviewLog } from "@/types";
import { format } from "date-fns";

const MIN_POINTS = 1000;

interface DataPoint {
  date: Date;
  daysSinceFirstLearn: number;
  elapsedDaysSinceLastReview: number;
  retrievability: number;
  stability: number;
}

export enum TimeRange {
  Week,
  Month,
  Year,
  AllTime,
}

const MAX_DAYS = {
  [TimeRange.Week]: 7,
  [TimeRange.Month]: 30,
  [TimeRange.Year]: 365,
  [TimeRange.AllTime]: Infinity,
};

import { getRetrievability } from "@/lib/fsrsShared";

function prepareData(
  revlog: ReviewLog[],
  targetEndDays: number,
  firstReviewTimestamp?: number,
) {
  const data: DataPoint[] = [];
  let lastReviewTime = 0;
  let lastStability = 0;
  const step = Math.min(targetEndDays / MIN_POINTS, 1);
  let daysSinceFirstLearn = 0;

  const sortedLogs = [...revlog].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const firstLogTime =
    sortedLogs.length > 0
      ? new Date(sortedLogs[0].created_at).getTime() / 1000
      : Date.now() / 1000;
  const effectiveFirstReviewTime =
    firstReviewTimestamp && firstReviewTimestamp < firstLogTime
      ? firstReviewTimestamp
      : firstLogTime;

  sortedLogs.forEach((entry, index) => {
    const reviewTime = new Date(entry.created_at).getTime() / 1000;

    if (index === 0) {
      lastReviewTime = reviewTime;
      lastStability = entry.stability || 0;
      data.push({
        date: new Date(reviewTime * 1000),
        daysSinceFirstLearn: (reviewTime - effectiveFirstReviewTime) / 86400,
        elapsedDaysSinceLastReview: 0,
        retrievability: 100,
        stability: lastStability,
      });
      return;
    }

    const totalDaysElapsed = (reviewTime - lastReviewTime) / 86400;
    let elapsedDays = 0;

    while (elapsedDays < totalDaysElapsed - step) {
      elapsedDays += step;
      const retrievability = getRetrievability(elapsedDays, lastStability);
      data.push({
        date: new Date((lastReviewTime + elapsedDays * 86400) * 1000),
        daysSinceFirstLearn: data[data.length - 1].daysSinceFirstLearn + step,
        elapsedDaysSinceLastReview: elapsedDays,
        retrievability: retrievability * 100,
        stability: lastStability,
      });
    }

    daysSinceFirstLearn = (reviewTime - effectiveFirstReviewTime) / 86400;
    data.push({
      date: new Date(reviewTime * 1000),
      daysSinceFirstLearn: daysSinceFirstLearn,
      elapsedDaysSinceLastReview: 0,
      retrievability: 100,
      stability: lastStability,
    });

    lastReviewTime = reviewTime;
    lastStability = entry.stability || 0;
  });

  if (data.length === 0) return [];

  const targetEndTime = effectiveFirstReviewTime + targetEndDays * 86400;

  const totalDaysToProject = (targetEndTime - lastReviewTime) / 86400;

  let elapsedDays = 0;

  while (elapsedDays < totalDaysToProject - step) {
    elapsedDays += step;
    const retrievability = getRetrievability(elapsedDays, lastStability);
    data.push({
      date: new Date((lastReviewTime + elapsedDays * 86400) * 1000),
      daysSinceFirstLearn: data[data.length - 1].daysSinceFirstLearn + step,
      elapsedDaysSinceLastReview: elapsedDays,
      retrievability: retrievability * 100,
      stability: lastStability,
    });
  }

  if (totalDaysToProject > 0) {
    const finalRetrievability = getRetrievability(
      totalDaysToProject,
      lastStability,
    );
    data.push({
      date: new Date(targetEndTime * 1000),
      daysSinceFirstLearn: targetEndDays,
      elapsedDaysSinceLastReview: totalDaysToProject,
      retrievability: finalRetrievability * 100,
      stability: lastStability,
    });
  }

  return data;
}

interface ForgettingCurveChartProps {
  logs: ReviewLog[];
  className?: string;
  desiredRetention?: number;
  firstReviewDate?: number | null;
}

export const ForgettingCurveChart: React.FC<ForgettingCurveChartProps> = ({
  logs,
  className,
  desiredRetention = 0.9,
  firstReviewDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.AllTime);

  const firstReviewTimestamp = useMemo(() => {
    return firstReviewDate
      ? firstReviewDate / 1000
      : undefined;
  }, [firstReviewDate]);

  const targetEndDays = useMemo(() => {
    const rangeMaxDays = MAX_DAYS[timeRange];
    if (rangeMaxDays !== Infinity) {
      return rangeMaxDays;
    }

    if (!logs || logs.length === 0) return 30;

    const sortedLogs = [...logs].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    const firstLogTime = new Date(sortedLogs[0].created_at).getTime() / 1000;
    const effectiveFirstReviewTime =
      firstReviewTimestamp && firstReviewTimestamp < firstLogTime
        ? firstReviewTimestamp
        : firstLogTime;
    const now = Date.now() / 1000;

    const daysSinceFirstReview = (now - effectiveFirstReviewTime) / 86400;
    const lastScheduledDays =
      sortedLogs[sortedLogs.length - 1].scheduled_days || 7;
    const previewDays = Math.max(lastScheduledDays * 1.5, 7);

    return daysSinceFirstReview + previewDays;
  }, [logs, timeRange, firstReviewTimestamp]);

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return prepareData(logs, targetEndDays, firstReviewTimestamp);
  }, [logs, targetEndDays, firstReviewTimestamp]);

  useEffect(() => {
    if (!containerRef.current || chartData.length === 0) return;

    const container = containerRef.current;
    d3.select(container).selectAll("*").remove();

    const { width: clientWidth, height: clientHeight } =
      container.getBoundingClientRect();
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = clientWidth - margin.left - margin.right;
    const height = clientHeight - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", clientWidth)
      .attr("height", clientHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    let xMin: Date | undefined;
    if (firstReviewTimestamp) {
      xMin = new Date(firstReviewTimestamp * 1000);
    } else {
      xMin = d3.min(chartData, (d) => d.date);
    }

    if (!xMin) return;

    let xMax: Date;
    const rangeMaxDays = MAX_DAYS[timeRange];
    if (rangeMaxDays === Infinity) {
      const dataMax = d3.max(chartData, (d) => d.date);
      const now = new Date();
      xMax = dataMax && dataMax > now ? dataMax : now;
    } else {
      xMax = new Date(xMin.getTime() + rangeMaxDays * 24 * 60 * 60 * 1000);
    }

    const x = d3.scaleTime().domain([xMin, xMax]).range([0, width]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)

      .call(
        d3
          .axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0),
      );

    const yMin = Math.max(
      0,
      100 - 1.2 * (100 - (d3.min(chartData, (d) => d.retrievability) || 0)),
    );
    const y = d3.scaleLinear().domain([yMin, 100]).range([height, 0]);

    svg.append("g").call(d3.axisLeft(y).tickSizeOuter(0));

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "currentColor")
      .text("Retention %");

    const desiredRetentionY = desiredRetention * 100;
    const defs = svg.append("defs");

        defs
      .append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    const gradient = defs
      .append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", 0)
      .attr("y2", y(100));

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "tomato");
    gradient
      .append("stop")
      .attr("offset", `${desiredRetentionY}%`)
      .attr("stop-color", "steelblue");

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#22c55e");

    const lineGenerator = d3
      .line<DataPoint>()
      .x((d) => x(d.date))
      .y((d) => y(d.retrievability));

    const today = new Date();
    const pastData = chartData.filter((d) => d.date <= today);
    const futureData = chartData.filter((d) => d.date >= today);

        svg
      .append("path")
      .datum(pastData)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("clip-path", "url(#chart-clip)")
      .attr("d", lineGenerator);

    svg
      .append("path")
      .datum(futureData)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 4")
      .attr("clip-path", "url(#chart-clip)")
      .attr("d", lineGenerator);

    if (desiredRetentionY > yMin) {
      svg
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(desiredRetentionY))
        .attr("y2", y(desiredRetentionY))
        .attr("stroke", "steelblue")
        .attr("stroke-dasharray", "4 4")
        .attr("stroke-width", 1)
        .style("opacity", 0.5);
    }

    const focusLine = svg
      .append("line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const tooltip = d3
      .select(container)
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.8)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const date = x.invert(mx);

        const index = d3
          .bisector((d: DataPoint) => d.date)
          .left(chartData, date, 1);
        const d0 = chartData[index - 1];
        const d1 = chartData[index];
        const d =
          d1 && d0
            ? date.getTime() - d0.date.getTime() >
              d1.date.getTime() - date.getTime()
              ? d1
              : d0
            : d0 || d1;

        if (d) {
          focusLine
            .attr("x1", x(d.date))
            .attr("x2", x(d.date))
            .style("opacity", 0.5);

          const tooltipHtml = `
            <div><strong>${format(d.date, "PP p")}</strong></div>
            <div>Retention: ${d.retrievability.toFixed(1)}%</div>
            <div>Stability: ${d.stability.toFixed(1)} days</div>
            <div>Elapsed: ${d.elapsedDaysSinceLastReview.toFixed(1)} days</div>
          `;

          const [containerX, containerY] = d3.pointer(event, container);

          tooltip
            .html(tooltipHtml)
            .style("left", `${containerX + 10}px`)
            .style("top", `${containerY + 10}px`)
            .style("opacity", 1);
        }
      })
      .on("mouseleave", () => {
        focusLine.style("opacity", 0);
        tooltip.style("opacity", 0);
      });
  }, [chartData, desiredRetention]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-end gap-2">
        {(Object.keys(TimeRange) as (keyof typeof TimeRange)[])
          .filter((k) => isNaN(Number(k)))
          .map((key) => {
            const val = TimeRange[key];
            return (
              <button
                key={key}
                onClick={() => setTimeRange(val)}
                className={`text-xs px-2 py-1 rounded transition-colors ${timeRange === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
              >
                {key}
              </button>
            );
          })}
      </div>
      <div
        ref={containerRef}
        className="w-full h-64 relative bg-card rounded-md border"
        style={{ minHeight: "250px" }}
      />
    </div>
  );
};
