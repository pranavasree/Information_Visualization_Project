import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 font-sans">
      <header className="text-center mb-8 mt-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 py-4 px-8 rounded-lg shadow-xl font-poppins text-transparent bg-clip-text">
          D3-Powered Car Dataset Insights
        </h1>
      </header>

      <main className="flex flex-col items-center justify-center flex-grow space-y-4">
        <Link
          to="/all-visuals"
          className="block w-1/4 text-center bg-pink-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-pink-800 transition font-poppins"
        >
          Co-ordination of All Visuals
        </Link>
        <Link
          to="/bubble-chart"
          className="block w-1/4 text-center bg-green-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-green-600 transition font-poppins"
        >
          Bubble Chart
        </Link>
        <Link
          to="/histogram"
          className="block w-1/4 text-center bg-orange-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-orange-600 transition font-poppins"
        >
          Histogram
        </Link>
        <Link
          to="/heatmap"
          className="block w-1/4 text-center bg-purple-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-purple-600 transition font-poppins"
        >
          Heatmap
        </Link>

        <Link
          to="/connected-scatter"
          className="block w-1/4 text-center bg-cyan-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-cyan-600 transition font-poppins"
        >
          Connected Scatter Plot
        </Link>
      </main>

      <footer className="bg-gray-900 text-white py-6 mt-12">
        <div className="text-center text-lg space-y-4">
          <p className="font-bold text-2xl">Team Members</p>
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xl font-semibold hover:text-teal-400 transition-colors duration-200">
              <a href="mailto:ppottipa@kent.edu" className="hover:underline">
                Pranava Sree Pottipati - ppottipa@kent.edu
              </a>
            </p>
            <p className="text-xl font-semibold hover:text-teal-400 transition-colors duration-200">
              Dinesh Rohit Ravuri - dravuri@kent.edu
            </p>
            <p className="text-xl font-semibold hover:text-teal-400 transition-colors duration-200">
              <a href="mailto:rpendurt@kent.edu" className="hover:underline">
                Rishik Pendurthi - rpendurt@kent.edu
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
