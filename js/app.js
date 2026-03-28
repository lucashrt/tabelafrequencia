class FrequencyTable {
    constructor() {
        this.data = [];
        this.table = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Enter key para adicionar número
        document.getElementById('numberInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addNumber();
        });

        // Arquivo CSV carregado
        document.getElementById('csvFile').addEventListener('change', (e) => {
            this.handleCSVFileSelect(e);
        });
    }

    addNumber() {
        const input = document.getElementById('numberInput');
        const value = input.value.trim();

        if (value === '') {
            alert('Por favor, insira um número válido');
            return;
        }

        const number = parseFloat(value);

        if (isNaN(number)) {
            alert('Valor inválido! Insira um número.');
            input.focus();
            return;
        }

        this.data.push(number);
        input.value = '';
        input.focus();
        this.updateDataPreview();
    }

    clearData() {
        if (this.data.length === 0) {
            alert('Nenhum dado para limpar');
            return;
        }

        if (confirm('Tem certeza que deseja limpar todos os dados?')) {
            this.data = [];
            this.updateDataPreview();
            document.getElementById('csvFile').value = '';
        }
    }

    updateDataPreview() {
        const preview = document.getElementById('dataPreview');

        if (this.data.length === 0) {
            preview.innerHTML = '<span class="text-muted">Nenhum dado adicionado</span>';
            return;
        }

        const html = `
            <div class="d-flex flex-wrap gap-2">
                ${this.data.map((num, idx) => `
                    <span class="badge bg-primary" onclick="deleteDataItem(${idx})">
                        ${num} <i class="bi bi-x ms-1" style="cursor:pointer;"></i>
                    </span>
                `).join('')}
            </div>
            <small class="d-block text-muted mt-2">${this.data.length} valor(es) adicionado(s)</small>
        `;
        preview.innerHTML = html;
    }

    deleteDataItem(index) {
        this.data.splice(index, 1);
        this.updateDataPreview();
    }

    handleCSVFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const numbers = this.parseCSV(content);

                if (numbers.length === 0) {
                    alert('Nenhum número válido encontrado no CSV');
                    document.getElementById('csvFile').value = '';
                    return;
                }

                // Importa automaticamente
                this.data = [...numbers];
                this.updateDataPreview();

                // Mostra mensagem de sucesso
                const successAlert = document.getElementById('csvSuccess');
                const successText = document.getElementById('csvSuccessText');
                successText.textContent = `${numbers.length} número(s) carregado(s) com sucesso!`;
                successAlert.style.display = 'block';

                // Remove mensagem após 4 segundos
                setTimeout(() => {
                    successAlert.style.display = 'none';
                }, 4000);

            } catch (error) {
                alert('Erro ao processar CSV: ' + error.message);
                document.getElementById('csvFile').value = '';
            }
        };
        reader.readAsText(file);
    }

    parseCSV(content) {
        const lines = content.split('\n');
        const numbers = [];

        for (let line of lines) {
            line = line.trim();
            if (line === '') continue;

            // Tenta separadores comuns: vírgula, ponto-e-vírgula, espaço, tab
            const values = line.split(/[,;\s\t]+/);

            for (let val of values) {
                val = val.trim();
                if (val !== '') {
                    const num = parseFloat(val.replace(',', '.'));
                    if (!isNaN(num)) {
                        numbers.push(num);
                    }
                }
            }
        }

        return numbers;
    }

    generateTable() {
        if (this.data.length === 0) {
            alert('Por favor, insira dados antes de gerar a tabela');
            return;
        }

        if (this.data.length < 3) {
            alert('É recomendado ter pelo menos 3 valores para gerar uma tabela significativa');
        }

        // Ordena os dados
        const sortedData = [...this.data].sort((a, b) => a - b);

        // Calcula parâmetros com floor (sem casas decimais)
        const min = Math.floor(Math.min(...sortedData));
        const max = Math.floor(Math.max(...sortedData));
        const range = max - min;

        // Número de classes
        const numClasses = this.calculateNumClasses();

        // Intervalo de classe (sempre arredonda para cima para garantir cobertura)
        let classWidth = Math.ceil(range / numClasses);

        // Se o intervalo é muito pequeno, usar 1
        if (classWidth === 0) {
            classWidth = 1;
        }

        // Cria as classes
        const classes = this.createClasses(min, numClasses, classWidth);

        // Calcula frequências
        this.calculateFrequencies(classes, sortedData);

        // Exibe a tabela
        this.displayTable(classes, sortedData);

        // Mostra seção de resultados
        document.getElementById('inputSection').classList.add('d-none');
        document.getElementById('resultSection').classList.remove('d-none');

        // Scroll para resultados
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }

    calculateNumClasses() {
        const n = this.data.length;
        // Usando Regra de Sturges por padrão
        const numClasses = Math.ceil(1 + 3.3 * Math.log10(n));
        return Math.max(3, numClasses); // Mínimo 3 classes
    }

    createClasses(min, numClasses, classWidth) {
        const classes = [];
        let start = Math.floor(min);

        for (let i = 0; i < numClasses; i++) {
            const end = Math.floor(start + classWidth);
            classes.push({
                start: Math.floor(start),
                end: Math.floor(end),
                frequency: 0,
                cumulativeFreq: 0,
                relativeFreq: 0,
                cumulativeRelativeFreq: 0
            });
            start = end;
        }

        return classes;
    }

    calculateFrequencies(classes, data) {
        // Frequência simples
        for (let value of data) {
            for (let classItem of classes) {
                if (value >= classItem.start && value < classItem.end) {
                    classItem.frequency++;
                    break;
                } else if (value === classItem.end && classItem === classes[classes.length - 1]) {
                    // O último valor (máximo) entra na última classe
                    classItem.frequency++;
                    break;
                }
            }
        }

        // Frequência acumulada
        let cumulative = 0;
        for (let classItem of classes) {
            cumulative += classItem.frequency;
            classItem.cumulativeFreq = cumulative;
        }

        // Frequência relativa
        for (let classItem of classes) {
            classItem.relativeFreq = (classItem.frequency / data.length) * 100;
            classItem.cumulativeRelativeFreq = (classItem.cumulativeFreq / data.length) * 100;
        }
    }

    displayTable(classes, data) {
        const decimalPlaces = 2; // Padrão de 2 casas decimais
        const tbody = document.getElementById('tableBody');
        const totalFi = document.getElementById('totalFi');
        const totalFa = document.getElementById('totalFa');
        const totalFiXi = document.getElementById('totalFiXi');
        const totalFiXi2 = document.getElementById('totalFiXi2');

        tbody.innerHTML = '';

        let sumFiXi = 0;
        let sumFiXi2 = 0;

        for (let classItem of classes) {
            if (classItem.frequency === 0) continue; // Ignora classes vazias

            // Calcula o ponto médio da classe
            const xi = (classItem.start + classItem.end) / 2;
            const fiXi = classItem.frequency * xi;
            const fiXi2 = classItem.frequency * Math.pow(xi, 2);

            sumFiXi += fiXi;
            sumFiXi2 += fiXi2;

            const row = `
                <tr>
                    <td class="fw-bold">${Math.floor(classItem.start)}--${Math.floor(classItem.end)}</td>
                    <td>${classItem.frequency}</td>
                    <td>${classItem.cumulativeFreq}</td>
                    <td>${Math.floor(xi)}</td>
                    <td>${fiXi.toFixed(decimalPlaces)}</td>
                    <td>${fiXi2.toFixed(0)}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        }

        totalFi.textContent = data.length;
        totalFiXi.textContent = sumFiXi.toFixed(decimalPlaces);
        totalFiXi2.textContent = Math.floor(sumFiXi2);

        // Exibe estatísticas
        this.displayStatistics(data, decimalPlaces);

        // Armazena tabela para export
        this.table = classes.filter(c => c.frequency > 0);

        // Gera o gráfico
        this.generateHistogramChart(classes, data, decimalPlaces);
    }

    displayStatistics(data, decimalPlaces) {
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const median = Statistics.median(data);
        const mode = Statistics.mode(data);

        document.getElementById('statCount').textContent = data.length;
        document.getElementById('statMin').textContent = min.toFixed(decimalPlaces);
        document.getElementById('statMax').textContent = max.toFixed(decimalPlaces);
        document.getElementById('statMean').textContent = mean.toFixed(decimalPlaces);
        document.getElementById('statMedian').textContent = median.toFixed(decimalPlaces);
        
        // Se moda retornar "N/A", não formata com toFixed
        if (mode === "N/A") {
            document.getElementById('statMode').textContent = "N/A";
        } else {
            document.getElementById('statMode').textContent = mode.toFixed(decimalPlaces);
        }
    }

    calculateMean(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }

    calculateStdDev(data) {
        const mean = this.calculateMean(data);
        const squareDiffs = data.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
        return Math.sqrt(avgSquareDiff);
    }

    normalDistribution(x, mean, stdDev) {
        const numerator = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
        const denominator = stdDev * Math.sqrt(2 * Math.PI);
        return numerator / denominator;
    }

    generateHistogramChart(classes, data, decimalPlaces) {
        const ctx = document.getElementById('histogramChart');
        if (!ctx) return;

        // Prepara dados do histograma com números inteiros
        const labels = classes
            .filter(c => c.frequency > 0)
            .map(c => `${Math.floor(c.start)}-${Math.floor(c.end)}`);
        
        const frequencies = classes
            .filter(c => c.frequency > 0)
            .map(c => c.frequency);

        // Calcula parâmetros da distribuição normal
        const mean = this.calculateMean(data);
        const stdDev = this.calculateStdDev(data);
        const min = Math.min(...data);
        const max = Math.max(...data);

        // Gera pontos da curva normal
        const points = [];
        const step = (max - min) / 50;
        for (let x = min; x <= max; x += step) {
            points.push({
                x: x,
                y: this.normalDistribution(x, mean, stdDev)
            });
        }

        // Normaliza a curva para a escala do histograma
        const classWidth = classes[0].end - classes[0].start;
        const totalArea = classWidth * data.length;
        const normalizedCurve = points.map(p => ({
            x: p.x,
            y: (p.y * totalArea)
        }));

        // Prepara labels para a curva normal
        const curveLabels = normalizedCurve.map(p => Math.floor(p.x));
        const curveValues = normalizedCurve.map(p => p.y);

        // Destrói gráfico anterior se existir
        if (this.chart) {
            this.chart.destroy();
        }

        // Cria o novo gráfico
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Frequência (Histograma)',
                        data: frequencies,
                        backgroundColor: 'rgba(13, 110, 253, 0.6)',
                        borderColor: 'rgba(13, 110, 253, 1)',
                        borderWidth: 1.5,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Frequência'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Classes'
                        }
                    }
                }
            }
        });
    }

    printTable() {
        const printWindow = window.open('', '', 'height=600,width=1000');
        const tableHtml = document.getElementById('frequencyTable').outerHTML;
        const chartCanvas = document.getElementById('histogramChart');
        let chartImage = '';

        // Tenta capturar o gráfico como imagem
        if (chartCanvas) {
            chartImage = `<p style="margin-top: 30px;"><strong>Histograma com Curva Normal</strong></p>
                         <img src="${chartCanvas.toDataURL()}" style="max-width: 100%; height: auto;">`;
        }

        printWindow.document.write('<html><head><title>Tabela de Frequências</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial; margin: 20px; }');
        printWindow.document.write('h2 { color: #333; margin-bottom: 20px; }');
        printWindow.document.write('p { color: #555; font-weight: bold; margin-top: 20px; }');
        printWindow.document.write('table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }');
        printWindow.document.write('th { background-color: #f2f2f2; font-weight: bold; }');
        printWindow.document.write('img { margin-top: 20px; max-width: 100%; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<h2>Tabela de Frequências</h2>');
        printWindow.document.write(tableHtml);
        printWindow.document.write(chartImage);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    resetForm() {
        this.data = [];
        this.table = null;

        document.getElementById('numberInput').value = '';
        document.getElementById('csvFile').value = '';

        this.updateDataPreview();

        document.getElementById('inputSection').classList.remove('d-none');
        document.getElementById('resultSection').classList.add('d-none');

        document.getElementById('numberInput').focus();
    }
}

// Instancia aplicação
const app = new FrequencyTable();

// Funções globais para os botões HTML
function addNumber() {
    app.addNumber();
}

function clearData() {
    app.clearData();
}

function deleteDataItem(index) {
    app.deleteDataItem(index);
}

function generateTable() {
    app.generateTable();
}

function printTable() {
    app.printTable();
}

function resetForm() {
    app.resetForm();
}
