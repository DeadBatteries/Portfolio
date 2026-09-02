// get-documents.js - Carregador dinâmico de documentos Markdown

// Configuração dos módulos (mapeamento de nomes)
const MODULES = {'Estacio-BrokenAcess':'Estacio-BrokenAcess'}
;

let allDocuments = [];
let currentFilter = 'todos';
let currentSearch = '';

// Função para sanitizar HTML (prevenir XSS)
function sanitizeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Função para extrair metadata do Markdown
function extractMetadata(content) {
  const lines = content.split('\n');
  const metadata = {
    title: '',
    description: '',
    tags: [],
    date: '',
    content: content
  };

  if (lines[0] && lines[0].trim() === '---') {
    const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
    if (endIndex > 0) {
      const metaLines = lines.slice(1, endIndex);
      metaLines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          const value = valueParts.join(':').trim();
          const cleanKey = key.trim();
          if (cleanKey === 'title') metadata.title = value;
          else if (cleanKey === 'description') metadata.description = value;
          else if (cleanKey === 'tags') metadata.tags = value.split(',').map(t => t.trim());
          else if (cleanKey === 'date') metadata.date = value;
        }
      });
      
      metadata.content = lines.slice(endIndex + 1).join('\n');
    }
  }

  return metadata;
}

// Função para converter Markdown para HTML (básico e seguro)
function markdownToHTML(markdown) {
  let html = sanitizeHTML(markdown);
  
  // Cabeçalhos
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Negrito e itálico
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Código inline
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Bloco de código
  html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
    return '<pre><code>' + sanitizeHTML(code.trim()) + '</code></pre>';
  });
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Listas não ordenadas
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Listas ordenadas
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Parágrafos
  html = html.replace(/^(?!<[h|u|l|p|pre|code])(.*$)/gim, '<p>$1</p>');
  
  // Quebras de linha
  html = html.replace(/\n/g, '<br>');
  
  // Remover tags vazias
  html = html.replace(/<p><br><\/p>/g, '');
  
  return html;
}

// FUNÇÃO PRINCIPAL: Descobrir dinamicamente pastas e arquivos
async function discoverDocuments() {
  try {
    const docList = document.getElementById('doc-list');
    docList.innerHTML = '<div class="loading-docs">🔍 Descobrindo documentos...</div>';
    
    // Lista de pastas que queremos explorar
    // Em vez de hardcodar arquivos, vamos descobrir dinamicamente
    const moduleFolders = ['arquitetura-sistemas', 'seguranca', 'banco-de-dados', 'infraestrutura'];
    
    allDocuments = [];
    let foundAny = false;
    
    // Para cada pasta, tentar descobrir arquivos .md
    for (const module of Object.keys(MODULES)) {
      // Primeiro, vamos tentar descobrir quais arquivos existem
      // Como não podemos listar diretórios diretamente, vamos tentar 
      // carregar um arquivo "index.md" ou "manifest.json" que lista os arquivos
      
      // Opção 1: Tentar carregar um arquivo de manifesto
      try {
        const manifestResponse = await fetch(`docs/${module}/manifest.json`);
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          if (Array.isArray(manifest.files)) {
            for (const file of manifest.files) {
              await loadDocument(module, file);
              foundAny = true;
            }
            continue;
          }
        }
      } catch (e) {
        // Não tem manifesto, continuar
      }
      
      // Opção 2: Tentar carregar um arquivo "index.md" que lista os documentos
      try {
        const indexResponse = await fetch(`docs/${module}/index.md`);
        if (indexResponse.ok) {
          const indexContent = await indexResponse.text();
          // Procurar por links no formato [nome](arquivo.md)
          const fileMatches = indexContent.match(/\[.*?\]\((.*?\.md)\)/g);
          if (fileMatches) {
            for (const match of fileMatches) {
              const file = match.match(/\((.*?\.md)\)/)[1];
              await loadDocument(module, file);
              foundAny = true;
            }
            continue;
          }
        }
      } catch (e) {
        // Não tem index, continuar
      }
      
      // Opção 3: Lista predefinida de arquivos (fallback)
      // Você pode expandir esta lista conforme adicionar novos documentos
      const predefinedFiles = getPredefinedFiles(module);
      for (const file of predefinedFiles) {
        await loadDocument(module, file);
        foundAny = true;
      }
    }
    
    if (!foundAny) {
      docList.innerHTML = '<p class="docs-empty">📂 Nenhum documento encontrado. Adicione arquivos .md na pasta docs/</p>';
      return;
    }
    
    renderDocuments();
    
  } catch (error) {
    console.error('Erro ao descobrir documentos:', error);
    const docList = document.getElementById('doc-list');
    docList.innerHTML = '<p class="docs-empty">❌ Erro ao carregar documentos. Verifique a estrutura de pastas.</p>';
  }
}

