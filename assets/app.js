const STORAGE_KEY = 'gm-procuracao-draft-v1';
const form = document.getElementById('document-form');
const preview = document.getElementById('preview');
const loading = document.getElementById('preview-loading');
const guardianSection = document.getElementById('guardian-section');
const guardianTitle = document.getElementById('guardian-title');
const pageCount = document.getElementById('page-count');

const GOLD = [179, 135, 49];
const GRAY = [88, 88, 92];
const LIGHT_GRAY = [224, 225, 227];

const ATTORNEYS = 'Adauto Aparecido de Morais, inscrito na OAB/GO, sob o n.º 33.799; Jales Gregório de Oliveira Sousa, inscrito na OAB/GO, sob o n.º 62.131; e Matheus Ricardo de Sousa Ferreira, inscrito na OAB/GO, sob o n.º 60.162, todos integrantes do escritório Gregório & Morais, com endereço profissional indicado no rodapé deste instrumento, aos quais confere os poderes constantes desta procuração.';

const POWER_COLUMNS = [
  {
    title: 'REPRESENTAR EM\nQUALQUER LUGAR',
    body: 'propor ações e defender; atuar em qualquer instância, recurso ou tribunal superior; utilizar todos os recursos cabíveis; acessar e solicitar documentos',
    examples: 'tribunal, órgãos públicos, particulares',
  },
  {
    title: 'PODE TOMAR DECISÕES\nPOR MIM',
    body: 'receber citações; confessar ou reconhecer pedido; fazer acordos e desistir de processos; renunciar direitos, receber valores e dar quitação; firmar declaração de hipossuficiência',
    examples: 'petição, acordo, assinatura, recibo',
  },
  {
    title: 'PODE TRANSFERIR\nPODERES',
    body: 'substabelecer total ou parcialmente, com ou sem reserva de poderes',
    examples: 'substabelecimento',
  },
];

const state = {
  mode: 'normal',
  assets: {},
  previewUrl: null,
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function clean(value) {
  return String(value || '').trim();
}

function joinParts(parts, separator = ', ') {
  return parts.map(clean).filter(Boolean).join(separator);
}

function normalizeFilename(value) {
  return (clean(value) || 'procuracao')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'procuracao';
}

function formatLongDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getDraft() {
  const draft = { mode: state.mode, person: {}, guardian: {}, document: {} };
  for (const element of form.elements) {
    if (!element.name) continue;
    const [group, field] = element.name.split('.');
    if (draft[group]) draft[group][field] = element.value;
  }
  return draft;
}

function setDraft(draft) {
  state.mode = ['normal', 'under16', 'over16'].includes(draft?.mode) ? draft.mode : 'normal';
  for (const element of form.elements) {
    if (!element.name) continue;
    const [group, field] = element.name.split('.');
    const value = draft?.[group]?.[field];
    if (value != null) element.value = value;
  }
  if (!form.elements['document.date'].value) form.elements['document.date'].value = todayISO();
  updateModeUI();
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getDraft()));
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function updateModeUI() {
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.mode === state.mode);
  });
  const isMinor = state.mode !== 'normal';
  guardianSection.hidden = !isMinor;
  guardianTitle.textContent = state.mode === 'under16' ? 'Representante' : 'Assistente';
}

function buildAddress(person) {
  const street = joinParts([
    person.street,
    person.number && `nº ${person.number}`,
    person.complement,
    person.neighborhood,
  ]);
  const cityState = joinParts([person.city, person.state], '/');
  const pieces = [];
  if (street) pieces.push(street);
  if (person.zip) pieces.push(`CEP ${clean(person.zip)}`);
  if (cityState) pieces.push(cityState);
  return joinParts(pieces);
}

function buildQualification(person, options = {}) {
  const segments = [];
  const identity = joinParts([
    clean(person.name).toUpperCase(),
    person.nationality,
    person.maritalStatus,
    person.profession,
  ]);
  if (identity) segments.push(identity);

  if (options.ageClause) segments.push(options.ageClause);

  if (person.rg) {
    const issuer = clean(person.rgIssuer);
    segments.push(`portador(a) do RG nº ${clean(person.rg)}${issuer ? ` - ${issuer}` : ''}`);
  }
  if (person.cpf) segments.push(`inscrito(a) no CPF sob o nº ${clean(person.cpf)}`);
  if (person.email) segments.push(`e-mail: ${clean(person.email)}`);

  const address = buildAddress(person);
  if (address) segments.push(`residente e domiciliado(a) em ${address}`);
  if (options.quality) segments.push(`na qualidade de ${options.quality} do outorgante`);

  return segments.length ? `${segments.join(', ')}.` : '';
}

