const STORAGE_KEY = 'gm-procuracao-draft-v1';
const form = document.getElementById('document-form');
const preview = document.getElementById('preview');
const loading = document.getElementById('preview-loading');
const guardianSection = document.getElementById('guardian-section');
const guardianTitle = document.getElementById('guardian-title');
const pageCount = document.getElementById('page-count');
const peopleContainer = document.getElementById('people-container');
const addPersonBtn = document.getElementById('add-person');

const GOLD = [179, 135, 49];
const GRAY = [88, 88, 92];
const LIGHT_GRAY = [224, 225, 227];
const FOOTER_GRAY = [125, 125, 128];
const MAPS_URL = 'https://maps.app.goo.gl/r8CVrczAXdqNZc6u9';
const WHATSAPP_URL = 'https://wa.me/5562993161514';
const PEOPLE_LIMIT = 4;

const PERSON_FIELD_GROUPS = [
  { fields: [
    { name: 'name', label: 'Nome completo', span: true, autocomplete: 'name' },
    { name: 'nationality', label: 'Nacionalidade' },
    { name: 'maritalStatus', label: 'Estado civil' },
    { name: 'profession', label: 'Profissão' },
    { name: 'rg', label: 'RG' },
    { name: 'rgIssuer', label: 'Órgão expedidor' },
    { name: 'cpf', label: 'CPF', cpf: true },
    { name: 'email', label: 'E-mail', span: true, type: 'email', autocomplete: 'email' },
  ] },
  { sublegend: 'Endereço', fields: [
    { name: 'street', label: 'Logradouro', span: true, autocomplete: 'street-address' },
    { name: 'number', label: 'Número' },
    { name: 'complement', label: 'Complemento' },
    { name: 'neighborhood', label: 'Bairro' },
    { name: 'zip', label: 'CEP', autocomplete: 'postal-code' },
    { name: 'city', label: 'Cidade', autocomplete: 'address-level2' },
    { name: 'state', label: 'UF', maxlength: 2, autocomplete: 'address-level1' },
  ] },
];

const ATTORNEYS = 'Adauto Aparecido de Morais, inscrito na OAB/GO, sob o n.º 33.799; Jales Gregório de Oliveira Sousa, inscrito na OAB/GO, sob o n.º 62.131; e Matheus Ricardo de Sousa Ferreira, inscrito na OAB/GO, sob o n.º 60.162, todos integrantes do escritório Gregório & Morais, com endereço profissional indicado no rodapé deste instrumento, aos quais confere os poderes constantes desta procuração.';

const POWER_COLUMNS = [
  {
    title: 'REPRESENTAR EM\nQUALQUER LUGAR',
    headerIcon: 'building',
    body: 'propõe ações e defender; atuar em qualquer instância, recurso ou tribunal superior; utilizar todos os recursos cabíveis; acessar e solicitar documentos',
    examples: [
      { icon: 'building', label: 'tribunal' },
      { icon: 'people', label: 'órgãos públicos' },
      { icon: 'person', label: 'particulares' },
    ],
  },
  {
    title: 'PODE TOMAR DECISÕES\nPOR MIM',
    headerIcon: 'document',
    body: 'receber citações; confessar ou reconhecer pedido; fazer acordos e desistir de processos; renunciar direitos, receber valores e dar quitação; firmar declaração de hipossuficiência',
    examples: [
      { icon: 'document', label: 'petição' },
      { icon: 'check', label: 'acordo' },
      { icon: 'pen', label: 'assinatura' },
      { icon: 'receipt', label: 'recibo' },
    ],
  },
  {
    title: 'PODE TRANSFERIR\nPODERES',
    headerIcon: 'arrowTransfer',
    body: 'substabelecer total ou parcialmente, com ou sem reserva de poderes',
    examples: [
      { icon: 'document', label: 'substabelecimento' },
    ],
  },
];

function strokeIcon(doc, color, weight, fn) {
  doc.setDrawColor(...color);
  doc.setLineWidth(weight);
  fn();
}

