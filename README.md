# 📊 CSV Data Analyzer Dashboard

An interactive, responsive, and feature-packed web application for uploading, exploring, filtering, analyzing, and visualizing CSV datasets directly in your browser.

---

## 🚀 Key Features

### 1. 📁 Data Ingestion & Management
* **Flexible Uploads:** Drag-and-drop CSV files or click the file picker.
* **Instant Sample Dataset:** Includes a built-in **"⚡ Load Sample Sales CSV"** button for immediate testing.
* **Global Search & Column Filtering:** Search across all fields or filter by a specific column in real time.
* **Interactive Table:** Header click-to-sort (ascending/descending with automatic numeric vs. string detection) and pagination.
* **Export Filtered CSV:** Download filtered or sorted data as a clean `.csv` file.

### 2. 📈 Expanded Statistical Metrics
When selecting a numeric column, the dashboard calculates 9 comprehensive descriptive statistics:
* **Min** & **Max**
* **Average (Mean)** & **Sum / Total**
* **Median**
* **Mode** (handles multi-modal and unique value datasets)
* **Sample Standard Deviation ($\sigma$)**
* **Distinct Values Count**
* **Missing / Empty Cells Count**

### 3. 📊 Group By & Pivot Aggregations
* Group categorical data (e.g. *Region*, *Department*, *Category*) against any numeric metric (e.g. *Revenue*, *Salary*, *Units Sold*).
* Choose calculation functions: **Sum**, **Average (Mean)**, **Count of Rows**, **Min**, **Max**, or **Median**.
* Visual breakdown table showing count, aggregated value, and dynamic `% of Total` progress bars.
* **Plot to Chart:** Directly plot aggregation results as a chart with a single click.
* **Export Aggregated CSV:** Download aggregation results directly.

### 4. 📉 Scatter & Correlation Analysis (X vs Y)
* Compare two numeric columns on an interactive dual-axis scatter plot.
* **Pearson Correlation Coefficient ($r$):** Calculates the exact correlation score.
* **Relationship Badges:** Identifies strong, moderate, or weak linear correlation.
* **Linear Regression:** Computes and plots the best-fit trendline ($y = mx + b$).

### 5. 📸 Visualizations & Chart Tools
* **Rich Chart Types:**
  * **Bar Chart (Vertical)**
  * **Horizontal Bar Chart** (ideal for long categorical labels)
  * **Line Chart**
  * **Pie Chart**
  * **Doughnut Chart**
  * **Histogram (Frequency Distribution)** with configurable bin intervals (**Auto / Sturges' Rule**, 5, 8, 10, 15, or 20 bins)
  * **Polar Area Chart**
  * **Radar Chart**
  * **Scatter & Correlation Plot**
* **🎨 Chart Color Themes:** Instant palette switching between **Vibrant**, **Neon Cyber**, **Pastel Dream**, **Emerald Forest**, and **Sunset Glow**.
* **📷 High-Resolution Image Export:** Download active charts as crisp **PNG** or **JPEG** images with preserved light/dark backgrounds.

### 6. 📋 Data Quality & Column Profiler
* Dedicated audit modal accessible via the **"📋 Column Profiler"** button.
* Overview metrics: Total Rows, Total Columns, Total Cells, Missing Cells, and Overall Completeness Percentage.
* Per-column specification table:
  * Inferred Data Types (`Numeric`, `Date`, `Text / Categorical`)
  * Completeness % with color-coded health bars
  * Missing count and distinct/unique count
  * Value range (`Min | Max | Avg`) or top most frequent values

### 7. 🌙 Light & Dark Mode
* One-click theme toggle between Light and Dark mode.
* Automatically saves user preference in `localStorage`.
* Adapts chart axes, labels, and modals seamlessly.

---

## 🛠️ Technology Stack

* **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **CSV Parsing:** [PapaParse](https://www.papaparse.com/)
* **Data Visualization:** [Chart.js](https://www.chartjs.org/)

---

## 📂 Project Structure

```
csv-data-analyzer/
├── assets/
│   ├── css/
│   │   └── style.css            # Responsive layout, dark mode, design tokens
│   ├── data/
│   │   └── sample_sales.csv     # Sample sales dataset for immediate testing
│   └── js/
│       └── script.js            # Analytical math, Chart.js integrations, profiler
├── index.html                   # Dashboard UI structure & modals
└── README.md                    # Documentation
```

---

## 🏃 Getting Started

1. Clone or download this repository into your web server directory (e.g. `c:/xampp/htdocs/csv-data-analyzer`).
2. Open `index.html` in any modern web browser, or access via `http://localhost/csv-data-analyzer/` if using XAMPP/Apache.
3. Click **"⚡ Load Sample Sales CSV"** or drag-and-drop your own `.csv` file to begin analyzing!
