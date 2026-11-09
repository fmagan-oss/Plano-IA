/* CatPilot — logique applicative (extraite du monolithe) */

/* landing = porte d'entrée, quel que soit le propriétaire de <body> (fichier autonome OU artefact ré-encapsulé) */try{document.body.classList.add('landing-mode');}catch(e){}

/* ---- bloc ---- */


function enterApp(){document.body.classList.remove("landing-mode");try{window.scrollTo(0,0);}catch(e){}}
function goHome(){document.body.classList.add("landing-mode");try{window.scrollTo(0,0);}catch(e){}}

/* ============ DONNÉES DÉMO — 16 EAN fictifs ============ */
/* vmh = ventes moyennes hebdo (u/mag), ca = CA MAT k€ (total marché catégorie sur ces EAN = 46,2 M€ -> ici top 16 = 41,9 M€, solde longue traîne 4,3 M€ hors plan), mg = marge distributeur %, pdm = PDM valeur %, gr = croissance % */
const EANS=[
 {id:"bcf",n:"KolorMen Barbe Châtain Foncé",seg:"Barbe",cls:"beard",br:"client",prix:10.9,vmh:3.9,ca:8900,mg:32,pdm:19.3,gr:9.5},
 {id:"bnr",n:"KolorMen Barbe Noir",seg:"Barbe",cls:"beard",br:"client",prix:10.9,vmh:2.4,ca:5450,mg:32,pdm:11.8,gr:8.2},
 {id:"bct",n:"KolorMen Barbe Châtain",seg:"Barbe",cls:"beard",br:"client",prix:10.9,vmh:1.3,ca:2950,mg:32,pdm:6.4,gr:6.1},
 {id:"bcc",n:"KolorMen Barbe Châtain Clair",seg:"Barbe",cls:"beard",br:"client",prix:10.9,vmh:1.0,ca:2250,mg:32,pdm:4.9,gr:5.4},
 {id:"bbl",n:"KolorMen Barbe Blond",seg:"Barbe",cls:"beard",br:"client",prix:10.9,vmh:0.6,ca:1400,mg:32,pdm:3.0,gr:4.0},
 {id:"ccf",n:"KolorMen Cheveux Châtain Foncé",seg:"Cheveux",cls:"hair",br:"client",prix:9.6,vmh:1.9,ca:4150,mg:30,pdm:9.0,gr:2.4},
 {id:"cnr",n:"KolorMen Cheveux Noir",seg:"Cheveux",cls:"hair",br:"client",prix:9.6,vmh:1.2,ca:2700,mg:30,pdm:5.8,gr:1.8},
 {id:"cct",n:"KolorMen Cheveux Châtain",seg:"Cheveux",cls:"hair",br:"client",prix:9.6,vmh:0.8,ca:1800,mg:30,pdm:3.9,gr:1.1},
 {id:"gxs",n:"GX-One Shampooing anti-gris",seg:"Anti-gris",cls:"innov",br:"client",prix:12.4,vmh:1.1,ca:2500,mg:35,pdm:5.4,gr:19.0,nw:1},
 {id:"gxb",n:"GX-One Beard Wash",seg:"Anti-gris",cls:"innov",br:"client",prix:11.8,vmh:0.5,ca:1100,mg:35,pdm:2.4,gr:17.5,nw:1},
 {id:"itd",n:"InstaTouch 1-Day Barbe & Sourcils",seg:"1-Day",cls:"innov",br:"client",prix:13.2,vmh:0.35,ca:800,mg:36,pdm:1.7,gr:24.3,nw:1},
 {id:"grb",n:"Grizzly Cheveux Brun",seg:"Cheveux",cls:"comp",br:"conc",prix:8.9,vmh:1.7,ca:3600,mg:27,pdm:7.8,gr:-1.2},
 {id:"grn",n:"Grizzly Cheveux Noir",seg:"Cheveux",cls:"comp",br:"conc",prix:8.9,vmh:1.1,ca:2350,mg:27,pdm:5.1,gr:-2.0},
 {id:"grc",n:"Grizzly Cheveux Châtain",seg:"Cheveux",cls:"comp",br:"conc",prix:8.9,vmh:0.7,ca:1500,mg:27,pdm:3.2,gr:-2.6},
 {id:"mdb",n:"MDD Coloration Homme Brun",seg:"Cheveux",cls:"mdd",br:"mdd",prix:5.9,vmh:1.4,ca:1950,mg:41,pdm:4.2,gr:3.1},
 {id:"mdn",n:"MDD Coloration Homme Noir",seg:"Cheveux",cls:"mdd",br:"mdd",prix:5.9,vmh:0.9,ca:1250,mg:41,pdm:2.7,gr:2.5},
 {id:"bio1",n:"KolorMen Végétal Barbe Bio",seg:"Barbe",cls:"innov",br:"client",prix:12.5,vmh:1.5,ca:3400,mg:34,pdm:7.4,gr:24.0,nw:1,nat:1},
 {id:"bio2",n:"KolorMen Naturel Cheveux Sans Ammoniaque",seg:"Cheveux",cls:"innov",br:"client",prix:11.9,vmh:1.2,ca:2600,mg:33,pdm:5.6,gr:19.0,nat:1},
];
const SHORT={bcf:"B.CF",bnr:"B.Noir",bct:"B.Chât",bcc:"B.ChC",bbl:"B.Blond",ccf:"C.CF",cnr:"C.Noir",cct:"C.Chât",gxs:"GX Sh.",gxb:"GX Bd.",itd:"InstaT",grb:"Gz.Brun",grn:"Gz.Noir",grc:"Gz.Chât",mdb:"MDD Br",mdn:"MDD Nr"};
/* ============ MARQUEURS ============ */
const MARKERS=[
 {id:"cacm",lab:"CA / cm linéaire",badge:"b-val",tag:"VALEUR",def:"Productivité valeur du linéaire : CA MAT ÷ cm alloués. Le juge de paix de l'acheteur.",w:30,get:e=>e.ca},
 {id:"vmh",lab:"VMH — rotation unitaire",badge:"b-rot",tag:"ROTATION",def:"Ventes moyennes hebdo par magasin. Pilote le réassort et le risque de rupture.",w:25,get:e=>e.vmh},
 {id:"marge",lab:"Marge distributeur / cm",badge:"b-mge",tag:"MARGE",def:"Taux de marge × CA ÷ cm : l'argument différenciant vs le CA pur (MDD, innovations).",w:15,get:e=>e.ca*e.mg/100},
 {id:"pdm",lab:"PDM valeur (représentativité)",badge:"b-mkt",tag:"MARCHÉ",def:"Le rayon doit refléter le marché : un plan sous-pondérant un leader se fait retoquer.",w:15,get:e=>e.pdm},
 {id:"gr",lab:"Croissance segment / réf",badge:"b-mkt",tag:"MARCHÉ",def:"Dynamique N vs N-1 : sur-pondérer ce qui monte (anti-gris, 1-Day), pas l'historique.",w:15,get:e=>e.gr},
];
const TOGGLES=[
 {id:"pair",lab:"Facings pairs, min. 2 par réf",def:"Visibilité + réassort : jamais de facing orphelin.",on:true},
 {id:"eye",lab:"Leaders au niveau des yeux",def:"Planche 2 (à hauteur 1,50-1,70 m) réservée aux top scores du segment cœur.",on:true},
 {id:"bloc",lab:"Blocs par usage (barbe / cheveux)",def:"Implantation segmentée par usage — pas par marque : lisibilité shopper.",on:true},
 {id:"innovtop",lab:"Innovations en zone découverte",def:"Nouveautés sur la planche du haut, badge NOUVEAU.",on:true},
 {id:"mddbas",lab:"MDD & entrée de prix en bas",def:"Règle GMS : premium en haut, prix bas en bas — sens de lecture prix décroissant.",on:true},
 {id:"conc",lab:"Représenter la concurrence",def:"Un plan catégoriel crédible inclut le concurrent — sinon l'acheteur le fait pour vous.",on:true},
];
/* ============ ÉTAT ============ */
const S={cat:"colo",nel:1,wel:133,npl:4,variant:"equi"};
const WSTEPS=["s0","s1","s2","s3","s4","s5","s6"];
let cur=0;
/* ============ WIZARD NAV ============ */
function go(i){
  cur=i;
  WSTEPS.forEach((id,j)=>document.getElementById(id).style.display=j===i?'':'none');
  document.querySelectorAll('#stepper .step').forEach((el,j)=>{
    el.classList.toggle('cur',j===i); el.classList.toggle('done',j<i);
  });
  document.querySelectorAll('#stepper .rail').forEach((el,j)=>el.classList.toggle('done',j<i));
  window.scrollTo({top:0});
}
document.getElementById('stepper').addEventListener('click',e=>{
  const st=e.target.closest('.step'); if(!st)return;
  const i=+st.dataset.s; if(i<=cur||i<4) go(i); if(i===4&&document.getElementById('gwrap').children.length) go(4);
});
/* ============ CONTRÔLES NUMÉRIQUES ============ */
const LIMITS={nel:[1,5,1]};
const WELSTEPS=[100,125,133];
const NPLSTEPS=[0.5,1,2,3,4,5,6];
function chg(k,d){
  if(k==='wel'){ let i=WELSTEPS.indexOf(S.wel); i=Math.min(WELSTEPS.length-1,Math.max(0,i+d)); S.wel=WELSTEPS[i]; }
  else if(k==='npl'){ let i=NPLSTEPS.indexOf(S.npl); i=Math.min(NPLSTEPS.length-1,Math.max(0,i+d)); S.npl=NPLSTEPS[i]; }
  else { const[mn,mx,st]=LIMITS[k]; S[k]=Math.min(mx,Math.max(mn,S[k]+d*st)); }
  refreshCtl();
}
function capPerShelf(){ return Math.floor(S.wel/7.5); }
function totalCapacity(){ return Math.floor(capPerShelf()*S.npl)*S.nel; }
function nplLabel(){ return S.npl===0.5?'½':String(S.npl); }
function refreshCtl(){ if(!document.getElementById('v_nel')){ try{updateCaplines();}catch(e){} return; }
  document.getElementById('v_nel').textContent=S.nel;
  document.getElementById('v_wel').textContent=S.wel;
  document.getElementById('v_npl').textContent=nplLabel();
  document.getElementById('v_cap').textContent=capPerShelf()+" facings";
  const tot=totalCapacity();
  const eyeTxt=S.npl<=1?"La planche unique porte le socle <b>au niveau des yeux</b>.":S.npl===2?"La planche basse est le <b>niveau des yeux</b>.":"La planche n°2 en partant du haut est traitée comme <b>niveau des yeux</b>.";
  document.getElementById('capline').innerHTML=`Capacité totale du rayon : <b>${tot} facings</b> (${nplLabel()} planche(s) × ${S.nel} élément${S.nel>1?"s":""}) = <b>${(tot*7.5).toFixed(0)} cm</b> de linéaire développé. ${eyeTxt}`;
}
/* ============ MARQUEURS UI ============ */
function buildMarkers(){
  const box=document.getElementById('mklist'); box.innerHTML='';
  MARKERS.forEach(m=>{
    const d=document.createElement('div'); d.className='mk';
    d.innerHTML=`<div class="lab"><b>${m.lab} <span class="badge ${m.badge}">${m.tag}</span></b><small>${m.def}</small></div>
    <input type="range" min="0" max="100" value="${m.w}" data-m="${m.id}">
    <input type="number" class="wnum" min="0" max="100" value="${m.w}" data-mn="${m.id}" style="width:64px;border:1.5px solid var(--line);border-radius:9px;padding:7px 8px;font:inherit;font-size:13px;font-weight:800;color:var(--acc-d);text-align:center">`;
    box.appendChild(d);
  });
  function clampSet(id,val){
    const m=MARKERS.find(x=>x.id===id);
    const others=MARKERS.reduce((a,x)=>a+(x.id===id?0:x.w),0);
    m.w=Math.max(0,Math.min(val,100-others));
    syncMk();
  }
  function syncMk(){
    MARKERS.forEach(m=>{
      const sl=box.querySelector(`input[data-m="${m.id}"]`), nu=box.querySelector(`input[data-mn="${m.id}"]`);
      if(sl) sl.value=m.w; if(nu) nu.value=m.w;
    });
    document.getElementById('wsum').textContent=MARKERS.reduce((a,b)=>a+b.w,0)+'%';
  }
  window.syncMk=syncMk; window.clampSet=clampSet;
  box.addEventListener('input',e=>{
    const id=e.target.dataset.m||e.target.dataset.mn; if(!id)return;
    clampSet(id,+e.target.value||0);
  });
  const tb=document.getElementById('tglist'); tb.innerHTML='';
  TOGGLES.forEach(t=>{
    const l=document.createElement('label'); l.className='tg'+(t.on?' on':'');
    l.innerHTML=`<input type="checkbox" ${t.on?'checked':''} data-t="${t.id}"><span><b>${t.lab}</b><small>${t.def}</small></span>`;
    tb.appendChild(l);
  });
  tb.addEventListener('change',e=>{
    const t=TOGGLES.find(x=>x.id===e.target.dataset.t); t.on=e.target.checked;
    e.target.closest('.tg').classList.toggle('on',t.on);
  });
}
/* ============ MOTEUR D'ALLOCATION ============ */
function norm(vals){ const mn=Math.min(...vals),mx=Math.max(...vals); return vals.map(v=>mx>mn?(v-mn)/(mx-mn):0.5); }
function computeScores(){
  const tw=MARKERS.reduce((a,m)=>a+m.w,0)||1;
  const mats=MARKERS.map(m=>norm(EANS.map(m.get)));
  return EANS.map((e,i)=>({e,score:MARKERS.reduce((a,m,k)=>a+m.w/tw*mats[k][i],0)}));
}
function generate(){
  const tg=Object.fromEntries(TOGGLES.map(t=>[t.id,t.on]));
  const cap=capPerShelf(), totF=totalCapacity();
  let scored=computeScores().sort((a,b)=>b.score-a.score);
  if(!tg.conc) scored=scored.filter(s=>s.e.br!=='conc');
  /* allocation proportionnelle au score, min 2, pairs */
  const minF=tg.pair?2:1, step=tg.pair?2:1;
  const sum=scored.reduce((a,s)=>a+s.score,0);
  let alloc=scored.map(s=>({...s,f:Math.max(minF,Math.round(s.score/sum*totF/step)*step)}));
  /* nb réfs tenable : réduire par le bas tant que ça déborde */
  let used=()=>alloc.reduce((a,x)=>a+x.f,0);
  while(used()>totF && alloc.length){
    const last=alloc[alloc.length-1];
    if(last.f>minF) last.f-=step; else alloc.pop();
  }
  /* redistribuer le reliquat aux tops (pairs) */
  let guard=200;
  while(used()+step<=totF && guard--){ alloc[ (guard%Math.min(4,alloc.length)) ].f+=step; }
  /* garantir la visibilité des nouveautés : toute réf nw absente est réintégrée (min facings), en prenant à la plus faible non-nw */
  scored.filter(s=>s.e.nw).forEach(s=>{
    if(!alloc.find(a=>a.e.id===s.e.id)){
      const donor=[...alloc].reverse().find(a=>!a.e.nw && a.f>minF);
      if(donor){ donor.f-=step; alloc.push({...s,f:minF}); }
    }
  });
  render(alloc,tg,cap,totF); window.lastAlloc=alloc; window.lastTotF=totF;
}
/* placement vertical par planches : haut→bas = [innovations+premium] [cheveux] [YEUX: barbe leaders] [barbe reste/conc] [MDD] adapté au nb de planches */
function shelfPlanFor(npl){
  if(npl<=1) return [["eyes","innov","hair","rest","mdd"]];
  if(npl===2) return [["innov","hair"],["eyes","rest","mdd"]];
  if(npl===3) return [["innov","hair"],["eyes"],["rest","mdd"]];
  if(npl===4) return [["innov"],["eyes"],["hair","rest"],["mdd"]];
  if(npl===5) return [["innov"],["eyes"],["hair"],["rest"],["mdd"]];
  return [["innov"],["premium"],["eyes"],["hair"],["rest"],["mdd"]];
}
function render(alloc,tg,cap,totF){
  /* groupes */
  const eyesPool=[], innov=[], hair=[], mdd=[], rest=[];
  const beards=alloc.filter(a=>a.e.cls==='beard');
  const eyeCount=tg.eye?Math.min(2,beards.length):0;
  alloc.forEach((a,i)=>{
    if(tg.innovtop&&a.e.cls==='innov'){innov.push(a);return;}
    if(tg.mddbas&&a.e.cls==='mdd'){mdd.push(a);return;}
    if(tg.eye&&a.e.cls==='beard'&&beards.indexOf(a)<eyeCount){eyesPool.push(a);return;}
    if(a.e.cls==='hair'||a.e.cls==='comp'){hair.push(a);return;}
    rest.push(a);
  });
  if(!tg.bloc){ /* sans blocs par usage: tout au score dans l'ordre */ }
  const plan=shelfPlanFor(S.npl);
  const buckets={innov,eyes:eyesPool,hair,rest,mdd,premium:[]};
  /* blocs par marque : regrouper les réfs d'une même marque, puis par score */
  Object.keys(buckets).forEach(k=>buckets[k].sort((a,b)=>{
    const ba=(a.e.brand||a.e.seg||'zz'), bb=(b.e.brand||b.e.seg||'zz');
    if(ba!==bb) return ba<bb?-1:1;
    return (b.score||0)-(a.score||0);
  }));
  /* aplatissement en file de facings par planche (répartis sur éléments) */
  /* Agencement piloté par la DÉFINITION DU BLOC-MARQUE : bloc segment ou bloc
     marque, en bandes verticales ou horizontales (cf. layoutBlocks). */
  const capRow=(S.npl<1?Math.floor(cap*S.npl):cap)*S.nel;
  const shelves=layoutBlocks(alloc, plan, capRow, S.blocBy||'seg', S.orient||'h', !!S.natPole, S.natZone||'cold');
  /* rendu HTML par élément */
  const gw=document.getElementById('gwrap'); gw.innerHTML='';
  for(let el=0;el<S.nel;el++){
    const div=document.createElement('div'); div.className='element';
    let inner=`<div class="eh">ÉLÉMENT ${el+1} · ${S.wel} cm</div>`;
    const capEl=S.npl<1?Math.floor(cap*S.npl):cap;
    shelves.forEach((row,si)=>{
      const slice=row.slice(el*capEl,(el+1)*capEl);
      const isEye=plan[si].includes('eyes');
      inner+=`<div class="shelf">${isEye?'<span class="eyeband">NIVEAU DES YEUX</span>':''}${slice.map(e=>{const pk=(packsOn()&&window.PACKS&&window.PACKS[e.id])?window.PACKS[e.id]:null; return pk?`<div class="fc ${e.cls} haspack" title="${e.n}"><img src="${pk}" alt=""></div>`:`<div class="fc ${e.cls}" title="${e.n}">${e.nw?'<span class=nw>NEW</span>':''}${SHORT[e.id]}</div>`;}).join('')}</div>`;
    });
    inner+=`<div class="dim">${S.wel} cm · ${nplLabel()} planche(s)</div>`;
    div.innerHTML=inner; gw.appendChild(div);
  }
  /* tableau assortiment */
  /* Bases justification : CA de TOUT le fichier + marque client désignée (corrige les noms démo en dur). */
  const caUnivers=EANS.reduce((a,e)=>a+Math.max(0,e.ca||0),0);
  const clientRefsU=EANS.filter(e=>e.br==='client');
  const clientBrand=clientRefsU.length ? refBrand([...clientRefsU].sort((a,b)=>(b.ca||0)-(a.ca||0))[0]) : 'Client';
  /* Tableaux « Assortiment » et « Métriques » retirés : les calculs restent (le
     plan de masse, la trame et les tableaux de justification en dépendent). */
  let usedF=alloc.reduce((a,x)=>a+x.f,0);
  const caTot=alloc.reduce((a,x)=>a+x.e.ca,0), cmTot=usedF*7.5;
  const caCm=caTot/cmTot, vmhTot=alloc.reduce((a,x)=>a+x.e.vmh,0);
  const mgCm=alloc.reduce((a,x)=>a+x.e.ca*x.e.mg/100,0)/cmTot;
  /* PDL */
  const by={client:0,conc:0,mdd:0};
  alloc.forEach(a=>by[a.e.br]+=a.f);
  const pz=document.getElementById('pdlzone');
  const colors={client:"#2E6BFF",conc:"#8A94A0",mdd:"#3D4B5F"};
  const labs={client:clientBrand,conc:"Concurrents",mdd:"MDD"};
  pz.innerHTML='<h3 style="font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:var(--ink2);margin-bottom:8px">PDL par intervenant</h3>'+
    Object.keys(by).filter(k=>by[k]>0).map(k=>`<div class="pdlrow"><div class="who">${labs[k]}</div><div class="bar"><div style="width:${by[k]/usedF*100}%;background:${colors[k]}"></div></div><div class="pct"><b>${(by[k]/usedF*100).toFixed(1).replace('.',',')}%</b> · ${by[k]} facings</div></div>`).join('');
  /* score plan = part de la demande pondérée couverte */
  const all=computeScores(); const sAll=all.reduce((a,x)=>a+x.score,0);
  const sIn=alloc.reduce((a,x)=>a+x.score,0);
  const sc=Math.round(sIn/sAll*100);
  document.getElementById('ring').style.setProperty('--p',sc);
  document.getElementById('ringv').textContent=sc+'%';
  window.lastPlan={alloc:alloc.map(a=>({id:a.e.id,n:a.e.n,f:a.f,score:a.score,br:a.e.br,cls:a.e.cls,vmh:a.e.vmh})),used:usedF,totF,score:sc,caTot,caCm,mgCm,by:{...by}};
  buildJustif(alloc,usedF,caUnivers,clientBrand);
  buildMasse(alloc,usedF); buildSimac(alloc,usedF,sc,caTot,caCm,mgCm,by,tg);
  document.getElementById('planverdict').innerHTML=`<b>${alloc.length} références · ${usedF}/${totF} facings.</b> Le plan couvre ${sc}% de la demande pondérée par tes marqueurs et ${(caTot/(caUnivers||1)*100).toFixed(0)}% du CA lu. ${by.conc? 'Concurrence représentée ('+(by.conc/usedF*100).toFixed(0)+'% PDL) — plan catégoriel crédible.':'⚠ Concurrence exclue : plan de marque, pas de catégorie.'}`;
}

