import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PerformanceGraphProps {
  history: { time: number; score: number }[];
}

const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ history }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || history.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const x = d3.scaleLinear()
      .domain(d3.extent(history, d => d.time) as [number, number])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(history, d => d.score) || 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<{ time: number; score: number }>()
      .x(d => x(d.time))
      .y(d => y(d.score))
      .curve(d3.curveMonotoneX);

    // Add X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${Math.floor(d.valueOf() / 1000)}s`))
      .attr("color", "#94a3b8");

    // Add Y Axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#94a3b8");

    // Add Path
    svg.append("path")
      .datum(history)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add Gradient Area
    const area = d3.area<{ time: number; score: number }>()
      .x(d => x(d.time))
      .y0(height - margin.bottom)
      .y1(d => y(d.score))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(history)
      .attr("fill", "rgba(59, 130, 246, 0.2)")
      .attr("d", area);

  }, [history]);

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-gray-300 mb-2 font-semibold text-center">Score Progression</h3>
      <svg ref={svgRef} viewBox="0 0 400 200" className="w-full h-auto"></svg>
    </div>
  );
};

export default PerformanceGraph;