const buttons = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('[data-category]');
buttons.forEach(button => button.addEventListener('click', () => {
  buttons.forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  updateProjects();
}));
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu(); menuButton.focus();
  }
});
if(document.querySelector('#year'))document.querySelector('#year').textContent = new Date().getFullYear();

// Native <summary> remains the keyboard and screen-reader control.
// Clicking non-interactive card space offers the same action to pointer users.
projects.forEach(project => project.addEventListener('click', event => {
  if (event.target.closest('a, button, summary, details') || getSelection()?.toString()) return;
  const detail = project.querySelector('details');
  if(detail)detail.open = !detail.open;
}));
matchMedia('(min-width: 651px)').addEventListener('change', () => closeMenu());

const searchInput = document.querySelector('#project-search');
function updateProjects() {
  const category = document.querySelector('[data-filter][aria-pressed="true"]').dataset.filter;
  const query = searchInput.value.trim().toLowerCase();
  let count = 0;
  projects.forEach(project => {
    project.hidden = !(category === 'all' || project.dataset.category === category) || !((project.textContent + " " + (project.dataset.searchEnglish || "")).toLowerCase().includes(query));
    if (!project.hidden) count++;
  });
  document.querySelector('.filter-status').textContent = (document.documentElement.lang === 'zh-CN' ? `显示 ${count} 个项目` : `Showing ${count} projects`);
  document.querySelector('.empty-projects').hidden = count !== 0;
}
searchInput.addEventListener('input', updateProjects);
document.querySelector('#reset-projects').addEventListener('click', () => {
  searchInput.value = '';
  document.querySelector('[data-filter="all"]').click();
  searchInput.focus();
});
document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText('qumeihui2026@163.com');
    status.textContent = document.documentElement.lang === 'zh-CN' ? '邮箱地址已复制。' : 'Email address copied.';
  } catch {
    status.textContent = document.documentElement.lang === 'zh-CN' ? '无法自动复制，请手动复制：qumeihui2026@163.com' : 'Copy is unavailable here. Select and copy: qumeihui2026@163.com';
  }
});
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const body = `Name: ${data.get('name')}\nReply email: ${data.get('email')}\n\n${data.get('message')}`;
  const output=document.querySelector('#prepared-message');
  output.value=`Subject: ${data.get('subject')}\n\n${body}`;
  output.hidden=false; output.focus(); output.select();
  document.querySelector('#mail-status').textContent=document.documentElement.lang==='zh-CN'?'正文已生成，请复制后通过邮箱或聊天应用发送；网站未发送任何内容。':'Message prepared. Copy it into your email or messaging app; nothing has been sent.';
});
let printState;
function preparePrint() {
  if (printState) return;
  printState = [...projects].map(project => ({project, hidden:project.hidden, open:project.querySelector('details')?.open}));
  printState.forEach(({project}) => {project.hidden=false;if(project.querySelector('details'))project.querySelector('details').open=true;});
}
function restorePrint() {
  printState?.forEach(({project,hidden,open})=>{project.hidden=hidden;if(project.querySelector('details'))project.querySelector('details').open=open;});
  printState=undefined;
}
window.addEventListener('beforeprint',preparePrint);
window.addEventListener('afterprint',restorePrint);
document.querySelector('#print-profile')?.addEventListener('click',()=>{preparePrint();window.print();});

