class FrequencyTable {
    constructor() {
        this.data = [];
        this.table = null;
        this.currentClasses = null;
        this.currentSumFiXi2 = 0;
        this.currentMean = 0;
        this.currentClassWidth = 0;
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

            let values = [];
            
            // Conta quantos separadores tem na linha
            const commaCount = (line.match(/,/g) || []).length;
            const semicolonCount = (line.match(/;/g) || []).length;
            
            // Se tem MÚLTIPLAS vírgulas/pont-vírgulas, é um separador de valores
            // Se tem só 1 ou 0, pode ser um decimal
            if (commaCount > 1 || semicolonCount > 1) {
                // Múltiplos separadores = múltiplos valores na mesma linha
                values = line.split(/[,;]/);
            } else if (line.includes(' ') || line.includes('\t')) {
                // Se tem espaços ou tabs, divide por eles
                values = line.split(/[\s\t]+/);
            } else {
                // Único valor com possível decimal
                values = [line];
            }

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

        // Calcula parâmetros
        const min = Math.min(...sortedData);
        const max = Math.max(...sortedData);
        const totalAmplitude = max - min;

        // Amplitude da classe: amplitude total / raiz de n, sempre arredonda para cima
        let classWidth = Math.ceil(totalAmplitude / Math.sqrt(this.data.length));

        // Se o intervalo é muito pequeno, usar 1
        if (classWidth === 0) {
            classWidth = 1;
        }

        // Calcula o número de classes necessárias para cobrir a amplitude total
        let numClasses = Math.ceil(totalAmplitude / classWidth);

        // Detecta se os dados são decimais/pequenos
        const isDecimalData = classWidth < 1 || Math.abs(min) < 1 || Math.abs(max) < 10;

        // Cria as classes
        let classes = this.createClasses(min, numClasses, classWidth, isDecimalData);

        // Verifica se o máximo corresponde exatamente ao fim da última classe
        // Se sim, deve criar uma nova classe para ele
        const lastClassEnd = classes[classes.length - 1].end;
        if (max === lastClassEnd) {
            // Adiciona uma nova classe
            numClasses++;
            classes = this.createClasses(min, numClasses, classWidth, isDecimalData);
        }

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

    createClasses(min, numClasses, classWidth, isDecimalData = false) {
        const classes = [];
        
        // Se dados são decimais/pequenos, mantém as casas decimais
        // Senão, arredonda para inteiro
        let start;
        if (isDecimalData) {
            start = Math.round(min * 100) / 100; // Mantém 2 casas decimais
        } else {
            start = Math.floor(min);
        }

        for (let i = 0; i < numClasses; i++) {
            let end;
            if (isDecimalData) {
                end = Math.round((start + classWidth) * 100) / 100; // Mantém 2 casas decimais
            } else {
                end = Math.floor(start + classWidth);
            }
            
            classes.push({
                start: start,
                end: end,
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
        // Frequência simples - Validação de intervalo correto
        for (let value of data) {
            for (let i = 0; i < classes.length; i++) {
                const classItem = classes[i];
                const isLastClass = (i === classes.length - 1);
                
                // Para a última classe: value >= start E value <= end
                // Para outras classes: value >= start E value < end
                if (isLastClass) {
                    if (value >= classItem.start && value <= classItem.end) {
                        classItem.frequency++;
                        break;
                    }
                } else {
                    if (value >= classItem.start && value < classItem.end) {
                        classItem.frequency++;
                        break;
                    }
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
            const fr = (classItem.frequency / data.length) * 100;

            sumFiXi += fiXi;
            sumFiXi2 += fiXi2;

            const row = `
                <tr>
                    <td class="fw-bold">${classItem.start}--${classItem.end}</td>
                    <td>${classItem.frequency}</td>
                    <td>${xi.toFixed(decimalPlaces)}</td>
                    <td>${classItem.cumulativeFreq}</td>
                    <td>${fr.toFixed(2)}%</td>
                    <td>${fiXi.toFixed(decimalPlaces)}</td>
                    <td>${fiXi2.toFixed(decimalPlaces)}</td>
                </tr>
            `;

            tbody.innerHTML += row;
        }

        totalFi.textContent = data.length;
        totalFiXi.textContent = sumFiXi.toFixed(decimalPlaces);
        totalFiXi2.textContent = sumFiXi2.toFixed(decimalPlaces);

        // Calcula a média
        const mean = sumFiXi / data.length;
        
        // Calcula classWidth
        const classWidth = classes[0].end - classes[0].start;

        // Armazena informações para cálculos posteriores
        this.currentClasses = classes;
        this.currentSumFiXi2 = sumFiXi2;
        this.currentMean = mean;
        this.currentClassWidth = classWidth;

        // Exibe informações das classes
        this.displayClassInfo(classes, data, classWidth);

        // Exibe cálculos de variância
        this.displayVarianceCalculations(data, sumFiXi2, mean, decimalPlaces);

        // Exibe estatísticas
        this.displayStatistics(classes, data, decimalPlaces);

        // Armazena tabela para export
        this.table = classes.filter(c => c.frequency > 0);

        // Gera o gráfico
        this.generateHistogramChart(classes, data, decimalPlaces);
    }

    displayClassInfo(classes, data, classWidth) {
        const decimalPlaces = 2;
        const totalAmplitude = Math.max(...data) - Math.min(...data);
        const numClasses = classes.length;

        document.getElementById('infoDataCount').textContent = data.length;
        document.getElementById('infoNumClasses').textContent = numClasses;
        document.getElementById('infoClassWidth').textContent = classWidth.toFixed(decimalPlaces);
        document.getElementById('infoTotalAmplitude').textContent = totalAmplitude.toFixed(decimalPlaces);
        document.getElementById('infoMinLimit').textContent = Math.min(...data).toFixed(decimalPlaces);
        document.getElementById('infoMaxLimit').textContent = Math.max(...data).toFixed(decimalPlaces);
    }

    displayVarianceCalculations(data, sumFiXi2, mean, decimalPlaces) {
        const varianceType = document.querySelector('input[name="varianceType"]:checked').value;
        const n = data.length;

        // População: (fi.xi² / n) - (média)²
        // Amostra: [(fi.xi² / n) - (média)²] * (n / (n-1))

        let variance;
        if (varianceType === 'population') {
            variance = (sumFiXi2 / n) - Math.pow(mean, 2);
        } else {
            // Amostra
            variance = ((sumFiXi2 / n) - Math.pow(mean, 2)) * (n / (n - 1));
        }

        // Desvio padrão
        const stdDev = Math.sqrt(variance);

        // Coeficiente de variação
        const coeffVar = (stdDev / mean) * 100;

        // Exibe os valores
        document.getElementById('calcVariance').textContent = variance.toFixed(decimalPlaces);
        document.getElementById('calcStdDev').textContent = stdDev.toFixed(decimalPlaces);
        document.getElementById('calcCoeffVar').textContent = coeffVar.toFixed(2) + '%';
        document.getElementById('calcType').textContent = varianceType === 'population' ? 'População' : 'Amostra';

        // ===== INTERPRETAÇÃO DE VARIABILIDADE =====
        // 0 a 15% - baixa variabilidade
        // 15% a 30% - média variabilidade
        // 30% + alta variabilidade
        let variabilityType = '';
        let variabilityDesc = '';
        let variabilityColor = '';

        if (coeffVar < 15) {
            variabilityType = 'Baixa Variabilidade';
            variabilityDesc = 'Dados muito homogêneos';
            variabilityColor = 'text-success';
        } else if (coeffVar < 30) {
            variabilityType = 'Média Variabilidade';
            variabilityDesc = 'Dados moderadamente dispersos';
            variabilityColor = 'text-warning';
        } else {
            variabilityType = 'Alta Variabilidade';
            variabilityDesc = 'Dados muito dispersos';
            variabilityColor = 'text-danger';
        }

        document.getElementById('variabilityType').textContent = variabilityType;
        document.getElementById('variabilityType').className = `${variabilityColor} mt-2`;
        document.getElementById('variabilityDesc').textContent = variabilityDesc;

        // ===== INTERPRETAÇÃO DE TENDÊNCIA CENTRAL =====
        // 0 a 30% - Média
        // 30 a 60% - Mediana
        // 60% + - Moda
        let centralTendencyType = '';
        let centralTendencyDesc = '';

        if (coeffVar < 30) {
            centralTendencyType = 'Usar Média';
            centralTendencyDesc = 'A média é representativa dos dados';
        } else if (coeffVar < 60) {
            centralTendencyType = 'Usar Mediana';
            centralTendencyDesc = 'A mediana é mais representativa';
        } else {
            centralTendencyType = 'Usar Moda';
            centralTendencyDesc = 'A moda é mais representativa';
        }

        document.getElementById('centralTendency').textContent = centralTendencyType;
        document.getElementById('centralTendencyDesc').textContent = centralTendencyDesc;
    }

    displayStatistics(classes, data, decimalPlaces) {
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;

        // ===== MODA =====
        // Encontra a classe com maior frequência
        let modalClass = null;
        let maxFreq = 0;
        let modalClassIndex = -1;

        for (let i = 0; i < classes.length; i++) {
            if (classes[i].frequency > maxFreq) {
                maxFreq = classes[i].frequency;
                modalClass = classes[i];
                modalClassIndex = i;
            }
        }

        let mode = "N/A";
        if (modalClass) {
            const li = modalClass.start;
            const amplitude = modalClass.end - modalClass.start;
            
            // d1 = fi(classe atual) - fi(classe anterior)
            const d1 = modalClassIndex === 0 ? modalClass.frequency : (modalClass.frequency - classes[modalClassIndex - 1].frequency);
            
            // d2 = fi(classe atual) - fi(próxima classe)
            const d2 = modalClassIndex === classes.length - 1 ? modalClass.frequency : (modalClass.frequency - classes[modalClassIndex + 1].frequency);
            
            // Moda = li + (d1 / (d1 + d2)) * amplitude
            mode = li + ((d1 / (d1 + d2)) * amplitude);
        }

        // ===== MEDIANA =====
        // Pos(md) = n/2 se n é par, (n+1)/2 se n é impar
        const n = data.length;
        const posMd = n % 2 === 0 ? n / 2 : (n + 1) / 2;

        // Encontra a classe da mediana (onde Pos(md) está no FA)
        let medianClass = null;
        let medianClassIndex = -1;
        let faAnterior = 0;

        for (let i = 0; i < classes.length; i++) {
            if (posMd <= classes[i].cumulativeFreq) {
                medianClass = classes[i];
                medianClassIndex = i;
                faAnterior = i === 0 ? 0 : classes[i - 1].cumulativeFreq;
                break;
            }
        }

        let median = "N/A";
        if (medianClass) {
            const li = medianClass.start;
            const amplitude = medianClass.end - medianClass.start;
            const fi = medianClass.frequency;
            
            // Mediana = li + ((Pos(md) - fa(anterior)) * amplitude) / fi
            median = li + (((posMd - faAnterior) * amplitude) / fi);
        }

        // Exibe os valores
        document.getElementById('statMean').textContent = mean.toFixed(decimalPlaces);
        
        if (median === "N/A") {
            document.getElementById('statMedian').textContent = "N/A";
        } else {
            document.getElementById('statMedian').textContent = median.toFixed(decimalPlaces);
        }

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
            chartImage = `<p style="margin-top: 30px;"><strong>Histograma</strong></p>
                         <img src="${chartCanvas.toDataURL()}" style="max-width: 100%; height: auto;">`;
        }

        // Coleta dados de análise
        const infoDataCount = document.getElementById('infoDataCount').textContent;
        const infoNumClasses = document.getElementById('infoNumClasses').textContent;
        const infoClassWidth = document.getElementById('infoClassWidth').textContent;
        const infoTotalAmplitude = document.getElementById('infoTotalAmplitude').textContent;
        const infoMinLimit = document.getElementById('infoMinLimit').textContent;
        const infoMaxLimit = document.getElementById('infoMaxLimit').textContent;

        const statMean = document.getElementById('statMean').textContent;
        const statMedian = document.getElementById('statMedian').textContent;
        const statMode = document.getElementById('statMode').textContent;

        const calcVariance = document.getElementById('calcVariance').textContent;
        const calcStdDev = document.getElementById('calcStdDev').textContent;
        const calcCoeffVar = document.getElementById('calcCoeffVar').textContent;
        const calcType = document.getElementById('calcType').textContent;

        const variabilityType = document.getElementById('variabilityType').textContent;
        const variabilityDesc = document.getElementById('variabilityDesc').textContent;
        const centralTendency = document.getElementById('centralTendency').textContent;
        const centralTendencyDesc = document.getElementById('centralTendencyDesc').textContent;

        // HTML das informações de análise
        const analysisHtml = `
            <h2>Tabela de Frequências</h2>
        `;

        printWindow.document.write('<html><head><title>Tabela de Frequências</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial; margin: 20px; }');
        printWindow.document.write('h2 { color: #333; margin-bottom: 20px; margin-top: 30px; }');
        printWindow.document.write('h3 { color: #555; margin-bottom: 15px; margin-top: 20px; }');
        printWindow.document.write('p { color: #555; font-weight: bold; margin-top: 20px; }');
        printWindow.document.write('table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }');
        printWindow.document.write('th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }');
        printWindow.document.write('th { background-color: #f2f2f2; font-weight: bold; }');
        printWindow.document.write('img { margin-top: 20px; max-width: 100%; }');
        printWindow.document.write('small { color: #999; font-weight: normal; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(analysisHtml);
        printWindow.document.write(tableHtml);
        
        // Informações detalhadas após a tabela
        printWindow.document.write(`
            <h2 style="margin-top: 40px;">Análise de Frequências</h2>
            
            <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <div style="flex: 1;">
                    <h3>Informações das Classes</h3>
                    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2; width: 50%;">Qtd. de Dados</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${infoDataCount}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Nº de Classes</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${infoNumClasses}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Amp. Classe</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${infoClassWidth}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Amp. Total</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${infoTotalAmplitude}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Lim. Inferior</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${infoMinLimit}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Lim. Superior</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${infoMaxLimit}</td>
                        </tr>
                    </table>
                </div>

                <div style="flex: 1;">
                    <h3>Estatísticas Descritivas</h3>
                    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2; width: 50%;">Média</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${statMean}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Mediana</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${statMedian}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Moda</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${statMode}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <div style="flex: 1;">
                    <h3>Análise de Variabilidade</h3>
                    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2; width: 50%;">Variância</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${calcVariance}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Desvio Padrão</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${calcStdDev}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Coef. Variação</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${calcCoeffVar}</td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Tipo</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${calcType}</td>
                        </tr>
                    </table>
                </div>

                <div style="flex: 1;">
                    <h3>Interpretações</h3>
                    <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2; width: 50%;">Variabilidade</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">
                                <strong>${variabilityType}</strong><br/><small>${variabilityDesc}</small>
                            </td>
                        </tr>
                        <tr style="border: 1px solid #ddd;">
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background-color: #f2f2f2;">Tendência Central</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">
                                <strong>${centralTendency}</strong><br/><small>${centralTendencyDesc}</small>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `);
        
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
        this.currentClasses = null;
        this.currentSumFiXi2 = 0;
        this.currentMean = 0;
        this.currentClassWidth = 0;

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

function updateVarianceCalculations() {
    if (app.currentSumFiXi2 && app.currentMean) {
        app.displayVarianceCalculations(app.data, app.currentSumFiXi2, app.currentMean, 2);
    }
}
