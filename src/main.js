const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================================
// 1. SIDEBAR NAVIGATION
// ==========================================
const sidebarBtns = document.querySelectorAll('.sidebar-btn[data-sidebar]');
const tabContents = document.querySelectorAll('.tab-content');
const breadcrumbPage = document.getElementById('breadcrumbPage');

const tabNames = {
  search: 'Consulta do Aluno',
  register: 'Gestao de Alunos / Cadastro & Matricula Individual',
  csv: 'Matricula em Lote (CSV)',
};

function switchTab(target) {
  sidebarBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sidebar === target);
  });
  tabContents.forEach((tc) => {
    const isActive = tc.id === target + 'Tab';
    tc.classList.toggle('active', isActive);
    tc.style.display = isActive ? 'block' : 'none';
  });
  if (breadcrumbPage) breadcrumbPage.textContent = tabNames[target] || '';

  if (target === 'register') ensureSchoolsLoaded();
  else if (target === 'csv') ensureCsvSchoolsLoaded();
}

sidebarBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.sidebar));
});

// ==========================================
// 2. ABA 1: CONSULTA DE ALUNO
// ==========================================
const searchForm = document.getElementById('searchForm');
const emailInput = document.getElementById('emailInput');
const searchBtn = document.getElementById('searchBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const errorMsg = document.getElementById('errorMsg');
const searchClearBtn = document.getElementById('searchClearBtn');

// Dashboard 360 elements
const dashboard = document.getElementById('dashboard');
const dashAvatar = document.getElementById('dashAvatar');
const dashStudentName = document.getElementById('dashStudentName');
const dashStudentEmail = document.getElementById('dashStudentEmail');
const dashSchoolText = document.getElementById('dashSchoolText');
const dashEmailConfirmTag = document.getElementById('dashEmailConfirmTag');
const dashAccessText = document.getElementById('dashAccessText');
const dashCadTag = document.getElementById('dashCadTag');
const dashCadText = document.getElementById('dashCadText');
const dashOrgTag = document.getElementById('dashOrgTag');
const dashOrgText = document.getElementById('dashOrgText');
const dashOrgSep = document.getElementById('dashOrgSep');
const dashCodeTag = document.getElementById('dashCodeTag');
const dashCodeText = document.getElementById('dashCodeText');
const dashCadSep = document.getElementById('dashCadSep');

// KPIs
const dashKpiTotalCourses = document.getElementById('dashKpiTotalCourses');
const dashKpiTotalCoursesSub = document.getElementById('dashKpiTotalCoursesSub');
const dashKpiProgress = document.getElementById('dashKpiProgress');
const dashKpiCompletedCourses = document.getElementById('dashKpiCompletedCourses');
const dashKpiCertificates = document.getElementById('dashKpiCertificates');
const dashKpiGamification = document.getElementById('dashKpiGamification');
const dashKpiGamificationSub = document.getElementById('dashKpiGamificationSub');

// Sub-abas
const subtabCoursesBtn = document.querySelector('[data-subtab="courses"]');
const subtabCertsBtn = document.querySelector('[data-subtab="certs"]');
const subtabGamificationBtn = document.querySelector('[data-subtab="gamification"]');
const subtabAcademicBtn = document.querySelector('[data-subtab="academic"]');
const subtabCourses = document.getElementById('subtabCourses');
const subtabCerts = document.getElementById('subtabCerts');
const subtabGamification = document.getElementById('subtabGamification');
const subtabAcademic = document.getElementById('subtabAcademic');
const countSubtabCourses = document.getElementById('countSubtabCourses');
const countSubtabCerts = document.getElementById('countSubtabCerts');
const subtabsSummary = document.getElementById('subtabsSummary');

const dashCoursesContainer = document.getElementById('dashCoursesContainer');
const dashCertsContainer = document.getElementById('dashCertsContainer');

// Gamificacao
const dashGamifLevelName = document.getElementById('dashGamifLevelName');
const dashGamifBadgeText = document.getElementById('dashGamifBadgeText');
const dashGamifPoints = document.getElementById('dashGamifPoints');
const dashGamifCoins = document.getElementById('dashGamifCoins');
const dashGamifActions = document.getElementById('dashGamifActions');

// Academicos
const dashDetailDept = document.getElementById('dashDetailDept');
const dashDetailUnit = document.getElementById('dashDetailUnit');
const dashDetailRole = document.getElementById('dashDetailRole');
const dashDetailCode = document.getElementById('dashDetailCode');
const dashDetailTrails = document.getElementById('dashDetailTrails');

let currentStudentDashboardData = null;

function switchDashboardSubtab(target) {
  const allBtns = [subtabCoursesBtn, subtabCertsBtn, subtabGamificationBtn, subtabAcademicBtn];
  const allPanels = [subtabCourses, subtabCerts, subtabGamification, subtabAcademic];

  allBtns.forEach((btn) => btn?.classList.remove('active'));
  allPanels.forEach((p) => {
    if (p) {
      p.classList.remove('active');
      p.style.display = 'none';
    }
  });

  const map = { courses: 0, certs: 1, gamification: 2, academic: 3 };
  const idx = map[target];
  if (idx !== undefined && allBtns[idx] && allPanels[idx]) {
    allBtns[idx].classList.add('active');
    allPanels[idx].classList.add('active');
    allPanels[idx].style.display = 'block';
  }
}

if (subtabCoursesBtn) subtabCoursesBtn.addEventListener('click', () => switchDashboardSubtab('courses'));
if (subtabCertsBtn) subtabCertsBtn.addEventListener('click', () => switchDashboardSubtab('certs'));
if (subtabGamificationBtn) subtabGamificationBtn.addEventListener('click', () => switchDashboardSubtab('gamification'));
if (subtabAcademicBtn) subtabAcademicBtn.addEventListener('click', () => switchDashboardSubtab('academic'));

function setSearchLoading(loading) {
  searchBtn.disabled = loading;
  btnText.style.display = loading ? 'none' : 'inline';
  btnLoader.style.display = loading ? 'inline-block' : 'none';
  emailInput.disabled = loading;
}

function showSearchError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
}

function hideSearchError() {
  errorMsg.style.display = 'none';
}

if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    emailInput.value = '';
    emailInput.focus();
  });
}

