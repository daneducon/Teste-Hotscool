import { fetchCoursesFromSchool } from './courses.js';
import { randomBytes } from 'node:crypto';
import { requireAuth } from './auth-utils.js';

const HOTSCOOL_API_URL = 'https://api.hotscool.com/v1';
const HOTSCOOL_STUDENT_PORTAL_URL = process.env.HOTSCOOL_STUDENT_PORTAL_URL || 'https://app.hotscool.com';

function getStudentPortalUrl(schoolName) {
  const normalizedName = String(schoolName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalizedName.includes('universidade')) {
    return 'https://ead.el.consistem.com.br/login';
  }
  if (normalizedName.includes('academia')) {
    return 'https://academia.el.consistem.com.br/';
  }
  if (normalizedName.includes('desenvolvimento')) {
    return 'https://aprenda.el.consistem.com.br/login';
  }

  return HOTSCOOL_STUDENT_PORTAL_URL;
}

const schoolCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function getSchools() {
  const schools = [];

  const envKeys = Object.keys(process.env).filter((k) =>
    /^HOTSCOOL_API_KEY_\d+$/i.test(k)
  );
  envKeys.sort();

  envKeys.forEach((k, idx) => {
    const val = process.env[k]?.trim();
    if (val) {
      schools.push({
        id: idx,
        name: `Escola ${idx + 1}`,
        apiKey: val,
      });
    }
  });

  if (schools.length === 0 && process.env.HOTSCOOL_API_KEYS) {
    process.env.HOTSCOOL_API_KEYS.split(',').forEach((k, idx) => {
      const val = k.trim();
      if (val) {
        schools.push({ id: idx, name: `Escola ${idx + 1}`, apiKey: val });
      }
    });
  }

  if (schools.length === 0 && process.env.HOTSCOOL_API_KEY) {
    const val = process.env.HOTSCOOL_API_KEY.trim();
    if (val) {
      schools.push({ id: 0, name: 'Escola Principal', apiKey: val });
    }
  }

  return schools;
}

