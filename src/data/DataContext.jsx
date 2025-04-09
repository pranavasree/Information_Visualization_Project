import React, { createContext, useState, useEffect } from "react";
import * as d3 from "d3";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load CSV file when component mounts
    d3.csv("/a1-cars.csv").then((parsedData) => {
      // Convert numeric fields
      const formattedData = parsedData.map((d) => ({
        Name: d.Name,
        MPG: +d.MPG,
        Cylinders: +d.Cylinders,
        Displacement: +d.Displacement,
        Horsepower: +d.Horsepower,
        Weight: +d.Weight,
        Acceleration: +d.Acceleration,
        "Model Year": +d["Model Year"],
        Origin: d.Origin,
      }));

      setData(formattedData);
    });
  }, []);

  return (
    <DataContext.Provider value={{ data }}>{children}</DataContext.Provider>
  );
};