function renderStudentCourses(courses) {
  if (!courses || courses.length === 0) {
    dashCoursesContainer.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--graphite-subtle);background:var(--surface-card);border:1px dashed var(--graphite-border);border-radius:var(--r-lg);">
        Nenhum curso matriculado para este aluno.
      </div>`;
    return;
  }

  dashCoursesContainer.innerHTML = courses.map((c) => {
    const perc = Math.min(100, Math.max(0, c.percentual || 0));
    const isDone = c.concluido || perc >= 100;
    const statusClass = isDone ? 'success' : 'warning';
    const statusText = isDone ? 'Concluido' : 'Em Andamento';
    const turma = c.turma && c.turma !== 'null' ? c.turma : '';

    let actions = '';
    if (isDone && c.certificadoUrl) {
      actions = `<a href="${c.certificadoUrl}" target="_blank" class="btn-cert">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
        Ver Certificado Autenticado
      </a>`;
    } else if (!isDone) {
      actions = `<a href="${c.acessoUrl || 'https://app.hotscool.com'}" target="_blank" rel="noopener noreferrer" class="btn-continue">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Continuar Curso
      </a>`;
    }

    const progressClass = isDone ? 'green' : (perc >= 50 ? 'gold' : '');

    return `
      <div class="course-card">
        <div class="course-card-cover ${c.imagem ? '' : 'empty'}">
          ${c.imagem
            ? `<img src="${c.imagem}" alt="Capa do curso ${c.titulo_curso}" loading="lazy">`
            : `<span>${c.titulo_curso?.slice(0, 1) || 'H'}</span>`}
        </div>
        <div class="course-card-body">
        <div class="course-card-status">
          <span class="status-pill ${statusClass}">${statusText}</span>
          ${turma ? `<span style="font-size:11px;color:var(--graphite-muted)">Turma: ${turma}</span>` : ''}
        </div>
        <h4 class="course-card-title">${c.titulo_curso}</h4>
        <div class="course-card-meta">
          ${c.escola ? `<span>${c.escola}</span>` : ''}
          ${c.categoria ? `<span>+ ${c.categoria}</span>` : ''}
        </div>
        <div class="course-progress-section">
          <div class="course-progress-row">
            <span class="course-progress-label">Progresso${!isDone ? ` (Modulo ${Math.ceil(perc / 25)} de 4)` : ' Concluido'}</span>
            <span class="course-progress-pct" style="color:${isDone ? 'var(--success)' : 'var(--graphite)'}">${c.percentualFormatado || perc + '%'}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${progressClass}" style="width:${perc}%"></div>
          </div>
        </div>
        ${actions ? `<div class="course-card-actions">${actions}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderStudentCertificates(certs) {
  if (!certs || certs.length === 0) {
    dashCertsContainer.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--graphite-subtle);background:var(--surface-card);border:1px dashed var(--graphite-border);border-radius:var(--r-lg);">
        Nenhum certificado emitido ate o momento.
      </div>`;
    return;
  }

  dashCertsContainer.innerHTML = certs.map((c) => `
    <div class="cert-card">
      <div class="cert-info">
        <span class="cert-name">${c.cursoNome}</span>
        <span class="cert-date">Emitido em: ${c.dataEmissao}</span>
      </div>
      <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="cert-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Abrir PDF
      </a>
    </div>`).join('');
}

