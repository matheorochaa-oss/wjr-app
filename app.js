/* WJR Locações – app instalável (PWA).
   Dados: sempre guardados no aparelho (IndexedDB). Opcional: sincronização da equipe pelo Supabase. */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BRL=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const money=n=>BRL.format(+n||0);
const NUM=new Intl.NumberFormat('pt-BR');
function parseMoney(v){if(typeof v==='number')return v;v=String(v||'').replace(/[R$\s]/g,'');if(!v)return 0;if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');const n=parseFloat(v);return isFinite(n)?Math.round(n*100)/100:0}
const moneyIn=n=>(+n)?(Math.round(n*100)/100).toFixed(2).replace('.',','):'';
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toLocalInput=d=>`${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const pd=s=>{if(!s)return null;const d=new Date(s);return isNaN(d)?null:d};
const DIAS=['dom','seg','ter','qua','qui','sex','sáb'];
const DIASL=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function fmtDT(s){const d=pd(s);if(!d)return '—';return `${DIAS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`}
const fmtH=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDia=s=>{if(!s)return '—';const [y,m,d]=s.split('-');return `${d}/${m}/${y}`};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const byNome=(a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR');
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const startWeek=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-x.getDay());return x};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};

const COLS=['itens','clientes','locacoes'];
const TABS=[['locacoes','Locações'],['agenda','Agenda'],['estoque','Estoque'],['clientes','Clientes'],['financeiro','Financeiro','Finanças'],['ajustes','Ajustes']];
const ICO={locacoes:'<path d="M9 4h6v3H9z"/><path d="M15 5h3v16H6V5h3"/><path d="M9 12h6M9 16h4"/>',agenda:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',estoque:'<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',clientes:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.4 3.5 5.2"/>',financeiro:'<path d="M12 2v20"/><path d="M17 6.5c-.8-1.5-2.6-2.5-5-2.5-3 0-5 1.4-5 3.6 0 5.2 10.2 2.6 10.2 8.2 0 2.3-2.2 3.7-5.2 3.7-2.6 0-4.6-1.1-5.4-2.9"/>',ajustes:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'};
const hoje=new Date();
const S={itens:new Map(),clientes:new Map(),locacoes:new Map(),
  tab:'locacoes',filtro:'ativas',busca:'',buscaCli:'',agModo:ls.get('wjr.agModo')==='semana'?'semana':'mes',agMes:new Date(hoje.getFullYear(),hoje.getMonth(),1),agDia:ymd(hoje),agSemana:startWeek(hoje),
  finPer:'todos',itemAberto:null,modal:null,aviso:null,pronto:false,
  sync:{estado:'local',email:null,pendentes:0,erro:null}};
function readHash(){const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h))S.tab=h}
readHash();

/* =================== ARMAZENAMENTO NO APARELHO =================== */
let idb=null;
const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
function abrirIDB(){return new Promise((res,rej)=>{const r=indexedDB.open('wjr',1);r.onupgradeneeded=()=>{const d=r.result;['docs','arquivos','fila'].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n)})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
const st=(n,m)=>idb.transaction(n,m||'readonly').objectStore(n);
const idbGet=(n,k)=>req(st(n).get(k));
const idbPut=(n,k,v)=>req(st(n,'readwrite').put(v,k));
const idbDel=(n,k)=>req(st(n,'readwrite').delete(k));
async function idbAll(n){const s=st(n);const [ks,vs]=await Promise.all([req(s.getAllKeys()),req(s.getAll())]);return ks.map((k,i)=>[k,vs[i]])}

async function carregarLocal(){
  const all=await idbAll('docs');const m={itens:new Map(),clientes:new Map(),locacoes:new Map()};
  S.config={};for(const [,r] of all){if(r&&!r.apagado&&m[r.col])m[r.col].set(r.id,{...r.dados,id:r.id});if(r&&r.col==='config'&&!r.apagado)S.config[r.id]=r.dados}
  Object.assign(S,m);
}

/* =================== SINCRONIZAÇÃO (Supabase) =================== */
let sb=null,canal=null;
// Banco da WJR (Supabase). A chave "anon" é pública por natureza: o acesso exige login e as regras do banco bloqueiam quem não entrou.
const NUVEM_WJR={url:'https://fjzpbqioejxzvwlztscn.supabase.co',chave:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqenBicWlvZWp4enZ3bHp0c2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNzgwOTAsImV4cCI6MjEwOTc1NDA5MH0.m5lf5F4NM6wzuc4easw-RdsxFg75a2YsaWbOTK0jMjc'};
const cfg=()=>{const v=ls.get('wjr.nuvem');if(v==='local')return null;try{return JSON.parse(v||'null')||NUVEM_WJR}catch(e){return NUVEM_WJR}};
const syncOn=()=>!!(sb&&S.sync.estado==='online');
function carregarLib(){return new Promise((res,rej)=>{if(window.supabase)return res();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';s.onload=()=>res();s.onerror=()=>rej(new Error('Não foi possível baixar o módulo de sincronização. Verifique a internet.'));document.head.appendChild(s)})}
async function iniciarNuvem(){
  const c=cfg();if(!c||!c.url||!c.chave){S.sync.estado='local';return}
  S.sync.estado='conectando';render();
  try{await carregarLib();sb=window.supabase.createClient(c.url,c.chave,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'wjr.auth'}})}
  catch(e){S.sync={...S.sync,estado:'erro',erro:e.message};render();return}
  const {data}=await sb.auth.getSession();
  if(!data.session){S.sync.estado='login';render();return}
  await aposLogin(data.session);
}
async function aposLogin(session){
  S.sync.email=session.user.email;S.sync.estado='online';S.sync.erro=null;
  if(!ls.get('wjr.nuvemIniciada')){ // 1ª vez neste aparelho: envia o que foi lançado aqui (menos exemplos)
    const all=await idbAll('docs');
    for(const [k,r] of all){if(r.dados&&r.dados.exemplo){await idbDel('docs',k);continue}await idbPut('fila',k,{col:r.col,id:r.id,dados:r.dados,apagado:!!r.apagado})}
    for(const [k] of await idbAll('arquivos'))await idbPut('fila','arq/'+k,{arq:k});
    ls.set('wjr.nuvemIniciada','1');
  }
  await enviarFila();
  await baixarTudo();
  ouvirMudancas();
  render();
}
async function baixarTudo(){
  if(!sb)return;
  let de=0;const passo=1000;const fila=new Set((await idbAll('fila')).map(([k])=>k));
  const vistos=new Set();
  for(;;){
    const {data,error}=await sb.from('registros').select('colecao,id,dados,apagado').range(de,de+passo-1);
    if(error){S.sync.erro=traduzErro(error);break}
    for(const r of data){const k=r.colecao+'/'+r.id;vistos.add(k);if(fila.has(k))continue;await idbPut('docs',k,{col:r.colecao,id:r.id,dados:r.dados,apagado:r.apagado})}
    if(data.length<passo)break;de+=passo;
  }
  if(!S.sync.erro){for(const [k] of await idbAll('docs')){if(!vistos.has(k)&&!fila.has(k))await idbDel('docs',k)}}
  await carregarLocal();
}
function ouvirMudancas(){
  if(!sb||canal)return;
  canal=sb.channel('registros').on('postgres_changes',{event:'*',schema:'public',table:'registros'},async p=>{
    const r=p.new&&p.new.id?p.new:null;if(!r)return;const k=r.colecao+'/'+r.id;
    if(await idbGet('fila',k))return;
    await idbPut('docs',k,{col:r.colecao,id:r.id,dados:r.dados,apagado:r.apagado});
    if(r.colecao==='config'){S.config=S.config||{};S.config[r.id]=r.dados;render();return}const m=S[r.colecao];if(!m)return;if(r.apagado)m.delete(r.id);else m.set(r.id,{...r.dados,id:r.id});render();
  }).subscribe();
}
let enviando=false;
async function enviarFila(){
  if(!sb||S.sync.estado!=='online'||enviando)return;enviando=true;
  try{
    const fila=await idbAll('fila');
    for(const [k,v] of fila){
      if(!navigator.onLine)break;
      if(v.arq){const blob=await idbGet('arquivos',v.arq);if(blob){const {error}=await sb.storage.from('anexos').upload(v.arq,blob,{contentType:blob.type,upsert:true});if(error){S.sync.erro=traduzErro(error);break}}await idbDel('fila',k);continue}
      const {error}=await sb.from('registros').upsert({colecao:v.col,id:v.id,dados:v.dados,apagado:!!v.apagado,atualizado_em:new Date().toISOString()});
      if(error){S.sync.erro=traduzErro(error);break}
      await idbDel('fila',k);
    }
  }finally{enviando=false;S.sync.pendentes=(await idbAll('fila')).length;renderTabs()}
}
function traduzErro(e){const m=String(e&&e.message||e);if(/JWT|auth|401/i.test(m))return 'Sessão expirada. Entre de novo em Ajustes.';if(/relation .*registros|does not exist/i.test(m))return 'O banco ainda não foi preparado. Rode o código SQL indicado em Ajustes.';if(/bucket/i.test(m))return 'O espaço de anexos ainda não foi criado. Rode o código SQL indicado em Ajustes.';if(/fetch|network/i.test(m))return 'Sem internet. Os dados ficam guardados e são enviados quando a conexão voltar.';return m}
window.addEventListener('online',()=>{enviarFila().then(()=>baixarTudo()).then(render)});

/* gravar e apagar: sempre no aparelho, e na nuvem quando houver */
function clean(o){const d={...o};delete d.id;return d}
async function save(col,id,data){
  const dados=clean(data);S[col].set(id,{...dados,id});
  await idbPut('docs',col+'/'+id,{col,id,dados,apagado:false});
  if(cfg())await idbPut('fila',col+'/'+id,{col,id,dados,apagado:false});
  render();enviarFila();
}
async function del(col,id){
  const old=S[col].get(id);S[col].delete(id);
  await idbPut('docs',col+'/'+id,{col,id,dados:old?clean(old):{},apagado:true});
  if(cfg())await idbPut('fila',col+'/'+id,{col,id,dados:old?clean(old):{},apagado:true});
  render();enviarFila();
}
const newId=()=>uid();

/* anexos (fotos e PDFs) */
const urls=new Map();
async function enviarArquivo(file){
  if(file.size>20*1024*1024){toast('Arquivo grande demais (máx. 20 MB).','bad');throw new Error('grande')}
  const n=file.name.toLowerCase();let type=file.type||(n.endsWith('.pdf')?'application/pdf':n.endsWith('.png')?'image/png':'image/jpeg');
  const id=uid()+(type==='application/pdf'?'.pdf':type==='image/png'?'.png':'.jpg');
  const blob=new Blob([file],{type});
  await idbPut('arquivos',id,blob);
  if(cfg()){await idbPut('fila','arq/'+id,{arq:id});enviarFila()}
  return{id,nome:file.name,tipo:type,tam:file.size};
}
async function urlAnexo(id){
  if(urls.has(id))return urls.get(id);
  let u=null;const b=await idbGet('arquivos',id);
  if(b)u=URL.createObjectURL(b);
  else if(sb&&S.sync.estado==='online'){const {data}=await sb.storage.from('anexos').createSignedUrl(id,3600);u=data&&data.signedUrl;if(u)setTimeout(()=>urls.delete(id),50*60*1000)}
  if(u)urls.set(id,u);return u;
}
async function apagarArquivo(id){try{await idbDel('arquivos',id);await idbDel('fila','arq/'+id);if(sb&&S.sync.estado==='online')await sb.storage.from('anexos').remove([id])}catch(e){}}
function hidratarAnexos(root){
  root.querySelectorAll('[data-anx]').forEach(async el=>{const u=await urlAnexo(el.dataset.anx);if(!u){el.classList.add('muted');el.title='Arquivo indisponível neste aparelho';return}
    if(el.tagName==='IMG')el.src=u;else if(el.tagName==='A')el.href=u;else el.dataset.src=u});
}

/* =================== REGRAS DO NEGÓCIO =================== */
function emUso(itemId,exceto){let n=0;for(const l of S.locacoes.values()){if(l.devolvidoEm||l.id===exceto)continue;for(const li of l.itens||[])if(li.itemId===itemId)n+=+li.qtd||0}return n}
function status(l){const now=new Date();if(l.devolvidoEm)return 'devolvida';const r=pd(l.retirada),d=pd(l.devolucao);if(r&&now<r)return 'agendada';if(d&&now>d)return 'atrasada';return 'obra'}
const ST_LABEL={agendada:'Agendada',obra:'Na obra',atrasada:'Atrasada',devolvida:'Retirada'};
const ST_ORD={atrasada:0,obra:1,agendada:2,devolvida:3};
const pagoDe=l=>(l.pagamentos||[]).reduce((s,p)=>s+(+p.valor||0),0);
function fin(l){const v=+l.valor||0,p=pagoDe(l);const saldo=Math.max(0,Math.round((v-p)*100)/100);const st=v<=0?(p>0?'pago':'semvalor'):(p>=v-0.005?'pago':(p>0?'parcial':'aberto'));return{v,p,saldo,st}}
const FIN_LABEL={pago:'Pago',parcial:'Pago em parte',aberto:'Não pago',semvalor:'Sem valor definido'};
const dot=(st,big)=>`<span class="dot ${st}${big?' big':''}" title="${FIN_LABEL[st]}" aria-label="${FIN_LABEL[st]}"></span>`;
const cliNome=id=>S.clientes.get(id)?.nome||'Cliente removido';
const itNome=id=>S.itens.get(id)?.nome||'Item removido';
const itensResumo=l=>(l.itens||[]).filter(li=>+li.qtd>0).map(li=>`${NUM.format(+li.qtd)} ${itNome(li.itemId)}`).join(' · ')||'Sem itens';
const temExemplo=()=>[...S.itens.values(),...S.clientes.values(),...S.locacoes.values()].some(x=>x.exemplo);

/* localização: link do WhatsApp/Google Maps, coordenadas ou endereço */
function coords(txt){if(!txt)return null;let s=String(txt);try{s=decodeURIComponent(s)}catch(e){}
  const m=s.match(/@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/)||s.match(/[?&](?:q|query|ll|daddr|destination|center)=(?:loc:)?(-?\d{1,2}\.\d+)[,\s+]+(-?\d{1,3}\.\d+)/)||s.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if(!m)return null;const lat=+m[1],lng=+m[2];return Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null}
const linkDe=t=>{const u=String(t||'').match(/https?:\/\/[^\s<>"]+/);return u?u[0]:null};
function mapsURL(loc,end){const c=coords(loc);if(c)return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;const u=linkDe(loc);if(u)return u;const q=(loc||end||'').trim();return q?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`:null}
function wazeURL(loc,end){const c=coords(loc);if(c)return `https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`;if(linkDe(loc))return null;const q=(loc||end||'').trim();return q?`https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes`:null}
function limparLocal(t){t=String(t||'').trim();const u=linkDe(t);if(u)return u;const c=coords(t);if(c)return `${c.lat}, ${c.lng}`;return t}
function zap(tel){let d=String(tel||'').replace(/\D/g,'');if(!d)return null;if(d.length<=11)d='55'+d;return `https://wa.me/${d}`}

/* =================== INTERFACE =================== */
let toastT;
function toast(msg,kind){const t=$('#toast');t.textContent=msg;t.className=kind||'';t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,kind==='bad'?5000:2600)}
function armConfirm(btn,txt){if(btn.dataset.armed)return true;btn.dataset.armed='1';const t=btn.textContent;btn.textContent=txt||'Toque de novo para confirmar';btn.classList.add('armed');setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent=t;btn.classList.remove('armed')}},4000);return false}
const SYNC_COR={local:'',conectando:'var(--warn)',login:'var(--bad)',online:'var(--ok)',erro:'var(--bad)'};
function renderTabs(){
  const ativos=[...S.locacoes.values()].filter(l=>!l.devolvidoEm).length;
  $('#tabs').innerHTML=TABS.map(([k,n,c])=>`<button class="tab" data-a="tab" data-t="${k}" ${S.tab===k?'aria-current="page"':''}><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg><span class="tl">${n}</span><span class="ts">${c||n}</span>${k==='locacoes'&&ativos?`<span class="n tnum">${ativos}</span>`:''}${k==='ajustes'&&S.sync.estado!=='local'?`<span class="sync" style="background:${S.sync.estado==='online'&&(S.sync.pendentes||S.sync.erro)?'var(--warn)':SYNC_COR[S.sync.estado]}" title="Sincronização"></span>`:''}</button>`).join('');
}
function renderAviso(){
  let h='';
  if(S.aviso)h+=`<div class="aviso ${S.aviso.kind||''}"><span>${esc(S.aviso.msg)}</span></div>`;
  if(S.sync.estado==='login')h+=`<div class="aviso bad"><span>Entre na sua conta para sincronizar com a equipe.</span><button class="btn small" data-a="tab" data-t="ajustes">Entrar</button></div>`;
  if(S.sync.erro&&S.tab!=='ajustes')h+=`<div class="aviso bad"><span>${esc(S.sync.erro)}</span></div>`;
  if(temExemplo())h+=`<div class="aviso"><span><strong>Há dados de exemplo</strong> (marcados “exemplo”) para você testar. Quando for usar de verdade, apague-os.</span><button class="btn small danger" data-a="apagarExemplos">Apagar dados de exemplo</button></div>`;
  $('#aviso').innerHTML=h;
}
function render(){
  if(!S.pronto)return;
  const ae=document.activeElement;const fid=ae&&ae.id&&$('#main').contains(ae)?ae.id:null;let sel=null;
  if(fid){try{sel=[ae.selectionStart,ae.selectionEnd]}catch(e){}}
  if(fid&&/^(cfg|lg)/.test(fid)){renderTabs();return} // não apaga o que está sendo digitado em Ajustes
  renderTabs();renderAviso();
  const fn={locacoes:vLocacoes,agenda:vAgenda,estoque:vEstoque,clientes:vClientes,financeiro:vFinanceiro,ajustes:vAjustes}[S.tab];
  $('#main').innerHTML=fn();
  if(fid){const el=document.getElementById(fid);if(el){el.focus();if(sel&&sel[0]!=null)try{el.setSelectionRange(sel[0],sel[1])}catch(e){}}}
  refreshModal();
}

