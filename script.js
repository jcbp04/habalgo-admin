/* HabalGo Admin – Vanilla JS. DEMO authentication only (not secure). */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const K = {riders:'hg_riders', rides:'hg_rides', act:'hg_activity', creds:'hg_creds', sess:'hg_session'};
const today = () => new Date().toISOString().slice(0,10);
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch (e) { return f; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = id => +String(id).replace(/\D/g,'');
const pad = (p, id) => p + '-' + String(num(id)).padStart(3,'0');
const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—';
const ini = n => n.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();

/* ---------- ONE centralized rider dataset ---------- */
function seedRiders() {
  const b = 'Brgy. ', loc = ['Quezon','Roxas','Osmeña','Aguinaldo','Pilar','Bascaran','Communal','Curifang','Quirino','Wacal','Concepcion','Lactawan'];
  // name, gender, brand, model, color, plate, applied, app, status, membership, approved
  const d = [
    ['Juan Dela Cruz','Male','Honda','Click 125','Red','NBA 1234','2026-01-12','Approved','Active','Verified','2026-01-15'],
    ['Maria Santos','Female','Yamaha','Mio Sporty','Blue','NCD 4521','2026-01-20','Approved','Active','Regular','2026-01-24'],
    ['Pedro Ramos','Male','Suzuki','Raider 150','Black','QRS 7788','2026-02-03','Approved','Inactive','Regular','2026-02-06'],
    ['Ana Villanueva','Female','Honda','Beat','White','NAB 9021','2026-02-18','Approved','Suspended','Suspended','2026-02-21'],
    ['Carlo Mendoza','Male','Kawasaki','Barako 175','Green','TUV 3345','2026-03-05','Approved','Active','Verified','2026-03-08'],
    ['Liza Bautista','Female','Yamaha','NMAX','Gray','NDE 6612','2026-04-09','Approved','Active','Regular','2026-04-12'],
    ['Mark C. Reyes','Male','Honda','TMX 155','Black','ABX 1180','2026-05-14','Pending','Pending','','' ],
    ['Grace Aquino','Female','Suzuki','Skydrive','Pink','CDF 5530','2026-06-02','Pending','Pending','',''],
    ['Rico Fernandez','Male','Yamaha','Sniper 155','Blue','XYZ 8841','2026-07-11','Pending','Pending','',''],
    ['Jenny Castillo','Female','Honda','Click 160','Orange','HJK 2209','2026-08-19','Info Requested','Pending','',''],
    ['Dennis Pascual','Male','Kymco','Like 125','Silver','LMN 7714','2026-09-07','Rejected','Rejected','',''],
    ['Rhea Navarro','Female','Yamaha','Mio Gear','Red','PQR 3036','2026-10-21','Pending','Pending','','']
  ];
  return d.map((r,i) => ({id:i+1, name:r[0], dob:`199${i%9}-0${(i%9)+1}-1${i%9}`, gender:r[1], address:b+loc[i]+', Solano, Nueva Vizcaya',
    phone:'0917 555 '+String(1010+i*37), email:r[0].toLowerCase().replace(/[^a-z]+/g,'.')+'@example.com',
    brand:r[2], model:r[3], color:r[4], plate:r[5], applied:r[6], app:r[7], status:r[8], mtype:r[9], approved:r[10],
    docs:[true,true,r[7]!=='Info Requested'], remarks:r[7]==='Rejected'?'Driver’s license expired.':''}));
}
function seedRides() {
  const p = ['Liza M.','Ben C.','Tess R.','Noel A.','Ivy S.','Carl D.'], pl = ['Solano Public Market','Bayombong Terminal','St. Mary’s University','Solano Town Plaza','Bagabag Junction','Roxas Barangay Hall'];
  const r = ['Juan Dela Cruz','Maria Santos','Pedro Ramos','Carlo Mendoza','Liza Bautista'], st = ['Completed','Completed','Completed','Cancelled','Completed'];
  return Array.from({length:14},(_,i) => ({id:'RIDE-'+String(1001+i), rider:r[i%5], passenger:p[i%6], from:pl[i%6], to:pl[(i+2)%6],
    date:`2026-${String(Math.max(1,10-Math.floor(i/3))).padStart(2,'0')}-${String(3+i*2).padStart(2,'0')}`, status:st[i%5]}));
}
let riders = load(K.riders, null) || seedRiders(), rides = load(K.rides, null) || seedRides(), activity = load(K.act, null) || [{t:'System ready with sample data',d:new Date().toISOString()}];
let creds = load(K.creds, {user:'admin@habalgo.com', pass:'Admin@123', name:'HabalGo Admin'});
const persist = () => { save(K.riders, riders); save(K.rides, rides); save(K.act, activity); };
const log = t => { activity.unshift({t, d:new Date().toISOString()}); activity = activity.slice(0,30); persist(); };
const byId = id => riders.find(r => r.id === +id);
const isApproved = r => r.app === 'Approved';
const isOpen = r => r.app !== 'Approved';
const bc = s => 'b-' + String(s).split(' ')[0];
const badge = s => `<span class="badge ${bc(s)}">${esc(s)}</span>`;
const who = r => `<div class="rider"><span class="avatar">${esc(ini(r.name))}</span><div>${esc(r.name)}</div></div>`;
const empty = (c, m) => `<tr><td class="empty" colspan="${c}">${m}</td></tr>`;
const match = (r, q) => !q || Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase());