function showDashboard(data) {
  currentStudentDashboardData = data;

  // Avatar
  const rawNome = data.nome || 'Aluno';
  dashStudentName.textContent = rawNome;
  dashStudentEmail.textContent = data.email || '';
  const registryStudentStatus = document.getElementById('registryStudentStatus');
  const registryStudentId = document.getElementById('registryStudentId');
  const registryExternalCode = document.getElementById('registryExternalCode');
  if (registryStudentStatus) registryStudentStatus.textContent = data.status || 'Nao informado';
  if (registryStudentId) registryStudentId.textContent = data.id ? `#${data.id}` : '-';
  if (registryExternalCode) registryExternalCode.textContent = data.codigoExterno || 'Nao informado';

  if (data.avatar && data.avatar.startsWith('http')) {
    dashAvatar.className = '';
    dashAvatar.innerHTML = `<img src="${data.avatar}" alt="${rawNome}" class="profile-avatar-img">`;
  } else {
    const names = rawNome.trim().split(/\s+/);
    const initials = names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`
      : names[0].slice(0, 2);
    dashAvatar.className = 'profile-avatar-initials';
    dashAvatar.textContent = initials.toUpperCase();
  }

  // Tags
  dashSchoolText.textContent = data.escola || 'Escola Principal';

  if (data.emailConfirmado) {
    dashEmailConfirmTag.style.display = 'inline-flex';
  } else {
    dashEmailConfirmTag.style.display = 'none';
  }

  dashAccessText.textContent = data.ultimoAcesso || 'Nunca acessou';

  if (data.dataCadastro) {
    dashCadTag.style.display = 'inline-flex';
    dashCadText.textContent = data.dataCadastro;
    if (dashCadSep) dashCadSep.style.display = 'inline';
  } else {
    dashCadTag.style.display = 'none';
    if (dashCadSep) dashCadSep.style.display = 'none';
  }

  if (data.departamento || data.unidade || data.cargo) {
    dashOrgTag.style.display = 'inline-flex';
    dashOrgText.textContent = [data.departamento, data.cargo].filter(Boolean).join(' / ') || data.unidade;
    if (dashOrgSep) dashOrgSep.style.display = 'inline';
  } else {
    dashOrgTag.style.display = 'none';
    if (dashOrgSep) dashOrgSep.style.display = 'none';
  }

  if (data.codigoExterno) {
    dashCodeTag.style.display = 'inline-flex';
    dashCodeText.textContent = data.codigoExterno;
  } else {
    dashCodeTag.style.display = 'none';
  }

  // KPIs
  dashKpiTotalCourses.textContent = String(data.totalCursos || 0);
  if (dashKpiTotalCoursesSub) {
    const extra = Math.max(0, (data.totalCursos || 0) - (data.cursosConcluidos || 0));
    dashKpiTotalCoursesSub.textContent = extra > 0 ? `+${extra} ate mais` : 'Todos concluidos';
  }

  const progresso = Math.min(100, Math.max(0, data.progressoGeral || 0));
  dashKpiProgress.textContent = `${progresso}%`;
  dashKpiCompletedCourses.textContent = `${data.cursosConcluidos || 0} Cursos`;
  dashKpiCertificates.textContent = `${data.totalCertificados || 0} Emitidos`;
  dashKpiGamification.textContent = String(data.gamificacao?.pontos || 0);
  if (dashKpiGamificationSub) {
    dashKpiGamificationSub.textContent = `${data.gamificacao?.nivel || 'Nivel Iniciante'} + ${data.gamificacao?.moedas || 0} Moedas`;
  }

  // Counters
  countSubtabCourses.textContent = String(data.totalCursos || 0);
  countSubtabCerts.textContent = String(data.totalCertificados || 0);

  const andamento = (data.totalCursos || 0) - (data.cursosConcluidos || 0);
  const concluidos = data.cursosConcluidos || 0;
  if (subtabsSummary) {
    subtabsSummary.textContent = `${andamento} em andamento + ${concluidos} concluidos`;
  }

  // Render
  renderStudentCourses(data.cursos || []);
  renderStudentCertificates(data.certificados || []);
  renderLearningProgress(data.cursos || []);

  // Gamificacao
  dashGamifLevelName.textContent = data.gamificacao?.nivel || 'Nivel Inicial';
  dashGamifBadgeText.textContent = data.gamificacao?.badge || 'Conquistas e engajamento na plataforma';
  dashGamifPoints.textContent = String(data.gamificacao?.pontos || 0);
  dashGamifCoins.textContent = String(data.gamificacao?.moedas || 0);
  dashGamifActions.textContent = String(data.gamificacao?.acoes || 0);

  // Academicos
  dashDetailDept.textContent = data.departamento || 'Nao atribuido';
  dashDetailUnit.textContent = data.unidade || 'Nao informada';
  dashDetailRole.textContent = data.cargo || 'Nao informado';
  dashDetailCode.textContent = data.codigoExterno || 'Nao informado';

  if (Array.isArray(data.trilhas) && data.trilhas.length > 0) {
    dashDetailTrails.innerHTML = data.trilhas
      .map((t) => `<span class="trail-chip">${t.nome || t.titulo || 'Trilha'}</span>`)
      .join('');
  } else {
    dashDetailTrails.innerHTML = '<span class="trail-empty">Nenhuma trilha vinculada</span>';
  }

  switchDashboardSubtab('courses');
  dashboard.style.display = 'flex';
  dashboard.style.flexDirection = 'column';
  dashboard.style.gap = '24px';
}

function renderLearningProgress(courses) {
  const chart = document.getElementById('learningProgressChart');
  const total = document.getElementById('learningProgressTotal');
  if (!chart || !total) return;

  if (!courses.length) {
    chart.innerHTML = '<span class="chart-empty">Sem cursos para exibir.</span>';
    total.textContent = 'Dados sincronizados agora';
    return;
  }

  chart.innerHTML = courses.slice(0, 6).map((course) => {
    const progress = Math.min(100, Math.max(0, course.percentual || 0));
    const shortTitle = course.titulo_curso.length > 18
      ? `${course.titulo_curso.slice(0, 16)}...`
      : course.titulo_curso;
    return `
      <div class="chart-bar-item" title="${course.titulo_curso}: ${progress}%">
        <span class="bar-value">${progress}%</span>
        <div class="bar" style="height:${Math.max(8, progress)}%">
          <span class="bar-fill ${progress >= 100 ? 'green' : progress >= 50 ? 'gold' : 'coral'}"></span>
        </div>
        <span class="bar-label">${shortTitle}</span>
      </div>`;
  }).join('');
  total.textContent = `${courses.length} curso(s) sincronizado(s)`;
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideSearchError();

  const email = emailInput.value.trim();
  if (!email) { showSearchError('Por favor, insira um e-mail.'); return; }
  if (!EMAIL_REGEX.test(email)) { showSearchError('Por favor, insira um e-mail valido.'); return; }

  setSearchLoading(true);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`/api/student?email=${encodeURIComponent(email)}&refresh=true`);

      if (response.status === 400) {
        showSearchError('E-mail invalido. Verifique e tente novamente.');
        setSearchLoading(false);
        return;
      }
      if (response.status === 404) {
        if (attempt < MAX_RETRIES) {
          btnText.textContent = `Aluno nao encontrado... tentativa ${attempt}/${MAX_RETRIES}`;
          await new Promise((r) => setTimeout(r, RETRY_DELAY));
          continue;
        }
        showSearchError('Aluno nao encontrado. Verifique o e-mail ou aguarde alguns segundos apos o cadastro.');
        dashboard.style.display = 'none';
        setSearchLoading(false);
        return;
      }
      if (!response.ok) {
        showSearchError('Erro ao buscar dados do aluno. Tente novamente mais tarde.');
        setSearchLoading(false);
        return;
      }

      const data = await response.json();
      showDashboard(data);
      setSearchLoading(false);
      return;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        btnText.textContent = `Conectando... tentativa ${attempt}/${MAX_RETRIES}`;
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        continue;
      }
      showSearchError('Erro de conexao com o servidor. Verifique se o backend esta rodando.');
      setSearchLoading(false);
      return;
    }
  }
  setSearchLoading(false);
});

// ==========================================
// 3. ABA 2: CADASTRO INDIVIDUAL
// ==========================================
const registerForm = document.getElementById('registerForm');
const regSchool = document.getElementById('regSchool');
const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regSendEmail = document.getElementById('regSendEmail');
const coursesBadge = document.getElementById('coursesBadge');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const courseFilterInput = document.getElementById('courseFilterInput');
const coursesListContainer = document.getElementById('coursesListContainer');
const regSubmitBtn = document.getElementById('regSubmitBtn');
const regBtnText = document.getElementById('regBtnText');
const regBtnLoader = document.getElementById('regBtnLoader');
const regFeedback = document.getElementById('regFeedback');
const clearRegisterBtn = document.getElementById('clearRegisterBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');

let currentCourses = [];
let selectedCourseIds = new Set();
let schoolsLoaded = false;

async function ensureSchoolsLoaded() {
  if (schoolsLoaded) return;
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Falha ao carregar escolas');
    const data = await res.json();
    const schools = data.schools || [];
    if (schools.length === 0) {
      regSchool.innerHTML = '<option value="" disabled>Nenhuma escola encontrada</option>';
      return;
    }
    regSchool.innerHTML = schools.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
    schoolsLoaded = true;
    loadCoursesForSelectedSchool();
  } catch (err) {
    regSchool.innerHTML = '<option value="" disabled>Erro ao carregar escolas</option>';
  }
}

async function loadCoursesForSelectedSchool() {
  const schoolIdx = regSchool.value;
  if (schoolIdx === '') return;
  coursesListContainer.innerHTML = '<div class="empty-state">Carregando cursos da escola...</div>';
  selectedCourseIds.clear();
  updateSelectedCount();
  try {
    const res = await fetch(`/api/courses?schoolIndex=${schoolIdx}`);
    if (!res.ok) throw new Error('Erro ao buscar cursos');
    const data = await res.json();
    currentCourses = Array.isArray(data.courses) ? data.courses : [];
    renderCoursesList(currentCourses);
  } catch (err) {
    coursesListContainer.innerHTML = '<div class="empty-state">Nao foi possivel carregar os cursos desta escola.</div>';
  }
}

function renderCoursesList(courses) {
  if (courses.length === 0) {
    coursesListContainer.innerHTML = '<div class="empty-state">Nenhum curso ativo encontrado nesta escola.</div>';
    return;
  }
  coursesListContainer.innerHTML = courses.map((c) => {
    const isChecked = selectedCourseIds.has(c.id);
    const duration = c.duracao ? `${c.duracao}h` : '';
    return `
      <label class="course-check-item ${isChecked ? 'selected' : ''}" data-id="${c.id}">
        <input type="checkbox" value="${c.id}" ${isChecked ? 'checked' : ''}>
        <div class="course-check-info">
          <span class="course-check-name">${c.nome}</span>
          <div class="course-check-meta">
            ${c.categoria ? `<span>${c.categoria}</span>` : ''}
          </div>
        </div>
        ${duration ? `<span class="course-check-duration">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${duration}
        </span>` : ''}
      </label>`;
  }).join('');

  coursesListContainer.querySelectorAll('.course-check-item').forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    const courseId = Number(item.getAttribute('data-id'));
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedCourseIds.add(courseId);
        item.classList.add('selected');
      } else {
        selectedCourseIds.delete(courseId);
        item.classList.remove('selected');
      }
      updateSelectedCount();
    });
  });
}

function updateSelectedCount() {
  const count = selectedCourseIds.size;
  coursesBadge.textContent = `${count} curso${count === 1 ? '' : 's'} selecionado${count === 1 ? '' : 's'}`;
}

if (courseFilterInput) {
  courseFilterInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = currentCourses.filter(
      (c) => c.nome.toLowerCase().includes(term) || (c.categoria && c.categoria.toLowerCase().includes(term))
    );
    renderCoursesList(filtered);
  });
}

if (selectAllBtn) {
  selectAllBtn.addEventListener('click', () => {
    const term = courseFilterInput.value.toLowerCase().trim();
    const visible = term ? currentCourses.filter((c) => c.nome.toLowerCase().includes(term)) : currentCourses;
    visible.forEach((c) => selectedCourseIds.add(c.id));
    renderCoursesList(visible);
    updateSelectedCount();
  });
}

if (deselectAllBtn) {
  deselectAllBtn.addEventListener('click', () => {
    selectedCourseIds.clear();
    const term = courseFilterInput.value.toLowerCase().trim();
    const visible = term ? currentCourses.filter((c) => c.nome.toLowerCase().includes(term)) : currentCourses;
    renderCoursesList(visible);
    updateSelectedCount();
  });
}

if (regSchool) regSchool.addEventListener('change', loadCoursesForSelectedSchool);

function setRegisterLoading(loading) {
  regSubmitBtn.disabled = loading;
  regBtnText.style.display = loading ? 'none' : 'inline';
  regBtnLoader.style.display = loading ? 'inline-block' : 'none';
}

function showRegisterFeedback(type, message) {
  regFeedback.className = `feedback-box ${type}`;
  regFeedback.innerHTML = message;
  regFeedback.style.display = 'block';
}

function hideRegisterFeedback() {
  regFeedback.style.display = 'none';
}

if (clearRegisterBtn) {
  clearRegisterBtn.addEventListener('click', () => {
    registerForm.reset();
    hideRegisterFeedback();
    selectedCourseIds.clear();
    updateSelectedCount();
    renderCoursesList(currentCourses);
  });
}

if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener('click', () => {
    regPassword.value = '';
  });
}

if (regSubmitBtn) {
  regSubmitBtn.addEventListener('click', () => registerForm.requestSubmit());
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideRegisterFeedback();

    const nome = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    const schoolIndex = regSchool.value;

    if (!nome) { showRegisterFeedback('error', 'Por favor, informe o nome completo do aluno.'); return; }
    if (!email || !EMAIL_REGEX.test(email)) { showRegisterFeedback('error', 'Por favor, informe um e-mail valido.'); return; }
    if (password && password.length < 6) { showRegisterFeedback('error', 'A senha deve ter no minimo 6 caracteres.'); return; }
    if (schoolIndex === '') { showRegisterFeedback('error', 'Por favor, selecione uma escola.'); return; }

    const courseIds = Array.from(selectedCourseIds);
    const selectedCourseTitles = currentCourses.filter((c) => selectedCourseIds.has(c.id)).map((c) => c.nome);

    setRegisterLoading(true);
    regBtnText.textContent = courseIds.length > 0
      ? `Matriculando em ${courseIds.length} curso(s)...`
      : 'Cadastrando aluno...';

    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, email, password, schoolIndex, courseIds,
          enviar_email_notificacao: regSendEmail?.checked ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showRegisterFeedback('error', `${data.error || 'Erro ao realizar cadastro.'}`);
        return;
      }

      const cursosHtml = selectedCourseTitles.length > 0
        ? `<ul style="margin:8px 0 8px 20px;font-size:13px;">${selectedCourseTitles.map((t) => `<li>${t}</li>`).join('')}</ul>` : '';

      showRegisterFeedback('success',
        `<strong>${data.message}</strong>${cursosHtml}` +
        `<p style="font-size:12px;margin-top:8px;opacity:0.7;">O cadastro e instantaneo. Pode levar alguns segundos para aparecer na consulta.</p>` +
        `<button type="button" id="goToSearchBtn" class="btn-coral" style="margin-top:12px;padding:8px 16px;font-size:13px;width:auto;">Ver cadastro deste aluno</button>`
      );

      const goToSearchBtn = document.getElementById('goToSearchBtn');
      if (goToSearchBtn) {
        goToSearchBtn.addEventListener('click', () => {
          emailInput.value = email;
          switchTab('search');
          searchForm.dispatchEvent(new Event('submit'));
        });
      }

      regName.value = '';
      regEmail.value = '';
      regPassword.value = '';
      selectedCourseIds.clear();
      updateSelectedCount();
      renderCoursesList(currentCourses);
    } catch (err) {
      showRegisterFeedback('error', 'Erro de comunicacao com o servidor. Verifique se o backend esta rodando.');
    } finally {
      setRegisterLoading(false);
      regBtnText.textContent = 'Cadastrar e Matricular Aluno';
    }
  });
}

// ==========================================
// 4. ABA 3: MATRICULA EM LOTE CSV
// ==========================================
const csvSchoolSelect = document.getElementById('csvSchoolSelect');
const csvPaisSelect = document.getElementById('csvPaisSelect');
const csvDefaultPassword = document.getElementById('csvDefaultPassword');
const csvForceWelcomeEmail = document.getElementById('csvForceWelcomeEmail');
const csvDropzone = document.getElementById('csvDropzone');
const csvFileInput = document.getElementById('csvFileInput');
const csvFileInfoBar = document.getElementById('csvFileInfoBar');
const csvFileNameText = document.getElementById('csvFileNameText');
const csvFileSizeText = document.getElementById('csvFileSizeText');
const btnRemoveFile = document.getElementById('btnRemoveFile');
const togglePasteBtn = document.getElementById('togglePasteBtn');
const pasteWrapper = document.getElementById('pasteWrapper');
const csvPasteTextarea = document.getElementById('csvPasteTextarea');
const btnAnalyzeCsv = document.getElementById('btnAnalyzeCsv');
const btnAnalyzeText = document.getElementById('btnAnalyzeText');
const btnAnalyzeLoader = document.getElementById('btnAnalyzeLoader');
const csvUploadFeedback = document.getElementById('csvUploadFeedback');

const csvUploadSection = document.getElementById('csvUploadSection');
const csvPreviewSection = document.getElementById('csvPreviewSection');
const csvExecutionSection = document.getElementById('csvExecutionSection');

const previewFileName = document.getElementById('previewFileName');
const previewFileMeta = document.getElementById('previewFileMeta');
const kpiTotalStudents = document.getElementById('kpiTotalStudents');
const kpiTotalEnrollments = document.getElementById('kpiTotalEnrollments');
const kpiUniqueCourses = document.getElementById('kpiUniqueCourses');
const kpiMissingCourses = document.getElementById('kpiMissingCourses');
const previewFilterInput = document.getElementById('previewFilterInput');
const btnBackToUpload = document.getElementById('btnBackToUpload');
const btnBackToUpload2 = document.getElementById('btnBackToUpload2');
const btnExecuteEnrollments = document.getElementById('btnExecuteEnrollments');
const btnExecuteText = document.getElementById('btnExecuteText');
const previewTableBody = document.getElementById('previewTableBody');
const filterAllCount = document.getElementById('filterAllCount');
const filterDefaultCount = document.getElementById('filterDefaultCount');
const filterCustomCount = document.getElementById('filterCustomCount');
const confirmStudentCount = document.getElementById('confirmStudentCount');
const confirmEnrollCount = document.getElementById('confirmEnrollCount');

const execSpeed = document.getElementById('execSpeed');
const execProcessedCount = document.getElementById('execProcessedCount');
const execTotalCount = document.getElementById('execTotalCount');
const execTimeEstimate = document.getElementById('execTimeEstimate');
const executionProgressPercent = document.getElementById('executionProgressPercent');
const batchProgressBar = document.getElementById('batchProgressBar');
const execSuccessCount = document.getElementById('execSuccessCount');
const execSuccessPct = document.getElementById('execSuccessPct');
const execFailCount = document.getElementById('execFailCount');
const execFailBadge = document.getElementById('execFailBadge');
const execRemainingCount = document.getElementById('execRemainingCount');
const execRemainingPct = document.getElementById('execRemainingPct');
const executionLogList = document.getElementById('executionLogList');
const logTotalCount = document.getElementById('logTotalCount');
const logTotalCount2 = document.getElementById('logTotalCount2');
const logVisibleCount = document.getElementById('logVisibleCount');
const btnCopyLog = document.getElementById('btnCopyLog');
const btnRestartBatch = document.getElementById('btnRestartBatch');
const btnGoToSearch = document.getElementById('btnGoToSearch');
const discardBatchBtn = document.getElementById('discardBatchBtn');
const execEmailsSent = document.getElementById('execEmailsSent');
const execRetries = document.getElementById('execRetries');
const clearCsvBtn = document.getElementById('clearCsvBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');

// Stepper elements
const stepEls = document.querySelectorAll('.stepper .step');

function setStepperStep(num) {
  stepEls.forEach((s) => {
    const sNum = Number(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (sNum < num) s.classList.add('completed');
    else if (sNum === num) s.classList.add('active');
  });
}

function showCsvSection(section) {
  csvUploadSection.style.display = 'none';
  csvPreviewSection.style.display = 'none';
  csvExecutionSection.style.display = 'none';
  csvUploadSection.classList.remove('active');
  csvPreviewSection.classList.remove('active');
  csvExecutionSection.classList.remove('active');

  if (section === 'upload') {
    csvUploadSection.style.display = 'block';
    csvUploadSection.classList.add('active');
    setStepperStep(1);
  } else if (section === 'preview') {
    csvPreviewSection.style.display = 'block';
    csvPreviewSection.classList.add('active');
    setStepperStep(2);
  } else if (section === 'execution') {
    csvExecutionSection.style.display = 'block';
    csvExecutionSection.classList.add('active');
    setStepperStep(3);
  }
}

let csvSelectedFile = null;
let csvLoadedSchools = [];
let csvSchoolCoursesCache = new Map();
let parsedStudentsData = [];

async function ensureCsvSchoolsLoaded() {
  if (csvLoadedSchools.length > 0) return;
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Falha ao carregar escolas');
    const data = await res.json();
    csvLoadedSchools = data.schools || [];
    if (csvLoadedSchools.length === 0) {
      csvSchoolSelect.innerHTML = '<option value="" disabled>Nenhuma escola encontrada</option>';
      return;
    }
    csvSchoolSelect.innerHTML = csvLoadedSchools.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  } catch (err) {
    csvSchoolSelect.innerHTML = '<option value="" disabled>Erro ao carregar escolas</option>';
  }
}

// Drag & Drop
if (csvDropzone) {
  csvDropzone.addEventListener('dragover', (e) => { e.preventDefault(); csvDropzone.classList.add('dragover'); });
  csvDropzone.addEventListener('dragleave', () => csvDropzone.classList.remove('dragover'));
  csvDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    csvDropzone.classList.remove('dragover');
    if (e.dataTransfer.files?.length) handleSelectedFile(e.dataTransfer.files[0]);
  });
}
if (csvFileInput) {
  csvFileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) handleSelectedFile(e.target.files[0]);
  });
}

function handleSelectedFile(file) {
  csvSelectedFile = file;
  csvFileNameText.textContent = file.name;
  csvFileSizeText.textContent = `${(file.size / 1024).toFixed(1)} KB`;
  csvFileInfoBar.style.display = 'flex';
  csvDropzone.style.display = 'none';
  hideCsvFeedback();
}

if (btnRemoveFile) {
  btnRemoveFile.addEventListener('click', () => {
    csvSelectedFile = null;
    csvFileInput.value = '';
    csvFileInfoBar.style.display = 'none';
    csvDropzone.style.display = 'block';
  });
}

if (togglePasteBtn) {
  togglePasteBtn.addEventListener('click', () => {
    pasteWrapper.style.display = pasteWrapper.style.display === 'none' ? 'block' : 'none';
  });
}

if (clearCsvBtn) {
  clearCsvBtn.addEventListener('click', () => {
    csvSelectedFile = null;
    parsedStudentsData = [];
    csvFileInput.value = '';
    csvPasteTextarea.value = '';
    csvFileInfoBar.style.display = 'none';
    csvDropzone.style.display = 'block';
    hideCsvFeedback();
  });
}

if (downloadTemplateBtn) {
  downloadTemplateBtn.addEventListener('click', () => {
    const csv = 'nome;email;enviar email para definir senha;senha;ID dos Conteudos;cpf;endereco;numero;cidade;estado;cep;departamento;ddd;celular\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_matricula_hotscool.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

function showCsvFeedback(type, message) {
  csvUploadFeedback.className = `feedback-box ${type}`;
  csvUploadFeedback.innerHTML = message;
  csvUploadFeedback.style.display = 'block';
}
function hideCsvFeedback() { csvUploadFeedback.style.display = 'none'; }

function setCsvAnalyzeLoading(loading) {
  btnAnalyzeCsv.disabled = loading;
  btnAnalyzeText.style.display = loading ? 'none' : 'inline';
  btnAnalyzeLoader.style.display = loading ? 'inline-block' : 'none';
}

// CSV Parser
function parseCsvRows(text) {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const countSemi = (headerLine.match(/;/g) || []).length;
  const countComma = (headerLine.match(/,/g) || []).length;
  const delimiter = countSemi >= countComma ? ';' : ',';

  function splitRespectingQuotes(line, delim) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delim && !inQuotes) {
        result.push(current.trim().replace(/^"(.*)"$/, '$1').trim());
        current = '';
      } else current += char;
    }
    result.push(current.trim().replace(/^"(.*)"$/, '$1').trim());
    return result;
  }

  const rawHeaders = splitRespectingQuotes(headerLine, delimiter);
  const normalizedHeaders = rawHeaders.map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  );

  const parsedStudents = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitRespectingQuotes(lines[i], delimiter);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;
    const row = {};
    cols.forEach((val, idx) => { const h = normalizedHeaders[idx]; if (h) row[h] = val; });

    const nome = row.nome || row.aluno || cols[0] || '';
    const email = row.email || row.emaildoaluno || cols[1] || '';
    if (!nome.trim() && !email.trim()) continue;

    const rawNotify = row.enviaremailparadefinirsenha || row.enviaremail || row.notificacao || cols[2] || '';
    const senha = row.senha || row.password || cols[3] || '';

    let rawCourses = '';
    const courseKeys = Object.keys(row).filter((k) => k.includes('conteudo') || k.includes('contedo') || k.includes('curso') || k.includes('id'));
    if (courseKeys.length > 0) {
      const exactKey = courseKeys.find((k) => k.includes('conteudo') || k.includes('contedo')) || courseKeys[0];
      rawCourses = row[exactKey];
    } else rawCourses = cols[4] || '';

    const cpf = row.cpf || cols[5] || '';
    const endereco = row.endereco || row.endereo || cols[6] || '';
    const numero = row.numero || row.nmero || cols[7] || '';
    const cidade = row.cidade || cols[8] || '';
    const estado = row.estado || row.uf || cols[9] || '';
    const cep = row.cep || cols[10] || '';
    const departamento = row.departamento || row.dept || '';
    const ddd = row.ddd || '';
    const celular = row.celular || row.telefone || '';

    const cleanedCoursesStr = String(rawCourses || '').replace(/["']/g, '').trim();
    const courseIdList = cleanedCoursesStr
      ? [...new Set(cleanedCoursesStr.split(/[,;]/).map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id) && id > 0))]
      : [];

    const shouldNotify = String(rawNotify).trim().toLowerCase() === 'sim' || String(rawNotify).trim() === '1' || csvForceWelcomeEmail?.checked;

    parsedStudents.push({
      idOriginal: i, nome: nome.trim(), email: email.trim().toLowerCase(), senha: senha.trim(),
      shouldNotify, courseIds: courseIdList, cpf: cpf.trim(), ddd: ddd.trim(), celular: celular.trim(),
      cep: cep.trim(), endereco: endereco.trim(), numero: numero.trim(), cidade: cidade.trim(),
      estado: estado.trim(), departamento: departamento.trim(),
    });
  }
  return parsedStudents;
}

async function fetchSchoolCourses(schoolIndex) {
  const idx = Number(schoolIndex);
  if (csvSchoolCoursesCache.has(idx)) return csvSchoolCoursesCache.get(idx);
  const res = await fetch(`/api/courses?schoolIndex=${idx}`);
  if (!res.ok) throw new Error('Nao foi possivel obter a lista de cursos da escola na Hotscool.');
  const data = await res.json();
  const courses = Array.isArray(data.courses) ? data.courses : [];
  csvSchoolCoursesCache.set(idx, courses);
  return courses;
}

async function analyzeAndCrossReference(rawCsvContent) {
  const students = parseCsvRows(rawCsvContent);
  if (students.length === 0) throw new Error('Nenhum aluno valido encontrado na planilha.');

  const schoolIdx = csvSchoolSelect.value;
  if (schoolIdx === '') throw new Error('Por favor, selecione uma escola de destino.');

  const schoolObj = csvLoadedSchools.find((s) => String(s.id) === String(schoolIdx));
  const schoolName = schoolObj?.name || `Escola #${schoolIdx}`;

  const schoolCourses = await fetchSchoolCourses(schoolIdx);
  const coursesMap = new Map();
  schoolCourses.forEach((c) => coursesMap.set(Number(c.id), c));

  let totalEnrollments = 0;
  const uniqueCourseIdsSet = new Set();
  const missingCourseIdsSet = new Set();

  const crossReferencedStudents = students.map((s) => {
    const mappedCourses = s.courseIds.map((cid) => {
      const foundCourse = coursesMap.get(cid);
      if (foundCourse) {
        uniqueCourseIdsSet.add(cid);
        return { id: cid, nome: foundCourse.nome, categoria: foundCourse.categoria, found: true };
      } else {
        missingCourseIdsSet.add(cid);
        return { id: cid, nome: `Curso #${cid} (Nao encontrado)`, categoria: 'Alerta', found: false };
      }
    });
    const validCourses = mappedCourses.filter((c) => c.found);
    totalEnrollments += validCourses.length;
    return {
      ...s, mappedCourses, validCourses,
      validCourseIds: validCourses.map((c) => c.id),
      hasMissingCourse: mappedCourses.some((c) => !c.found),
    };
  });

  return {
    schoolName, schoolIndex: schoolIdx, students: crossReferencedStudents,
    stats: {
      totalStudents: crossReferencedStudents.length, totalEnrollments,
      uniqueCoursesCount: uniqueCourseIdsSet.size,
      missingCoursesCount: missingCourseIdsSet.size,
      missingCourseIds: Array.from(missingCourseIdsSet),
    },
  };
}

// Analyze button
if (btnAnalyzeCsv) {
  btnAnalyzeCsv.addEventListener('click', async () => {
    hideCsvFeedback();
    const pasteText = csvPasteTextarea?.value.trim();
    if (!csvSelectedFile && !pasteText) {
      showCsvFeedback('error', 'Por favor, selecione um arquivo CSV ou cole o conteudo na area de texto.');
      return;
    }
    setCsvAnalyzeLoading(true);
    try {
      let content = pasteText;
      if (csvSelectedFile) {
        content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error('Erro ao ler o arquivo CSV.'));
          reader.readAsText(csvSelectedFile, 'UTF-8');
        });
      }
      const result = await analyzeAndCrossReference(content);
      parsedStudentsData = result.students;

      if (previewFileName) previewFileName.textContent = csvSelectedFile?.name || 'CSV colado';
      if (previewFileMeta) previewFileMeta.textContent = `${result.schoolName}`;
      kpiTotalStudents.textContent = `${result.stats.totalStudents} registros`;
      kpiTotalEnrollments.textContent = `${result.stats.totalEnrollments} Inscricoes`;
      kpiUniqueCourses.textContent = result.stats.uniqueCoursesCount;
      if (kpiMissingCourses) kpiMissingCourses.textContent = result.stats.missingCoursesCount;

      const defaultPassCount = parsedStudentsData.filter((s) => !s.senha).length;
      const customPassCount = parsedStudentsData.length - defaultPassCount;
      if (filterAllCount) filterAllCount.textContent = parsedStudentsData.length;
      if (filterDefaultCount) filterDefaultCount.textContent = defaultPassCount;
      if (filterCustomCount) filterCustomCount.textContent = customPassCount;
      if (confirmStudentCount) confirmStudentCount.textContent = parsedStudentsData.length;
      if (confirmEnrollCount) confirmEnrollCount.textContent = result.stats.totalEnrollments;

      btnExecuteText.textContent = `Confirmar e Iniciar Matriculas em Fila (${result.stats.totalEnrollments})`;

      renderPreviewTable(parsedStudentsData);
      showCsvSection('preview');
    } catch (err) {
      showCsvFeedback('error', err.message);
    } finally {
      setCsvAnalyzeLoading(false);
    }
  });
}