/* ============ PLAN DE MASSE ============ */
const SEGCOLORS={"Barbe":"#C77F1E","Cheveux":"#0E8F8A","Anti-gris":"#6B4E8E","1-Day":"#8266A8"};
function buildMasse(alloc,used){
  const agg={};
  alloc.forEach(a=>{
    const e=a.e||EANS.find(x=>x.id===a.id);
    const key=(window.S&&S.natPole&&typeof isNaturel==='function'&&isNaturel(e))?'Pôle naturalité':e.seg+(e.br==='conc'?' (conc.)':e.br==='mdd'?' (MDD)':'');
    agg[key]=agg[key]||{f:0,refs:0,seg:e.seg,br:e.br};
    agg[key].f+=a.f; agg[key].refs++;
  });
  const order=Object.entries(agg).sort((a,b)=>b[1].f-a[1].f);
  const bar=document.getElementById('massbar');
  bar.innerHTML=order.map(([k,v])=>{
    const col=v.br==='conc'?'#8A94A0':v.br==='mdd'?'#3D4B5F':SEGCOLORS[v.seg]||'#2E6BFF';
    const pct=v.f/used*100;
    return `<div style="width:${pct}%;background:${col}" title="${k}: ${v.f} facings · ${(v.f*7.5).toFixed(0)} cm">${pct>=9?k+' '+pct.toFixed(0)+'%':''}</div>`;
  }).join('');
  const t=document.getElementById('masstable');
  t.innerHTML='<tr><th>Bloc</th><th>Réfs</th><th>Facings</th><th>Linéaire</th><th>% du plan</th></tr>'+
    order.map(([k,v])=>`<tr><td>${k}</td><td>${v.refs}</td><td>${v.f}</td><td>${(v.f*7.5).toFixed(0)} cm</td><td><b>${(v.f/used*100).toFixed(1).replace('.',',')}%</b></td></tr>`).join('')+
    `<tr class="tot"><td>TOTAL</td><td>${alloc.length}</td><td>${used}</td><td>${(used*7.5).toFixed(0)} cm</td><td>100%</td></tr>`;
}
/* ============ RECO SIMAC ============ */
let SIMACTXT="";
function buildSimac(alloc,used,sc,caTot,caCm,mgCm,by,tg){
  const _card=document.getElementById('simaccard');
  if(!window.PRO){
    document.getElementById('simacdeck').innerHTML=`<div class="prolock"><div class="lk">🔒 Trame de présentation acheteur</div><p>La présentation prête à dérouler devant l'acheteur — marché, ambition, changements, bénéfices, décision — est réservée à l'offre <b>Pro</b>.</p><button class="btn" onclick="setPro(true)">Voir la trame — passer en Pro (simulation)</button> <button class="btn ghost" onclick="document.getElementById('licmodal').classList.add('on')">Activer une licence</button></div>`;
    if(_card) _card.querySelectorAll('.btn').forEach(b=>{ if(!/licence/i.test(b.textContent)) b.style.display='none'; });
    return;
  }
  if(_card) _card.querySelectorAll('.btn').forEach(b=>b.style.display='');
  const caLY=caTot;
  const caProj=alloc.reduce((s,a)=>{const e=a.e||EANS.find(x=>x.id===a.id);return s+e.ca*(1+e.gr/100);},0);
  const dCA=caProj-caLY, mix=dCA/caLY*100;
  const _e=a=>a.e||EANS.find(x=>x.id===a.id);
  const fmt=x=>Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  const innov=alloc.filter(a=>_e(a).nw);
  const eyeBeard=alloc.filter(a=>_e(a).cls==='beard').reduce((s,a)=>s+a.f,0);
  const compFac=alloc.filter(a=>_e(a).br==='conc').reduce((s,a)=>s+a.f,0);
  const concPct=used?compFac/used*100:0;
  const okStock=alloc.filter(a=>{const e=_e(a);return (a.f*4)/(Math.max(0.1,e.vmh)/7*6)>=7;}).length;
  /* marché data-driven (périmètre du fichier, CA annualisé k€) */
  const catVal=EANS.reduce((s,e)=>s+e.ca,0);
  const catGr=catVal?EANS.reduce((s,e)=>s+e.ca*e.gr,0)/catVal:0;
  const famVal={}; EANS.forEach(e=>famVal[e.cls]=(famVal[e.cls]||0)+e.ca);
  const topFam=Object.entries(famVal).sort((a,b)=>b[1]-a[1])[0];
  const famLbl=topFam?(Object.values(FAMILIES).find(ff=>ff.cls===topFam[0])||{label:topFam[0]}).label:'—';
  const nBrands=new Set(EANS.map(e=>e.brand).filter(Boolean)).size;
  const S=[
    `Marché lu : <b>${(catVal/1000).toFixed(1).replace('.',',')} M€</b> de CA annualisé sur le périmètre du fichier`,
    `Dynamique moyenne pondérée : <b>${catGr>=0?'+':''}${catGr.toFixed(1).replace('.',',')}%</b> vs an dernier`,
    topFam?`Famille dominante : <b>${famLbl}</b> — ${(topFam[1]/catVal*100).toFixed(0)}% de la valeur`:`Répartition par famille lue du fichier`,
    `${nBrands>1?nBrands+' marques':'Périmètre mono-marque'}, ${EANS.length} références analysées`];
  /* ambition : potentiel à tendance actuelle, sur l'offre (hors concurrents), croissance déjà bornée */
  const clientRefs=alloc.filter(a=>_e(a).br!=='conc');
  const caLYc=clientRefs.reduce((s,a)=>s+_e(a).ca,0);
  const dCAc=clientRefs.reduce((s,a)=>s+_e(a).ca*_e(a).gr/100,0);
  const mixc=caLYc?dCAc/caLYc*100:0;
  const I=[
    `Potentiel à tendance actuelle : <b>+${fmt(dCAc)} k€</b> sur ton offre au périmètre du plan`,
    `Soit <b>${mixc>=0?'+':''}${mixc.toFixed(1).replace('.',',')}%</b> vs an dernier${catGr?` — à comparer aux <b>${catGr>=0?'+':''}${catGr.toFixed(1).replace('.',',')}%</b> du marché`:''}`,
    `${alloc.length} références couvrant <b>${sc}%</b> de la demande pondérée`];
  const M=[
    eyeBeard?`Socle barbe au niveau des yeux : <b>${eyeBeard} facings</b>`:`Blocs par famille et par marque`,
    innov.length?`Nouveautés mises en avant : <b>${innov.length}</b> (badge NEW, absentes l'an dernier)`:`Pas de nouveauté détectée sur le périmètre`,
    tg&&tg.mddbas!==false?`Entrée de prix / MDD en bas de meuble`:`—`,
    compFac?`Concurrents présents : <b>${concPct.toFixed(0)}%</b> du linéaire (plan catégoriel, pas plan de marque)`:`Périmètre mono-marque (aucun concurrent identifié)`,
    `Blocs par marque · facings pairs, minimum 2 par référence`];
  const A=[
    `<b>Conso</b> : lecture par famille et par marque, nouveautés visibles, entrée de prix présente`,
    `<b>Magasin</b> : productivité <b>${caCm.toFixed(1).replace('.',',')} k€/cm</b>, marge <b>${mgCm.toFixed(2).replace('.',',')} k€/cm</b> (base annualisée)`,
    `Couverture stock ≥ 7 j sur <b>${okStock}/${alloc.length}</b> réfs`];
  const C=[`Validation du plan proposé (${used} facings · ${(used*7.5).toFixed(0)} cm)`,`Test pilote sur un parc restreint, lecture sell-out à P+3`,`Revue conjointe et extension si l'uplift confirme`];
  const blocks=[["1","Le marché & le conso",S],["2","L&#39;ambition — le rayon de demain",I],["3","Ce qui change",M],["4","Les bénéfices — conso & magasin",A],["5","La décision",C]];
  document.getElementById('simacdeck').innerHTML=blocks.map(([l,t2,items])=>`<div class="sslide"><span class="let">${l}</span><h4>${t2}</h4><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('');
  SIMACTXT=blocks.map(([l,t2,items])=>`${t2.replace(/&#39;/g,"'").toUpperCase()}\n`+items.map(i=>"• "+i.replace(/<[^>]+>/g,'')).join("\n")).join("\n\n");
}
function copySimac(){
  const ta=document.createElement('textarea'); ta.value=SIMACTXT; document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy'); alert("Trame copiée — colle-la dans PowerPoint ou Claude.");}catch(e){alert(SIMACTXT);}
  ta.remove();
}

/* ============ VARIANTES ============ */
const VAR={equi:{cacm:28,vmh:24,marge:16,pdm:16,gr:16},rot:{cacm:8,vmh:72,marge:8,pdm:6,gr:6},marge:{cacm:8,vmh:8,marge:72,pdm:6,gr:6},ca:{cacm:72,vmh:10,marge:8,pdm:5,gr:5},pdm:{cacm:8,vmh:14,marge:6,pdm:66,gr:6}};
document.querySelector('.variants').addEventListener('click',e=>{
  const c=e.target.closest('.chip'); if(!c)return;
  document.querySelectorAll('.variants .chip').forEach(x=>x.classList.remove('on')); c.classList.add('on');
  const v=VAR[c.dataset.v];
  MARKERS.forEach(m=>{m.w=v[m.id];});
  if(window.syncMk) syncMk();
  generate();
});

/* ============ UPLOAD RAW DATAS (étape 1) ============ */
/* ---------- UPLOAD unifié : Excel/CSV → visuel IA → confirmation catégorie ---------- */
window.PENDING=null;
/* message « gros fichier » affiché AVANT le traitement bloquant (l'onglet peut se figer). */
function showPrep(name,mb){
  const aw=document.getElementById('aiwork'); if(aw) aw.style.display='block';
  const box=document.getElementById('aisteps');
  if(box) box.innerHTML='<div style="padding:12px 4px;font-size:13.5px"><b>⏳ Lecture d’un gros fichier ('+mb+' Mo)…</b><br>'+
    '<span style="color:var(--mut)">Beaucoup de lignes à consolider : le traitement peut prendre jusqu’à une minute et l’onglet peut se figer un instant — c’est normal, laisse faire.</span></div>';
}
/* lecture d'un fichier — appelée AUSSI BIEN par le clic (input) que par le glisser-déposer */
function ingestFile(file){
  if(!file) return;
  const dl=document.getElementById('droplabel'); if(dl) dl.classList.add('arm');
  const name=file.name.replace(/\.[^.]+$/,'');
  if(/\.zip$/i.test(file.name)){ if(dl) dl.classList.remove('arm'); startVisual(null,name,"Fichier ZIP : décompressez-le et déposez directement le fichier Excel (.xlsx) souhaité — par exemple la géographie qui vous intéresse."); return; }
  if(/\.xlsx?$/i.test(file.name)){
    if(typeof XLSX==='undefined'){ startVisual(null,name,"Lecture Excel indisponible hors-ligne — utilisez le modèle CSV (bouton ci-dessus)."); return; }
    const rd=new FileReader();
    rd.onload=()=>{
      const bytes=new Uint8Array(rd.result);
      const mb=bytes.length/1048576; const big=mb>4;
      /* dense:true → sheet_to_json ~14× plus rapide sur un gros fichier (289k lignes). */
      const run=()=>{ try{
        const wb=XLSX.read(bytes,{type:'array',dense:true});
        const res=parseSheet(wb);
        startVisual(res.ok?res.rows:null,name,res.ok?null:res.error,res);
      }catch(err){ startVisual(null,name,"Fichier Excel illisible (ou trop volumineux pour le navigateur)."); } };
      /* gros fichier : on affiche un message AVANT le calcul bloquant pour que l'onglet
         ne paraisse pas « planté » (le traitement synchrone peut figer l'onglet ~30-60 s). */
      if(big){ showPrep(name, mb.toFixed(0)); setTimeout(run, 60); } else run();
    };
    rd.onerror=()=>startVisual(null,name,"Lecture du fichier impossible (accès refusé par le navigateur).");
    rd.readAsArrayBuffer(file);
  } else {
    const rd=new FileReader();
    rd.onload=()=>{ try{ const txt=decodeSmart(rd.result); const res=parseDelimitedSmart(txt); startVisual(res.ok?res.rows:null,name,res.ok?null:res.error,res); }catch(err){ startVisual(null,name,"Fichier texte illisible."); } };
    rd.onerror=()=>startVisual(null,name,"Lecture du fichier impossible (accès refusé par le navigateur).");
    rd.readAsArrayBuffer(file);
  }
}
document.getElementById('rawfile').addEventListener('change',e=>{ ingestFile(e.target.files && e.target.files[0]); });
/* GLISSER-DÉPOSER : la zone disait « Déposez votre extract » mais rien n'écoutait le drop.
   On gère maintenant le dépôt direct du fichier (en plus du clic). */
(function(){
  const dz=document.getElementById('droplabel'); if(!dz) return;
  const stop=e=>{ e.preventDefault(); e.stopPropagation(); };
  ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{ stop(e); dz.classList.add('arm'); }));
  ['dragleave','dragend'].forEach(ev=>dz.addEventListener(ev,e=>{ stop(e); dz.classList.remove('arm'); }));
  dz.addEventListener('drop',e=>{ stop(e); const f=e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f) ingestFile(f); });
  // éviter que le navigateur n'ouvre le fichier si on le lâche à côté de la zone
  ['dragover','drop'].forEach(ev=>document.addEventListener(ev,e=>{ if(!dz.contains(e.target)) e.preventDefault(); },false));
})();
/* lecture Excel : première feuille → matrice → réutilise la logique de mapping colonnes */
function parseSheet(wb){
  /* essayer chaque feuille, garder celle qui donne le meilleur résultat réel */
  let best=null,bestScore=-1,lastErr="Aucune donnée exploitable dans ce fichier.";
  for(const sn of wb.SheetNames){
    if(/^index$/i.test(sn)) continue;
    let aoa; try{ aoa=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,blankrows:false,defval:""}); }catch(e){ continue; }
    if(!aoa||aoa.length<2) continue;
    let r; try{ r=smartIngest(aoa); }catch(e){ lastErr="Structure de feuille non reconnue."; continue; }
    if(r&&r.ok){
      const score=r.rows.reduce((s,x)=>s+(+x.ca>0?+x.ca:0),0);
      if(score>bestScore){ bestScore=score; best=r; }
    } else if(r&&r.error){ lastErr=r.error; }
  }
  return best || {ok:false,error:lastErr};
}
/* CSV/TSV → matrice → smartIngest */
function parseDelimitedSmart(txt){
  txt=String(txt||'').replace(/^\ufeff/,'');
  const lines=txt.split(/\r?\n/).filter(x=>x.trim());
  if(lines.length<2) return {ok:false,error:"Fichier vide."};
  const sep=lines[0].includes(';')?';':lines[0].includes('\t')?'\t':',';
  const aoa=lines.map(l=>splitLine(l,sep));
  return smartIngest(aoa);
}
/* animation « IA au travail » puis confirmation */
function startVisual(rows,name,error,res){
  document.getElementById('catconfirm').style.display='none';
  const aw=document.getElementById('aiwork'); aw.style.display='block';
  const nrows=(res&&res.mapping)?'':''; 
  const cnt=rows?rows.length:0;
  const fams=rows?new Set(rows.map(r=>r.cls)).size:0;
  const brs=(res&&res.brands)?res.brands.length:0;
  const steps=[
    {t:"Lecture du fichier",d:name?`« ${name} »`:"classeur détecté"},
    {t:"Repérage de l'en-tête & des colonnes",d:"produit, valeur, distribution, prix…"},
    {t:"Agrégation & annualisation des ventes",d:"consolidation par référence"},
    {t:"Détection des familles & marques",d:brs?`${brs} marque(s)`:"classement par usage"},
    {t:"Repérage des nouveautés (vs an dernier)",d:(res&&res.nNew)?`${res.nNew} détectée(s)`:"comparaison N-1"},
    {t:"Calcul des scores catégoriels",d:cnt?`${cnt} références prêtes`:"pondération de la demande"}
  ];
  const box=document.getElementById('aisteps');
  box.innerHTML=`<div class="ai-bar"><i id="aibarfill"></i></div>`+steps.map((s,i)=>`<div class="ai-step" data-i="${i}"><span class="dot">${i+1}</span><span class="ai-txt"><b>${s.t}</b><em>${s.d}</em></span></div>`).join('');
  const fill=document.getElementById('aibarfill');
  let i=0;
  (function next(){
    const els=box.querySelectorAll('.ai-step');
    if(i>0){ els[i-1].className='ai-step done'; els[i-1].querySelector('.dot').textContent='✓'; }
    if(fill) fill.style.width=Math.round(i/steps.length*100)+'%';
    if(i<els.length){ els[i].className='ai-step on'; i++; setTimeout(next, 560); }
    else { if(fill)fill.style.width='100%'; setTimeout(()=>{ aw.style.display='none'; showConfirm(rows,name,error,res); }, 380); }
  })();
}
function showConfirm(rows,name,error,res){
  const cc=document.getElementById('catconfirm'); cc.style.display='block';
  document.getElementById('ccfams').innerHTML='';
  // --- mapping manuel si la détection auto a échoué mais qu'on a la matrice ---
  if(!rows && res && res.needManual && res.aoa){
    cc.querySelector('.cc-badge').textContent="Associez les colonnes";
    document.getElementById('ccname').textContent=name;
    const hdr=res.header||[];
    const opts=(sel)=>hdr.map((hName,j)=>`<option value="${j}"${sel===j?' selected':''}>${(String(hName)||('Colonne '+(j+1))).slice(0,40)}</option>`).join('');
    const guess=res.ci||{};
    document.getElementById('ccmeta').innerHTML=`Ton fichier a été lu, mais les colonnes n'ont pas été reconnues automatiquement. Indique où sont le <b>produit</b> et la <b>valeur (CA/ventes)</b> :
      <div style="display:grid;gap:8px;margin-top:10px;max-width:420px">
        <label style="font-size:12.5px">Colonne « produit / référence »<br><select id="map_prod" style="width:100%;padding:7px;border:1.5px solid var(--line);border-radius:8px;font:inherit;margin-top:3px">${opts(guess.product>=0?guess.product:(guess.ean>=0?guess.ean:0))}</select></label>
        <label style="font-size:12.5px">Colonne « valeur / CA / ventes »<br><select id="map_val" style="width:100%;padding:7px;border:1.5px solid var(--line);border-radius:8px;font:inherit;margin-top:3px">${opts(guess.value>=0?guess.value:1)}</select></label>
        <label style="font-size:12.5px">Colonne « famille » (optionnel — sinon déduite)<br><select id="map_fam" style="width:100%;padding:7px;border:1.5px solid var(--line);border-radius:8px;font:inherit;margin-top:3px"><option value="-1">— déduire automatiquement —</option>${opts(guess.family>=0?guess.family:-2)}</select></label>
      </div>`;
    const btn=cc.querySelector('button.btn'); btn.style.display=''; btn.textContent="Valider le mapping →"; btn.setAttribute('onclick','applyManualMap()');
    window.MANUAL={aoa:res.aoa,name};
    return;
  }
  if(!rows){
    document.getElementById('ccname').textContent="Format non reconnu";
    document.getElementById('ccmeta').innerHTML=`<span style="color:var(--red)">${error||"Vérifiez le fichier."}</span>`;
    cc.querySelector('.cc-badge').textContent="À corriger";
    cc.querySelector('button.btn').style.display='none';
    return;
  }
  cc.querySelector('.cc-badge').textContent="Catégorie détectée";
  const btn=cc.querySelector('button.btn'); btn.style.display=''; btn.textContent="Confirmer et poursuivre →"; btn.setAttribute('onclick','confirmCategory()');
  window.PENDING={rows,name,res};
  const cols={beard:"#C77F1E",hair:"#0E8F8A",innov:"#6B4E8E",comp:"#8A94A0",mdd:"#3D4B5F"};
  const byFam={}; rows.forEach(r=>byFam[r.cls]=(byFam[r.cls]||0)+1);
  document.getElementById('ccname').textContent=name;
  const mp=res&&res.mapping; const note=mp&&mp.aggregated?` (agrégées et annualisées depuis un export détaillé)`:``;
  const nAgg=(res&&res.nAgg)||0, nNoVal=(res&&res.nNoVal)||0, scl=(res&&res.scaleLabel)||'';
  document.getElementById('ccmeta').innerHTML=`<b>${rows.length} références</b> lues${note}.`+
    (nAgg?` <span style="color:var(--mut)">— ${nAgg} ligne(s) d'agrégat (Total / Catégorie) écartée(s) pour éviter le double-compte.</span>`:``)+
    (nNoVal?` <span style="color:var(--amber)">— ${nNoVal} référence(s) sans montant lisible.</span>`:``)+
    (scl?`<br><span style="color:var(--mut);font-size:11px">Traitement des montants : ${scl}.</span>`:``);
  document.getElementById('ccfams').innerHTML=Object.entries(byFam).map(([c,n])=>`<span class="cc-fam" style="background:${cols[c]}">${Object.values(FAMILIES).find(ff=>ff.cls===c).label} · ${n}</span>`).join('');
  // --- ARBITRAGE CATÉGORIEL : un plan de rayon = UNE catégorie ---
  const catAlert=(res&&res.catAlert)||null, material=(res&&res.material)||[], catMix=(res&&res.catMix)||[];
  const arb=document.getElementById('ccarbitrage')||(()=>{const dd=document.createElement('div');dd.id='ccarbitrage';document.getElementById('ccfams').after(dd);return dd;})();
  const _btn=cc.querySelector('button.btn');
  if(catAlert){
    const isUniv=(catAlert==='univers');
    const opts=material.map(c=>`<option value="${c.cat}">${c.label} — ${c.refs} réf. · ${c.pct.toFixed(0)}% de la valeur</option>`).join('');
    arb.innerHTML=`<div class="catalert ${isUniv?'block':'warn'}">
      <div class="ca-h">${isUniv?'⛔ Univers incompatibles dans le même fichier':'⚠️ Plusieurs catégories détectées'}</div>
      <p>${isUniv
        ? `Ce fichier mélange <b>${[...new Set(material.map(c=>c.univ))].join(' et ')}</b>. Un plan de rayon ne peut pas mêler des univers distincts (implantation, meuble et logique d'achat différents). <b>Choisis la catégorie à traiter</b> pour continuer.`
        : `Ce fichier contient <b>${material.length} catégories</b> qui ne s'implantent pas dans le même meuble. Confirme celle sur laquelle construire le plan.`}</p>
      <div class="ca-list">${catMix.slice(0,6).map(c=>`<span class="ca-chip${material.find(m=>m.cat===c.cat)?' on':''}">${c.label} · ${c.pct.toFixed(0)}%</span>`).join('')}</div>
      <label class="ca-lbl">Catégorie à traiter :
        <select id="catPick"><option value="">— sélectionner —</option>${opts}${isUniv?'':'<option value="__all">Tout conserver (déconseillé)</option>'}</select>
      </label>
      <p class="ca-note">Les références non classées seront rattachées à la catégorie dominante.</p></div>`;
    if(isUniv && _btn){ _btn.disabled=true; _btn.style.opacity=.5; _btn.style.cursor='not-allowed'; }
    const sel=document.getElementById('catPick');
    if(sel) sel.addEventListener('change',()=>{ if(_btn){ const ok=!!sel.value; _btn.disabled=isUniv&&!ok; _btn.style.opacity=(isUniv&&!ok)?.5:1; _btn.style.cursor=(isUniv&&!ok)?'not-allowed':'pointer'; } });
  } else { arb.innerHTML=''; if(_btn){ _btn.disabled=false; _btn.style.opacity=1; _btn.style.cursor='pointer'; } }
  // --- validation marque + nouveautés (si marques détectées) ---
  const brands=(res&&res.brands)||[]; const nNew=(res&&res.nNew)||rows.filter(r=>r.nw).length;
  if(brands.length>1){
    const box=document.getElementById('ccvalidate')||(()=>{const dd=document.createElement('div');dd.id='ccvalidate';document.getElementById('ccfams').after(dd);return dd;})();
    box.innerHTML=`<div style="margin-top:14px;border-top:1px solid var(--acc);padding-top:12px">
      <div style="font-size:12.5px;margin-bottom:8px"><b>Ta marque</b> — les autres deviennent <b>concurrents</b> sur le plan (couleur dédiée) :
        <select id="clientBrand" style="margin-top:6px;width:100%;max-width:340px;padding:7px;border:1.5px solid var(--line);border-radius:8px;font:inherit">
          <option value="">— toutes traitées comme mon offre —</option>
          ${brands.map(b=>`<option value="${b.replace(/"/g,'&quot;')}">${b}</option>`).join('')}
        </select></div>
      <div style="font-size:12.5px;color:var(--ink2)"><b>${nNew}</b> nouveauté(s) détectée(s) <span style="color:var(--mut)">(présentes cette année, absentes l'an dernier)</span> — mises en avant sur le plan (badge NEW, zone découverte).
        <label style="display:flex;align-items:center;gap:6px;margin-top:6px;cursor:pointer"><input type="checkbox" id="flagNew" checked style="accent-color:var(--acc)"> Signaler les nouveautés</label></div>
    </div>`;
  } else { const b=document.getElementById('ccvalidate'); if(b)b.innerHTML=''; }
}
/* re-ingestion avec mapping manuel */
function applyManualMap(){
  if(!window.MANUAL) return;
  const p=+document.getElementById('map_prod').value, v=+document.getElementById('map_val').value, fm=+document.getElementById('map_fam').value;
  const override={product:p,value:v,family:fm>=0?fm:-1,ean:-1,brand:-1,manuf:-1,units:-1,vmh:-1,dist:-1,price:-1,marge:-1,pdm:-1,growth:-1,innov:-1,valueYA:-1};
  const res=smartIngest(window.MANUAL.aoa, override);
  if(res.ok){ showConfirm(res.rows, window.MANUAL.name, null, res); }
  else { document.getElementById('ccmeta').innerHTML=`<span style="color:var(--red)">${res.error||"Mapping insuffisant."}</span>`; }
}
function confirmCategory(){
  if(!window.PENDING) return;
  let rows=window.PENDING.rows.map(r=>({...r}));
  /* UNE catégorie par plan (règle d'or) : si le fichier mélange plusieurs catégories et
     qu'une a été choisie, on ne garde QUE celle-là (+ les réfs non classées, absorbées).
     Sans ce filtre, un fichier « coloration + shampooing » produisait un plan incohérent. */
  const cp=document.getElementById('catPick'); const pickCat=cp?cp.value:'';
  if(pickCat && pickCat!=='__all'){ rows=rows.filter(r=>r.cat===pickCat || !r.cat); }
  const cb=document.getElementById('clientBrand'); const client=cb?cb.value:'';
  const flagNew=document.getElementById('flagNew'); const keepNew=flagNew?flagNew.checked:true;
  if(client){ rows.forEach(r=>{ if(r.brand && r.brand!==client){ r.cls='comp'; r.br='conc'; } }); }
  if(!keepNew) rows.forEach(r=>r.nw=0);
  rebuildCatalog(rows, window.PENDING.name);
  /* le bandeau « démo fictives » n'a plus lieu d'être dès qu'un vrai fichier est chargé :
     on bascule sur les vraies données (nom du fichier + enseigne lue). */
  window.REALDATA=true;
  const mk=(window.PENDING.res&&window.PENDING.res.market)||null;
  const pl=document.getElementById('periodlabel'); if(pl) pl.textContent=(window.PENDING.name||'Fichier importé')+(mk?' · '+mk:'');
  const bd=document.getElementById('demobadge'); if(bd){ bd.textContent='VOS DONNÉES'; bd.style.background='#E8F0FF'; bd.style.color='#2E6BFF'; bd.style.borderColor='#2E6BFF'; }
  document.getElementById('catconfirm').style.display='none';
  go(1);
}
function resetUpload(){
  window.PENDING=null;
  document.getElementById('catconfirm').style.display='none';
  document.getElementById('aiwork').style.display='none';
  document.getElementById('droplabel').classList.remove('arm');
  document.getElementById('rawfile').value='';
}
function loadDemo(){ /* restaure la démo fictive d'origine */
  if(window.DEMO_EANS){ EANS.length=0; window.DEMO_EANS.forEach(e=>EANS.push({...e})); for(const k in SHORT)delete SHORT[k]; Object.assign(SHORT,window.DEMO_SHORT); window.PACKS={}; if(typeof renderPackGrid==='function')renderPackGrid(); }
  window.ACTIVECAT="Coloration Homme (démo)";
  go(1);
}
/* révéler la zone packs sur le plan */
function togglePackReveal(){
  const z=document.getElementById('packzone');
  const open=z.style.display==='none';
  z.style.display=open?'block':'none';
  document.getElementById('packrevealbtn').innerHTML= open
    ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg> Masquer les packs'
    : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/></svg> Afficher les vrais packs';
  if(open && typeof renderPackGrid==='function') renderPackGrid();
}

/* ============ PACKS PRODUITS RÉELS (Option A : nom de fichier = code réf) ============ */
window.PACKS={}; /* id -> dataURL */
function normName(fn){ return fn.replace(/\.[a-z0-9]+$/i,'').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function matchRef(base){
  /* 1) code exact (bcf, gxs...) 2) inclut le code 3) EAN si un jour fourni */
  let e=EANS.find(x=>x.id===base); if(e) return e.id;
  e=EANS.find(x=>base.includes(x.id)); if(e) return e.id;
  e=EANS.find(x=>base.includes(normName(SHORT[x.id]).replace(/[^a-z0-9]/g,''))); if(e) return e.id;
  return null;
}
document.getElementById('packfiles').addEventListener('change',e=>{
  const files=[...e.target.files]; if(!files.length) return;
  let done=0;
  files.forEach(file=>{
    const id=matchRef(normName(file.name));
    const rd=new FileReader();
    rd.onload=()=>{ if(id) window.PACKS[id]=rd.result; if(++done===files.length){ renderPackGrid(); if(window.lastPlan) generate(); } };
    rd.onerror=()=>{ if(++done===files.length){ renderPackGrid(); if(window.lastPlan) generate(); } };
    rd.readAsDataURL(file);
  });
});
document.getElementById('usepacks').addEventListener('change',()=>{ if(window.lastPlan) generate(); });
function packsOn(){ const c=document.getElementById('usepacks'); return c?c.checked:false; }
function renderPackGrid(){
  const g=document.getElementById('packgrid'); if(!g) return;
  const colors={beard:"#C77F1E",hair:"#0E8F8A",innov:"#6B4E8E",comp:"#8A94A0",mdd:"#3D4B5F"};
  const matched=Object.keys(window.PACKS).length;
  g.innerHTML=EANS.map(e=>{
    const has=window.PACKS[e.id];
    const thumb=has?`<img class="thumb" src="${has}" alt="${e.n}">`:`<div class="ph" style="background:${colors[e.cls]}">${SHORT[e.id]}</div>`;
    return `<div class="pack-cell"><span class="st ${has?'ok':'miss'}">${has?'✓':'·'}</span>${thumb}<div class="cn">${e.id}</div></div>`;
  }).join('');
  const zone=document.getElementById('packzone'); if(zone) zone.classList.toggle('arm',matched>0);
}
function downloadCodes(){
  const rows=[["code_fichier","reference","segment"]].concat(EANS.map(e=>[e.id,e.n,e.seg]));
  const csv=rows.map(r=>r.map(x=>/[",;]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="catpilot_codes_packs.csv"; a.click();
}


/* ============ IMPORT LISTE PERSONNALISÉE (palette de familles) ============ */
const FAMILIES={
  "barbe":{cls:"beard",label:"Barbe"},
  "cheveux":{cls:"hair",label:"Cheveux"},
  "innovation":{cls:"innov",label:"Innovation"},
  "concurrent":{cls:"comp",label:"Concurrent"},
  "mdd":{cls:"mdd",label:"MDD"}
};
const BRANDMAP={beard:"client",hair:"client",innov:"client",comp:"conc",mdd:"mdd"};
function famToCls(v){
  const n=(v||'').toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(FAMILIES[n]) return FAMILIES[n].cls;
  if(/barbe|beard/.test(n))return"beard"; if(/cheveu|hair/.test(n))return"hair";
  if(/innov|nouveau|new/.test(n))return"innov"; if(/concur|comp|rival/.test(n))return"comp";
  if(/mdd|distrib|private/.test(n))return"mdd";
  return"beard";
}
function downloadTemplate(){
  const head=["code","reference","famille","segment","prix","ca_mat_keur","vmh","marge_pct","pdm_pct","croissance_pct","innovation_new"];
  const ex=[
    ["ref01","Ma réf phare","Barbe","Segment A","10.90","8900","3.9","32","19.3","9.5","0"],
    ["ref02","Deuxième réf","Barbe","Segment A","10.90","5450","2.4","32","11.8","8.2","0"],
    ["ref03","Réf cheveux","Cheveux","Segment B","9.60","4150","1.9","30","9.0","2.4","0"],
    ["ref04","Nouveauté","Innovation","Segment C","12.40","2500","1.1","35","5.4","19.0","1"],
    ["ref05","Concurrent clé","Concurrent","Segment B","8.90","3600","1.7","27","7.8","-1.2","0"],
    ["ref06","MDD enseigne","MDD","Segment B","5.90","1950","1.4","41","4.2","3.1","0"]
  ];
  const csv=[head].concat(ex).map(r=>r.map(x=>/[",;\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="catpilot_modele_references.csv"; a.click();
}
function splitLine(line,sep){ /* gère les guillemets */
  const out=[]; let cur='',q=false;
  for(let i=0;i<line.length;i++){const c=line[i];
    if(c==='"'){ if(q&&line[i+1]==='"'){cur+='"';i++;} else q=!q; }
    else if(c===sep&&!q){ out.push(cur);cur=''; } else cur+=c; }
  out.push(cur); return out.map(x=>x.trim());
}
function num(v){ const x=parseFloat((v||'').toString().replace(',','.').replace(/[^0-9.\-]/g,'')); return isFinite(x)?x:0; }

/* ============ INGESTEUR UNIVERSEL (Nielsen/Circana/CSV) ============ */
/* Dictionnaire multi-langue (FR / EN / NL) : le robot reconnaît un export quel que
   soit le pays. Validé sur 4 vrais fichiers Nielsen (France, Benelux, Nordics).
   NB : 'item' est traité en mot entier (voir matchCol) pour ne PAS confondre une
   colonne produit avec « Price per Sales (ITEMS) ». */
const COLSYN={
  product:['reference','référence','item','produit','product','libelle','libellé','description','article','designation','désignation','sku','artikel','omschrijving'],
  brand:['brand','marque','merk'],
  manuf:['manufacturer','fabricant','fournisseur','supplier','leverancier'],
  ean:['upc','ean','gencod','code','barcode','gtin','streepjescode'],
  family:['famille','family','segment','groep','category','catégorie','categorie','sous type','sous-type','group','ndh'],
  value:['sales value','ventes valeur','ca_mat','chiffre','turnover','revenue','valeur','ca','waarde','omzet'],
  units:['sales units','ventes unite','ventes unité','volume','units','unites','unités','quantite','quantité','eenheden','stuks'],
  vmh:['vmh','rotation','ros value','rate of sale'],
  dist:['numeric distribution','distribution','distrib','tdp','distributie'],
  price:['price per sales unit','prix','price','prijs'],
  marge:['marge','margin'],
  pdm:['pdm','part de marche','part de marché','market share','share','marktaandeel'],
  growth:['croissance','growth','evolution','évolution','var '],
  innov:['innovation','nouveaute','nouveauté',' new','innov'],
  period:['periods','période','periode','semaine',' sem','week','date','mois','temps','rolling','ytd'],
  marche:['geographies','geography','markets','marche','marché','enseigne','circuit','retailer','distributeur','geografie']
};
/* Les exports FR sont souvent en ISO-8859-1 : lu en UTF-8, "Libellé" devient illisible
   et la colonne produit n'est plus reconnue. On détecte et on relit dans le bon encodage. */
function decodeSmart(buf){
  let t;
  try{ t=new TextDecoder('utf-8',{fatal:false}).decode(buf); }catch(e){ t=''; }
  if(t.indexOf('\uFFFD')>=0){ try{ const t2=new TextDecoder('iso-8859-1').decode(buf); if(t2 && t2.indexOf('\uFFFD')<0) return t2; }catch(e){} }
  return t;
}
function normHdr(s){ return String(s||'').replace(/\u00a0/g,' ').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function matchCol(hdr,keys,excludeYA){
  const short=new Set(['ca','dn','dv','pdm','vmh','item']); // tokens courts → frontière de mot (ex. « item » ≠ « ITEMS » dans « Price per Sales (ITEMS) »)
  for(let j=0;j<hdr.length;j++){
    const h=normHdr(hdr[j]);
    if(!h) continue;
    /* RÈGLE D'OR : pour une métrique de base (ventes valeur/unité, prix…), on ne prend
       JAMAIS une variante année précédente (YA), promo, % d'évolution ou cumul (YTD).
       On veut la colonne « de base » (période courante, total). */
    if(excludeYA && /(\bya\b|promo|chg|ytd|\bindex\b|%)/.test(h)) continue;
    const damaged=h.indexOf('\uFFFD')>=0;
    const hClean=h.replace(/\uFFFD+/g,'');
    const hit=keys.some(k=>{
      const kk=normHdr(k);
      if(short.has(kk)) return new RegExp('(^|[^a-z])'+kk+'([^a-z]|$)').test(h);
      if(h.includes(kk)) return true;
      /* en-tête abîmé par l'encodage : on accepte le préfixe (≥5 car.) */
      return damaged && hClean.length>=5 && kk.startsWith(hClean);
    });
    if(hit) return j;
  }
  return -1;
}
function numFR(v){ if(v==null||v==='')return null; let s=String(v).trim().replace(/\s/g,''); let mult=1; const sfx=s.match(/([kKmM])\s*€?$/); if(sfx){ mult=(sfx[1].toLowerCase()==='k')?1e3:1e6; } s=s.replace(/[€$£%]/g,''); if(s.indexOf(',')>-1 && s.indexOf('.')>-1){ s=s.replace(/\./g,'').replace(',','.'); } else { s=s.replace(',','.'); } const x=parseFloat(s.replace(/[^0-9.\-eE]/g,'')); return isFinite(x)?x*mult:null; }
/* ===== Taxonomie retail : univers (rayon macro) + catégorie fine =====
   Sert à détecter les fichiers multi-catégories : on ne peut pas construire
   UN plan de rayon cohérent en mêlant Food et DPH, ni coloration et rasage. */
const CATTAXO=[
  {univ:'DPH',       cat:'sexual_wellness', label:'Sexual wellness',      re:/pr[ée]servatif|condom|durex|lubrifiant|intimate gel/i},
  {univ:'DPH',       cat:'hygiene_intime',  label:'Hygiène intime',       re:/vagisil|hygi[èe]ne intime|soin intime|protection f[ée]minine|serviette hygi|tampon(s)?\b|proteges?[- ]slip/i},
  {univ:'DPH',       cat:'bebe',            label:'Bébé',                 re:/couche(s)? b[ée]b|b[ée]b[ée]|lingette b[ée]b|pampers|liniment/i},
  {univ:'DPH',       cat:'bucco',           label:'Hygiène bucco-dentaire',re:/dentifrice|brosse [àa] dents|bain de bouche|dentaire|toothpaste|mouthwash|fil dentaire/i},
  {univ:'DPH',       cat:'rasage',          label:'Rasage',               re:/rasage|rasoir|razor|shav(e|ing)|lame(s)? (de rasoir|x\d)|apr[èe]s[- ]rasage|after[- ]?shave|mousse [àa] raser|gel [àa] raser/i},
  {univ:'DPH',       cat:'depilatoire',     label:'Dépilatoire',          re:/d[ée]pilatoire|[ée]pilation|cire (froide|ti[èe]de)|hair removal/i},
  {univ:'DPH',       cat:'coloration_homme',label:'Coloration homme',     re:/(colorat|teintur|colou?r|anti[- ]gris|grey|gris)[^|]{0,40}(homme|men|barbe|beard|moustache)|(homme|men|barbe|beard|moustache)[^|]{0,40}(colorat|teintur|colou?r|anti[- ]gris|grey)|just for men|men perfect|barbe|beard|moustache|goatee/i},
  {univ:'DPH',       cat:'coloration_femme',label:'Coloration',           re:/colorat|teintur|colou?rant|nuance|hair colou?r|haarkleur|haarverf|balayage|d[ée]coloration/i},
  {univ:'DPH',       cat:'capillaire',      label:'Capillaire',           re:/shampo(o)?ing|shampoo|apr[èe]s[- ]shampo|conditioner|laque|gel coiffant|cire coiffante|masque cheveux|soin cheveux/i},
  {univ:'DPH',       cat:'deo',             label:'Déodorant',            re:/d[ée]odorant|deo\b|anti[- ]transpirant|antiperspirant/i},
  {univ:'DPH',       cat:'douche',          label:'Douche & bain',        re:/gel douche|shower|savon|bain moussant|douche cr[èe]me|body wash/i},
  {univ:'DPH',       cat:'soin_visage',     label:'Soin visage',          re:/cr[èe]me visage|soin visage|anti[- ][âa]ge|hydratant visage|s[ée]rum visage|contour des yeux/i},
  {univ:'FOOD',      cat:'epicerie_sucree', label:'Épicerie sucrée',      re:/biscuit|chocolat|c[ée]r[ée]ale|confiture|miel\b|bonbon|g[âa]teau|p[âa]te [àa] tartiner|sucre\b/i},
  {univ:'FOOD',      cat:'epicerie_salee',  label:'Épicerie salée',       re:/p[âa]tes\b|riz\b|conserve|sauce tomate|huile (d.olive|de tournesol)|soupe|chips|ap[ée]ritif|moutarde|vinaigre/i},
  {univ:'FOOD',      cat:'boissons',        label:'Boissons',             re:/jus de|soda|cola\b|eau min[ée]rale|bi[èe]re|vin (rouge|blanc|ros)|sirop|limonade|caf[ée]\b|th[ée] (vert|noir)/i},
  {univ:'FOOD',      cat:'frais',           label:'Produits frais',       re:/yaourt|fromage|lait\b|beurre|cr[èe]me fra[îi]che|jambon|saucisson|oeufs?\b|yogourt/i},
  {univ:'FOOD',      cat:'surgele',         label:'Surgelés',             re:/surgel[ée]|glace(s)? (vanille|chocolat)|pizza surgel|b[âa]tonnet glac/i},
  {univ:'ENTRETIEN', cat:'lessive',         label:'Lessive & soin du linge',re:/lessive|adoucissant|d[ée]tachant|assouplissant/i},
  {univ:'ENTRETIEN', cat:'nettoyants',      label:'Entretien maison',     re:/nettoyant|javel|liquide vaisselle|d[ée]sodorisant|[ée]ponge|sac poubelle|multi[- ]surfaces|d[ée]tergent/i}
];
function inferCategory(item,brand,manuf,famcol){
  // séparateurs normalisés : « JUST_FOR_MEN » / « hair-colour » doivent matcher comme du texte
  const t=(String(item||'')+' '+String(brand||'')+' '+String(manuf||'')+' '+String(famcol||'')).replace(/[_./]+/g,' ');
  for(const c of CATTAXO){ if(c.re.test(t)) return c; }
  return null; /* non classé : sera absorbé par la catégorie dominante */
}
function inferFamily(item,brand,manuf){
  const t=(String(item)+' '+String(brand)+' '+String(manuf)).toLowerCase();
  if(/facial|beard|barbe|moustache|goatee|tache/.test(t)) return 'beard';
  if(/mdd|private label|marque distributeur|eigen merk|hausmarke/.test(t)) return 'mdd';
  return 'hair';
}
/* Détecte la VRAIE ligne d'en-tête. On ne prend pas la ligne la plus remplie : dans
   les exports Benelux, une ligne de périodes répétées (« YTD 26 … » × 160 colonnes)
   serait la plus remplie mais ne décrit qu'UN seul type de champ. On retient donc la
   ligne qui reconnaît le plus de champs DIFFÉRENTS (produit, marque, valeur, …),
   départagée par le nombre de cellules remplies (plafonné). Validé France/Benelux/Nordics. */
function detectHeader(aoa){
  let best=0,bestScore=-1;
  const fields=Object.keys(COLSYN);
  for(let i=0;i<Math.min(20,aoa.length);i++){
    const row=aoa[i]||[];
    let distinct=0;
    for(const f of fields){ const ex=(f==='value'||f==='units'); if(matchCol(row,COLSYN[f],ex)>=0) distinct++; }
    let strcells=0; for(const c of row){ if(normHdr(c)) strcells++; }
    const score=distinct*10+Math.min(strcells,8);
    if(score>bestScore){bestScore=score;best=i;}
  }
  return {row:best,score:bestScore};
}
/* ingestion universelle : aoa (matrice) -> { ok, rows, mapping, error, needManual, header, aoa } */
function smartIngest(aoa, override){
  if(!aoa||!aoa.length) return {ok:false,error:"Fichier vide."};
  const hd=detectHeader(aoa); const H=hd.row; const hdr=aoa[H]||[];
  const ci=Object.assign({product:-1,brand:-1,manuf:-1,ean:-1,family:-1,value:-1,units:-1,vmh:-1,dist:-1,price:-1,marge:-1,pdm:-1,growth:-1,innov:-1,period:-1,marche:-1,valueYA:-1}, override||{
    product:matchCol(hdr,COLSYN.product), brand:matchCol(hdr,COLSYN.brand), manuf:matchCol(hdr,COLSYN.manuf),
    ean:matchCol(hdr,COLSYN.ean), family:matchCol(hdr,COLSYN.family),
    value:matchCol(hdr,COLSYN.value,true), units:matchCol(hdr,COLSYN.units,true), vmh:matchCol(hdr,COLSYN.vmh),
    dist:matchCol(hdr,COLSYN.dist,true), price:matchCol(hdr,COLSYN.price,true),
    marge:matchCol(hdr,COLSYN.marge), pdm:matchCol(hdr,COLSYN.pdm), growth:matchCol(hdr,COLSYN.growth,true),
    innov:matchCol(hdr,COLSYN.innov), period:matchCol(hdr,COLSYN.period), marche:matchCol(hdr,COLSYN.marche),
    valueYA:matchCol(hdr,['sales value ya','valeur ya','ca ya'])
  });
  // clé produit : reference/item sinon ean
  const keyCol = ci.product>=0?ci.product:(ci.ean>=0?ci.ean:-1);
  const valCol = ci.value>=0?ci.value:(ci.vmh>=0?ci.vmh:-1);
  if(keyCol<0 || valCol<0){
    return {ok:false,needManual:true,header:hdr,aoa:aoa,H:H,error:"Colonnes non reconnues automatiquement — indiquez le produit et la valeur.",ci};
  }
  const eanOK=(row)=>{ if(ci.ean<0) return true; const ev=String(row[ci.ean]==null?'':row[ci.ean]).replace(/\s/g,''); return /^\d{8,14}$/.test(ev); };
  /* ---- EX13 — UNE SEULE GÉOGRAPHIE ----
     Un export panel empile souvent plusieurs enseignes/géographies (Total HYPERS+SUPERS,
     Hypers, Supers, chaque distributeur…). Les additionner double-compte (le total EST déjà
     la somme de ses composants). Convention CatPilot : on retient UNE géographie, la plus
     grosse en valeur (« enseigne par défaut = la plus grosse »), et on écarte les autres. */
  const marCol = ci.marche>=0 ? ci.marche : -1;
  let chosenMarket=null, nMarkets=0;
  if(marCol>=0){
    const mt={};
    for(let r=H+1;r<aoa.length;r++){
      const row=aoa[r]||[]; const rk=row[keyCol];
      if(rk==null||String(rk).trim()===''||!eanOK(row)) continue;
      const mv=String(row[marCol]==null?'':row[marCol]).trim(); if(!mv) continue;
      mt[mv]=(mt[mv]||0)+(numFR(row[valCol])||0);
    }
    const names=Object.keys(mt); nMarkets=names.length;
    // garde-fou : ne filtrer que si la colonne est bien une géographie (libellés texte),
    // jamais une colonne numérique (ex. « market share ») captée par erreur.
    const textLike=names.filter(n=>!/^-?[\d .,%]+$/.test(n)).length;
    if(nMarkets>1 && textLike>=names.length*0.6){
      chosenMarket=names.reduce((a,b)=> mt[b]>mt[a]?b:a, names[0]);
    }
  }
  // agrégation par clé produit
  const agg={}; const perSet=new Set(); let nAgg=0, nGeo=0;
  for(let r=H+1;r<aoa.length;r++){
    const row=aoa[r]||[]; const rawKey=row[keyCol];
    if(rawKey==null||String(rawKey).trim()==='') continue;
    /* EX13 — ANTI-DOUBLE-COMPTE par l'EAN : si le fichier a une colonne EAN, une vraie
       référence porte un code à 8–14 chiffres. Les lignes agrégées (« COLORATION HOMME »,
       sous-totaux de segment…) n'en ont pas → on les écarte, sinon on compterait le total
       ET ses composants. Fichier à plat France validé : seuls les SKU à EAN valide restent. */
    if(!eanOK(row)){ nAgg++; continue; }
    // une seule géographie retenue (voir EX13 ci-dessus)
    if(chosenMarket!=null && String(row[marCol]==null?'':row[marCol]).trim()!==chosenMarket){ nGeo++; continue; }
    // ignorer les lignes de total/sous-total (Circana : "Total ...", ou hiérarchie catégorie)
    /* ANTI-DOUBLE-COMPTE : écarter toute ligne d'agrégat (total, sous-total, ligne
       CATEGORY d'un export Circana/NielsenIQ, "toutes marques", "marché"…).
       Additionner un agrégat avec ses composants doublerait la valeur du marché. */
    const ks=String(rawKey).trim();
    if(/^(total|ttl|sous[- ]?total|cumul|ensemble|toutes? marques?|all brands?|categor(y|ie|ies)|cat[ée]gorie|march[ée]|market( total)?|grand total|segment total|tous (les )?(produits|segments))\b/i.test(ks)
       || /^(total|categor(y|ie)|march[ée]|ensemble)$/i.test(ks)){ nAgg++; continue; }
    const key=ks.toLowerCase();
    if(!agg[key]) agg[key]={name:ks, brand:ci.brand>=0?String(row[ci.brand]||''):'', manuf:ci.manuf>=0?String(row[ci.manuf]||''):'',
      ean:ci.ean>=0?String(row[ci.ean]||''):'', fam:ci.family>=0?String(row[ci.family]||''):'',
      val:0,units:0,dist:[],price:[],valYA:0,marge:[],pdm:[],growth:[],nw:0,n:0};
    const a=agg[key]; a.n++;
    if(ci.period>=0 && row[ci.period]!=null && String(row[ci.period]).trim()) perSet.add(String(row[ci.period]).trim());
    const v=numFR(row[valCol]); if(v!=null)a.val+=v;
    if(ci.units>=0){const u=numFR(row[ci.units]); if(u!=null)a.units+=u;}
    if(ci.dist>=0){const dd=numFR(row[ci.dist]); if(dd!=null)a.dist.push(dd);}
    if(ci.price>=0){const p=numFR(row[ci.price]); if(p!=null)a.price.push(p);}
    if(ci.valueYA>=0){const vy=numFR(row[ci.valueYA]); if(vy!=null)a.valYA+=vy;}
    if(ci.marge>=0){const m=numFR(row[ci.marge]); if(m!=null)a.marge.push(m);}
    if(ci.pdm>=0){const pm=numFR(row[ci.pdm]); if(pm!=null)a.pdm.push(pm);}
    if(ci.growth>=0){const g=numFR(row[ci.growth]); if(g!=null)a.growth.push(g);}
    if(ci.innov>=0 && /^(1|oui|yes|true|x)$/i.test(String(row[ci.innov]||'').trim())) a.nw=1;
  }
  const keys=Object.keys(agg);
  if(!keys.length) return {ok:false,error:"Aucune ligne produit exploitable."};
  const nPer=perSet.size||1;
  /* ÉCHELLE : décidée UNE SEULE FOIS pour tout le fichier, jamais ligne à ligne
     (sinon deux unités cohabitent dans la même colonne → chiffre indéfendable).
     Critère robuste = médiane des valeurs agrégées, insensible aux montants aberrants. */
  const _v=keys.map(k=>agg[k].val).filter(x=>x>0).sort((a,b)=>a-b);
  const _med=_v.length? _v[Math.floor(_v.length/2)] : 0;
  const _annual=(ci.period>=0 && nPer>13);
  /* seuil métier : une référence dépassant ~20 000 en médiane est libellée en euros,
     pas en k€ (20 M€ de CA annuel pour UNE référence est hors norme en PGC). */
  const _div=_annual? null : (_med>=20000 ? 1000 : 1);
  const _scaleLabel=_annual? `annualisé sur ${nPer} périodes puis converti en k€`
                    : (_div===1000? 'converti en k€ (valeurs lues en euros)' : 'valeurs reprises telles quelles');
  const scaleK=(v)=> _annual ? (v*13/nPer/1000) : (v/_div);
  const totalVal=keys.reduce((s,k)=>s+agg[k].val,0)||1;
  const mean=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;
  const rows=[]; const seenId={}; let auto=0;
  for(const k of keys){
    const a=agg[k];
    let id=(a.ean||a.name).toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,'').slice(0,16)||('ref'+(++auto));
    while(seenId[id]) id=id+(++auto); seenId[id]=1;
    // famille : colonne si présente, sinon inférée
    let cls;
    if(a.fam){ cls=famToCls(a.fam); } else { cls=inferFamily(a.name,a.brand,a.manuf); }
    const price = a.price.length?a.price[a.price.length-1] : (a.units? a.val/a.units : 10);
    const vmh = ci.vmh>=0 ? (a.val/Math.max(1,a.n)) : (a.units? a.units/Math.max(1,a.n)/4 : 1); // proxy rotation
    const pdm = a.pdm.length? mean(a.pdm) : (a.val/totalVal*100);
    const marge = a.marge.length? mean(a.marge) : 30;
    let growth = a.growth.length? mean(a.growth) : (a.valYA? (a.val-a.valYA)/a.valYA*100 : 0);
    growth=Math.max(-60,Math.min(60,growth)); // borne les croissances panel extrêmes
    // nouveauté : présente cette année, absente l'an dernier (colonne YA connue)
    const isNew = (ci.valueYA>=0 && (a.valYA==null||a.valYA<=0.001) && a.val>0) ? 1 : a.nw;
    const caK=Math.round(scaleK(a.val)*10)/10;
    const _c=inferCategory(a.name,a.brand,a.manuf,a.fam);
    rows.push({id, n:a.name, brand:a.brand||'', cat:_c?_c.cat:null, univ:_c?_c.univ:null, catLabel:_c?_c.label:null,
      seg:(a.brand||Object.values(FAMILIES).find(ff=>ff.cls===cls).label),
      cls, br:BRANDMAP[cls], prix:Math.round(price*100)/100, vmh:Math.round(vmh*100)/100,
      ca:caK, mg:Math.round(marge*10)/10, pdm:Math.round(pdm*100)/100,
      gr:Math.round(growth*10)/10, nw:isNew});
  }
  const nNoVal=rows.filter(r=>!(+r.ca>0)).length;
  const realTotal=rows.reduce((s,r)=>s+(+r.ca>0?+r.ca:0),0);
  if(!(realTotal>0) || !rows.some(r=>+r.ca>0)) return {ok:false,error:"Colonne de valeur non exploitable (aucun montant lisible)."};
  const brands=[...new Set(rows.map(r=>r.brand).filter(Boolean))];
  const nNew=rows.filter(r=>r.nw).length;
  /* ---- mix catégoriel : n'entrent en jeu que les catégories POSITIVEMENT identifiées.
     Les références non classées sont absorbées par la dominante (pas de faux signal). ---- */
  const catAgg={};
  rows.forEach(r=>{ if(!r.cat) return; const k=r.cat;
    if(!catAgg[k]) catAgg[k]={cat:k,label:r.catLabel,univ:r.univ,refs:0,val:0};
    catAgg[k].refs++; catAgg[k].val+=(+r.ca>0?+r.ca:0); });
  const catTot=Object.values(catAgg).reduce((s,c)=>s+c.val,0)||1;
  const _rf=rows.filter(r=>r.cat).length||1;
  const catMix=Object.values(catAgg).map(c=>({...c,pct:c.val/catTot*100,pctRefs:c.refs/_rf*100}))
                 .sort((a,b)=>b.val-a.val);
  /* Matérialité : en VALEUR *ou* en ASSORTIMENT. Un critère uniquement en valeur est
     fragile aux montants aberrants (une réf hors norme écrase les autres en %) alors
     qu'un rayon se construit aussi sur le nombre de références. */
  const catRefs=rows.filter(r=>r.cat).length||1;
  const material=catMix.filter(c=> (c.pct>=15 && c.refs>=2) || (c.refs/catRefs*100>=20 && c.refs>=3) );
  const univs=[...new Set(material.map(c=>c.univ))];
  const catAlert = univs.length>1 ? 'univers' : (material.length>1 ? 'categories' : null);
  return {ok:true, rows, brands, nNew, catMix, material, univs, catAlert, nAgg, nGeo, nNoVal, market:chosenMarket, nMarkets, scaleLabel:_scaleLabel, mapping:{header:hdr,ci,headerRow:H,aggregated:keys.length<(aoa.length-H-1),nPer,annualized:_annual,scale:_scaleLabel,market:chosenMarket,nMarkets}};
}

/* parsing délimité réutilisable (CSV/TSV) → { ok, rows, error } */
function parseDelimited(txt){
  txt=String(txt||'').replace(/^\ufeff/,'');
  const lines=txt.split(/\r?\n/).filter(x=>x.trim());
  if(lines.length<2) return {ok:false,error:"Fichier vide ou sans données."};
  const sep=lines[0].includes(';')?';':lines[0].includes('\t')?'\t':',';
  const head=splitLine(lines[0],sep).map(x=>x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""));
  const col=name=>head.findIndex(x=>x===name||x.includes(name));
  const ci={code:col('code'),ref:col('reference'),fam:col('famille'),seg:col('segment'),prix:col('prix'),ca:col('ca'),vmh:col('vmh'),mg:col('marge'),pdm:col('pdm'),gr:col('croissance'),nw:col('innovation')};
  if(ci.ref<0||ci.fam<0) return {ok:false,error:"Colonnes «\u00a0reference\u00a0» et «\u00a0famille\u00a0» requises. Téléchargez le modèle."};
  const rows=[];const seen={};let auto=0;
  for(let k=1;k<lines.length;k++){
    const c=splitLine(lines[k],sep); if(!c[ci.ref]&&!(ci.code>=0&&c[ci.code]))continue;
    let id=(ci.code>=0&&c[ci.code]?c[ci.code]:c[ci.ref]).toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,'').slice(0,16)||('ref'+(++auto));
    while(seen[id]) id=id+(++auto); seen[id]=1;
    const cls=famToCls(c[ci.fam]);
    rows.push({id,n:c[ci.ref]||id,seg:(ci.seg>=0?c[ci.seg]:'')||FAMILIES[Object.keys(FAMILIES).find(kk=>FAMILIES[kk].cls===cls)].label,cls,br:BRANDMAP[cls],
      prix:ci.prix>=0?num(c[ci.prix]):10, vmh:ci.vmh>=0?num(c[ci.vmh]):1, ca:ci.ca>=0?num(c[ci.ca]):1000,
      mg:ci.mg>=0?num(c[ci.mg]):30, pdm:ci.pdm>=0?num(c[ci.pdm]):5, gr:ci.gr>=0?num(c[ci.gr]):0,
      nw:ci.nw>=0&&/^(1|oui|yes|true|x)$/i.test((c[ci.nw]||'').trim())?1:0});
  }
  if(!rows.length) return {ok:false,error:"Aucune ligne exploitable."};
  return {ok:true,rows};
}
function rebuildCatalog(rows, name){
  /* reconstruit l'assortiment moteur (EANS + SHORT) SANS naviguer. name = catégorie active. */
  EANS.length=0;
  rows.forEach(r=>EANS.push({id:r.id,n:r.n,brand:r.brand,seg:r.seg,cls:r.cls,br:r.br,prix:r.prix,vmh:r.vmh,ca:r.ca,mg:r.mg,pdm:r.pdm,gr:r.gr,nw:r.nw}));
  for(const k in SHORT) delete SHORT[k];
  rows.forEach(r=>{ SHORT[r.id]=(r.n.replace(/^[^ ]+ /,'').split(/\s+/).slice(0,2).join(' ')||r.id).slice(0,8); });
  window.PACKS={}; window.ACTIVECAT=name||"Ma catégorie";
  if(typeof renderPackGrid==='function') renderPackGrid();
}
/* ============ ANGLE IA (étape 4) ============ */
function applyAngle(){
  const q=(document.getElementById('angleinput').value||'').trim(); if(!q)return;
  const n=q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  let w={cacm:20,vmh:20,marge:20,pdm:20,gr:20}; const why=[];
  if(/marge|rentab|profit/.test(n)){w.marge+=25;why.push("marge distributeur renforcée");}
  if(/rotation|rupture|vmh|reassort|stock/.test(n)){w.vmh+=25;why.push("rotation prioritaire");}
  if(/\bca\b|valeur|productivite|chiffre/.test(n)){w.cacm+=25;why.push("productivité valeur");}
  if(/marche|pdm|part|leader|represent/.test(n)){w.pdm+=20;why.push("représentativité marché");}
  if(/innov|croissance|nouveaut|futur|demain|tendance/.test(n)){w.gr+=25;why.push("croissance & innovations protégées");}
  const tot=Object.values(w).reduce((a,b)=>a+b,0);
  Object.keys(w).forEach(k=>w[k]=Math.round(w[k]/tot*100));
  const drift=100-Object.values(w).reduce((a,b)=>a+b,0); w.cacm+=drift;
  MARKERS.forEach(m=>m.w=w[m.id]); if(window.syncMk)syncMk();
  const out=document.getElementById('angleout'); out.style.display='block';
  out.innerHTML=`<b>Pondération appliquée</b> — ${why.length?why.join(', '):"lecture équilibrée"} : `+MARKERS.map(m=>`${m.lab.split(' ')[0]} ${m.w}%`).join(' · ')+`. Génère le plan pour voir l&#39;effet — le copilote peut l&#39;expliquer réf par réf.`;
}


/* ============ THÈMES ============ */
/* Sélecteur de design retiré (design acté) — plus de bascule de thème. */
/* ============ OFFRES : billing toggle + licence ============ */
document.querySelectorAll('.billing .bopt').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.billing .bopt').forEach(x=>x.classList.remove('on')); b.classList.add('on');
  const annual=b.dataset.b==='a';
  document.getElementById('proprice').innerHTML=annual?'124 €<small> HT/siège/mois</small>':'149 €<small> HT/siège/mois</small>';
  document.getElementById('prosub').textContent=annual?'facturé 1 490 € HT/siège/an':'sans engagement · par siège';
}));
window.PRO=false;
/* Bascule Démo / Pro en simulation (bouton d'en-tête) : débloque les éléments
   (jusqu'à 5) et la trame de présentation acheteur, puis régénère le plan. */