const ICONS = {
  building(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.07, () => {
      doc.line(x + s * 0.02, y + s * 0.42, x + s * 0.5, y + s * 0.04);
      doc.line(x + s * 0.5, y + s * 0.04, x + s * 0.98, y + s * 0.42);
      doc.line(x + s * 0.08, y + s * 0.42, x + s * 0.92, y + s * 0.42);
      [0.22, 0.5, 0.78].forEach(fx => doc.line(x + s * fx, y + s * 0.5, x + s * fx, y + s * 0.86));
      doc.line(x, y + s * 0.92, x + s, y + s * 0.92);
    });
  },
  people(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.065, () => {
      doc.circle(x + s * 0.34, y + s * 0.26, s * 0.15, 'S');
      doc.circle(x + s * 0.7, y + s * 0.26, s * 0.15, 'S');
      doc.roundedRect(x + s * 0.16, y + s * 0.46, s * 0.36, s * 0.44, s * 0.1, s * 0.1, 'S');
      doc.roundedRect(x + s * 0.5, y + s * 0.46, s * 0.36, s * 0.44, s * 0.1, s * 0.1, 'S');
    });
  },
  person(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.08, () => {
      doc.circle(x + s * 0.5, y + s * 0.24, s * 0.2, 'S');
      doc.roundedRect(x + s * 0.18, y + s * 0.5, s * 0.64, s * 0.46, s * 0.12, s * 0.12, 'S');
    });
  },
  document(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.07, () => {
      doc.roundedRect(x + s * 0.14, y, s * 0.72, s, s * 0.06, s * 0.06, 'S');
      [0.3, 0.5, 0.7].forEach(fy => doc.line(x + s * 0.27, y + s * fy, x + s * 0.73, y + s * fy));
    });
  },
  check(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.08, () => {
      doc.circle(x + s / 2, y + s / 2, s / 2 - s * 0.04, 'S');
      doc.line(x + s * 0.28, y + s * 0.52, x + s * 0.44, y + s * 0.68);
      doc.line(x + s * 0.44, y + s * 0.68, x + s * 0.74, y + s * 0.32);
    });
  },
  pen(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.09, () => {
      doc.line(x + s * 0.1, y + s * 0.92, x + s * 0.78, y + s * 0.18);
      doc.line(x + s * 0.78, y + s * 0.18, x + s * 0.92, y + s * 0.06);
      doc.line(x + s * 0.08, y + s * 0.94, x + s * 0.18, y + s * 0.84);
    });
  },
  receipt(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.065, () => {
      doc.rect(x + s * 0.16, y, s * 0.68, s * 0.78, 'S');
      [0.22, 0.42, 0.6].forEach(fy => doc.line(x + s * 0.27, y + s * fy, x + s * 0.73, y + s * fy));
    });
  },
  arrowTransfer(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.09, () => {
      doc.line(x + s * 0.06, y + s * 0.5, x + s * 0.84, y + s * 0.5);
      doc.line(x + s * 0.84, y + s * 0.5, x + s * 0.62, y + s * 0.3);
      doc.line(x + s * 0.84, y + s * 0.5, x + s * 0.62, y + s * 0.7);
    });
  },
  calendar(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.07, () => {
      doc.roundedRect(x, y + s * 0.16, s, s * 0.8, s * 0.07, s * 0.07, 'S');
      doc.line(x + s * 0.2, y, x + s * 0.2, y + s * 0.3);
      doc.line(x + s * 0.8, y, x + s * 0.8, y + s * 0.3);
      doc.line(x, y + s * 0.42, x + s, y + s * 0.42);
    });
  },
  clock(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.08, () => {
      doc.circle(x + s / 2, y + s / 2, s / 2 - s * 0.05, 'S');
      doc.line(x + s / 2, y + s / 2, x + s / 2, y + s * 0.22);
      doc.line(x + s / 2, y + s / 2, x + s * 0.7, y + s / 2);
    });
  },
  phone(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.09, () => {
      doc.roundedRect(x + s * 0.28, y, s * 0.44, s, s * 0.14, s * 0.14, 'S');
      doc.line(x + s * 0.42, y + s * 0.84, x + s * 0.58, y + s * 0.84);
    });
  },
  pin(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.08, () => {
      doc.circle(x + s / 2, y + s * 0.34, s * 0.3, 'S');
      doc.line(x + s * 0.28, y + s * 0.56, x + s * 0.5, y + s * 0.96);
      doc.line(x + s * 0.72, y + s * 0.56, x + s * 0.5, y + s * 0.96);
      doc.circle(x + s / 2, y + s * 0.34, s * 0.1, 'S');
    });
  },
  envelope(doc, x, y, s, color) {
    strokeIcon(doc, color, s * 0.07, () => {
      doc.rect(x, y + s * 0.16, s, s * 0.68, 'S');
      doc.line(x, y + s * 0.16, x + s / 2, y + s * 0.54);
      doc.line(x + s, y + s * 0.16, x + s / 2, y + s * 0.54);
    });
  },
};