/* ---------- UI helpers ---------- */
let toastT; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); };
const modal = (html, small) => { $('#modal').className = 'modal' + (small ? ' sm' : ''); $('#modal').innerHTML = html; $('#overlay').classList.remove('hidden'); const f = $('#modal input,#modal textarea,#modal select'); };
const closeModal = () => $('#overlay').classList.add('hidden');
function confirmBox(title, msg, onYes, opts = {}) {
  modal(`<h3>${esc(title)}</h3><p class="muted">${esc(msg)}</p>${opts.remarks ? `<label>${esc(opts.remarks)}<textarea id="cfRemarks" rows="3" placeholder="Required"></textarea></label><div class="err" id="cfErr"></div>` : ''}
  <div class="mact"><button class="ghost" id="cfNo">Cancel</button><button class="btn ${opts.danger ? 'danger' : ''}" id="cfYes">${esc(opts.label || 'Confirm')}</button></div>`, true);
  $('#cfNo').onclick = closeModal;
  $('#cfYes').onclick = () => {
    let v = '';
    if (opts.remarks) { v = $('#cfRemarks').value.trim(); if (!v) { $('#cfErr').textContent = 'Please enter remarks before continuing.'; return; } }
    closeModal(); onYes(v);
  };
}
const kv = (a) => `<div class="kv">${a.map(([k,v]) => `<div><small>${k}</small>${v}</div>`).join('')}</div>`;

/* ---------- Auth ---------- */
const session = () => localStorage.getItem(K.sess) || sessionStorage.getItem(K.sess);
function showApp(show) {
  $('#loginView').classList.toggle('hidden', show); $('#appView').classList.toggle('hidden', !show);
  if (show) { $('#topName').textContent = creds.name; $('#topAvatar').textContent = ini(creds.name); go('dashboard'); }
}
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const u = $('#lgUser').value.trim().toLowerCase(), p = $('#lgPass').value;
  if (!u || !p) { $('#lgErr').textContent = 'Enter your email or username and password.'; return; }
  if ((u === creds.user.toLowerCase() || u === 'admin') && p === creds.pass) {
    (($('#lgRemember').checked) ? localStorage : sessionStorage).setItem(K.sess, creds.user);
    $('#lgErr').textContent = ''; $('#lgPass').value = ''; log('Administrator logged in'); showApp(true);
  } else $('#lgErr').textContent = 'Incorrect email/username or password.';
});
$('#togglePw').onclick = () => { const i = $('#lgPass'), h = i.type === 'password'; i.type = h ? 'text' : 'password'; $('#togglePw').textContent = h ? 'Hide' : 'Show'; };
$('#forgot').onclick = e => { e.preventDefault(); modal(`<h3>Forgot password</h3><p class="muted">This is a demo. Use the sample credentials shown on the login page, or reset sample data from Settings after logging in.</p><div class="mact"><button class="btn" onclick="document.getElementById('overlay').classList.add('hidden')">Got it</button></div>`, true); };
$('#backHome').onclick = e => { e.preventDefault(); toast('Homepage link: point this to your existing HabalGo homepage'); };
function logout() { confirmBox('Log out', 'Are you sure you want to log out?', () => { localStorage.removeItem(K.sess); sessionStorage.removeItem(K.sess); log('Administrator logged out'); showApp(false); }, {label:'Log out'}); }
$('#logoutBtn').onclick = logout; $('#logout2').onclick = logout;

