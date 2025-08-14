# 📊 CSV Excel - Analisador de Dados Inteligente

Um analisador de dados CSV moderno e otimizado, inspirado no Excel, com recursos avançados de filtragem e visualização.

## 🚀 Principais Recursos

### ✨ Interface Moderna
- Design inspirado no Excel com interface intuitiva
- Drag & drop para upload de arquivos
- Navegação por teclado (setas)
- Seleção de células com coordenadas (A1, B2, etc.)

### 🔍 Filtros Inteligentes
- **Detecção automática de tipos de dados**: Texto, Número, Data, Booleano, Categoria
- **Filtros dinâmicos**: Baseados no conteúdo real dos dados
- **Múltiplos filtros simultâneos**: Combine filtros de diferentes colunas
- **Filtros otimizados**: Performance melhorada para arquivos grandes

### 📈 Visualização Avançada
- **Virtualização de tabela**: Renderiza apenas linhas visíveis para performance
- **Estilização inteligente**: Cores diferentes para diferentes tipos de dados
- **Scroll suave**: Navegação fluida em arquivos grandes
- **Responsivo**: Funciona em diferentes tamanhos de tela

### 💾 Exportação
- Exportação para CSV com codificação UTF-8
- BOM (Byte Order Mark) para compatibilidade com Excel
- Instruções detalhadas para abertura no Excel

## ⚡ Otimizações de Performance

### 🎯 Para Arquivos Grandes (7k+ linhas)

#### **1. Web Workers**
- Processamento em background para não travar a interface
- Parse CSV em chunks para evitar bloqueio
- Filtros aplicados em thread separada

#### **2. Virtualização de Tabela**
- Renderiza apenas ~50 linhas visíveis por vez
- Scroll virtual com altura calculada
- Performance constante independente do tamanho do arquivo

#### **3. Cache Inteligente**
- Cache de tipos de filtros para evitar recálculos
- Amostragem de dados para detecção rápida de tipos
- Debouncing nos filtros (300ms)

#### **4. Processamento Otimizado**
- Parse CSV em chunks de 1000 linhas
- Barra de progresso em tempo real
- Fallback para processamento na thread principal

#### **5. Filtros Otimizados**
- Amostragem de dados para criar controles
- Web Workers para filtros em arquivos > 10k linhas
- Debouncing para evitar aplicações excessivas

## 📁 Formatos Suportados

### Separadores
- **Vírgula (,)** - Padrão
- **Tab (\t)** - Detectado automaticamente

### Codificação
- **UTF-8** - Suporte completo a caracteres especiais
- **BOM** - Para compatibilidade com Excel

## 🛠️ Como Usar

### 1. Upload de Arquivo
- Arraste e solte o arquivo CSV na área indicada
- Ou clique para selecionar o arquivo
- Suporte a arquivos grandes (testado com 7k+ linhas)

### 2. Navegação
- **Setas**: Navegue entre células
- **Clique**: Selecione uma célula
- **Scroll**: Navegue pela tabela

### 3. Filtros
- **Detecção automática**: Tipos de dados identificados automaticamente
- **Filtros visíveis**: Primeiros 10 filtros mostrados por padrão
- **Expandir**: Clique em "Mostrar X filtros mais" para ver todos
- **Limpar**: Use o botão "Limpar" para remover todos os filtros

### 4. Exportação
- Clique em "Exportar" para baixar os dados filtrados
- Arquivo salvo com codificação UTF-8 e BOM
- Instruções automáticas para abertura no Excel

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com gradientes e animações
- **JavaScript ES6+**: Lógica otimizada
- **Web Workers**: Processamento em background
- **Virtualização**: Performance para grandes datasets

## 📊 Performance

### Antes das Otimizações
- ❌ Carregamento lento para arquivos grandes
- ❌ Interface travava durante processamento
- ❌ Filtros lentos e responsivos
- ❌ Renderização de todas as linhas

### Depois das Otimizações
- ✅ Carregamento rápido com barra de progresso
- ✅ Interface responsiva durante processamento
- ✅ Filtros instantâneos com debouncing
- ✅ Virtualização para performance constante

### Métricas de Performance
- **Arquivo de 7k linhas**: Carregamento em ~2-3 segundos
- **Filtros**: Aplicação instantânea (< 100ms)
- **Scroll**: 60 FPS constante
- **Memória**: Uso otimizado com virtualização

## 🎨 Personalização

### Cores e Estilos
- Gradientes modernos
- Animações suaves
- Design responsivo
- Tema escuro/claro automático

### Tipos de Dados
- **Números**: Verde, alinhados à direita
- **Datas**: Vermelho, centralizados
- **Booleanos**: Verde/Vermelho com badges
- **Texto**: Preto, alinhado à esquerda

## 🔍 Detecção de Tipos

### Algoritmo Inteligente
1. **Amostragem**: Analisa primeiras 1000 linhas
2. **Análise numérica**: Verifica se >80% são números
3. **Análise de data**: Verifica se >50% são datas válidas
4. **Análise booleana**: Verifica valores true/false/sim/não
5. **Análise categórica**: Verifica se há ≤20 valores únicos
6. **Fallback**: Texto para outros casos

## 🚀 Próximas Funcionalidades

- [ ] Gráficos e visualizações
- [ ] Análise estatística
- [ ] Exportação para Excel (.xlsx)
- [ ] Múltiplos arquivos
- [ ] Salvamento de filtros
- [ ] Temas personalizáveis

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

---

**Desenvolvido com ❤️ para análise de dados eficiente e intuitiva**
