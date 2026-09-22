/* ================= NAVIGASI ================= */
function goHome(){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('home').classList.add('active');
}
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ================= TOAST ================= */
function toast(msg,dur=2200){
  const t=document.createElement('div');
  t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),dur);
}

/* ================= CAPACITOR FILESYSTEM ================= */
function toRel(p){ if(!p) return ''; if(p === '/storage/emulated/0') return ''; if(p.indexOf('/storage/emulated/0/') === 0) return p.substring(20); return p; }
function getFS(){ return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem; }
const DIR_EXT = 'EXTERNAL_STORAGE';
const ENC_UTF8 = 'utf8';

async function requestPermissions(){
  try{
    const status = await getFS().checkPermissions();
    if(status.publicStorage !== 'granted'){
      const req = await getFS().requestPermissions();
      if(req.publicStorage === 'granted'){
        toast('? Izin storage diberikan');
      }else{
        toast('? Izin ditolak. Buka Settings > Apps > AsepTools > Permissions');
      }
    }else{
      toast('? Izin sudah aktif');
    }
  }catch(e){
    toast('?? ' + e.message);
  }
}

/* ================= FILE MANAGER ================= */
let currentPath = '/storage/emulated/0';
let cachedFiles = [];

async function openFileManager(){
  showPage('filemanager');
  await loadDir(currentPath);
}

async function loadDir(path){
  const list = document.getElementById('file-list');
  list.innerHTML = '<div class="loading"><div class="spinner"></div><br>Memuat...</div>';
  try{
    const result = await getFS().readdir({
      path: toRel(path),
      directory: DIR_EXT
    });
    currentPath = path;
    document.getElementById('current-path').value = path;

    const files = [];
    for(const f of result.files){
      let size = 0, mtime = 0;
      try{
        const stat = await getFS().stat({
          path: toRel(path + '/' + f.name),
          directory: DIR_EXT
        });
        size = stat.size || 0;
        mtime = stat.mtime || 0;
      }catch(e){}
      files.push({
        name: f.name,
        type: f.type,
        size: size,
        mtime: mtime,
        uri: f.uri
      });
    }
    cachedFiles = files;
    renderFileList(files);
  }catch(e){
    list.innerHTML = '<div class="empty-msg">? Gagal membuka folder<br><small>'+escapeHtml(e.message)+'</small><br><br><button class="btn-secondary" onclick="requestPermissions()">? Minta Izin</button></div>';
  }
}

function renderFileList(files){
  const list = document.getElementById('file-list');
  const sortBy = document.getElementById('file-sort').value;
  files.sort((a,b)=>{
    if(a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    if(sortBy === 'name') return a.name.localeCompare(b.name);
    if(sortBy === 'date') return (b.mtime||0) - (a.mtime||0);
    if(sortBy === 'size') return (b.size||0) - (a.size||0);
    return 0;
  });

  if(files.length === 0){
    list.innerHTML = '<div class="empty-msg">? Folder kosong</div>';
    return;
  }

  list.innerHTML = files.map(f=>{
    const icon = getFileIcon(f.name, f.type);
    const meta = f.type === 'file'
      ? formatSize(f.size) + ' ? ' + formatDate(f.mtime)
      : 'Folder';
    return '<div class="file-item" onclick="onFileClick(\''+escapeAttr(f.name)+'\',\''+f.type+'\')">'+
      '<div class="fi-icon">'+icon+'</div>'+
      '<div class="fi-info">'+
        '<div class="fi-name">'+escapeHtml(f.name)+'</div>'+
        '<div class="fi-meta">'+meta+'</div>'+
      '</div>'+
      '<button class="fi-menu" onclick="event.stopPropagation();fileMenu(\''+escapeAttr(f.name)+'\',\''+f.type+'\')">?</button>'+
    '</div>';
  }).join('');
}

function filterFiles(){
  const q = document.getElementById('file-search').value.toLowerCase();
  const filtered = cachedFiles.filter(f=>f.name.toLowerCase().includes(q));
  renderFileList(filtered);
}

function getFileIcon(name, type){
  if(type === 'directory') return '?';
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    txt:'?', md:'?', json:'?', xml:'?', html:'?', htm:'?',
    css:'?', js:'?', ts:'?', py:'?', java:'?', kt:'?',
    pdf:'?', doc:'?', docx:'?', xls:'?', xlsx:'?', csv:'?',
    ppt:'?', pptx:'?', zip:'??', rar:'??', '7z':'??',
    jpg:'??', jpeg:'??', png:'??', gif:'??', webp:'??', svg:'??',
    mp3:'?', wav:'?', mp4:'?', mkv:'?', apk:'?', sh:'??'
  };
  return map[ext] || '?';
}