/* ---------- Navigation ---------- */
const titles = {dashboard:'Dashboard', approval:'Rider Approval', membership:'Rider Membership', riders:'Rider Management', rides:'Ride History', reports:'Reports', settings:'Settings'};
function go(id) {
  if (!session()) { showApp(false); return; }   // block unauthorized access
  $$('.panel').forEach(p => p.classList.toggle('hidden', p.id !== id));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.go === id));
  $('#pageTitle').textContent = titles[id]; $('#sidebar').classList.remove('open'); renderAll();
}
$('#nav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.go); });
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- Stats ---------- */
function counts() {
  const c = {total:riders.length, pending:0, approved:0, rejected:0, active:0, inactive:0, suspended:0};
  riders.forEach(r => { if (r.app === 'Pending' || r.app === 'Info Requested') c.pending++; if (r.app === 'Approved') c.approved++; if (r.app === 'Rejected') c.rejected++;
    if (r.status === 'Active') c.active++; if (r.status === 'Inactive') c.inactive++; if (r.status === 'Suspended') c.suspended++; });
  return c;
}
const statCards = c => [['Total registered riders',c.total,1],['Pending applications',c.pending],['Approved riders',c.approved],['Rejected applications',c.rejected],['Active riders',c.active],['Inactive riders',c.inactive]]
  .map(s => `<div class="stat ${s[2] ? 'hl' : ''}"><small>${s[0]}</small><b>${s[1]}</b></div>`).join('');

/* ---------- Renderers ---------- */
function renderDashboard() {
  const c = counts(); $('#stats').innerHTML = statCards(c);
  $('#activity').innerHTML = activity.slice(0,7).map(a => `<li>${esc(a.t)}<small>${new Date(a.d).toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'})}</small></li>`).join('');
  const rec = [...riders].sort((a,b) => b.applied.localeCompare(a.applied)).slice(0,5);
  $('#recentTbl').innerHTML = `<tr><th>Rider</th><th>Applied</th><th>Status</th></tr>` + rec.map(r => `<tr><td>${who(r)}</td><td>${fmt(r.applied)}</td><td>${badge(r.status)}</td></tr>`).join('');
}
function renderApproval() {
  const q = $('#apSearch').value, f = $('#apFilter').value;
  const list = riders.filter(r => isOpen(r) && match({n:r.name,e:r.email,i:pad('APP',r.id)}, q) && (!f || r.app === f));
  $('#pendBadge').textContent = riders.filter(r => r.app === 'Pending' || r.app === 'Info Requested').length || '';
  $('#apTbl').innerHTML = `<tr><th>Application ID</th><th>Rider name</th><th>Contact</th><th>Email</th><th>Date applied</th><th>Status</th><th>Actions</th></tr>` +
    (list.map(r => `<tr><td>${pad('APP',r.id)}</td><td>${who(r)}</td><td>${esc(r.phone)}</td><td>${esc(r.email)}</td><td>${fmt(r.applied)}</td><td>${badge(r.app)}</td><td><button class="ghost sm" data-view-app="${r.id}">View application</button></td></tr>`).join('') || empty(7,'No open applications. New rider registrations will appear here.'));
}
function renderMembership() {
  const q = $('#mbSearch').value, f = $('#mbFilter').value;
  const list = riders.filter(r => isApproved(r) && match({n:r.name,e:r.email,p:r.phone,i:pad('MB',r.id)+pad('RD',r.id)}, q) && (!f || r.mtype === f));
  $('#mbTbl').innerHTML = `<tr><th>Membership ID</th><th>Rider ID</th><th>Full name</th><th>Contact</th><th>Email</th><th>Date approved</th><th>Type</th><th>Status</th><th>Actions</th></tr>` +
    (list.map(r => `<tr><td>${pad('MB',r.id)}</td><td>${pad('RD',r.id)}</td><td>${who(r)}</td><td>${esc(r.phone)}</td><td>${esc(r.email)}</td><td>${fmt(r.approved)}</td><td>${badge(r.mtype)}</td><td>${badge(r.mtype === 'Suspended' ? 'Suspended' : 'Active')}</td>
    <td><div class="acts"><button class="ghost sm" data-mb-view="${r.id}">View</button><button class="ghost sm" data-mb-edit="${r.id}">Edit</button>${r.mtype === 'Suspended' ? `<button class="ghost sm" data-act="reactivate" data-id="${r.id}">Reactivate</button>` : `<button class="ghost sm" data-act="suspend" data-id="${r.id}">Suspend</button>`}</div></td></tr>`).join('') || empty(9,'No members match your search.'));
}
function renderRiders() {
  const q = $('#rdSearch').value, f = $('#rdFilter').value;
  const list = riders.filter(r => match({n:r.name,e:r.email,p:r.phone,pl:r.plate,id:pad('RD',r.id)}, q) && (!f || r.status === f));
  $('#rdTbl').innerHTML = `<tr><th>Rider ID</th><th>Rider</th><th>Contact</th><th>Address</th><th>Motorcycle</th><th>Plate</th><th>Registered</th><th>Approved</th><th>Membership</th><th>Status</th><th>Actions</th></tr>` +
    (list.map(r => { const a = r.status === 'Active', i = r.status === 'Inactive', s = r.status === 'Suspended';
      return `<tr><td>${pad('RD',r.id)}</td><td>${who(r)}<div class="muted tiny">${esc(r.email)}</div></td><td>${esc(r.phone)}</td><td>${esc(r.address)}</td><td>${esc(r.brand)} ${esc(r.model)}</td><td>${esc(r.plate)}</td><td>${fmt(r.applied)}</td><td>${fmt(r.approved)}</td><td>${r.mtype ? badge(r.mtype) : '—'}</td><td>${badge(r.status)}</td>
      <td><div class="acts"><button class="ghost sm" data-rd-view="${r.id}">View</button><button class="ghost sm" data-rd-edit="${r.id}">Edit</button>
      ${a ? `<button class="ghost sm" data-act="deactivate" data-id="${r.id}">Deactivate</button>` : ''}${i ? `<button class="ghost sm" data-act="activate" data-id="${r.id}">Activate</button>` : ''}
      ${(a || i) ? `<button class="ghost sm" data-act="suspend" data-id="${r.id}">Suspend</button>` : ''}${s ? `<button class="ghost sm" data-act="reactivate" data-id="${r.id}">Reactivate</button>` : ''}</div></td></tr>`; }).join('') || empty(11,'No riders match your filters.'));
}
function renderRides() {
  const q = $('#rhSearch').value.toLowerCase(), a = $('#rhFrom').value, b = $('#rhTo').value;
  const list = rides.filter(r => (!q || [r.id,r.rider,r.passenger,r.from,r.to].join(' ').toLowerCase().includes(q)) && (!a || r.date >= a) && (!b || r.date <= b)).sort((x,y) => y.date.localeCompare(x.date));
  $('#rhTbl').innerHTML = `<tr><th>Ride ID</th><th>Rider</th><th>Passenger</th><th>Pickup</th><th>Destination</th><th>Date</th><th>Status</th></tr>` +
    (list.map(r => `<tr><td>${r.id}</td><td>${esc(r.rider)}</td><td>${esc(r.passenger)}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td>${fmt(r.date)}</td><td>${badge(r.status)}</td></tr>`).join('') || empty(7,'No rides found for these filters.'));
}
function monthly() {
  const m = {}; riders.forEach(r => { const k = r.applied.slice(0,7); m[k] = (m[k] || 0) + 1; });
  return Object.keys(m).sort().map(k => [new Date(k + '-01T00:00:00').toLocaleString('en',{month:'short'}), m[k]]);
}
function renderReports() {
  const c = counts(); $('#rpStats').innerHTML = statCards(c);
  const mo = monthly(), mx = Math.max(1, ...mo.map(x => x[1]));
  $('#chartMonthly').innerHTML = mo.map(x => `<div>${x[1]}<i style="height:${x[1] / mx * 80}%"></i>${x[0]}</div>`).join('');
  const t = Math.max(1, c.total);
  $('#chartApproval').innerHTML = [['Approved',c.approved,'var(--g)'],['Pending',c.pending,'var(--yel)'],['Rejected',c.rejected,'var(--dred)']]
    .map(x => `<div class="hbar"><div><span style="display:inline">${x[0]}</span><b>${x[1]} (${Math.round(x[1] / t * 100)}%)</b></div><span><i style="width:${x[1] / t * 100}%;background:${x[2]}"></i></span></div>`).join('');
  $('#rpTbl').innerHTML = `<tr><th>Rider status</th><th>Count</th><th>Share</th></tr>` + ['Active','Inactive','Pending','Suspended','Rejected'].map(s => { const n = riders.filter(r => r.status === s).length; return `<tr><td>${badge(s)}</td><td>${n}</td><td>${Math.round(n / t * 100)}%</td></tr>`; }).join('');
}
function renderSettings() {
  $('#stName').value = creds.name; $('#stEmail').value = creds.user; $('#stWho').textContent = creds.user;
  $('#sysInfo').innerHTML = [['System','HabalGo Admin Console'],['Version','1.0.0 (demo)'],['Storage','Browser localStorage'],['Riders on file',riders.length],['Rides on file',rides.length]].map(x => `<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('');
}
function renderAll() { renderDashboard(); renderApproval(); renderMembership(); renderRiders(); renderRides(); renderReports(); renderSettings(); }
['apSearch','apFilter','mbSearch','mbFilter','rdSearch','rdFilter','rhSearch','rhFrom','rhTo'].forEach(id => $('#' + id).addEventListener('input', () => { renderApproval(); renderMembership(); renderRiders(); renderRides(); }));
$('#rhClear').onclick = () => { ['rhSearch','rhFrom','rhTo'].forEach(i => $('#' + i).value = ''); renderRides(); };

/* ---------- Application review ---------- */
function viewApp(id) {
  const r = byId(id), dn = ['Government ID','Driver’s License','Motorcycle Registration'];
  modal(`<h3>${pad('APP',r.id)} · ${esc(r.name)}</h3><div>${badge(r.app)}</div>
  <div class="sec">Personal information</div>${kv([['Full name',esc(r.name)],['Date of birth',fmt(r.dob)],['Gender',esc(r.gender)],['Address',esc(r.address)],['Contact number',esc(r.phone)],['Email',esc(r.email)]])}
  <div class="sec">Motorcycle information</div>${kv([['Brand',esc(r.brand)],['Model',esc(r.model)],['Color',esc(r.color)],['Plate number',esc(r.plate)]])}
  <div class="sec">Required documents</div><div class="docs">${dn.map((d,i) => `<div class="doc"><span>${d}</span>${r.docs[i] ? badge('Approved').replace('Approved','Submitted') : badge('Pending').replace('Pending','Missing')}</div>`).join('')}</div>
  ${r.remarks ? `<div class="sec">Admin remarks</div><p class="muted">${esc(r.remarks)}</p>` : ''}
  <div class="mact"><button class="ghost" id="aClose">Close</button><button class="ghost" id="aReq">Request additional requirements</button><button class="btn danger" id="aRej">Reject application</button><button class="btn" id="aOk">Approve application</button></div>`);
  $('#aClose').onclick = closeModal;
  $('#aOk').onclick = () => confirmBox('Approve application', `Approve ${r.name} as a HabalGo rider?`, () => {
    Object.assign(r, {app:'Approved', status:'Active', mtype:'Regular', approved:today(), remarks:''}); log(`Approved application of ${r.name}`); persist(); renderAll(); toast('Application approved. Rider added to Membership and Rider Management.'); }, {label:'Approve'});
  $('#aRej').onclick = () => confirmBox('Reject application', `Reject the application of ${r.name}?`, v => {
    Object.assign(r, {app:'Rejected', status:'Rejected', remarks:v}); log(`Rejected application of ${r.name}`); persist(); renderAll(); toast('Application rejected.'); }, {remarks:'Rejection remarks', danger:true, label:'Reject'});
  $('#aReq').onclick = () => confirmBox('Request additional requirements', `Tell ${r.name} what else is needed.`, v => {
    Object.assign(r, {app:'Info Requested', status:'Pending', remarks:v}); log(`Requested additional requirements from ${r.name}`); persist(); renderAll(); toast('Request recorded.'); }, {remarks:'Requirements needed', label:'Send request'});
}
function viewRider(id, membership) {
  const r = byId(id);
  modal(`<h3>${esc(r.name)}</h3><div>${badge(r.status)} ${r.mtype ? badge(r.mtype) : ''}</div>
  <div class="sec">${membership ? 'Membership' : 'Rider'} details</div>${kv([['Rider ID',pad('RD',r.id)],['Membership ID',r.mtype ? pad('MB',r.id) : '—'],['Contact',esc(r.phone)],['Email',esc(r.email)],['Address',esc(r.address)],['Motorcycle',`${esc(r.brand)} ${esc(r.model)} (${esc(r.color)})`],['Plate number',esc(r.plate)],['Registered',fmt(r.applied)],['Approved',fmt(r.approved)]])}
  <div class="mact"><button class="btn" onclick="document.getElementById('overlay').classList.add('hidden')">Close</button></div>`);
}
function editRider(id, membership) {
  const r = byId(id), f = (k, l, t = 'text') => `<label>${l}<input name="${k}" type="${t}" value="${esc(r[k])}" required></label>`;
  modal(`<h3>${membership ? 'Update membership' : 'Edit rider'}</h3><form id="edForm"><div class="form2">${f('name','Full name')}${f('phone','Contact number')}${f('email','Email','email')}
  ${membership ? `<label>Membership type<select name="mtype"><option ${r.mtype === 'Regular' ? 'selected' : ''}>Regular</option><option ${r.mtype === 'Verified' ? 'selected' : ''}>Verified</option><option ${r.mtype === 'Suspended' ? 'selected' : ''}>Suspended</option></select></label>` : f('address','Address') + f('brand','Motorcycle brand') + f('model','Motorcycle model') + f('plate','Plate number')}
  </div><div class="mact"><button type="button" class="ghost" id="edNo">Cancel</button><button class="btn" type="submit">Save changes</button></div></form>`);
  $('#edNo').onclick = closeModal;
  $('#edForm').onsubmit = e => { e.preventDefault(); const d = new FormData(e.target); d.forEach((v, k) => r[k] = v.trim());
    if (membership) r.status = r.mtype === 'Suspended' ? 'Suspended' : (r.status === 'Suspended' ? 'Active' : r.status);
    log(`Updated ${membership ? 'membership' : 'details'} of ${r.name}`); persist(); closeModal(); renderAll(); toast('Changes saved.'); };
}
const actions = {
  suspend:['Suspend','Suspended',r => { r.prev = r.mtype; r.status = 'Suspended'; r.mtype = 'Suspended'; }],
  reactivate:['Reactivate','Active',r => { r.status = 'Active'; r.mtype = r.prev && r.prev !== 'Suspended' ? r.prev : 'Regular'; }],
  activate:['Activate','Active',r => { r.status = 'Active'; }],
  deactivate:['Deactivate','Inactive',r => { r.status = 'Inactive'; }]
};
document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
  if (d.viewApp) viewApp(d.viewApp); else if (d.mbView) viewRider(d.mbView, true); else if (d.rdView) viewRider(d.rdView);
  else if (d.mbEdit) editRider(d.mbEdit, true); else if (d.rdEdit) editRider(d.rdEdit);
  else if (d.act) { const r = byId(d.id), a = actions[d.act];
    confirmBox(`${a[0]} rider`, `${a[0]} ${r.name}?`, () => { a[2](r); log(`${a[0]}d ${r.name}`.replace('ee','e')); persist(); renderAll(); toast(`${r.name} is now ${r.status}.`); }, {label:a[0], danger:d.act === 'suspend'}); }
});

/* ---------- CSV export ---------- */
$('#exportBtn').onclick = () => {
  const h = ['Rider ID','Name','Phone','Email','Address','Motorcycle','Plate','Applied','Approved','Application','Membership','Status'];
  const rows = riders.map(r => [pad('RD',r.id), r.name, r.phone, r.email, r.address, r.brand + ' ' + r.model, r.plate, r.applied, r.approved, r.app, r.mtype, r.status]);
  const csv = [h, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = `habalgo-riders-${today()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  log('Exported riders report to CSV'); persist(); toast('CSV report downloaded.');
};

/* ---------- Settings ---------- */
$('#profileForm').onsubmit = e => { e.preventDefault(); creds.name = $('#stName').value.trim(); creds.user = $('#stEmail').value.trim(); save(K.creds, creds);
  if (session()) { const s = localStorage.getItem(K.sess) ? localStorage : sessionStorage; s.setItem(K.sess, creds.user); }
  $('#topName').textContent = creds.name; $('#topAvatar').textContent = ini(creds.name); log('Updated administrator profile'); renderSettings(); toast('Profile saved.'); };
$('#pwForm').onsubmit = e => { e.preventDefault(); const o = $('#pwOld').value, n = $('#pwNew').value, c = $('#pwNew2').value;
  if (o !== creds.pass) return toast('Current password is incorrect.'); if (n.length < 8) return toast('New password needs 8+ characters.'); if (n !== c) return toast('New passwords do not match.');
  creds.pass = n; save(K.creds, creds); e.target.reset(); log('Changed administrator password'); toast('Password updated.'); };
$('#resetData').onclick = () => confirmBox('Reset sample data', 'This replaces all riders, rides and activity with the original sample data.', () => {
  riders = seedRiders(); rides = seedRides(); activity = [{t:'Sample data reset', d:new Date().toISOString()}]; persist(); renderAll(); toast('Sample data restored.'); }, {danger:true, label:'Reset'});

/* ---------- Init ---------- */
persist(); showApp(!!session());
})();
