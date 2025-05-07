document.addEventListener('DOMContentLoaded', function() {
    // ==================== HEADER FUNCTIONALITY ====================
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.style.transform = 'translateY(0)';
            return;
        }
        
        if (currentScroll > lastScroll) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });

    // Add hover effect to header
    header.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
    });

    header.addEventListener('mouseleave', function() {
        this.style.boxShadow = 'none';
    });

    // ==================== MAIN APPLICATION FUNCTIONALITY ====================
    // DOM Elements
    const dataInput = document.getElementById('dataInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const resetBtn = document.getElementById('resetBtn');
    const infoBtn = document.getElementById('infoBtn');
    const exportFreqBtn = document.getElementById('exportFreqBtn');
    const exportCumulBtn = document.getElementById('exportCumulBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    // Stats Elements
    const dataCountEl = document.getElementById('dataCount');
    const minValueEl = document.getElementById('minValue');
    const maxValueEl = document.getElementById('maxValue');
    const rangeValueEl = document.getElementById('rangeValue');
    const classCountEl = document.getElementById('classCount');
    const classWidthEl = document.getElementById('classWidth');
    
    // Chart instances
    let histogramChart = null;
    let polygonChart = null;
    let ogiveChart = null;
    let combinedChart = null;
    
    // Initialize modal
    const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    
    // Event Listeners
    calculateBtn.addEventListener('click', analyzeData);
    exampleBtn.addEventListener('click', loadExampleData);
    resetBtn.addEventListener('click', resetForm);
    infoBtn.addEventListener('click', () => infoModal.show());
    exportFreqBtn.addEventListener('click', () => exportTableToCSV('frequencyTable', 'distribusi_frekuensi.csv'));
    exportCumulBtn.addEventListener('click', () => exportTableToCSV('cumulativeTable', 'distribusi_kumulatif.csv'));
    
    // Parse input data
    function parseInputData(input) {
        return input.split(/[,\s]+/)
            .map(item => parseFloat(item.trim()))
            .filter(item => !isNaN(item));
    }
    
    // Analyze data
    function analyzeData() {
        const inputText = dataInput.value.trim();
        
        if (!inputText) {
            showAlert('warning', 'Masukkan data terlebih dahulu!');
            return;
        }
        
        const data = parseInputData(inputText);
        
        if (data.length === 0) {
            showAlert('danger', 'Tidak ada data numerik yang valid!');
            return;
        }
        
        // Calculate basic statistics
        const stats = calculateBasicStats(data);
        
        // Determine number of classes using Sturges' formula
        const classCount = Math.ceil(1 + 3.322 * Math.log10(data.length));
        
        // Calculate class width
        const classWidth = Math.ceil(stats.range / classCount);
        
        // Create class intervals
        const classIntervals = createClassIntervals(stats.min, classCount, classWidth);
        
        // Calculate frequency distribution
        const frequencyDistribution = calculateFrequencyDistribution(data, classIntervals);
        
        // Calculate cumulative distribution
        const cumulativeDistribution = calculateCumulativeDistribution(frequencyDistribution);
        
        // Display results
        displayResults(stats, classCount, classWidth, frequencyDistribution, cumulativeDistribution);
        
        // Create charts
        createCharts(frequencyDistribution, cumulativeDistribution);
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }
    
    // Calculate basic statistics
    function calculateBasicStats(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const count = data.length;
        
        return { min, max, range, count };
    }
    
    // Create class intervals
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
    
    // Calculate frequency distribution
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
    
    // Calculate cumulative distribution
    function calculateCumulativeDistribution(frequencyDistribution) {
        let cumulativeFrequency = 0;
        let cumulativeRelativeFrequency = 0;
        
        return frequencyDistribution.map(item => {
            cumulativeFrequency += item.frequency;
            cumulativeRelativeFrequency += item.relativeFrequency;
            
            return {
                lower: item.lower,
                upper: item.upper,
                cumulativeFrequency,
                cumulativeRelativeFrequency
            };
        });
    }
    
    // Display results
    function displayResults(stats, classCount, classWidth, frequencyDistribution, cumulativeDistribution) {
        // Update basic statistics
        dataCountEl.textContent = stats.count;
        minValueEl.textContent = stats.min;
        maxValueEl.textContent = stats.max;
        rangeValueEl.textContent = stats.range;
        classCountEl.textContent = classCount;
        classWidthEl.textContent = classWidth;
        
        // Update frequency table
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
        
        // Update cumulative table
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
    
    // Create charts
    function createCharts(frequencyDistribution, cumulativeDistribution) {
        // Prepare chart data
        const labels = frequencyDistribution.map(item => `${item.lower.toFixed(1)}-${item.upper.toFixed(1)}`);
        const midpoints = frequencyDistribution.map(item => item.midpoint);
        const frequencies = frequencyDistribution.map(item => item.frequency);
        const cumulativeFrequencies = cumulativeDistribution.map(item => item.cumulativeFrequency);
        
        // Colors
        const primaryColor = '#0d6efd';
        const secondaryColor = '#6c757d';
        const tertiaryColor = '#198754';
        const backgroundColor = 'rgba(13, 110, 253, 0.1)';
        
        // Destroy existing charts
        if (histogramChart) histogramChart.destroy();
        if (polygonChart) polygonChart.destroy();
        if (ogiveChart) ogiveChart.destroy();
        if (combinedChart) combinedChart.destroy();
        
        // Get canvas contexts
        const histogramCtx = document.getElementById('histogramChart').getContext('2d');
        const polygonCtx = document.getElementById('polygonChart').getContext('2d');
        const ogiveCtx = document.getElementById('ogiveChart').getContext('2d');
        const combinedCtx = document.getElementById('combinedChart').getContext('2d');
        
        // 1. Histogram Chart
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
            options: getChartOptions('Histogram Distribusi Frekuensi')
        });
        
        // 2. Polygon Chart
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
            options: getChartOptions('Poligon Distribusi Frekuensi')
        });
        
        // 3. Ogive Chart
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
            options: getChartOptions('Ogive (Frekuensi Kumulatif)')
        });
        
        // 4. Combined Chart
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
                        borderWidth: 1
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
                        pointRadius: 5
                    },
                    {
                        label: 'Ogive',
                        data: cumulativeFrequencies,
                        borderColor: tertiaryColor,
                        borderWidth: 2,
                        type: 'line',
                        tension: 0.3,
                        pointBackgroundColor: tertiaryColor,
                        pointRadius: 5
                    }
                ]
            },
            options: getChartOptions('Kombinasi Histogram, Poligon, dan Ogive')
        });
    }
    
    // Common chart options
    function getChartOptions(title) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frekuensi',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Interval Kelas',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        };
    }
    
    // Load example data
    function loadExampleData() {
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
    
    // Reset form
    function resetForm() {
        dataInput.value = '';
        resultsSection.style.display = 'none';
        
        // Reset charts
        if (histogramChart) {
            histogramChart.destroy();
            histogramChart = null;
        }
        if (polygonChart) {
            polygonChart.destroy();
            polygonChart = null;
        }
        if (ogiveChart) {
            ogiveChart.destroy();
            ogiveChart = null;
        }
        if (combinedChart) {
            combinedChart.destroy();
            combinedChart = null;
        }
        
        // Reset tables
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
        
        // Reset statistics
        dataCountEl.textContent = '0';
        minValueEl.textContent = '-';
        maxValueEl.textContent = '-';
        rangeValueEl.textContent = '-';
        classCountEl.textContent = '-';
        classWidthEl.textContent = '-';
        
        showAlert('info', 'Form telah direset.');
    }
    
    // Export table to CSV
    function exportTableToCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tr');
        if (rows.length <= 1) {
            showAlert('warning', 'Tidak ada data untuk diekspor!');
            return;
        }
        
        let csv = [];
        
        // Add headers
        const headers = [];
        table.querySelectorAll('th').forEach(th => {
            headers.push(th.textContent.trim());
        });
        csv.push(headers.join(','));
        
        // Add data
        table.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach(td => {
                row.push(td.textContent.trim());
            });
            csv.push(row.join(','));
        });
        
        // Create CSV file
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Show alert
    function showAlert(type, message) {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
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