// Função para carregar um documento individual
async function loadDocument(module, filename) {
  try {
    const response = await fetch(`docs/${module}/${filename}`);
    if (!response.ok) return false;
    
    const content = await response.text();
    const metadata = extractMetadata(content);
    
    const slug = filename.replace('.md', '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const htmlContent = markdownToHTML(metadata.content);
    
    allDocuments.push({
      module: module,
      slug: slug,
      title: metadata.title || filename.replace('.md', ''),
      description: metadata.description || '',
      date: metadata.date || '2025.01',
      tags: metadata.tags || [],
      tag: metadata.tags && metadata.tags[0] ? metadata.tags[0] : MODULES[module] || module,
      content: htmlContent,
      rawContent: metadata.content,
      filename: filename
    });
    
    return true;
  } catch (error) {
    console.warn(`Erro ao carregar ${filename}:`, error);
    return false;
  }
}

// Função fallback com lista predefinida (expanda conforme necessário)
function getPredefinedFiles(module) {
  const files = {
    'arquitetura-sistemas': ['arquitetura-hexagonal.md', 'consistencia-eventual.md'],
    'seguranca': ['criptografia-simetrica.md', 'owasp-top10.md'],
    'banco-de-dados': ['indexacao-postgres.md'],
    'infraestrutura': ['containers-namespaces.md']
  };
  return files[module] || [];
}

// Função para renderizar documentos
function renderDocuments() {
  const docList = document.getElementById('doc-list');
  
  let filteredDocs = allDocuments;
  
  if (currentFilter !== 'todos') {
    filteredDocs = filteredDocs.filter(doc => doc.module === currentFilter);
  }
  
  if (currentSearch.trim()) {
    const searchTerm = currentSearch.toLowerCase().trim();
    filteredDocs = filteredDocs.filter(doc => {
      const searchText = `${doc.title} ${doc.description} ${doc.tag} ${doc.tags.join(' ')}`.toLowerCase();
      return searchText.includes(searchTerm);
    });
  }
  
  if (filteredDocs.length === 0) {
    docList.innerHTML = '<p class="docs-empty">nenhum documento encontrado para essa busca.</p>';
    updateCounts();
    return;
  }
  
  const grouped = {};
  filteredDocs.forEach(doc => {
    if (!grouped[doc.module]) grouped[doc.module] = [];
    grouped[doc.module].push(doc);
  });
  
  let html = '';
  
  for (const [module, docs] of Object.entries(grouped)) {
    const displayName = MODULES[module] || module;
    html += `
      <div class="doc-module" data-module="${module}">
        <div class="doc-module-head">
          <h2>~/módulos/${displayName}</h2>
          <span class="doc-module-count">${docs.length}</span>
        </div>
    `;
    
    docs.forEach(doc => {
      html += `
        <a class="doc-row reveal" href="#" data-doc="${doc.module}/${doc.slug}" data-search="${doc.title} ${doc.description} ${doc.tag}">
          <span class="doc-date">${doc.date}</span>
          <div class="doc-info">
            <h3>${sanitizeHTML(doc.title)}</h3>
            <p>${sanitizeHTML(doc.description)}</p>
          </div>
          <span class="doc-tag">${sanitizeHTML(doc.tag)}</span>
        </a>
      `;
    });
    
    html += `</div>`;
  }
  
  docList.innerHTML = html;
  
  document.querySelectorAll('[data-doc]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const docPath = this.dataset.doc;
      showDocument(docPath);
    });
  });
  
  updateCounts();
}

// Função para mostrar documento em overlay
function showDocument(docPath) {
  const [module, slug] = docPath.split('/');
  const doc = allDocuments.find(d => d.module === module && d.slug === slug);
  
  if (!doc) {
    alert('Documento não encontrado');
    return;
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'doc-overlay';
  overlay.innerHTML = `
    <div class="doc-overlay-content">
      <button class="doc-overlay-close" aria-label="Fechar documento">✕</button>
      <div class="doc-overlay-body">
        <h1>${sanitizeHTML(doc.title)}</h1>
        ${doc.date ? `<p class="doc-date">${doc.date}</p>` : ''}
        ${doc.tags.length ? `<p class="doc-tags">Tags: ${doc.tags.map(t => `<span class="doc-tag">${sanitizeHTML(t)}</span>`).join(' ')}</p>` : ''}
        <div class="doc-content">
          ${doc.content}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.querySelector('.doc-overlay-close').addEventListener('click', () => {
    overlay.remove();
  });
  
  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      this.remove();
    }
  });
  
  const closeHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', closeHandler);
    }
  };
  document.addEventListener('keydown', closeHandler);
}

// Atualizar contadores
function updateCounts() {
  const chips = document.querySelectorAll('.module-chip');
  chips.forEach(chip => {
    const module = chip.dataset.module;
    const countSpan = chip.querySelector('.chip-count');
    
    if (module === 'todos') {
      countSpan.textContent = allDocuments.length;
      return;
    }
    
    const count = allDocuments.filter(doc => doc.module === module).length;
    countSpan.textContent = count;
  });
}

// Configurar busca e filtros
function setupSearchAndFilters() {
  const searchInput = document.querySelector('[data-docs-search]');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearch = this.value;
      renderDocuments();
    });
  }
  
  const chips = document.querySelectorAll('.module-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', function() {
      chips.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.module;
      renderDocuments();
    });
  });
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
  setupSearchAndFilters();
  discoverDocuments();
});