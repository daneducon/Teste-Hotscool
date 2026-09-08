import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';

import {
  generateLessonWordPressXml,
  parseLessonWorkbook,
} from '../src/lesson-plan-utils.js';

function basePlan() {
  return {
    nomeCurso: 'Curso ]]> Seguro', cargaHoraria: '8', publicoAlvo: 'Analistas',
    unidades: [{ index: 1, tituloUnidade: '<Configuração>', objetivos: ['Validar <dados>'], programas: ['ABC010'] }],
    wordpressData: {
      categorias: ['geral'], niveis: ['iniciante'], compatibilidades: [],
      descricaoPrincipal: 'Descrição', resumoCurto: 'Resumo', numeroDeAulas: '1',
      diasAcesso: '365', valor: '100', linkPlanoEnsinoPdf: 'https://example.com/plano.pdf',
      linkLms: 'https://example.com', requisitosTecnicos: 'Internet', idImagemDestacada: '1',
    },
  };
}

test('WordPress XML safely handles CDATA and syllabus HTML', () => {
  const xml = generateLessonWordPressXml(basePlan());
  assert.match(xml, /Curso ]]]]><!\[CDATA\[> Seguro/);
  assert.match(xml, /&lt;Configuração&gt;/);
  assert.match(xml, /&lt;dados&gt;/);
  assert.match(xml, /<wp:status><!\[CDATA\[draft]]><\/wp:status>/);
});

test('lesson workbook parser recognizes MATRIZ and GERCON sheets', async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['Unidade', 'Objetivo', 'Descrição OA', 'Programas'],
    ['Cadastros', 'Configurar parâmetros', 'Preparar ambiente', 'ABC010 - Cadastro'],
    ['', 'Validar dados', '', 'ABC020'],
  ]), 'MATRIZ');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ['Nome do Curso', 'Formação ERP'], ['Carga Horária', '8 horas'],
  ]), 'GERCON');
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const file = { name: 'plano.xlsx', size: bytes.byteLength, arrayBuffer: async () => bytes };

  const result = await parseLessonWorkbook(file);
  assert.equal(result.metadata.nomeCurso, 'Formação ERP');
  assert.equal(result.units.length, 1);
  assert.deepEqual(result.units[0].objetivos, ['Configurar parâmetros', 'Validar dados']);
  assert.deepEqual(result.units[0].programas, ['ABC010 - Cadastro', 'ABC020']);
});
