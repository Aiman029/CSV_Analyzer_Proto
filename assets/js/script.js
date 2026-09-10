document.addEventListener("DOMContentLoaded", () => {
  const state = {
    originalData: [],
    filteredData: [],
    numericColumns: [],
    chartInstance: null,
    currentPage: 1,
    rowsPerPage: 5,
    currentSortColumn: "",
    currentSortDirection: "asc"
  };

  const elements = {
    csvFileInput: document.getElementById("csvFile"),
    dropZone: document.getElementById("dropZone"),
    searchInput: document.getElementById("searchInput"),
    filterColumn: document.getElementById("filterColumn"),
    filterValue: document.getElementById("filterValue"),
    resetBtn: document.getElementById("resetBtn"),
    exportBtn: document.getElementById("exportBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    chartColumnSelect: document.getElementById("chartColumnSelect"),
    chartTypeSelect: document.getElementById("chartTypeSelect"),
    totalRows: document.getElementById("totalRows"),
    totalColumns: document.getElementById("totalColumns"),
    numericColumnsCount: document.getElementById("numericColumnsCount"),
    selectedNumericColumn: document.getElementById("selectedNumericColumn"),
    minValue: document.getElementById("minValue"),
    maxValue: document.getElementById("maxValue"),
    avgValue: document.getElementById("avgValue"),
    tableHead: document.querySelector("#csvTable thead"),
    tableBody: document.querySelector("#csvTable tbody"),
    prevPageBtn: document.getElementById("prevPageBtn"),
    nextPageBtn: document.getElementById("nextPageBtn"),
    pageInfo: document.getElementById("pageInfo"),
    emptyMessage: document.getElementById("emptyMessage"),
    chartCanvas: document.getElementById("myChart")
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

    elements.searchInput.addEventListener("input", applyFilters);
    elements.filterColumn.addEventListener("change", applyFilters);
    elements.filterValue.addEventListener("input", applyFilters);
    elements.resetBtn.addEventListener("click", resetFilters);
    elements.exportBtn.addEventListener("click", exportFilteredCSV);
    elements.chartColumnSelect.addEventListener("change", updateChartAndStats);
    elements.chartTypeSelect.addEventListener("change", updateChartAndStats);
    elements.prevPageBtn.addEventListener("click", goToPreviousPage);
    elements.nextPageBtn.addEventListener("click", goToNextPage);
    elements.themeToggleBtn.addEventListener("click", toggleTheme);

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
        if (!results.data || !results.data.length) {
          alert("CSV file is empty or invalid.");
          return;
        }

        state.originalData = results.data.filter((row) =>
          Object.values(row).some((value) => String(value).trim() !== "")
        );

        state.filteredData = [...state.originalData];
        state.numericColumns = detectNumericColumns(state.originalData);
        state.currentPage = 1;
        state.currentSortColumn = "";
        state.currentSortDirection = "asc";

        populateFilterColumns();
        populateChartColumns();
        updateSummary();
        renderTable();
        updateChartAndStats();
      },
      error: function() {
        alert("Failed to parse CSV file.");
      }
    });
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

  function populateFilterColumns() {
    elements.filterColumn.innerHTML = `<option value="">Filter column</option>`;

    if (!state.originalData.length) return;

    const headers = Object.keys(state.originalData[0]);

    headers.forEach((header) => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = header;
      elements.filterColumn.appendChild(option);
    });
  }

  function populateChartColumns() {
    elements.chartColumnSelect.innerHTML = `<option value="">Select column for chart</option>`;

    if (!state.originalData.length) return;

    const headers = Object.keys(state.originalData[0]);

    headers.forEach((header) => {
      const option = document.createElement("option");
      option.value = header;
      option.textContent = state.numericColumns.includes(header)
        ? `${header} (Numeric)`
        : header;
      elements.chartColumnSelect.appendChild(option);
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

    updateSummary();
    renderTable();
    updateChartAndStats();
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

  function updateChartAndStats() {
    resetStats();

    const selectedColumn = elements.chartColumnSelect.value;
    const selectedChartType = elements.chartTypeSelect.value;

    if (!selectedColumn || !state.filteredData.length) {
      destroyChart();
      return;
    }

    if (state.numericColumns.includes(selectedColumn)) {
      elements.selectedNumericColumn.textContent = selectedColumn;
      updateNumericStats(selectedColumn);
      renderNumericChart(selectedColumn, detectChartType(selectedColumn, selectedChartType));
    } else {
      renderCategoryChart(selectedColumn, detectChartType(selectedColumn, selectedChartType));
    }
  }

  function detectChartType(column, selectedChartType) {
    if (selectedChartType !== "auto") {
      if (state.numericColumns.includes(column) && selectedChartType === "pie") {
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

  function updateNumericStats(column) {
    const values = state.filteredData
      .map((row) => Number(row[column]))
      .filter((value) => !Number.isNaN(value));

    if (!values.length) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

    elements.minValue.textContent = formatNumber(min);
    elements.maxValue.textContent = formatNumber(max);
    elements.avgValue.textContent = formatNumber(avg);
  }

  function renderNumericChart(column, chartType) {
    const values = state.filteredData
      .map((row) => Number(row[column]))
      .filter((value) => !Number.isNaN(value));

    const labels = values.map((_, index) => `Row ${index + 1}`);
    renderChart(labels, values, `${column} Distribution`, chartType);
  }

  function renderCategoryChart(column, chartType) {
    const counts = {};

    state.filteredData.forEach((row) => {
      const value = row[column] && String(row[column]).trim() !== "" ? row[column] : "Empty";
      counts[value] = (counts[value] || 0) + 1;
    });

    renderChart(
      Object.keys(counts),
      Object.values(counts),
      `Count by ${column}`,
      chartType
    );
  }

  function renderChart(labels, data, label, type) {
    destroyChart();

    const ctx = elements.chartCanvas.getContext("2d");

    state.chartInstance = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            borderWidth: 2,
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: label
          }
        },
        scales: type === "pie"
          ? {}
          : {
              y: {
                beginAtZero: true
              }
            }
      }
    });
  }

  function destroyChart() {
    if (state.chartInstance) {
      state.chartInstance.destroy();
      state.chartInstance = null;
    }
  }

  function resetStats() {
    elements.minValue.textContent = "-";
    elements.maxValue.textContent = "-";
    elements.avgValue.textContent = "-";
    elements.selectedNumericColumn.textContent = "-";
  }

  function exportFilteredCSV() {
    if (!state.filteredData.length) {
      alert("No filtered data to export.");
      return;
    }

    const csv = Papa.unparse(state.filteredData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "filtered_data.csv";
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
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem("csvTheme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      elements.themeToggleBtn.textContent = "☀️ Light Mode";
    }
  }

  function formatNumber(value) {
    return Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });
  }
});