function renderPreviewTable(students) {
  if (!previewTableBody) return;
  if (students.length === 0) {
    previewTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--graphite-subtle);">Nenhum aluno corresponde ao filtro.</td></tr>`;
    return;
  }

  previewTableBody.innerHTML = students.map((s, idx) => {
    const initials = s.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const courseChips = s.mappedCourses.length > 0
      ? s.mappedCourses.map((c) => c.found
        ? `<span class="course-chip valid">${c.nome} <small>#${c.id}</small></span>`
        : `<span class="course-chip invalid">#${c.id} (Nao encontrado)</span>`
      ).join('')
      : '<span style="color:var(--graphite-subtle);font-style:italic;font-size:12px;">Nenhum curso (lead)</span>';

    const passBadge = s.senha
      ? `<span class="credential-badge custom">Senha do CSV (Criptografada)</span>`
      : `<span class="credential-badge default">Senha segura gerada individualmente</span>`;

    const subMeta = [s.cidade, s.estado, s.departamento].filter(Boolean).join(' / ');

    return `
      <tr>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${initials}</div>
            <div>
              <div class="student-name">${s.nome}</div>
              ${subMeta ? `<div class="student-meta">${subMeta}</div>` : ''}
            </div>
          </div>
        </td>
        <td><code style="font-size:12px;color:var(--graphite-muted)">${s.email}</code></td>
        <td style="font-size:12px">${csvLoadedSchools.find((sc) => String(sc.id) === String(csvSchoolSelect.value))?.name || ''}</td>
        <td><div class="course-chips">${courseChips}</div></td>
        <td>${passBadge}</td>
        <td><span class="status-ready">Pronto p/ envio</span></td>
        <td>
          <button type="button" class="btn-remove-row" data-remove-idx="${idx}" title="Remover">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>`;
  }).join('');

  previewTableBody.querySelectorAll('.btn-remove-row').forEach((btn) => {
    btn.addEventListener('click', () => {
      const removeIdx = Number(btn.getAttribute('data-remove-idx'));
      parsedStudentsData.splice(removeIdx, 1);
      let totalEnrollments = 0;
      parsedStudentsData.forEach((s) => (totalEnrollments += s.validCourses.length));
      kpiTotalStudents.textContent = `${parsedStudentsData.length} registros`;
      kpiTotalEnrollments.textContent = `${totalEnrollments} Inscricoes`;
      btnExecuteText.textContent = `Confirmar e Iniciar Matriculas em Fila (${totalEnrollments})`;
      if (confirmStudentCount) confirmStudentCount.textContent = parsedStudentsData.length;
      if (confirmEnrollCount) confirmEnrollCount.textContent = totalEnrollments;
      renderPreviewTable(parsedStudentsData);
    });
  });
}