function setPro(on){
  window.PRO=!!on;
  var badge=document.querySelector('.demo'); var btn=document.getElementById('protoggle');
  if(badge) badge.textContent = on ? 'MODE PRO — SIMULATION BÊTA' : (window.REALDATA ? 'VOS DONNÉES' : 'DONNÉES DÉMO FICTIVES');
  if(btn) btn.textContent = on ? '↩ Revenir en Démo' : '🔓 Passer en Pro (voir la trame)';
  var nh=document.getElementById('nelhint'); if(nh) nh.style.display = on ? 'none' : '';
  if(!on && typeof S==='object' && S.nel>1){ S.nel=1; }
  try{ if(typeof refreshCtl==='function') refreshCtl(); }catch(e){}
  try{ if(window.lastPlan && typeof generate==='function') generate(); }catch(e){}
  /* Pro activé ET un plan existe → amener directement l'utilisateur sur la trame de présentation (étape 7). */
  if(on && (window.lastAlloc || window.lastPlan)){
    try{
      document.querySelectorAll('#topnav a').forEach(function(x){ x.classList.remove('on'); });
      var lk=document.querySelector('#topnav a[data-p="pgen"]'); if(lk) lk.classList.add('on');
      document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('on'); });
      var pg=document.getElementById('pgen'); if(pg) pg.classList.add('on');
      if(typeof relocateResult==='function') relocateResult();
      if(typeof go==='function') go(6);
    }catch(e){}
  }
}
function activateLic(){
  const k=(document.getElementById('lickey').value||'').trim().toUpperCase();
  const out=document.getElementById('licout'); out.style.display='block';
  if(!/^[A-Z0-9]{4}-[A-Z0-9]{3,4}$/.test(k)){ out.innerHTML='<span style="color:var(--red);font-weight:700">Format invalide</span> — attendu XXXX-XXXX.'; return; }
  window.PRO=true;
  document.querySelector('.demo').textContent='LICENCE PRO — SIMULATION BÊTA';
  try{ const nh=document.getElementById('nelhint'); if(nh)nh.style.display='none'; if(typeof refreshCtl==='function')refreshCtl(); if(window.lastPlan && typeof generate==='function')generate(); }catch(e){}
  out.innerHTML='<span style="color:var(--green);font-weight:800">✓ Licence activée (simulation)</span> — en production : upload actif, IA connectée, exports .pptx/.xlsx débloqués.';
}

