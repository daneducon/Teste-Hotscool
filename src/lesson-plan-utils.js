export const LESSON_CATEGORIES = [
  ['Cadastros Gerais', 'cadastros-gerais'], ['Comercial', 'comercial'],
  ['Contábil/Fiscal', 'contabil-fiscal'], ['Custos', 'custos'],
  ['Entradas Financeiro', 'entradas-financeiro'], ['Geral', 'geral'],
  ['Industrial - PCP Têxtil', 'industrial-pcp-textil'],
  ['Industrial PCP Confecção', 'industrial-pcp-confeccao'],
  ['Recursos Humanos', 'recursos-humanos'], ['Sem categoria', 'sem-categoria'],
];

export const LESSON_LEVELS = [
  ['Iniciante', 'iniciante'], ['Intermediário', 'intermediario'], ['Avançado', 'avancado'],
];

export const LESSON_COMPATIBILITIES = [
  ['Consistem ERP 8.1', 'consistem-erp-8-1'], ['Consistem ERP 8.2', 'consistem-erp-8-2'],
  ['Consistem Componentes 8.0', 'consistem-componentes-8-0'],
  ['Consistem Componentes 8.1', 'consistem-componentes-8-1'],
];

export function normalizeLessonKey(value) {
  return String(value ?? '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function classifySheet(name) {
  const key = normalizeLessonKey(name);
  if (/(gercon|geral|dados|cabecalho|capa)/.test(key)) return 'GERCON';
  if (/(matriz|conteudo|aulas|unidade|programas)/.test(key)) return 'MATRIZ';
  return 'OTHER';
}

function findColumn(headers, terms) {
  return headers.findIndex((header) => {
    const normalized = normalizeLessonKey(header);
    return terms.some((term) => normalized.includes(term));
  });
}

function splitValues(value) {
  return String(value ?? '').split(/[,;|\n\r]+/).map((item) => item.trim()).filter(Boolean);
}

function cleanPrograms(value, programMap) {
  return [...new Set(splitValues(value).filter((item) => !/^(n\/?a|n\/?d|-|nenhum)$/i.test(item)).map((item) => {
    const cleaned = item.replace(/^[%@#$\[({]+/, '').replace(/[\])}]+$/, '').trim();
    const match = cleaned.match(/^([a-z0-9_-]{3,20})\s*[-:–—]\s*(.+)$/i);
    if (match) {
      const code = match[1].toUpperCase();
      const catalogName = programMap.get(normalizeLessonKey(code));
      return `${code} - ${catalogName || match[2].trim()}`;
    }
    const code = cleaned.toUpperCase();
    return programMap.get(normalizeLessonKey(code)) ? `${code} - ${programMap.get(normalizeLessonKey(code))}` : code;
  }))];
}

function parseMetadata(rows) {
  const metadata = {};
  const writers = [];
  const fields = [
    ['nomeCurso', ['curso', 'nomedocurso', 'titulodocurso', 'treinamento']],
    ['compatibilidadeErp', ['compatibilidadeerp', 'versaoerp', 'versaoconsistemerp', 'consistemerp']],
    ['compatibilidadeComponentes', ['compatibilidadecomponentes', 'versaocomponentes']],
    ['versaoCurso', ['versaodocurso', 'versaocurso', 'versao']],
    ['publicacao', ['publicacao', 'mesano', 'periodo']],
    ['cargaHoraria', ['cargahoraria', 'duracao', 'horastotais']],
    ['modalidade', ['modalidade', 'formato']],
    ['objetivoGeral', ['objetivogeral', 'objetivodocurso']],
    ['publicoAlvo', ['publicoalvo', 'publicodocurso']],
  ];

  rows.slice(0, 300).forEach((row) => {
    row.forEach((cell, index) => {
      const key = normalizeLessonKey(cell);
      if (!key) return;
      const value = row.slice(index + 1).map(String).map((item) => item.trim()).find(Boolean) || '';
      fields.forEach(([field, aliases]) => {
        if (!metadata[field] && aliases.some((alias) => key === alias || (alias.length > 8 && key.startsWith(alias)))) {
          metadata[field] = value;
        }
      });
      if (/^(conteudista|autor|instrutor)\d*$/.test(key) && value) {
        writers.push({ id: crypto.randomUUID(), nome: value, biografia: '' });
      }
    });
  });
  if (metadata.cargaHoraria) {
    metadata.cargaHoraria = metadata.cargaHoraria.match(/[\d.,]+/)?.[0] || metadata.cargaHoraria;
  }
  return { metadata, writers };
}

export async function parseLessonWorkbook(file, programCatalog = []) {
  if (!file || file.size > 10 * 1024 * 1024) throw new Error('Envie uma planilha de até 10 MB.');
  if (!/\.(xlsx|xls|csv|txt)$/i.test(file.name)) throw new Error('Use um arquivo XLSX, XLS, CSV ou TXT.');
  const XLSX = await import('xlsx');
  const programMap = new Map(programCatalog.map((program) => [
    normalizeLessonKey(program.code || program.Código), String(program.name || program.Nome || '').trim(),
  ]).filter(([code, name]) => code && name));
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
  if (!workbook.SheetNames.length || workbook.SheetNames.length > 30) {
    throw new Error('A planilha deve conter entre 1 e 30 abas.');
  }

  const sheets = workbook.SheetNames.map((name) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1, defval: '', blankrows: false, raw: false,
    });
    if (rows.length > 5000) throw new Error(`A aba ${name} excede 5.000 linhas.`);
    return {
      name,
      type: classifySheet(name),
      rows,
      rowCount: rows.length,
      colCount: Math.max(0, ...rows.map((row) => row.length)),
    };
  });
  const matrix = sheets.find((sheet) => sheet.type === 'MATRIZ')
    || sheets.find((sheet) => sheet.type !== 'GERCON') || sheets[0];
  const gercon = sheets.find((sheet) => sheet.type === 'GERCON');

  let headerIndex = matrix.rows.slice(0, 10).findIndex((row) => (
    findColumn(row, ['unidade', 'aula', 'titulo', 'conteudo']) >= 0
  ));
  if (headerIndex < 0) headerIndex = 0;
  const headers = matrix.rows[headerIndex] || [];
  const titleColumn = findColumn(headers, ['unidade', 'aula', 'titulo', 'conteudo']);
  const objectiveColumn = findColumn(headers, ['objetivoaprendizagem', 'objetivo']);
  const descriptionColumn = findColumn(headers, ['descricaooa', 'descricao']);
  const programColumn = findColumn(headers, ['programasutilizados', 'programa', 'codigo']);
  if (titleColumn < 0) throw new Error('Não foi possível identificar a coluna de aula ou unidade.');

  const units = [];
  let currentTitle = '';
  matrix.rows.slice(headerIndex + 1).forEach((row) => {
    const explicitTitle = String(row[titleColumn] ?? '').trim();
    if (explicitTitle) currentTitle = explicitTitle;
    if (!currentTitle) return;
    const objective = objectiveColumn >= 0 ? String(row[objectiveColumn] ?? '').trim() : '';
    const descriptions = descriptionColumn >= 0 ? splitValues(row[descriptionColumn]) : [];
    const programs = programColumn >= 0 ? cleanPrograms(row[programColumn], programMap) : [];
    let unit = units.find((item) => item.tituloUnidade === currentTitle);
    if (!unit) {
      unit = { index: units.length + 1, tituloUnidade: currentTitle, objetivos: [], descricaoOA: [], programas: [] };
      units.push(unit);
    }
    if (objective && !unit.objetivos.includes(objective)) unit.objetivos.push(objective);
    descriptions.forEach((item) => { if (!unit.descricaoOA.includes(item)) unit.descricaoOA.push(item); });
    programs.forEach((item) => { if (!unit.programas.includes(item)) unit.programas.push(item); });
  });
  if (!units.length) throw new Error('Nenhuma aula foi encontrada na matriz.');

  const { metadata, writers } = parseMetadata(gercon?.rows || []);
  return {
    units,
    metadata,
    writers,
    analysis: {
      fileName: file.name,
      matrixName: matrix.name,
      gerconName: gercon?.name || '',
      totalUnits: units.length,
      sheets: sheets.map(({ name, type, rowCount, colCount }) => ({ name, type, rowCount, colCount })),
      warnings: gercon ? [] : ['Aba Gercon não identificada; revise os metadados manualmente.'],
    },
  };
}

