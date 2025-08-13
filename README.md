# 📊 CSV Excel Viewer

Uma aplicação web moderna para visualizar e filtrar arquivos CSV com interface similar ao Excel.

## ✨ Funcionalidades

- **📁 Upload de Arquivos**: Suporte para drag & drop e seleção de arquivos
- **🔍 Filtros Automáticos**: Detecção inteligente de tipos de dados (texto, número, data, booleano, categoria)
- **📋 Interface Excel-like**: Visualização em tabela com navegação por teclado
- **⚡ Filtros Dinâmicos**: Filtros em tempo real para cada coluna
- **📤 Exportação**: Exportar dados filtrados para CSV
- **🎨 Design Moderno**: Interface responsiva e intuitiva

## 🚀 Como Usar

1. **Abrir a aplicação**: Abra o arquivo `index.html` no seu navegador
2. **Carregar CSV**: Arraste um arquivo CSV ou clique para selecionar
3. **Filtrar dados**: Use os filtros automáticos que aparecem para cada coluna
4. **Navegar**: Use as setas do teclado para navegar pela tabela
5. **Exportar**: Clique em "Exportar" para baixar os dados filtrados

## 📁 Estrutura do Projeto

```
csv-excel/
├── index.html          # Interface principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── README.md           # Documentação
└── exemplos/           # Arquivos CSV de exemplo
    ├── exemplo.csv
    ├── dados_teste.csv
    └── dados_complexos.csv
```

## 🔧 Tecnologias Utilizadas

- **HTML5**: Estrutura da aplicação
- **CSS3**: Estilização moderna e responsiva
- **JavaScript ES6+**: Lógica da aplicação
- **File API**: Leitura de arquivos
- **Drag & Drop API**: Upload de arquivos

## 📋 Tipos de Filtros Suportados

- **Texto**: Busca por conteúdo
- **Número**: Filtro por valor mínimo/máximo
- **Data**: Filtro por período
- **Booleano**: Sim/Não, True/False
- **Categoria**: Seleção de valores únicos

## 🎯 Características Técnicas

- **Detecção automática de separadores**: Suporte para vírgula e tab
- **Parsing robusto**: Suporte para campos com aspas e separadores
- **Performance otimizada**: Limitação de 1000 linhas para exibição
- **Compatibilidade**: Funciona em todos os navegadores modernos

## 📤 Exportação

A aplicação exporta arquivos CSV com:
- **BOM (Byte Order Mark)**: Para melhor compatibilidade com Excel
- **Aspas em todos os campos**: Seguindo padrão RFC 4180
- **Instruções detalhadas**: Para abrir corretamente no Excel

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Filipe Vargas**
- GitHub: [@filiprvrgs](https://github.com/filiprvrgs)

## 🙏 Agradecimentos

- Font Awesome para os ícones
- Google Fonts para a tipografia
- Comunidade open source

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!