// Store original text nodes once; translate without replacing HTML or form values.
projects.forEach(project=>project.dataset.searchEnglish=project.textContent);
const textNodes=[];
const normaliseTranslationKey=text=>text.replace(/\s*[–—]\s*/g,' — ');
const normalisedChinese=new Map(Object.entries(window.portfolioChinese).map(([key,value])=>[normaliseTranslationKey(key),value]));
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
while(walker.nextNode()){
 const node=walker.currentNode;
 if(!node.parentElement.closest('script,style,textarea,select,[data-en],#copy-status,#mail-status,.filter-status') && node.textContent.trim()) textNodes.push([node,node.textContent]);
}
function applyLanguage(language){
 const chinese=language==='zh';
 document.documentElement.lang=chinese?'zh-CN':'en';
 textNodes.forEach(([node,original])=>{
  const key=original.trim();const translated=window.portfolioChinese[key] ?? normalisedChinese.get(normaliseTranslationKey(key));
  node.textContent=chinese && translated!==undefined?original.replace(key,translated.replace(/\s*[–—]\s*/g,' — ')):original;
 });
 document.querySelectorAll('[data-en]').forEach(element=>element.textContent=element.dataset[chinese?'zh':'en']);
 document.querySelector('#language-select').value=language;
 searchInput.placeholder=chinese?'搜索项目名称、技术或方法':'Search title, technology or method';
 document.querySelector('#navigation').setAttribute('aria-label',chinese?'主要导航':'Main navigation');
 document.querySelector('#motion-select').setAttribute('aria-label',chinese?'动态效果设置':'Motion preference');
 projects.forEach(project=>project.setAttribute('aria-label',chinese?'项目卡片；使用展开项目详情查看内容':'Project card; use Explore project details to expand'));
 document.title=chinese?'曲美慧 | 个人工程作品集':'Meihui Qu | Engineering portfolio';
 document.querySelector('#copy-status').textContent='';document.querySelector('#mail-status').textContent='';
 updateProjects();
 try{localStorage.setItem('portfolio-language',language);}catch{}
}
document.querySelector('#language-select').addEventListener('change',event=>applyLanguage(event.target.value));
let language='en';try{language=localStorage.getItem('portfolio-language')==='zh'?'zh':'en';}catch{}
applyLanguage(language);
const motionMedia=matchMedia('(prefers-reduced-motion: reduce)');
const revealSections=[...document.querySelectorAll('main>section')];
let revealObserver;
function updateMotion(){
 const reduced=document.querySelector('#motion-select').value==='reduce'||motionMedia.matches;
 document.documentElement.dataset.motion=reduced?'reduce':'auto';
 revealObserver?.disconnect();
 revealSections.forEach(section=>section.classList.remove('reveal-pending'));
 if(reduced || !('IntersectionObserver' in window))return;
 revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');revealObserver.unobserve(entry.target);}
 }),{threshold:0,rootMargin:'0px 0px 40px 0px'});
 revealSections.forEach(section=>{
  if(section.getBoundingClientRect().top>innerHeight){section.classList.add('reveal-pending');revealObserver.observe(section);}
 });
}
document.querySelector('#motion-select').addEventListener('change',event=>{
 try{localStorage.setItem('portfolio-motion',event.target.value);}catch{}
 updateMotion();
});
try{if(localStorage.getItem('portfolio-motion')==='reduce')document.querySelector('#motion-select').value='reduce';}catch{}
motionMedia.addEventListener('change',updateMotion);
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>revealSections.forEach(section=>section.classList.remove('reveal-pending'))));
document.addEventListener('focusin',event=>event.target.closest('.reveal-pending')?.classList.remove('reveal-pending'));
document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
updateMotion();

// Compact language control; keep the underlying select as the shared state.
document.querySelector('#language-toggle').addEventListener('click',()=>{
 applyLanguage(document.documentElement.lang==='zh-CN'?'en':'zh');
 renderGallery();
});
const themeButton=document.querySelector('#theme-toggle');
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
let selectedTheme;
try{selectedTheme=localStorage.getItem('portfolio-theme');}catch{}
function setTheme(theme){
 document.documentElement.dataset.theme=theme;
 themeButton.setAttribute('aria-pressed',String(theme==='dark'));
 themeButton.setAttribute('aria-label',document.documentElement.lang==='zh-CN'?(theme==='dark'?'切换白天模式':'切换夜间模式'):(theme==='dark'?'Switch to light mode':'Switch to dark mode'));
 document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#18191b':'#faf9f6';
}
setTheme(selectedTheme==='dark'||selectedTheme==='light'?selectedTheme:systemTheme.matches?'dark':'light');
themeButton.addEventListener('click',()=>{
 selectedTheme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(selectedTheme);
 try{localStorage.setItem('portfolio-theme',selectedTheme);}catch{}
});
systemTheme.addEventListener('change',event=>{if(!selectedTheme)setTheme(event.matches?'dark':'light');});

