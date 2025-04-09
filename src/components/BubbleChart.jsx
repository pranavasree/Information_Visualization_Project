import React, { useContext, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DataContext } from "../data/DataContext";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";

const BubbleChart = () => {
  const { data } = useContext(DataContext);
  const ref = useRef();
  const chartRef = useRef();
  const tooltipRef = useRef();
  const xAxisGroupRef = useRef();
  const yAxisGroupRef = useRef();
  const updatePointsRef = useRef();
  const brushRef = useRef();

  const [selectedOrigin, setSelectedOrigin] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  const width = 600;
  const height = 500;
  const margin = { top: 40, right: 40, bottom: 50, left: 60 };

  const originalXRef = useRef(null);
  const originalYRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const filteredData =
      selectedOrigin === "All"
        ? data
        : data.filter((d) => d.Origin === selectedOrigin);

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    svg.style("background", "#1a1a1a");

    const tooltip = d3.select(tooltipRef.current);

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    const chartArea = svg.append("g").attr("class", "chart-area");

    let x = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d.Horsepower))
      .range([margin.left, width - margin.right])
      .nice();

    let y = d3
      .scaleLinear()
      .domain(d3.extent(filteredData, (d) => d.Acceleration))
      .range([height - margin.bottom, margin.top])
      .nice();

    if (!originalXRef.current || !originalYRef.current) {
      originalXRef.current = x.copy();
      originalYRef.current = y.copy();
    }

    const radius = d3
      .scaleSqrt()
      .domain(d3.extent(data, (d) => d.MPG))
      .range([6, 24]);

    const color = d3
      .scaleOrdinal()
      .domain(["American", "European", "Japanese"])
      .range(["#00bcd4", "#ff7043", "#66bb6a"]);

    const xAxisGroup = chartArea
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x));
    xAxisGroupRef.current = xAxisGroup;

    const yAxisGroup = chartArea
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .attr("class", "y-axis")
      .call(d3.axisLeft(y));
    yAxisGroupRef.current = yAxisGroup;

    chartArea
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Horsepower")
      .attr("fill", "#eee");

    chartArea
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text("Acceleration")
      .attr("fill", "#eee");

    const pointsGroup = chartArea
      .append("g")
      .attr("class", "points")
      .attr("clip-path", "url(#clip)");

    const updatePoints = (xScale, yScale) => {
      const circles = pointsGroup
        .selectAll("circle")
        .data(filteredData, (d) => d.Name);

      circles.exit().transition().duration(500).attr("r", 0).remove();

      circles
        .enter()
        .append("circle")
        .merge(circles)
        .transition()
        .duration(750)
        .attr("cx", (d) => xScale(d.Horsepower))
        .attr("cy", (d) => yScale(d.Acceleration))
        .attr("r", (d) => radius(d.MPG))
        .attr("fill", (d) => color(d.Origin))
        .attr("opacity", 0.85);
    };

    updatePoints(x, y);
    updatePointsRef.current = updatePoints;

    pointsGroup
      .selectAll("circle")
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1).html(
          `<strong>${d.Name}</strong><br/>
           Horsepower: ${d.Horsepower}<br/>
           Acceleration: ${d.Acceleration}<br/>
           MPG: ${d.MPG}`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    const brush = d3
      .brush()
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on("end", (event) => {
        if (!event.selection) return;

        const [[x0, y0], [x1, y1]] = event.selection;

        const newX = d3
          .scaleLinear()
          .domain([x.invert(x0), x.invert(x1)])
          .range([margin.left, width - margin.right]);

        const newY = d3
          .scaleLinear()
          .domain([y.invert(y1), y.invert(y0)])
          .range([height - margin.bottom, margin.top]);

        xAxisGroup.transition().duration(750).call(d3.axisBottom(newX));
        yAxisGroup.transition().duration(750).call(d3.axisLeft(newY));
        updatePoints(newX, newY);

        svg.select(".brush").call(brush.move, null);
        x = newX;
        y = newY;
      });

    chartArea.append("g").attr("class", "brush").call(brush);
    brushRef.current = brush;

    const definedOrigins = ["American", "European", "Japanese"];
    const originCounts = definedOrigins.reduce((acc, origin) => {
      acc[origin] = filteredData.filter((d) => d.Origin === origin).length;
      return acc;
    }, {});

    chartArea.selectAll(".legend").remove();
    chartArea.selectAll(".legend-text").remove();

    chartArea
      .selectAll(".legend")
      .data(definedOrigins)
      .enter()
      .append("circle")
      .attr("class", "legend")
      .attr("cx", width - 100)
      .attr("cy", (d, i) => margin.top + i * 25)
      .attr("r", 8)
      .attr("fill", color);

    chartArea
      .selectAll(".legend-text")
      .data(definedOrigins)
      .enter()
      .append("text")
      .attr("class", "legend-text")
      .attr("x", width - 85)
      .attr("y", (d, i) => margin.top + i * 25 + 4)
      .text((d) => `${d} (${originCounts[d]})`)
      .style("fill", "#eee")
      .style("font-size", "12px");
  }, [data, selectedOrigin]);

  // const handleResetZoom = () => {
  //   if (
  //     originalXRef.current &&
  //     originalYRef.current &&
  //     xAxisGroupRef.current &&
  //     yAxisGroupRef.current &&
  //     updatePointsRef.current &&
  //     brushRef.current
  //   ) {
  //     const xScale = originalXRef.current.copy();
  //     const yScale = originalYRef.current.copy();

  //     d3.select(xAxisGroupRef.current)
  //       .transition()
  //       .duration(750)
  //       .call(d3.axisBottom(xScale));

  //     d3.select(yAxisGroupRef.current)
  //       .transition()
  //       .duration(750)
  //       .call(d3.axisLeft(yScale));

  //     updatePointsRef.current(xScale, yScale);

  //     d3.select(".brush").call(brushRef.current.move, null);
  //   }
  // };

  const handleExport = async () => {
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "bubble_chart_export.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white px-16 py-10 relative">
      <header className="text-center mb-7">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 py-4 px-8 rounded-lg shadow-xl font-poppins text-transparent bg-clip-text">
          D3: An interactive Bubble Chart (MPG vs Acceleration with Horsepower &
          Origin)
        </h2>
        <p className="text-gray-300 text-lg mt-2">
          Bubble size represents MPG | Color represents Origin
        </p>
      </header>

      {/* Filter + Navigation Row */}
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
                      Connected Scatter Plot
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

        {/* Right: Filters + Export */}
        <div className="flex items-center gap-6">
          <label htmlFor="origin" className="text-gray-300 text-sm">
            Filter by Origin:
          </label>
          <select
            className="px-4 py-2 bg-[#222] border border-gray-600 text-white rounded-md shadow-md"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            <option value="All">All Origins</option>
            <option value="American">American</option>
            <option value="European">European</option>
            <option value="Japanese">Japanese</option>
          </select>

          {/* Uncomment to use Reset Zoom */}
          {/* <button
      onClick={handleResetZoom}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200 hover:scale-105"
    >
      Reset Zoom
    </button> */}

          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-200 hover:scale-105"
          >
            Export as Image
          </button>
        </div>
      </div>

      <div className="flex gap-16 items-start justify-center">
        <div className="w-[40%] max-w-full mt-2">
          <div ref={chartRef} className="flex flex-col items-start relative">
            <div className="bg-gradient-to-br from-[#1f1f1f] to-[#121212] p-6 rounded-xl shadow-2xl border border-gray-700 relative">
              <svg ref={ref} width={width} height={height}></svg>
              <div
                ref={tooltipRef}
                className="absolute bg-black text-white text-sm px-3 py-2 rounded shadow-lg pointer-events-none z-50"
                style={{ opacity: 0 }}
              ></div>
            </div>
          </div>
        </div>

        <div className="w-[60%] max-w-full mt-4">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-semibold text-green-400 mb-4">
              What Does This Chart Show?
            </h3>
            <p className="text-gray-200 text-base leading-relaxed">
              This bubble chart provides an interactive visualization of how a
              car’s <strong>Horsepower</strong> relates to its{" "}
              <strong>Acceleration</strong>. <br />
              <br />- The <strong>X-axis</strong> shows{" "}
              <strong>Horsepower</strong>: higher values mean the engine is more
              powerful. <br />- The <strong>Y-axis</strong> shows{" "}
              <strong>Acceleration</strong>: lower values indicate the car
              accelerates faster. <br />- Each <strong>circle (bubble)</strong>{" "}
              represents a specific car from the dataset. <br />- The{" "}
              <strong>size</strong> of the bubble reflects the car’s{" "}
              <strong>fuel efficiency (MPG)</strong>: larger bubbles are more
              fuel-efficient. <br />- The <strong>color</strong> of the bubble
              indicates the car’s origin:{" "}
              <span className="text-blue-400">American</span>,{" "}
              <span className="text-orange-400">European</span>, or{" "}
              <span className="text-green-400">Japanese</span>. <br />
              <br />
              Using this chart, you can visually compare cars from different
              regions based on performance and efficiency. For example, you
              might notice that Japanese cars tend to have lower horsepower but
              higher MPG, while American cars often have higher horsepower but
              lower MPG. Brushing over the chart allows you to zoom in and
              explore specific groups.
              <br />
              <br />
              This visualization helps uncover performance trends across
              manufacturers and explore trade-offs between speed, power, and
              efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BubbleChart;