function drawIcon(doc, type, x, y, s, color = GOLD) {
  const icon = ICONS[type];
  if (icon) icon(doc, x, y, s, color);
}

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

function formatCPF(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  let result = groups.join('.');
  if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
  return result;
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
  const draft = { mode: state.mode, people: [], guardian: {}, document: {} };
  for (const element of form.elements) {
    if (!element.name) continue;
    const parts = element.name.split('.');
    if (parts[0] === 'people') {
      const [, index, field] = parts;
      const i = Number(index);
      draft.people[i] = draft.people[i] || {};
      draft.people[i][field] = element.value;
    } else {
      const [group, field] = parts;
      if (draft[group]) draft[group][field] = element.value;
    }
  }
  if (!draft.people.length) draft.people = [{}];
  return draft;
}

function setDraft(draft) {
  state.mode = ['normal', 'under16', 'over16'].includes(draft?.mode) ? draft.mode : 'normal';
  for (const element of form.elements) {
    if (!element.name) continue;
    const parts = element.name.split('.');
    if (parts[0] === 'people') continue;
    const [group, field] = parts;
    const value = draft?.[group]?.[field];
    if (value != null) element.value = value;
  }
  if (!form.elements['document.date'].value) form.elements['document.date'].value = todayISO();
  updateModeUI();
}

function renderPeopleUI(savedPeople) {
  const people = savedPeople && savedPeople.length ? savedPeople : [{}];
  peopleContainer.innerHTML = '';

  people.forEach((person, index) => {
    const card = document.createElement('div');
    card.className = 'person-card';

    const head = document.createElement('div');
    head.className = 'person-card-head';
    const title = document.createElement('strong');
    title.textContent = people.length > 1 ? `Outorgante ${index + 1}` : 'Outorgante';
    head.appendChild(title);
    if (index > 0) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-person';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', `Remover outorgante ${index + 1}`);
      removeBtn.addEventListener('click', () => removePerson(index));
      head.appendChild(removeBtn);
    }
    card.appendChild(head);

    PERSON_FIELD_GROUPS.forEach(group => {
      if (group.sublegend) {
        const sub = document.createElement('div');
        sub.className = 'sub-legend';
        sub.textContent = group.sublegend;
        card.appendChild(sub);
      }
      const grid = document.createElement('div');
      grid.className = 'field-grid';
      group.fields.forEach(field => {
        const label = document.createElement('label');
        if (field.span) label.className = 'span-2';
        label.textContent = field.label;
        const input = document.createElement('input');
        input.name = `people.${index}.${field.name}`;
        if (field.type) input.type = field.type;
        if (field.autocomplete) input.autocomplete = field.autocomplete;
        if (field.maxlength) input.maxLength = field.maxlength;
        if (field.cpf) input.inputMode = 'numeric';
        input.value = person[field.name] || '';
        label.appendChild(input);
        grid.appendChild(label);
      });
      card.appendChild(grid);
    });

    peopleContainer.appendChild(card);
  });

  peopleContainer.querySelectorAll('input[name$=".cpf"]').forEach(input => {
    input.addEventListener('input', () => { input.value = formatCPF(input.value); });
  });

  addPersonBtn.disabled = people.length >= PEOPLE_LIMIT;
  addPersonBtn.textContent = people.length >= PEOPLE_LIMIT
    ? `Limite de ${PEOPLE_LIMIT} outorgantes atingido`
    : '+ Adicionar outorgante';
}

function removePerson(index) {
  const draft = getDraft();
  draft.people.splice(index, 1);
  renderPeopleUI(draft.people);
  saveDraft();
  updatePreview();
}