async function fetchStudentsFromSchool(apiKey, forceRefresh = false) {
  const cached = schoolCache.get(apiKey);
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.students;
  }

  const allStudents = [];
  let page = 0;
  let hasMore = true;
  const BATCH_SIZE = 6;

  while (hasMore && page < 60) {
    const batchPages = Array.from({ length: BATCH_SIZE }, (_, i) => page + i);
    const fetchPromises = batchPages.map(async (p) => {
      try {
        const response = await fetch(`${HOTSCOOL_API_URL}/students/all/${p}`, {
          method: 'GET',
          headers: {
            'x-access-token': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          return { page: p, ok: false, data: [] };
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        return { page: p, ok: true, data: Array.isArray(list) ? list : [] };
      } catch (err) {
        return { page: p, ok: false, data: [] };
      }
    });

    const results = await Promise.all(fetchPromises);
    results.sort((a, b) => a.page - b.page);

    for (const res of results) {
      if (!res.ok || res.data.length === 0) {
        hasMore = false;
        break;
      }
      allStudents.push(...res.data);
      if (res.data.length < 25) {
        hasMore = false;
        break;
      }
    }

    page += BATCH_SIZE;
  }

  schoolCache.set(apiKey, { students: allStudents, timestamp: now });
  return allStudents;
}

function isStudentMatch(student, targetEmail) {
  const primaryEmail = (student.email || '').trim().toLowerCase();
  if (primaryEmail === targetEmail) return true;

  if (Array.isArray(student.emails)) {
    return student.emails.some((e) => String(e).trim().toLowerCase() === targetEmail);
  }

  if (typeof student.emails === 'string' && student.emails) {
    return student.emails
      .split(',')
      .some((e) => e.trim().toLowerCase() === targetEmail);
  }

  return false;
}

/**
 * Tenta cadastrar aluno na escola com melhor permissão disponível.
 * Fluxo:
 *   1. Se tem cursos selecionados → matricula via /students/enrollment (com id_curso + id_turma)
 *   2. Se não tem cursos → cadastra como lead via /leads/enrollment
 *   3. Se a Key não tem permissão de escrita → retorna erro claro
 */
export default async function handler(req, res) {
  const authenticatedUser = await requireAuth(req, res);
  if (!authenticatedUser) return;

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const schools = getSchools();
  if (schools.length === 0) {
    return res.status(500).json({
      error: 'Nenhuma chave de API configurada no .env (configure HOTSCOOL_API_KEY_1, _2, _3)',
    });
  }

  // ==========================================
  // POST: Cadastrar aluno(s) e matricular em cursos
  // ==========================================
  if (req.method === 'POST') {
    const { batch, students, ...singleData } = req.body || {};

    // Se for requisição em lote
    const isBatch = Array.isArray(batch) || Array.isArray(students);
    const studentsToProcess = isBatch ? (batch || students) : [singleData];

    if (studentsToProcess.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado de aluno fornecido.' });
    }
    if (studentsToProcess.length > 100) {
      return res.status(413).json({ error: 'O lote excede o limite de 100 alunos.' });
    }

    const schoolIdx = parseInt(singleData.schoolIndex ?? studentsToProcess[0]?.schoolIndex, 10) || 0;
    const targetSchool = schools[schoolIdx];
    if (!targetSchool) {
      return res.status(404).json({ error: 'Escola selecionada inválida.' });
    }

    // Função auxiliar para matricular um único aluno
    async function processSingleStudent(student) {
      const {
        nome,
        email,
        password,
        senha,
        id_pais = 1,
        courseIds = [],
        enviar_email_notificacao,
        enviarEmailDefinirSenha,
        cpf,
        ddd,
        celular,
        telefone,
        cep,
        endereco,
        numero,
        cidade,
        estado,
        bairro,
        complemento,
      } = student;

      if (!nome || !nome.trim()) {
        return { ok: false, error: 'O nome do aluno é obrigatório.', student: { nome, email } };
      }
      if (!email || !email.trim()) {
        return { ok: false, error: 'O e-mail do aluno é obrigatório.', student: { nome, email } };
      }

      const cleanNome = nome.trim();
      const cleanEmail = email.trim().toLowerCase();
      const rawPassword = (password || senha || '').trim();

      const shouldNotifyEmail =
        enviar_email_notificacao === 1 ||
        enviar_email_notificacao === '1' ||
        enviar_email_notificacao === true ||
        enviarEmailDefinirSenha === true ||
        String(enviarEmailDefinirSenha).toLowerCase() === 'sim' ||
        String(student['enviar email para definir senha']).toLowerCase() === 'sim';

      // Se a senha não foi informada ou tem menos de 6 caracteres
      let cleanPassword = rawPassword;
      if (!cleanPassword || cleanPassword.length < 6) {
        cleanPassword = randomBytes(18).toString('base64url');
      }

      const paisNum = Number(id_pais) || 1;
      const cleanCpf = cpf ? String(cpf).replace(/\D/g, '') : undefined;
      const cleanDdd = ddd ? Number(String(ddd).replace(/\D/g, '').slice(0, 2)) : undefined;
      const cleanTel = (telefone || celular) ? Number(String(telefone || celular).replace(/\D/g, '')) : undefined;
      const cleanCep = cep ? Number(String(cep).replace(/\D/g, '')) : undefined;
      const cleanNum = numero ? Number(String(numero).replace(/\D/g, '')) : undefined;

      // Deduplica cursos
      const uniqueCourseIds = Array.isArray(courseIds)
        ? [...new Set(courseIds.map(Number).filter(Boolean))]
        : [];
      if (uniqueCourseIds.length > 50) {
        return { ok: false, error: 'O aluno excede o limite de 50 cursos.', student: { nome: cleanNome } };
      }

      // === MATRÍCULA EM CURSOS ===
      if (uniqueCourseIds.length > 0) {
        const enrollResults = [];

        for (const courseId of uniqueCourseIds) {
          try {
            const bodyPayload = {
              nome: cleanNome,
              email: cleanEmail,
              senha: cleanPassword,
              id_curso: courseId,
              id_turma: 0,
              id_pais: paisNum,
              enviar_email_notificacao: shouldNotifyEmail ? 1 : 0,
            };

            if (cleanCpf) bodyPayload.cpf = cleanCpf;
            if (cleanDdd) bodyPayload.ddd = cleanDdd;
            if (cleanTel) bodyPayload.telefone = cleanTel;
            if (cleanCep) bodyPayload.cep = cleanCep;
            if (cleanNum) bodyPayload.numero = cleanNum;
            if (endereco) bodyPayload.endereco = String(endereco).trim();
            if (cidade) bodyPayload.cidade = String(cidade).trim();
            if (estado) bodyPayload.estado = String(estado).trim().toUpperCase();
            if (bairro) bodyPayload.bairro = String(bairro).trim();
            if (complemento) bodyPayload.complemento = String(complemento).trim();

            const response = await fetch(`${HOTSCOOL_API_URL}/students/enrollment`, {
              method: 'POST',
              headers: {
                'x-access-token': targetSchool.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(bodyPayload),
            });

            const resData = await response.json().catch(() => ({}));
            if (!response.ok) {
              console.error(`[Hotscool API ${response.status}] Falha de matrícula no curso ${courseId}.`);
            }

            enrollResults.push({
              courseId,
              ok: response.ok,
              status: response.status,
              data: resData,
            });

            // Pequena pausa para rate limit
            await new Promise((resolve) => setTimeout(resolve, 200));
          } catch (fetchErr) {
            console.error(`[Hotscool Fetch Error] Falha de matrícula no curso ${courseId}.`);
            enrollResults.push({
              courseId,
              ok: false,
              status: 500,
              data: { error: fetchErr.message },
            });
          }
        }

        const successful = enrollResults.filter((r) => r.ok);
        const failed = enrollResults.filter((r) => !r.ok);

        // Helper para extrair mensagem legível de erro da Hotscool
        function formatHotscoolError(item) {
          const status = item.status;
          const d = item.data || {};
          const dStr = JSON.stringify(d);

          if (status === 401 || status === 403 || dStr.includes('Não autorizado') || dStr.includes('Nao autorizado')) {
            return `Chave de API sem permissão de escrita/matrícula na Hotscool (HTTP ${status}). Ative a permissão de escrita desta chave no painel Hotscool.`;
          }

          if (typeof d === 'string' && d) return d;
          if (d.message) return d.message;
          if (typeof d.error === 'string') return d.error;
          if (d.error && typeof d.error === 'object') return JSON.stringify(d.error);

          if (d.errors) {
            if (Array.isArray(d.errors)) {
              const msgs = d.errors.map((e) => (typeof e === 'object' ? (e.msg || e.message || JSON.stringify(e)) : e));
              return msgs.join('; ');
            }
            if (typeof d.errors === 'string') return d.errors;
            return JSON.stringify(d.errors);
          }

          if (d.msg) return d.msg;
          return `Erro ${status} na API da Hotscool`;
        }

        return {
          ok: successful.length > 0,
          nome: cleanNome,
          email: cleanEmail,
          totalMatriculas: successful.length,
          totalSolicitado: uniqueCourseIds.length,
          falhas: failed.length,
            detalhesFalhas: failed.map((f) => ({
              courseId: f.courseId,
              status: f.status,
              error: formatHotscoolError(f),
            })),
        };
      }

      // === CADASTRO COMO LEAD (sem cursos) ===
      const leadPayload = {
        nome: cleanNome,
        email: cleanEmail,
        senha: cleanPassword,
        id_pais: paisNum,
        enviar_email_notificacao: shouldNotifyEmail ? 1 : 0,
      };

      if (cleanCpf) leadPayload.cpf = cleanCpf;
      if (cleanDdd) leadPayload.ddd = cleanDdd;
      if (cleanTel) leadPayload.telefone = cleanTel;
      if (cleanCep) leadPayload.cep = cleanCep;
      if (cleanNum) leadPayload.numero = cleanNum;
      if (endereco) leadPayload.endereco = String(endereco).trim();
      if (cidade) leadPayload.cidade = String(cidade).trim();
      if (estado) leadPayload.estado = String(estado).trim().toUpperCase();

      const leadResponse = await fetch(`${HOTSCOOL_API_URL}/leads/enrollment`, {
        method: 'POST',
        headers: {
          'x-access-token': targetSchool.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(leadPayload),
      });

      const leadData = await leadResponse.json().catch(() => ({}));
      return {
        ok: leadResponse.ok,
        nome: cleanNome,
        email: cleanEmail,
        totalMatriculas: 0,
        isLead: true,
        error: !leadResponse.ok ? (leadData?.error || 'Erro ao cadastrar lead') : null,
      };
    }

    try {
      // Se for apenas 1 aluno
      if (!isBatch) {
        const result = await processSingleStudent(studentsToProcess[0]);
        schoolCache.clear();

        if (!result.ok) {
          return res.status(400).json({
            error: result.error || (result.detalhesFalhas?.[0]?.error) || 'Erro ao processar matrícula.',
            detalhes: result,
            escola: targetSchool.name,
          });
        }

        return res.status(200).json({
          message: result.totalMatriculas > 0
            ? `Aluno matriculado com sucesso em ${result.totalMatriculas} curso(s)!`
            : 'Aluno cadastrado com sucesso!',
          ...result,
          escola: targetSchool.name,
        });
      }

      // Se for lote (batch)
      const batchResults = [];
      for (const student of studentsToProcess) {
        const r = await processSingleStudent(student);
        batchResults.push(r);
        // Pausa entre alunos para não sobrecarregar a API
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      schoolCache.clear();

      const totalSucesso = batchResults.filter((r) => r.ok).length;
      const totalFalhas = batchResults.length - totalSucesso;

      return res.status(200).json({
        message: `Lote concluído: ${totalSucesso} aluno(s) processado(s) com sucesso, ${totalFalhas} falha(s).`,
        totalProcessado: batchResults.length,
        totalSucesso,
        totalFalhas,
        resultados: batchResults,
        escola: targetSchool.name,
      });
    } catch (err) {
      console.error('Erro interno no processamento de cadastro.');
      return res.status(500).json({ error: 'Erro interno ao realizar cadastro.' });
    }
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // ==========================================
  // GET: Consulta detalhada de dados do aluno por e-mail (Dashboard 360°)
  // ==========================================
  const { email, refresh } = req.query;
  const forceRefresh = refresh === 'true' || refresh === '1';

  if (!email) {
    return res.status(400).json({ error: 'Digite o e-mail do aluno.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Localiza o aluno em todas as escolas configuradas
    const schoolSearches = schools.map(async (school) => {
      const students = await fetchStudentsFromSchool(school.apiKey, forceRefresh);
      const match = students.find((s) => isStudentMatch(s, cleanEmail));
      return match ? { match, school } : null;
    });

    const searchResults = (await Promise.all(schoolSearches)).filter(Boolean);

    if (searchResults.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado em nenhuma das escolas.' });
    }

    const primaryResult = searchResults[0];
    const primaryStudent = primaryResult.match;
    const primarySchool = primaryResult.school;
    const primaryStudentId = primaryStudent.id;

    const escolas = [...new Set(searchResults.map((r) => r.match.escola || r.school.name).filter(Boolean))];

    // 2. Busca dados enriquecidos nível 3 (/v1/students/3/{id})
    let s3Data = {};
    try {
      const s3Res = await fetch(`${HOTSCOOL_API_URL}/students/3/${primaryStudentId}`, {
        headers: {
          'x-access-token': primarySchool.apiKey,
          'Accept': 'application/json',
        },
      });
      if (s3Res.ok) {
        s3Data = await s3Res.json();
      }
    } catch (err) {
      console.error('Erro ao buscar /students/3:', err.message);
    }

    // 3. Carrega os catálogos para enriquecer as matrículas com capa e descrição.
    const catalogsByApiKey = new Map(
      await Promise.all(
        searchResults.map(async ({ school }) => {
          try {
            return [school.apiKey, await fetchCoursesFromSchool(school.apiKey)];
          } catch {
            return [school.apiKey, []];
          }
        })
      )
    );

    // 4. Consolidação de cursos matriculados de todas as escolas
    const cursosMap = new Map();
    const courseApiKeys = new Map();
    searchResults.forEach((r) => {
      const schoolName = r.match.escola || r.school.name;
      const cursos = Array.isArray(r.match.cursos_matriculados) ? r.match.cursos_matriculados : [];
      cursos.forEach((c) => {
        const id = c.id_curso || c.titulo_curso;
        const catalogCourse = catalogsByApiKey.get(r.school.apiKey)?.find(
          (item) => Number(item.id) === Number(c.id_curso)
        );
        if (!cursosMap.has(id)) {
          courseApiKeys.set(id, r.school.apiKey);
          cursosMap.set(id, {
            id_curso: c.id_curso,
            titulo_curso: c.titulo_curso || c.nome || 'Curso sem título',
            turma: c.turma || null,
            id_turma: c.id_turma || null,
            escola: schoolName,
            imagem: catalogCourse?.imagem || null,
            descricao: catalogCourse?.descricao || '',
            categoria: catalogCourse?.categoria || null,
            duracao: catalogCourse?.duracao || null,
            acessoUrl: getStudentPortalUrl(schoolName),
          });
        }
      });
    });

    // Se s3Data trouxer mais cursos
    if (Array.isArray(s3Data.cursos_matriculados)) {
      s3Data.cursos_matriculados.forEach((c) => {
        const id = c.id_curso || c.titulo_curso;
        const catalogCourse = catalogsByApiKey.get(primarySchool.apiKey)?.find(
          (item) => Number(item.id) === Number(c.id_curso)
        );
        if (!cursosMap.has(id)) {
          courseApiKeys.set(id, primarySchool.apiKey);
          cursosMap.set(id, {
            id_curso: c.id_curso,
            titulo_curso: c.titulo_curso || 'Curso sem título',
            turma: c.turma || null,
            id_turma: c.id_turma || null,
            escola: primaryStudent.escola || primarySchool.name,
            imagem: catalogCourse?.imagem || null,
            descricao: catalogCourse?.descricao || '',
            categoria: catalogCourse?.categoria || null,
            duracao: catalogCourse?.duracao || null,
            acessoUrl: getStudentPortalUrl(primaryStudent.escola || primarySchool.name),
          });
        }
      });
    }

    const cursosList = Array.from(cursosMap.values());

    // 5. Busca em paralelo o relatório de progresso de cada curso
    const cursosComProgresso = await Promise.all(
      cursosList.map(async (curso) => {
        if (!curso.id_curso) {
          return {
            ...curso,
            percentual: 0,
            percentualFormatado: '0%',
            concluido: false,
          };
        }

        try {
          const repRes = await fetch(
            `${HOTSCOOL_API_URL}/students/${primaryStudentId}/report/course/${curso.id_curso}`,
            {
              headers: {
                'x-access-token': courseApiKeys.get(curso.id_curso || curso.titulo_curso) || primarySchool.apiKey,
                'Accept': 'application/json',
              },
            }
          );

          if (repRes.ok) {
            const repData = await repRes.json();
            const rel = repData.relatorio_curso || {};
            const percRaw = rel.percentual_visto || '0%';
            const percNum = parseInt(String(percRaw).replace(/\D/g, ''), 10) || 0;
            const isDone = rel.curso_concluido === true || percNum >= 100;

            let certUrl = null;
            if (rel.certificado && Array.isArray(rel.certificado) && rel.certificado.length > 0) {
              certUrl = rel.certificado[0].url || null;
            } else if (rel.certificado?.url) {
              certUrl = rel.certificado.url;
            }

            return {
              id_curso: curso.id_curso,
              titulo_curso: curso.titulo_curso,
              turma: rel.turma || curso.turma || 'Geral',
              escola: curso.escola,
              imagem: curso.imagem,
              descricao: curso.descricao,
              categoria: curso.categoria,
              duracao: curso.duracao,
              acessoUrl: curso.acessoUrl,
              percentual: percNum,
              percentualFormatado: `${percNum}%`,
              concluido: isDone,
              certificadoUrl: certUrl,
              aulasAssistidasCount: Array.isArray(rel.aulas_visualizadas) ? rel.aulas_visualizadas.length : 0,
            };
          }
        } catch (repErr) {
          // Fallback se não conseguir obter o relatório do curso
        }

        return {
          ...curso,
          percentual: 0,
          percentualFormatado: '0%',
          concluido: false,
        };
      })
    );

    // 5. Busca Certificados Emitidos
    let certificados = [];
    try {
      const certRes = await fetch(`${HOTSCOOL_API_URL}/certificates/issued/all/0`, {
        headers: {
          'x-access-token': primarySchool.apiKey,
          'Accept': 'application/json',
        },
      });

      if (certRes.ok) {
        const certJson = await certRes.json();
        const rawList = Array.isArray(certJson.data) ? certJson.data : (Array.isArray(certJson) ? certJson : []);
        
        certificados = rawList
          .filter((c) => {
            const cEmail = (c.aluno?.email || '').toLowerCase().trim();
            const cId = c.aluno?.id;
            return cEmail === cleanEmail || cId === primaryStudentId;
          })
          .map((c) => ({
            id: c.id,
            cursoNome: c.curso?.nome || 'Certificado de Curso',
            dataEmissao: c.data ? new Date(c.data).toLocaleDateString('pt-BR') : 'Data não informada',
            url: c.url,
          }));
      }
    } catch (certErr) {
      console.error('Erro ao buscar certificados:', certErr.message);
    }

    // 6. Gamificação
    let gamificacao = {
      pontos: 0,
      moedas: 0,
      acoes: 0,
      nivel: 'Iniciante',
      badge: null,
    };

    if (s3Data.gamificacao && typeof s3Data.gamificacao === 'object' && !Array.isArray(s3Data.gamificacao)) {
      gamificacao.pontos = s3Data.gamificacao.total_pontos || 0;
      gamificacao.moedas = s3Data.gamificacao.total_moedas || 0;
      gamificacao.acoes = s3Data.gamificacao.total_acoes || 0;
      gamificacao.nivel = s3Data.gamificacao.nivel || 'Iniciante';
      gamificacao.badge = s3Data.gamificacao.badge || null;
    }

    // 7. Cálculos de indicadores
    const totalCursos = cursosComProgresso.length;
    const cursosConcluidos = cursosComProgresso.filter((c) => c.concluido).length;
    const somaProgresso = cursosComProgresso.reduce((acc, c) => acc + (c.percentual || 0), 0);
    const progressoGeral = totalCursos > 0 ? Math.round(somaProgresso / totalCursos) : 0;

    // Datas formatadas
    let ultimoLoginDate = null;
    if (s3Data.ultimo_login) {
      const d = new Date(s3Data.ultimo_login);
      if (!isNaN(d)) ultimoLoginDate = d;
    } else {
      searchResults.forEach((r) => {
        if (r.match.ultimo_login) {
          const d = new Date(r.match.ultimo_login);
          if (!isNaN(d) && (!ultimoLoginDate || d > ultimoLoginDate)) {
            ultimoLoginDate = d;
          }
        }
      });
    }

    const dataAcessoFormatada = ultimoLoginDate
      ? ultimoLoginDate.toLocaleDateString('pt-BR') + ' às ' + ultimoLoginDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Nunca acessou';

    const dataCadastroFormatada = s3Data.data_cadastro
      ? new Date(s3Data.data_cadastro).toLocaleDateString('pt-BR')
      : null;

    // Grupos / Departamentos (Categorização sem CPF/Endereço/Telefone)
    const categorizacao = s3Data.categorizacao || {};
    const departamento = categorizacao.departamento || s3Data.departamento || null;
    const unidade = categorizacao.unidade || null;
    const cargo = categorizacao.cargo || null;

    // Resposta consolidada (SEM CPF, SEM ENDEREÇO, SEM TELEFONE)
    return res.status(200).json({
      id: primaryStudentId,
      nome: s3Data.nome || primaryStudent.nome || 'Nome não informado',
      email: s3Data.email || primaryStudent.email || cleanEmail,
      avatar: s3Data.avatar || primaryStudent.avatar || null,
      status: 'Ativo',
      emailConfirmado: s3Data.email_confirmado === 1,
      codigoExterno: s3Data.codigo_externo || null,
      dataCadastro: dataCadastroFormatada,
      ultimoAcesso: dataAcessoFormatada,
      escola: escolas.join(', '),
      escolas: escolas,
      departamento,
      unidade,
      cargo,
      trilhas: Array.isArray(s3Data.trilhas) ? s3Data.trilhas : [],
      // Indicadores
      totalCursos,
      cursosConcluidos,
      progressoGeral,
      totalCertificados: certificados.length,
      // Listas
      cursos: cursosComProgresso,
      certificados,
      gamificacao,
    });
  } catch (error) {
    console.error('Erro interno na consulta de aluno.');
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