// Manual gallery: no autoplay or borrowed imagery; selected files stay local.
let galleryIndex=0;
let galleryPhotos=[
 {url:'assets/photos/project-01.png',projectIndex:0,part:0,fit:'contain',position:'50% 50%'},
 {url:'assets/photos/project-02.jpg',projectIndex:1,part:0,position:'58% 54%'},
 {url:'assets/photos/project-03-display.jpg',projectIndex:2,part:1,position:'50% 48%'},
 {url:'assets/photos/project-03-sensor.jpg',projectIndex:2,part:2,position:'50% 62%'},
 {url:'assets/photos/project-04.jpg',projectIndex:3,part:0,position:'50% 62%'}
];
const galleryTitles=[...projects].map(project=>project.querySelector('h3'));
const galleryImage=document.querySelector('#gallery-image');
const galleryDots=document.querySelector('.gallery-dots');
function galleryLength(){return galleryPhotos.length||galleryTitles.length;}
function renderGallery(){
 const length=galleryLength();galleryIndex=(galleryIndex+length)%length;
 const photo=galleryPhotos[galleryIndex];
 galleryImage.hidden=!photo;document.querySelector('#gallery-placeholder').hidden=Boolean(photo);
 if(photo){galleryImage.src=photo.url;galleryImage.alt=galleryTitles[photo.projectIndex]?.textContent||photo.name||'Project photograph';galleryImage.dataset.fit=photo.fit||'cover';galleryImage.style.setProperty('--photo-position',photo.position||'50% 50%');}else{galleryImage.removeAttribute('src');galleryImage.alt='';}
 document.querySelector('#gallery-title').textContent=photo?(galleryTitles[photo.projectIndex]?.textContent||photo.name)+(photo.part?` (${photo.part}/2)`:''):galleryTitles[galleryIndex].textContent;
 document.querySelector('#gallery-count').textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(length).padStart(2,'0')}`;
 if(galleryDots.children.length!==length){
  galleryDots.replaceChildren();
  for(let index=0;index<length;index++){
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`Photo ${index+1}`);
   button.addEventListener('click',()=>{galleryIndex=index;renderGallery();});galleryDots.append(button);
  }
 }
 [...galleryDots.children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index===galleryIndex)));
 document.querySelector('#gallery-prev').disabled=length<2;document.querySelector('#gallery-next').disabled=length<2;
 const chinese=document.documentElement.lang==='zh-CN';
 document.querySelector('#gallery-prev').setAttribute('aria-label',chinese?'上一张照片':'Previous photograph');
 document.querySelector('#gallery-next').setAttribute('aria-label',chinese?'下一张照片':'Next photograph');
 [...galleryDots.children].forEach((button,index)=>button.setAttribute('aria-label',chinese?`第 ${index+1} 张照片`:`Photo ${index+1}`));
 themeButton.setAttribute('aria-label',chinese?(document.documentElement.dataset.theme==='dark'?'切换白天模式':'切换夜间模式'):(document.documentElement.dataset.theme==='dark'?'Switch to light mode':'Switch to dark mode'));
}
document.querySelector('#gallery-prev').addEventListener('click',()=>{galleryIndex--;renderGallery();});
document.querySelector('#gallery-next').addEventListener('click',()=>{galleryIndex++;renderGallery();});
document.querySelector('.project-gallery').addEventListener('keydown',event=>{
 if(event.target.matches('input'))return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();galleryIndex+=event.key==='ArrowRight'?1:-1;renderGallery();}
});
galleryImage.addEventListener('error',()=>{galleryImage.hidden=true;document.querySelector('#gallery-placeholder').hidden=false;});
renderGallery();

document.querySelector('#language-select').addEventListener('change',renderGallery);
projects.forEach((project,index)=>project.addEventListener('click',event=>{
 if(event.target.closest('a,button,summary,details'))return;
 const first=galleryPhotos.findIndex(photo=>photo.projectIndex===index);
 if(first>=0){galleryIndex=first;renderGallery();}
}));

// Public shared comments are read anonymously; posting is authenticated on GitHub.
// No access token, visitor form data or private local notes are sent by this page.
const publicGuestbookAPI='https://api.github.com/repos/qmh127/cw1-ai-generated/issues/2/comments?per_page=100';
let publicComments=[],guestbookState='idle',guestbookLoading=false;
function renderPublicGuestbook(){
 const chinese=document.documentElement.lang==='zh-CN';
 const list=document.querySelector('#guestbook-list');list.replaceChildren();
 list.setAttribute('aria-busy',String(guestbookLoading));
 const status=document.querySelector('#guestbook-status');
 status.textContent=guestbookState==='loading'?(chinese?'正在读取公开留言…':'Loading public comments…'):guestbookState==='error'?(chinese?'暂时无法读取留言。请重试，或点击“在 GitHub 查看全部”；仍可前往 GitHub 留言。':'Comments could not be loaded. Retry or use View all on GitHub; you can still post there.'):'';
 document.querySelector('#guestbook-empty').hidden=guestbookState!=='ready'||publicComments.length!==0;
 publicComments.forEach(comment=>{
  const article=document.createElement('article');article.className='guestbook-note';
  const header=document.createElement('header');const author=document.createElement('strong');author.textContent=comment.user?.login||'GitHub user';
  const time=document.createElement('time');const date=new Date(comment.created_at);
  if(Number.isFinite(date.getTime())){time.dateTime=date.toISOString();time.textContent=date.toLocaleString(chinese?'zh-CN':'en-GB',{dateStyle:'medium',timeStyle:'short'});}
  const link=document.createElement('a');link.href=`https://github.com/qmh127/cw1-ai-generated/issues/2#issuecomment-${comment.id}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent=chinese?'查看 / 回复':'View / Reply';
  header.append(author,time,link);const body=document.createElement('p');body.textContent=comment.body||'';article.append(header,body);list.append(article);
 });
 document.querySelector('#guestbook-refresh').disabled=guestbookLoading;
}
async function loadPublicGuestbook(){
 if(guestbookLoading)return;
 guestbookLoading=true;guestbookState='loading';renderPublicGuestbook();
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(publicGuestbookAPI,{headers:{Accept:'application/vnd.github+json'},credentials:'omit',signal:controller.signal});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const data=await response.json();if(!Array.isArray(data))throw new Error('Invalid comments response');
  publicComments=data.filter(item=>Number.isSafeInteger(item.id)&&typeof item.body==='string').reverse();guestbookState='ready';
 }catch{guestbookState='error';}
 finally{clearTimeout(timer);guestbookLoading=false;renderPublicGuestbook();}
}
document.querySelector('#guestbook-refresh').addEventListener('click',loadPublicGuestbook);
document.querySelector('#language-toggle').addEventListener('click',renderPublicGuestbook);
document.querySelector('#language-select').addEventListener('change',renderPublicGuestbook);
// Avoid blocking initial rendering or fetching comments before visitors reach them.
if('IntersectionObserver' in window){
 const commentsObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){commentsObserver.disconnect();loadPublicGuestbook();}},{rootMargin:'250px'});
 commentsObserver.observe(document.querySelector('#guestbook'));
}else loadPublicGuestbook();