/* ---------- LOCAÇÕES ---------- */
function vLocacoes(){
  const all=[...S.locacoes.values()];
  const c={obra:0,agendada:0,atrasada:0,devolvida:0};all.forEach(l=>c[status(l)]++);
  const aRec=all.reduce((s,l)=>s+fin(l).saldo,0);
  const q=norm(S.busca);
  const list=all.filter(l=>{const s=status(l),f=S.filtro;if(f==='ativas'&&s==='devolvida')return false;if(f!=='ativas'&&f!=='todas'&&s!==f)return false;
    if(q&&!norm(cliNome(l.clienteId)+' '+(l.endereco||'')+' '+itensResumo(l)).includes(q))return false;return true})
    .sort((a,b)=>(ST_ORD[status(a)]-ST_ORD[status(b)])||(status(a)==='devolvida'?String(b.retirada).localeCompare(String(a.retirada)):String(a.devolucao||a.retirada).localeCompare(String(b.devolucao||b.retirada))));
  const F=[['ativas','Ativas'],['obra','Na obra'],['agendada','Agendadas'],['atrasada','Atrasadas'],['devolvida','Retiradas'],['todas','Todas']];
  let h=`<div class="stats">
    <div class="stat"><span class="label">Na obra</span><span class="v">${c.obra}</span></div>
    <div class="stat"><span class="label">Agendadas</span><span class="v">${c.agendada}</span></div>
    <div class="stat ${c.atrasada?'bad':''}"><span class="label">Retirada atrasada</span><span class="v">${c.atrasada}</span></div>
    <div class="stat ${aRec?'bad':'ok'}"><span class="label">A receber</span><span class="v">${money(aRec)}</span></div></div>
  <div class="toolbar"><div class="chips" role="group" aria-label="Filtrar">${F.map(([k,n])=>`<button class="chip" data-a="filtro" data-f="${k}" aria-pressed="${S.filtro===k}">${n}</button>`).join('')}</div>
  <input class="search" id="busca" type="search" placeholder="Buscar cliente, obra ou item" value="${esc(S.busca)}" aria-label="Buscar locação"></div>`;
  if(!all.length)h+=`<div class="empty"><strong>Nenhuma locação ainda</strong>Cadastre seus itens na aba Estoque e toque em “+ Nova locação”.</div>`;
  else if(!list.length)h+=`<div class="empty"><strong>Nada neste filtro</strong>Troque o filtro ou a busca.</div>`;
  else h+=`<div class="list">${list.map(cardLoc).join('')}</div>`;
  return h;
}
function cardLoc(l){const s=status(l),f=fin(l);return `<button class="card" data-a="abrirLoc" data-id="${l.id}">
  <span class="c1">${dot(f.st)}<strong>${esc(cliNome(l.clienteId))}</strong><span class="pill st-${s}">${ST_LABEL[s]}</span></span>
  <span class="c2">${l.localizacao?'<span class="pin" title="Tem localização">⌖</span> ':''}${esc(l.endereco||(l.localizacao?'Localização marcada':'Sem endereço da obra'))}</span>
  <span class="c3"><span><b>Entrega</b>${fmtDT(l.retirada)}</span><span><b>Retirada</b>${fmtDT(l.devolvidoEm||l.devolucao)}</span></span>
  <span class="c4">${esc(itensResumo(l))}</span>
  <span class="cval"><span>${f.v?money(f.v):'<span class="muted">Sem valor</span>'}</span>${f.saldo>0?`<small class="falta">falta ${money(f.saldo)}</small>`:(f.st==='pago'?'<small style="color:var(--ok)">pago</small>':'')}</span></button>`}