function joinQualifications(list) {
  const items = list.filter(Boolean);
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  const trimmed = items.map(t => (t.endsWith('.') ? t.slice(0, -1) : t));
  return `${trimmed.slice(0, -1).join('; ')}; e ${trimmed[trimmed.length - 1]}.`;
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
  if (person.zip) pieces.push(`CEP: ${clean(person.zip)}`);
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
  if (person.cpf) segments.push(`inscrito(a) no CPF sob o nº ${formatCPF(person.cpf)}`);
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
    loadCroppedImage('./assets/watermark.png', { x: 0, y: 0, w: 1414, h: 2000 }),
  ]);
  state.assets = { logo, wordmark, watermark };
}

function drawWatermark(doc) {
  if (!state.assets.watermark) return;
  if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 0.18 }));
  doc.addImage(state.assets.watermark, 'PNG', 134.4, 42.3, 150, 212.3);
  if (doc.GState && doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
}

function drawHeader(doc, title = 'PROCURAÇÃO') {
  if (state.assets.logo) doc.addImage(state.assets.logo, 'PNG', 95.3, 5, 19.4, 30);
  if (state.assets.wordmark) doc.addImage(state.assets.wordmark, 'PNG', 74.1, 38, 61.8, 11);
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
  doc.setTextColor(...FOOTER_GRAY);
  doc.setFontSize(9);

  const rows = [
    { icon: 'phone', text: '(62) 9 9316-1514', y: 282, link: WHATSAPP_URL },
    { icon: 'pin', text: 'GO-010, Km 67, Zona Rural, Silvânia-GO', y: 287, link: MAPS_URL },
    { icon: 'envelope', text: 'gregorioemorais.adv@gmail.com', y: 292 },
  ];
  const iconSize = 3;
  const gap = 1.6;
  rows.forEach(({ icon, text, y, link }) => {
    const textWidth = doc.getTextWidth(text);
    const startX = 105 - (iconSize + gap + textWidth) / 2;
    drawIcon(doc, icon, startX, y - iconSize * 0.78, iconSize, FOOTER_GRAY);
    if (link) doc.textWithLink(text, startX + iconSize + gap, y, { url: link });
    else doc.text(text, startX + iconSize + gap, y);
  });
}

function drawPageChrome(doc, title = 'PROCURAÇÃO') {
  drawWatermark(doc);
  drawHeader(doc, title);
  drawFooter(doc);
}

function stampPageNumbers(doc) {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...FOOTER_GRAY);
    doc.text(`Página ${p} de ${total}`, 190, 292, { align: 'right' });
  }
}

function drawPersonIcon(doc, x, y) {
  drawIcon(doc, 'person', x + 1, y, 13, GOLD);
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
    drawIcon(doc, column.headerIcon, center - 3, y + 1, 6, GOLD);
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

  const examplesY = bodyY + maxBodyLines * 4.5 + 9;
  doc.line(left, examplesY - 6, left + width, examplesY - 6);
  doc.setFont('times', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(...GRAY);

  const rowH = 5.4;
  const iconSize = 3.4;
  const gap = 1.5;
  const maxItems = Math.max(...POWER_COLUMNS.map(c => c.examples.length));
  POWER_COLUMNS.forEach((column, index) => {
    const center = left + col * index + col / 2;
    const blockHeight = column.examples.length * rowH;
    const startY = examplesY + (maxItems * rowH - blockHeight) / 2;
    const blockWidth = Math.max(...column.examples.map(item => iconSize + gap + doc.getTextWidth(item.label)));
    const startX = center - blockWidth / 2;
    column.examples.forEach((item, i) => {
      const rowY = startY + i * rowH + rowH * 0.65;
      drawIcon(doc, item.icon, startX, rowY - iconSize * 0.78, iconSize, GOLD);
      doc.text(item.label, startX + iconSize + gap, rowY);
    });
  });

  const bottom = examplesY + maxItems * rowH + 4;
  doc.line(left, bottom, left + width, bottom);
  return bottom;
}

function drawClosing(doc, draft, y) {
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...GRAY);

  const line1 = 'Art. 105, Código de Processo Civil.';
  const line2 = 'Mandato válido até revogação expressa.';
  const w1 = doc.getTextWidth(line1);
  const w2 = doc.getTextWidth(line2);
  drawIcon(doc, 'document', 190 - w1 - 6, y + 9 - 3.4, 4, GOLD);
  doc.text(line1, 190, y + 9, { align: 'right' });
  drawIcon(doc, 'clock', 190 - w2 - 6, y + 15 - 3.4, 4, GOLD);
  doc.text(line2, 190, y + 15, { align: 'right' });

  const location = clean(draft.document.location);
  const date = formatLongDate(draft.document.date);
  const closing = joinParts([location, date]);
  if (closing) {
    drawIcon(doc, 'calendar', 20, y + 22 - 4, 4, GOLD);
    doc.text(`${closing}.`, 26, y + 22);
  }
  return y + 22;
}