// Upgrade to an inline composer only after the repository has Giscus installed.
// Until then, or if the external service fails, retain the working Issue guestbook.
(()=>{
 const section=document.querySelector('#guestbook');
 const fallback=[...section.children].filter(el=>!el.matches('.eyebrow,h2'));
 let host,activated=false,timeout;
 const config=()=>({lang:document.documentElement.lang==='zh-CN'?'zh-CN':'en',theme:document.documentElement.dataset.theme==='dark'?'dark_dimmed':'light'});
 function sync(){
  const frame=host?.querySelector('iframe.giscus-frame');
  if(frame)frame.contentWindow.postMessage({giscus:{setConfig:config()}},'https://giscus.app');
 }
 function restore(){
  clearTimeout(timeout);host?.remove();host=null;activated=false;
  fallback.forEach(el=>{if(el.id!=='guestbook-empty')el.hidden=false;});
  renderPublicGuestbook();
 }
 window.addEventListener('message',event=>{
  if(event.origin!=='https://giscus.app'||!host)return;
  const frame=host.querySelector('iframe.giscus-frame');
  if(!frame||event.source!==frame.contentWindow)return;
  const data=event.data?.giscus;
  if(!data||typeof data!=='object')return;
  if(data.error){restore();return;}
  if(Number(data.resizeHeight)>0){
   clearTimeout(timeout);
   if(!activated){activated=true;fallback.forEach(el=>el.hidden=true);sync();}
  }
 });
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-theme']});
 async function mount(){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch('https://giscus.app/api/discussions/categories?repo=qmh127%2Fcw1-ai-generated',{credentials:'omit',signal:controller.signal});
   if(!response.ok)return;
   const data=await response.json();
   const category=data.categories?.find(item=>item.name==='Announcements');
   if(data.repositoryId!=='R_kgDOVTSALg'||!category?.id)return;
   host=document.createElement('div');host.className='giscus';host.style.marginTop='24px';
   section.insertBefore(host,fallback[0]);
   const script=document.createElement('script');script.src='https://giscus.app/client.js';script.async=true;script.crossOrigin='anonymous';
   const current=config();
   const settings={repo:'qmh127/cw1-ai-generated','repo-id':data.repositoryId,category:category.name,'category-id':category.id,mapping:'specific',term:'Meihui Qu Portfolio Guestbook',strict:'1','reactions-enabled':'1','emit-metadata':'0','input-position':'top',theme:current.theme,lang:current.lang,loading:'lazy'};
   Object.entries(settings).forEach(([key,value])=>script.setAttribute('data-'+key,value));
   script.addEventListener('error',restore,{once:true});
   timeout=setTimeout(()=>{if(!activated)restore();},20000);
   host.append(script);
  }catch{/* Keep the existing guestbook available. */}
  finally{clearTimeout(timer);}
 }
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();mount();}
  },{rootMargin:'250px'});observer.observe(section);
 }else mount();
})();