/* ---------- AGENDA ---------- */
function eventos(){const ev=[];for(const l of S.locacoes.values()){const r=pd(l.retirada);if(r)ev.push({tipo:'saida',d:r,l});const dv=pd(l.devolvidoEm||l.devolucao);if(dv)ev.push({tipo:'devolucao',d:dv,l,feita:!!l.devolvidoEm})}return ev.sort((a,b)=>a.d-b.d)}
function evRow(e){const l=e.l;return `<button class="ev ${e.tipo}${e.feita?' feita':''}" data-a="abrirLoc" data-id="${l.id}"><span class="evh">${fmtH(e.d)}</span><span class="evt">${e.tipo==='saida'?'Entrega':'Retirada'}${e.feita?' ✓':''}</span><span class="evc"><strong>${esc(cliNome(l.clienteId))}</strong><span class="muted">${esc(l.endereco||'')}</span><span class="evi">${esc(itensResumo(l))}</span></span></button>`}
function vAgenda(){
  const ev=eventos();const by={};ev.forEach(e=>{(by[ymd(e.d)]=by[ymd(e.d)]||[]).push(e)});
  const hk=ymd(new Date());let titulo;
  if(S.agModo==='mes')titulo=`${MESES[S.agMes.getMonth()]} ${S.agMes.getFullYear()}`;
  else{const a=S.agSemana,b=addDays(a,6);titulo=`${pad(a.getDate())}/${pad(a.getMonth()+1)} a ${pad(b.getDate())}/${pad(b.getMonth()+1)}/${b.getFullYear()}`}
  let h=`<div class="agbar"><h2>${titulo}</h2>
    <div class="seg" role="group" aria-label="Visão"><button data-a="agModo" data-m="mes" aria-pressed="${S.agModo==='mes'}">Mês</button><button data-a="agModo" data-m="semana" aria-pressed="${S.agModo==='semana'}">Semana</button></div>
    <button class="btn" data-a="agNav" data-d="-1" aria-label="Anterior">‹</button><button class="btn" data-a="agHoje">Hoje</button><button class="btn" data-a="agNav" data-d="1" aria-label="Próximo">›</button></div>
    <div class="legend"><span><i class="mini saida"></i>Entrega na obra</span><span><i class="mini devolucao"></i>Retirada da obra</span></div>`;
  if(S.agModo==='mes'){
    const m=S.agMes,first=new Date(m.getFullYear(),m.getMonth(),1);const dim=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
    const n=Math.ceil((first.getDay()+dim)/7)*7;const start=addDays(first,-first.getDay());
    h+=`<div class="mes">${DIAS.map(d=>`<div class="dow">${d}</div>`).join('')}`;
    for(let i=0;i<n;i++){const d=addDays(start,i),k=ymd(d),es=by[k]||[];
      h+=`<button class="cell${d.getMonth()!==m.getMonth()?' fora':''}${k===hk?' hoje':''}${k===S.agDia?' sel':''}" data-a="agDia" data-d="${k}" aria-label="${d.getDate()} de ${MESES[d.getMonth()]}, ${es.length} eventos"><span class="num">${d.getDate()}</span>
      ${es.slice(0,3).map(e=>`<span class="mchip ${e.tipo}${e.feita?' feita':''}" data-a="abrirLoc" data-id="${e.l.id}">${e.tipo==='saida'?'↑':'↓'} ${fmtH(e.d)} ${esc(cliNome(e.l.clienteId))}</span>`).join('')}
      ${es.length>3?`<span class="mais">+${es.length-3} mais</span>`:''}<span class="minis">${es.slice(0,6).map(e=>`<i class="mini ${e.tipo}"></i>`).join('')}</span></button>`}
    h+=`</div>`;
    const sd=pd(S.agDia+'T00:00'),es=by[S.agDia]||[];
    h+=`<div class="dia"><div class="diahead${S.agDia===hk?' hoje':''}"><strong>${DIASL[sd.getDay()]}, ${sd.getDate()} de ${MESES[sd.getMonth()]}</strong><span class="muted">${es.length?es.length+(es.length>1?' eventos':' evento'):''}</span></div>
      ${es.length?es.map(evRow).join(''):'<div class="nada">Nenhuma entrega ou retirada neste dia.</div>'}</div>`;
  }else{
    for(let i=0;i<7;i++){const d=addDays(S.agSemana,i),k=ymd(d),es=by[k]||[];
      h+=`<div class="dia"><div class="diahead${k===hk?' hoje':''}"><strong>${DIASL[d.getDay()]}, ${d.getDate()}/${pad(d.getMonth()+1)}</strong><span class="muted">${k===hk?'hoje':''}</span></div>
      ${es.length?es.map(evRow).join(''):'<div class="nada">Livre.</div>'}</div>`}
  }
  return h;
}

/* ---------- ESTOQUE ---------- */
function vEstoque(){
  const its=[...S.itens.values()].sort(byNome);
  let h=`<div class="secthead"><h2>Estoque</h2><button class="btn primary" data-a="novoItem">+ Novo tipo de item</button></div>`;
  if(!its.length)return h+`<div class="empty"><strong>Nenhum item cadastrado</strong>Cadastre cada tipo de peça (escora, andaime, plataforma, sapata…) com o total que a WJR tem.</div>`;
  const tot=its.reduce((s,i)=>s+(+i.total||0),0),uso=its.reduce((s,i)=>s+emUso(i.id),0);
  h+=`<div class="stats s3"><div class="stat"><span class="label">Total</span><span class="v">${NUM.format(tot)}</span></div><div class="stat ${uso?'warn':''}"><span class="label">Alugadas</span><span class="v">${NUM.format(uso)}</span></div><div class="stat ok"><span class="label">Disponíveis</span><span class="v">${NUM.format(tot-uso)}</span></div></div>
  <p class="hint">Locações agendadas e na obra já contam como alugadas. Ao registrar a retirada, as peças voltam para o disponível.</p>`;
  const cats={};its.forEach(i=>{const c=i.categoria||'Outros';(cats[c]=cats[c]||[]).push(i)});
  Object.keys(cats).sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(c=>{
    h+=`<div class="cat"><span class="label">${esc(c)}</span>`;
    cats[c].forEach(i=>{const u=emUso(i.id),t=+i.total||0,d=t-u,open=S.itemAberto===i.id;
      const sub=[i.precoDia?money(i.precoDia)+' por diária':'',i.unidade&&i.unidade!=='peças'?i.unidade:''].filter(Boolean).join(' · ');
      h+=`<div class="itemrow${open?' open':''}"><button class="itemtop" data-a="toggleItem" data-id="${i.id}" aria-expanded="${open}">
        <span class="nmrow"><strong>${esc(i.nome)}</strong><span class="chev" aria-hidden="true">›</span></span>${sub?`<small class="muted">${esc(sub)}</small>`:''}
        <span class="qrow"><span class="qn"><small>Total</small><b>${NUM.format(t)}</b></span><span class="qn ${u?'uso':''}"><small>Alugado</small><b>${NUM.format(u)}</b></span>
        <span class="qn ${d<0?'neg':'disp'}"><small>${d<0?'Faltando':'Disponível'}</small><b>${NUM.format(d)}</b></span></span></button>
        ${u?`<div class="bar" aria-hidden="true"><i style="width:${t?Math.min(100,u/t*100):0}%"></i></div>`:''}`;
      if(open){const quem=[...S.locacoes.values()].filter(l=>!l.devolvidoEm).map(l=>({l,q:(l.itens||[]).filter(li=>li.itemId===i.id).reduce((s,li)=>s+(+li.qtd||0),0)})).filter(x=>x.q>0).sort((a,b)=>b.q-a.q);
        h+=`<div class="itemdet"><span class="label">Com quem está</span>${quem.length?quem.map(x=>`<button class="quem" data-a="abrirLoc" data-id="${x.l.id}"><span><strong>${esc(cliNome(x.l.clienteId))}</strong> <span class="muted">· ${ST_LABEL[status(x.l)]} · retirada ${fmtDT(x.l.devolucao)}</span></span><b class="tnum">${NUM.format(x.q)}</b></button>`).join(''):'<span class="muted">Tudo no depósito.</span>'}
        <div class="acts"><button class="btn small" data-a="editarItem" data-id="${i.id}">Editar item / total</button></div></div>`}
      h+=`</div>`});
    h+=`</div>`});
  return h;
}

