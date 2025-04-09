import React, { useContext, useState, useRef } from "react";
import { DataContext } from "../data/DataContext";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
// import { FiMenu } from "react-icons/fi";

const Heatmap = () => {
  const { data } = useContext(DataContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState("All");
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    value: null,
  });
  const containerRef = useRef();
  const svgRef = useRef();
  const graphRef = useRef(); // NEW REF for just the graph portion

  const years = Array.from(new Set(data.map((d) => d["Model Year"]))).sort();
  const origins = ["American", "European", "Japanese"];

  const groupedData = d3.rollup(
    selectedOrigin === "All"
      ? data
      : data.filter((d) => d.Origin === selectedOrigin),
    (v) => d3.mean(v, (d) => d.MPG),
    (d) => d["Model Year"],
    (d) => d.Origin
  );

  const mpgMatrix = [];
  years.forEach((year) => {
    origins.forEach((origin) => {
      const mpg = groupedData.get(year)?.get(origin) ?? 0;
      mpgMatrix.push({ year, origin, mpg });
    });
  });

  const colorScale = d3
    .scaleSequential()
    .domain(d3.extent(mpgMatrix, (d) => d.mpg))
    .interpolator(d3.interpolatePlasma);

  const showTooltip = (e, value) => {
    const bounds = svgRef.current.getBoundingClientRect();
    setTooltip({
      show: true,
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top - 20,
      value,
    });
  };

  const hideTooltip = () =>
    setTooltip({ show: false, x: 0, y: 0, value: null });

  const handleExport = () => {
    if (graphRef.current) {
      html2canvas(graphRef.current).then((canvas) => {
        const link = document.createElement("a");
        link.download = "heatmap.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans px-16 py-10">
      <header className="text-center mb-7">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 py-4 px-8 rounded-lg shadow-xl font-poppins text-transparent bg-clip-text">
          Heatmap: MPG by Model Year & Origin
        </h2>
        <p className="text-gray-300 text-lg mt-2">
          Heatmap Displays the Average MPG for cars grouped by their Model Year
          and Origin
        </p>
      </header>
      {/* Controls */}
      <div className="flex justify-between items-center gap-4 mb-6">
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
                      Connected Scatter Plot
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/bubble-chart"
                      className="block px-4 py-2 hover:text-cyan-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      Bubble Chart
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/all-visuals"
                      className="block px-4 py-2 hover:text-cyan-400"
                    >
                      All Visuals
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label htmlFor="origin" className="text-sm">
            Filter by Origin:
          </label>
          <select
            id="origin"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="px-3 py-1.5 bg-[#222] border border-gray-600 text-white rounded-md"
          >
            <option value="All">All Origins</option>
            {origins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="px-5 py-2 bg-green-700 hover:bg-green-900 text-white font-semibold rounded-md"
          >
            Export as Image
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="flex flex-col md:flex-row gap-12" ref={containerRef}>
        {/* Heatmap Graph - 40% */}
        <div
          ref={graphRef}
          className="w-full md:w-2/5 bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700 relative"
        >
          <svg ref={svgRef} width={550} height={years.length * 25 + 80}>
            {/* Heatmap Rectangles */}
            {mpgMatrix.map((d, i) => {
              if (selectedOrigin !== "All" && d.origin !== selectedOrigin)
                return null;
              const x = origins.indexOf(d.origin) * 100 + 100;
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
                  onMouseEnter={(e) => showTooltip(e, d)}
                  onMouseLeave={hideTooltip}
                />
              );
            })}

            {/* Axis Labels */}
            {origins.map((origin, i) => (
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

          {/* Tooltip */}
          {tooltip.show && (
            <div
              className="absolute bg-black text-white text-sm px-2 py-1 rounded-md border border-gray-500 pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div>
                <strong>{tooltip.value.origin}</strong> – {tooltip.value.year}
              </div>
              <div>MPG: {tooltip.value.mpg.toFixed(2)}</div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex justify-center items-center gap-2">
            <span className="text-sm text-gray-400">Low MPG</span>
            <div className="w-40 h-4 bg-gradient-to-r from-purple-900 to-yellow-300 rounded" />
            <span className="text-sm text-gray-400">High MPG</span>
          </div>
        </div>

        {/* Explanation Section - 60% */}
        <div className="w-full md:w-3/5 bg-[#1b1b1b] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-3xl font-bold text-green-400 mb-6">
            Understanding the Heatmap
          </h3>

          <p className="text-gray-300 text-base leading-7 mb-5">
            This heatmap displays the{" "}
            <span className="text-white font-medium">
              average MPG (Miles Per Gallon)
            </span>
            for cars grouped by their{" "}
            <span className="text-white font-medium">model year</span> and
            <span className="text-white font-medium"> origin</span> (American,
            European, or Japanese). Each rectangle represents a unique
            combination of these two variables.
          </p>

          <ul className="list-disc pl-6 space-y-3 text-base text-gray-400 mb-5">
            <li>
              The <span className="text-white font-medium">x-axis</span> shows
              the <span className="text-white font-medium">car origin</span>.
            </li>
            <li>
              The <span className="text-white font-medium">y-axis</span> lists{" "}
              <span className="text-white font-medium">model years</span> from
              1970 to 1982.
            </li>
            <li>
              The{" "}
              <span className="text-white font-medium">color of each cell</span>{" "}
              indicates fuel efficiency —
              <span className="text-green-400"> lighter</span> colors mean{" "}
              <span className="text-green-400">higher MPG</span>, and
              <span className="text-purple-300"> darker</span> shades mean{" "}
              <span className="text-purple-300">lower MPG</span>.
            </li>
            <li>
              Use the{" "}
              <span className="text-white font-medium">Origin filter</span>{" "}
              above to isolate trends for a specific region.
            </li>
            <li>
              <span className="text-white font-medium">Hover over a cell</span>{" "}
              to see the exact MPG value for that year and origin.
            </li>
          </ul>

          <p className="text-gray-300 text-base leading-7">
            The heatmap helps reveal long-term patterns. For example,
            <span className="text-white font-medium">
              {" "}
              Japanese cars consistently exhibit higher MPG
            </span>{" "}
            compared to others. After the 1973 oil crisis,{" "}
            <span className="text-white font-medium">
              American cars show noticeable improvements
            </span>{" "}
            in fuel efficiency. These shifts highlight how each region adapted
            to energy challenges and market demands over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