function ageClause(draft) {
  const relation = clean(draft.guardian.relation);
  const responsible = relation ? ` por seu/sua ${relation}` : '';
  if (draft.mode === 'under16') return `menor impúbere, representado(a)${responsible}`;
  if (draft.mode === 'over16') return `menor, assistido(a)${responsible}`;
  return '';
}

function loadCroppedImage(src, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.w;
      canvas.height = crop.h;
      canvas.getContext('2d').drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = src;
  });
}

async function loadAssets() {
  const [logo, wordmark, watermark] = await Promise.all([
    loadCroppedImage('./assets/logo.png', { x: 200, y: 234, w: 623, h: 962 }),
    loadCroppedImage('./assets/wordmark.png', { x: 238, y: 384, w: 1068, h: 190 }),
    loadCroppedImage('./assets/watermark.png', { x: 23, y: 380, w: 1369, h: 1318 }),
  ]);
  state.assets = { logo, wordmark, watermark };
}

function drawWatermark(doc) {
  if (!state.assets.watermark) return;
  if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 0.1 }));
  doc.addImage(state.assets.watermark, 'PNG', 127, 82, 86, 108);
  if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
}

function drawHeader(doc, title = 'PROCURAÇÃO') {
  if (state.assets.logo) doc.addImage(state.assets.logo, 'PNG', 91, 4, 28, 38);
  if (state.assets.wordmark) doc.addImage(state.assets.wordmark, 'PNG', 68, 38, 74, 13);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  doc.line(0, 56, 210, 56);
  doc.setFont('times', 'bold');
  doc.setTextColor(...GOLD);
  doc.setFontSize(13);
  doc.text(title, 105, 62, { align: 'center' });
}

function drawFooter(doc) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.25);
  doc.line(0, 274, 210, 274);
  doc.setLineWidth(0.8);
  doc.line(0, 294, 210, 294);
  doc.setLineWidth(0.3);
  doc.line(0, 296, 210, 296);
  doc.setFont('times', 'normal');
  doc.setTextColor(125, 125, 128);
  doc.setFontSize(9);
  doc.text('(62) 9 9316-1514', 105, 282, { align: 'center' });
  doc.text('GO-010, Km 67, Zona Rural, Silvânia-GO', 105, 287, { align: 'center' });
  doc.text('gregorioemorais.adv@gmail.com', 105, 292, { align: 'center' });
}

function drawPageChrome(doc, title = 'PROCURAÇÃO') {
  drawWatermark(doc);
  drawHeader(doc, title);
  drawFooter(doc);
}

function drawPersonIcon(doc, x, y) {
  doc.setFillColor(...GOLD);
  doc.circle(x + 7, y + 6, 4, 'F');
  doc.roundedRect(x + 1, y + 11, 12, 10, 2, 2, 'F');
}

function drawSection(doc, title, text, y) {
  if (!text) return y;
  drawPersonIcon(doc, 20, y + 1);
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...GOLD);
  doc.text(title, 44, y + 5);
  doc.setFont('times', 'normal');
  doc.setFontSize(10.6);
  doc.setTextColor(...GRAY);
  const lines = doc.splitTextToSize(text, 145);
  doc.text(lines, 44, y + 11, { lineHeightFactor: 1.22, align: 'justify', maxWidth: 145 });
  return y + Math.max(27, 13 + lines.length * 5.1);
}

function drawPowers(doc, y) {
  const left = 19;
  const width = 172;
  const col = width / 3;
  doc.setDrawColor(35, 35, 35);
  doc.setLineWidth(0.2);
  doc.line(left, y, left + width, y);
  doc.setFont('times', 'bold');
  doc.setTextColor(...GOLD);
  doc.setFontSize(10.5);

  let maxBodyLines = 0;
  const bodies = POWER_COLUMNS.map(column => {
    const lines = doc.splitTextToSize(column.body, col - 8);
    maxBodyLines = Math.max(maxBodyLines, lines.length);
    return lines;
  });

  POWER_COLUMNS.forEach((column, index) => {
    const center = left + col * index + col / 2;
    doc.setFillColor(...GOLD);
    doc.roundedRect(center - 3, y + 3, 6, 6, 1, 1, 'F');
    doc.text(column.title.split('\n'), center, y + 13, { align: 'center', lineHeightFactor: 1.05 });
  });

  const bodyY = y + 24;
  doc.line(left, bodyY - 2, left + width, bodyY - 2);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.8);
  doc.setTextColor(...GRAY);
  bodies.forEach((lines, index) => {
    const center = left + col * index + col / 2;
    doc.text(lines, center, bodyY + 3, { align: 'center', lineHeightFactor: 1.12 });
  });

  const examplesY = bodyY + maxBodyLines * 4.5 + 7;
  doc.line(left, examplesY - 4, left + width, examplesY - 4);
  doc.setFontSize(9.3);
  POWER_COLUMNS.forEach((column, index) => {
    const center = left + col * index + col / 2;
    const lines = doc.splitTextToSize(column.examples, col - 8);
    doc.text(lines, center, examplesY, { align: 'center', lineHeightFactor: 1.08 });
  });
  const bottom = examplesY + 10;
  doc.line(left, bottom, left + width, bottom);
  return bottom;
}

