class CSVProcessor {
    static arrayToCSV(data, headers = null) {
        let csv = '';

        if (headers) {
            csv += headers.map(h => this.escapeCSV(h)).join(',') + '\n';
        }

        if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
            for (let row of data) {
                const values = Object.values(row).map(v => this.escapeCSV(v));
                csv += values.join(',') + '\n';
            }
        } else {
            for (let value of data) {
                csv += this.escapeCSV(value) + '\n';
            }
        }

        return csv;
    }

    static escapeCSV(value) {
        if (value === null || value === undefined) {
            return '';
        }

        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }

        return str;
    }

    static toJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    static downloadFile(content, filename, mimeType = 'text/plain') {
        const element = document.createElement('a');
        element.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';

        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}

class Statistics {
    static mean(data) {
        return data.reduce((a, b) => a + b, 0) / data.length;
    }

    static median(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 !== 0) {
            return sorted[mid];
        }

        return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    static mode(data) {
        const frequency = {};
        let maxCount = 0;
        let mode = null;

        for (let value of data) {
            frequency[value] = (frequency[value] || 0) + 1;
            if (frequency[value] > maxCount) {
                maxCount = frequency[value];
                mode = value;
            }
        }

        if (maxCount === 1) {
            return "N/A";
        }

        return mode;
    }

    static standardDeviation(data) {
        const avg = this.mean(data);
        const squareDiffs = data.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / data.length;
        return Math.sqrt(avgSquareDiff);
    }

    static variance(data) {
        const avg = this.mean(data);
        const squareDiffs = data.map(value => Math.pow(value - avg, 2));
        return squareDiffs.reduce((a, b) => a + b, 0) / data.length;
    }

    static range(data) {
        return Math.max(...data) - Math.min(...data);
    }

    static quartiles(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;

        const q1Index = Math.floor(n * 0.25);
        const q2Index = Math.floor(n * 0.5);
        const q3Index = Math.floor(n * 0.75);

        return {
            q1: sorted[q1Index],
            q2: sorted[q2Index],
            q3: sorted[q3Index],
            iqr: sorted[q3Index] - sorted[q1Index]
        };
    }
}

class Validators {
    static isValidNumber(value) {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }

    static isValidNumberArray(data) {
        return Array.isArray(data) && data.length > 0 && data.every(v => this.isValidNumber(v));
    }

    static isValidCSV(content) {
        return typeof content === 'string' && content.trim().length > 0;
    }

    static isValidClassCount(count) {
        return Number.isInteger(count) && count >= 3 && count <= 100;
    }
}

class Formatters {
    static formatNumber(value, decimals = 2) {
        return parseFloat(value).toFixed(decimals);
    }

    static formatCurrency(value, currency = 'R$') {
        return currency + ' ' + parseFloat(value).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    static formatScientific(value, decimals = 2) {
        return parseFloat(value).toExponential(decimals);
    }

    static formatPercent(value, decimals = 2) {
        return parseFloat(value * 100).toFixed(decimals) + '%';
    }

    static formatClassInterval(start, end, decimals = 2) {
        return `${this.formatNumber(start, decimals)} - ${this.formatNumber(end, decimals)}`;
    }
}

class DOMHelpers {
    static showError(message, elementId = null) {
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.classList.add('border-danger');
                element.focus();
            }
        }
        alert('❌ Erro: ' + message);
    }

    static showSuccess(message) {
        alert('✅ ' + message);
    }

    static showWarning(message) {
        alert('⚠️ ' + message);
    }

    static elementExists(elementId) {
        return document.getElementById(elementId) !== null;
    }
}

class StorageHelper {
    static setData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    }

    static getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erro ao recuperar dados:', error);
            return null;
        }
    }

    static removeData(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover dados:', error);
            return false;
        }
    }


    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Erro ao limpar storage:', error);
            return false;
        }
    }
}