/* ============ PAGES TOPNAV ============ */
document.getElementById('topnav').addEventListener('click',e=>{
  const a=e.target.closest('a'); if(!a)return;
  document.querySelectorAll('#topnav a').forEach(x=>x.classList.remove('on')); a.classList.add('on');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById(a.dataset.p).classList.add('on');
});
/* ============ CHARTS (Analyses) ============ */
(function(){
  const segs=[{n:"Barbe",v:26.1,g:9.1,c:"#C77F1E"},{n:"Cheveux",v:14.8,g:1.9,c:"#0E8F8A"},{n:"Anti-gris",v:3.6,g:18.7,c:"#6B4E8E"},{n:"1-Day",v:1.7,g:24.3,c:"#8266A8"}];
  const W=470,H=180,max=30;
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
  segs.forEach((x,i)=>{const bw=x.v/max*(W-160),y=14+i*40;
    s+=`<rect x="125" y="${y}" width="${bw}" height="20" rx="5" fill="${x.c}"/>`;
    s+=`<text x="117" y="${y+14}" text-anchor="end" font-size="12" font-weight="700" fill="#0F1B2D">${x.n}</text>`;
    s+=`<text x="${129+bw}" y="${y+9}" font-size="11" font-weight="800" fill="#0F1B2D">${String(x.v).replace('.',',')} M€</text>`;
    s+=`<text x="${129+bw}" y="${y+20}" font-size="10" fill="${x.g>=5?'#1E8E3E':'#7A8699'}">+${String(x.g).replace('.',',')}%</text>`;});
  s+='</svg>'; document.getElementById('segchart').innerHTML=s;
})();
(function(){
  const beard=[106,107,108,108,109,107,108,109,108,110,109,108,109,110,108,109,110,117,120,122,123,121,122,119,112,111];
  const ctrl=[108,109,108,109,110,109,108,109,110,109,108,109,108,109,110,109,108,109,110,108,109,110,109,108,109,110];
  const W=470,H=180,L=36,R=10,T=12,B=24,min=100,max=130;
  const x=i=>L+i*(W-L-R)/25, y=v=>T+(max-v)*(H-T-B)/(max-min);
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
  s+=`<rect x="${x(17)}" y="${T}" width="${x(23)-x(17)}" height="${H-T-B}" fill="#FFF3DE" opacity=".8"/>`;
  for(const g of [100,110,120,130]) s+=`<line x1="${L}" y1="${y(g)}" x2="${W-R}" y2="${y(g)}" stroke="#E3E8EF"/><text x="${L-5}" y="${y(g)+4}" text-anchor="end" font-size="9" fill="#7A8699">${g}</text>`;
  const p=a=>a.map((v,i)=>`${i?'L':'M'}${x(i)},${y(v)}`).join('');
  s+=`<path d="${p(ctrl)}" fill="none" stroke="#8A94A0" stroke-width="2" stroke-dasharray="5 4"/><path d="${p(beard)}" fill="none" stroke="#C77F1E" stroke-width="2.6"/>`;
  s+=`<text x="${x(17)+4}" y="${T+11}" font-size="9.5" font-weight="800" fill="#B26A00">MÉDIA S18-S24</text>`;
  s+='</svg>'; document.getElementById('mediachart').innerHTML=s;
})();