/* ---------- CLIENTES ---------- */
function resumoCli(id){const ls_=[...S.locacoes.values()].filter(l=>l.clienteId===id);let v=0,p=0,saldo=0;ls_.forEach(l=>{const f=fin(l);v+=f.v;p+=f.p;saldo+=f.saldo});const st_=!ls_.length||v<=0?'semvalor':(saldo<=0.005?'pago':(p>0?'parcial':'aberto'));return{ls:ls_,v,p,saldo,st:st_,ativas:ls_.filter(l=>!l.devolvidoEm).length}}
function vClientes(){
  const cs=[...S.clientes.values()].sort(byNome);const q=norm(S.buscaCli);
  let h=`<div class="secthead"><h2>Clientes</h2><button class="btn primary" data-a="novoCli">+ Novo cliente</button></div>`;
  if(!cs.length)return h+`<div class="empty"><strong>Nenhum cliente ainda</strong>Cadastre aqui ou direto ao lançar uma locação.</div>`;
  h+=`<input class="search" id="buscaCli" type="search" placeholder="Buscar cliente" value="${esc(S.buscaCli)}" aria-label="Buscar cliente">`;
  const f=cs.filter(c=>!q||norm(c.nome+' '+(c.telefone||'')+' '+(c.documento||'')).includes(q));
  h+=`<div class="rows">${f.map(c=>{const r=resumoCli(c.id);return `<button class="rowb" data-a="abrirCli" data-id="${c.id}">${dot(r.st)}<span class="grow"><strong>${esc(c.nome)}</strong><small>${esc(c.telefone||'sem telefone')} · ${r.ls.length} ${r.ls.length===1?'locação':'locações'}${r.ativas?` · ${r.ativas} ativa${r.ativas>1?'s':''}`:''}</small></span><span class="rt">${r.saldo>0?`<span class="falta">falta ${money(r.saldo)}</span>`:`<span class="muted">${money(r.v)}</span>`}</span></button>`}).join('')||'<div class="nada">Ninguém com esse nome.</div>'}</div>`;
  return h;
}

/* ---------- FINANCEIRO ---------- */
function vFinanceiro(){
  const all=[...S.locacoes.values()];
  const meses=[...new Set(all.map(l=>String(l.retirada||'').slice(0,7)).filter(Boolean))].sort().reverse();
  if(S.finPer!=='todos'&&!meses.includes(S.finPer))S.finPer='todos';
  const L=S.finPer==='todos'?all:all.filter(l=>String(l.retirada||'').startsWith(S.finPer));
  let v=0,p=0,s=0;L.forEach(l=>{const f=fin(l);v+=f.v;p+=f.p;s+=f.saldo});
  const mLabel=k=>{const [y,m]=k.split('-');return `${MESES[+m-1]} de ${y}`};
  let h=`<div class="secthead"><h2>Financeiro</h2><label class="f" style="flex-direction:row;align-items:center;gap:8px"><span>Período</span><select id="finPer" style="width:auto">
    <option value="todos">Tudo</option>${meses.map(k=>`<option value="${k}" ${S.finPer===k?'selected':''}>${mLabel(k)}</option>`).join('')}</select></label></div>
  <div class="fin3"><div class="stat"><span class="label">Faturamento bruto</span><span class="v">${money(v)}</span><small class="muted">${L.length} ${L.length===1?'locação':'locações'}</small></div>
    <div class="stat ok"><span class="label">Recebido</span><span class="v">${money(p)}</span><small class="muted">${v?Math.round(p/v*100):0}% do faturado</small></div>
    <div class="stat ${s?'bad':'ok'}"><span class="label">A receber</span><span class="v">${money(s)}</span><small class="muted">${L.filter(l=>fin(l).saldo>0).length} em aberto</small></div></div>
  <div class="prog" aria-hidden="true"><i style="width:${v?Math.min(100,p/v*100):0}%"></i></div>`;
  if(!L.length)return h+`<div class="empty"><strong>Sem locações no período</strong>O faturamento aparece aqui quando houver locações com valor.</div>`;
  const porCli={};L.forEach(l=>{const f=fin(l);const c=porCli[l.clienteId]=porCli[l.clienteId]||{v:0,p:0,s:0,n:0};c.v+=f.v;c.p+=f.p;c.s+=f.saldo;c.n++});
  const rows=Object.entries(porCli).sort((a,b)=>b[1].s-a[1].s||b[1].v-a[1].v);
  const stOf=c=>c.v<=0?'semvalor':(c.s<=0.005?'pago':(c.p>0?'parcial':'aberto'));
  h+=`<h3>Por cliente</h3><div class="tw"><table><thead><tr><th></th><th>Cliente</th><th class="r">Locações</th><th class="r">Faturado</th><th class="r">Recebido</th><th class="r">A receber</th></tr></thead><tbody>
  ${rows.map(([id,c])=>`<tr class="click" data-a="abrirCli" data-id="${id}"><td>${dot(stOf(c))}</td><td>${esc(cliNome(id))}</td><td class="r">${c.n}</td><td class="r">${money(c.v)}</td><td class="r">${money(c.p)}</td><td class="r" style="${c.s?'color:var(--bad);font-weight:700':''}">${money(c.s)}</td></tr>`).join('')}
  </tbody><tfoot><tr><td></td><td>Total</td><td class="r">${L.length}</td><td class="r">${money(v)}</td><td class="r">${money(p)}</td><td class="r">${money(s)}</td></tr></tfoot></table></div>`;
  const ab=L.filter(l=>fin(l).saldo>0).sort((a,b)=>fin(b).saldo-fin(a).saldo);
  h+=`<h3>Em aberto</h3>${ab.length?`<div class="list">${ab.map(cardLoc).join('')}</div>`:'<div class="nada">Tudo recebido neste período.</div>'}`;
  return h;
}

/* ---------- AJUSTES ---------- */
const SQL=`-- Cole no Supabase: menu "SQL Editor" > "New query" > Run
create table if not exists registros (
  colecao text not null,
  id text not null,
  dados jsonb not null default '{}',
  apagado boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (colecao, id)
);
alter table registros enable row level security;
create policy "equipe le" on registros for select to authenticated using (true);
create policy "equipe cria" on registros for insert to authenticated with check (true);
create policy "equipe altera" on registros for update to authenticated using (true) with check (true);
alter publication supabase_realtime add table registros;
insert into storage.buckets (id, name, public) values ('anexos', 'anexos', false) on conflict do nothing;
create policy "equipe ve anexos" on storage.objects for select to authenticated using (bucket_id = 'anexos');
create policy "equipe envia anexos" on storage.objects for insert to authenticated with check (bucket_id = 'anexos');
create policy "equipe troca anexos" on storage.objects for update to authenticated using (bucket_id = 'anexos');
create policy "equipe apaga anexos" on storage.objects for delete to authenticated using (bucket_id = 'anexos');`;
function agendaBox(){
  const cod=S.config&&S.config.calendario&&S.config.calendario.codigo;const c=cfg();if(!cod||!c)return '';
  const https=`${c.url}/functions/v1/agenda?t=${cod}`;const webcal=https.replace(/^https:/,'webcal:');
  return `<div class="box" style="background:var(--surface2)"><h3>Agenda no calendário do celular</h3>
    <p class="hint">As entregas e retiradas aparecem no calendário do celular e se atualizam sozinhas (no iPhone, a cada 15 minutos ou menos). As alterações continuam sendo feitas aqui no app.</p>
    <div class="acts"><a class="btn primary small" href="${esc(webcal)}">Adicionar ao calendário do iPhone/Mac</a><button class="btn small" data-a="copiarAgenda" data-u="${esc(https)}">Copiar link (Google Agenda)</button></div>
    <p class="hint">Google Agenda/Android: no computador, abra calendar.google.com › Outras agendas › “Do URL” e cole o link copiado.</p></div>`;
}
function vAjustes(){
  const c=cfg()||NUVEM_WJR;const e=S.sync.estado;
  const instalado=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  let h=`<h2>Ajustes</h2>
  <div class="box"><h3>Instalar o app</h3>${instalado?'<p class="locok">O app já está instalado neste aparelho.</p>':`
    ${instalarEvt?'<div><button class="btn dark" data-a="instalar">Instalar o app WJR</button></div>':''}
    <ol class="passos"><li><strong>iPhone:</strong> abra este endereço no Safari, toque em Compartilhar (quadrado com seta) e depois em “Adicionar à Tela de Início”.</li>
    <li><strong>Android:</strong> no Chrome, toque nos três pontos e em “Instalar app”.</li>
    <li><strong>Mac:</strong> no Chrome, clique no ícone de instalar na barra de endereço; no Safari, menu Arquivo › “Adicionar ao Dock”.</li></ol>`}
    <p class="hint">Instalado, o app abre sozinho como os outros e funciona mesmo sem internet. No Android, ele também aparece na lista de “Compartilhar” do WhatsApp para receber localizações.</p></div>

  <div class="box"><h3>Compartilhar com a equipe</h3>`;
  if(e==='online'){
    h+=`<p class="locok">● Sincronizado como ${esc(S.sync.email)}. Tudo o que for lançado aparece para a equipe.</p>
    ${S.sync.pendentes?`<p class="hint">${S.sync.pendentes} alteração(ões) aguardando internet para enviar.</p>`:''}
    ${S.sync.erro?`<p class="err">${esc(S.sync.erro)}</p>`:''}
    <div class="acts"><button class="btn small" data-a="copiarConvite">Copiar link de convite da equipe</button><button class="btn small" data-a="sincronizar">Sincronizar agora</button><button class="btn small danger" data-a="sair">Sair da conta</button></div>
    ${agendaBox()}
    <p class="hint">O link de convite já leva a configuração. Cada pessoa abre o link, instala o app e entra com o e-mail e a senha dela.</p>`;
  }else if(e==='login'||(e==='erro'&&sb)){
    h+=`<p>Entre com o e-mail e a senha que o administrador criou para você.</p>
    <form id="fLogin"><div class="g2"><label class="f"><span>E-mail</span><input id="lgEmail" type="email" autocomplete="username" required></label>
    <label class="f"><span>Senha</span><input id="lgSenha" type="password" autocomplete="current-password" required></label></div>
    ${S.sync.erro?`<p class="err">${esc(S.sync.erro)}</p>`:''}
    <div class="acts"><button class="btn primary">Entrar</button><button type="button" class="btn small danger" data-a="desconectar">Desligar sincronização</button></div></form>`;
  }else{
    h+=`<p>${e==='conectando'?'Conectando…':'Agora os dados ficam <strong>só neste aparelho</strong>. Para a equipe toda ver e lançar as mesmas informações, conecte um banco de dados gratuito (Supabase). É feito uma vez só, por uma pessoa.'}</p>
    ${S.sync.erro?`<p class="err">${esc(S.sync.erro)}</p>`:''}
    <ol class="passos"><li>Crie uma conta grátis em <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a> e um projeto novo (região São Paulo).</li>
    <li>No projeto, abra <strong>SQL Editor</strong>, cole o código abaixo e clique em <strong>Run</strong>.</li>
    <li>Em <strong>Authentication › Users › Add user</strong>, crie um usuário (e-mail e senha) para cada pessoa da WJR, marcando “Auto confirm”. Em <strong>Authentication › Sign In / Providers</strong>, desligue “Allow new users to sign up”.</li>
    <li>Em <strong>Project Settings › API</strong>, copie a <em>Project URL</em> e a chave <em>anon public</em> e cole aqui.</li></ol>
    <pre class="sql" id="sqlTxt">${esc(SQL)}</pre><div><button class="btn small" data-a="copiarSQL">Copiar código SQL</button></div>
    <form id="fNuvem"><div class="g2"><label class="f"><span>Project URL</span><input id="cfgUrl" type="url" placeholder="https://xxxx.supabase.co" value="${esc(c.url)}" required></label>
    <label class="f"><span>Chave anon public</span><input id="cfgChave" value="${esc(c.chave)}" required autocomplete="off"></label></div>
    <div class="acts"><button class="btn primary">Conectar</button></div></form>
    <p class="hint">O que já foi lançado neste aparelho é enviado para a equipe no primeiro acesso. Os dados de exemplo não são enviados.</p>`;
  }
  h+=`</div>
  <div class="box"><h3>Cópia de segurança</h3><p class="hint">Baixa um arquivo com estoque, clientes e locações (sem os anexos). Serve para guardar ou passar os dados para outro aparelho.</p>
    <p class="hint">Versão do app: 10</p>
    <div class="acts"><button class="btn small" data-a="exportar">Baixar cópia (.json)</button><label class="btn small">Restaurar de uma cópia<input type="file" id="impArq" accept="application/json,.json" hidden></label></div></div>`;
  return h;
}

