# Ignition-Insights: D3 + React Car Data Dashboard project:

## Car Dataset Dashboard – Coordinated Multi-View Visualization with D3.js + React

An interactive dashboard built with **React**, **D3.js**, and **Tailwind CSS** that visualizes the classic car dataset through multiple coordinated charts. Users can filter by car origin and explore meaningful trends in MPG, acceleration, horsepower, and engine cylinders.

---

## 📸 Preview

<img src="./public/Information_Visualization_Project_Walkthrough.gif" alt="Project Walkthrough">

---

## 🔍 Features

- 🎯 **Origin Filter**: Filter data by American, European, or Japanese cars — all charts update together
- 📊 **Bubble Chart**: Visualizes Horsepower vs. Acceleration with MPG as bubble size and origin as color
- 📉 **Connected Scatter Plot**: Time series of selected metrics (MPG, Acceleration, Cylinders) with line plots by origin
- 📦 **Histogram**: Frequency of engine cylinders with adjustable bin size and tooltip
- 🔥 **Heatmap**: Displays average MPG by Year and Origin with gradient coloring and tooltip
- 🖼️ **Export to Image**: Download any chart as PNG
- ⚡ **Fully Responsive**: Built with Tailwind CSS and React components
- 🧠 **Coordinated Filtering**: All charts sync when filters are applied

---

## 🛠️ Tech Stack

| Tech             | Purpose                                   |
| ---------------- | ----------------------------------------- |
| **React**        | Component-based UI and state control      |
| **D3.js**        | Drawing charts, scales, and interactivity |
| **Tailwind CSS** | Utility-first responsive styling          |
| **html2canvas**  | Capture and download chart images         |
| **React Router** | Multi-page structure and navigation       |
| **Vite**         | Fast development build system             |

---

## 📂 Folder Structure

```
src/
│
├── components/
│   ├── AllVisuals.jsx
│   ├── BubbleChart.jsx
│   ├── ConnectedScatterPlot.jsx
│   ├── Histogram.jsx
│   └── Heatmap.jsx
│
├── data/
│   └── DataContext.jsx
│
├── App.jsx
└── main.jsx
```

---

## 📁 Dataset

We use the classic cars dataset available as `cars data.csv` in the `public/` folder.

---

## 💡 Why D3.js?

D3 is used for:

- Building custom SVG-based charts with **precise layout control**
- Using **d3.scale** for positioning, colors, and sizing
- Creating **interpolated color gradients** for the heatmap
- Using **d3.bin**, **d3.mean**, and **d3.groups** for histogram bins and data aggregation
- Managing **brush zoom interactions** in the Bubble Chart

D3 provides complete control over the visual storytelling of your data.

---

## 🚀 Getting Started

### 1. Clone the repo

git clone (repo_url)
cd Ignition-Insights

### 2. Install dependencies

npm install

### 3. Run the app

npm run dev

---

## 🧪 Development Notes

- Make sure the `cars data.csv` file is placed inside the `public/` folder
- Tooltips, legends, and transitions are implemented using native D3
- Uses React's Context API to share filtered data across components
- Tailwind CSS is used for responsive design and styling

---

## 📄 License

This project is licensed Pranava Sree Pottipati, Dinesh Rohit Ravuri, Rishik Pendurthi.

## Checkout the App

https://pranava-rohit-rishik-iv-project.netlify.app/

---

## 🙌 Credits

Special thanks to:

- [D3.js Documentation](https://d3js.org/)
- [React Docs](https://react.dev/)

---

## 🔗 Connect

Let’s connect on [LinkedIn](https://www.linkedin.com/in/pranava-sree-pottipati-422092172/) or check out more on [GitHub](https://github.com/prananvasree).