function formatSize(bytes){
  if(!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k,i)).toFixed(1) + ' ' + sizes[i];
}

function formatDate(ms){
  if(!ms) return '-';
  const d = new Date(ms);
  return d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
}

async function goUp(){
  if(currentPath === '/storage/emulated/0' || currentPath === '/'){
    toast('Sudah di root');
    return;
  }
  const parts = currentPath.split('/').filter(Boolean);
  parts.pop();
  await loadDir('/' + parts.join('/'));
}

async function onFileClick(name, type){
  const fullPath = currentPath + '/' + name;
  if(type === 'directory'){
    await loadDir(fullPath);
    return;
  }
  const ext = name.split('.').pop().toLowerCase();
  if(ext === 'pdf'){
    openPdf(fullPath, name);
    return;
  }
  if(isTextFile(ext)){
    openTextEditor(fullPath, name);
    return;
  }
  toast('? ' + name + ' - format belum didukung di Tahap 1');
}

function isTextFile(ext){
  return ['txt','md','json','xml','html','htm','css','js','ts','py','java','kt','sql','yml','yaml','sh','log','ini','conf','csv','c','cpp','h','php','rb','go','rs','swift'].includes(ext);
}

function fileMenu(name, type){
  const action = prompt('Aksi untuk "'+name+'":\n\n1 = Rename\n2 = Hapus\n3 = Info\n\nKetik angka:', '1');
  if(action === '1') renameItem(name, type);
  else if(action === '2') deleteItem(name, type);
  else if(action === '3') showInfo(name);
}

async function renameItem(name, type){
  const newName = prompt('Nama baru:', name);
  if(!newName || newName === name) return;
  try{
    await getFS().rename({
      from: toRel(currentPath + '/' + name),
      to: toRel(currentPath + '/' + newName),
      directory: DIR_EXT
    });
    toast('? Berhasil di-rename');
    await loadDir(currentPath);
  }catch(e){ toast('? ' + e.message); }
}

async function deleteItem(name, type){
  if(!confirm('Yakin hapus "'+name+'"?')) return;
  try{
    const path = currentPath + '/' + name;
    if(type === 'directory'){
      await getFS().rmdir({ path: toRel(path), directory: DIR_EXT, recursive: true });
    }else{
      await getFS().deleteFile({ path: toRel(path), directory: DIR_EXT });
    }
    toast('?? Dihapus');
    await loadDir(currentPath);
  }catch(e){ toast('? ' + e.message); }
}

async function showInfo(name){
  try{
    const stat = await getFS().stat({
      path: toRel(currentPath + '/' + name),
      directory: DIR_EXT
    });
    alert('Nama: '+name+'\nUkuran: '+formatSize(stat.size)+'\nTipe: '+stat.type+'\nTanggal: '+(stat.mtime ? new Date(stat.mtime).toLocaleString('id-ID') : '-')+'\nPath: '+stat.uri);
  }catch(e){ toast('? ' + e.message); }
}

function showFileMenu(){
  const action = prompt('Aksi:\n\n1 = Buat folder baru\n2 = Buat file teks\n3 = Refresh\n\nKetik angka:', '1');
  if(action === '1') createFolder();
  else if(action === '2') createTextFile();
  else if(action === '3') loadDir(currentPath);
}

async function createFolder(){
  const name = prompt('Nama folder baru:');
  if(!name) return;
  try{
    await getFS().mkdir({
      path: toRel(currentPath + '/' + name),
      directory: DIR_EXT,
      recursive: true
    });
    toast('? Folder dibuat');
    await loadDir(currentPath);
  }catch(e){ toast('? ' + e.message); }
}

async function createTextFile(){
  const name = prompt('Nama file (contoh: catatan.txt):');
  if(!name) return;
  try{
    await getFS().writeFile({
      path: toRel(currentPath + '/' + name),
      data: '',
      directory: DIR_EXT,
      encoding: ENC_UTF8
    });
    toast('? File dibuat');
    await loadDir(currentPath);
  }catch(e){ toast('? ' + e.message); }
}