export async function downloadLessonTemplate() {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const matrix = XLSX.utils.aoa_to_sheet([
    ['Unidade/Aula', 'Objetivo de Aprendizagem', 'Descrição OA', 'Programas Utilizados'],
    ['Configuração inicial', 'Configurar parâmetros essenciais', 'Preparar o ambiente para operação', 'CCPGA010 - Configuração'],
  ]);
  const gercon = XLSX.utils.aoa_to_sheet([
    ['Nome do Curso', 'Formação Consistem ERP'], ['Versão do Curso', '1.0'],
    ['Publicação', 'Março/2026'], ['Carga Horária', '8'], ['Modalidade', 'EAD'],
    ['Versão Consistem ERP', '8.2'], ['Versão Componentes', '8.1'],
  ]);
  XLSX.utils.book_append_sheet(workbook, matrix, 'MATRIZ');
  XLSX.utils.book_append_sheet(workbook, gercon, 'GERCON');
  XLSX.writeFile(workbook, 'Modelo_Plano_Aula_Consistem.xlsx');
}

export function formatLessonCompatibility(plan) {
  const values = [];
  if (plan.compatibilidadeErp) values.push(`Consistem ERP [${plan.compatibilidadeErp}]`);
  if (plan.compatibilidadeComponentes) values.push(`Componentes ERP [${plan.compatibilidadeComponentes}]`);
  return values.join(' + ') || 'Consistem ERP';
}

