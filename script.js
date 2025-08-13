// Variáveis globais
let csvData = [];
let headers = [];
let filteredData = [];
let filters = {};
let selectedCell = null;
let currentFile = null;
let filtersExpanded = false;
let filterBarVisible = true;

// Elementos DOM
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const excelSheet = document.getElementById('excelSheet');
const filterBar = document.getElementById('filterBar');
const statusBar = document.getElementById('statusBar');
const loading = document.getElementById('loading');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
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
}

// Funções de upload
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
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
        processFile(file);
    }
}

// Processamento do arquivo
function processFile(file) {
    showLoading();
    currentFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            console.log('CSV Text length:', csvText.length);
            console.log('CSV Text preview:', csvText.substring(0, 200));
            parseCSV(csvText);
            displayFileInfo(file);
            createFilters();
            displayExcelTable();
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

// Parse CSV - CORRIGIDO
function parseCSV(csvText) {
    console.log('=== INICIANDO PARSE CSV ===');
    console.log('CSV Text completo:', csvText);
    
    // Remover caracteres de retorno de carro e normalizar quebras de linha
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n');
    
    console.log('Total lines:', lines.length);
    console.log('First line:', lines[0]);
    console.log('Last line:', lines[lines.length - 1]);
    
    // Filtrar linhas vazias ou apenas espaços
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    console.log('Non-empty lines:', nonEmptyLines.length);
    console.log('Non-empty lines content:', nonEmptyLines);
    
    if (nonEmptyLines.length === 0) {
        throw new Error('Arquivo CSV vazio');
    }
    
    if (nonEmptyLines.length === 1) {
        throw new Error('Arquivo CSV contém apenas cabeçalhos');
    }
    
    // Detectar separador (tab ou vírgula)
    const firstLine = nonEmptyLines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    const separator = tabCount >= commaCount ? '\t' : ',';
    console.log('Detected separator:', separator === '\t' ? 'TAB' : 'COMMA');
    console.log('Tab count:', tabCount, 'Comma count:', commaCount);
    
    // Parse headers
    headers = parseCSVLine(nonEmptyLines[0], separator);
    console.log('Headers:', headers);
    console.log('Headers count:', headers.length);
    
    // Parse data
    csvData = [];
    for (let i = 1; i < nonEmptyLines.length; i++) {
        const row = parseCSVLine(nonEmptyLines[i], separator);
        console.log(`Row ${i}:`, row);
        console.log(`Row ${i} length:`, row.length, 'Headers length:', headers.length);
        
        if (row.length === headers.length) {
            const rowObj = {};
            headers.forEach((header, index) => {
                rowObj[header] = row[index] || '';
            });
            csvData.push(rowObj);
            console.log(`Row ${i} added successfully`);
        } else {
            console.warn(`Row ${i} has ${row.length} columns, expected ${headers.length}. Skipping.`);
            console.warn(`Row content:`, nonEmptyLines[i]);
            console.warn(`Row parsed:`, row);
            
            // Tentar adicionar mesmo assim se a diferença for pequena
            if (Math.abs(row.length - headers.length) <= 2) {
                const rowObj = {};
                headers.forEach((header, index) => {
                    rowObj[header] = row[index] || '';
                });
                csvData.push(rowObj);
                console.log(`Row ${i} added with padding`);
            }
        }
    }
    
    console.log('Parsed data rows:', csvData.length);
    console.log('First data row:', csvData[0]);
    
    if (csvData.length === 0) {
        console.error('No data rows were parsed successfully!');
        console.error('Headers:', headers);
        console.error('All non-empty lines:', nonEmptyLines);
        throw new Error('Nenhuma linha de dados foi processada com sucesso');
    }
    
    console.log('=== PARSE CSV CONCLUÍDO ===');
    filteredData = [...csvData];
}

// Parse linha CSV (suporta aspas e separadores dentro de campos)
function parseCSVLine(line, separator = ',') {
    console.log('Parsing line:', line);
    console.log('Using separator:', separator === '\t' ? 'TAB' : 'COMMA');
    
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
    console.log('Parsed result:', result);
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

// Criar filtros automáticos - MELHORADO
function createFilters() {
    const filterContainer = document.getElementById('filterContainer');
    filterContainer.innerHTML = '';
    
    // Limitar número de filtros visíveis inicialmente
    const maxVisibleFilters = 15;
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
        const filterType = detectFilterType(header);
        const filterElement = createFilterElement(header, filterType);
        filterContainer.appendChild(filterElement);
    });
    
    // Criar filtros ocultos (serão mostrados quando expandir)
    if (headers.length > maxVisibleFilters) {
        const hiddenHeaders = headers.slice(maxVisibleFilters);
        hiddenHeaders.forEach(header => {
            const filterType = detectFilterType(header);
            const filterElement = createFilterElement(header, filterType);
            filterElement.style.display = 'none';
            filterElement.classList.add('hidden-filter');
            filterContainer.appendChild(filterElement);
        });
    }
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

// Detectar tipo de filtro baseado no conteúdo da coluna
function detectFilterType(header) {
    const columnData = csvData.map(row => row[header]).filter(val => val !== '');
    
    if (columnData.length === 0) return 'text';
    
    // Verificar se é numérico
    const numericCount = columnData.filter(val => !isNaN(val) && val !== '').length;
    if (numericCount / columnData.length > 0.8) {
        return 'numeric';
    }
    
    // Verificar se é data
    const dateCount = columnData.filter(val => isValidDate(val)).length;
    if (dateCount / columnData.length > 0.5) {
        return 'date';
    }
    
    // Verificar se é booleano
    const booleanValues = ['true', 'false', 'sim', 'não', 'yes', 'no', '1', '0'];
    const booleanCount = columnData.filter(val => 
        booleanValues.includes(val.toLowerCase())
    ).length;
    if (booleanCount / columnData.length > 0.8) {
        return 'boolean';
    }
    
    // Verificar se tem valores únicos limitados (categoria)
    const uniqueValues = [...new Set(columnData)];
    if (uniqueValues.length <= 20 && uniqueValues.length > 1) {
        return 'category';
    }
    
    return 'text';
}

// Criar elemento de filtro
function createFilterElement(header, filterType) {
    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter-item';
    
    const filterTypeLabel = getFilterTypeLabel(filterType);
    const controls = createFilterControls(header, filterType);
    
    filterDiv.innerHTML = `
        <label title="${header}">${header.length > 15 ? header.substring(0, 15) + '...' : header}:</label>
        ${controls}
        <span class="filter-type">${filterTypeLabel}</span>
    `;
    
    return filterDiv;
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

// Criar controles de filtro
function createFilterControls(header, filterType) {
    const columnData = csvData.map(row => row[header]).filter(val => val !== '');
    
    switch (filterType) {
        case 'numeric':
            const numericValues = columnData.filter(val => !isNaN(val)).map(Number);
            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            return `
                <input type="number" placeholder="Min" min="${min}" max="${max}" 
                       onchange="updateFilter('${header}', 'min', this.value)">
                <input type="number" placeholder="Max" min="${min}" max="${max}" 
                       onchange="updateFilter('${header}', 'max', this.value)">
            `;
            
        case 'date':
            return `
                <input type="date" placeholder="Início" 
                       onchange="updateFilter('${header}', 'start', this.value)">
                <input type="date" placeholder="Fim" 
                       onchange="updateFilter('${header}', 'end', this.value)">
            `;
            
        case 'boolean':
            return `
                <select onchange="updateFilter('${header}', 'value', this.value)">
                    <option value="">Todos</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                </select>
            `;
            
        case 'category':
            const uniqueValues = [...new Set(columnData)].sort();
            const options = uniqueValues.map(val => 
                `<option value="${val}">${val.length > 20 ? val.substring(0, 20) + '...' : val}</option>`
            ).join('');
            return `
                <select onchange="updateFilter('${header}', 'value', this.value)">
                    <option value="">Todos</option>
                    ${options}
                </select>
            `;
            
        default: // text
            return `
                <input type="text" placeholder="Buscar..." 
                       onchange="updateFilter('${header}', 'contains', this.value)">
            `;
    }
}

// Atualizar filtro
function updateFilter(header, type, value) {
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
    
    applyFilters();
}

// Aplicar filtros
function applyFilters() {
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
    
    displayExcelTable();
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
    
    displayExcelTable();
    updateStatusBar();
}

// Exibir tabela Excel
function displayExcelTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    console.log('Displaying table with', filteredData.length, 'rows');
    
    // Criar cabeçalhos
    tableHeader.innerHTML = headers.map((header, index) => 
        `<th data-col="${index}" title="${header}">${header.length > 15 ? header.substring(0, 15) + '...' : header}</th>`
    ).join('');
    
    // Criar linhas de dados (limitado a 1000 linhas para performance)
    const displayData = filteredData.slice(0, 1000);
    tableBody.innerHTML = displayData.map((row, rowIndex) => 
        `<tr data-row="${rowIndex}">${headers.map((header, colIndex) => {
            const value = row[header] || '';
            const cellClass = getCellClass(header, value);
            return `<td class="${cellClass}" data-row="${rowIndex}" data-col="${colIndex}" onclick="selectCell(this)" title="${escapeHtml(value)}">${escapeHtml(value.length > 20 ? value.substring(0, 20) + '...' : value)}</td>`;
        }).join('')}</tr>`
    ).join('');
    
    updateStatusBar();
}

// Obter classe da célula baseada no tipo de dados
function getCellClass(header, value) {
    const filterType = detectFilterType(header);
    
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

// Exportar para CSV
function exportToCSV() {
    if (filteredData.length === 0) {
        alert('Nenhum dado para exportar.');
        return;
    }
    
    console.log('Exportando dados filtrados:', filteredData.length, 'linhas');
    console.log('Headers:', headers);
    console.log('Primeira linha filtrada:', filteredData[0]);
    
    // Usar vírgula como separador e adicionar aspas em todos os campos
    const separator = ',';
    console.log('Separador para exportação: COMMA');
    
    const csvContent = [
        headers.map(header => `"${header}"`).join(separator),
        ...filteredData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // Escapar aspas duplas e adicionar aspas em todos os campos
                const escapedValue = value.toString().replace(/"/g, '""');
                return `"${escapedValue}"`;
            }).join(separator)
        )
    ].join('\n');
    
    console.log('CSV Content preview:', csvContent.substring(0, 500));
    
    // Adicionar BOM (Byte Order Mark) para melhor compatibilidade com Excel
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;
    
    const blob = new Blob([contentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Exportação concluída');
    
    // Mostrar instruções para o usuário
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

// Detectar separador usado no arquivo original
function detectSeparator() {
    if (csvData.length > 0) {
        // Verificar se o arquivo original usava tab ou vírgula
        const firstRow = csvData[0];
        const firstRowString = Object.values(firstRow).join('');
        
        // Se o arquivo original tinha tab, usar tab. Senão, usar vírgula
        if (firstRowString.includes('\t')) {
            return '\t';
        }
        
        // Verificar se há vírgulas nos dados
        const hasCommas = Object.values(firstRow).some(value => value.includes(','));
        if (hasCommas) {
            return '\t'; // Usar tab se há vírgulas nos dados
        }
        
        return ',';
    }
    return ',';
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