/* ================= TEXT EDITOR ================= */
let editorFilePath = null;
let editorFileName = 'Untitled.txt';
let editorFontSize = 13;
let editorWrap = true;

function openTextEditor(path, name){
  editorFilePath = path || null;
  editorFileName = name || 'Untitled.txt';
  document.getElementById('editor-title').textContent = editorFileName;
  document.getElementById('editor-status').textContent = path ? 'Tersimpan' : 'Baru';
  if(path){
    loadFileContent(path);
  }else{
    document.getElementById('editor-area').value = '';
    updateLineNumbers();
  }
  showPage('texteditor');
}

async function loadFileContent(path){
  const area = document.getElementById('editor-area');
  area.value = 'Memuat...';
  try{
    const res = await getFS().readFile({
      path: toRel(path),
      directory: DIR_EXT,
      encoding: ENC_UTF8
    });
    area.value = typeof res.data === 'string' ? res.data : await res.data.text();
    updateLineNumbers();
  }catch(e){
    area.value = '';
    toast('? ' + e.message);
  }
}

async function saveTextFile(){
  const content = document.getElementById('editor-area').value;
  let path = editorFilePath;

  if(!path){
    const name = prompt('Simpan sebagai:', editorFileName);
    if(!name) return;
    path = '/storage/emulated/0/' + name;
    editorFilePath = path;
    editorFileName = name;
    document.getElementById('editor-title').textContent = name;
  }

  try{
    await getFS().writeFile({
      path: toRel(path),
      data: content,
      directory: DIR_EXT,
      encoding: ENC_UTF8
    });
    document.getElementById('editor-status').textContent = 'Tersimpan ?';
    toast('? Tersimpan');
  }catch(e){ toast('? ' + e.message); }
}

function closeTextEditor(){
  const content = document.getElementById('editor-area').value;
  if(content && document.getElementById('editor-status').textContent !== 'Tersimpan ?'){
    if(!confirm('Belum disimpan. Keluar tanpa simpan?')) return;
  }
  goHome();
}

function adjustFont(delta){
  editorFontSize = Math.max(9, Math.min(28, editorFontSize + delta));
  document.getElementById('editor-area').style.fontSize = editorFontSize + 'px';
  document.getElementById('line-numbers').style.fontSize = editorFontSize + 'px';
}

function toggleWrap(){
  editorWrap = !editorWrap;
  document.getElementById('editor-area').classList.toggle('wrap', editorWrap);
}

function editorFind(){
  const q = prompt('Cari teks:');
  if(!q) return;
  const area = document.getElementById('editor-area');
  const idx = area.value.toLowerCase().indexOf(q.toLowerCase());
  if(idx === -1){ toast('Tidak ditemukan'); return; }
  area.focus();
  area.setSelectionRange(idx, idx + q.length);
}

function updateLineNumbers(){
  const area = document.getElementById('editor-area');
  const lines = area.value.split('\n').length;
  let nums = '';
  for(let i = 1; i <= lines; i++) nums += i + '\n';
  document.getElementById('line-numbers').textContent = nums;
}

document.getElementById('editor-area').addEventListener('input', ()=>{
  updateLineNumbers();
  document.getElementById('editor-status').textContent = 'Belum disimpan';
});
document.getElementById('editor-area').addEventListener('scroll', ()=>{
  document.getElementById('line-numbers').scrollTop = document.getElementById('editor-area').scrollTop;
});

/* ================= PDF VIEWER ================= */
let pdfDoc = null;
let pdfPageNum = 1;
let pdfScale = 1.0;
let pdfRendering = false;

if(window.pdfjsLib){
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
}

function openPdfPicker(){
  openPicker('pdf', (path, name)=>{
    openPdf(path, name);
  });
}

async function openPdf(path, name){
  showPage('pdfviewer');
  document.getElementById('pdf-title').textContent = name;
  document.getElementById('pdf-page-info').textContent = 'Memuat...';
  try{
    const res = await getFS().readFile({
      path: toRel(path),
      directory: DIR_EXT
    });
    let data;
    if(typeof res.data === 'string'){
      const bin = atob(res.data);
      const arr = new Uint8Array(bin.length);
      for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      data = arr;
    }else{
      data = new Uint8Array(await res.data.arrayBuffer());
    }
    pdfDoc = await pdfjsLib.getDocument({data}).promise;
    pdfPageNum = 1;
    pdfScale = 1.0;
    await renderPdfPage();
  }catch(e){
    document.getElementById('pdf-page-info').textContent = 'Gagal';
    toast('? ' + e.message);
  }
}

