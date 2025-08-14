// Variáveis globais otimizadas
let csvData = [];
let headers = [];
let filteredData = [];
let filters = {};
let selectedCell = null;
let currentFile = null;
let filtersExpanded = false;
let filterBarVisible = true;

// Variáveis para virtualização
let visibleRows = 50; // Número de linhas visíveis
let scrollTop = 0;
let rowHeight = 40; // Altura estimada de cada linha
let totalRows = 0;
let startIndex = 0;
let endIndex = 0;

// Cache para otimização
let filterCache = new Map();
let columnIndexes = new Map();
let debounceTimer = null;

// Elementos DOM
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const excelSheet = document.getElementById('excelSheet');
const filterBar = document.getElementById('filterBar');
const statusBar = document.getElementById('statusBar');
const loading = document.getElementById('loading');
const tableBody = document.getElementById('tableBody');
const scrollContainer = document.querySelector('.scroll-container');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupVirtualization();
});

function setupEventListeners() {
    // Upload de arquivo
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Clique na área de upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Eventos de teclado para navegação
    document.addEventListener('keydown', handleKeyNavigation);
    
    // Clique fora para desselecionar
    document.addEventListener('click', handleClickOutside);
    
    // Scroll para virtualização
    if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
    }
}

function setupVirtualization() {
    // Configurar altura do container para scroll virtual
    if (tableBody) {
        tableBody.style.position = 'relative';
    }
}

// Funções de upload otimizadas
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFileOptimized(file);
    } else {
        alert('Por favor, selecione um arquivo válido.');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        processFileOptimized(file);
    }
}

// Processamento otimizado do arquivo
function processFileOptimized(file) {
    showLoading();
    currentFile = file;
    
    // Usar Web Worker para processamento em background
    if (window.Worker) {
        processWithWorker(file);
    } else {
        processWithMainThread(file);
    }
}

