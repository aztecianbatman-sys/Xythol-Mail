import { createClient } from '@supabase/supabase-js';
import { invoke } from '@tauri-apps/api/core';
import './styles.css';

const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false} })
  : null;

const root=document.querySelector<HTMLDivElement>('#app')!;
let view='inbox';
let wizard=false;
let profile:{display_name:string;anonymous_address:string}|null=null;
let status='Ready';

const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,24)||'user';

async function loadProfile(){
  if(!supabase)return;
  const user=(await supabase.auth.getUser()).data.user;
  if(!user)return;
  profile=(await supabase.from('profiles').select('display_name,anonymous_address').eq('user_id',user.id).maybeSingle()).data;
}
async function boot(){
  if(!supabase){root.innerHTML=authBox('Connect Supabase','Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');return;}
  const session=(await supabase.auth.getSession()).data.session;
  if(!session){showIdentity();return;}
  await loadProfile();
  render();
}
function authBox(title:string,text:string){
  return '<div class="auth"><div class="authbox"><img src="/assets/branding/xythol-mark.svg"><span class="eyebrow">XYTHOL MAIL</span><h1>'+esc(title)+'</h1><p>'+esc(text)+'</p></div></div>';
}
function showIdentity(){
  root.innerHTML='<div class="auth"><div class="authbox"><img src="/assets/branding/xythol-mark.svg"><span class="eyebrow">ANONYMOUS IDENTITY</span><h1>Pick your Xythol name.</h1><p>No real email or password is required for your Xythol identity.</p><label>Name<input id="name" maxlength="32" placeholder="Night Owl"></label><div id="preview"></div><button class="primary full" id="create">Create identity</button><small class="hint">The Xythol address is an identity label, not a public internet mailbox.</small></div></div>';
  const input=document.querySelector<HTMLInputElement>('#name')!;
  const preview=document.querySelector('#preview')!;
  input.oninput=()=>preview.innerHTML=input.value.trim()?'<div class="identity-preview"><small>Your identity</small><b>'+esc(slug(input.value))+'@xythol</b></div>':'';
  document.querySelector('#create')!.addEventListener('click',createIdentity);
}
async function createIdentity(){
  const input=document.querySelector<HTMLInputElement>('#name')!;
  const name=input.value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>32){alert('Choose a name between 2 and 32 characters.');return;}
  const auth=await supabase!.auth.signInAnonymously();
  if(auth.error||!auth.data.user){alert(auth.error?.message||'Could not create the anonymous account.');return;}
  const username=slug(name);
  const r=await supabase!.from('profiles').insert({user_id:auth.data.user.id,display_name:name,username,anonymous_address:username+'@xythol'});
  if(r.error){await supabase!.auth.signOut();alert(r.error.code==='23505'?'That name is already taken.':r.error.message);return;}
  await loadProfile();render();
}
function nav(text:string,target:string,icon:string){
  return '<button class="navitem '+(view===target?'active':'')+'" data-view="'+target+'"><span>'+icon+'</span>'+text+'</button>';
}
function render(){
  const identity=profile?.anonymous_address||'anonymous@xythol';
  root.innerHTML='<div class="app"><aside class="sidebar"><div class="brand" data-view="inbox"><img src="/assets/branding/xythol-mark.svg"><div><b>Xythol Mail</b><small>Research · Write · Send</small></div></div><button class="composebtn" data-view="compose">＋ New email</button><nav>'+nav('Inbox','inbox','✉')+nav('Sent','inbox','↗')+nav('Drafts','inbox','□')+nav('Starred','inbox','★')+nav('Archive','inbox','▣')+nav('Trash','inbox','⌫')+'</nav><div class="navlabel">RESEARCH</div>'+nav('Research desk','research','⌕')+'<button class="navitem" data-action="browser"><span>◎</span>Research browser</button><button class="navitem" data-action="chrome"><span>↗</span>Open Chrome</button><div class="bottom">'+nav('Contacts','contacts','♙')+nav('Settings','settings','⚙')+'<div class="account"><div class="avatar">'+esc((profile?.display_name||'XY').slice(0,2).toUpperCase())+'</div><div><b>'+esc(profile?.display_name||'Anonymous')+'</b><small>'+esc(identity)+'</small></div></div></div></aside><main><header class="topbar"><div class="crumb">Mail <span>›</span> <b>'+({inbox:'Inbox',compose:'Compose',research:'Research',contacts:'Contacts',settings:'Settings'} as any)[view]+'</b></div><div class="topactions"><button class="soft" data-action="wizard">✦ Wizard</button><button class="soft" data-action="chrome">↗ Chrome</button></div></header>'+page()+'</main><aside class="rail"><span class="eyebrow">RESEARCH</span><h3>Evidence beside your mail</h3><p>Use the focused Xythol browser for quick research or open your full Chrome.</p><button class="railbtn" data-view="research">Research desk</button><button class="railbtn" data-action="chrome">Open Chrome</button></aside></div>'+(wizard?wizardView():'');
  wire();
}
function page(){
  if(view==='compose')return compose();
  if(view==='research')return research();
  if(view==='contacts')return simple('Contacts','Supabase contacts for this Xythol identity will appear here.');
  if(view==='settings')return simple('Settings','Browser, identity and delivery controls live here.');
  return inbox();
}
function inbox(){
  return '<section class="page"><div class="head"><div><span class="eyebrow">YOUR MAIL</span><h1>Inbox</h1><p>A focused home for real email work.</p></div><button class="primary" data-view="compose">New email ↗</button></div><div class="toolbar"><div class="search">⌕<input placeholder="Search mail, people, subjects"></div><button class="soft">Filter</button><button class="soft">Sort</button></div><div class="inboxgrid"><section class="panel"><div class="panelhead"><b>Inbox</b><span>0</span></div><div class="empty"><div class="emptyicon">✉</div><b>Your inbox is empty</b><span>Connect a real mailbox before Xythol displays messages.</span><button class="soft" data-view="compose">Start writing</button></div></section><section class="panel intro"><img src="/assets/branding/xythol-mark.svg"><span class="eyebrow">XYTHOL MAIL</span><h2>Research-first email.</h2><p>Write, research, and open Chrome without losing the mail workspace.</p><div class="quickgrid"><button data-view="compose"><b>Compose</b><span>Detailed editor + SMTP</span></button><button data-view="research"><b>Research</b><span>Collect evidence</span></button><button data-action="chrome"><b>Open Chrome</b><span>Full browser</span></button><button data-action="wizard"><b>Wizard</b><span>Setup Xythol</span></button></div></section></div></section>';
}
function compose(){
  return '<section class="page"><div class="head"><div><span class="eyebrow">NEW MESSAGE</span><h1>Compose</h1><p>Write clearly. Send through the Rust backend.</p></div></div><div class="composegrid"><section class="panel editor"><label>To<input id="to" placeholder="person@example.com"></label><label>Subject<input id="subject" placeholder="Subject"></label><div class="format"><button>B</button><button>I</button><button>U</button><button>• List</button><span></span><button>📎</button></div><textarea id="body" placeholder="Write your email…"></textarea><div class="editorfoot"><small>Unsynced drafts stay local.</small><div><button class="soft" data-action="save">Save draft</button><button class="primary" data-action="send">Send email ↗</button></div></div></section><aside class="panel smtp"><span class="eyebrow">DELIVERY</span><h2>SMTP</h2><p>Credentials are passed to Rust for the send and are not stored in Supabase.</p><label>Host<input id="host" placeholder="smtp.example.com"></label><label>Port<input id="port" value="587"></label><label>Username<input id="user" placeholder="you@example.com"></label><label>Password<input id="pass" type="password"></label><label>From<input id="from" placeholder="you@example.com"></label><label>Security<select id="security"><option value="starttls">STARTTLS</option><option value="tls">TLS</option><option value="plain">Plain</option></select></label></aside></div></section>';
}
function research(){
  return '<section class="page"><div class="head"><div><span class="eyebrow">RESEARCH</span><h1>Research desk</h1><p>Collect only the sources you explicitly choose.</p></div><div><button class="soft" data-action="chrome">↗ Open Chrome</button><button class="primary" data-action="browser">Open Xythol browser</button></div></div><div class="researchgrid"><section class="panel"><div class="empty"><div class="emptyicon">⌕</div><b>No sources yet</b><span>Open the research browser and capture a source when you find something useful.</span><button class="primary" data-action="browser">Start browsing</button></div></section><section class="panel"><span class="eyebrow">NOTES</span><h2>Working notes</h2><textarea class="notes" placeholder="Notes, quotes, questions…"></textarea></section></div></section>';
}
function simple(titleText:string,text:string){return '<section class="page"><div class="head"><div><span class="eyebrow">WORKSPACE</span><h1>'+esc(titleText)+'</h1><p>'+esc(text)+'</p></div></div><div class="panel"><div class="empty"><div class="emptyicon">•</div><b>No connected data yet</b><span>Xythol does not fabricate mailbox data.</span></div></div></section>'}
function wizardView(){return '<div class="overlay"><div class="wizard"><aside><img src="/assets/branding/xythol-mark.svg"><span class="eyebrow">XYTHOL SETUP</span><h2>Get things ready.</h2><p>A short wizard for identity, mail delivery and research.</p><div class="steps"><b>01 <span>Identity</span></b><b>02 <span>Mail delivery</span></b><b>03 <span>Research</span></b></div></aside><section><button class="close" data-action="close-wizard">×</button><span class="eyebrow">QUICK SETUP</span><h1>Start with your inbox.</h1><p>Your anonymous identity is connected. Configure SMTP in Compose when you are ready to send.</p><div class="wizarditem">✓ <div><b>Identity connected</b><small>'+esc(profile?.anonymous_address||'anonymous@xythol')+'</small></div></div><div class="wizarditem">✉ <div><b>Mail delivery</b><small>Real SMTP sending is handled by Rust.</small></div></div><div class="wizarditem">⌕ <div><b>Research</b><small>Open the focused browser or full Chrome.</small></div></div><div class="wizardactions"><button class="soft" data-action="close-wizard">Skip</button><button class="primary" data-action="close-wizard">Start using Xythol</button></div></section></div></div>'}
function wire(){
 document.querySelectorAll<HTMLElement>('[data-view]').forEach(el=>el.onclick=()=>{view=el.dataset.view;render()});
 document.querySelectorAll<HTMLElement>('[data-action]').forEach(el=>el.onclick=async()=>{const a=el.dataset.action;if(a==='wizard'){wizard=true;render()}else if(a==='close-wizard'){wizard=false;render()}else if(a==='chrome'){await invoke('open_chrome',{url:'https://www.google.com'})}else if(a==='browser'){await invoke('open_research_browser',{url:'https://www.google.com'})}else if(a==='save'){saveDraft()}else if(a==='send'){await sendMail()}});
}
function val(id:string){return document.querySelector<HTMLInputElement>('#'+id)?.value.trim()||''}
function saveDraft(){const d={to:val('to'),subject:val('subject'),body:document.querySelector<HTMLTextAreaElement>('#body')?.value||'',updated:Date.now()};const all=JSON.parse(localStorage.getItem('xythol-drafts')||'[]');localStorage.setItem('xythol-drafts',JSON.stringify([d,...all].slice(0,50)));status='Draft saved locally';render();view='compose';render()}
async function sendMail(){const to=val('to'),subject=val('subject'),body=document.querySelector<HTMLTextAreaElement>('#body')?.value||'';if(!/^\S+@\S+\.\S+$/.test(to)){status='Add a valid recipient';render();return}const smtp={host:val('host'),port:Number(val('port')||587),username:val('user'),password:val('pass'),from:val('from'),security:(document.querySelector<HTMLSelectElement>('#security')?.value||'starttls')};if(!smtp.host||!smtp.username||!smtp.password||!smtp.from){status='Fill SMTP settings';render();return}status='Sending…';render();try{await invoke('send_email',{smtp,message:{to:[to],subject,body}});status='Sent';alert('Email accepted by SMTP')}catch(err){status='Send failed';alert(String(err))}render()}
boot();