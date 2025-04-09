import React, { useContext, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DataContext } from "../data/DataContext";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";

const Histogram = () => {
  const { data } = useContext(DataContext);
  const svgRef = useRef();
  const chartRef = useRef();
  const [selectedOrigin, setSelectedOrigin] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [binCount, setBinCount] = useState(5);

  const width = 800;
  const height = 500;
  const margin = { top: 60, right: 30, bottom: 60, left: 60 };

  const origins = [...new Set(data.map((d) => d.Origin))];

  const handleExport = async () => {
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = "histogram_export.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    const filteredData =
      selectedOrigin === "All"
        ? data
        : data.filter((d) => d.Origin === selectedOrigin);

    const cylinders = filteredData.map((d) => +d.Cylinders);
    const bins = d3.bin().thresholds(binCount)(cylinders);

    const svg = d3.select(svgRef.current);
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

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Histogram: Frequency of Engine Cylinders");
  }, [data, selectedOrigin, binCount]);

  return (
    <div className="min-h-screen bg-[#121212] text-white px-8 md:px-16 py-10">
      {/* Header */}
      <header className="text-center mb-10">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 py-2 px-8 rounded-lg shadow-xl font-poppins text-transparent bg-clip-text">
          D3: Histogram of Engine Cylinders by Car Origin
        </h2>
        <p className="text-gray-300 mt-3">
          Analyze how often different engine types appear in the dataset
        </p>
      </header>

      {/* Controls Row */}
      <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
        {/* Hamburger Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col justify-center items-center w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            <span className="w-5 h-0.5 bg-white mb-1"></span>
            <span className="w-5 h-0.5 bg-white mb-1"></span>
            <span className="w-5 h-0.5 bg-white"></span>
          </button>

          {menuOpen && (
            <div className="absolute top-12 left-0 bg-[#1f1f1f] border border-gray-700 rounded-md shadow-md w-48 z-50">
              <ul className="flex flex-col  text-sm text-white">
                <li>
                  <Link to="/" className="block px-4 py-2 hover:text-cyan-400">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/bubble-chart"
                    className="block py-2 px-4 hover:text-cyan-400"
                  >
                    Bubble Chart
                  </Link>
                </li>
                <li>
                  <Link
                    to="/connected-scatter"
                    className="block py-2 px-4 hover:text-cyan-400"
                  >
                    Connected Scatter Plot
                  </Link>
                </li>
                <li>
                  <Link
                    to="/heatmap"
                    className="block py-2 px-4 hover:text-cyan-400"
                  >
                    Heatmap
                  </Link>
                </li>
                <li>
                  <Link
                    to="/all-visuals"
                    className="block py-2 px-4 hover:text-cyan-400"
                  >
                    All Visuals
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Filter, Bins, and Export */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="bins" className="text-sm">
              Select No. Of Bins:
            </label>
            <input
              id="bins"
              type="number"
              min="1"
              max="20"
              value={binCount}
              onChange={(e) => setBinCount(+e.target.value)}
              className="w-16 px-2 py-1 bg-[#222] border border-gray-600 text-white rounded-md"
            />
          </div>

          <button
            onClick={handleExport}
            className="px-5 py-2 bg-gradient-to-r bg-green-700 hover:bg-green-900 text-white font-semibold rounded-md"
          >
            Export as Image
          </button>
        </div>
      </div>

      {/* Chart + Explanation Row */}
      <div className="flex flex-row flex-wrap md:flex-nowrap justify-center items-start gap-12">
        {/* Chart Styled Container */}
        <div className="w-full md:w-[40%] min-w-[300px] mt-14">
          <div
            ref={chartRef}
            className="bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700"
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto"
            ></svg>
          </div>
        </div>

        {/* Explanation 60% */}
        <div className="w-[60%] bg-[#1b1b1b] p-6 rounded-md shadow-md border border-gray-700">
          <h3 className="text-2xl font-semibold text-green-400 mb-4">
            What Does This Histogram Show?
          </h3>
          <p className="text-base text-gray-300 leading-7">
            The histogram you see represents the{" "}
            <strong>frequency of different engine types</strong>
            (based on the number of cylinders) in a dataset of cars.
            <ul className="list-disc ml-6 mt-3 text-gray-400">
              <li>
                The <strong>X-axis</strong> shows how many cylinders a car
                engine has. Common values include 3, 4, 5, 6, and 8.
              </li>
              <li>
                The <strong>Y-axis</strong> shows how many cars in the dataset
                have that cylinder count.
              </li>
              <li>
                Each <strong>bar</strong> tells us how common a specific engine
                type is.
              </li>
            </ul>
            <strong>Key Insight from the Data:</strong>
            <ul className="list-disc ml-6 mt-2 text-gray-400">
              <li>
                <strong>4-cylinder engines</strong> are the most common. These
                are typically found in smaller, more fuel-efficient cars.
              </li>
              <li>
                <strong>6 and 8-cylinder engines</strong> appear less frequently
                and are usually in powerful or performance-oriented cars.
              </li>
              <li>
                Using the <strong>Origin Filter</strong>, you can see how
                preferences vary:
                <ul className="list-disc ml-6 mt-1">
                  <li>
                    <span className="text-cyan-400">Japanese</span> cars often
                    have 4 cylinders (efficiency focus).
                  </li>
                  <li>
                    <span className="text-cyan-400">American</span> cars have
                    more 6 or 8 cylinders (power preference).
                  </li>
                  <li>
                    <span className="text-cyan-400">European</span> cars have a
                    balanced distribution.
                  </li>
                </ul>
              </li>
            </ul>
            Understanding engine type distribution helps us see how different
            regions prioritize performance, fuel economy, or design philosophy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Histogram;
