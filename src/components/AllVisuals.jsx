import React, { useContext, useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { DataContext } from "../data/DataContext";
import * as d3 from "d3";

const AllVisuals = () => {
  const { data } = useContext(DataContext);
  const [selectedOrigin, setSelectedOrigin] = useState("All");
  const [histogramBinCount, setHistogramBinCount] = useState(5);
  const [numBins, setNumBins] = useState(6); // default to 6 bins or any sensible default
  const [connectedMetric, setConnectedMetric] = useState("MPG");
  const connectedScatterRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const histogramSvgRef = useRef();

  const filteredData = useMemo(() => {
    return selectedOrigin === "All"
      ? data
      : data.filter((d) => d.Origin === selectedOrigin);
  }, [data, selectedOrigin]);

  const allOrigins = ["American", "European", "Japanese"];
  const width = 400;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Histogram bins
  const cylinderExtent = d3.extent(filteredData, (d) => d.Cylinders);
  const histogramBins = d3
    .bin()
    .domain(cylinderExtent)
    .thresholds(numBins)
    .value((d) => d.Cylinders)(filteredData);

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) return;

    const cylinders = filteredData.map((d) => +d.Cylinders);
    const bins = d3.bin().thresholds(histogramBinCount)(cylinders);

    const width = 800;
    const height = 500;
    const margin = { top: 60, right: 30, bottom: 60, left: 60 };

    const svg = d3.select(histogramSvgRef.current);
    svg.selectAll("*").remove();
    svg.style("background", "#1a1a1a");

    const x = d3
      .scaleBand()
      .domain(bins.map((d) => d.x0))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(bins, (d) => d.length)]);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat((d) => `${d}`))
      .selectAll("text")
      .attr("fill", "#eee");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#eee");

    svg
      .append("g")
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.x0))
      .attr("y", (d) => y(d.length))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - margin.bottom - y(d.length))
      .attr("fill", (d) => color(d.length));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#ccc")
      .style("font-size", "14px")
      .text("Number of Cylinders");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#ccc")
      .style("font-size", "14px")
      .text("Frequency");
  }, [filteredData, histogramBinCount]);

  const cylinderScale = d3
    .scaleBand()
    .domain(histogramBins.map((bin) => bin.x0))
    .range([0, innerWidth])
    .padding(0.1);

  const histYScale = d3
    .scaleLinear()
    .domain([0, d3.max(histogramBins, (d) => d.length)])
    .nice()
    .range([innerHeight, 0]);

  // Bubble chart scales
  const xScaleBubble = d3.scaleLinear().domain([0, 250]).range([0, innerWidth]);
  const yScaleBubble = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.Acceleration)])
    .range([innerHeight, 0]);

  // Connected Scatter
  useEffect(() => {
    if (!filteredData.length || !connectedMetric) return;

    const svg = d3.select(connectedScatterRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 80, bottom: 50, left: 60 };
    const width = 650;
    const height = 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const originColor = {
      American: "#00eaff",
      European: "#ffcc00",
      Japanese: "#e57cff",
    };

    const dataWithYear = filteredData
      .map((d) => {
        const year = +d["Model_Year"] || +d["Model Year"];
        const value = +d[connectedMetric];
        return {
          ...d,
          year,
          value,
        };
      })
      .filter((d) => !isNaN(d.year) && !isNaN(d.value));

    const nested = d3
      .groups(dataWithYear, (d) => d.Origin)
      .map(([origin, values]) => {
        const yearly = d3
          .groups(values, (d) => d.year)
          .map(([year, entries]) => {
            const avg = d3.mean(entries, (d) => d.value);
            return { year: +year, avg };
          });

        return {
          origin,
          values: yearly
            .filter((d) => !isNaN(d.avg))
            .sort((a, b) => a.year - b.year),
        };
      });

    const x = d3.scaleLinear().domain([70, 82]).range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(nested, (group) => d3.max(group.values, (d) => d.avg)) * 1.1 ||
          1,
      ])
      .range([innerHeight, 0]);

    const line = d3
      .line()
      .x((d) => x(d.year))
      .y((d) => y(d.avg));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("fill", "white");

    g.append("g").call(d3.axisLeft(y)).selectAll("text").attr("fill", "white");

    g.selectAll(".domain, .tick line").attr("stroke", "#888");
    // X-axis Label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .text("Model Year")
      .style("fill", "white")
      .style("font-size", "14px");

    // Y-axis Label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -innerHeight / 2)
      .attr("y", -45)
      .text(connectedMetric)
      .style("fill", "white")
      .style("font-size", "14px");

    nested.forEach((group) => {
      g.append("path")
        .datum(group.values)
        .attr("fill", "none")
        .attr("stroke", originColor[group.origin])
        .attr("stroke-width", 2.5)
        .attr("d", line);

      g.selectAll(`.dot-${group.origin}`)
        .data(group.values)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(d.avg))
        .attr("r", 4)
        .attr("fill", originColor[group.origin])
        .on("mouseover", (event, d) => {
          d3.select(".tooltip-connected")
            .style("opacity", 1)
            .html(`Year: ${d.year}<br>${connectedMetric}: ${d.avg.toFixed(2)}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          d3.select(".tooltip-connected").style("opacity", 0);
        });
    });

    g.append("line")
      .attr("x1", x(73))
      .attr("x2", x(73))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "orange")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4");

    g.append("text")
      .attr("x", x(73) + 5)
      .attr("y", 20)
      .text("1973 Oil Crisis")
      .style("fill", "orange")
      .style("font-size", "12px");

    // Legend
    const legend = g
      .append("g")
      .attr("transform", `translate(${innerWidth - 60}, -10)`);

    Object.entries(originColor).forEach(([origin, color], i) => {
      const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color);

      legendRow
        .append("text")
        .attr("x", 18)
        .attr("y", 10)
        .text(origin)
        .style("fill", "white")
        .style("font-size", "12px");
    });
  }, [filteredData, connectedMetric]);

  const years = Array.from(
    new Set(filteredData.map((d) => d["Model Year"]))
  ).sort();
  const avgMpgPerYear = years.map((year) => {
    const values = filteredData.filter((d) => d["Model Year"] === year);
    return {
      year,
      mpg: d3.mean(values, (d) => d.MPG),
      cylinders: d3.mean(values, (d) => d.Cylinders),
      acceleration: d3.mean(values, (d) => d.Acceleration),
    };
  });

  const xScale = d3.scaleLinear().domain([1970, 1982]).range([0, innerWidth]);

  const yScale = d3.scaleLinear().domain([0, 50]).range([innerHeight, 0]);

  // Heatmap
  const groupedData = d3.rollup(
    data,
    (v) => d3.mean(v, (d) => d.MPG),
    (d) => d["Model Year"],
    (d) => d.Origin
  );

  const heatmapMatrix = [];
  years.forEach((year) => {
    allOrigins.forEach((origin) => {
      if (selectedOrigin === "All" || selectedOrigin === origin) {
        heatmapMatrix.push({
          year,
          origin,
          mpg: groupedData.get(year)?.get(origin) ?? 0,
        });
      }
    });
  });

  const colorScale = d3
    .scaleSequential()
    .domain(d3.extent(heatmapMatrix, (d) => d.mpg))
    .interpolator(d3.interpolatePlasma);

  return (
    <div className="bg-[#121212] text-white min-h-screen px-16 py-10 font-poppins">
      <header className="text-center mb-7">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 py-4 px-8 rounded-lg shadow-xl font-poppins text-transparent bg-clip-text">
          Integrated Dashboard of Car Dataset Visualizations Powered by D3.js
        </h2>
      </header>

      <div className="flex justify-between items-center min-h-[50px] mb-8">
        {/* Left: Hamburger */}
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 bg-[#222] border border-gray-700 rounded-md hover:bg-[#333] transition"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute top-12 left-0 bg-[#1f1f1f] border border-gray-700 rounded-md shadow-md w-48 z-50">
                <ul className="flex flex-col text-sm text-white">
                  <li>
                    <Link
                      to="/"
                      className="block px-4 py-2 hover:text-cyan-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/histogram"
                      className="block px-4 py-2 hover:text-cyan-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      Histogram
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/connected-scatter"
                      className="block px-4 py-2 hover:bg-[#333]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Scatter Plot
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/heatmap"
                      className="block px-4 py-2 hover:text-cyan-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      Heatmap
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/bubble-chart"
                      className="block px-4 py-2 hover:text-cyan-400"
                    >
                      Bubble chart
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* Right: Filters */}
        <div className="flex items-center gap-4">
          <label className="mr-2 font-medium">Filter by Origin:</label>
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="px-4 py-2 bg-[#1f1f1f] border border-gray-600 rounded"
          >
            <option value="All">All Origins</option>
            {allOrigins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Bubble Chart */}
        <div className="bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700 w-full">
          <h2 className="text-2xl font-bold text-white mb-6">
            Bubble Chart (MPG vs Acceleration with Horsepower & Origin)
          </h2>
          <svg width={640} height={420}>
            <g transform="translate(60, 40)">
              {(() => {
                const chartWidth = 520;
                const chartHeight = 320;

                const [zoomDomain, setZoomDomain] = useState(null);

                const fullXScale = d3
                  .scaleLinear()
                  .domain([0, 250])
                  .range([0, chartWidth]);
                const fullYScale = d3
                  .scaleLinear()
                  .domain([0, 24])
                  .range([chartHeight, 0]);

                const xScale = zoomDomain
                  ? d3.scaleLinear().domain(zoomDomain.x).range([0, chartWidth])
                  : fullXScale;

                const yScale = zoomDomain
                  ? d3
                      .scaleLinear()
                      .domain(zoomDomain.y)
                      .range([chartHeight, 0])
                  : fullYScale;

                const rScale = d3
                  .scaleSqrt()
                  .domain([0, d3.max(filteredData, (d) => d.MPG)])
                  .range([3, 15]);

                const originColor = {
                  American: "#00eaff",
                  European: "#ff5e57",
                  Japanese: "#84e35a",
                };

                const brushRef = React.useRef();
                React.useEffect(() => {
                  const brush = d3
                    .brush()
                    .extent([
                      [0, 0],
                      [chartWidth, chartHeight],
                    ])
                    .on("end", (event) => {
                      if (!event.selection) return setZoomDomain(null);
                      const [[x0, y0], [x1, y1]] = event.selection;
                      setZoomDomain({
                        x: [xScale.invert(x0), xScale.invert(x1)],
                        y: [yScale.invert(y1), yScale.invert(y0)],
                      });
                    });

                  d3.select(brushRef.current).call(brush);
                }, [xScale, yScale]);

                return (
                  <>
                    {/* Bubbles */}
                    {filteredData.map((d, i) => (
                      <circle
                        key={i}
                        cx={xScale(d.Horsepower)}
                        cy={yScale(d.Acceleration)}
                        r={rScale(d.MPG)}
                        fill={originColor[d.Origin]}
                        opacity={0.8}
                      />
                    ))}

                    {/* X Axis */}
                    <g transform={`translate(0, ${chartHeight})`}>
                      <line x1={0} x2={chartWidth} stroke="#ccc" />
                      {d3.range(0, 260, 20).map((tick, i) => (
                        <g key={i} transform={`translate(${xScale(tick)}, 0)`}>
                          <line y2={6} stroke="#ccc" />
                          <text
                            y={20}
                            textAnchor="middle"
                            fill="#ccc"
                            fontSize={12}
                          >
                            {tick}
                          </text>
                        </g>
                      ))}
                      <text
                        x={chartWidth / 2}
                        y={40}
                        textAnchor="middle"
                        fill="white"
                        fontSize={14}
                      >
                        Horsepower
                      </text>
                    </g>

                    {/* Y Axis */}
                    <g>
                      <line y1={0} y2={chartHeight} stroke="#ccc" />
                      {d3.range(0, 26, 2).map((tick, i) => (
                        <g key={i} transform={`translate(0, ${yScale(tick)})`}>
                          <line x2={-6} stroke="#ccc" />
                          <text
                            x={-10}
                            y={5}
                            textAnchor="end"
                            fill="#ccc"
                            fontSize={12}
                          >
                            {tick}
                          </text>
                        </g>
                      ))}
                      <text
                        transform={`rotate(-90)`}
                        x={-chartHeight / 2}
                        y={-45}
                        textAnchor="middle"
                        fill="white"
                        fontSize={14}
                      >
                        Acceleration
                      </text>
                    </g>

                    {/* Legend */}
                    <g transform={`translate(${chartWidth - 45}, 0)`}>
                      {Object.entries(originColor).map(([origin, color], i) => {
                        const count = filteredData.filter(
                          (d) => d.Origin === origin
                        ).length;
                        return (
                          <g key={origin} transform={`translate(0, ${i * 24})`}>
                            <circle r={6} fill={color} />
                            <text x={12} y={5} fill="white" fontSize={12}>
                              {origin} ({count})
                            </text>
                          </g>
                        );
                      })}
                    </g>

                    {/* Brush */}
                    <g ref={brushRef} />
                  </>
                );
              })()}
            </g>
          </svg>
        </div>

        {/* Histogram Title + Bin Count Filter in One Row */}
        {/* Histogram SVG */}
        <div className="bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700 w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">
              Histogram: Frequency of Engine Cylinders
            </h3>
            <div className="flex items-center gap-2">
              <label htmlFor="bins" className="text-sm text-gray-300">
                Number of Bins:
              </label>
              <input
                id="bins"
                type="number"
                min="1"
                max="20"
                value={histogramBinCount}
                onChange={(e) => setHistogramBinCount(+e.target.value)}
                className="w-16 px-2 py-1 bg-[#222] border border-gray-600 text-white rounded-md"
              />
            </div>
          </div>
          <svg
            ref={histogramSvgRef}
            viewBox="0 0 800 500"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto"
          ></svg>
        </div>

        {/* Connected Scatter Plot */}
        <div className="bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700  mt-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Connected Scatter Plot: {connectedMetric} by Year
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="metric" className="text-sm text-gray-300">
                Select Metric:
              </label>
              <select
                id="metric"
                value={connectedMetric}
                onChange={(e) => setConnectedMetric(e.target.value)}
                className="px-3 py-1 bg-[#222] border border-gray-600 text-white rounded"
              >
                <option value="MPG">MPG</option>
                <option value="Cylinders">Cylinders</option>
                <option value="Acceleration">Acceleration</option>
              </select>
            </div>
          </div>
          <svg ref={connectedScatterRef} width={500} height={500}></svg>
          <div className="tooltip-connected"></div>
        </div>

        {/* Heatmap stays as-is, already labeled nicely */}
        {/* Heatmap Styled as Standalone Version */}
        <div className="w-full flex flex-col bg-[#1f1f1f] p-6 rounded-xl shadow-lg border border-gray-700 relative overflow-x-auto justify-center items-center">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Heatmap: MPG by Model Year & Origin
          </h2>
          <svg width={600} height={years.length * 25 + 80}>
            {heatmapMatrix.map((d, i) => {
              if (selectedOrigin !== "All" && d.origin !== selectedOrigin)
                return null;
              const x = allOrigins.indexOf(d.origin) * 100 + 100;
              const y = years.indexOf(d.year) * 25 + 20;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={90}
                  height={20}
                  rx={6}
                  ry={6}
                  fill={colorScale(d.mpg)}
                  onMouseEnter={(e) => {
                    const tooltip = document.getElementById("heatmap-tooltip");
                    tooltip.style.opacity = 1;
                    tooltip.innerHTML = `<strong>${d.origin}</strong> – ${
                      d.year
                    }<br/>MPG: ${d.mpg.toFixed(2)}`;
                    tooltip.style.left = e.clientX + 10 + "px";
                    tooltip.style.top = e.clientY + "px";
                  }}
                  onMouseLeave={() => {
                    const tooltip = document.getElementById("heatmap-tooltip");
                    tooltip.style.opacity = 0;
                  }}
                />
              );
            })}

            {/* Axis Labels */}
            {allOrigins.map((origin, i) => (
              <text
                key={origin}
                x={i * 100 + 145}
                y={years.length * 25 + 40}
                fontSize={13}
                fill="#eee"
                textAnchor="middle"
              >
                {origin}
              </text>
            ))}
            {years.map((year, i) => (
              <text
                key={year}
                x={70}
                y={i * 25 + 35}
                fontSize={11}
                fill="#ccc"
                textAnchor="end"
              >
                {year}
              </text>
            ))}

            {/* Axis Titles */}
            <text
              fill="#ccc"
              x={220}
              y={years.length * 25 + 65}
              textAnchor="middle"
              fontSize={14}
              fontWeight="bold"
            >
              Car Origin
            </text>
            <text
              fill="#ccc"
              transform="rotate(-90)"
              x={-((years.length * 25) / 2 + 20)}
              y={30}
              textAnchor="middle"
              fontSize={14}
              fontWeight="bold"
            >
              Model Year
            </text>
          </svg>

          {/* Legend */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <span className="text-sm text-gray-400">Low MPG</span>
            <div className="w-40 h-4 bg-gradient-to-r from-purple-900 to-yellow-300 rounded" />
            <span className="text-sm text-gray-400">High MPG</span>
          </div>

          {/* Tooltip */}
          <div
            id="heatmap-tooltip"
            className="absolute text-xs bg-white text-black p-2 rounded pointer-events-none"
            style={{ opacity: 0, position: "fixed", zIndex: 1000 }}
          />
        </div>
      </div>
    </div>
  );
};

export default AllVisuals;