function drawSignature(doc, label, x, y, width = 78) {
  drawIcon(doc, 'pen', x - 6.5, y - 4.5, 4.4, GRAY);
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
  const peopleList = draft.people && draft.people.length ? draft.people : [{}];
  const qualifications = peopleList.map(p => buildQualification(p, { ageClause: ageClause(draft) }));
  const activeCount = qualifications.filter(Boolean).length;
  const personText = joinQualifications(qualifications);
  const outorganteTitle = activeCount > 1 ? 'OUTORGANTES' : 'OUTORGANTE';
  y = drawSection(doc, outorganteTitle, personText, y);

  if (draft.mode !== 'normal') {
    const title = draft.mode === 'under16' ? 'REPRESENTANTE' : 'ASSISTENTE';
    const guardianText = buildQualification(draft.guardian, {
      quality: draft.mode === 'over16' ? clean(draft.guardian.relation) : '',
    });
    y = drawSection(doc, title, guardianText, y);
  }

  y = drawSection(doc, draft.mode === 'under16' ? 'OUTORGADOS' : 'OUTORGADO', ATTORNEYS, y);
  if (y > 174) y = addContentPage(doc);
  y = drawPowers(doc, y + 2);
  if (y > 242) y = addContentPage(doc);
  y = drawClosing(doc, draft, y + 3);

  if (draft.mode === 'normal') {
    const signatureCount = Math.max(1, activeCount);
    let sigY = Math.min(254, y + 18);
    for (let i = 0; i < signatureCount; i += 1) {
      if (sigY > 254) sigY = addContentPage(doc);
      drawSignature(doc, 'OUTORGANTE', 66, sigY, 78);
      sigY += 18;
    }
  } else {
    addContentPage(doc, '');
    if (draft.mode === 'under16') {
      drawSignature(doc, 'OUTORGANTE/REPRESENTANTE', 66, 76, 78);
    } else {
      drawSignature(doc, 'OUTORGANTE', 66, 76, 78);
      drawSignature(doc, 'ASSISTENTE', 66, 94, 78);
    }
  }

  stampPageNumbers(doc);
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
      preview.src = `${state.previewUrl}#view=FitH`;
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

['guardian.cpf'].forEach(name => {
  const input = form.elements[name];
  if (input) input.addEventListener('input', () => { input.value = formatCPF(input.value); });
});

addPersonBtn.addEventListener('click', () => {
  const draft = getDraft();
  if (draft.people.length >= PEOPLE_LIMIT) return;
  draft.people.push({});
  renderPeopleUI(draft.people);
  saveDraft();
  updatePreview();
  const cards = peopleContainer.querySelectorAll('.person-card');
  cards[cards.length - 1]?.querySelector('input')?.focus();
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

document.getElementById('print').addEventListener('click', () => {
  try {
    preview.contentWindow.focus();
    preview.contentWindow.print();
  } catch (error) {
    console.error('Falha ao imprimir', error);
    if (state.previewUrl) window.open(state.previewUrl, '_blank');
  }
});

document.getElementById('clear').addEventListener('click', () => {
  if (!confirm('Limpar todos os campos desta procuração?')) return;
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  renderPeopleUI([{}]);
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
  const draft = loadDraft();
  renderPeopleUI(draft.people);
  setDraft(draft);
  try {
    await loadAssets();
  } catch (error) {
    console.error('Falha ao carregar identidade visual', error);
  }
  updatePreview();
}

init();