/* =================== JANELAS =================== */
function openModal(html,state){$('#modalBody').innerHTML=html;$('#modal').hidden=false;$('#modal').scrollTop=0;document.body.classList.add('noscroll');S.modal=state||null;hidratarAnexos($('#modalBody'));
  const f=$('#modalBody').querySelector('[autofocus]');if(f&&matchMedia('(min-width:600px)').matches)setTimeout(()=>f.focus(),30)}
function closeModal(){$('#modal').hidden=true;$('#modalBody').innerHTML='';S.modal=null;document.body.classList.remove('noscroll')}
function refreshModal(){
  if(!S.modal||$('#modal').hidden)return;
  const ae=document.activeElement;const mb=$('#modalBody');if(ae&&mb.contains(ae)&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName))return;
  if([...mb.querySelectorAll('input,textarea')].some(x=>x.type==='file'?x.files.length:(x.value&&x.dataset.keep!=='1')))return;
  const ms=$('#modal').scrollTop;
  if(S.modal.kind==='loc'){const l=S.locacoes.get(S.modal.id);if(!l){closeModal();return}mb.innerHTML=htmlLoc(l)}
  else if(S.modal.kind==='cli'){const c=S.clientes.get(S.modal.id);if(!c){closeModal();return}mb.innerHTML=htmlCli(c)}
  else return;
  hidratarAnexos(mb);$('#modal').scrollTop=ms;
}
const head=t=>`<div class="shhead"><h2>${t}</h2><button class="x" data-a="fechar" aria-label="Fechar">×</button></div>`;

/* item */
function formItem(id){const i=id?S.itens.get(id):{};const cats=[...new Set(['Andaimes','Escoras','Acessórios',...[...S.itens.values()].map(x=>x.categoria).filter(Boolean)])];
  openModal(`${head(id?'Editar item':'Novo tipo de item')}<div class="shbody"><form id="fItem" data-id="${id||''}">
  <label class="f"><span>Nome do item</span><input id="iNome" required value="${esc(i.nome)}" placeholder="Ex.: Escora metálica 3,10 m" autofocus></label>
  <div class="g2"><label class="f"><span>Categoria</span><input id="iCat" list="dlCat" value="${esc(i.categoria||'')}" placeholder="Andaimes, Escoras…"><datalist id="dlCat">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></label>
  <label class="f"><span>Unidade</span><input id="iUn" value="${esc(i.unidade||'peças')}"></label></div>
  <div class="g2"><label class="f"><span>Total que a WJR tem</span><input id="iTot" type="number" min="0" step="1" inputmode="numeric" required value="${i.total??''}"><small>${id?`Alugado agora: ${NUM.format(emUso(id))}`:'Quantidade total, somando o que está no depósito e nas obras.'}</small></label>
  <label class="f"><span>Preço por diária (opcional)</span><input id="iPreco" inputmode="decimal" value="${moneyIn(i.precoDia)}" placeholder="0,00"><small>Usado só para sugerir o valor da locação.</small></label></div>
  <p class="err" id="iErr" hidden></p>
  <div class="formacts">${id?`<button type="button" class="btn danger" data-a="excluirItem" data-id="${id}" style="margin-right:auto">Excluir item</button>`:''}<button type="button" class="btn" data-a="fechar">Cancelar</button><button class="btn primary">Salvar</button></div></form></div>`,{kind:'form'})}
async function salvarItem(f){const id=f.dataset.id||newId();const old=S.itens.get(id)||{};
  const d={...old,nome:$('#iNome').value.trim(),categoria:$('#iCat').value.trim()||'Outros',unidade:$('#iUn').value.trim()||'peças',total:Math.max(0,parseInt($('#iTot').value,10)||0),precoDia:parseMoney($('#iPreco').value)};
  if(!d.nome)return;closeModal();await save('itens',id,d);toast('Item salvo')}

/* cliente */
function formCli(id){const c=id?S.clientes.get(id):{};
  openModal(`${head(id?'Editar cliente':'Novo cliente')}<div class="shbody"><form id="fCli" data-id="${id||''}">
  <label class="f"><span>Nome ou empresa</span><input id="cNome" required value="${esc(c.nome)}" autofocus></label>
  <div class="g2"><label class="f"><span>Telefone / WhatsApp</span><input id="cTel" type="tel" value="${esc(c.telefone)}" placeholder="(11) 90000-0000"></label>
  <label class="f"><span>CPF ou CNPJ</span><input id="cDoc" value="${esc(c.documento)}"></label></div>
  <div class="g2"><label class="f"><span>E-mail</span><input id="cMail" type="email" value="${esc(c.email)}"></label>
  <label class="f"><span>Contato na obra</span><input id="cContato" value="${esc(c.contato)}"></label></div>
  <label class="f"><span>Observações</span><textarea id="cObs">${esc(c.obs)}</textarea></label>
  <div class="formacts"><button type="button" class="btn" data-a="fechar">Cancelar</button><button class="btn primary">Salvar</button></div></form></div>`,{kind:'form'})}
async function salvarCli(f){const id=f.dataset.id||newId();const old=S.clientes.get(id)||{criadoEm:new Date().toISOString()};
  const d={...old,nome:$('#cNome').value.trim(),telefone:$('#cTel').value.trim(),documento:$('#cDoc').value.trim(),email:$('#cMail').value.trim(),contato:$('#cContato').value.trim(),obs:$('#cObs').value.trim()};
  if(!d.nome)return;await save('clientes',id,d);toast('Cliente salvo');openCli(id)}
function htmlCli(c){const r=resumoCli(c.id);const z=zap(c.telefone);
  const L=r.ls.sort((a,b)=>String(b.retirada).localeCompare(String(a.retirada)));
  return `${head(esc(c.nome))}<div class="shbody">
  <div class="box"><div class="kv">
    <div><span class="label">Telefone</span><span>${esc(c.telefone||'—')}</span></div>
    <div><span class="label">CPF / CNPJ</span><span>${esc(c.documento||'—')}</span></div>
    <div><span class="label">E-mail</span><span>${esc(c.email||'—')}</span></div>
    <div><span class="label">Contato na obra</span><span>${esc(c.contato||'—')}</span></div></div>
    ${c.obs?`<div><span class="label">Observações</span><div>${esc(c.obs)}</div></div>`:''}
    <div class="acts">${z?`<a class="btn small" href="${z}" target="_blank" rel="noopener">WhatsApp</a>`:''}<button class="btn small" data-a="editarCli" data-id="${c.id}">Editar</button><button class="btn small primary" data-a="novaLocCli" data-id="${c.id}">+ Nova locação para este cliente</button>
    ${r.ls.length?'':`<button class="btn small danger" data-a="excluirCli" data-id="${c.id}">Excluir cliente</button>`}</div></div>
  <div class="box"><div class="finst">${dot(r.st,1)} ${r.ls.length?FIN_LABEL[r.st]:'Sem locações'}</div>
    <div class="finbig"><div><span class="label">Faturado</span><b>${money(r.v)}</b></div><div><span class="label">Pago</span><b style="color:var(--ok)">${money(r.p)}</b></div><div><span class="label">Falta</span><b style="${r.saldo?'color:var(--bad)':''}">${money(r.saldo)}</b></div></div></div>
  <h3>Locações (${L.length})</h3>${L.length?`<div class="rows">${L.map(l=>{const f=fin(l),s=status(l);return `<button class="rowb" data-a="abrirLoc" data-id="${l.id}">${dot(f.st)}<span class="grow"><strong>${esc(l.endereco||'Sem endereço')}</strong><small>${fmtDT(l.retirada)} → ${fmtDT(l.devolvidoEm||l.devolucao)} · ${esc(itensResumo(l))}</small></span><span class="rt"><span class="pill st-${s}">${ST_LABEL[s]}</span><br>${money(f.v)}</span></button>`}).join('')}</div>`:'<div class="nada">Nenhuma locação ainda.</div>'}
  </div>`}
function openCli(id){const c=S.clientes.get(id);if(!c)return;openModal(htmlCli(c),{kind:'cli',id})}

/* locação: formulário */
let linhaN=0;
function linhaHTML(li){const n=linhaN++;const opts=[...S.itens.values()].sort(byNome).map(it=>`<option value="${it.id}" ${it.id===li.itemId?'selected':''}>${esc(it.nome)}</option>`).join('');
  return `<div class="linha"><select class="lItem" id="lItem${n}" aria-label="Item"><option value="">Escolha o item…</option>${opts}</select><input class="lQtd" id="lQtd${n}" type="number" min="1" step="1" inputmode="numeric" value="${li.qtd||''}" placeholder="Qtd" aria-label="Quantidade"><span class="lDisp"></span><button type="button" class="x" data-a="rmLinha" aria-label="Remover linha">×</button></div>`}
