document.addEventListener('DOMContentLoaded', function() {
    // ==================== GLOBAL VARIABLES ====================
    let currentData = [];
    let frequencyDistribution = [];
    let cumulativeDistribution = [];
    let stats = {};
    let isGroupedData = false;
    
    // Chart instances
    let histogramChart = null;
    let polygonChart = null;
    let ogiveChart = null;
    let pieChart = null;
    let combinedChart = null;
    
    // DOM Elements
    const dataInput = document.getElementById('dataInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const importBtn = document.getElementById('importBtn');
    const resetBtn = document.getElementById('resetBtn');
    const infoBtn = document.getElementById('infoBtn');
    const themeToggle = document.getElementById('themeToggle');
    const exportFreqBtn = document.getElementById('exportFreqBtn');
    const exportCumulBtn = document.getElementById('exportCumulBtn');
    const saveFreqBtn = document.getElementById('saveFreqBtn');
    const saveCumulBtn = document.getElementById('saveCumulBtn');
    const calculateZScore = document.getElementById('calculateZScore');
    const resultsSection = document.getElementById('resultsSection');
    const loadingSection = document.getElementById('loadingSection');
    const loadingProgress = document.getElementById('loadingProgress');
    const groupedDataToggle = document.getElementById('groupedDataToggle');
    const singleDataInput = document.getElementById('singleDataInput');
    const groupedDataInput = document.getElementById('groupedDataInput');
    const classIntervals = document.getElementById('classIntervals');
    const frequencies = document.getElementById('frequencies');
    
    // Stats Elements
    const dataCountEl = document.getElementById('dataCount');
    const minValueEl = document.getElementById('minValue');
    const maxValueEl = document.getElementById('maxValue');
    const rangeValueEl = document.getElementById('rangeValue');
    const meanValueEl = document.getElementById('meanValue');
    const medianValueEl = document.getElementById('medianValue');
    const modusValueEl = document.getElementById('modusValue');
    const stdDevValueEl = document.getElementById('stdDevValue');
    const varianceValueEl = document.getElementById('varianceValue');
    const classCountEl = document.getElementById('classCount');
    const classWidthEl = document.getElementById('classWidth');
    const sumValueEl = document.getElementById('sumValue');
    const zscoreResult = document.getElementById('zscoreResult');
    const zscoreInterpretation = document.getElementById('zscoreInterpretation');
    
    // Initialize modals
    const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    const importModal = new bootstrap.Modal(document.getElementById('importModal'));
    
    // ==================== THEME TOGGLE ====================
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDarkMode ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
        localStorage.setItem('darkMode', isDarkMode);
        updateChartsTheme();
    }
    
    function updateChartsTheme() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#f8f9fa' : '#212529';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        const updateOptions = {
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        };
        
        if (histogramChart) histogramChart.update();
        if (polygonChart) polygonChart.update();
        if (ogiveChart) ogiveChart.update();
        if (pieChart) pieChart.update();
        if (combinedChart) combinedChart.update();
    }
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    }
    
    // ==================== EVENT LISTENERS ====================
    calculateBtn.addEventListener('click', analyzeData);
    exampleBtn.addEventListener('click', loadExampleData);
    importBtn.addEventListener('click', () => importModal.show());
    resetBtn.addEventListener('click', resetForm);
    infoBtn.addEventListener('click', () => infoModal.show());
    themeToggle.addEventListener('click', toggleTheme);
    exportFreqBtn.addEventListener('click', () => exportTableToCSV('frequencyTable', 'distribusi_frekuensi.csv'));
    exportCumulBtn.addEventListener('click', () => exportTableToCSV('cumulativeTable', 'distribusi_kumulatif.csv'));
    saveFreqBtn.addEventListener('click', () => saveAnalysis('frequency'));
    saveCumulBtn.addEventListener('click', () => saveAnalysis('cumulative'));
    calculateZScore.addEventListener('click', calculateZScoreValue);
    document.getElementById('confirmImport').addEventListener('click', importDataFromFile);
    groupedDataToggle.addEventListener('change', toggleGroupedData);
    
    function toggleGroupedData() {
        isGroupedData = this.checked;
        singleDataInput.style.display = isGroupedData ? 'none' : 'block';
        groupedDataInput.style.display = isGroupedData ? 'block' : 'none';
    }
    
    // ==================== DATA PROCESSING FUNCTIONS ====================
    function parseInputData(input) {
        return input.split(/[,\s\n]+/)
            .map(item => parseFloat(item.trim()))
            .filter(item => !isNaN(item));
    }
    
    function analyzeData() {
        if (isGroupedData) {
            analyzeGroupedData();
        } else {
            analyzeUngroupedData();
        }
    }
    
    function analyzeUngroupedData() {
        const inputText = dataInput.value.trim();
        
        if (!inputText) {
            showAlert('warning', 'Masukkan data terlebih dahulu!');
            return;
        }
        
        loadingSection.style.display = 'block';
        resultsSection.style.display = 'none';
        simulateProgress();
        
        currentData = parseInputData(inputText);
        
        if (currentData.length === 0) {
            hideLoading();
            showAlert('danger', 'Tidak ada data numerik yang valid!');
            return;
        }
        
        setTimeout(() => {
            stats = calculateBasicStats(currentData);
            const advancedStats = calculateAdvancedStats(currentData);
            stats = { ...stats, ...advancedStats };
            
            const classCount = Math.ceil(1 + 3.322 * Math.log10(currentData.length));
            const classWidth = Math.ceil(stats.range / classCount);
            const classIntervals = createClassIntervals(stats.min, classCount, classWidth);
            
            frequencyDistribution = calculateFrequencyDistribution(currentData, classIntervals);
            cumulativeDistribution = calculateCumulativeDistribution(frequencyDistribution);
            
            displayResults(stats, classCount, classWidth, frequencyDistribution, cumulativeDistribution);
            createCharts(frequencyDistribution, cumulativeDistribution);
            
            hideLoading();
            resultsSection.style.display = 'block';
            
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
            
            localStorage.setItem('lastAnalysis', JSON.stringify({
                data: currentData,
                stats: stats,
                frequencyDistribution: frequencyDistribution,
                cumulativeDistribution: cumulativeDistribution,
                isGroupedData: false
            }));
            
            showAlert('success', 'Analisis data berhasil!');
        }, 1500);
    }
    
    function analyzeGroupedData() {
        const intervalsText = classIntervals.value.trim();
        const frequenciesText = frequencies.value.trim();
        
        if (!intervalsText || !frequenciesText) {
            showAlert('warning', 'Masukkan interval kelas dan frekuensi terlebih dahulu!');
            return;
        }
        
        const intervalLines = intervalsText.split('\n');
        const parsedIntervals = [];
        
        for (const line of intervalLines) {
            const parts = line.trim().split(/[,\s-]+/);
            if (parts.length >= 2) {
                const lower = parseFloat(parts[0]);
                const upper = parseFloat(parts[1]);
                if (!isNaN(lower) && !isNaN(upper)) {
                    parsedIntervals.push({
                        lower: lower,
                        upper: upper,
                        midpoint: (lower + upper) / 2
                    });
                }
            }
        }
        
        if (parsedIntervals.length === 0) {
            showAlert('danger', 'Tidak ada interval kelas yang valid!');
            return;
        }
        
        const freqValues = parseInputData(frequenciesText);
        
        if (freqValues.length !== parsedIntervals.length) {
            showAlert('danger', 'Jumlah frekuensi harus sama dengan jumlah interval kelas!');
            return;
        }
        
        loadingSection.style.display = 'block';
        resultsSection.style.display = 'none';
        simulateProgress();
        
        setTimeout(() => {
            currentData = [];
            
            frequencyDistribution = parsedIntervals.map((interval, index) => ({
                ...interval,
                frequency: freqValues[index],
                relativeFrequency: (freqValues[index] / freqValues.reduce((a, b) => a + b, 0)) * 100
            }));
            
            cumulativeDistribution = calculateCumulativeDistribution(frequencyDistribution);
            stats = calculateGroupedStats(frequencyDistribution);
            
            displayResults(stats, 
                frequencyDistribution.length, 
                frequencyDistribution[0].upper - frequencyDistribution[0].lower,
                frequencyDistribution,
                cumulativeDistribution);
            
            createCharts(frequencyDistribution, cumulativeDistribution);
            
            hideLoading();
            resultsSection.style.display = 'block';
            
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
            
            localStorage.setItem('lastAnalysis', JSON.stringify({
                data: currentData,
                stats: stats,
                frequencyDistribution: frequencyDistribution,
                cumulativeDistribution: cumulativeDistribution,
                isGroupedData: true
            }));
            
            showAlert('success', 'Analisis data berkelompok berhasil!');
        }, 1500);
    }
    
    function calculateGroupedStats(frequencyDistribution) {
        const totalFrequency = frequencyDistribution.reduce((sum, item) => sum + item.frequency, 0);
        const mean = frequencyDistribution.reduce((sum, item) => 
            sum + (item.midpoint * item.frequency), 0) / totalFrequency;
        
        const variance = frequencyDistribution.reduce((sum, item) => 
            sum + (Math.pow(item.midpoint - mean, 2) * item.frequency), 0) / totalFrequency;
        const stdDev = Math.sqrt(variance);
        
        let medianClass = null;
        let cumulativeFreq = 0;
        const medianPos = totalFrequency / 2;
        
        for (const item of frequencyDistribution) {
            cumulativeFreq += item.frequency;
            if (cumulativeFreq >= medianPos && !medianClass) {
                medianClass = item;
                break;
            }
        }
        
        const F = cumulativeFreq - medianClass.frequency;
        const f = medianClass.frequency;
        const L = medianClass.lower;
        const c = medianClass.upper - medianClass.lower;
        const median = L + ((medianPos - F) / f) * c;
        
        const modalClass = frequencyDistribution.reduce((prev, current) => 
            (prev.frequency > current.frequency) ? prev : current);
        
        const d1 = modalClass.frequency - (frequencyDistribution[modalClass - 1]?.frequency || 0);
        const d2 = modalClass.frequency - (frequencyDistribution[modalClass + 1]?.frequency || 0);
        const LMode = modalClass.lower;
        const mode = LMode + (d1 / (d1 + d2)) * c;
        
        return {
            min: frequencyDistribution[0].lower,
            max: frequencyDistribution[frequencyDistribution.length - 1].upper,
            range: frequencyDistribution[frequencyDistribution.length - 1].upper - frequencyDistribution[0].lower,
            count: totalFrequency,
            sum: frequencyDistribution.reduce((sum, item) => sum + (item.midpoint * item.frequency), 0),
            mean: mean,
            median: median,
            modus: mode.toFixed(2),
            variance: variance,
            stdDev: stdDev
        };
    }
    
    function calculateBasicStats(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const count = data.length;
        const sum = data.reduce((a, b) => a + b, 0);
        
        return { min, max, range, count, sum };
    }
    
    function calculateAdvancedStats(data) {
        const sortedData = [...data].sort((a, b) => a - b);
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        
        const mid = Math.floor(data.length / 2);
        const median = data.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2;
        
        const frequencyMap = {};
        data.forEach(num => {
            frequencyMap[num] = (frequencyMap[num] || 0) + 1;
        });
        
        let modes = [];
        let maxFrequency = 0;
        for (const num in frequencyMap) {
            if (frequencyMap[num] > maxFrequency) {
                modes = [Number(num)];
                maxFrequency = frequencyMap[num];
            } else if (frequencyMap[num] === maxFrequency) {
                modes.push(Number(num));
            }
        }
        
        const modus = modes.length === data.length ? 'Tidak ada modus' : modes.join(', ');
        
        const squaredDiffs = data.map(num => Math.pow(num - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
        const stdDev = Math.sqrt(variance);
        
        return { mean, median, modus, variance, stdDev };
    }
    
    function createClassIntervals(min, classCount, classWidth) {
        const intervals = [];
        let lowerBound = min;
        
        for (let i = 0; i < classCount; i++) {
            const upperBound = lowerBound + classWidth;
            intervals.push({
                lower: lowerBound,
                upper: upperBound,
                midpoint: (lowerBound + upperBound) / 2
            });
            lowerBound = upperBound;
        }
        
        return intervals;
    }
    
    function calculateFrequencyDistribution(data, intervals) {
        return intervals.map(interval => {
            const frequency = data.filter(value => 
                value >= interval.lower && (interval.upper ? value < interval.upper : true)
            ).length;
            
            return {
                ...interval,
                frequency,
                relativeFrequency: (frequency / data.length) * 100
            };
        });
    }
    
    function calculateCumulativeDistribution(frequencyDistribution) {
        let cumulativeFrequency = 0;
        let cumulativeRelativeFrequency = 0;
        
        return frequencyDistribution.map(item => {
            cumulativeFrequency += item.frequency;
            cumulativeRelativeFrequency += item.relativeFrequency;
            
            return {
                ...item,
                cumulativeFrequency,
                cumulativeRelativeFrequency
            };
        });
    }
    
    function simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            loadingProgress.style.width = `${progress}%`;
        }, 200);
    }
    
    function hideLoading() {
        loadingSection.style.display = 'none';
        loadingProgress.style.width = '0%';
    }
    
    // ==================== DISPLAY FUNCTIONS ====================
    function displayResults(stats, classCount, classWidth, frequencyDistribution, cumulativeDistribution) {
        dataCountEl.textContent = stats.count;
        minValueEl.textContent = stats.min.toFixed(2);
        maxValueEl.textContent = stats.max.toFixed(2);
        rangeValueEl.textContent = stats.range.toFixed(2);
        meanValueEl.textContent = stats.mean.toFixed(2);
        medianValueEl.textContent = stats.median.toFixed(2);
        modusValueEl.textContent = stats.modus;
        stdDevValueEl.textContent = stats.stdDev.toFixed(2);
        varianceValueEl.textContent = stats.variance.toFixed(2);
        classCountEl.textContent = classCount;
        classWidthEl.textContent = classWidth;
        sumValueEl.textContent = stats.sum.toFixed(2);
        
        updateFrequencyTable(frequencyDistribution);
        updateCumulativeTable(cumulativeDistribution);
    }
    
    function updateFrequencyTable(frequencyDistribution) {
        const freqTableBody = document.querySelector('#frequencyTable tbody');
        freqTableBody.innerHTML = '';
        
        frequencyDistribution.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.lower.toFixed(1)} - ${item.upper.toFixed(1)}</td>
                <td>${item.midpoint.toFixed(1)}</td>
                <td>${item.frequency}</td>
                <td>${item.relativeFrequency.toFixed(2)}%</td>
            `;
            
            freqTableBody.appendChild(row);
        });
    }
    
    function updateCumulativeTable(cumulativeDistribution) {
        const cumulTableBody = document.querySelector('#cumulativeTable tbody');
        cumulTableBody.innerHTML = '';
        
        cumulativeDistribution.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.lower.toFixed(1)} - ${item.upper.toFixed(1)}</td>
                <td>${item.cumulativeFrequency}</td>
                <td>${item.cumulativeRelativeFrequency.toFixed(2)}%</td>
            `;
            
            cumulTableBody.appendChild(row);
        });
    }
    
    // ==================== CHART FUNCTIONS ====================
    function createCharts(frequencyDistribution, cumulativeDistribution) {
        const labels = frequencyDistribution.map(item => `${item.lower.toFixed(1)}-${item.upper.toFixed(1)}`);
        const midpoints = frequencyDistribution.map(item => item.midpoint);
        const frequencies = frequencyDistribution.map(item => item.frequency);
        const relativeFrequencies = frequencyDistribution.map(item => item.relativeFrequency);
        const cumulativeFrequencies = cumulativeDistribution.map(item => item.cumulativeFrequency);
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#f8f9fa' : '#212529';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        const primaryColor = '#0d6efd';
        const secondaryColor = '#6c757d';
        const tertiaryColor = '#198754';
        const backgroundColor = 'rgba(13, 110, 253, 0.1)';
        
        if (histogramChart) histogramChart.destroy();
        if (polygonChart) polygonChart.destroy();
        if (ogiveChart) ogiveChart.destroy();
        if (pieChart) pieChart.destroy();
        if (combinedChart) combinedChart.destroy();
        
        const histogramCtx = document.getElementById('histogramChart').getContext('2d');
        const polygonCtx = document.getElementById('polygonChart').getContext('2d');
        const ogiveCtx = document.getElementById('ogiveChart').getContext('2d');
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        const combinedCtx = document.getElementById('combinedChart').getContext('2d');
        
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frekuensi',
                        font: { weight: 'bold' },
                        color: textColor
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Interval Kelas',
                        font: { weight: 'bold' },
                        color: textColor
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '',
                    font: { size: 16 },
                    color: textColor
                },
                legend: {
                    position: 'top',
                    labels: { color: textColor }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        };
        
        // Histogram Chart
        histogramChart = new Chart(histogramCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frekuensi',
                    data: frequencies,
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    borderWidth: 1
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Histogram Distribusi Frekuensi'
                    }
                }
            }
        });
        
        // Polygon Chart
        polygonChart = new Chart(polygonCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frekuensi',
                    data: frequencies,
                    backgroundColor: backgroundColor,
                    borderColor: primaryColor,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: primaryColor,
                    pointRadius: 5
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Poligon Distribusi Frekuensi'
                    }
                }
            }
        });
        
        // Ogive Chart
        ogiveChart = new Chart(ogiveCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frekuensi Kumulatif',
                    data: cumulativeFrequencies,
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    borderColor: tertiaryColor,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: tertiaryColor,
                    pointRadius: 5
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Ogive (Frekuensi Kumulatif)'
                    }
                }
            }
        });
        
        // Pie Chart
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: relativeFrequencies,
                    backgroundColor: [
                        '#0d6efd', '#6610f2', '#6f42c1', '#d63384', 
                        '#fd7e14', '#ffc107', '#198754', '#20c997', 
                        '#0dcaf0', '#6c757d', '#343a40', '#adb5bd'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Pie Chart Frekuensi Relatif'
                    }
                }
            }
        });
        
        // Combined Chart
        combinedChart = new Chart(combinedCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Histogram',
                        data: frequencies,
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Poligon',
                        data: frequencies,
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        borderColor: secondaryColor,
                        borderWidth: 2,
                        type: 'line',
                        tension: 0.3,
                        pointBackgroundColor: secondaryColor,
                        pointRadius: 5,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Ogive',
                        data: cumulativeFrequencies,
                        borderColor: tertiaryColor,
                        borderWidth: 2,
                        type: 'line',
                        tension: 0.3,
                        pointBackgroundColor: tertiaryColor,
                        pointRadius: 5,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        ...commonOptions.plugins.title,
                        text: 'Kombinasi Histogram, Poligon, dan Ogive'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Frekuensi',
                            color: textColor
                        },
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Frekuensi Kumulatif',
                            color: textColor
                        },
                        ticks: { color: textColor },
                        grid: { drawOnChartArea: false }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    function loadExampleData() {
        if (isGroupedData) {
            const exampleIntervals = `85-96\n97-108\n109-120\n121-132\n133-144\n145-156`;
            const exampleFrequencies = `6, 3, 12, 9, 10, 5`;
            
            classIntervals.value = exampleIntervals;
            frequencies.value = exampleFrequencies;
            showAlert('success', 'Contoh data berkelompok telah dimuat. Klik "Analisis Data" untuk melihat hasil.');
        } else {
            const exampleData = [
                96, 139, 112, 118, 94, 93, 142, 135,
                136, 127, 88, 94, 132, 125, 119, 117,
                107, 111, 143, 148, 127, 125, 125, 120,
                117, 95, 155, 104, 103, 97, 113, 155,
                106, 113, 156, 96, 103, 139, 124, 120,
                108, 112, 134, 138, 89
            ];
            
            dataInput.value = exampleData.join(', ');
            showAlert('success', 'Contoh data telah dimuat. Klik "Analisis Data" untuk melihat hasil.');
        }
    }
    
    function resetForm() {
        dataInput.value = '';
        classIntervals.value = '';
        frequencies.value = '';
        resultsSection.style.display = 'none';
        
        [histogramChart, polygonChart, ogiveChart, pieChart, combinedChart].forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        
        document.querySelector('#frequencyTable tbody').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-5">
                    <i class="bi bi-arrow-repeat fs-1 text-primary loading-icon"></i>
                    <p class="mt-2">Data akan muncul setelah analisis</p>
                </td>
            </tr>
        `;
        
        document.querySelector('#cumulativeTable tbody').innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-5">
                    <i class="bi bi-arrow-repeat fs-1 text-primary loading-icon"></i>
                    <p class="mt-2">Data akan muncul setelah analisis</p>
                </td>
            </tr>
        `;
        
        dataCountEl.textContent = '0';
        minValueEl.textContent = '-';
        maxValueEl.textContent = '-';
        rangeValueEl.textContent = '-';
        meanValueEl.textContent = '-';
        medianValueEl.textContent = '-';
        modusValueEl.textContent = '-';
        stdDevValueEl.textContent = '-';
        varianceValueEl.textContent = '-';
        classCountEl.textContent = '-';
        classWidthEl.textContent = '-';
        sumValueEl.textContent = '-';
        zscoreResult.textContent = '-';
        zscoreInterpretation.textContent = 'Masukkan nilai dan klik hitung';
        
        localStorage.removeItem('lastAnalysis');
        showAlert('info', 'Form telah direset.');
    }
    
    function exportTableToCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tr');
        if (rows.length <= 1) {
            showAlert('warning', 'Tidak ada data untuk diekspor!');
            return;
        }
        
        let csv = [];
        const headers = [];
        table.querySelectorAll('th').forEach(th => {
            headers.push(th.textContent.trim());
        });
        csv.push(headers.join(','));
        
        table.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach(td => {
                row.push(td.textContent.trim());
            });
            csv.push(row.join(','));
        });
        
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('success', `File ${filename} berhasil diunduh!`);
    }
    
    function saveAnalysis(type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `analisis_${type}_${timestamp}.json`;
        
        let dataToSave;
        if (type === 'frequency') {
            dataToSave = {
                type: 'frequency',
                data: frequencyDistribution,
                stats: stats
            };
        } else {
            dataToSave = {
                type: 'cumulative',
                data: cumulativeDistribution,
                stats: stats
            };
        }
        
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('success', `Analisis ${type} berhasil disimpan!`);
    }
    
    function calculateZScoreValue() {
        if (!stats.mean || !stats.stdDev) {
            showAlert('warning', 'Harap analisis data terlebih dahulu!');
            return;
        }
        
        const value = parseFloat(document.getElementById('zscoreValue').value);
        if (isNaN(value)) {
            showAlert('warning', 'Masukkan nilai yang valid!');
            return;
        }
        
        const zScore = (value - stats.mean) / stats.stdDev;
        zscoreResult.textContent = zScore.toFixed(4);
        
        let interpretation = '';
        const absZ = Math.abs(zScore);
        if (absZ < 1) interpretation = 'Nilai berada dalam 1 standar deviasi dari mean (68% data)';
        else if (absZ < 2) interpretation = 'Nilai berada dalam 2 standar deviasi dari mean (95% data)';
        else if (absZ < 3) interpretation = 'Nilai berada dalam 3 standar deviasi dari mean (99.7% data)';
        else interpretation = 'Nilai berada di luar 3 standar deviasi dari mean (ekstrim)';
        
        zscoreInterpretation.textContent = interpretation;
    }
    
    function importDataFromFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showAlert('warning', 'Pilih file terlebih dahulu!');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                let data = [];
                const content = e.target.result;
                
                if (file.name.endsWith('.csv')) {
                    const lines = content.split('\n');
                    lines.forEach(line => {
                        const values = line.split(',');
                        values.forEach(val => {
                            const num = parseFloat(val.trim());
                            if (!isNaN(num)) data.push(num);
                        });
                    });
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const workbook = XLSX.read(content, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
                    jsonData.forEach(row => {
                        if (Array.isArray(row)) {
                            row.forEach(cell => {
                                const num = parseFloat(cell);
                                if (!isNaN(num)) data.push(num);
                            });
                        }
                    });
                }
                
                if (data.length > 0) {
                    if (isGroupedData) {
                        showAlert('warning', 'Import data hanya tersedia untuk data tunggal. Silakan nonaktifkan mode data berkelompok.');
                    } else {
                        dataInput.value = data.join(', ');
                        importModal.hide();
                        showAlert('success', `Berhasil mengimpor ${data.length} data!`);
                    }
                } else {
                    showAlert('warning', 'Tidak ditemukan data numerik dalam file!');
                }
            } catch (error) {
                console.error('Error processing file:', error);
                showAlert('danger', 'Gagal memproses file!');
            }
        };
        
        reader.onerror = function() {
            showAlert('danger', 'Error membaca file!');
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    }
    
    function showAlert(type, message) {
        Swal.fire({
            icon: type,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : 'white',
            color: document.body.classList.contains('dark-mode') ? 'white' : '#212529'
        });
    }
    
    // ==================== INITIALIZATION ====================
    const savedAnalysis = localStorage.getItem('lastAnalysis');
    if (savedAnalysis) {
        try {
            const analysis = JSON.parse(savedAnalysis);
            currentData = analysis.data;
            stats = analysis.stats;
            frequencyDistribution = analysis.frequencyDistribution;
            cumulativeDistribution = analysis.cumulativeDistribution;
            isGroupedData = analysis.isGroupedData || false;
            
            groupedDataToggle.checked = isGroupedData;
            singleDataInput.style.display = isGroupedData ? 'none' : 'block';
            groupedDataInput.style.display = isGroupedData ? 'block' : 'none';
            
            if (isGroupedData) {
                const intervalsText = frequencyDistribution.map(item => 
                    `${item.lower.toFixed(1)}-${item.upper.toFixed(1)}`).join('\n');
                const frequenciesText = frequencyDistribution.map(item => 
                    item.frequency).join(', ');
                
                classIntervals.value = intervalsText;
                frequencies.value = frequenciesText;
            } else {
                dataInput.value = currentData.join(', ');
            }
            
            displayResults(stats, 
                analysis.frequencyDistribution.length, 
                analysis.frequencyDistribution[0].upper - analysis.frequencyDistribution[0].lower,
                frequencyDistribution,
                cumulativeDistribution);
            createCharts(frequencyDistribution, cumulativeDistribution);
            resultsSection.style.display = 'block';
            
            showAlert('info', 'Analisis sebelumnya telah dimuat. Anda bisa mengubah data atau klik "Analisis Data" untuk memproses ulang.');
        } catch (e) {
            console.error('Error loading saved analysis:', e);
            localStorage.removeItem('lastAnalysis');
        }
    }
    
    // Add hover effects to stat items
    document.querySelectorAll('.stat-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.1)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // Logo hover animation
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('mouseenter', function() {
            this.style.transform = 'rotate(5deg) scale(1.1)';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }
});