/* ============ DISCUSSION — copilote ============ */
const DLOG=document.getElementById('dlog'), DIN=document.getElementById('dinput');
let API_OK=null; /* null=inconnu, true/false après 1er essai */
document.getElementById('openchat').addEventListener('click',()=>{
  document.getElementById('drawer').classList.add('on');
  if(!DLOG.children.length) botSay("Bonjour — je suis le copilote de ton plan de rayon. Je vois ta configuration en direct et je peux **expliquer** chaque arbitrage ou **agir** : « pourquoi GX-One a ces facings ? », « passe à 2 éléments », « variante marge », « quelles réfs risquent la rupture ? ».");
  renderSugg();
});
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');}
function userSay(t){const m=document.createElement('div');m.className='msg user';m.textContent=t;DLOG.appendChild(m);DLOG.scrollTop=DLOG.scrollHeight;}
function botSay(t,act){const m=document.createElement('div');m.className='msg bot';m.innerHTML=md(t)+(act?`<br><span class="act">✓ ${esc(act)}</span>`:'');DLOG.appendChild(m);DLOG.scrollTop=DLOG.scrollHeight;}
function renderSugg(){
  const box=document.getElementById('sugg');
  const hasPlan=!!window.lastPlan;
  const items=hasPlan?["Pourquoi GX-One a ces facings ?","Quelles réfs risquent la rupture ?","Explique la PDL vs fair share","Passe en 2 éléments","Variante marge"]
                     :["Explique le marqueur CA/cm","Qu'est-ce que le fair share ?","Mets 5 planches","Génère le plan"];
  box.innerHTML=items.map(t=>`<button>${t}</button>`).join('');
}
document.getElementById('sugg').addEventListener('click',e=>{const b=e.target.closest('button');if(b){DIN.value=b.textContent;send();}});
document.getElementById('dsend').addEventListener('click',send);
DIN.addEventListener('keydown',e=>{if(e.key==='Enter')send();});
function send(){
  const q=DIN.value.trim(); if(!q)return; DIN.value='';
  userSay(q);
  const t=document.createElement('div');t.className='typing';t.textContent='analyse…';DLOG.appendChild(t);DLOG.scrollTop=DLOG.scrollHeight;
  setTimeout(async()=>{
    let ans=null;
    if(API_OK!==false) ans=await tryClaude(q);
    if(!ans) ans=localBrain(q);
    t.remove();
    botSay(ans.text,ans.act);
    renderSugg();
  },250);
}
/* ---- mode connecté (environnement artifact) ; échec silencieux -> moteur local ---- */
async function tryClaude(q){
  try{
    const ctx={config:{elements:S.nel,largeur_cm:S.wel,planches:S.npl},marqueurs:MARKERS.map(m=>({m:m.lab,poids:m.w})),
      plan:window.lastPlan?{score:window.lastPlan.score,refs:window.lastPlan.alloc.map(a=>a.n+" : "+a.f+" facings")}:null};
    /* PRODUCTION : remplacer API_ENDPOINT par votre proxy serveur (ex. /api/copilot)
       qui détient la clé API Anthropic — la clé ne doit JAMAIS être dans le navigateur. */
    const API_ENDPOINT="https://api.anthropic.com/v1/messages";
    const r=await Promise.race([
      fetch(API_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",
        content:"Tu es un expert category management GMS (15 ans). Réponds en français, ≤120 mots, chiffres uniquement depuis le contexte JSON (traçable), ton direct.\nCONTEXTE: "+JSON.stringify(ctx)+"\nQUESTION: "+q}]})}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),9000))
    ]);
    if(!r.ok) throw new Error("http");
    const d=await r.json();
    const txt=(d.content||[]).filter(c=>c.type==="text").map(c=>c.text).join("\n").trim();
    if(!txt) throw new Error("vide");
    API_OK=true; document.getElementById('chatmode').textContent="IA CONNECTÉE";
    return {text:txt};
  }catch(e){ API_OK=false; return null; }
}
/* ---- moteur local déterministe : répond en CALCULANT sur l'état ---- */
function nrm(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function findRef(q){
  const n=nrm(q);
  return EANS.find(e=>{
    const en=nrm(e.n);
    return n.includes(nrm(SHORT[e.id]).replace('.',''))||en.split(' ').filter(w=>w.length>3).some(w=>n.includes(w)&&!['kolormen','coloration','homme','cheveux','barbe'].includes(w))||n.includes(en);
  })||EANS.find(e=>n.includes('gx')&&e.id.startsWith('gx'))||EANS.find(e=>n.includes('insta')&&e.id==='itd')||EANS.find(e=>n.includes('grizzly')&&e.cls==='comp')||EANS.find(e=>n.includes('mdd')&&e.cls==='mdd');
}
function ensurePlan(){ if(!window.lastPlan){ generate(); go(4); return "Plan généré avec ta configuration courante."; } return null; }
function snapshot(){ return window.lastPlan?{score:window.lastPlan.score,refs:window.lastPlan.alloc.length,used:window.lastPlan.used,ids:window.lastPlan.alloc.map(a=>a.id)}:null; }
function diffTxt(b,a){
  if(!b) return "";
  const out=window.lastPlan.alloc.filter(x=>!b.ids.includes(x.id)).map(x=>x.n);
  const dropped=b.ids.filter(id=>!window.lastPlan.alloc.some(x=>x.id===id)).map(id=>EANS.find(e=>e.id===id).n);
  let s=`Score ${b.score}% → **${a.score}%**, ${b.refs} → ${a.refs} réfs, ${b.used} → ${a.used} facings.`;
  if(dropped.length) s+=` Sortent : ${dropped.join(', ')}.`;
  if(out.length) s+=` Entrent : ${out.join(', ')}.`;
  return s;
}
function localBrain(q){
  const n=nrm(q);
  const num=(q.match(/\d+/)||[])[0];
  const nums=q.match(/\d+/g)||[];
  /* ACTIONS */
  /* multi-intent : "X éléments et Y planches" (dans n'importe quel ordre) */
  if(/element/.test(n)&&/planche/.test(n)&&nums.length>=2){
    const b=snapshot();
    const iEl=q.toLowerCase().search(/[eé]l[eé]ment/), iPl=q.toLowerCase().search(/planche/);
    const nEl=iEl<iPl?+nums[0]:+nums[1], nPl=iEl<iPl?+nums[1]:+nums[0];
    while(S.nel>1)chg('nel',-1); for(let i=1;i<Math.min(5,nEl);i++)chg('nel',1);
    while(NPLSTEPS.indexOf(S.npl)>0)chg('npl',-1); while(S.npl<Math.min(6,nPl))chg('npl',1);
    generate(); go(4);
    return {text:`Rayon reconfiguré : **${S.nel} élément(s) × ${nplLabel()} planche(s)** (${totalCapacity()} facings de capacité). ${diffTxt(b,snapshot())}`,act:`meuble reconfiguré · plan régénéré`};
  }
  if(/(passe|mets|met|configure).*(element)/.test(n)&&num){
    const b=snapshot(); while(S.nel>1)chg('nel',-1); for(let i=1;i<Math.min(5,+num);i++)chg('nel',1);
    generate(); go(4);
    return {text:`Rayon reconfiguré sur **${S.nel} élément${S.nel>1?'s':''}** (${S.nel*Math.floor(S.wel/7.5)*S.npl} facings de capacité). ${diffTxt(b,snapshot())}`,act:`${S.nel} élément(s) · plan régénéré`};
  }
  if(/(demi|1\/2|½).*(planche)/.test(n)||/planche.*(demi|½)/.test(n)){
    const b=snapshot(); while(NPLSTEPS.indexOf(S.npl)>0)chg('npl',-1);
    generate(); go(4);
    return {text:`Vision catégorielle **½ planche** (${totalCapacity()} facings · ${(totalCapacity()*7.5).toFixed(0)} cm) : le socle absolu, niveau des yeux. ${diffTxt(b,snapshot())}`,act:`½ planche · plan régénéré`};
  }
  if(/(passe|mets|met).*(planche)/.test(n)&&num){
    const b=snapshot(); while(NPLSTEPS.indexOf(S.npl)>0)chg('npl',-1); while(S.npl<Math.min(6,+num))chg('npl',1);
    generate(); go(4);
    return {text:`**${nplLabel()} planche(s)** par élément. ${diffTxt(b,snapshot())}`,act:`${nplLabel()} planche(s) · plan régénéré`};
  }
  if(/largeur|125|133|100/.test(n)&&/(passe|mets|met|largeur)/.test(n)&&num&&['100','125','133'].includes(num)){
    const b=snapshot(); while(S.wel>100)chg('wel',-1); while(S.wel<+num)chg('wel',1);
    generate(); go(4);
    return {text:`Éléments de **${S.wel} cm** → ${Math.floor(S.wel/7.5)} facings par planche. ${diffTxt(b,snapshot())}`,act:`largeur ${S.wel} cm · plan régénéré`};
  }
  if(/variante|priorite|priorité/.test(n)||/rotation|marge|equilibre|ca.?\/?.?cm/.test(n)&&/variante|passe|applique|mets/.test(n)){
    const v=/rotation/.test(n)?'rot':/marge/.test(n)?'marge':/ca/.test(n)?'ca':'equi';
    const b=snapshot();
    document.querySelector(`.chip[data-v="${v}"]`)?.click(); go(4);
    const name={rot:'Priorité rotation',marge:'Priorité marge',ca:'Priorité CA/cm',equi:'Équilibré'}[v];
    return {text:`Variante **${name}** appliquée — les poids des marqueurs ont été re-répartis et le plan régénéré. ${diffTxt(b,snapshot())}`,act:name};
  }
  if(/(exclus|retire|sans|enleve).*(concurren|grizzly)/.test(n)){
    const t=document.querySelector('input[data-t="conc"]'); if(t.checked)t.click();
    const b=snapshot(); generate(); go(4);
    return {text:`Concurrence exclue. **Attention** : c'est un plan de marque, plus un plan de catégorie — face à un acheteur, l'absence du concurrent te sera systématiquement opposée. ${diffTxt(b,snapshot())}`,act:'concurrence exclue'};
  }
  if(/(remets|ajoute|integre).*(concurren|grizzly)/.test(n)){
    const t=document.querySelector('input[data-t="conc"]'); if(!t.checked)t.click();
    const b=snapshot(); generate(); go(4);
    return {text:`Concurrence réintégrée — le plan redevient catégoriel. ${diffTxt(b,snapshot())}`,act:'concurrence incluse'};
  }
  if(/genere|génère|lance|calcule le plan/.test(n)){
    const msg=ensurePlan()||"Plan régénéré avec la configuration et les marqueurs courants.";
    if(!/généré/.test(msg)){generate();go(4);}
    const p=window.lastPlan;
    return {text:`${msg} **${p.alloc.length} réfs**, ${p.used}/${p.totF} facings, score **${p.score}%**, CA couvert ${(p.caTot/1000).toFixed(1).replace('.',',')} M€.`,act:'plan généré'};
  }
  /* ANALYSES (nécessitent un plan) */
  if(/pourquoi|explique.*(facing|place)/.test(n)&&findRef(q)){
    const pre=ensurePlan(); const e=findRef(q);
    const a=window.lastPlan.alloc.find(x=>x.id===e.id);
    const tw=MARKERS.reduce((s,m)=>s+m.w,0);
    const contrib=MARKERS.map(m=>{const vals=EANS.map(m.get);const mn=Math.min(...vals),mx=Math.max(...vals);const nv=mx>mn?(m.get(e)-mn)/(mx-mn):.5;return{lab:m.lab,pts:Math.round(m.w/tw*nv*100)};}).sort((x,y)=>y.pts-x.pts);
    const top=contrib.slice(0,2).map(c=>`${c.lab} (${c.pts} pts)`).join(' et ');
    if(!a) return {text:`${(pre?pre+' ':'')}**${e.n}** n'est pas dans le plan : son score composite (${contrib.reduce((s,c)=>s+c.pts,0)}/100) ne passe pas le seuil à cette capacité. Ses meilleurs atouts : ${top}. Pour la faire entrer : augmente la capacité (éléments/planches) ou le poids de ses marqueurs forts.`};
    return {text:`${(pre?pre+' ':'')}**${e.n}** : ${a.f} facings. Score ${Math.round(a.score*100)}/100, porté surtout par ${top}. Contraintes appliquées : facings pairs (min 2)${e.cls==='innov'?', placée en zone découverte (planche haute, badge NEW)':''}${e.cls==='mdd'?', placée en bas de meuble (règle entrée de prix)':''}.`};
  }
  if(/rupture|stock|couverture/.test(n)){
    const pre=ensurePlan();
    const risk=window.lastPlan.alloc.map(a=>({n:a.n,j:(a.f*4)/(a.vmh/7*6)})).filter(x=>x.j<7).sort((a,b)=>a.j-b.j);
    if(!risk.length) return {text:`${(pre?pre+' ':'')}Aucune référence sous 7 jours de couverture au facing (stock = facings × 4 unités ÷ ventes/jour). Le plan tient le week-end.`};
    return {text:`${(pre?pre+' ':'')}**${risk.length} réf(s) sous 7 jours de couverture** : ${risk.map(r=>`${r.n} (${r.j.toFixed(0)} j)`).join(', ')}. Levier : +2 facings sur chacune, ou accepter un réassort renforcé le samedi.`};
  }
  if(/pdl|fair.?share|part de lineaire/.test(n)){
    const pre=ensurePlan(); const p=window.lastPlan;
    const cli=(p.by.client/p.used*100), conc=((p.by.conc||0)/p.used*100), mdd=((p.by.mdd||0)/p.used*100);
    return {text:`${(pre?pre+' ':'')}PDL du plan : client **${cli.toFixed(1).replace('.',',')}%**, concurrent ${conc.toFixed(1).replace('.',',')}%, MDD ${mdd.toFixed(1).replace('.',',')}%. Lecture fair share : la PDM valeur client est **58,3%** — sa PDL ${cli>58.3?'dépasse':'est sous'} sa part de marché de ${Math.abs(cli-58.3).toFixed(1).replace('.',',')} pts, ${cli>58.3?'justifié par la croissance et la marge de ses segments (anti-gris +18,7%, 1-Day +24,3%)':'ce qui laisse un argument de renégociation'}.`};
  }
  if(/plan de masse|masse/.test(n)){
    const pre=ensurePlan(); const rows=[...document.querySelectorAll('#masstable tr')].slice(1,-1).map(r=>r.cells[0].textContent+" "+r.cells[4].textContent);
    return {text:`${(pre?pre+' ':'')}Plan de masse du rayon : ${rows.join(' · ')}. La vue macro est affichée au-dessus du plan au facing (section ①).`};
  }
  if(/simac|presentation|présentation|deck acheteur|trame/.test(n)){
    const pre=ensurePlan();
    return {text:`${(pre?pre+' ':'')}La trame acheteur (section ③) déroule cinq temps depuis ton plan : le marché, l&#39;ambition chiffrée en k€ vs LY, ce qui change, les bénéfices conso/magasin, la décision. Boutons « Copier le script » et « Exporter PDF ».`};
  }
  if(/score/.test(n)){
    const pre=ensurePlan(); const p=window.lastPlan;
    return {text:`${(pre?pre+' ':'')}Le score **${p.score}%** = part de la demande pondérée couverte : somme des scores composites des réfs retenues ÷ somme des 16 EAN. Il monte en ajoutant de la capacité (mais la productivité CA/cm baisse) ou en concentrant les poids sur les marqueurs où tes réfs sont fortes.`};
  }
  /* DÉFINITIONS */
  const DEFS={"ca/cm":"**CA / cm linéaire** : chiffre d'affaires MAT ÷ centimètres alloués. Le juge de paix de l'acheteur — c'est la productivité de son actif rayon.","vmh":"**VMH** : ventes moyennes hebdomadaires par magasin. Pilote le réassort et le risque de rupture ; une réf à forte VMH exige des facings de stock, pas seulement de visibilité.","marge":"**Marge distributeur / cm** : taux de marge × CA ÷ cm. L'argument qui fait exister MDD et innovations face au CA pur.","fair share":"**Fair share** : principe cardinal — la PDL d'un acteur doit refléter sa PDM, ajustée du rôle (croissance, marge, exclusivité). Un plan qui s'en écarte sans justification se fait retoquer.","pdm":"**PDM** : part de marché valeur. Au rayon, elle fonde la représentativité — sous-pondérer un leader décrédibilise le plan.","dn":"**DN** : distribution numérique, % de magasins détenteurs. L'écart DN vs concurrent est souvent le premier gisement de croissance."};
  for(const k in DEFS) if(n.includes(k.replace('/',''))||n.includes(k)) return {text:DEFS[k]};
  if(/conseil|meilleur|optimis|recommand|avis/.test(n)){
    const pre=ensurePlan(); const p=window.lastPlan;
    const tips=[];
    if(!document.querySelector('input[data-t="conc"]').checked) tips.push("réintègre la concurrence (crédibilité catégorielle)");
    if(S.npl<4) tips.push("passe à 4 planches : la planche dédiée aux innovations libère le niveau des yeux");
    const risk=p.alloc.filter(a=>(a.f*4)/(a.vmh/7*6)<7).length;
    if(risk) tips.push(`sécurise les ${risk} réf(s) en risque de rupture (+2 facings)`);
    if(!tips.length) tips.push("la config est saine ; teste la variante Marge pour l'argumentaire acheteur");
    return {text:`${(pre?pre+' ':'')}Mon regard sur le plan (score ${p.score}%, ${p.alloc.length} réfs) : ${tips.join(' ; ')}.`};
  }
  return {text:"Je n'ai pas saisi. Je peux : **expliquer** (« pourquoi InstaTouch a 2 facings », « explique la PDL », « qu'est-ce que le fair share »), **auditer** (« quelles réfs risquent la rupture »), ou **agir** (« passe en 2 éléments », « mets 5 planches », « variante marge », « exclus la concurrence »)."};
}

/* ============ INIT ============ */
window.DEMO_EANS=EANS.map(e=>({...e})); window.DEMO_SHORT={...SHORT};
buildMarkers(); refreshCtl(); if(document.getElementById("packgrid")) renderPackGrid();


/* ---- bloc ---- */


/* ============ EXPORT POWERPOINT (trame + plans) — Path A ============ */
window.SUPPLIERKIT = window.SUPPLIERKIT || {}; /* trame fournisseur : {logo, company, color} */
function rgb2hex(c){ const m=(c||'').match(/\d+/g); if(!m||m.length<3) return null; return m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('').toUpperCase(); }
function fcHex(fc){ const map={beard:'C77F1E',hair:'0E8F8A',innov:'6B4E8E',comp:'8A94A0',mdd:'3D4B5F'}; for(const k in map){ if(fc.classList.contains(k)) return map[k]; } return rgb2hex(getComputedStyle(fc).backgroundColor)||'94A3B8'; }
/* Import de la trame de l'enseigne/fournisseur : logo appliqué au deck exporté. */
function plugSupplierTrame(input){
  const f=input.files&&input.files[0]; if(!f) return;
  if(/image\//.test(f.type)){ const rd=new FileReader(); rd.onload=()=>{ window.SUPPLIERKIT.logo=rd.result; const el=document.getElementById('trameState'); if(el) el.textContent='Trame branchée : logo « '+f.name+' » appliqué à l’export.'; }; rd.readAsDataURL(f); }
  else { const el=document.getElementById('trameState'); if(el) el.textContent='Fichier « '+f.name+' » reçu. Le gabarit .pptx complet (fusion de slides) se branche côté serveur — ici on applique le logo/charte.'; }
}
async function exportPptx(){
  if(typeof PptxGenJS==='undefined'){ alert('Export PowerPoint indisponible dans cet environnement.'); return; }
  if(!window.lastPlan){ alert('Génère d’abord un plan (étapes précédentes).'); return; }
  const pptx=new PptxGenJS(); pptx.defineLayout({name:'W',width:10,height:5.625}); pptx.layout='W';
  const NAVY='10163A', MUT='64748B', BORD='E3E7F0';
  const kit=window.SUPPLIERKIT||{}; const accent=(kit.color||'2E6BFF').replace('#','');
  const cat=window.ACTIVECAT||'Catégorie';
  const used=(window.lastPlan.used)||0, cm=(used*7.5).toFixed(0), nel=(window.S&&window.S.nel)||1;
  /* Slide 1 — titre */
  const s1=pptx.addSlide(); s1.background={color:NAVY};
  if(kit.logo){ try{ s1.addImage({data:kit.logo,x:7.9,y:0.4,w:1.5,h:0.85,sizing:{type:'contain',w:1.5,h:0.85}}); }catch(e){} }
  s1.addText(kit.company||'CatPilot',{x:0.6,y:0.55,w:7,h:0.5,fontSize:20,bold:true,color:'FFFFFF'});
  s1.addText(cat,{x:0.6,y:1.9,w:8.8,h:1.1,fontSize:34,bold:true,color:'FFFFFF'});
  s1.addText('Recommandation catégorie — générée par CatPilot',{x:0.6,y:3.0,w:8.8,h:0.4,fontSize:14,color:'C7CBE6'});
  s1.addText(`${used} facings · ${cm} cm · ${nel} élément(s)`,{x:0.6,y:4.6,w:8.8,h:0.4,fontSize:12,color:'C7CBE6'});
  /* Slide 2 — plan de masse (miroir du DOM) */
  const s2=pptx.addSlide(); s2.addText('Plan de masse',{x:0.5,y:0.3,w:9,h:0.5,fontSize:20,bold:true,color:accent});
  let bx=0.5; document.querySelectorAll('#massbar > div').forEach(d=>{ const w=Math.max(0.05,(parseFloat(d.style.width)||0)/100*9); const col=rgb2hex(getComputedStyle(d).backgroundColor)||'94A3B8'; s2.addShape(pptx.ShapeType.rect,{x:bx,y:0.95,w,h:0.42,fill:{color:col},line:{color:'FFFFFF',width:0.5}}); if(w>0.95){ s2.addText((d.textContent||'').trim().split(/\s+/)[0],{x:bx,y:0.95,w,h:0.42,fontSize:9,bold:true,color:'FFFFFF',align:'center',valign:'middle'}); } bx+=w; });
  const rows=[]; document.querySelectorAll('#masstable tr').forEach((tr,i)=>{ const cells=[...tr.children].map(td=>({text:(td.textContent||'').trim(),options:{fontSize:10,bold:i===0||tr.classList.contains('tot'),color:i===0?MUT:'0F172A'}})); if(cells.length) rows.push(cells); });
  if(rows.length){ try{ s2.addTable(rows,{x:0.5,y:1.7,w:9,border:{type:'solid',color:BORD,pt:0.5},align:'left',valign:'middle',rowH:0.3}); }catch(e){} }
  /* Slide 3 — planogramme au facing (miroir du DOM) */
  const s3=pptx.addSlide(); s3.addText('Planogramme au facing',{x:0.5,y:0.3,w:9,h:0.5,fontSize:20,bold:true,color:accent});
  const els=[...document.querySelectorAll('#gwrap .element')]; const aX=0.5, aW=9, gap=0.15; const ew=els.length?(aW-(els.length-1)*gap)/els.length:aW;
  els.forEach((el,ei)=>{ const ex=aX+ei*(ew+gap); const head=(el.querySelector('.eh')?.textContent||('Élément '+(ei+1))).trim(); s3.addText(head,{x:ex,y:0.92,w:ew,h:0.25,fontSize:9,color:MUT,align:'center'}); const shelves=[...el.querySelectorAll('.shelf')]; const topY=1.22, gH=3.7; const shH=shelves.length?gH/shelves.length:gH; shelves.forEach((shelf,si)=>{ const sy=topY+si*shH; const fcs=[...shelf.querySelectorAll('.fc')]; const fw=fcs.length?ew/fcs.length:ew; fcs.forEach((fc,fi)=>{ s3.addShape(pptx.ShapeType.rect,{x:ex+fi*fw,y:sy+0.03,w:Math.max(0.03,fw-0.008),h:shH-0.12,fill:{color:fcHex(fc)},line:{color:'FFFFFF',width:0.4}}); }); }); });
  /* Slides 4+ — deck acheteur (miroir du DOM) */
  [...document.querySelectorAll('#simacdeck .sslide')].forEach(sl=>{ const s=pptx.addSlide(); const lt=(sl.querySelector('.let')?.textContent||'').trim(); const ti=(sl.querySelector('h4')?.textContent||'').trim(); if(kit.logo){ try{ s.addImage({data:kit.logo,x:8.9,y:0.25,w:0.6,h:0.35,sizing:{type:'contain',w:0.6,h:0.35}}); }catch(e){} } s.addText(`${lt}. ${ti}`,{x:0.5,y:0.35,w:9,h:0.5,fontSize:18,bold:true,color:accent}); const items=[...sl.querySelectorAll('li')].map(li=>({text:(li.textContent||'').trim(),options:{bullet:{characterCode:'2014',indent:12},fontSize:12,color:'475569',paraSpaceAfter:8}})); if(items.length){ s.addText(items,{x:0.5,y:1.1,w:9,h:3.9,valign:'top'}); } });
  const safe=(cat||'catpilot').replace(/[^\w\dÀ-ÿ -]+/g,'_').slice(0,50);
  try{ await pptx.writeFile({fileName:`CatPilot — ${safe}.pptx`}); }catch(e){ alert('Export impossible : '+e.message); }
}



/* ---- bloc ---- */


/* ===== DÉFINITION DU BLOC-MARQUE : segment/marque × vertical/horizontal ===== */
function refBrand(e){ const b=e&&e.brand&&String(e.brand).trim(); return b || String(e && e.n || '').trim().split(/\s+/)[0] || 'Autre'; }
function blockKey(e, blocBy){ return blocBy==='brand' ? refBrand(e) : (e && e.seg || 'Autre'); }
function distribInt(weights,total){ const sum=weights.reduce((a,b)=>a+Math.max(b,0),0)||1; const ex=weights.map(w=>Math.max(w,0)/sum*total); const out=ex.map(x=>Math.floor(x)); let left=total-out.reduce((a,b)=>a+b,0); const ord=ex.map((x,i)=>({i,f:x-Math.floor(x)})).sort((a,b)=>b.f-a.f); for(let k=0;k<ord.length&&left>0;k++){out[ord[k].i]++;left--;} return out; }
/* Rend un tableau de planches (flat, facings expansés) : chaque marque/segment
   forme un bloc contigu. Vertical = bande de colonnes sur toutes les planches ;
   horizontal = bande sur une planche. Best-sellers au niveau des yeux. */
function isNaturel(e){ return !!(e && (e.nat===1 || /\bbio\b|naturel|v[ée]g[ée]tal|vegan|sans ammoniaque|sans sulfate/i.test(e.n||''))); }
function layoutBlocks(alloc, plan, capRow, blocBy, orient, natPole, natZone){
  const S_=Math.max(1, plan.length);
  const W=Math.max(1, capRow);
  /* Grille [planche][colonne] ; null = case libre. On ne perd jamais un facing :
     le pôle occupe EXACTEMENT ses cases (pas une planche entière gaspillée), et le
     bloc principal remplit toutes les cases restantes → Σ facings rendus = alloués (V4). */
  const grid=Array.from({length:S_},()=>Array(W).fill(null));
  let eyeRow=plan.findIndex(p=>p&&p.includes&&p.includes('eyes')); if(eyeRow<0) eyeRow=Math.min(1,S_-1);

  /* séparation naturalité / principal */
  let natRefs=[], mainAlloc=alloc||[];
  if(natPole){ natRefs=(alloc||[]).filter(a=>isNaturel(a.e)); mainAlloc=(alloc||[]).filter(a=>!isNaturel(a.e)); }

  /* unités du pôle = tous les facings naturels (aucun écarté) */
  const nu=[]; natRefs.slice().sort((x,y)=>(y.f||0)-(x.f||0)).forEach(a=>{ for(let i=0;i<(a.f||0);i++) nu.push(a.e); });

  /* planche de zone : froide = planche du bas ; milieu = planche centrale */
  let zoneRow=-1;
  if(natPole && nu.length && S_>1){ zoneRow=(natZone==='middle') ? Math.max(0,Math.round((S_-1)/2)) : S_-1; }

  /* pavé naturalité contigu, dimensionné au nombre exact de facings ; en cas de
     débordement (> largeur d'une planche) il s'étend sur la planche adjacente vers
     l'intérieur, sans jamais réserver une planche à moitié vide. */
  if(zoneRow>=0 && nu.length){
    let idx=0, rem=nu.length;
    const rowsSeq=[zoneRow];
    for(let r=zoneRow-1;r>=0;r--) rowsSeq.push(r);
    for(let r=zoneRow+1;r<S_;r++) rowsSeq.push(r);
    for(const r of rowsSeq){
      if(rem<=0) break;
      const take=Math.min(rem, W);
      for(let c=0;c<take;c++) grid[r][c]=nu[idx++];
      rem-=take;
    }
  }

  /* blocs principaux (hors naturalité) */
  const gm=new Map();
  mainAlloc.forEach(a=>{ const k=blockKey(a.e, blocBy); if(!gm.has(k)) gm.set(k,{key:k,refs:[],fac:0}); const g=gm.get(k); g.refs.push(a); g.fac+=(a.f||0); });
  const blocks=[...gm.values()].sort((x,y)=>y.fac-x.fac);
  blocks.forEach(b=>b.refs.sort((x,y)=>(y.score||0)-(x.score||0)));

  if(orient!=='v'){
    /* horizontal : séquence groupée par bloc, remplit les cases libres,
       planche des yeux d'abord (meilleures réfs à hauteur d'œil). */
    const seq=[]; blocks.forEach(b=>b.refs.forEach(a=>{ for(let i=0;i<(a.f||0);i++) seq.push(a.e); }));
    const order=[eyeRow, ...[...Array(S_).keys()].filter(r=>r!==eyeRow)];
    let si=0;
    for(const r of order){
      for(let c=0;c<W && si<seq.length;c++){ if(grid[r][c]===null) grid[r][c]=seq[si++]; }
    }
  } else {
    /* vertical : chaque bloc = bande de colonnes contiguës (largeur ∝ facings),
       remplie de haut en bas, en contournant le pavé naturalité. */
    const widths=distribInt(blocks.map(b=>b.fac), W);
    let kept=blocks.map((b,i)=>({b,w:widths[i]})).filter(x=>x.w>0);
    if(!kept.length && blocks.length) kept=[{b:blocks[0],w:W}];
    let col=0;
    kept.forEach(({b,w})=>{
      const units=[]; b.refs.forEach(a=>{ for(let i=0;i<(a.f||0);i++) units.push(a.e); });
      if(!units.length){ col+=w; return; }
      let u=0;
      for(let c=col;c<col+w && c<W;c++){
        for(let r=0;r<S_;r++){ if(grid[r][c]===null){ grid[r][c]=units[u%units.length]; u++; } }
      }
      col+=w;
    });
  }

  /* planches finales : on retire les cases restées libres (aucun trou masqué —
     le meuble étant rempli à capacité, elles n'existent qu'en meuble non plein). */
  return grid.map(row=>row.filter(x=>x!==null));
}
/* Toggles UI */
function setBloc(v){ window.S=window.S||{}; S.blocBy=v; document.querySelectorAll('[data-bloc]').forEach(el=>el.classList.toggle('on', el.getAttribute('data-bloc')===v)); if(window.lastPlan) generate(); }
function setOrient(v){ window.S=window.S||{}; S.orient=v; document.querySelectorAll('[data-orient]').forEach(el=>el.classList.toggle('on', el.getAttribute('data-orient')===v)); if(window.lastPlan) generate(); }
function setNat(v){ window.S=window.S||{}; S.natPole=!!v; document.querySelectorAll('[data-nat]').forEach(el=>el.classList.toggle('on', el.getAttribute('data-nat')===String(v))); const z=document.getElementById('natzone'); if(z) z.style.display = v ? 'inline-flex' : 'none'; if(!S.natZone) S.natZone='cold'; if(window.lastPlan) generate(); }
function setNatZone(v){ window.S=window.S||{}; S.natZone=v; document.querySelectorAll('[data-natzone]').forEach(el=>el.classList.toggle('on', el.getAttribute('data-natzone')===v)); if(window.lastPlan) generate(); }



/* ---- bloc ---- */


/* ===== PLAN NATIONAL (démo Assouplissants Carrefour, élément 1 — EAN + facings réels) ===== */
const NAT_RAW=[
 ["8006530122771","LENOR UNSTOPPABLE AERIEN 19D",1],["8700216328272","UNSTOPPABLE AERIEN 41D",1],
 ["8700216782388","LENOR UNST FRESH 7X735G",1],["8006530122795","LENOR BEADS LIGHT 0% FRAICHEUR DE COTON 19D",2],
 ["8006530122825","LENOR BEADS LIGHT 0% FLEUR DE JASMIN 19D",2],["8006530204996","LENOR LIGHT 0% FRAICHEUR DE COTON 71D",4],
 ["8006530205054","LENOR LIGHT 0% FLEUR DE JASMIN 71D",4],["8006530122726","LENOR BEADS ENVOLEE D'AIR 14D",2],
 ["8006530122917","LENOR BEADS ENVOLEE D'AIR 19D",2],["8700216328319","LENOR BEADS ENVOLEE D'AIR 41D",2],
 ["8700216924450","LENOR OCEAN FRSH 4X735G",1],["8006530204606","LENOR COLLECTION ENVOLEE AIR 87D",3],
 ["8006530204934","LENOR COLLECTION ENVOLEE AIR 71D",2],["8006530204491","LENOR COLLECTION ENVOLEE AIR 42D",3],
 ["8006530122665","240G LENOR JASMIN MAI 19D",3],["8006530122856","LENOR BEADS AMBRE ET ORCHIDEE 19D",3],
 ["8700216328289","LENOR BEADS AMBRE ET ORCHIDEE",2],["8006530204385","LENOR COLLECTION AMBRE ET ORCHIDEE 87D",3],
 ["8006530204903","LENOR COLLECTION AMBRE ET ORCHIDEE 71D",3],["8006530204422","LENOR COLLECTION AMBRE ET ORCHIDEE 42D",3],
 ["3560071488765","275G PERLE LING VAN COCO CRF",3],["3560071556884","Perles de linge Fraicheur 275g",3],
 ["8006530150132","LENOR BEADS BALADE EN BORD DE MER",2],["3560071194840","600ML ADOU CONC FRAICH CRF ESS",5]
];
function loadNational(){
  if(typeof EANS==='undefined'){ return; }
  EANS.length=0;
  NAT_RAW.forEach(([ean,n,fac],i)=>{
    const up=n.toUpperCase();
    const seg = /LIGHT 0%|CONC\b|ADOU CONC/.test(up) ? 'Ultras' : /COLLECTION|OCEAN|UNST FRESH|X735G/.test(up) ? 'Dilués' : 'Parfums de linge';
    const mdd = /\bCRF\b/.test(up) || (/PERLES DE LINGE/.test(up) && !/LENOR/.test(up));
    const nat = /LIGHT 0%/.test(up);
    const cls = mdd?'mdd': nat?'innov': seg==='Parfums de linge'?'hair': seg==='Dilués'?'beard':'comp';
    EANS.push({ id:'as'+i, n, ean, seg, cls, br: mdd?'mdd':'client', prix: mdd?4.9:6.9, vmh: fac*0.8+0.4, ca: fac*1400+400, mg: mdd?40:30, pdm: fac*2.2, gr:2.0, nat: nat?1:0, facN: fac });
  });
  if(typeof SHORT!=='undefined'){ for(const k in SHORT) delete SHORT[k]; EANS.forEach(e=>SHORT[e.id]=e.n); }
  window.ACTIVECAT="Assouplissants (plan national Carrefour)";
  window.PACKS={}; if(typeof renderPackGrid==='function') renderPackGrid();
  document.getElementById('catconfirm')&&(document.getElementById('catconfirm').style.display='none');
  if(typeof go==='function') go(1);
}



/* ---- bloc ---- */


/* ===== TABLEAUX DE JUSTIFICATION (fair share marque/segment, productivité, détail, arbitrages) ===== */
const CLSLAB={beard:'Barbe',hair:'Cheveux',innov:'Innovation',comp:'Concurrent',mdd:'MDD'};
function setPdmBasis(v){ window.S=window.S||{}; S.pdmBasis=v; document.querySelectorAll('[data-pdm]').forEach(el=>el.classList.toggle('on',el.getAttribute('data-pdm')===v)); if(window.lastPlan) generate(); }
function jNum(x){ return (Math.round(x*10)/10).toFixed(1).replace('.',','); }
function jBrand(e){ return (typeof refBrand==='function'?refBrand(e):(String(e.n||'').split(/\s+/)[0]||'Autre')); }
/* wrapper de tableau exportable : boutons Excel / PDF + <table data-exp> */
function jTable(title, extra, headHtml, bodyHtml){
  return '<div class="jt" style="margin:14px 0 8px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">'
    +'<div style="font-weight:800;font-size:12.5px">'+title+'</div>'
    +'<div style="display:flex;gap:6px;align-items:center">'+(extra||'')
    +'<button class="mini" onclick="exportTableXlsx(this,\''+title.replace(/'/g,'')+'\')">Excel</button>'
    +'<button class="mini" onclick="exportTablePdf(this,\''+title.replace(/'/g,'')+'\')">PDF</button></div></div>'
    +'<div style="overflow-x:auto"><table data-exp="1"><tr>'+headHtml+'</tr>'+bodyHtml+'</table></div></div>';
}
function fairShareRows(groups, keyer, usedF, caUnivers, totVol, basis){
  return [...groups.values()].map(u=>{
    const pdl=usedF>0?u.f/usedF*100:0;
    const pdm= basis==='vol' ? (totVol>0?u.volU/totVol*100:0) : (caUnivers>0?u.caU/caUnivers*100:0);
    let indice, col, lect, absent=(u.f===0 && pdm>=0.5);
    if(pdm<0.5){ indice='n/s'; col='--mut'; lect=''; }
    else { indice=Math.round(pdl/(pdm||1)*100); col=indice<85?'--red':indice>115?'--amber':'--green'; lect=indice>=100?'sur-pondéré':'sous-pondéré'; }
    return {key:u.key, refs:u.refs, f:u.f, pdl, pdm, indice, col, lect, absent};
  }).sort((a,b)=>b.pdm-a.pdm);
}
function fairShareTable(title, label1, rows){
  const basis=(window.S&&S.pdmBasis)||'val';
  const extra='<button class="chip'+(basis==='val'?' on':'')+'" data-pdm="val" onclick="setPdmBasis(\'val\')">PDM valeur</button><button class="chip'+(basis==='vol'?' on':'')+'" data-pdm="vol" onclick="setPdmBasis(\'vol\')">PDM volume</button>';
  const head='<th>'+label1+'</th><th>Réfs</th><th>Facings</th><th>Linéaire</th><th>PDL %</th><th>PDM '+(basis==='vol'?'volume':'valeur')+' %</th><th>Indice</th><th>Lecture</th>';
  let body=''; rows.forEach(r=>{
    const ind=r.indice==='n/s'?'<span style="color:var(--mut)">n/s</span>':'<span style="color:var('+r.col+')">'+r.indice+'</span>';
    body+='<tr style="'+(r.absent?'font-weight:800':'')+'"><td>'+r.key+'</td><td>'+r.refs+'</td><td>'+r.f+'</td><td>'+(r.f*7.5).toFixed(0)+' cm</td><td>'+jNum(r.pdl)+'</td><td>'+jNum(r.pdm)+'</td><td>'+ind+'</td><td style="color:var('+r.col+')">'+r.lect+'</td></tr>';
  });
  const tF=rows.reduce((a,r)=>a+r.f,0);
  body+='<tr class="tot"><td>TOTAL</td><td></td><td>'+tF+'</td><td>'+(tF*7.5).toFixed(0)+' cm</td><td>100,0</td><td>100,0</td><td></td><td></td></tr>';
  return jTable(title, extra, head, body);
}
function buildJustif(alloc, usedF, caUnivers, clientBrand){
  const host=document.getElementById('justiftables'); if(!host || typeof EANS==='undefined') return;
  const basis=(window.S&&S.pdmBasis)||'val';
  const totVol=EANS.reduce((a,e)=>a+Math.max(0,e.vmh||0),0);
  /* ---- Table marque ---- */
  const uniB=new Map(); EANS.forEach(e=>{const b=jBrand(e); if(!uniB.has(b))uniB.set(b,{key:b,caU:0,volU:0,f:0,refs:0}); const g=uniB.get(b); g.caU+=Math.max(0,e.ca||0); g.volU+=Math.max(0,e.vmh||0);});
  (alloc||[]).forEach(a=>{const b=jBrand(a.e); const g=uniB.get(b); if(g){g.f+=a.f; g.refs++;}});
  const rowsB=fairShareRows(uniB,'brand',usedF,caUnivers,totVol,basis);
  /* ---- Table segment (cls) ---- */
  const uniS=new Map(); EANS.forEach(e=>{const k=CLSLAB[e.cls]||e.cls||'Autre'; if(!uniS.has(k))uniS.set(k,{key:k,caU:0,volU:0,f:0,refs:0}); const g=uniS.get(k); g.caU+=Math.max(0,e.ca||0); g.volU+=Math.max(0,e.vmh||0);});
  (alloc||[]).forEach(a=>{const k=CLSLAB[a.e.cls]||a.e.cls||'Autre'; const g=uniS.get(k); if(g){g.f+=a.f; g.refs++;}});
  const rowsS=fairShareRows(uniS,'cls',usedF,caUnivers,totVol,basis);
  /* ---- Table productivité par bloc (cls) ---- */
  const prodM=new Map(); alloc.forEach(a=>{const k=CLSLAB[a.e.cls]||a.e.cls||'Autre'; if(!prodM.has(k))prodM.set(k,{key:k,f:0,ca:0,mg:0}); const g=prodM.get(k); g.f+=a.f; g.ca+=a.e.ca; g.mg+=a.e.ca*(a.e.mg||0)/100;});
  const prod=[...prodM.values()].map(g=>({key:g.key, cm:g.f*7.5, ca:g.ca, cacm:g.ca/(g.f*7.5||1), mgcm:g.mg/(g.f*7.5||1)})).sort((a,b)=>b.cacm-a.cacm);
  const mgVals=alloc.map(a=>a.e.mg); const mgUniform=mgVals.every(v=>v===mgVals[0]);
  const cmAll=usedF*7.5, caAll=alloc.reduce((a,x)=>a+x.e.ca,0), cacmMoy=caAll/(cmAll||1);
  let prodHead='<th>Bloc</th><th>Linéaire</th><th>CA</th><th>CA / cm</th>'+(mgUniform?'':'<th>Marge / cm</th>')+'<th>Écart vs moyenne</th>';
  let prodBody=''; prod.forEach(r=>{ const ec=(r.cacm/(cacmMoy||1)-1)*100; const col=ec<-3?'--red':ec>3?'--green':'--mut';
    prodBody+='<tr><td>'+r.key+'</td><td>'+r.cm.toFixed(0)+' cm</td><td>'+jNum(r.ca/1000)+' M€</td><td>'+jNum(r.cacm)+' k€/cm</td>'+(mgUniform?'':'<td>'+jNum(r.mgcm)+' k€/cm</td>')+'<td style="color:var('+col+')">'+(ec>=0?'+':'')+ec.toFixed(0)+'%</td></tr>'; });
  prodBody+='<tr class="tot"><td>MOYENNE RAYON</td><td>'+cmAll.toFixed(0)+' cm</td><td>'+jNum(caAll/1000)+' M€</td><td>'+jNum(cacmMoy)+' k€/cm</td>'+(mgUniform?'':'<td></td>')+'<td></td></tr>';
  const prodTable=jTable('Productivité du linéaire — qui mérite ses centimètres','',prodHead,prodBody)+(mgUniform?'<p class="note">Grille de marge non fournie — colonne Marge/cm masquée.</p>':'');
  /* ---- Table détail par référence ---- */
  const caPlan=alloc.reduce((a,x)=>a+x.e.ca,0)||1;
  const det=[...alloc].sort((a,b)=>b.f-a.f);
  let detBody=''; det.forEach(a=>{ const pl=a.f/usedF*100, pc=a.e.ca/caPlan*100; const idx=Math.round(pl/(pc||1)*100); const col=idx<85?'--red':idx>115?'--amber':'--green';
    detBody+='<tr><td>'+a.e.n+(a.e.nw?' <b style="color:var(--acc-d)">NEW</b>':'')+'</td><td>'+jBrand(a.e)+'</td><td>'+a.f+'</td><td>'+(a.f*7.5).toFixed(0)+' cm</td><td>'+jNum(pl)+'</td><td>'+jNum(pc)+'</td><td><span style="color:var('+col+')">'+idx+'</span></td><td>'+(a.score*100).toFixed(0)+'</td></tr>'; });
  const detTable=jTable('Le détail par référence — ce qui justifie chaque facing','','<th>Référence</th><th>Marque</th><th>Facings</th><th>cm</th><th>Part linéaire %</th><th>Part CA %</th><th>Indice</th><th>Score</th>',detBody);
  /* ---- Table arbitrages (écartées) ---- */
  const inIds=new Set(alloc.map(a=>a.e.id));
  const minScore=Math.min.apply(null,alloc.map(a=>a.score).concat([1]));
  const scored=(typeof computeScores==='function')?computeScores():[]; const scById={}; scored.forEach(s=>scById[s.e.id]=s.score);
  const out=EANS.filter(e=>!inIds.has(e.id)).sort((a,b)=>b.ca-a.ca);
  let outBody=''; let caOut=0; out.forEach(e=>{ caOut+=Math.max(0,e.ca||0); const pm=caUnivers>0?e.ca/caUnivers*100:0; const sc=scById[e.id];
    let motif = (sc!=null && sc<minScore)?'score insuffisant' : (e.ca<Math.max(...EANS.map(x=>x.ca))*0.03)?'CA non significatif' : (e.gr<0)?'segment en recul' : 'capacité du meuble atteinte';
    const gcol=e.gr<0?'--red':'--green';
    outBody+='<tr><td>'+e.n+'</td><td>'+jBrand(e)+'</td><td>'+jNum(e.ca/1000)+' M€</td><td>'+jNum(pm)+'</td><td style="color:var('+gcol+')">'+(e.gr>=0?'+':'')+jNum(e.gr)+'%</td><td>'+motif+'</td></tr>'; });
  const outTable = out.length ? jTable('Arbitrages — les références écartées · '+out.length+' réfs · '+jNum(caOut/1000)+' M€ hors plan','','<th>Référence</th><th>Marque</th><th>CA</th><th>PDM %</th><th>Croissance %</th><th>Motif d’exclusion</th>',outBody) : '<p class="note">Aucune référence écartée : tout l’univers lu est au plan.</p>';
  const reserve='<p class="note" style="margin-top:6px">Le fair share est calculé sur le périmètre du fichier chargé. Si l’extract ne couvre pas toute la catégorie, les parts de marché — et donc les indices — sont biaisés.</p>';
  host.innerHTML = fairShareTable('Fair share par marque — sur et sous-pondération','Marque',rowsB)
    + fairShareTable('Fair share par segment — équilibre catégoriel','Segment',rowsS)
    + reserve + prodTable + detTable + outTable;
}
/* ---- Export par tableau ---- */
function _tableAOA(table){ const aoa=[]; table.querySelectorAll('tr').forEach(tr=>{ aoa.push([...tr.children].map(td=>td.textContent.replace(/\s+/g,' ').trim())); }); return aoa; }
function exportTableXlsx(btn,name){ try{ const t=btn.closest('.jt').querySelector('table'); if(typeof XLSX==='undefined'){alert('Export Excel indisponible.');return;} const ws=XLSX.utils.aoa_to_sheet(_tableAOA(t)); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,(name||'Tableau').slice(0,28)); XLSX.writeFile(wb,'CatPilot — '+(name||'tableau')+'.xlsx'); }catch(e){ alert('Export impossible : '+e.message); } }
function exportTablePdf(btn,name){ const t=btn.closest('.jt').querySelector('table'); const w=window.open('','_blank'); if(!w){alert('Autorise les pop-ups pour l’export PDF.');return;} w.document.write('<html><head><title>CatPilot — '+(name||'tableau')+'</title><style>body{font:13px Arial;padding:24px}h3{font-size:15px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}th{background:#0F1B2D;color:#fff}</style></head><body><h3>'+(name||'')+'</h3>'+t.outerHTML+'<scr'+'ipt>window.onload=function(){window.print();}</scr'+'ipt></body></html>'); w.document.close(); }




/* ---- bloc ---- */


/* ===== Aperçu vivant du meuble (étapes 2 à 4) ===== */
function drawLive(){ return;
  if(false){
  try{
    var nel = (typeof S!=='undefined' && S.nel) ? S.nel : 1;
    var cap = (typeof capPerShelf==='function') ? capPerShelf() : 17;
    var tot = (typeof totalCapacity==='function') ? totalCapacity() : cap;
    var npl = (typeof S!=='undefined' && S.npl) ? S.npl : 4;
    var wel = (typeof S!=='undefined' && S.wel) ? S.wel : 133;
    var shelves = Math.max(1, Math.round(npl));
    var eye = shelves<=1 ? 0 : 1;   /* planche n°2 = niveau des yeux */
    var html='';
    for(var e=0;e<nel;e++){
      html+='<div class="liveel">';
      for(var s=0;s<shelves;s++) html+='<div class="liveshelf'+(s===eye?' eye':'')+'"></div>';
      html+='</div>';
      if(e<nel-1) html+='<div class="livesep"></div>';
    }
    document.querySelectorAll('.js-livemeuble').forEach(function(n){ n.innerHTML=html; });
    document.querySelectorAll('.js-lvfac').forEach(function(n){ n.textContent=tot; });
    document.querySelectorAll('.js-lvcm').forEach(function(n){ n.textContent=Math.round(tot*7.5)+' cm'; });
    document.querySelectorAll('.js-lvnote').forEach(function(n){
      n.innerHTML = nel+' élément'+(nel>1?'s':'')+' de '+wel+' cm · '+shelves+' planche'+(shelves>1?'s':'')+
        ' · '+cap+' facings par planche.<br>La bande bleue marque le <b>niveau des yeux</b>.';
    });
  }catch(err){}
}}
/* étapes franchies marquées comme faites */
function markSteps(n){
  document.querySelectorAll('#stepper .step').forEach(function(el){
    var i=+el.getAttribute('data-s');
    el.classList.toggle('done', i<n);
  });
}
/* brancher sur les réglages sans toucher au moteur */
(function(){
  if(typeof refreshCtl==='function'){ var _r=refreshCtl; window.refreshCtl=function(){ _r.apply(null,arguments); drawLive(); }; }
  if(typeof go==='function'){ var _g=go; window.go=function(n){ _g.apply(null,arguments); drawLive(); markSteps(n); }; }
  document.addEventListener('DOMContentLoaded',drawLive); setTimeout(drawLive,300);
})();
/* ===== Onglets du résultat ===== */
function showPane(name, btn){
  document.querySelectorAll('#s4 .rtab').forEach(function(b){ b.classList.toggle('on', b===btn); });
  document.querySelectorAll('#s4 .rpane').forEach(function(p){ p.classList.toggle('on', p.dataset.pane===name); });
  try{ window.scrollTo({top:document.getElementById('s4').offsetTop-70, behavior:'smooth'}); }catch(e){}
}
/* répartir les blocs existants dans les 3 onglets, APRÈS génération, sans les sortir du DOM logique */
function layoutPanes(){
  var s4=document.getElementById('s4'); if(!s4 || s4.dataset.paned) return;
  var kids=[].slice.call(s4.children);
  var panes={plan:[],analyse:[],trame:[]};
  kids.forEach(function(el){
    if(el.classList.contains('stepintro')||el.id==='rsum'||el.classList.contains('rtabs')||el.classList.contains('wnav')) return;
    var t=(el.textContent||'').slice(0,120);
    if(el.id==='justifzone'||/Pourquoi ce plan|analyse détaillée/i.test(t)) panes.analyse.push(el);
    else if(el.id==='simaccard'||/Trame de présentation/i.test(t)) panes.trame.push(el);
    else panes.plan.push(el);
  });
  Object.keys(panes).forEach(function(k){
    if(!panes[k].length) return;
    var wrap=document.createElement('div');
    wrap.className='rpane'+(k==='plan'?' on':''); wrap.dataset.pane=k;
    panes[k][0].parentNode.insertBefore(wrap, panes[k][0]);
    panes[k].forEach(function(el){ wrap.appendChild(el); });
  });
  var nav=s4.querySelector('.wnav'); if(nav) s4.appendChild(nav);
  s4.dataset.paned='1';
}
/* bandeau de synthèse : score + réf. + facings + linéaire, toujours visible */
function fillSummary(){
  var el=document.getElementById('rsum'); if(!el) return;
  var sc=(document.getElementById('ringv')||{}).textContent||'—';
  var p=(window.lastPlan||{});
  var fac=p.used!=null?p.used:'—', tot=p.totF!=null?p.totF:'—';
  var cm=p.used!=null?Math.round(p.used*7.5)+' cm':'—';
  var nref=(p.alloc&&p.alloc.length)||'—';
  el.innerHTML='<div class="rs"><div class="rv">'+sc+'</div><div class="rl">couverture de la<br>demande pondérée</div></div>'+
    '<div class="rs"><div class="rv">'+nref+' réf.</div><div class="rl">retenues au plan</div></div>'+
    '<div class="rs"><div class="rv">'+fac+'/'+tot+'</div><div class="rl">facings alloués</div></div>'+
    '<div class="rs"><div class="rv">'+cm+'</div><div class="rl">linéaire développé</div></div>';
}
(function(){
  if(typeof generate==='function'){
    var _gen=generate;
    window.generate=function(){ var r=_gen.apply(null,arguments); setTimeout(function(){ layoutPanes(); fillSummary(); },30); return r; };
  }
})();
/* ===== KPI de la page Analyses : calculés depuis les données réellement chargées ===== */
function fmtNum(x,d){ return (Math.round(x*Math.pow(10,d||0))/Math.pow(10,d||0)).toLocaleString('fr-FR'); }
function refreshAnalyse(){
  try{
    if(typeof EANS==='undefined' || !EANS.length) return;
    var ca = EANS.reduce(function(a,e){ return a + (e.ca>0?e.ca:0); },0);       /* k€ */
    if(!(ca>0)) return;
    var gr = EANS.reduce(function(a,e){ return a + (e.ca>0?e.ca:0)*(e.gr||0); },0)/ca;
    /* « votre marque » = les références de la marque cliente (br==='client') */
    var cli= EANS.filter(function(e){ return e.br==='client'; }).reduce(function(a,e){ return a+(e.ca>0?e.ca:0); },0);
    var px = EANS.reduce(function(a,e){ return a + (e.ca>0?e.ca:0)*(e.prix||0); },0)/ca;
    var rb = (typeof refBrand==='function') ? refBrand : function(e){ return String(e&&e.n||'').trim().split(/\s+/)[0]||''; };
    var brands=[]; EANS.forEach(function(e){ var b=rb(e); if(b && b!=='Autre' && brands.indexOf(b)<0) brands.push(b); });
    var setv=function(id,v){ var n=document.getElementById(id); if(n) n.innerHTML=v; };
    setv('k_marche', ca>=1000 ? fmtNum(ca/1000,1)+' M€' : fmtNum(ca,0)+' k€');
    setv('k_marche_d', '<span class="'+(gr>=0?'up':'dn')+'">'+(gr>=0?'+':'')+fmtNum(gr,1)+'%</span> vs an dernier');
    /* une PDM de 100% ne veut rien dire : elle signale qu'aucun concurrent n'est identifié */
    if(cli >= ca*0.999){ setv('k_pdm','n/d'); setv('k_pdm_d','aucun concurrent identifié dans le fichier'); }
    else { setv('k_pdm', fmtNum(cli/ca*100,1)+'%'); setv('k_pdm_d','de la valeur du périmètre lu'); }
    setv('k_prix', fmtNum(px,2)+' €');
    setv('k_prix_d', 'pondéré par la valeur');
    setv('k_perim', EANS.length+' réf.');
    /* ne pas conclure « mono-marque » quand la marque n'est simplement pas renseignée */
    setv('k_perim_d', (brands.length ? brands.length+' marque'+(brands.length>1?'s':'') : 'marque non renseignée')
                      + (window.ACTIVECAT? ' · '+window.ACTIVECAT : ''));
    var s=document.getElementById('k_src1');
    if(s) s.title = 'calculé depuis '+(window.ACTIVECAT||'le fichier chargé')+' · '+EANS.length+' références';
  }catch(e){}
}
/* rafraîchir : au chargement de données et à l'ouverture de la page */
(function(){
  if(typeof rebuildCatalog==='function'){ var _rb=rebuildCatalog;
    window.rebuildCatalog=function(){ var r=_rb.apply(null,arguments); setTimeout(refreshAnalyse,20); return r; }; }
  ['loadDemo','loadNational'].forEach(function(fn){
    if(typeof window[fn]==='function'){ var _f=window[fn];
      window[fn]=function(){ var r=_f.apply(null,arguments); setTimeout(refreshAnalyse,40); return r; }; }
  });
  document.addEventListener('click',function(ev){
    var a=ev.target.closest && ev.target.closest('[data-p]');
    if(a && a.getAttribute('data-p')==='pana') setTimeout(refreshAnalyse,60);
  });
  setTimeout(refreshAnalyse,500);
})();
/* ===== Marquer sans ambiguïté ce qui reste illustratif ===== */
(function(){
  document.addEventListener('DOMContentLoaded', markDemoBlocks); setTimeout(markDemoBlocks,400);
  function markDemoBlocks(){
    var media=[].slice.call(document.querySelectorAll('#pana .card')).filter(function(c){
      return /Uplift média/i.test(c.textContent||''); });
    media.forEach(function(c){
      if(c.querySelector('.demoflag')) return;
      var t=c.querySelector('h3'); if(!t) return;
      var b=document.createElement('span'); b.className='demoflag';
      b.textContent='exemple — nécessite un calendrier média';
      t.appendChild(b);
    });
  }
})();


/* ---- bloc ---- */


/* ============ v3 : planogrammes multiples + parcours ============ */
(function(){
  if(typeof S==='undefined') return;
  if(!S.plans){ S.plans=[{nel:(S.nel||1), npl:(S.npl||4)}]; }
  S.uniformNpl=true; S.view=0;
})();
var NPL_V3=[0.5,1,2,3,4,5,6];
function welCm(){ return (typeof S!=='undefined'&&S.wel)?S.wel:133; }
function facPerShelf(){ return Math.floor(welCm()/7.5); }
function planFac(p){ return Math.floor(facPerShelf()*p.npl)*p.nel; }
function planLabel(p){ return p.nel+' élément'+(p.nel>1?'s':'')+' · '+nplTxt(p.npl)+' planche'+(p.npl>1?'s':''); }
function nplTxt(n){ return n===0.5?'½':(''+n); }

/* refreshCtl : ne dépend plus des anciens éléments — met à jour mes caplines */
window.refreshCtl=function(){ try{ updateCaplines(); }catch(e){} };
function updateCaplines(){
  var tot=S.plans.reduce(function(a,p){return a+planFac(p);},0);
  var l1=document.getElementById('capline1');
  if(l1) l1.innerHTML='<b>'+S.plans.length+' planogramme'+(S.plans.length>1?'s':'')+'</b> · '+
    S.plans.map(function(p){return planFac(p)+' facings';}).join(' + ')+' = <b>'+tot+' facings</b> au total.';
  var l2=document.getElementById('capline2');
  if(l2){ var eye=S.plans[0].npl<=1?'la planche unique':'la planche n°2 en partant du haut';
    l2.innerHTML='Capacité par plan recalculée en direct. '+eye.charAt(0).toUpperCase()+eye.slice(1)+' est traitée comme <b>niveau des yeux</b>.'; }
}

/* ---- Étape 2 : liste de planogrammes ---- */
function renderPlansStep(){
  var box=document.getElementById('planslist'); if(!box) return;
  box.innerHTML=S.plans.map(function(p,i){
    return '<div class="planrow"><div class="pname">Planogramme '+String.fromCharCode(65+i)+'<small>format magasin</small></div>'+
      '<div class="numctl"><button onclick="setPlanNel('+i+',-1)">−</button><div class="val"><span>'+p.nel+'</span><small>élément'+(p.nel>1?'s':'')+'</small></div><button onclick="setPlanNel('+i+',1)">+</button></div>'+
      '<div class="pcap">'+planFac(p)+' facings</div>'+
      (S.plans.length>1?'<button class="prm" title="Retirer" onclick="removePlan('+i+')">×</button>':'')+'</div>';
  }).join('');
  var add=document.getElementById('addplanbtn'); if(add) add.style.display=S.plans.length>=5?'none':'';
  updateCaplines();
}
function addPlan(){ if(S.plans.length>=5) return; var last=S.plans[S.plans.length-1];
  S.plans.push({nel:Math.min(5,last.nel+1), npl:S.uniformNpl?S.plans[0].npl:last.npl}); renderPlansStep(); renderPlanchesStep(); }
function removePlan(i){ if(S.plans.length<=1) return; S.plans.splice(i,1); renderPlansStep(); renderPlanchesStep(); }
function setPlanNel(i,d){ var p=S.plans[i]; p.nel=Math.min(5,Math.max(1,p.nel+d)); renderPlansStep(); }

/* ---- Étape 3 : planches ---- */
function toggleUniform(){ S.uniformNpl=document.getElementById('npluniform').checked;
  if(S.uniformNpl){ var n=S.plans[0].npl; S.plans.forEach(function(p){p.npl=n;}); } renderPlanchesStep(); }
function renderPlanchesStep(){
  var box=document.getElementById('planchesctl'); if(!box) return;
  if(S.uniformNpl){
    var p=S.plans[0];
    box.innerHTML='<div class="numctl inline"><button onclick="setPlanNpl(0,-1)">−</button><div class="val"><span>'+nplTxt(p.npl)+'</span><small>planche(s) · tous les plans</small></div><button onclick="setPlanNpl(0,1)">+</button></div>';
  } else {
    box.innerHTML=S.plans.map(function(p,i){
      return '<div class="planrow"><div class="pname">Planogramme '+String.fromCharCode(65+i)+'<small>'+p.nel+' élément'+(p.nel>1?'s':'')+'</small></div>'+
      '<div class="numctl"><button onclick="setPlanNpl('+i+',-1)">−</button><div class="val"><span>'+nplTxt(p.npl)+'</span><small>planche(s)</small></div><button onclick="setPlanNpl('+i+',1)">+</button></div>'+
      '<div class="pcap">'+planFac(p)+' facings</div></div>';
    }).join('');
  }
  updateCaplines();
}
function setPlanNpl(i,d){ var idx=NPL_V3.indexOf(S.plans[i].npl); idx=Math.min(NPL_V3.length-1,Math.max(0,idx+d)); var v=NPL_V3[idx];
  if(S.uniformNpl){ S.plans.forEach(function(p){p.npl=v;}); } else { S.plans[i].npl=v; } renderPlanchesStep(); }

/* ---- Animation d'analyse entre étape 4 et 5 ---- */
function runAnalysis(){
  var nref=(typeof EANS!=='undefined'&&EANS.length)?EANS.length:0;
  var totF=S.plans.reduce(function(a,p){return a+planFac(p);},0);
  var steps=[
    ['Lecture de l\'assortiment', nref+' références'],
    ['Calcul des scores par marqueur', 'CA/cm, rotation, marge, fair share, croissance'],
    ['Allocation des facings', totF+' facings à répartir'],
    ['Construction des planogrammes', S.plans.length+' format'+(S.plans.length>1?'s':'')+' de magasin'],
    ['Contrôles', 'paires · niveau des yeux · nouveautés'],
    ['Mise en forme du plan', '']
  ];
  var ov=document.getElementById('procov'); var box=document.getElementById('prosteps');
  document.getElementById('prosub').textContent='Catégorie : '+(window.ACTIVECAT||'—');
  box.innerHTML=steps.map(function(s,i){return '<div class="prostep" data-i="'+i+'"><div class="pk">'+(i+1)+'</div><div>'+s[0]+(s[1]?' <span style="color:var(--mut)">— '+s[1]+'</span>':'')+'</div></div>';}).join('');
  ov.classList.add('on');
  var i=0, bar=document.getElementById('probari');
  (function tick(){
    var els=box.querySelectorAll('.prostep');
    if(i>0) els[i-1].classList.remove('on'), els[i-1].classList.add('done');
    if(i<els.length){ els[i].classList.add('on'); bar.style.width=Math.round((i+1)/els.length*100)+'%'; i++; setTimeout(tick,360); }
    else { finishAnalysis(); }
  })();
}
function finishAnalysis(){
  S.view=0; S.nel=S.plans[0].nel; S.npl=S.plans[0].npl;
  try{ generate(); }catch(e){}
  relocateResult(); renderPlanSwitch();
  setTimeout(function(){ document.getElementById('procov').classList.remove('on'); go(4); },260);
}

/* ---- Sélecteur de planogrammes (étape 5) ---- */
function renderPlanSwitch(){
  var box=document.getElementById('planswitch'); if(!box) return;
  if(S.plans.length<=1){ box.style.display='none'; return; }
  box.style.display='flex';
  box.innerHTML=S.plans.map(function(p,i){
    return '<button class="pspill'+(i===S.view?' on':'')+'" onclick="viewPlan('+i+')"><b>Planogramme '+String.fromCharCode(65+i)+'</b><small>'+planLabel(p)+' · '+planFac(p)+' facings</small></button>';
  }).join('');
}
function viewPlan(i){ S.view=i; S.nel=S.plans[i].nel; S.npl=S.plans[i].npl; try{ generate(); }catch(e){}
  relocateResult(); renderPlanSwitch(); }

/* ---- Répartir le résultat dans les étapes 6 et 7 ---- */
window.layoutPanes=function(){};  /* neutralise les onglets v2 */
function relocateResult(){
  var jz=document.getElementById('justifzone'), az=document.getElementById('anazone');
  if(jz&&az&&jz.parentNode!==az) az.appendChild(jz);
  var sm=document.getElementById('simaccard'), pz=document.getElementById('preszone');
  if(sm&&pz&&sm.parentNode!==pz){ buildPresRecap(pz); pz.appendChild(sm); }
}
function buildPresRecap(pz){
  if(pz.querySelector('.presrecap')) return;
  var sc=(document.getElementById('ringv')||{}).textContent||'—';
  var used=window.lastAlloc?window.lastAlloc.reduce(function(a,x){return a+x.f;},0):'—';
  var nref=window.lastAlloc?window.lastAlloc.length:'—';
  var cm=(used!=='—')?Math.round(used*7.5)+' cm':'—';
  var div=document.createElement('div'); div.className='presrecap';
  div.innerHTML='<div class="pr"><div class="prv">'+sc+'</div><div class="prl">score du plan</div></div>'+
    '<div class="pr"><div class="prv">'+nref+' réf.</div><div class="prl">à l\'assortiment</div></div>'+
    '<div class="pr"><div class="prv">'+used+'</div><div class="prl">facings</div></div>'+
    '<div class="pr"><div class="prv">'+cm+'</div><div class="prl">linéaire développé</div></div>';
  pz.appendChild(div);
}

/* ---- Extraction du plan au facing ---- */
function exportFacing(){
  if(!window.lastAlloc){ alert('Génère d\'abord un plan.'); return; }
  var rows=[['position','reference','ean','marque','facings','cm']];
  window.lastAlloc.slice().sort(function(a,b){return b.f-a.f;}).forEach(function(x,i){
    rows.push([i+1, (x.e.n||'').replace(/;/g,','), x.e.ean||'', (typeof refBrand==='function'?refBrand(x.e):(x.e.brand||'')), x.f, (x.f*7.5)]);
  });
  var csv=rows.map(function(r){return r.join(';');}).join('\n');
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='plan_au_facing.csv'; a.click();
}

/* ---- Charger le plan national & comparer les facings ---- */
function loadNationalCompare(){
  var nat = (typeof NAT_RAW!=='undefined')?NAT_RAW:[];
  if(!nat.length){ return; }
  var natEans={}; nat.forEach(function(t){ natEans[t[0]]=1; });
  var overlap=(window.lastAlloc||[]).filter(function(x){ return x.e.ean && natEans[x.e.ean]; }).length;
  if(overlap===0 && typeof loadNational==='function'){
    loadNational(); try{ generate(); }catch(e){}
    relocateResult(); renderPlanSwitch();
  }
  var reco={}; (window.lastAlloc||[]).forEach(function(x){ if(x.e.ean) reco[x.e.ean]=x.f; });
  var rows=nat.map(function(t){ var ean=t[0], name=t[1], fnat=t[2]; var fr=reco[ean];
    return {ean:ean,name:name,fnat:fnat,freco:(fr==null?null:fr),ecart:(fr==null?null:fr-fnat)}; });
  var box=document.getElementById('natmatch'); if(!box) return;
  var head='<h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--mut);margin:4px 0 10px">Comparaison au plan national — facings réels vs reco</h3>';
  var tbl='<table class="natmatch-tbl"><tr><th>Référence</th><th>National</th><th>Reco CatPilot</th><th>Écart</th></tr>'+
    rows.slice(0,60).map(function(r){
      var e=r.ecart, cls=e==null?'':(e>0?'under':(e<0?'over':''));
      return '<tr><td>'+String(r.name).slice(0,42)+'</td><td>'+r.fnat+'</td><td>'+(r.freco==null?'—':r.freco)+'</td><td class="'+cls+'">'+(e==null?'non implanté':(e>0?'+'+e:e))+'</td></tr>';
    }).join('')+'</table>'+
    '<p style="font-size:11px;color:var(--mut);margin-top:8px">Jointure par EAN. <span class="under">Bleu</span> = la reco propose plus de facings que le national (sous-linéarisé) · <span class="over">rouge</span> = le national en met plus (sur-linéarisé).</p>';
  box.innerHTML=head+tbl;
}

/* ---- Export présentation (placeholder impression) ---- */
function exportDeck(){ try{ window.print(); }catch(e){} }

/* ---- Initialisation des étapes au bon moment ---- */
(function(){
  var _g=window.go;
  window.go=function(i){ _g.apply(null,arguments);
    if(i===1) renderPlansStep();
    if(i===2){ var u=document.getElementById('npluniform'); if(u) u.checked=S.uniformNpl; renderPlanchesStep(); }
  };
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ renderPlansStep(); renderPlanchesStep(); },200); });
})();
