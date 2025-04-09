import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { DataProvider } from "./data/DataContext";
import Dashboard from "./components/Dashboard";
import BubbleChart from "./components/BubbleChart";
import Histogram from "./components/Histogram";
import ConnectedScatterPlot from "./components/ConnectedScatterPlot";
import Heatmap from "./components/Heatmap"; // ✅ new component
import AllVisuals from "./components/AllVisuals";

const App = () => {
  return (
    <DataProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/connected-scatter" element={<ConnectedScatterPlot />} />
          <Route path="/bubble-chart" element={<BubbleChart />} />
          <Route path="/histogram" element={<Histogram />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/all-visuals" element={<AllVisuals />} />
        </Routes>
      </Router>
    </DataProvider>
  );
};

export default App;
