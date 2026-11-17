'use strict';
const $=id=>document.getElementById(id);
const cfg=window.STUDY_CARDS_CONFIG;
let t=null,api=null,boardId=null,rows=[],busy=false;
const status=s=>{$('status').textContent=s};
const connection=s=>{$('connection').textContent=s};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const validKey=()=>cfg.appKey && cfg.appKey!=='HIER_DEIN_TRELLO_API_KEY';

// CSV tokenizer: quoted fields, escaped quotes, CRLF and newlines inside quoted fields.
function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');
  const sample=text.split(/\r?\n/).find(s=>s.trim())||'';
  const count=(str,sep)=>{let n=0,q=false;for(let i=0;i<str.length;i++){if(str[i]==='"'){if(q&&str[i+1]==='"'){i++;continue}q=!q}else if(!q&&str[i]===sep)n++}return n};
  const delimiter=count(sample,';')>count(sample,',')?';':',';
  let out=[],record=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){field+='"';i++}
      else if(quoted){quoted=false}
      else if(field===''){quoted=true}
      else field+=ch;
    }else if(ch===delimiter&&!quoted){record.push(field);field=''}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;record.push(field);if(record.some(v=>v.trim()))out.push(record);record=[];field=''}
    else field+=ch;
  }
  if(quoted)throw new Error('CSV enthält ein nicht geschlossenes Anführungszeichen.');
  record.push(field);if(record.some(v=>v.trim()))out.push(record);
  return out;
}
function normalizeHeader(h){return h.trim().toLowerCase().replace(/[^a-z0-9äöüß]/g,'')}
function readCards(text){
  const matrix=parseCSV(text);
  if(!matrix.length)throw new Error('Die CSV-Datei ist leer.');
  const headers=matrix[0].map(normalizeHeader);
  const aliases={title:['vorderseite','frage','titel','title','front','name'],answer:['rückseite','rueckseite','antwort','answer','back','beschreibung','description'],subject:['fach','thema','subject','topic'],level:['schwierigkeit','level','niveau','difficulty']};
  const col={};for(const [k,names] of Object.entries(aliases))col[k]=headers.findIndex(h=>names.includes(h));
  if(col.title<0||col.answer<0)throw new Error('CSV-Kopfzeile benötigt „Vorderseite“ und „Rückseite“ (oder Frage/Antwort).');
  const cards=matrix.slice(1).map((r,i)=>({line:i+2,title:(r[col.title]||'').trim(),answer:(r[col.answer]||'').trim(),subject:col.subject>=0?(r[col.subject]||'').trim():'',level:col.level>=0?(r[col.level]||'').trim():''}));
  const invalid=cards.filter(c=>!c.title||!c.answer);
  if(invalid.length)throw new Error('Leere Frage/Antwort in CSV-Zeile(n): '+invalid.slice(0,10).map(x=>x.line).join(', '));
  if(cards.length>2000)throw new Error('Maximal 2.000 Karten pro Import. Bitte Datei aufteilen.');
  return cards;
}
function showPreview(){
  $('summary').textContent=`${rows.length} gültige Lernkarten erkannt. Die ersten ${Math.min(30,rows.length)} werden angezeigt.`;
  const table=document.createElement('table');
  const head=document.createElement('tr');['#','Vorderseite','Rückseite','Fach','Level'].forEach(x=>{let th=document.createElement('th');th.textContent=x;head.appendChild(th)});table.appendChild(head);
  rows.slice(0,30).forEach((r,i)=>{const tr=document.createElement('tr');[i+1,r.title,r.answer,r.subject,r.level].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});table.appendChild(tr)});
  $('preview').replaceChildren(table);
}
function canImport(){ $('import').disabled=busy||!rows.length||!api||!boardId||!$('list').value; }
async function request(path,method='GET',body=null){
  const token=await api.getToken();if(!token)throw new Error('Trello-Autorisierung fehlt.');
  const url=new URL('https://api.trello.com/1'+path);
  url.searchParams.set('key',cfg.appKey);url.searchParams.set('token',token);
  const options={method};if(body){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body)}
  const response=await fetch(url,options);
  if(!response.ok){let details=await response.text();throw new Error('Trello API '+response.status+': '+details.slice(0,180))}
  return response.json();
}
async function loadLists(){
  const lists=await request('/boards/'+encodeURIComponent(boardId)+'/lists?filter=open&fields=name');
  $('list').replaceChildren();for(const list of lists){const opt=document.createElement('option');opt.value=list.id;opt.textContent=list.name;$('list').appendChild(opt)}
  $('list').disabled=!lists.length;canImport();
}
async function connect(){
  if(!validKey()){connection('API-Key fehlt: Trage ihn in config.js ein.');return}
  if(!window.TrelloPowerUp){connection('Trello-Bibliothek konnte nicht geladen werden.');return}
  // This iframe helper is only meaningful inside Trello; standalone page is a CSV preview.
  if(window.top===window.self){connection('Vorschau-Modus: Öffne dieses Power-Up in deinem Trello-Board, um Karten zu importieren.');return}
  try{
    t=window.TrelloPowerUp.iframe({appKey:cfg.appKey,appName:cfg.appName});
    boardId=t.getContext().board;
    if(!boardId){connection('Kein Trello-Board erkannt. Öffne den Importer über den Board-Button.');return}
    api=await t.getRestApi();
    if(await api.isAuthorized()){
      connection('✅ Mit Trello verbunden.');$('authorize').disabled=true;await loadLists();
    }else{connection('Trello-Zugriff noch nicht autorisiert.');$('authorize').disabled=false}
  }catch(e){connection('Verbindung fehlgeschlagen: '+e.message)}
}
$('authorize').addEventListener('click',async()=>{
  try{
    // Explicit user click is required to avoid popup blocking.
    await api.authorize({scope:'read,write',expiration:'never'});
    connection('✅ Mit Trello verbunden.');$('authorize').disabled=true;await loadLists();
  }catch(e){connection('Autorisierung fehlgeschlagen oder abgebrochen: '+e.message)}
});
$('csvFile').addEventListener('change',async e=>{
  rows=[];$('preview').replaceChildren();$('summary').textContent='';$('progress').value=0;
  const file=e.target.files[0];if(!file){canImport();return}
  try{
    if(file.size>5*1024*1024)throw new Error('Datei zu groß (maximal 5 MB).');
    const text=await file.text();rows=readCards(text);
    $('fileInfo').textContent='✅ '+file.name+' · '+rows.length+' Karten';showPreview();status('CSV-Datei geladen.');
  }catch(err){$('fileInfo').textContent='❌ '+err.message;status('CSV konnte nicht gelesen werden.');}
  canImport();
});
$('reset').addEventListener('click',()=>{$('csvFile').value='';rows=[];$('fileInfo').textContent='Noch keine Datei ausgewählt.';$('summary').textContent='Bitte CSV-Datei auswählen.';$('preview').replaceChildren();$('progress').value=0;status('Bereit.');canImport()});
$('list').addEventListener('change',canImport);
$('import').addEventListener('click',async()=>{
  if(busy||!rows.length||!api||!boardId||!$('list').value)return;
  const listId=$('list').value;
  if(!confirm(`${rows.length} Lernkarten in die gewählte Trello-Liste importieren?`))return;
  busy=true;canImport();$('errors').textContent='';let created=0,skipped=0,failed=0;const errors=[];
  try{
    let existing=new Set();
    if($('skipDuplicates').checked){
      // Fetch all open cards in the target list, not only the first 1000.
      let before=null;
      do{
        const query='?fields=name&limit=1000'+(before?'&before='+encodeURIComponent(before):'');
        const page=await request('/lists/'+encodeURIComponent(listId)+'/cards'+query);
        page.forEach(c=>existing.add(c.name.trim().toLocaleLowerCase()));
        if(page.length<1000)break;
        before=page[page.length-1].id;
      }while(before);
    }
    for(let i=0;i<rows.length;i++){
      const c=rows[i],key=c.title.toLocaleLowerCase();
      if($('skipDuplicates').checked&&existing.has(key)){skipped++}
      else{
        const desc='## Antwort\n'+c.answer+'\n\n**Fach:** '+(c.subject||'–')+'\n**Schwierigkeit:** '+(c.level||'–')+'\n\n🧠 Lernkarte';
        try{await request('/cards','POST',{idList:listId,name:c.title,desc});created++;existing.add(key)}
        catch(e){failed++;errors.push('Zeile '+c.line+': '+e.message)}
      }
      $('progress').value=Math.round((i+1)/rows.length*100);
      status(`Import läuft: ${i+1}/${rows.length}\nErstellt: ${created} · Übersprungen: ${skipped} · Fehler: ${failed}`);
      if(i<rows.length-1)await pause(120);
    }
    status(`Import abgeschlossen.\nErstellt: ${created} · Übersprungen: ${skipped} · Fehler: ${failed}`);
    if(errors.length)$('errors').textContent=errors.slice(0,20).join('\n');
  }catch(e){status('Import abgebrochen: '+e.message)}
  finally{busy=false;canImport()}
});
connect();