function formLoc(id,preset){
  const l=id?S.locacoes.get(id):Object.assign({itens:[{}]},preset||{});
  if(!S.itens.size){openModal(`${head('Nova locação')}<div class="shbody"><div class="empty"><strong>Cadastre os itens primeiro</strong>Na aba Estoque, crie os tipos de peça (escoras, andaimes, acessórios) com o total de cada um.</div><div class="formacts"><button class="btn primary" data-a="irEstoque">Ir para o Estoque</button></div></div>`,{kind:'form'});return}
  const now=new Date();now.setMinutes(0,0,0);now.setHours(now.getHours()+1);
  const ret=l.retirada||toLocalInput(now),dev=l.devolucao||toLocalInput(addDays(now,30));
  const cn=l.clienteId?cliNome(l.clienteId):'';
  openModal(`${head(id?'Editar locação':'Nova locação')}<div class="shbody"><form id="fLoc" data-id="${id||''}">
  <label class="f"><span>Cliente</span><input id="lCli" list="dlCli" required value="${esc(cn)}" placeholder="Digite o nome" autocomplete="off" ${id||cn?'':'autofocus'}><datalist id="dlCli">${[...S.clientes.values()].sort(byNome).map(c=>`<option value="${esc(c.nome)}">`).join('')}</datalist><small>Se o cliente ainda não existe, ele é cadastrado ao salvar.</small></label>
  <div class="f"><span>Localização da obra (do WhatsApp)</span>
    <div class="inrow"><input id="lLoc" value="${esc(l.localizacao)}" placeholder="Cole aqui o link da localização" autocomplete="off"><button type="button" class="btn small" data-a="colarLoc">Colar</button></div>
    <small id="lLocInfo">No WhatsApp, abra a localização que o cliente mandou, toque em compartilhar ou copiar e cole aqui. Também aceita coordenadas.</small>
    <div class="acts"><button type="button" class="btn small" data-a="aquiLoc">Usar onde estou agora</button></div></div>
  <label class="f"><span>Endereço da obra</span><input id="lEnd" value="${esc(l.endereco)}" placeholder="Rua, número, bairro, cidade"></label>
  <div class="g2"><label class="f"><span>Entrega na obra · data e hora</span><input id="lRet" type="datetime-local" required value="${ret}"></label>
  <label class="f"><span>Retirada da obra · data e hora</span><input id="lDev" type="datetime-local" required value="${dev}"></label></div>
  <div class="f"><span>Itens e quantidades</span><div class="linhas" id="linhas">${(l.itens&&l.itens.length?l.itens:[{}]).map(linhaHTML).join('')}</div>
  <div><button type="button" class="btn small" data-a="addLinha">+ Adicionar item</button></div></div>
  <div class="g2"><label class="f"><span>Valor cobrado (R$)</span><input id="lValor" inputmode="decimal" value="${moneyIn(l.valor)}" placeholder="0,00"><small id="calcInfo"></small></label>
  <div class="f" style="justify-content:flex-start;padding-top:26px"><button type="button" class="btn small" data-a="calcValor">Calcular pelas diárias</button></div></div>
  <label class="f"><span>Observações</span><textarea id="lObs" placeholder="Ex.: entregar com caminhão; falar com o mestre de obras">${esc(l.obs)}</textarea></label>
  <p class="err" id="lErr" hidden></p>
  <div class="formacts"><button type="button" class="btn" data-a="fechar">Cancelar</button><button class="btn primary" id="lSalvar">Salvar locação</button></div></form></div>`,{kind:'form'});
  updDisp();infoLoc();
}
function infoLoc(){const i=$('#lLocInfo'),v=$('#lLoc')&&$('#lLoc').value.trim();if(!i||!v)return;const c=coords(v);
  i.className=c||linkDe(v)?'locok':'';i.textContent=c?`Localização reconhecida (${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}).`:linkDe(v)?'Link de localização salvo. Ele abre no mapa pelo detalhe da locação.':'Será procurado no mapa como texto.'}
function linhasDoForm(){return [...document.querySelectorAll('#linhas .linha')].map(r=>({itemId:r.querySelector('.lItem').value,qtd:parseInt(r.querySelector('.lQtd').value,10)||0,el:r}))}
function updDisp(){const f=$('#fLoc');if(!f)return;const id=f.dataset.id;const L=linhasDoForm();const soma={};L.forEach(x=>{if(x.itemId)soma[x.itemId]=(soma[x.itemId]||0)+x.qtd});
  L.forEach(x=>{const sp=x.el.querySelector('.lDisp');if(!x.itemId){sp.textContent='';sp.classList.remove('over');return}const it=S.itens.get(x.itemId);const disp=(+it?.total||0)-emUso(x.itemId,id);sp.textContent=`disponível: ${NUM.format(disp)}`;sp.classList.toggle('over',soma[x.itemId]>disp)});
  f.dataset.force='';$('#lErr').hidden=true;$('#lSalvar').textContent='Salvar locação'}
function calcValor(){const r=pd($('#lRet').value),d=pd($('#lDev').value);const info=$('#calcInfo');if(!r||!d||d<=r){info.textContent='Preencha a entrega e a retirada para calcular.';return}
  const dias=Math.max(1,Math.ceil((d-r)/86400000));let tot=0;const sem=[];linhasDoForm().forEach(x=>{if(!x.itemId||!x.qtd)return;const it=S.itens.get(x.itemId);if(!it?.precoDia)sem.push(it?.nome);else tot+=x.qtd*it.precoDia*dias});
  $('#lValor').value=moneyIn(Math.round(tot*100)/100);info.textContent=`${dias} ${dias>1?'diárias':'diária'}${sem.length?` · sem preço cadastrado: ${sem.join(', ')}`:''}. Ajuste o valor se quiser.`}
async function salvarLoc(f){
  const id=f.dataset.id;const err=$('#lErr');const show=m=>{err.textContent=m;err.hidden=false};
  const nome=$('#lCli').value.trim();if(!nome)return show('Informe o cliente.');
  const ret=$('#lRet').value,dev=$('#lDev').value;if(!ret||!dev)return show('Informe data e hora da entrega e da retirada.');
  if(pd(dev)<=pd(ret))return show('A retirada precisa ser depois da entrega.');
  const its=linhasDoForm().filter(x=>x.itemId&&x.qtd>0).map(x=>({itemId:x.itemId,qtd:x.qtd}));if(!its.length)return show('Inclua pelo menos um item com quantidade.');
  if(document.querySelectorAll('#linhas .lDisp.over').length&&!f.dataset.force){f.dataset.force='1';$('#lSalvar').textContent='Salvar mesmo assim';return show('Há item com quantidade maior que o disponível no estoque. Confira ou toque em “Salvar mesmo assim”.')}
  let cli=[...S.clientes.values()].find(c=>norm(c.nome)===norm(nome));
  if(!cli){const cid=newId();cli={id:cid,nome,criadoEm:new Date().toISOString()};await save('clientes',cid,cli)}
  const lid=id||newId();const old=id?S.locacoes.get(id):{pagamentos:[],anexos:[],criadoEm:new Date().toISOString()};
  const d={...old,clienteId:cli.id,localizacao:limparLocal($('#lLoc').value),endereco:$('#lEnd').value.trim(),retirada:ret,devolucao:dev,itens:its,valor:parseMoney($('#lValor').value),obs:$('#lObs').value.trim()};
  await save('locacoes',lid,d);toast(id?'Locação atualizada':'Locação lançada');openLoc(lid);
}

/* locação: detalhe */
function anexoHTML(a,acao){const img=String(a.tipo||'').startsWith('image/');
  return `<span class="anxitem">${img?`<button class="thumb" data-a="verImg" data-anx="${esc(a.id)}" aria-label="Ver ${esc(a.nome)}"><img data-anx="${esc(a.id)}" alt=""></button>`:`<a class="file" data-anx="${esc(a.id)}" target="_blank" rel="noopener"><i>PDF</i><span>${esc(a.nome||'arquivo')}</span></a>`}${acao||''}</span>`}