function safeFilename(value) {
  return String(value || 'curso').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 45);
}

export async function downloadLessonPdf(plan) {
  const documentPages = [...document.querySelectorAll('#lessonPlanApp .lesson-document-pages .lesson-document')];
  if (!documentPages.length) throw new Error('Pré-visualização do plano não encontrada.');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
    document.fonts?.ready || Promise.resolve(),
  ]);
  const backgroundUrl = getComputedStyle(documentPages[0]).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
  let letterheadDataUrl = null;
  if (backgroundUrl) {
    try {
      const response = await fetch(backgroundUrl);
      if (response.ok) {
        const blob = await response.blob();
        letterheadDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch {}
  }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  for (let page = 0; page < documentPages.length; page += 1) {
    const captureId = `lesson-pdf-page-${page}`;
    documentPages[page].dataset.pdfCapture = captureId;
    const canvas = await html2canvas(documentPages[page], {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      onclone(clonedDocument) {
        if (!letterheadDataUrl) return;
        const clonedPage = clonedDocument.querySelector(`[data-pdf-capture="${captureId}"]`);
        if (clonedPage) {
          clonedPage.style.backgroundImage = 'none';
          clonedPage.style.backgroundColor = 'transparent';
          clonedPage.style.boxShadow = 'none';
        }
      },
    });
    delete documentPages[page].dataset.pdfCapture;
    if (page > 0) doc.addPage();
    if (letterheadDataUrl) doc.addImage(letterheadDataUrl, 'PNG', 0, 0, 210, 297, 'lesson-letterhead', 'FAST');
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }

  doc.save(`Plano_Ensino_${safeFilename(plan.nomeCurso)}_v${safeFilename(plan.versaoCurso || '1.0')}.pdf`);
}

function cdata(value) {
  return `<![CDATA[${String(value ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function generateLessonWordPressXml(plan) {
  const wp = plan.wordpressData;
  const postmeta = (key, value) => `<wp:postmeta><wp:meta_key>${cdata(key)}</wp:meta_key><wp:meta_value>${cdata(value)}</wp:meta_value></wp:postmeta>`;
  const optionGroups = [
    [LESSON_CATEGORIES, wp.categorias, 'category'],
    [LESSON_LEVELS, wp.niveis, 'nivel'],
    [LESSON_COMPATIBILITIES, wp.compatibilidades, 'compatibilidade'],
  ];
  const categories = optionGroups.flatMap(([options, selected, domain]) => selected.flatMap((slug) => {
    const option = options.find((item) => item[1] === slug);
    return option ? [`<category domain="${domain}" nicename="${slug}">${cdata(option[0])}</category>`] : [];
  })).join('\n');
  const syllabus = plan.unidades.map((unit, index) => (
    `<h3>Aula ${unit.index || index + 1} | ${escapeHtml(unit.tituloUnidade)}</h3>`
      + `<ul>${unit.objetivos.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      + (unit.programas.length ? `<p><strong>Programas utilizados:</strong></p><ul>${unit.programas.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '')
  )).join('\n');
  const learning = [postmeta('aprendizados', String(plan.unidades.length)), postmeta('_aprendizados', 'field_68717d2b765f2')];
  plan.unidades.forEach((unit, index) => {
    learning.push(postmeta(`aprendizados_${index}_aprender`, unit.tituloUnidade));
    learning.push(postmeta(`_aprendizados_${index}_aprender`, 'field_68717d59765f3'));
  });
  const metadata = [
    ['publico', plan.publicoAlvo], ['aulas', wp.numeroDeAulas], ['dias_acesso', wp.diasAcesso],
    ['conteudo', syllabus], ['carga_horaria', `${plan.cargaHoraria || ''} horas`],
    ['valor', wp.valor], ['plano_ensino', wp.linkPlanoEnsinoPdf], ['link_venda', wp.linkLms],
    ['requisitos', wp.requisitosTecnicos], ['_thumbnail_id', wp.idImagemDestacada],
  ].map(([key, value]) => postmeta(key, value)).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/"><channel><wp:wxr_version>1.2</wp:wxr_version><item><title>${cdata(plan.nomeCurso)}</title><content:encoded>${cdata(wp.descricaoPrincipal)}</content:encoded><excerpt:encoded>${cdata(wp.resumoCurto)}</excerpt:encoded><wp:status>${cdata('draft')}</wp:status><wp:post_type>${cdata('curso')}</wp:post_type>${categories}${metadata}${learning.join('\n')}</item></channel></rss>`;
}

export function downloadLessonXml(plan) {
  const blob = new Blob([generateLessonWordPressXml(plan)], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `WP_Import_${safeFilename(plan.nomeCurso)}.xml`;
  anchor.click();
  URL.revokeObjectURL(url);
}