function processWithWorker(file) {
    const worker = new Worker(URL.createObjectURL(new Blob([`
        // Web Worker para processamento CSV
        self.onmessage = function(e) {
            const { csvText, fileName } = e.data;
            
            try {
                const result = parseCSVOptimized(csvText);
                self.postMessage({ success: true, data: result });
            } catch (error) {
                self.postMessage({ success: false, error: error.message });
            }
        };
        
        function parseCSVOptimized(csvText) {
            const normalizedText = csvText.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');
            const lines = normalizedText.split('\\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                throw new Error('Arquivo CSV vazio');
            }
            
            if (lines.length === 1) {
                throw new Error('Arquivo CSV contém apenas cabeçalhos');
            }
            
            // Detectar separador
            const firstLine = lines[0];
            const tabCount = (firstLine.match(/\\t/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;
            const separator = tabCount >= commaCount ? '\\t' : ',';
            
            // Parse headers
            const headers = parseCSVLine(firstLine, separator);
            
            // Parse data em chunks para evitar bloqueio
            const data = [];
            const chunkSize = 1000;
            
            for (let i = 1; i < lines.length; i += chunkSize) {
                const chunk = lines.slice(i, i + chunkSize);
                
                for (let j = 0; j < chunk.length; j++) {
                    const lineIndex = i + j;
                    const row = parseCSVLine(chunk[j], separator);
                    
                    if (row.length === headers.length) {
                        const rowObj = {};
                        headers.forEach((header, index) => {
                            rowObj[header] = row[index] || '';
                        });
                        data.push(rowObj);
                    } else if (Math.abs(row.length - headers.length) <= 2) {
                        const rowObj = {};
                        headers.forEach((header, index) => {
                            rowObj[header] = row[index] || '';
                        });
                        data.push(rowObj);
                    }
                }
                
                // Reportar progresso
                if (i % (chunkSize * 5) === 0) {
                    self.postMessage({ 
                        progress: true, 
                        processed: Math.min(i + chunkSize, lines.length - 1),
                        total: lines.length - 1 
                    });
                }
            }
            
            return { headers, data };
        }
        
        function parseCSVLine(line, separator) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === separator && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current.trim());
            return result;
        }
    `], { type: 'application/javascript' })));
    
    const reader = new FileReader();
    reader.onload = function(e) {
        worker.postMessage({ csvText: e.target.result, fileName: file.name });
    };
    
    worker.onmessage = function(e) {
        if (e.data.progress) {
            updateLoadingProgress(e.data.processed, e.data.total);
        } else if (e.data.success) {
            const { headers: parsedHeaders, data: parsedData } = e.data.data;
            headers = parsedHeaders;
            csvData = parsedData;
            filteredData = [...csvData];
            
            displayFileInfo(file);
            createFiltersOptimized();
            setupVirtualization();
            displayExcelTableOptimized();
            hideLoading();
            showExcelInterface();
            
            worker.terminate();
        } else {
            hideLoading();
            alert('Erro ao processar o arquivo CSV: ' + e.data.error);
            worker.terminate();
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

function processWithMainThread(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            const result = parseCSVOptimized(csvText);
            
            headers = result.headers;
            csvData = result.data;
            filteredData = [...csvData];
            
            displayFileInfo(file);
            createFiltersOptimized();
            setupVirtualization();
            displayExcelTableOptimized();
            hideLoading();
            showExcelInterface();
        } catch (error) {
            hideLoading();
            console.error('Erro ao processar CSV:', error);
            alert('Erro ao processar o arquivo CSV: ' + error.message);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

function parseCSVOptimized(csvText) {
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('Arquivo CSV vazio');
    }
    
    if (lines.length === 1) {
        throw new Error('Arquivo CSV contém apenas cabeçalhos');
    }
    
    // Detectar separador
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const separator = tabCount >= commaCount ? '\t' : ',';
    
    // Parse headers
    const headers = parseCSVLine(firstLine, separator);
    
    // Parse data em chunks
    const data = [];
    const chunkSize = 1000;
    
    for (let i = 1; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        
        for (let j = 0; j < chunk.length; j++) {
            const lineIndex = i + j;
            const row = parseCSVLine(chunk[j], separator);
            
            if (row.length === headers.length) {
                const rowObj = {};
                headers.forEach((header, index) => {
                    rowObj[header] = row[index] || '';
                });
                data.push(rowObj);
            } else if (Math.abs(row.length - headers.length) <= 2) {
                const rowObj = {};
                headers.forEach((header, index) => {
                    rowObj[header] = row[index] || '';
                });
                data.push(rowObj);
            }
        }
    }
    
    return { headers, data };
}

function parseCSVLine(line, separator) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Exibir informações do arquivo
function displayFileInfo(file) {
    document.getElementById('fileInfo').textContent = `${file.name} (${csvData.length} linhas, ${headers.length} colunas)`;
}

// Alternar visibilidade da barra de filtros
function toggleFilterBar() {
    if (filterBarVisible) {
        filterBar.style.display = 'none';
        filterBarVisible = false;
    } else {
        filterBar.style.display = 'block';
        filterBarVisible = true;
    }
}

// Criar filtros otimizados
function createFiltersOptimized() {
    const filterContainer = document.getElementById('filterContainer');
    filterContainer.innerHTML = '';
    
    // Limitar número de filtros visíveis inicialmente
    const maxVisibleFilters = 10;
    const visibleHeaders = headers.slice(0, maxVisibleFilters);
    
    // Adicionar botão de expandir/colapsar se houver muitas colunas
    if (headers.length > maxVisibleFilters) {
        const expandButton = document.createElement('div');
        expandButton.className = 'filter-item expand-button';
        expandButton.innerHTML = `
            <button onclick="toggleFilters()" style="background: #0078d4; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                <i class="fas fa-chevron-down"></i> Mostrar ${headers.length - maxVisibleFilters} filtros mais
            </button>
        `;
        filterContainer.appendChild(expandButton);
    }
    
    // Criar filtros visíveis
    visibleHeaders.forEach(header => {
        const filterType = detectFilterTypeOptimized(header);
        const filterElement = createFilterElementOptimized(header, filterType);
        filterContainer.appendChild(filterElement);
    });
    
    // Criar filtros ocultos
    if (headers.length > maxVisibleFilters) {
        const hiddenHeaders = headers.slice(maxVisibleFilters);
        hiddenHeaders.forEach(header => {
            const filterType = detectFilterTypeOptimized(header);
            const filterElement = createFilterElementOptimized(header, filterType);
            filterElement.style.display = 'none';
            filterElement.classList.add('hidden-filter');
            filterContainer.appendChild(filterElement);
        });
    }
}

// Detectar tipo de filtro otimizado
function detectFilterTypeOptimized(header) {
    // Usar cache para evitar recálculos
    if (filterCache.has(header)) {
        return filterCache.get(header);
    }
    
    // Amostrar apenas uma parte dos dados para detecção rápida
    const sampleSize = Math.min(1000, csvData.length);
    const sampleData = csvData.slice(0, sampleSize).map(row => row[header]).filter(val => val !== '');
    
    if (sampleData.length === 0) {
        filterCache.set(header, 'text');
        return 'text';
    }
    
    // Verificar se é numérico
    const numericCount = sampleData.filter(val => !isNaN(val) && val !== '').length;
    if (numericCount / sampleData.length > 0.8) {
        filterCache.set(header, 'numeric');
        return 'numeric';
    }
    
    // Verificar se é data
    const dateCount = sampleData.filter(val => isValidDate(val)).length;
    if (dateCount / sampleData.length > 0.5) {
        filterCache.set(header, 'date');
        return 'date';
    }
    
    // Verificar se é booleano
    const booleanValues = ['true', 'false', 'sim', 'não', 'yes', 'no', '1', '0'];
    const booleanCount = sampleData.filter(val => 
        booleanValues.includes(val.toLowerCase())
    ).length;
    if (booleanCount / sampleData.length > 0.8) {
        filterCache.set(header, 'boolean');
        return 'boolean';
    }
    
    // Verificar se tem valores únicos limitados
    const uniqueValues = [...new Set(sampleData)];
    if (uniqueValues.length <= 20 && uniqueValues.length > 1) {
        filterCache.set(header, 'category');
        return 'category';
    }
    
    filterCache.set(header, 'text');
    return 'text';
}

// Criar elemento de filtro otimizado
function createFilterElementOptimized(header, filterType) {
    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter-item';
    
    const filterTypeLabel = getFilterTypeLabel(filterType);
    const controls = createFilterControlsOptimized(header, filterType);
    
    filterDiv.innerHTML = `
        <label title="${header}">${header.length > 15 ? header.substring(0, 15) + '...' : header}:</label>
        ${controls}
        <span class="filter-type">${filterTypeLabel}</span>
    `;
    
    return filterDiv;
}

// Criar controles de filtro otimizados
function createFilterControlsOptimized(header, filterType) {
    // Amostrar dados para criar controles
    const sampleSize = Math.min(500, csvData.length);
    const sampleData = csvData.slice(0, sampleSize).map(row => row[header]).filter(val => val !== '');
    
    switch (filterType) {
        case 'numeric':
            const numericValues = sampleData.filter(val => !isNaN(val)).map(Number);
            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            return `
                <input type="number" placeholder="Min" min="${min}" max="${max}" 
                       onchange="updateFilterOptimized('${header}', 'min', this.value)">
                <input type="number" placeholder="Max" min="${min}" max="${max}" 
                       onchange="updateFilterOptimized('${header}', 'max', this.value)">
            `;
            
        case 'date':
            return `
                <input type="date" placeholder="Início" 
                       onchange="updateFilterOptimized('${header}', 'start', this.value)">
                <input type="date" placeholder="Fim" 
                       onchange="updateFilterOptimized('${header}', 'end', this.value)">
            `;
            
        case 'boolean':
            return `
                <select onchange="updateFilterOptimized('${header}', 'value', this.value)">
                    <option value="">Todos</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                </select>
            `;
            
        case 'category':
            const uniqueValues = [...new Set(sampleData)].sort();
            const options = uniqueValues.slice(0, 20).map(val => 
                `<option value="${val}">${val.length > 20 ? val.substring(0, 20) + '...' : val}</option>`
            ).join('');
            return `
                <select onchange="updateFilterOptimized('${header}', 'value', this.value)">
                    <option value="">Todos</option>
                    ${options}
                </select>
            `;
            
        default: // text
            return `
                <input type="text" placeholder="Buscar..." 
                       onchange="updateFilterOptimized('${header}', 'contains', this.value)">
            `;
    }
}

// Atualizar filtro com debouncing
function updateFilterOptimized(header, type, value) {
    if (!filters[header]) {
        filters[header] = {};
    }
    
    if (value === '') {
        delete filters[header][type];
        if (Object.keys(filters[header]).length === 0) {
            delete filters[header];
        }
    } else {
        filters[header][type] = value;
    }
    
    // Debounce para evitar muitas aplicações de filtro
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        applyFiltersOptimized();
    }, 300);
}

// Aplicar filtros otimizados
function applyFiltersOptimized() {
    // Usar Web Worker para filtros pesados
    if (csvData.length > 10000 && window.Worker) {
        applyFiltersWithWorker();
    } else {
        applyFiltersInMainThread();
    }
}

function applyFiltersWithWorker() {
    const worker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(e) {
            const { data, filters } = e.data;
            
            try {
                const filtered = data.filter(row => {
                    return Object.keys(filters).every(header => {
                        const filter = filters[header];
                        const value = row[header];
                        
                        return Object.keys(filter).every(type => {
                            switch (type) {
                                case 'contains':
                                    return value.toLowerCase().includes(filter[type].toLowerCase());
                                case 'min':
                                    return parseFloat(value) >= parseFloat(filter[type]);
                                case 'max':
                                    return parseFloat(value) <= parseFloat(filter[type]);
                                case 'start':
                                    return new Date(value) >= new Date(filter[type]);
                                case 'end':
                                    return new Date(value) <= new Date(filter[type]);
                                case 'value':
                                    return value.toLowerCase() === filter[type].toLowerCase();
                                default:
                                    return true;
                            }
                        });
                    });
                });
                
                self.postMessage({ success: true, filtered });
            } catch (error) {
                self.postMessage({ success: false, error: error.message });
            }
        };
    `], { type: 'application/javascript' })));
    
    worker.postMessage({ data: csvData, filters });
    
    worker.onmessage = function(e) {
        if (e.data.success) {
            filteredData = e.data.filtered;
            displayExcelTableOptimized();
            updateStatusBar();
        } else {
            console.error('Erro ao aplicar filtros:', e.data.error);
            applyFiltersInMainThread();
        }
        worker.terminate();
    };
}

function applyFiltersInMainThread() {
    filteredData = csvData.filter(row => {
        return Object.keys(filters).every(header => {
            const filter = filters[header];
            const value = row[header];
            
            return Object.keys(filter).every(type => {
                switch (type) {
                    case 'contains':
                        return value.toLowerCase().includes(filter[type].toLowerCase());
                    case 'min':
                        return parseFloat(value) >= parseFloat(filter[type]);
                    case 'max':
                        return parseFloat(value) <= parseFloat(filter[type]);
                    case 'start':
                        return new Date(value) >= new Date(filter[type]);
                    case 'end':
                        return new Date(value) <= new Date(filter[type]);
                    case 'value':
                        return value.toLowerCase() === filter[type].toLowerCase();
                    default:
                        return true;
                }
            });
        });
    });
    
    displayExcelTableOptimized();
    updateStatusBar();
}

// Limpar filtros
function clearFilters() {
    filters = {};
    filteredData = [...csvData];
    
    // Limpar inputs
    const inputs = document.querySelectorAll('.filter-item input, .filter-item select');
    inputs.forEach(input => {
        if (input.type === 'text' || input.type === 'number' || input.type === 'date') {
            input.value = '';
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        }
    });
    
    displayExcelTableOptimized();
    updateStatusBar();
}

// Exibir tabela Excel otimizada com virtualização
function displayExcelTableOptimized() {
    const tableHeader = document.getElementById('tableHeader');
    
    // Criar cabeçalhos
    tableHeader.innerHTML = headers.map((header, index) => 
        `<th data-col="${index}" title="${header}">${header.length > 15 ? header.substring(0, 15) + '...' : header}</th>`
    ).join('');
    
    // Configurar virtualização
    totalRows = filteredData.length;
    startIndex = 0;
    endIndex = Math.min(visibleRows, totalRows);
    
    // Configurar altura do container para scroll virtual
    if (tableBody) {
        tableBody.style.height = `${totalRows * rowHeight}px`;
    }
    
    renderVisibleRows();
    updateStatusBar();
}

// Renderizar apenas linhas visíveis
function renderVisibleRows() {
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    for (let i = startIndex; i < endIndex; i++) {
        if (i >= filteredData.length) break;
        
        const row = filteredData[i];
        const rowElement = document.createElement('tr');
        rowElement.style.position = 'absolute';
        rowElement.style.top = `${i * rowHeight}px`;
        rowElement.style.left = '0';
        rowElement.style.right = '0';
        rowElement.dataset.row = i;
        
        rowElement.innerHTML = headers.map((header, colIndex) => {
            const value = row[header] || '';
            const cellClass = getCellClass(header, value);
            return `<td class="${cellClass}" data-row="${i}" data-col="${colIndex}" onclick="selectCell(this)" title="${escapeHtml(value)}">${escapeHtml(value.length > 20 ? value.substring(0, 20) + '...' : value)}</td>`;
        }).join('');
        
        tableBody.appendChild(rowElement);
    }
}

// Handle scroll para virtualização
function handleScroll(event) {
    const scrollTop = event.target.scrollTop;
    const containerHeight = event.target.clientHeight;
    
    // Calcular índices visíveis
    startIndex = Math.floor(scrollTop / rowHeight);
    endIndex = Math.min(startIndex + Math.ceil(containerHeight / rowHeight) + 5, totalRows);
    
    // Renderizar apenas linhas visíveis
    renderVisibleRows();
}

// Alternar visibilidade dos filtros
function toggleFilters() {
    const hiddenFilters = document.querySelectorAll('.hidden-filter');
    const expandButton = document.querySelector('.expand-button button');
    
    if (filtersExpanded) {
        // Colapsar
        hiddenFilters.forEach(filter => filter.style.display = 'none');
        expandButton.innerHTML = `<i class="fas fa-chevron-down"></i> Mostrar ${hiddenFilters.length} filtros mais`;
        filtersExpanded = false;
    } else {
        // Expandir
        hiddenFilters.forEach(filter => filter.style.display = 'flex');
        expandButton.innerHTML = `<i class="fas fa-chevron-up"></i> Ocultar filtros extras`;
        filtersExpanded = true;
    }
}

// Obter label do tipo de filtro
function getFilterTypeLabel(filterType) {
    const labels = {
        'text': 'Texto',
        'numeric': 'Número',
        'date': 'Data',
        'boolean': 'Sim/Não',
        'category': 'Categoria'
    };
    return labels[filterType] || 'Texto';
}

// Selecionar célula
function selectCell(cell) {
    // Remover seleção anterior
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    
    // Selecionar nova célula
    selectedCell = cell;
    cell.classList.add('selected');
    
    // Atualizar informações da célula
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    const colLetter = getColumnLetter(parseInt(col));
    const rowNumber = parseInt(row) + 2; // +2 porque começa em 1 e tem cabeçalho
    
    document.getElementById('cellInfo').textContent = `${colLetter}${rowNumber}`;
}

// Obter letra da coluna (A, B, C, etc.)
function getColumnLetter(columnIndex) {
    let result = '';
    while (columnIndex >= 0) {
        result = String.fromCharCode(65 + (columnIndex % 26)) + result;
        columnIndex = Math.floor(columnIndex / 26) - 1;
    }
    return result;
}

// Navegação por teclado
function handleKeyNavigation(event) {
    if (!selectedCell) return;
    
    const currentRow = parseInt(selectedCell.dataset.row);
    const currentCol = parseInt(selectedCell.dataset.col);
    let newRow = currentRow;
    let newCol = currentCol;
    
    switch (event.key) {
        case 'ArrowUp':
            newRow = Math.max(0, currentRow - 1);
            break;
        case 'ArrowDown':
            newRow = Math.min(filteredData.length - 1, currentRow + 1);
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, currentCol - 1);
            break;
        case 'ArrowRight':
            newCol = Math.min(headers.length - 1, currentCol + 1);
            break;
        default:
            return;
    }
    
    event.preventDefault();
    
    const newCell = document.querySelector(`td[data-row="${newRow}"][data-col="${newCol}"]`);
    if (newCell) {
        selectCell(newCell);
        newCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Clique fora para desselecionar
function handleClickOutside(event) {
    if (!event.target.closest('.excel-table')) {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
            selectedCell = null;
            document.getElementById('cellInfo').textContent = '';
        }
    }
}

// Atualizar barra de status
function updateStatusBar() {
    document.getElementById('filteredCount').textContent = `Mostrando: ${filteredData.length}`;
    document.getElementById('totalCount').textContent = `Total: ${csvData.length}`;
}

// Mostrar interface do Excel
function showExcelInterface() {
    uploadArea.style.display = 'none';
    excelSheet.style.display = 'flex';
    filterBar.style.display = 'block';
    statusBar.style.display = 'flex';
}

// Exportar para CSV otimizado
function exportToCSV() {
    if (filteredData.length === 0) {
        alert('Nenhum dado para exportar.');
        return;
    }
    
    // Usar Web Worker para exportação de arquivos grandes
    if (filteredData.length > 50000 && window.Worker) {
        exportWithWorker();
    } else {
        exportInMainThread();
    }
}

function exportWithWorker() {
    const worker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(e) {
            const { headers, data } = e.data;
            
            try {
                const separator = ',';
                const csvContent = [
                    headers.map(header => \`"\${header}"\`).join(separator),
                    ...data.map(row => 
                        headers.map(header => {
                            const value = row[header] || '';
                            const escapedValue = value.toString().replace(/"/g, '""');
                            return \`"\${escapedValue}"\`;
                        }).join(separator)
                    )
                ].join('\\n');
                
                const BOM = '\\uFEFF';
                const contentWithBOM = BOM + csvContent;
                
                self.postMessage({ success: true, content: contentWithBOM });
            } catch (error) {
                self.postMessage({ success: false, error: error.message });
            }
        };
    `], { type: 'application/javascript' })));
    
    worker.postMessage({ headers, data: filteredData });
    
    worker.onmessage = function(e) {
        if (e.data.success) {
            downloadCSV(e.data.content);
        } else {
            console.error('Erro na exportação:', e.data.error);
            exportInMainThread();
        }
        worker.terminate();
    };
}