function htmlLoc(l){const s=status(l),f=fin(l);const c=S.clientes.get(l.clienteId);
  const pgs=(l.pagamentos||[]).slice().sort((a,b)=>String(a.data).localeCompare(String(b.data)));
  const gm=mapsURL(l.localizacao,l.endereco),wz=wazeURL(l.localizacao,l.endereco),cc=coords(l.localizacao),z=zap(c&&c.telefone);
  return `${head(`<span style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${esc(cliNome(l.clienteId))} <span class="pill st-${s}">${ST_LABEL[s]}</span></span>`)}<div class="shbody">
  <div class="box"><div class="kv">
    <div style="grid-column:1/-1"><span class="label">Obra</span><span>${esc(l.endereco||(cc?'Localização marcada no mapa':l.localizacao?'':'—'))}${l.localizacao&&!cc?` <a href="${esc(gm)}" target="_blank" rel="noopener">${esc(l.localizacao)}</a>`:''}</span></div>
    <div><span class="label">Entrega na obra</span><span class="tnum">${fmtDT(l.retirada)}</span></div>
    <div><span class="label">Retirada prevista</span><span class="tnum">${fmtDT(l.devolucao)}</span></div>
    ${l.devolvidoEm?`<div><span class="label">Retirada feita em</span><span class="tnum">${fmtDT(l.devolvidoEm)}</span></div>`:''}
    ${c&&c.telefone?`<div><span class="label">Telefone</span><span>${esc(c.telefone)}</span></div>`:''}</div>
  ${cc&&navigator.onLine?`<iframe class="mapa" loading="lazy" title="Mapa da obra" src="https://maps.google.com/maps?q=${cc.lat},${cc.lng}&z=16&output=embed"></iframe>`:''}
  ${gm||z?`<div class="acts">${gm?`<a class="btn small" href="${esc(gm)}" target="_blank" rel="noopener">Abrir no Google Maps</a>`:''}${wz?`<a class="btn small" href="${esc(wz)}" target="_blank" rel="noopener">Ir com Waze</a>`:''}${l.localizacao?`<button class="btn small" data-a="copiarLoc" data-id="${l.id}">Copiar localização</button>`:''}${z?`<a class="btn small" href="${z}" target="_blank" rel="noopener">WhatsApp do cliente</a>`:''}</div>`:''}
  <div class="tw" style="border:0"><table><thead><tr><th>Item</th><th class="r">Quantidade</th></tr></thead><tbody>${(l.itens||[]).map(li=>`<tr><td>${esc(itNome(li.itemId))}</td><td class="r">${NUM.format(+li.qtd||0)}</td></tr>`).join('')}</tbody></table></div>
  ${l.obs?`<div><span class="label">Observações</span><div>${esc(l.obs)}</div></div>`:''}
  <div class="acts">
    ${l.devolvidoEm?`<button class="btn small" data-a="desfazerDev" data-id="${l.id}">Desfazer retirada</button>`:`<button class="btn small primary" data-a="pedirDev" data-id="${l.id}">Registrar retirada</button>`}
    <button class="btn small" data-a="editarLoc" data-id="${l.id}">Editar</button>
    <button class="btn small" data-a="abrirCli" data-id="${l.clienteId}">Ver cliente</button>
    <button class="btn small danger" data-a="excluirLoc" data-id="${l.id}">Excluir</button></div>
  <div id="devBox" hidden class="addpg"><label class="f"><span>Retirada feita em</span><input type="datetime-local" id="devQuando" data-keep="1" value="${toLocalInput(new Date())}"></label><button class="btn primary" data-a="confirmarDev" data-id="${l.id}">Confirmar retirada</button></div></div>

  <div class="box"><div class="finst">${dot(f.st,1)} ${FIN_LABEL[f.st]}</div>
    <div class="finbig"><div><span class="label">Valor cobrado</span><b>${money(f.v)}</b></div><div><span class="label">Pago</span><b style="color:var(--ok)">${money(f.p)}</b></div><div><span class="label">Falta</span><b style="${f.saldo?'color:var(--bad)':''}">${money(f.saldo)}</b></div></div>
    <span class="label">Pagamentos</span>
    <div>${pgs.length?pgs.map(p=>`<div class="pg"><span class="grow"><strong class="tnum">${money(p.valor)}</strong> <span class="muted">· ${fmtDia(p.data)}${p.forma?' · '+esc(p.forma):''}</span></span>${p.comprovante?anexoHTML(p.comprovante):'<span class="muted" style="font-size:13px">sem comprovante</span>'}<button class="btn small danger" data-a="rmPag" data-id="${l.id}" data-p="${esc(p.id)}">Remover</button></div>`).join(''):'<div class="nada">Nenhum pagamento registrado.</div>'}</div>
    <div class="addpg"><label class="f"><span>Valor recebido</span><input id="pValor" inputmode="decimal" placeholder="${f.saldo?moneyIn(f.saldo):'0,00'}"></label>
      <label class="f"><span>Data</span><input id="pData" type="date" data-keep="1" value="${ymd(new Date())}"></label>
      <label class="f"><span>Forma</span><select id="pForma"><option>Pix</option><option>Transferência</option><option>Dinheiro</option><option>Boleto</option><option>Cartão</option><option>Cheque</option></select></label>
      <label class="f"><span>Comprovante (foto ou PDF)</span><input id="pArq" type="file" accept="image/*,application/pdf"></label>
      <button class="btn primary" data-a="addPag" data-id="${l.id}" id="pBtn">Registrar pagamento</button></div></div>

  <div class="box"><span class="label">Recibos e outros anexos</span>
    <div class="anx">${(l.anexos||[]).length?l.anexos.map(a=>anexoHTML(a,`<button class="x" data-a="rmAnexo" data-id="${l.id}" data-x="${esc(a.id)}" aria-label="Remover anexo" title="Remover">×</button>`)).join(''):'<span class="nada">Nenhum anexo.</span>'}</div>
    <label class="btn small" style="align-self:flex-start">+ Anexar recibo ou documento<input type="file" id="aArq" data-id="${l.id}" accept="image/*,application/pdf" hidden></label></div></div>`}
function openLoc(id){const l=S.locacoes.get(id);if(!l)return;openModal(htmlLoc(l),{kind:'loc',id})}