function drawClosing(doc, draft, y) {
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...GRAY);
  doc.text('Art. 105, Código de Processo Civil.', 190, y + 9, { align: 'right' });
  doc.text('Mandato válido até revogação expressa.', 190, y + 15, { align: 'right' });
  const location = clean(draft.document.location);
  const date = formatLongDate(draft.document.date);
  const closing = joinParts([location, date]);
  if (closing) doc.text(`${closing}.`, 20, y + 22);
  return y + 22;
}

function drawSignature(doc, label, x, y, width = 78) {
  doc.setDrawColor(100, 100, 102);
  doc.setLineWidth(0.25);
  doc.line(x, y, x + width, y);
  doc.setFont('times', 'bold');
  doc.setTextColor(...GRAY);
  doc.setFontSize(10.5);
  doc.text(label, x + width / 2, y + 6, { align: 'center' });
}

function addContentPage(doc, title = 'PROCURAÇÃO') {
  doc.addPage('a4', 'portrait');
  drawPageChrome(doc, title);
  return 69;
}

function generateDocument(draft = getDraft()) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  doc.setProperties({ title: 'Procuração', author: 'Gregório & Morais Advogados' });
  drawPageChrome(doc);

  let y = 69;
  const personText = buildQualification(draft.person, { ageClause: ageClause(draft) });
  y = drawSection(doc, 'OUTORGANTE', personText, y);

  if (draft.mode !== 'normal') {
    const title = draft.mode === 'under16' ? 'REPRESENTANTE' : 'ASSISTENTE';
    const guardianText = buildQualification(draft.guardian, {
      quality: clean(draft.guardian.relation),
    });
    y = drawSection(doc, title, guardianText, y);
  }

  y = drawSection(doc, draft.mode === 'under16' ? 'OUTORGADOS' : 'OUTORGADO', ATTORNEYS, y);
  if (y > 174) y = addContentPage(doc);
  y = drawPowers(doc, y + 2);
  if (y > 242) y = addContentPage(doc);
  y = drawClosing(doc, draft, y + 3);

  if (draft.mode === 'normal') {
    drawSignature(doc, 'OUTORGANTE', 66, Math.min(254, y + 18), 78);
  } else {
    addContentPage(doc, '');
    if (draft.mode === 'under16') {
      drawSignature(doc, 'OUTORGANTE/REPRESENTANTE', 66, 76, 78);
    } else {
      drawSignature(doc, 'OUTORGANTE', 66, 76, 78);
      drawSignature(doc, 'ASSISTENTE', 66, 94, 78);
    }
  }

  return doc;
}

let previewTimer;

async function updatePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    loading.hidden = false;
    try {
      const doc = generateDocument();
      const blob = doc.output('blob');
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = URL.createObjectURL(blob);
      preview.src = state.previewUrl;
      pageCount.textContent = `${doc.getNumberOfPages()} página${doc.getNumberOfPages() === 1 ? '' : 's'} · A4`;
    } catch (error) {
      console.error(error);
      pageCount.textContent = 'Erro na prévia';
    } finally {
      loading.hidden = true;
    }
  }, 280);
}

document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    state.mode = button.dataset.mode;
    updateModeUI();
    saveDraft();
    updatePreview();
  });
});

form.addEventListener('input', () => {
  saveDraft();
  updatePreview();
});

form.addEventListener('change', () => {
  saveDraft();
  updatePreview();
});

document.getElementById('download').addEventListener('click', () => {
  const draft = getDraft();
  const doc = generateDocument(draft);
  doc.save(`${normalizeFilename(draft.document.filename)}.pdf`);
});

document.getElementById('clear').addEventListener('click', () => {
  if (!confirm('Limpar todos os campos desta procuração?')) return;
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  state.mode = 'normal';
  form.elements['document.location'].value = 'Silvânia/GO';
  form.elements['document.date'].value = todayISO();
  form.elements['document.filename'].value = 'procuracao';
  updateModeUI();
  updatePreview();
});

window.addEventListener('beforeunload', () => {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
});

async function init() {
  setDraft(loadDraft());
  try {
    await loadAssets();
  } catch (error) {
    console.error('Falha ao carregar identidade visual', error);
  }
  updatePreview();
}

init();
