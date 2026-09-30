document.addEventListener("DOMContentLoaded", () => {
  const state = {
    originalData: [],
    filteredData: [],
    numericColumns: [],
    allColumns: [],
    chartInstance: null,
    currentPage: 1,
    rowsPerPage: 5,
    currentSortColumn: "",
    currentSortDirection: "asc",
    aggregationResults: null,
    currentChartTheme: "vibrant"
  };

  const elements = {
    // Inputs & Filters
    csvFileInput: document.getElementById("csvFile"),
    dropZone: document.getElementById("dropZone"),
    loadSampleBtn: document.getElementById("loadSampleBtn"),
    searchInput: document.getElementById("searchInput"),
    filterColumn: document.getElementById("filterColumn"),
    filterValue: document.getElementById("filterValue"),
    resetBtn: document.getElementById("resetBtn"),
    exportBtn: document.getElementById("exportBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),

    // Overview Cards
    totalRows: document.getElementById("totalRows"),
    totalColumns: document.getElementById("totalColumns"),
    numericColumnsCount: document.getElementById("numericColumnsCount"),
    selectedNumericColumn: document.getElementById("selectedNumericColumn"),

    // Expanded Stats Grid
    minValue: document.getElementById("minValue"),
    maxValue: document.getElementById("maxValue"),
    avgValue: document.getElementById("avgValue"),
    sumValue: document.getElementById("sumValue"),
    medianValue: document.getElementById("medianValue"),
    modeValue: document.getElementById("modeValue"),
    stdDevValue: document.getElementById("stdDevValue"),
    distinctValue: document.getElementById("distinctValue"),
    missingValue: document.getElementById("missingValue"),

    // Group By & Aggregation
    groupByColSelect: document.getElementById("groupByColSelect"),
    aggColSelect: document.getElementById("aggColSelect"),
    aggFuncSelect: document.getElementById("aggFuncSelect"),
    plotAggBtn: document.getElementById("plotAggBtn"),
    exportAggBtn: document.getElementById("exportAggBtn"),
    aggColHeader: document.getElementById("aggColHeader"),
    aggTableBody: document.getElementById("aggTableBody"),

    // Chart, Scatter, Themes & Histogram
    standardChartControls: document.getElementById("standardChartControls"),
    chartColumnSelect: document.getElementById("chartColumnSelect"),
    chartTypeSelect: document.getElementById("chartTypeSelect"),
    chartThemeSelect: document.getElementById("chartThemeSelect"),
    histogramControls: document.getElementById("histogramControls"),
    histogramBinsSelect: document.getElementById("histogramBinsSelect"),
    histogramHint: document.getElementById("histogramHint"),
    downloadChartPngBtn: document.getElementById("downloadChartPngBtn"),
    downloadChartJpegBtn: document.getElementById("downloadChartJpegBtn"),
    scatterControls: document.getElementById("scatterControls"),
    scatterXSelect: document.getElementById("scatterXSelect"),
    scatterYSelect: document.getElementById("scatterYSelect"),
    correlationBox: document.getElementById("correlationBox"),
    corrValue: document.getElementById("corrValue"),
    corrBadge: document.getElementById("corrBadge"),
    regressionEquation: document.getElementById("regressionEquation"),
    chartCanvas: document.getElementById("myChart"),

    // Data Table & Pagination
    tableHead: document.querySelector("#csvTable thead"),
    tableBody: document.querySelector("#csvTable tbody"),
    prevPageBtn: document.getElementById("prevPageBtn"),
    nextPageBtn: document.getElementById("nextPageBtn"),
    pageInfo: document.getElementById("pageInfo"),
    emptyMessage: document.getElementById("emptyMessage"),

    // Profiler Modal
    profilerBtn: document.getElementById("profilerBtn"),
    profilerModal: document.getElementById("profilerModal"),
    closeProfilerModal: document.getElementById("closeProfilerModal"),
    closeProfilerBtn: document.getElementById("closeProfilerBtn"),
    overallCompleteness: document.getElementById("overallCompleteness"),
    profilerTotalCols: document.getElementById("profilerTotalCols"),
    profilerTotalRows: document.getElementById("profilerTotalRows"),
    profilerTotalCells: document.getElementById("profilerTotalCells"),
    profilerMissingCells: document.getElementById("profilerMissingCells"),
    profilerTableBody: document.getElementById("profilerTableBody")
  };

  initializeTheme();
  setupEvents();
  updateSummary();
  renderTable();
  updatePaginationInfo();

  function setupEvents() {
    elements.csvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    if (elements.loadSampleBtn) {
      elements.loadSampleBtn.addEventListener("click", loadSampleDataset);
    }

    elements.searchInput.addEventListener("input", applyFilters);
    elements.filterColumn.addEventListener("change", applyFilters);
    elements.filterValue.addEventListener("input", applyFilters);
    elements.resetBtn.addEventListener("click", resetFilters);
    elements.exportBtn.addEventListener("click", exportFilteredCSV);

    // Chart controls
    elements.chartColumnSelect.addEventListener("change", updateChartAndStats);
    elements.chartTypeSelect.addEventListener("change", handleChartTypeChange);
    elements.chartThemeSelect.addEventListener("change", (e) => {
      state.currentChartTheme = e.target.value;
      if (elements.chartTypeSelect.value === "scatter") {
        updateScatterPlot();
      } else {
        updateChartAndStats();
      }
    });
    elements.histogramBinsSelect.addEventListener("change", updateChartAndStats);
    elements.downloadChartPngBtn.addEventListener("click", () => exportChartImage("png"));
    elements.downloadChartJpegBtn.addEventListener("click", () => exportChartImage("jpeg"));
    elements.scatterXSelect.addEventListener("change", updateScatterPlot);
    elements.scatterYSelect.addEventListener("change", updateScatterPlot);

    // Group By Aggregation controls
    elements.groupByColSelect.addEventListener("change", runAggregation);
    elements.aggColSelect.addEventListener("change", runAggregation);
    elements.aggFuncSelect.addEventListener("change", runAggregation);
    elements.plotAggBtn.addEventListener("click", plotAggregationToChart);
    elements.exportAggBtn.addEventListener("click", exportAggregationCSV);

    // Pagination
    elements.prevPageBtn.addEventListener("click", goToPreviousPage);
    elements.nextPageBtn.addEventListener("click", goToNextPage);
    elements.themeToggleBtn.addEventListener("click", toggleTheme);

    // Column Profiler Modal
    if (elements.profilerBtn && elements.profilerModal) {
      elements.profilerBtn.addEventListener("click", openProfilerModal);
      elements.closeProfilerModal.addEventListener("click", () => elements.profilerModal.close());
      elements.closeProfilerBtn.addEventListener("click", () => elements.profilerModal.close());
      elements.profilerModal.addEventListener("click", (e) => {
        if (e.target === elements.profilerModal) {
          elements.profilerModal.close();
        }
      });
    }

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    ["dragenter", "dragover"].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.dropZone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      elements.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.dropZone.classList.remove("dragover");
      });
    });

    elements.dropZone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });
  }

  function handleFile(file) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload CSV file only.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        processParsedData(results.data);
      },
      error: function() {
        alert("Failed to parse CSV file.");
      }
    });
  }

  function loadSampleDataset() {
    fetch("assets/data/sample_sales.csv")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load sample data");
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: function(results) {
            processParsedData(results.data);
          }
        });
      })
      .catch((err) => {
        console.error("Failed to load sample dataset:", err);
        alert("Could not load sample dataset.");
      });
  }

  function processParsedData(data) {
    if (!data || !data.length) {
      alert("CSV data is empty or invalid.");
      return;
    }

    state.originalData = data.filter((row) =>
      Object.values(row).some((value) => String(value).trim() !== "")
    );

    if (!state.originalData.length) {
      alert("No valid rows found in CSV.");
      return;
    }

    state.allColumns = Object.keys(state.originalData[0]);
    state.filteredData = [...state.originalData];
    state.numericColumns = detectNumericColumns(state.originalData);
    state.currentPage = 1;
    state.currentSortColumn = "";
    state.currentSortDirection = "asc";

    populateDropdowns();
    updateSummary();
    renderTable();
    updateChartAndStats();
    runAggregation();
  }

  function detectNumericColumns(data) {
    if (!data.length) return [];
    const headers = Object.keys(data[0]);

    return headers.filter((header) => {
      const values = data
        .map((row) => String(row[header] ?? "").trim())
        .filter((value) => value !== "");

      if (!values.length) return false;
      return values.every((value) => !Number.isNaN(Number(value)));
    });
  }

  function populateDropdowns() {
    // 1. Filter Column dropdown
    elements.filterColumn.innerHTML = `<option value="">Filter column</option>`;
    state.allColumns.forEach((header) => {
      const opt = document.createElement("option");
      opt.value = header;
      opt.textContent = header;
      elements.filterColumn.appendChild(opt);
    });

    // 2. Chart Column dropdown
    elements.chartColumnSelect.innerHTML = `<option value="">Select column for chart</option>`;
    state.allColumns.forEach((header) => {
      const opt = document.createElement("option");
      opt.value = header;
      opt.textContent = state.numericColumns.includes(header)
        ? `${header} (Numeric)`
        : header;
      if (state.numericColumns.length > 0 && header === state.numericColumns[0]) {
        opt.selected = true;
      }
      elements.chartColumnSelect.appendChild(opt);
    });

    // 3. Scatter Selectors
    elements.scatterXSelect.innerHTML = `<option value="">Select X Column</option>`;
    elements.scatterYSelect.innerHTML = `<option value="">Select Y Column</option>`;
    state.numericColumns.forEach((col, idx) => {
      const optX = document.createElement("option");
      optX.value = col;
      optX.textContent = col;
      if (idx === 0) optX.selected = true;
      elements.scatterXSelect.appendChild(optX);

      const optY = document.createElement("option");
      optY.value = col;
      optY.textContent = col;
      if (idx === 1 || (state.numericColumns.length === 1 && idx === 0)) optY.selected = true;
      elements.scatterYSelect.appendChild(optY);
    });

    // 4. Group By Aggregation Selectors
    elements.groupByColSelect.innerHTML = `<option value="">Select Category Column</option>`;
    let defaultGroupSelected = false;
    state.allColumns.forEach((col) => {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = col;
      // Default to first non-numeric column if available
      if (!state.numericColumns.includes(col) && !defaultGroupSelected) {
        opt.selected = true;
        defaultGroupSelected = true;
      }
      elements.groupByColSelect.appendChild(opt);
    });

    elements.aggColSelect.innerHTML = `<option value="">Select Numeric Column</option>`;
    state.numericColumns.forEach((col, idx) => {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = col;
      if (idx === 0) opt.selected = true;
      elements.aggColSelect.appendChild(opt);
    });
  }

  function applyFilters() {
    const searchKeyword = elements.searchInput.value.toLowerCase().trim();
    const selectedFilterColumn = elements.filterColumn.value;
    const filterKeyword = elements.filterValue.value.toLowerCase().trim();

    state.filteredData = state.originalData.filter((row) => {
      const matchesSearch = Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchKeyword)
      );

      const matchesColumnFilter = selectedFilterColumn
        ? String(row[selectedFilterColumn] ?? "").toLowerCase().includes(filterKeyword)
        : true;

      return matchesSearch && matchesColumnFilter;
    });

    if (state.currentSortColumn) {
      sortData(state.currentSortColumn, false);
    }

    state.currentPage = 1;
    updateSummary();
    renderTable();
    updateChartAndStats();
    runAggregation();
  }

  function resetFilters() {
    elements.searchInput.value = "";
    elements.filterColumn.value = "";
    elements.filterValue.value = "";
    elements.chartColumnSelect.value = "";
    elements.chartTypeSelect.value = "auto";

    state.filteredData = [...state.originalData];
    state.currentSortColumn = "";
    state.currentSortDirection = "asc";
    state.currentPage = 1;

    handleChartTypeChange();
    updateSummary();
    renderTable();
    updateChartAndStats();
    runAggregation();
  }

  function updateSummary() {
    elements.totalRows.textContent = state.filteredData.length;
    elements.totalColumns.textContent = state.originalData.length
      ? Object.keys(state.originalData[0]).length
      : 0;
    elements.numericColumnsCount.textContent = state.numericColumns.length;
  }

  function renderTable() {
    elements.tableHead.innerHTML = "";
    elements.tableBody.innerHTML = "";

    if (!state.filteredData.length) {
      elements.emptyMessage.style.display = "block";
      return;
    }

    elements.emptyMessage.style.display = "none";

    const headers = Object.keys(state.filteredData[0]);
    const headerRow = document.createElement("tr");

    headers.forEach((header) => {
      const th = document.createElement("th");
      const sortIcon =
        state.currentSortColumn === header
          ? state.currentSortDirection === "asc"
            ? " ▲"
            : " ▼"
          : "";

      th.textContent = header + sortIcon;
      th.addEventListener("click", () => sortData(header, true));
      headerRow.appendChild(th);
    });

    elements.tableHead.appendChild(headerRow);

    const startIndex = (state.currentPage - 1) * state.rowsPerPage;
    const endIndex = startIndex + state.rowsPerPage;
    const paginatedData = state.filteredData.slice(startIndex, endIndex);

    paginatedData.forEach((row) => {
      const tr = document.createElement("tr");

      headers.forEach((header) => {
        const td = document.createElement("td");
        td.textContent = row[header] ?? "";
        tr.appendChild(td);
      });

      elements.tableBody.appendChild(tr);
    });

    updatePaginationInfo();
  }

  function sortData(column, toggleDirection = true) {
    if (toggleDirection) {
      if (state.currentSortColumn === column) {
        state.currentSortDirection = state.currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        state.currentSortColumn = column;
        state.currentSortDirection = "asc";
      }
    } else {
      state.currentSortColumn = column;
    }

    state.filteredData.sort((a, b) => {
      let valueA = a[column] ?? "";
      let valueB = b[column] ?? "";

      const numA = Number(valueA);
      const numB = Number(valueB);
      const isNumeric = !Number.isNaN(numA) && !Number.isNaN(numB) && valueA !== "" && valueB !== "";

      if (isNumeric) {
        return state.currentSortDirection === "asc" ? numA - numB : numB - numA;
      }

      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();

      if (valueA < valueB) return state.currentSortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return state.currentSortDirection === "asc" ? 1 : -1;
      return 0;
    });

    state.currentPage = 1;
    renderTable();
  }

  function goToPreviousPage() {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  }

  function goToNextPage() {
    const totalPages = Math.ceil(state.filteredData.length / state.rowsPerPage);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTable();
    }
  }

  function updatePaginationInfo() {
    const totalPages = state.filteredData.length
      ? Math.ceil(state.filteredData.length / state.rowsPerPage)
      : 0;

    elements.pageInfo.textContent = `Page ${totalPages ? state.currentPage : 0} of ${totalPages}`;
    elements.prevPageBtn.disabled = state.currentPage <= 1;
    elements.nextPageBtn.disabled = totalPages === 0 || state.currentPage >= totalPages;
  }

  /* ========================================================
     FEATURE: EXPANDED STATISTICAL METRICS
     ======================================================== */
  function updateNumericStats(column) {
    const allColValues = state.filteredData.map((row) => row[column]);
    const missingCount = allColValues.filter(
      (val) => val === undefined || val === null || String(val).trim() === ""
    ).length;

    const values = allColValues
      .map((val) => Number(val))
      .filter((num) => !Number.isNaN(num) && String(num).trim() !== "");

    if (!values.length) {
      resetStats();
      elements.missingValue.textContent = missingCount;
      return;
    }

    // Min, Max, Sum, Avg
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    let median;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      median = (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      median = sorted[mid];
    }

    // Mode
    const freqMap = {};
    let maxFreq = 0;
    values.forEach((v) => {
      freqMap[v] = (freqMap[v] || 0) + 1;
      if (freqMap[v] > maxFreq) maxFreq = freqMap[v];
    });

    let modeText = "-";
    if (maxFreq > 1) {
      const modes = Object.keys(freqMap).filter((k) => freqMap[k] === maxFreq);
      modeText = modes.slice(0, 3).map((v) => formatNumber(v)).join(", ");
      if (modes.length > 3) modeText += "...";
    } else {
      modeText = "None (All Unique)";
    }

    // Standard Deviation (Sample)
    let stdDev = 0;
    if (values.length > 1) {
      const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / (values.length - 1);
      stdDev = Math.sqrt(variance);
    }

    // Distinct count
    const distinctCount = new Set(values).size;

    elements.minValue.textContent = formatNumber(min);
    elements.maxValue.textContent = formatNumber(max);
    elements.avgValue.textContent = formatNumber(avg);
    elements.sumValue.textContent = formatNumber(sum);
    elements.medianValue.textContent = formatNumber(median);
    elements.modeValue.textContent = modeText;
    elements.stdDevValue.textContent = formatNumber(stdDev);
    elements.distinctValue.textContent = distinctCount.toLocaleString();
    elements.missingValue.textContent = missingCount.toLocaleString();
  }

  function resetStats() {
    elements.minValue.textContent = "-";
    elements.maxValue.textContent = "-";
    elements.avgValue.textContent = "-";
    elements.sumValue.textContent = "-";
    elements.medianValue.textContent = "-";
    elements.modeValue.textContent = "-";
    elements.stdDevValue.textContent = "-";
    elements.distinctValue.textContent = "-";
    elements.missingValue.textContent = "-";
    elements.selectedNumericColumn.textContent = "-";
  }

  /* ========================================================
     FEATURE: CHART PALETTES & THEMES
     ======================================================== */
  const chartPalettes = {
    vibrant: {
      name: "Vibrant",
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6"],
      primary: "#3b82f6",
      primaryBg: "rgba(59, 130, 246, 0.75)"
    },
    neon: {
      name: "Neon Cyber",
      colors: ["#00f0ff", "#ff007f", "#7928ca", "#00ff66", "#ffea00", "#ff0033", "#00bfff", "#ff00aa"],
      primary: "#00f0ff",
      primaryBg: "rgba(0, 240, 255, 0.75)"
    },
    pastel: {
      name: "Pastel Dream",
      colors: ["#93c5fd", "#86efac", "#fde047", "#d8b4fe", "#f9a8d4", "#67e8f9", "#fdba74", "#99f6e4"],
      primary: "#93c5fd",
      primaryBg: "rgba(147, 197, 253, 0.75)"
    },
    emerald: {
      name: "Emerald Forest",
      colors: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4"],
      primary: "#10b981",
      primaryBg: "rgba(16, 185, 129, 0.75)"
    },
    sunset: {
      name: "Sunset Glow",
      colors: ["#4c1d95", "#7c3aed", "#c026d3", "#db2777", "#e11d48", "#f97316", "#f59e0b", "#fbbf24"],
      primary: "#f97316",
      primaryBg: "rgba(249, 115, 22, 0.75)"
    }
  };

  /* ========================================================
     FEATURE: CHARTING & VISUALIZATIONS
     ======================================================== */
  function handleChartTypeChange() {
    const selectedType = elements.chartTypeSelect.value;
    if (selectedType === "scatter") {
      elements.standardChartControls.style.display = "none";
      elements.scatterControls.style.display = "block";
      elements.histogramControls.style.display = "none";
      updateScatterPlot();
    } else if (selectedType === "histogram") {
      elements.standardChartControls.style.display = "block";
      elements.scatterControls.style.display = "none";
      elements.histogramControls.style.display = "block";
      updateChartAndStats();
    } else {
      elements.standardChartControls.style.display = "block";
      elements.scatterControls.style.display = "none";
      elements.histogramControls.style.display = "none";
      updateChartAndStats();
    }
  }

  function updateChartAndStats() {
    const selectedChartType = elements.chartTypeSelect.value;
    if (selectedChartType === "scatter") {
      updateScatterPlot();
      return;
    }

    resetStats();
    const selectedColumn = elements.chartColumnSelect.value;

    if (!selectedColumn || !state.filteredData.length) {
      destroyChart();
      return;
    }

    if (state.numericColumns.includes(selectedColumn)) {
      elements.selectedNumericColumn.textContent = selectedColumn;
      updateNumericStats(selectedColumn);

      if (selectedChartType === "histogram") {
        renderHistogramChart(selectedColumn);
      } else {
        renderNumericChart(selectedColumn, detectChartType(selectedColumn, selectedChartType));
      }
    } else {
      if (selectedChartType === "histogram") {
        // If categorical column is selected with histogram, plot count distribution
        renderCategoryChart(selectedColumn, "bar");
      } else {
        renderCategoryChart(selectedColumn, detectChartType(selectedColumn, selectedChartType));
      }
    }
  }

  function detectChartType(column, selectedChartType) {
    if (selectedChartType !== "auto") {
      if (state.numericColumns.includes(column) && (selectedChartType === "pie" || selectedChartType === "doughnut" || selectedChartType === "polarArea")) {
        return "bar";
      }
      return selectedChartType;
    }

    if (state.numericColumns.includes(column)) {
      return "line";
    }

    const uniqueValues = new Set(
      state.filteredData.map((row) => {
        const value = row[column];
        return value && String(value).trim() !== "" ? value : "Empty";
      })
    );

    return uniqueValues.size <= 6 ? "pie" : "bar";
  }

  function renderNumericChart(column, chartType) {
    const values = state.filteredData
      .map((row) => Number(row[column]))
      .filter((value) => !Number.isNaN(value));

    const labels = values.map((_, index) => `Row ${index + 1}`);
    renderStandardChart(labels, values, `${column} Distribution`, chartType, { column, isNumericSeries: true });
  }

  function renderCategoryChart(column, chartType) {
    const counts = {};
    state.filteredData.forEach((row) => {
      const value = row[column] && String(row[column]).trim() !== "" ? row[column] : "Empty";
      counts[value] = (counts[value] || 0) + 1;
    });

    renderStandardChart(
      Object.keys(counts),
      Object.values(counts),
      `Count by ${column}`,
      chartType,
      { column, isCategorySeries: true }
    );
  }

  function renderHistogramChart(column) {
    const rawValues = state.filteredData
      .map((row) => Number(row[column]))
      .filter((val) => !Number.isNaN(val) && String(val).trim() !== "");

    if (!rawValues.length) {
      destroyChart();
      return;
    }

    const min = Math.min(...rawValues);
    const max = Math.max(...rawValues);

    let binCount = 10;
    const selectedBins = elements.histogramBinsSelect.value;
    if (selectedBins === "auto") {
      // Sturges' Rule: k = ceil(log2(n) + 1)
      binCount = Math.min(15, Math.max(5, Math.ceil(Math.log2(rawValues.length) + 1)));
    } else {
      binCount = parseInt(selectedBins, 10) || 10;
    }

    if (min === max) {
      const labels = [`[${formatNumber(min)}]`];
      const data = [rawValues.length];
      renderStandardChart(labels, data, `Histogram of ${column}`, "bar", { isHistogram: true, column });
      return;
    }

    const binWidth = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, () => 0);
    const binLabels = [];

    for (let i = 0; i < binCount; i++) {
      const start = min + i * binWidth;
      const end = i === binCount - 1 ? max : min + (i + 1) * binWidth;
      binLabels.push(`${formatNumber(start)} - ${formatNumber(end)}`);
    }

    rawValues.forEach((val) => {
      let index = Math.floor((val - min) / binWidth);
      if (index >= binCount) index = binCount - 1;
      if (index < 0) index = 0;
      bins[index]++;
    });

    renderStandardChart(
      binLabels,
      bins,
      `Histogram (Frequency Distribution) of ${column}`,
      "bar",
      { isHistogram: true, column }
    );
  }

  function updateScatterPlot() {
    const colX = elements.scatterXSelect.value;
    const colY = elements.scatterYSelect.value;

    if (!colX || !colY || !state.filteredData.length) {
      destroyChart();
      elements.correlationBox.style.display = "none";
      return;
    }

    // Extract valid paired data
    const paired = [];
    state.filteredData.forEach((row) => {
      const vx = Number(row[colX]);
      const vy = Number(row[colY]);
      if (!Number.isNaN(vx) && !Number.isNaN(vy)) {
        paired.push({ x: vx, y: vy });
      }
    });

    if (paired.length < 2) {
      destroyChart();
      elements.correlationBox.style.display = "none";
      return;
    }

    // Calculate Pearson Correlation (r) & Linear Regression (y = mx + b)
    const n = paired.length;
    const sumX = paired.reduce((acc, p) => acc + p.x, 0);
    const sumY = paired.reduce((acc, p) => acc + p.y, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    paired.forEach((p) => {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    });

    const denom = Math.sqrt(denomX * denomY);
    const r = denom === 0 ? 0 : numerator / denom;

    // Regression slope & intercept
    const slope = denomX === 0 ? 0 : numerator / denomX;
    const intercept = meanY - slope * meanX;

    // Display correlation results
    elements.correlationBox.style.display = "flex";
    elements.corrValue.textContent = r.toFixed(3);

    // Badge styling & text
    const absR = Math.abs(r);
    let badgeText = "";
    let badgeClass = "corr-badge ";

    if (absR >= 0.7) {
      badgeText = r > 0 ? "Strong Positive Correlation" : "Strong Negative Correlation";
      badgeClass += r > 0 ? "strong-pos" : "strong-neg";
    } else if (absR >= 0.3) {
      badgeText = r > 0 ? "Moderate Positive Correlation" : "Moderate Negative Correlation";
      badgeClass += r > 0 ? "mod-pos" : "mod-neg";
    } else {
      badgeText = "Weak / No Linear Correlation";
      badgeClass += "weak";
    }

    elements.corrBadge.textContent = badgeText;
    elements.corrBadge.className = badgeClass;

    const sign = intercept >= 0 ? "+" : "-";
    elements.regressionEquation.textContent = `y = ${slope.toFixed(2)}x ${sign} ${Math.abs(intercept).toFixed(2)}`;

    // Build trendline endpoints
    const minX = Math.min(...paired.map((p) => p.x));
    const maxX = Math.max(...paired.map((p) => p.x));
    const trendlineData = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];

    renderScatterChart(paired, trendlineData, colX, colY, r);
  }

  function renderScatterChart(scatterPoints, trendlinePoints, xLabel, yLabel, rValue) {
    destroyChart();
    const ctx = elements.chartCanvas.getContext("2d");
    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
    const theme = chartPalettes[state.currentChartTheme] || chartPalettes.vibrant;

    state.chartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: `${yLabel} vs ${xLabel}`,
            data: scatterPoints,
            backgroundColor: theme.primaryBg,
            borderColor: theme.primary,
            borderWidth: 1.5,
            pointRadius: 6,
            pointHoverRadius: 8
          },
          {
            type: "line",
            label: `Trendline (r = ${rValue.toFixed(2)})`,
            data: trendlinePoints,
            borderColor: "#ef4444",
            borderWidth: 2,
            borderDash: [6, 6],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: textColor }
          },
          title: {
            display: true,
            text: `Scatter & Correlation: ${xLabel} vs ${yLabel}`,
            color: textColor,
            font: { size: 15, weight: "bold" }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `(${xLabel}: ${formatNumber(ctx.raw.x)}, ${yLabel}: ${formatNumber(ctx.raw.y)})`
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xLabel,
              color: textColor,
              font: { weight: "600" }
            },
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            title: {
              display: true,
              text: yLabel,
              color: textColor,
              font: { weight: "600" }
            },
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  function renderStandardChart(labels, data, label, type, options = {}) {
    destroyChart();
    const ctx = elements.chartCanvas.getContext("2d");
    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
    const theme = chartPalettes[state.currentChartTheme] || chartPalettes.vibrant;

    const isHorizontal = type === "horizontalBar";
    const actualType = isHorizontal ? "bar" : type;
    const isRadial = actualType === "pie" || actualType === "doughnut" || actualType === "polarArea";
    const isRadar = actualType === "radar";

    // Palette background and border assignment
    let backgroundColors;
    let borderColors;

    if (isRadial) {
      backgroundColors = labels.map((_, i) => theme.colors[i % theme.colors.length]);
      borderColors = isDark ? "#1e293b" : "#ffffff";
    } else if (isRadar) {
      backgroundColors = theme.primaryBg;
      borderColors = theme.primary;
    } else if (actualType === "bar") {
      if (options.isHistogram) {
        backgroundColors = theme.primaryBg;
        borderColors = theme.primary;
      } else {
        backgroundColors = labels.map((_, i) => theme.colors[i % theme.colors.length]);
        borderColors = labels.map((_, i) => theme.colors[i % theme.colors.length]);
      }
    } else {
      // line chart
      backgroundColors = theme.primaryBg;
      borderColors = theme.primary;
    }

    const chartConfig = {
      type: actualType,
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: actualType === "line" || isRadar ? 2.5 : 1.5,
            fill: actualType === "line" ? false : isRadar ? true : true,
            tension: 0.35,
            barPercentage: options.isHistogram ? 0.98 : 0.85,
            categoryPercentage: options.isHistogram ? 0.98 : 0.85
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? "y" : "x",
        plugins: {
          legend: {
            display: isRadial || isRadar,
            labels: { color: textColor }
          },
          title: {
            display: true,
            text: label,
            color: textColor,
            font: { size: 15, weight: "bold" }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw !== undefined ? formatNumber(ctx.raw) : "";
                if (options.isHistogram) {
                  const total = data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                  return `Count: ${val} rows (${pct}%)`;
                }
                return `${ctx.dataset.label}: ${val}`;
              }
            }
          }
        }
      }
    };

    // Configure scales depending on chart type
    if (isRadial) {
      chartConfig.options.scales = actualType === "polarArea" ? {
        r: {
          grid: { color: gridColor },
          ticks: { color: textColor, backdropColor: "transparent" }
        }
      } : {};
    } else if (isRadar) {
      chartConfig.options.scales = {
        r: {
          angleLines: { color: gridColor },
          grid: { color: gridColor },
          ticks: { color: textColor, backdropColor: "transparent" }
        }
      };
    } else {
      chartConfig.options.scales = {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
          beginAtZero: isHorizontal
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor },
          beginAtZero: !isHorizontal
        }
      };
    }

    state.chartInstance = new Chart(ctx, chartConfig);
  }

  function exportChartImage(format = "png") {
    if (!state.chartInstance || !elements.chartCanvas) {
      alert("No active chart to export.");
      return;
    }

    const canvas = elements.chartCanvas;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext("2d");

    const isDark = document.body.classList.contains("dark");
    exportCtx.fillStyle = isDark ? "#1e293b" : "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const ext = format === "jpeg" ? "jpg" : "png";
    const dataURL = exportCanvas.toDataURL(mime, 0.95);

    const colName = (elements.chartColumnSelect.value || elements.chartTypeSelect.value || "chart")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${colName}_visualization_${Date.now()}.${ext}`;

    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function destroyChart() {
    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }
  }

  /* ========================================================
     FEATURE: GROUP BY & PIVOT AGGREGATION
     ======================================================== */
  function runAggregation() {
    const groupByCol = elements.groupByColSelect.value;
    const aggCol = elements.aggColSelect.value;
    const aggFunc = elements.aggFuncSelect.value;

    if (!groupByCol || !aggCol || !state.filteredData.length) {
      elements.aggTableBody.innerHTML = `
        <tr><td colspan="4" class="table-placeholder">Select a group column and numeric column above to aggregate.</td></tr>
      `;
      elements.plotAggBtn.disabled = true;
      elements.exportAggBtn.disabled = true;
      state.aggregationResults = null;
      return;
    }

    const funcLabels = {
      sum: "Sum",
      avg: "Average",
      count: "Row Count",
      min: "Minimum",
      max: "Maximum",
      median: "Median"
    };

    elements.aggColHeader.textContent = `${funcLabels[aggFunc]} of ${aggCol}`;

    // Grouping
    const groups = {};
    state.filteredData.forEach((row) => {
      const rawCat = row[groupByCol];
      const cat = rawCat !== undefined && String(rawCat).trim() !== "" ? String(rawCat) : "(Empty)";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      const num = Number(row[aggCol]);
      if (!Number.isNaN(num) && String(row[aggCol]).trim() !== "") {
        groups[cat].push(num);
      }
    });

    // Compute aggregated value per group
    const results = [];
    Object.keys(groups).forEach((cat) => {
      const arr = groups[cat];
      let val = 0;
      if (arr.length > 0) {
        if (aggFunc === "sum") {
          val = arr.reduce((a, b) => a + b, 0);
        } else if (aggFunc === "avg") {
          val = arr.reduce((a, b) => a + b, 0) / arr.length;
        } else if (aggFunc === "count") {
          val = arr.length;
        } else if (aggFunc === "min") {
          val = Math.min(...arr);
        } else if (aggFunc === "max") {
          val = Math.max(...arr);
        } else if (aggFunc === "median") {
          const sorted = [...arr].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          val = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        }
      }
      results.push({
        group: cat,
        count: arr.length,
        value: val
      });
    });

    // Sort descending by value
    results.sort((a, b) => b.value - a.value);
    state.aggregationResults = {
      groupByCol,
      aggCol,
      aggFunc,
      data: results
    };

    const totalValue = results.reduce((acc, r) => acc + Math.abs(r.value), 0);

    // Render table
    elements.aggTableBody.innerHTML = "";
    results.forEach((row) => {
      const share = totalValue > 0 ? (Math.abs(row.value) / totalValue) * 100 : 0;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(row.group)}</strong></td>
        <td>${row.count.toLocaleString()}</td>
        <td><strong>${formatNumber(row.value)}</strong></td>
        <td>
          <div class="share-cell">
            <span>${share.toFixed(1)}%</span>
            <div class="share-bar-bg">
              <div class="share-bar-fill" style="width: ${Math.min(100, Math.max(2, share))}%;"></div>
            </div>
          </div>
        </td>
      `;
      elements.aggTableBody.appendChild(tr);
    });

    elements.plotAggBtn.disabled = false;
    elements.exportAggBtn.disabled = false;
  }

  function plotAggregationToChart() {
    if (!state.aggregationResults || !state.aggregationResults.data.length) return;

    elements.chartTypeSelect.value = "bar";
    handleChartTypeChange();

    const agg = state.aggregationResults;
    const labels = agg.data.map((r) => r.group);
    const data = agg.data.map((r) => r.value);
    const label = `${agg.aggFunc.toUpperCase()} of ${agg.aggCol} by ${agg.groupByCol}`;

    renderStandardChart(labels, data, label, "bar");

    // Scroll to chart smoothly
    document.querySelector(".chart-section").scrollIntoView({ behavior: "smooth" });
  }

  function exportAggregationCSV() {
    if (!state.aggregationResults || !state.aggregationResults.data.length) return;

    const exportRows = state.aggregationResults.data.map((r) => ({
      [state.aggregationResults.groupByCol]: r.group,
      "Record Count": r.count,
      [`${state.aggregationResults.aggFunc.toUpperCase()}_of_${state.aggregationResults.aggCol}`]: r.value
    }));

    const csv = Papa.unparse(exportRows);
    downloadFile(csv, `aggregation_${state.aggregationResults.groupByCol}.csv`, "text/csv;charset=utf-8;");
  }

  /* ========================================================
     FEATURE: DATA QUALITY & COLUMN PROFILER MODAL
     ======================================================== */
  function openProfilerModal() {
    if (!state.originalData.length) {
      alert("Please upload or load a CSV dataset first.");
      return;
    }

    const totalRows = state.originalData.length;
    const totalCols = state.allColumns.length;
    const totalCells = totalRows * totalCols;
    let missingCells = 0;

    elements.profilerTableBody.innerHTML = "";

    state.allColumns.forEach((col) => {
      const colValues = state.originalData.map((row) => row[col]);
      const missingCount = colValues.filter(
        (v) => v === undefined || v === null || String(v).trim() === ""
      ).length;
      missingCells += missingCount;

      const filledCount = totalRows - missingCount;
      const completenessPct = (filledCount / totalRows) * 100;
      const distinctCount = new Set(colValues.filter((v) => v !== undefined && String(v).trim() !== "")).size;

      // Inferred Type & Range/Summary
      const inferredType = inferColumnType(colValues);
      let summaryText = "-";

      if (inferredType === "numeric") {
        const nums = colValues
          .map((v) => Number(v))
          .filter((v) => !Number.isNaN(v) && String(v).trim() !== "");
        if (nums.length) {
          const min = Math.min(...nums);
          const max = Math.max(...nums);
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
          summaryText = `Min: ${formatNumber(min)} | Max: ${formatNumber(max)} | Avg: ${formatNumber(avg)}`;
        }
      } else {
        // Find most frequent value
        const counts = {};
        let topVal = "";
        let topFreq = 0;
        colValues.forEach((v) => {
          if (v !== undefined && String(v).trim() !== "") {
            counts[v] = (counts[v] || 0) + 1;
            if (counts[v] > topFreq) {
              topFreq = counts[v];
              topVal = v;
            }
          }
        });
        summaryText = topFreq > 0 ? `Top: "${topVal}" (${topFreq} rows)` : "All Empty";
      }

      const typeBadgeClass = `badge-type ${inferredType}`;
      const typeLabel = inferredType.charAt(0).toUpperCase() + inferredType.slice(1);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(col)}</strong></td>
        <td><span class="${typeBadgeClass}">${typeLabel}</span></td>
        <td>
          <div class="share-cell">
            <span>${completenessPct.toFixed(1)}%</span>
            <div class="share-bar-bg">
              <div class="share-bar-fill" style="width: ${completenessPct}%; background: ${completenessPct > 90 ? 'var(--success)' : completenessPct > 70 ? 'var(--warning)' : 'var(--danger)'};"></div>
            </div>
          </div>
        </td>
        <td>${missingCount.toLocaleString()}</td>
        <td>${distinctCount.toLocaleString()}</td>
        <td><small>${escapeHtml(summaryText)}</small></td>
      `;
      elements.profilerTableBody.appendChild(tr);
    });

    const overallPct = totalCells > 0 ? (((totalCells - missingCells) / totalCells) * 100).toFixed(1) : 0;
    elements.overallCompleteness.textContent = `${overallPct}%`;
    elements.profilerTotalCols.textContent = totalCols;
    elements.profilerTotalRows.textContent = totalRows.toLocaleString();
    elements.profilerTotalCells.textContent = totalCells.toLocaleString();
    elements.profilerMissingCells.textContent = missingCells.toLocaleString();

    elements.profilerModal.showModal();
  }

  function inferColumnType(values) {
    const nonEmpties = values.filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
    if (!nonEmpties.length) return "text";

    const numericCount = nonEmpties.filter((v) => !Number.isNaN(Number(v))).length;
    if (numericCount / nonEmpties.length >= 0.9) {
      return "numeric";
    }

    // Check date pattern (YYYY-MM-DD or MM/DD/YYYY)
    const dateCount = nonEmpties.filter((v) => !Number.isNaN(Date.parse(v)) && String(v).length >= 6).length;
    if (dateCount / nonEmpties.length >= 0.8) {
      return "date";
    }

    return "text";
  }

  /* ========================================================
     EXPORT & HELPERS
     ======================================================== */
  function exportFilteredCSV() {
    if (!state.filteredData.length) {
      alert("No filtered data to export.");
      return;
    }

    const csv = Papa.unparse(state.filteredData);
    downloadFile(csv, "filtered_data.csv", "text/csv;charset=utf-8;");
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("csvTheme", isDark ? "dark" : "light");
    elements.themeToggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";

    // Re-render chart to adapt colors
    if (elements.chartTypeSelect.value === "scatter") {
      updateScatterPlot();
    } else {
      updateChartAndStats();
    }
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem("csvTheme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      elements.themeToggleBtn.textContent = "☀️ Light Mode";
    }
  }

  function formatNumber(value) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return "-";
    }
    return Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});