/* =================== AÇÕES =================== */
let instalarEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();instalarEvt=e;$('#btnInstalar').hidden=false;if(S.tab==='ajustes')render()});
window.addEventListener('appinstalled',()=>{instalarEvt=null;$('#btnInstalar').hidden=true;toast('App instalado')});
async function copiar(txt,ok){try{await navigator.clipboard.writeText(txt);toast(ok||'Copiado')}catch(e){toast('Não foi possível copiar automaticamente.','bad')}}
function baixar(nome,conteudo,tipo){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([conteudo],{type:tipo}));a.download=nome;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
const A={
  tab:el=>{const t=el.dataset.t;history.replaceState(null,'','#'+t);S.tab=t;render();window.scrollTo(0,0)},
  filtro:el=>{S.filtro=el.dataset.f;render()},
  novaLoc:()=>formLoc(null),novaLocCli:el=>formLoc(null,{clienteId:el.dataset.id}),editarLoc:el=>formLoc(el.dataset.id),
  abrirLoc:el=>openLoc(el.dataset.id),abrirCli:el=>openCli(el.dataset.id),
  novoCli:()=>formCli(null),editarCli:el=>formCli(el.dataset.id),
  novoItem:()=>formItem(null),editarItem:el=>formItem(el.dataset.id),
  irEstoque:()=>{closeModal();A.tab({dataset:{t:'estoque'}})},
  toggleItem:el=>{S.itemAberto=S.itemAberto===el.dataset.id?null:el.dataset.id;render()},
  fechar:()=>closeModal(),
  addLinha:()=>{$('#linhas').insertAdjacentHTML('beforeend',linhaHTML({}));updDisp()},
  rmLinha:el=>{const L=document.querySelectorAll('#linhas .linha');const r=el.closest('.linha');if(L.length>1)r.remove();else{r.querySelector('.lItem').value='';r.querySelector('.lQtd').value=''}updDisp()},
  calcValor:()=>calcValor(),
  colarLoc:async()=>{try{const t=await navigator.clipboard.readText();if(t){$('#lLoc').value=limparLocal(t);infoLoc()}else toast('A área de transferência está vazia.','bad')}catch(e){toast('Toque e segure no campo e escolha Colar.','bad');$('#lLoc').focus()}},
  aquiLoc:el=>{if(!navigator.geolocation){toast('Este aparelho não informa a localização.','bad');return}el.disabled=true;el.textContent='Buscando…';
    navigator.geolocation.getCurrentPosition(p=>{$('#lLoc').value=`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;infoLoc();el.disabled=false;el.textContent='Usar onde estou agora'},
    ()=>{toast('Não foi possível pegar a localização. Verifique a permissão.','bad');el.disabled=false;el.textContent='Usar onde estou agora'},{enableHighAccuracy:true,timeout:15000})},
  copiarLoc:el=>{const l=S.locacoes.get(el.dataset.id);copiar(mapsURL(l.localizacao,l.endereco),'Link da localização copiado')},
  agModo:el=>{S.agModo=el.dataset.m;ls.set('wjr.agModo',S.agModo);const d=pd(S.agDia+'T00:00');if(S.agModo==='semana')S.agSemana=startWeek(d);else S.agMes=new Date(d.getFullYear(),d.getMonth(),1);render()},
  agNav:el=>{const n=+el.dataset.d;if(S.agModo==='mes')S.agMes=new Date(S.agMes.getFullYear(),S.agMes.getMonth()+n,1);else{S.agSemana=addDays(S.agSemana,7*n);S.agDia=ymd(S.agSemana)}render()},
  agHoje:()=>{const t=new Date();S.agMes=new Date(t.getFullYear(),t.getMonth(),1);S.agSemana=startWeek(t);S.agDia=ymd(t);render()},
  agDia:el=>{S.agDia=el.dataset.d;render()},
  verImg:async el=>{const u=await urlAnexo(el.dataset.anx);if(!u)return;const lb=$('#lightbox');lb.querySelector('img').src=u;lb.hidden=false},
  fecharImg:()=>{$('#lightbox').hidden=true},
  pedirDev:()=>{const b=$('#devBox');b.hidden=!b.hidden},
  confirmarDev:async el=>{const l=S.locacoes.get(el.dataset.id);await save('locacoes',l.id,{...l,devolvidoEm:$('#devQuando').value||toLocalInput(new Date())});toast('Retirada registrada. Peças de volta ao estoque.')},
  desfazerDev:async el=>{const d={...S.locacoes.get(el.dataset.id)};delete d.devolvidoEm;await save('locacoes',d.id,d);toast('Retirada desfeita')},
  excluirLoc:async el=>{if(!armConfirm(el,'Toque de novo para excluir'))return;const l=S.locacoes.get(el.dataset.id);closeModal();await del('locacoes',l.id);toast('Locação excluída');
    for(const a of [...(l.anexos||[]),...(l.pagamentos||[]).map(p=>p.comprovante).filter(Boolean)])apagarArquivo(a.id)},
  excluirCli:async el=>{if(!armConfirm(el,'Toque de novo para excluir'))return;closeModal();await del('clientes',el.dataset.id);toast('Cliente excluído')},
  excluirItem:async el=>{const id=el.dataset.id;if(emUso(id)>0){const e=$('#iErr');e.textContent='Este item está em locações ativas. Registre as retiradas antes de excluir.';e.hidden=false;return}if(!armConfirm(el,'Toque de novo para excluir'))return;closeModal();await del('itens',id);toast('Item excluído')},
  addPag:async el=>{const l=S.locacoes.get(el.dataset.id);const valor=parseMoney($('#pValor').value);if(!valor){toast('Informe o valor recebido.','bad');$('#pValor').focus();return}
    el.disabled=true;el.textContent='Salvando…';const fi=$('#pArq');
    try{let comp=null;if(fi&&fi.files[0])comp=await enviarArquivo(fi.files[0]);
      const p={id:'p'+uid(),valor,data:$('#pData').value||ymd(new Date()),forma:$('#pForma').value};if(comp)p.comprovante=comp;
      const cur=S.locacoes.get(l.id);$('#pValor').value='';if(fi)fi.value='';
      await save('locacoes',l.id,{...cur,pagamentos:[...(cur.pagamentos||[]),p]});toast('Pagamento registrado')}catch(e){el.disabled=false;el.textContent='Registrar pagamento'}},
  rmPag:async el=>{if(!armConfirm(el,'Confirmar'))return;const l=S.locacoes.get(el.dataset.id);const p=(l.pagamentos||[]).find(x=>x.id===el.dataset.p);
    await save('locacoes',l.id,{...l,pagamentos:(l.pagamentos||[]).filter(x=>x.id!==el.dataset.p)});if(p&&p.comprovante)apagarArquivo(p.comprovante.id);toast('Pagamento removido')},
  rmAnexo:async el=>{if(!armConfirm(el,'?'))return;const l=S.locacoes.get(el.dataset.id);await save('locacoes',l.id,{...l,anexos:(l.anexos||[]).filter(a=>a.id!==el.dataset.x)});apagarArquivo(el.dataset.x);toast('Anexo removido')},
  apagarExemplos:async el=>{if(!armConfirm(el,'Toque de novo para apagar os exemplos'))return;el.disabled=true;
    for(const col of ['locacoes','clientes','itens'])for(const x of [...S[col].values()])if(x.exemplo)await del(col,x.id);toast('Dados de exemplo apagados')},
  instalar:async()=>{if(!instalarEvt){A.tab({dataset:{t:'ajustes'}});return}instalarEvt.prompt();await instalarEvt.userChoice;instalarEvt=null;$('#btnInstalar').hidden=true;render()},
  copiarSQL:()=>copiar(SQL,'Código SQL copiado'),
  copiarAgenda:el=>copiar(el.dataset.u,'Link da agenda copiado'),
  copiarConvite:()=>{const c=cfg();const u=location.origin+location.pathname+'#convite='+btoa(JSON.stringify({url:c.url,chave:c.chave}));copiar(u,'Link de convite copiado. Mande para a equipe pelo WhatsApp.')},
  sincronizar:async()=>{toast('Sincronizando…');await enviarFila();await baixarTudo();render();toast(S.sync.erro?S.sync.erro:'Tudo sincronizado',S.sync.erro?'bad':'')},
  sair:async el=>{if(!armConfirm(el,'Toque de novo para sair'))return;if(sb)await sb.auth.signOut();if(canal){sb.removeChannel(canal);canal=null}S.sync={...S.sync,estado:'login',email:null};render()},
  desconectar:async el=>{if(!armConfirm(el,'Toque de novo para desligar'))return;if(sb){try{await sb.auth.signOut()}catch(e){}}sb=null;canal=null;ls.set('wjr.nuvem','local');ls.set('wjr.nuvemIniciada',null);S.sync={estado:'local',email:null,pendentes:0,erro:null};render()},
  exportar:async()=>{const all=(await idbAll('docs')).filter(([,r])=>!r.apagado).map(([,r])=>({col:r.col,id:r.id,dados:r.dados}));baixar(`wjr-copia-${ymd(new Date())}.json`,JSON.stringify({app:'wjr',versao:1,criado:new Date().toISOString(),registros:all},null,1),'application/json');toast('Cópia baixada')},
};
document.addEventListener('click',e=>{
  if(e.target.id==='modal'){closeModal();return}
  if(e.target.id==='lightbox'){A.fecharImg();return}
  const el=e.target.closest('[data-a]');if(!el)return;
  if(el.tagName==='SELECT'||el.tagName==='INPUT')return;
  const fn=A[el.dataset.a];if(fn){e.preventDefault();e.stopPropagation();Promise.resolve(fn(el,e)).catch(err=>{console.error(err);toast('Algo deu errado. Tente de novo.','bad')})}
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='busca'){S.busca=t.value;render()}
  else if(t.id==='buscaCli'){S.buscaCli=t.value;render()}
  else if(t.id==='lLoc')infoLoc();
  else if(t.closest&&t.closest('#linhas'))updDisp();
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='finPer'){S.finPer=t.value;render()}
  else if(t.closest&&t.closest('#linhas'))updDisp();
  else if(t.id==='aArq'&&t.files[0]){const id=t.dataset.id,file=t.files[0];t.value='';
    try{const a=await enviarArquivo(file);const cur=S.locacoes.get(id);await save('locacoes',id,{...cur,anexos:[...(cur.anexos||[]),a]});toast('Anexo salvo')}catch(err){}}
  else if(t.id==='impArq'&&t.files[0]){
    try{const j=JSON.parse(await t.files[0].text());if(j.app!=='wjr'||!Array.isArray(j.registros))throw 0;let n=0;
      for(const r of j.registros){if(COLS.includes(r.col)&&r.id){await save(r.col,r.id,r.dados);n++}}toast(`${n} registros restaurados`)}catch(err){toast('Arquivo de cópia inválido.','bad')}
    t.value=''}
});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  if(f.id==='fLoc')salvarLoc(f);else if(f.id==='fCli')salvarCli(f);else if(f.id==='fItem')salvarItem(f);
  else if(f.id==='fNuvem'){let url=$('#cfgUrl').value.trim().replace(/\/+$/,'');const chave=$('#cfgChave').value.trim();
    if(!/^https:\/\/.+/.test(url)){toast('O endereço precisa começar com https://','bad');return}
    ls.set('wjr.nuvem',JSON.stringify({url,chave}));S.sync.erro=null;$('#cfgUrl').blur();await iniciarNuvem();render()}
  else if(f.id==='fLogin'){const b=f.querySelector('button.primary');b.disabled=true;b.textContent='Entrando…';
    const {data,error}=await sb.auth.signInWithPassword({email:$('#lgEmail').value.trim(),password:$('#lgSenha').value});
    if(error){S.sync.erro=/Invalid login/i.test(error.message)?'E-mail ou senha incorretos.':traduzErro(error);b.disabled=false;b.textContent='Entrar';$('#lgSenha').blur();render();return}
    $('#lgSenha').blur();await aposLogin(data.session);toast('Conectado à equipe')}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#lightbox').hidden)A.fecharImg();else if(!$('#modal').hidden)closeModal()}});
window.addEventListener('hashchange',()=>{readHash();render()});

/* =================== EXEMPLOS (primeiro uso, só neste aparelho) =================== */
async function semearExemplos(){
  const d=n=>toLocalInput(new Date(addDays(new Date(),n).setHours(8,0,0,0)));const dia=n=>ymd(addDays(new Date(),n));
  const it={'ex-escora':{nome:'Escora metálica 3,10 m',categoria:'Escoras',total:800,precoDia:0.6},'ex-forcado':{nome:'Forcado para escora',categoria:'Acessórios',total:500,precoDia:0.1},
    'ex-andaime':{nome:'Andaime tubular 1,00 × 1,50 m',categoria:'Andaimes',total:300,precoDia:1.2},'ex-plataforma':{nome:'Plataforma metálica',categoria:'Acessórios',total:150,precoDia:0.9},'ex-sapata':{nome:'Sapata ajustável',categoria:'Acessórios',total:400,precoDia:0.15}};
  const cl={'ex-c1':{nome:'Construtora Horizonte (exemplo)',telefone:'(11) 90000-0001',contato:'Mestre Carlos'},'ex-c2':{nome:'João Pereira (exemplo)',telefone:'(11) 90000-0002'},'ex-c3':{nome:'Engenharia Vale Verde (exemplo)',telefone:'(11) 90000-0003',contato:'Eng. Marta'}};
  const lo={'ex-l1':{clienteId:'ex-c1',endereco:'Av. Paulista, 1000 – Bela Vista (exemplo)',localizacao:'-23.564224, -46.652857',retirada:d(-19),devolucao:d(11),itens:[{itemId:'ex-escora',qtd:250},{itemId:'ex-forcado',qtd:250}],valor:4500,pagamentos:[{id:'pex1',valor:2000,data:dia(-19),forma:'Pix'}],obs:'Laje do 2º andar'},
    'ex-l2':{clienteId:'ex-c2',endereco:'Av. Brasil, 845 – Jardim América (exemplo)',retirada:d(-38),devolucao:d(-3),itens:[{itemId:'ex-andaime',qtd:40},{itemId:'ex-plataforma',qtd:20},{itemId:'ex-sapata',qtd:40}],valor:1800,pagamentos:[],obs:'Fachada'},
    'ex-l3':{clienteId:'ex-c3',endereco:'Rod. SP-280, km 30 – Galpão 4 (exemplo)',retirada:d(3),devolucao:d(33),itens:[{itemId:'ex-escora',qtd:400},{itemId:'ex-forcado',qtd:200},{itemId:'ex-sapata',qtd:100}],valor:7200,pagamentos:[]},
    'ex-l4':{clienteId:'ex-c1',endereco:'Rua Ipê Roxo, 33 – Vila Nova (exemplo)',retirada:d(-54),devolucao:d(-24),devolvidoEm:d(-24),itens:[{itemId:'ex-andaime',qtd:60},{itemId:'ex-plataforma',qtd:30}],valor:3200,pagamentos:[{id:'pex2',valor:3200,data:dia(-24),forma:'Transferência'}]}};
  for(const [col,o] of [['itens',it],['clientes',cl],['locacoes',lo]])for(const [id,v] of Object.entries(o)){const dados={anexos:[],...v,exemplo:true};if(col!=='locacoes')delete dados.anexos;await idbPut('docs',col+'/'+id,{col,id,dados,apagado:false})}
}

/* =================== INÍCIO =================== */
(async()=>{
  try{idb=await abrirIDB()}catch(e){$('#main').innerHTML='<div class="empty"><strong>Não foi possível abrir o armazenamento</strong>Saia do modo de navegação privada e abra de novo.</div>';return}
  // convite da equipe: #convite=...
  const m=location.hash.match(/^#convite=(.+)$/);
  if(m){try{const c=JSON.parse(atob(decodeURIComponent(m[1])));if(c.url&&c.chave){ls.set('wjr.nuvem',JSON.stringify({url:c.url,chave:c.chave}));S.tab='ajustes'}}catch(e){}history.replaceState(null,'',location.pathname+'#ajustes')}
  // Sem dados de exemplo: o app começa vazio. Para um teste, abra com #exemplos.
  if(location.hash==='#exemplos'){if(!(await idbAll('docs')).length)await semearExemplos();history.replaceState(null,'',location.pathname)}
  await carregarLocal();
  S.sync.pendentes=(await idbAll('fila')).length;
  S.pronto=true;render();
  // localização recebida pelo "Compartilhar" (Android)
  const q=new URLSearchParams(location.search);const rec=[q.get('title'),q.get('text'),q.get('url')].filter(Boolean).join(' ');
  if(rec){history.replaceState(null,'',location.pathname+location.hash);formLoc(null,{localizacao:limparLocal(rec)});toast('Localização recebida. Complete a locação.')}
  if(cfg())iniciarNuvem();
  if('serviceWorker' in navigator&&location.protocol!=='file:'){
    const tinha=!!navigator.serviceWorker.controller;let recarregou=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(tinha&&!recarregou&&(!S.modal||S.modal.kind!=='form')){recarregou=true;location.reload()}});
    navigator.serviceWorker.register('sw.js').then(r=>r.update()).catch(()=>{});
  }
  setInterval(()=>{if(!S.modal||S.modal.kind!=='form')render()},5*60*1000);
  setInterval(()=>{if(syncOn())enviarFila()},60*1000);
})();
})();
