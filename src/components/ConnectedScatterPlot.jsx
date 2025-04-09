import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";

const ConnectedScatterPlot = () => {
  const svgRef = useRef();
  const chartContainerRef = useRef();
  const [data, setData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("MPG");
  const [selectedOrigin, setSelectedOrigin] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    d3.csv("/a1-cars.csv").then((rawData) => {
      const parsed = rawData
        .map((d) => ({
          Model_Year: +d["Model Year"],
          MPG: +d.MPG,
          Cylinders: +d.Cylinders,
          Acceleration: +d.Acceleration,
          Origin: d.Origin,
        }))
        .filter(
          (d) =>
            !isNaN(d.Model_Year) &&
            !isNaN(d.MPG) &&
            !isNaN(d.Cylinders) &&
            !isNaN(d.Acceleration)
        );
      setData(parsed);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const filteredData =
      selectedOrigin === "All"
        ? data
        : data.filter((d) => d.Origin === selectedOrigin);

    const width = 600;
    const height = 400;
    const margin = { top: 60, right: 60, bottom: 60, left: 80 };

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const x = d3
      .scaleLinear()
      .domain([70, 82])
      .range([margin.left, width - margin.right]);

    // ✅ UPDATED Y-axis scaling to avoid overflow
    const metricValues = filteredData.map((d) => d[selectedMetric]);
    const yMin = d3.min(metricValues) ?? 0;
    const yMax = d3.max(metricValues) ?? 50;

    const y = d3
      .scaleLinear()
      .domain([Math.floor(yMin * 0.95), Math.ceil(yMax * 1.05)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal(d3.schemeTableau10);
    const grouped = d3.group(filteredData, (d) => d.Origin);

    for (let [origin, values] of grouped) {
      values.sort((a, b) => a.Model_Year - b.Model_Year);

      const line = d3
        .line()
        .x((d) => x(d.Model_Year))
        .y((d) => y(d[selectedMetric]));

      svg
        .append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(origin))
        .attr("stroke-width", 2.5)
        .attr("d", line);

      svg
        .selectAll(`.dot-${origin}`)
        .data(values)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.Model_Year))
        .attr("cy", (d) => y(d[selectedMetric]))
        .attr("r", 4)
        .attr("fill", color(origin))
        .attr("stroke", "white");
    }

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("fill", "white");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "white");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text("Model Year");

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(selectedMetric);

    const legendOrigins = ["America", "Europe", "Japan"];
    const legendSpacing = 100;

    const legendGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${
          width - margin.right - legendOrigins.length * legendSpacing
        }, ${margin.top - 30})`
      );

    legendOrigins.forEach((origin, i) => {
      const legendItem = legendGroup
        .append("g")
        .attr("transform", `translate(${i * legendSpacing}, 0)`);

      legendItem
        .append("circle")
        .attr("r", 6)
        .attr("cx", 6)
        .attr("cy", 6)
        .attr("fill", color(origin))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5);

      legendItem
        .append("text")
        .attr("x", 16)
        .attr("y", 10)
        .style("fill", "white")
        .style("font-size", "12px")
        .text(origin);
    });

    const oilCrisisYear = 73;

    svg
      .append("line")
      .attr("x1", x(oilCrisisYear))
      .attr("x2", x(oilCrisisYear))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "orange")
      .attr("stroke-dasharray", "4")
      .attr("stroke-width", 2);

    svg
      .append("text")
      .attr("x", x(oilCrisisYear) + 5)
      .attr("y", margin.top + 15)
      .attr("fill", "orange")
      .style("font-size", "12px")
      .text("1973 Oil Crisis");

    if (selectedMetric === "MPG") {
      svg
        .append("text")
        .attr("x", x(75))
        .attr("y", y(32))
        .attr("fill", "lightgreen")
        .style("font-size", "12px")
        .text("MPG rises post-1973 due to fuel efficiency push");
    }
  }, [data, selectedMetric, selectedOrigin]);

  const origins = ["All", ...Array.from(new Set(data.map((d) => d.Origin)))];

  const exportChart = () => {
    html2canvas(chartContainerRef.current).then((canvas) => {
      const link = document.createElement("a");
      link.download = "connected_scatter_plot.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-16 py-10 font-sans">
      <header className="text-center mb-7">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 py-4 px-8 rounded-lg shadow-xl font-poppins text-transparent bg-clip-text">
          D3: Connected Scatter Plot of Cars Over the Years
        </h2>
        <p className="text-gray-300 text-lg mt-2">
          Viusalization of Time Series Certain Characteristics Over The Years
        </p>
      </header>

      {/* Controls Row */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
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
                  <Link to="/" className="block py-2 px-4 hover:text-cyan-400">
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
                    to="/histogram"
                    className="block py-2 px-4 hover:text-cyan-400"
                  >
                    Histogram
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
        {/* Filters and Export */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <label htmlFor="metric" className="text-sm">
              Select Metric:
            </label>
            <select
              id="metric"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1.5 bg-[#222] border border-gray-600 text-white rounded-md"
            >
              <option value="MPG">MPG</option>
              <option value="Cylinders">Cylinders</option>
              <option value="Acceleration">Acceleration</option>
            </select>
          </div>

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
              {origins.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={exportChart}
            className="px-5 py-2 bg-green-700 hover:bg-green-900 text-white font-semibold rounded-md"
          >
            Export as Image
          </button>
        </div>
      </div>

      <div className="flex flex-row flex-wrap md:flex-nowrap justify-center items-start gap-12">
        <div className="w-full md:w-[40%] min-w-[300px] mt-14">
          <div
            ref={chartContainerRef}
            className="bg-[#1e1e1e] p-5 rounded-xl shadow-lg border border-gray-700"
          >
            <svg
              ref={svgRef}
              viewBox="0 0 600 400"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-auto"
            />
          </div>
        </div>

        <div className="w-full md:w-[60%] bg-[#1b1b1b] p-6 rounded-md shadow-md border border-gray-700">
          <h3 className="text-2xl font-semibold text-teal-400 mb-4">
            What is This Chart Visualizing?
          </h3>
          <p className="text-base text-gray-300 leading-7">
            This Connected Scatter Plot is a time series visualization that
            shows how certain characteristics of cars have changed over the
            years, using data from the{" "}
            <code className="text-white">a1-cars.csv</code> dataset.
          </p>

          <ul className="list-disc ml-6 mt-4 text-gray-400 space-y-2">
            <li>
              <strong>X-Axis:</strong> Represents the <em>Model Year</em> of the
              cars (1970 to 1982).
            </li>
            <li>
              <strong>Y-Axis:</strong> Represents a selected metric, which could
              be:
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>
                  <strong>MPG</strong> – fuel efficiency (Miles per Gallon)
                </li>
                <li>
                  <strong>Cylinders</strong> – number of engine cylinders
                </li>
                <li>
                  <strong>Acceleration</strong> – time to reach a certain speed
                </li>
              </ul>
            </li>
            <li>
              <strong>Lines and Dots:</strong> Each line connects data points
              (dots) for a specific <em>Origin</em> group (e.g., USA, Europe,
              Japan). Each dot represents the individual value of that metric
              for a year and origin. Different colors distinguish between
              origins.
            </li>
          </ul>

          <h4 className="text-teal-400 font-semibold mt-6 mb-2">
            How Do the Filters Work?
          </h4>
          <ul className="list-disc ml-6 text-gray-400 space-y-2">
            <li>
              <strong>Metric Selector (MPG, Cylinders, Acceleration):</strong>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>
                  Changing the metric updates the Y-axis and redraws the lines
                  and dots based on the selected attribute.
                </li>
                <li>
                  For example, selecting <strong>Cylinders</strong> will show
                  how the number of engine cylinders has evolved over time for
                  each origin.
                </li>
              </ul>
            </li>
            <li>
              <strong>Origin Filter (All, USA, Europe, Japan):</strong>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>
                  By default, all origins are shown, each with a separate
                  colored line.
                </li>
                <li>
                  Selecting a specific origin filters the data to only show that
                  origin’s trend over the years.
                </li>
              </ul>
            </li>
            <li>
              <strong>Combined Effect of Filters:</strong> You can use both
              filters together to explore targeted trends.
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>
                  For example, selecting <strong>Acceleration</strong> and{" "}
                  <strong>Japan</strong> will show how acceleration performance
                  of Japanese cars has changed year by year.
                </li>
              </ul>
            </li>
          </ul>

          <h4 className="text-teal-400 font-semibold mt-6 mb-2">
            Visual Interpretation
          </h4>
          <p className="text-gray-300 leading-6">
            Each line tells a story of how a selected metric has evolved over
            time for a particular origin group. You can observe patterns like:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-400 space-y-2">
            <li>
              Japanese cars improving fuel efficiency (MPG) over the years
            </li>
            <li>
              American cars reducing the number of cylinders due to fuel economy
              regulations
            </li>
            <li>European cars becoming quicker in terms of acceleration</li>
          </ul>
          <p className="text-gray-300 mt-4">
            This visualization offers a clear and comparative view of how
            different regions adapted and innovated across decades in response
            to global trends and regulations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectedScatterPlot;