async function renderPdfPage(){
  if(!pdfDoc || pdfRendering) return;
  pdfRendering = true;
  try{
    const page = await pdfDoc.getPage(pdfPageNum);
    const viewport = page.getViewport({scale: pdfScale});
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({canvasContext: ctx, viewport}).promise;
    document.getElementById('pdf-page-info').textContent = pdfPageNum + ' / ' + pdfDoc.numPages;
    document.getElementById('pdf-zoom-info').textContent = Math.round(pdfScale * 100) + '%';
  }catch(e){ toast('? ' + e.message); }
  pdfRendering = false;
}

function pdfPrev(){ if(pdfPageNum > 1){ pdfPageNum--; renderPdfPage(); } }
function pdfNext(){ if(pdfDoc && pdfPageNum < pdfDoc.numPages){ pdfPageNum++; renderPdfPage(); } }
function pdfZoom(delta){
  pdfScale = Math.max(0.4, Math.min(3.0, pdfScale + delta));
  renderPdfPage();
}
function closePdfViewer(){
  pdfDoc = null;
  goHome();
}

/* ================= PICKER MODAL ================= */
let pickerPath = '/storage/emulated/0';
let pickerFilter = null;
let pickerCallback = null;

function openPicker(filter, callback){
  pickerFilter = filter;
  pickerCallback = callback;
  pickerPath = '/storage/emulated/0';
  document.getElementById('picker-modal').classList.remove('hidden');
  document.getElementById('picker-title').textContent =
    filter === 'pdf' ? 'Pilih File PDF' : 'Pilih File';
  loadPickerDir(pickerPath);
}

function closePicker(){
  document.getElementById('picker-modal').classList.add('hidden');
}

async function loadPickerDir(path){
  const list = document.getElementById('picker-list');
  list.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try{
    const res = await getFS().readdir({
      path: toRel(path), directory: DIR_EXT
    });
    pickerPath = path;
    document.getElementById('picker-path').value = path;

    const items = res.files
      .filter(f=>{
        if(f.type === 'directory') return true;
        if(!pickerFilter) return true;
        const ext = f.name.split('.').pop().toLowerCase();
        return ext === pickerFilter;
      })
      .sort((a,b)=>{
        if(a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    list.innerHTML = items.map(f=>{
      const icon = getFileIcon(f.name, f.type);
      return '<div class="file-item" onclick="onPickerClick(\''+escapeAttr(f.name)+'\',\''+f.type+'\')">'+
        '<div class="fi-icon">'+icon+'</div>'+
        '<div class="fi-info"><div class="fi-name">'+escapeHtml(f.name)+'</div></div>'+
      '</div>';
    }).join('') || '<div class="empty-msg">Kosong</div>';
  }catch(e){
    list.innerHTML = '<div class="empty-msg">? '+escapeHtml(e.message)+'</div>';
  }
}

function onPickerClick(name, type){
  const full = pickerPath + '/' + name;
  if(type === 'directory'){
    loadPickerDir(full);
  }else{
    if(pickerCallback) pickerCallback(full, name);
    closePicker();
  }
}

function pickerGoUp(){
  if(pickerPath === '/storage/emulated/0' || pickerPath === '/') return;
  const parts = pickerPath.split('/').filter(Boolean);
  parts.pop();
  loadPickerDir('/' + parts.join('/'));
}

/* ================= HELPERS ================= */
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function escapeAttr(s){ return String(s).replace(/'/g,"\\'"); }

/* ================= INIT ================= */

function openAllFilesSettings(){
  try{
    const intent = 'intent:#Intent;action=android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION;package=com.asep.tools;end';
    window.location.href = intent;
    setTimeout(function(){
      toast('Kalau tidak terbuka, buka manual: Settings > Apps > Special access > All files access > AsepTools', 6000);
    }, 1500);
  }catch(e){
    toast('Buka manual: Settings > Apps > Special access > All files access > AsepTools', 6000);
  }
}

window.addEventListener('load', function(){
  updateLineNumbers();
  if(getFS()){
    getFS().checkPermissions().then(function(s){
      if(s.publicStorage !== 'granted'){
        toast('?? Izin storage belum aktif. Klik tombol "Minta Izin Storage" di Home.', 4000);
      }
    }).catch(function(){});
  }
});
