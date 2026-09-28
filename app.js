(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const L = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const p2 = n => String(n).padStart(2, '0');
  const ST = { emergencia: ['Emergência', 'red'], urgente: ['Urgente', 'yel'], pouco: ['Pouco urgente', 'blu'], nao: ['Não urgente', 'grn'] };
  const F = ['nome', 'social', 'idade', 'sexo', 'resp', 'motivo', 'queixas', 'hist', 'alergias', 'comorb', 'meds', 'vacina', 'histmed', 'antfam', 'pa', 'fc', 'fr', 'spo2', 'temp', 'dor', 'obs', 'status'];
  const VIEWS = ['login', 'cadastro', 'inicio', 'nova', 'consultar', 'setembro', 'perfil'];
  const DEMO = { nome: 'Enfª. Mariana Silva', email: 'mariana@hospital.com.br', coren: 'COREN-SP 123.456', senha: '123456' };
  let user = L('enf_session', null), sel = null, editId = null, tt;

  const fdShort = i => { const d = new Date(i); return `${p2(d.getDate())}/${p2(d.getMonth() + 1)} - ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
  const fdFull = d => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  const badge = s => ST[s] ? `<span class="bd ${ST[s][1]}">${ST[s][0]}</span>` : '';

  function toast(m, t) {
    const e = $('#toast'); e.textContent = m; e.className = 'show ' + (t || 'ok');
    clearTimeout(tt); tt = setTimeout(() => e.className = '', 3800);
  }

  function seed() {
    const b = { social: '', resp: '', hist: '', comorb: '', meds: '', vacina: '', histmed: '', antfam: '', obs: '', queixas: '', alergias: '' };
    S('enf_triagens', [
      Object.assign({}, b, { id: 1, pront: '#84930', nome: 'Paciente A.B.C.', idade: 42, sexo: 'Masculino', motivo: 'Cefaleia refratária de forte intensidade acompanhada de fotofobia.', queixas: 'Cefaleia, fotofobia', alergias: 'Relata reação alérgica severa a dipirona sódica.', pa: '12080', fc: 78, fr: 16, spo2: 98, temp: 36.5, dor: 4, status: 'urgente', data: '2026-09-15T14:22', prof: 'Enfª. Mariana Silva' }),
      Object.assign({}, b, { id: 2, pront: '#84912', nome: 'Paciente X.Y.Z.', idade: 67, sexo: 'Feminino', motivo: 'Dor torácica com irradiação e sudorese (dado fictício).', queixas: 'Dor torácica', pa: '160/100', fc: 112, fr: 22, spo2: 92, temp: 36.8, dor: 8, status: 'emergencia', data: '2026-09-15T13:05', prof: 'Enfª. Mariana Silva' }),
      Object.assign({}, b, { id: 3, pront: '#84899', nome: 'Paciente D.E.F.', idade: 29, sexo: 'Feminino', motivo: 'Renovação de atestado e queixa leve de coriza (dado fictício).', queixas: 'Coriza', pa: '110/70', fc: 72, fr: 15, spo2: 99, temp: 36.4, dor: 0, status: 'nao', data: '2026-09-15T11:40', prof: 'Enf. Thiago Costa' }),
      Object.assign({}, b, { id: 4, pront: '#84871', nome: 'Paciente G.H.I.', idade: 8, sexo: 'Masculino', motivo: 'Febre baixa há dois dias (dado fictício).', queixas: 'Febre', pa: '95/60', fc: 96, fr: 20, spo2: 97, temp: 37.9, dor: 2, status: 'pouco', data: '2026-09-15T09:15', prof: 'Enfª. Ana Clara' })
    ]);
  }
  if (localStorage.getItem('enf_triagens') === null) seed();
  const users = () => { const u = L('enf_users', null); if (u) return u; S('enf_users', [DEMO]); return [DEMO]; };
  const recs = () => L('enf_triagens', []);

  /* ---------- rotas ---------- */
  function route() {
    let v = location.hash.slice(1) || 'inicio';
    if (v === 'sair') { user = null; localStorage.removeItem('enf_session'); v = 'login'; toast('Você saiu do sistema.'); }
    const auth = v === 'login' || v === 'cadastro';
    if (!user && !auth) v = 'login';
    if (user && auth) v = 'inicio';
    if (VIEWS.indexOf(v) < 0) v = 'inicio';
    if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
    $$('[data-view]').forEach(e => e.hidden = e.dataset.view !== v);
    $('#shell').hidden = auth;
    $$('[data-go]').forEach(a => a.classList.toggle('on', a.dataset.go === v || (v === 'nova' && a.dataset.go === 'nova')));
    closeMenu(); window.scrollTo(0, 0);
    if (auth) { const f = $('#f' + (v === 'login' ? 'Login' : 'Cad')); f.reset(); return; }
    $('#uNome').textContent = user.nome; $('#uCoren').textContent = user.coren;
    if (v === 'inicio') home();
    if (v === 'nova') prepForm();
    if (v === 'consultar') list();
    if (v === 'perfil') { $('#pNome').textContent = user.nome; $('#pEmail').textContent = user.email; $('#pCoren').textContent = user.coren; }
  }
  window.addEventListener('hashchange', route);
  const openMenu = () => { $('#side').classList.add('open'); $('#scrim').classList.add('open'); };
  function closeMenu() { $('#side').classList.remove('open'); $('#scrim').classList.remove('open'); }
  $('#burger').onclick = () => $('#side').classList.contains('open') ? closeMenu() : openMenu();
  $('#scrim').onclick = closeMenu;
  document.addEventListener('keydown', e => e.key === 'Escape' && closeMenu());
  document.addEventListener('click', e => { if (e.target.closest('a[href="#nova"]')) editId = null; });

  /* ---------- login / cadastro ---------- */
  $('#forgot').onclick = e => { e.preventDefault(); toast('Recurso demonstrativo: a recuperação de senha não está disponível.', 'err'); };
  $('#fLogin').onsubmit = e => {
    e.preventDefault();
    const em = $('#lEmail').value.trim().toLowerCase(), pw = $('#lSenha').value;
    if (!em || !pw) return toast('Informe e-mail e senha.', 'err');
    if (!/^\S+@\S+\.\S+$/.test(em)) return toast('Informe um e-mail válido.', 'err');
    const u = users().find(x => x.email.toLowerCase() === em);
    if (!u) return toast('E-mail não cadastrado. Use "Cadastre-se aqui" para criar uma conta.', 'err');
    if (u.senha !== pw) return toast('Senha incorreta.', 'err');
    user = { nome: u.nome, email: u.email, coren: u.coren }; S('enf_session', user);
    location.hash = 'inicio'; toast('Login realizado com sucesso.');
  };
  $('#fCad').onsubmit = e => {
    e.preventDefault();
    const n = $('#cNome').value.trim(), em = $('#cEmail').value.trim().toLowerCase(), c = $('#cCoren').value.trim(), s = $('#cSenha').value, s2 = $('#cSenha2').value;
    if (!n || !em || !c || !s || !s2) return toast('Preencha todos os campos.', 'err');
    if (!/^\S+@\S+\.\S+$/.test(em)) return toast('Informe um e-mail válido.', 'err');
    if (s.length < 6) return toast('A senha deve ter pelo menos 6 caracteres.', 'err');
    if (s !== s2) return toast('As senhas não conferem.', 'err');
    const a = users();
    if (a.some(x => x.email.toLowerCase() === em)) return toast('Este e-mail já está cadastrado.', 'err');
    a.push({ nome: n, email: em, coren: c, senha: s }); S('enf_users', a);
    location.hash = 'login'; toast('Cadastro criado! Faça login para continuar.');
    setTimeout(() => $('#lEmail').value = em, 0);
  };

  /* ---------- início ---------- */
  function home() {
    const a = recs(), t = new Date().toDateString();
    $('#hello').textContent = 'Olá, ' + user.nome.split(' ').slice(0, 2).join(' ');
    $('#s1').textContent = a.length;
    $('#s2').textContent = a.filter(r => r.status === 'emergencia' || r.status === 'urgente').length;
    $('#s3').textContent = a.filter(r => new Date(r.data).toDateString() === t).length;
  }

  /* ---------- formulário ---------- */
  const f = $('#fTri');
  function prepForm() {
    f.classList.remove('tried');
    const r = editId && recs().find(x => x.id === editId);
    if (editId && !r) editId = null;
    F.forEach(k => f[k].value = r ? (r[k] == null ? '' : r[k]) : '');
    $('#dh').value = fdFull(r ? new Date(r.data) : new Date());
    $('#nTitle').textContent = r ? 'Editar Triagem' : 'Nova Triagem';
  }
  $('#bLimpar').onclick = () => { f.reset(); f.classList.remove('tried'); if (!editId) $('#dh').value = fdFull(new Date()); toast('Campos limpos.'); };
  $('#bCancel').onclick = () => { editId = null; location.hash = 'consultar'; };
  f.onsubmit = e => {
    e.preventDefault();
    if (!f.checkValidity()) {
      f.classList.add('tried'); f.querySelector(':invalid').focus();
      return toast('Revise os campos destacados: os marcados com * e os sinais vitais são obrigatórios.', 'err');
    }
    const d = {}; F.forEach(k => d[k] = f[k].value.trim());
    ['idade', 'fc', 'fr', 'spo2', 'temp', 'dor'].forEach(k => d[k] = Number(d[k]));
    const a = recs();
    if (editId) {
      const r = a.find(x => x.id === editId); Object.assign(r, d); sel = editId;
      toast('Triagem atualizada com sucesso.');
    } else {
      const id = Date.now(), max = Math.max(84930, ...a.map(x => parseInt(String(x.pront).slice(1), 10) || 0));
      a.unshift(Object.assign(d, { id, pront: '#' + (max + 1), data: new Date().toISOString(), prof: user.nome })); sel = id;
      toast('Triagem salva com sucesso.');
    }
    S('enf_triagens', a); editId = null; location.hash = 'consultar';
  };

  /* ---------- consulta ---------- */
  function list() {
    const q = $('#q').value.toLowerCase().trim(), s = $('#fs').value;
    const a = recs().filter(r => (!s || r.status === s) && (!q || (r.nome + ' ' + r.social + ' ' + r.pront).toLowerCase().includes(q)));
    $('#tb').innerHTML = a.map(r => `<tr data-id="${r.id}" class="${r.id === sel ? 'on' : ''}"><td data-l="Paciente"><b>${esc(r.social || r.nome)}</b><small>Prontuário: ${esc(r.pront)}</small></td><td data-l="Data/Hora">${fdShort(r.data)}</td><td data-l="Profissional">${esc(r.prof)}</td><td data-l="Status">${badge(r.status)}</td><td><button class="btn o s" data-view-id="${r.id}">Visualizar</button></td></tr>`).join('') || '<tr class="empty"><td colspan="5">Nenhuma triagem encontrada. Ajuste a busca ou o filtro.</td></tr>';
    detail();
  }
  function detail() {
    const r = recs().find(x => x.id === sel), d = $('#det');
    if (!r) { d.innerHTML = '<p class="sm c">Selecione uma triagem na lista para ver os detalhes.</p>'; return; }
    const v = (l, x, u) => `<div>${l}<b>${esc(x)} <em>${u}</em></b></div>`;
    d.innerHTML = `<div class="k"><span>FICHA SALVA ${esc(r.pront)}</span>${badge(r.status)}</div><h3>${esc(r.nome)}</h3><p class="sm">Nome social: ${esc(r.social || '-')} | Idade: ${esc(r.idade)} anos | Sexo: ${esc(r.sexo)}</p>
<h4>Sinais vitais registrados</h4><div class="dv">${v('PA', r.pa, 'mmHg')}${v('FC', r.fc, 'bpm')}${v('FR', r.fr, 'irpm')}${v('SpO2', r.spo2, '%')}${v('Temp', r.temp, '°C')}${v('Escala dor', r.dor, '/10')}</div>
<h4>Queixa &amp; histórico</h4><div class="lb">MOTIVO DA ADMISSÃO</div><p>${esc(r.motivo)}</p>${r.alergias ? `<div class="lb r">ALERGIAS</div><p>${esc(r.alergias)}</p>` : ''}
<div class="row"><button class="btn s" id="bEdit">Editar Ficha</button><button class="btn d s" id="bDel">Excluir</button></div>`;
    $('#bEdit').onclick = () => { editId = r.id; if (location.hash === '#nova') prepForm(); else location.hash = 'nova'; };
    $('#bDel').onclick = () => {
      if (!confirm('Excluir a triagem de ' + r.nome + '? Esta ação não pode ser desfeita.')) return;
      S('enf_triagens', recs().filter(x => x.id !== r.id)); sel = null; list(); toast('Triagem excluída.');
    };
  }
  $('#q').oninput = list; $('#fs').onchange = list;
  $('#tb').onclick = e => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    sel = Number(tr.dataset.id); list();
    if (e.target.closest('[data-view-id]') && window.matchMedia('(max-width:1100px)').matches) $('#det').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---------- perfil ---------- */
  $('#bSeed').onclick = () => { if (confirm('Restaurar os dados de demonstração? As triagens atuais serão substituídas.')) { seed(); sel = null; toast('Dados de demonstração restaurados.'); } };
  $('#bWipe').onclick = () => { if (confirm('Apagar todas as triagens deste navegador?')) { S('enf_triagens', []); sel = null; toast('Todas as triagens foram apagadas.'); } };

  route();
})();