function exportInMainThread() {
    const separator = ',';
    const csvContent = [
        headers.map(header => `"${header}"`).join(separator),
        ...filteredData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                const escapedValue = value.toString().replace(/"/g, '""');
                return `"${escapedValue}"`;
            }).join(separator)
        )
    ].join('\n');
    
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;
    
    downloadCSV(contentWithBOM);
}

function downloadCSV(content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        const instructions = `
📋 **Arquivo CSV Exportado com Sucesso!**

Para abrir corretamente no Excel:

1️⃣ **Método 1 (Recomendado):**
   - Abra o Excel
   - Vá em "Dados" → "Obter Dados" → "De Arquivo" → "De Texto/CSV"
   - Selecione o arquivo exportado
   - Clique em "Carregar"

2️⃣ **Método 2:**
   - Abra o Excel
   - Vá em "Dados" → "Texto para Colunas"
   - Selecione o arquivo
   - Escolha "Delimitado" e marque "Vírgula"
   - Clique em "Concluir"

3️⃣ **Método 3:**
   - Clique com botão direito no arquivo
   - "Abrir com" → "Excel"
   - Se não abrir corretamente, use um dos métodos acima

✅ **Dados exportados:** ${filteredData.length} linhas, ${headers.length} colunas
        `;
        
        alert(instructions);
    }, 500);
}

// Funções auxiliares
function isValidDate(value) {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function updateLoadingProgress(processed, total) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        const percentage = Math.round((processed / total) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;
    }
}

// Obter classe da célula baseada no tipo de dados
function getCellClass(header, value) {
    const filterType = detectFilterTypeOptimized(header);
    
    switch (filterType) {
        case 'numeric':
            return 'cell-number';
        case 'date':
            return 'cell-date';
        case 'boolean':
            return `cell-boolean ${value.toLowerCase()}`;
        default:
            return '';
    }
}