if (previewFilterInput) {
  previewFilterInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderPreviewTable(parsedStudentsData); return; }
    const filtered = parsedStudentsData.filter(
      (s) => s.nome.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) ||
        s.mappedCourses.some((c) => c.nome.toLowerCase().includes(term) || String(c.id).includes(term))
    );
    renderPreviewTable(filtered);
  });
}

if (btnBackToUpload) btnBackToUpload.addEventListener('click', () => showCsvSection('upload'));
if (btnBackToUpload2) btnBackToUpload2.addEventListener('click', () => { csvSelectedFile = null; csvFileInput.value = ''; csvFileInfoBar.style.display = 'none'; csvDropzone.style.display = 'block'; showCsvSection('upload'); });
if (discardBatchBtn) discardBatchBtn.addEventListener('click', () => { parsedStudentsData = []; showCsvSection('upload'); });

// Execution
if (btnExecuteEnrollments) {
  btnExecuteEnrollments.addEventListener('click', async () => {
    if (parsedStudentsData.length === 0) { alert('Nao ha alunos na fila.'); return; }

    const schoolIdx = csvSchoolSelect.value;
    const idPais = csvPaisSelect?.value || '1';
    const defaultPassword = csvDefaultPassword?.value.trim() || '';

    showCsvSection('execution');

    const total = parsedStudentsData.length;
    let successCount = 0;
    let failCount = 0;

    execSuccessCount.textContent = '0';
    execFailCount.textContent = '0';
    execRemainingCount.textContent = String(total);
    execTotalCount.textContent = String(total);
    batchProgressBar.style.width = '0%';
    executionProgressPercent.textContent = '0%';

    executionLogList.innerHTML = parsedStudentsData.map((s, idx) => {
      const initials = s.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
      return `
        <div class="log-row" id="execRow-${idx}">
          <div class="log-icon pending">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div class="log-info">
            <div class="log-name">${s.nome}</div>
            <div class="log-email">${s.email}</div>
          </div>
          <div class="log-courses">${s.validCourseIds.map((id) => `<span>#${id}</span>`).join(' ')}</div>
          <span class="log-status pending" id="execStatus-${idx}">Aguardando fila...</span>
        </div>`;
    }).join('');

    logTotalCount.textContent = `${total} registros`;
    logTotalCount2.textContent = String(total);
    logVisibleCount.textContent = String(Math.min(5, total));

    const executionReport = [];

    for (let i = 0; i < total; i++) {
      const student = parsedStudentsData[i];
      const statusEl = document.getElementById(`execStatus-${i}`);
      const rowEl = document.getElementById(`execRow-${i}`);

      if (statusEl) {
        statusEl.className = 'log-status running';
        statusEl.textContent = 'Processando agora...';
      }
      if (rowEl) {
        const icon = rowEl.querySelector('.log-icon');
        if (icon) { icon.className = 'log-icon running'; icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'; }
      }

      try {
        const res = await fetch('/api/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: student.nome, email: student.email,
            password: student.senha || defaultPassword,
            enviar_email_notificacao: student.shouldNotify ? 1 : 0,
            id_pais: idPais, schoolIndex: schoolIdx,
            courseIds: student.validCourseIds,
          }),
        });
        const resData = await res.json();

        if (res.ok) {
          successCount++;
          if (statusEl) { statusEl.className = 'log-status success'; statusEl.textContent = `Sucesso \u2022 ${student.validCourseIds.length} cursos`; }
          if (rowEl) { const icon = rowEl.querySelector('.log-icon'); if (icon) { icon.className = 'log-icon success'; icon.innerHTML = '\u2713'; } }
          executionReport.push({ aluno: student.nome, email: student.email, status: 'Sucesso', matriculas: student.validCourseIds.length });
        } else {
          failCount++;
          const errorText = resData.error || 'Erro na Hotscool';
          if (statusEl) { statusEl.className = 'log-status warning'; statusEl.textContent = `Alerta \u2022 E-mail na fila de reenvio`; }
          if (rowEl) { const icon = rowEl.querySelector('.log-icon'); if (icon) { icon.className = 'log-icon warning'; icon.innerHTML = '\u26A0'; } }
          executionReport.push({ aluno: student.nome, email: student.email, status: 'Falha', erro: errorText });
        }
      } catch (err) {
        failCount++;
        if (statusEl) { statusEl.className = 'log-status error'; statusEl.textContent = 'Erro de conexao'; }
        if (rowEl) { const icon = rowEl.querySelector('.log-icon'); if (icon) { icon.className = 'log-icon error'; icon.innerHTML = '\u2717'; } }
        executionReport.push({ aluno: student.nome, email: student.email, status: 'Falha', erro: err.message });
      }

      const remaining = total - (i + 1);
      const percent = Math.round(((i + 1) / total) * 100);
      execSuccessCount.textContent = String(successCount);
      execFailCount.textContent = String(failCount);
      execRemainingCount.textContent = String(remaining);
      execProcessedCount.textContent = String(i + 1);
      batchProgressBar.style.width = `${percent}%`;
      executionProgressPercent.textContent = `${percent}%`;
      if (execSuccessPct) execSuccessPct.textContent = total > 0 ? `${Math.round((successCount / total) * 100)}%` : '0%';
      if (execRemainingPct) execRemainingPct.textContent = `${remaining} restante`;
      if (execEmailsSent) execEmailsSent.textContent = `${successCount} enviados`;

      if (i < total - 1) await new Promise((r) => setTimeout(r, 250));
    }

    btnRestartBatch.style.display = 'inline-flex';
    btnGoToSearch.style.display = 'inline-flex';

    if (btnCopyLog) {
      btnCopyLog.onclick = () => {
        const textReport = executionReport.map((r) => `${r.aluno} (${r.email}): ${r.status} ${r.matriculas ? `- ${r.matriculas} cursos` : `- Erro: ${r.erro}`}`).join('\n');
        navigator.clipboard.writeText(textReport).then(() => {
          btnCopyLog.textContent = 'Copiado!';
          setTimeout(() => { btnCopyLog.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar Relatorio de Execucao (.CSV)'; }, 2000);
        });
      };
    }

    if (btnRestartBatch) {
      btnRestartBatch.addEventListener('click', () => {
        csvSelectedFile = null;
        if (csvFileInput) csvFileInput.value = '';
        if (csvFileInfoBar) csvFileInfoBar.style.display = 'none';
        if (csvDropzone) csvDropzone.style.display = 'block';
        parsedStudentsData = [];
        showCsvSection('upload');
      });
    }

    if (btnGoToSearch) {
      btnGoToSearch.addEventListener('click', () => switchTab('search'));
    }
  });
}

// Copy password
const copyPasswordBtn = document.getElementById('copyPasswordBtn');
if (copyPasswordBtn) {
  copyPasswordBtn.addEventListener('click', () => {
    if (!csvDefaultPassword?.value) return;
    navigator.clipboard.writeText(csvDefaultPassword.value).then(() => {
      copyPasswordBtn.textContent = 'Copiado!';
      setTimeout(() => (copyPasswordBtn.textContent = 'Copiar'), 2000);
    });
  });
}

// Init
showCsvSection('upload');

const enrollNewCourseBtn = document.getElementById('enrollNewCourseBtn');
if (enrollNewCourseBtn) {
  enrollNewCourseBtn.addEventListener('click', async () => {
    const student = currentStudentDashboardData;
    switchTab('register');
    await ensureSchoolsLoaded();
    if (student) {
      regName.value = student.nome || '';
      regEmail.value = student.email || '';
      regName.dispatchEvent(new Event('input', { bubbles: true }));
      regEmail.dispatchEvent(new Event('input', { bubbles: true }));
    }
    courseFilterInput?.focus();
  });
}
