const $ = id => document.getElementById(id);
let vocab=[], activeProfile=0, currentView='homeView', deck=[], deckIndex=0, currentDay=1, quiz={mode:'',questions:[],index:0,correct:0,answered:false,results:[]}, lastQuizMode='mixed';
const STORE='deutschDuo.v1';
const profiles=[{id:'learner1',name:'Learner 1',initial:'A'},{id:'learner2',name:'Learner 2',initial:'B'}];
const fresh=()=>({status:{},quizHistory:[],activity:[],activeDay:1});
let allProgress={};
function loadState(){try{allProgress=JSON.parse(localStorage.getItem(STORE))||{};}catch(e){allProgress={};}profiles.forEach(p=>{if(!allProgress[p.id])allProgress[p.id]=fresh();});}
function save(){localStorage.setItem(STORE,JSON.stringify(allProgress));}
function progress(){return allProgress[profiles[activeProfile].id];}
function status(i){return progress().status[i]||'new';}
function setStatus(i,s){progress().status[i]=s; markActivity();save();renderHome();}
function markActivity(){const d=new Date().toISOString().slice(0,10);if(!progress().activity.includes(d))progress().activity.push(d);}
function mastered(){return Object.values(progress().status).filter(x=>x==='known').length;}
function practiceCount(){return Object.values(progress().status).filter(x=>x==='practice').length;}
function accuracy(){let q=progress().quizHistory;let total=q.reduce((n,x)=>n+x.total,0),correct=q.reduce((n,x)=>n+x.correct,0);return total?Math.round(correct/total*100):null;}
function streak(){let days=[...new Set(progress().activity)].sort().reverse();if(!days.length)return 0;let today=new Date(),date=s=>new Date(s+'T12:00:00');let diff=Math.floor((date(today.toISOString().slice(0,10))-date(days[0]))/86400000);if(diff>1)return 0;let n=0,expected=date(days[0]);for(const d of days){if(Math.floor((expected-date(d))/86400000)===0){n++;expected.setDate(expected.getDate()-1);}else break;}return n;}
function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));currentView=id;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('selected',b.dataset.tab===id));if(id==='homeView')renderHome();if(id==='practiceView')renderPractice();if(id==='profileView')renderProfiles();}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2100);}
function dayTitle(d){let item=vocab.find(x=>x.day===d);return item?item.lesson.replace(/^\d+\s*[–-]\s*/,''):'German vocabulary';}
function renderHome(){
 const p=progress(),known=mastered(),remaining=vocab.length-known,acc=accuracy(),d=p.activeDay||1,items=vocab.filter(x=>x.day===d),done=items.filter(x=>status(vocab.indexOf(x))==='known').length;
 $('profileName').textContent=profiles[activeProfile].name;$('profileAvatar').textContent=profiles[activeProfile].initial;
 $('masteredCount').textContent=known;$('remainingCount').textContent=remaining;$('accuracyValue').textContent=acc===null?'—':acc+'%';$('streakValue').textContent=streak();
 $('overallProgressText').textContent=known+' / '+vocab.length;$('overallProgress').style.width=(known/vocab.length*100)+'%';
 $('currentDayTag').textContent='DAY '+d+' / 30';$('currentDayTitle').textContent='Day '+d+' — '+dayTitle(d);$('todaySummary').textContent=done+' of 10 words mastered · '+(10-done)+' remaining';
 $('dayProgress').style.width=(done/10*100)+'%';$('dayProgressText').textContent=done+' / 10';
 $('startToday').onclick=()=>openDay(d);
 $('dayGrid').innerHTML=Array.from({length:30},(_,i)=>{let n=i+1,arr=vocab.map((v,j)=>({v,j})).filter(x=>x.v.day===n),k=arr.filter(x=>status(x.j)==='known').length,complete=k===10;return `<button class="day-tile ${complete?'complete':''} ${n===d?'current':''}" data-day="${n}"><b>${complete?'✓':String(n).padStart(2,'0')}</b><small>${k}/10 words</small></button>`}).join('');
 document.querySelectorAll('.day-tile').forEach(b=>b.onclick=()=>{progress().activeDay=Number(b.dataset.day);save();openDay(Number(b.dataset.day));});
}
function openDay(day){currentDay=day;progress().activeDay=day;deck=vocab.map((v,i)=>({...v,_i:i})).filter(v=>v.day===day);deckIndex=0;save();showView('cardsView');renderCard();}
function openDeck(arr,title,eyebrow){deck=arr;deckIndex=0;$('deckTitle').textContent=title;$('deckEyebrow').textContent=eyebrow;showView('cardsView');renderCard();}
function renderCard(){
 if(!deck.length){toast('No cards to show yet.');showView('homeView');return;}
 let v=deck[deckIndex];$('flashcard').classList.remove('flipped');$('cardCounter').textContent=(deckIndex+1)+' of '+deck.length;
 $('deckKnown').textContent=deck.filter(x=>status(x._i)==='known').length+' known';$('deckProgress').style.width=((deckIndex+1)/deck.length*100)+'%';
 $('frontType').textContent=v.type;$('frontWord').textContent=v.german.replace(/^(der|die|das)\s+/i,'');$('frontArticle').textContent=/^(der|die|das)\s/i.test(v.german)?v.german.match(/^(der|die|das)/i)[0].toLowerCase():'';
 $('frontLesson').textContent='LEKTION '+(v.lesson.match(/^\d+/)||[''])[0];$('backMeaning').textContent=v.english;$('backExampleDe').textContent=v.exampleDe;$('backExampleEn').textContent=v.exampleEn;
 $('knowBtn').classList.toggle('marked',status(v._i)==='known');$('practiceBtn').classList.toggle('marked',status(v._i)==='practice');
}
function nextCard(){if(deckIndex<deck.length-1){deckIndex++;renderCard();}else{toast('End of this deck');}}
function previousCard(){if(deckIndex>0){deckIndex--;renderCard();}}
function shuffleDeck(){for(let i=deck.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}deckIndex=0;renderCard();toast('Cards shuffled');}
function sayWord(){let v=deck[deckIndex];if(!v)return;if(!('speechSynthesis'in window)){toast('Speech is not available in this browser');return;}let u=new SpeechSynthesisUtterance(v.german.replace(/^(der|die|das)\s/i,''));u.lang='de-DE';u.rate=.86;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}
function renderPractice(){let arr=vocab.map((v,i)=>({...v,_i:i})).filter(v=>status(v._i)==='practice');$('practiceList').innerHTML=arr.length?arr.map(v=>`<div class="practice-item"><div><b>${esc(v.german)}</b><small>${esc(v.english)}</small></div><button data-study="${v._i}">Study →</button></div>`).join(''):'<div class="empty-state">✨<br><br>No difficult words yet.<br>Mark a card “Need more practice” and it will appear here.</div>';$('practiceStudy').disabled=!arr.length;$('practiceStudy').onclick=()=>openDeck(arr,'More practice','YOUR REVISION DECK');document.querySelectorAll('[data-study]').forEach(b=>b.onclick=()=>{openDeck(arr,'More practice','YOUR REVISION DECK');deckIndex=arr.findIndex(x=>x._i===Number(b.dataset.study));renderCard();});}
function renderProfiles(){ $('profileChoices').innerHTML=profiles.map((p,i)=>`<button class="profile-choice ${i===activeProfile?'active':''}" data-profile="${i}"><span class="avatar">${p.initial}</span><span><b>${p.name}</b><small>${Object.values(allProgress[p.id].status||{}).filter(x=>x==='known').length} words mastered</small></span>${i===activeProfile?'<span class="check">✓</span>':''}</button>`).join('');document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{activeProfile=Number(b.dataset.profile);showView('homeView');toast('Switched to '+profiles[activeProfile].name);});let p=progress(),hist=[...p.quizHistory].reverse().slice(0,5);$('profileSummary').innerHTML=`<h3>${profiles[activeProfile].name} · Learning summary</h3><p>${mastered()} words mastered · ${practiceCount()} need practice · ${streak()} day streak · ${accuracy()===null?'No quiz yet':accuracy()+'% quiz accuracy'}</p><p><b>Recent quiz scores</b></p>${hist.length?hist.map(x=>`<p class="score-line">${new Date(x.date).toLocaleDateString()} · ${esc(x.mode.toUpperCase())} · <b>${x.correct}/${x.total}</b></p>`).join(''):'<p class="tiny-note">Quiz results will appear here after the first quiz.</p>'}`;}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function makeQuestion(mode,pool){
 let v=pool[Math.floor(Math.random()*pool.length)],idx=v._i;
 let others=pool.filter(x=>x._i!==idx);
 let pick=a=>a.sort(()=>Math.random()-.5).slice(0,3);
 let opts=[],prompt='',sub='';
 if(mode==='de-en'){prompt=v.german;sub='Choose the English meaning.';opts=[v.english,...pick(others).map(x=>x.english)];}
 else if(mode==='en-de'){prompt=v.english;sub='Choose the German word.';opts=[v.german,...pick(others).map(x=>x.german)];}
 else if(mode==='article'){let article=(v.german.match(/^(der|die|das)\s/i)||[])[1];if(!article)return makeQuestion('de-en',pool);prompt=v.german.replace(/^(der|die|das)\s/i,'_____ ');sub='Which article belongs to this noun?';opts=[article,...['der','die','das'].filter(x=>x!==article).sort(()=>Math.random()-.5).slice(0,2)];}
 else if(mode==='cloze'){let term=v.german.replace(/^(der|die|das)\s/i,'').trim();let sent=v.exampleDe;let escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');let re=new RegExp(escaped,'i');if(!re.test(sent))return makeQuestion('de-en',pool);prompt=sent.replace(re,'________');sub='Choose the missing vocabulary item.';opts=[v.german,...pick(others).map(x=>x.german)];}
 else {let modes=['de-en','en-de','article','cloze'];let chosen=modes[Math.floor(Math.random()*modes.length)];if(chosen==='article'&&!/^(der|die|das)\s/i.test(v.german))chosen='de-en';return makeQuestion(chosen,pool);}
 opts=[...new Set(opts)].sort(()=>Math.random()-.5);
 return {mode,v,idx,prompt,sub,opts,answer:mode==='article'?(v.german.match(/^(der|die|das)\s/i)||[])[1]:mode==='de-en'?v.english:mode==='en-de'?v.german:mode==='cloze'?v.german:null};
}
function startQuiz(mode){
 lastQuizMode=mode;let scope=$('quizScope').value,pool=vocab.map((v,i)=>({...v,_i:i}));
 if(scope==='day')pool=pool.filter(v=>v.day===currentDay);
 if(scope==='difficult')pool=pool.filter(v=>status(v._i)==='practice');
 if(pool.length<4){toast(scope==='difficult'?'Mark some words for practice first.':'Not enough words in this question pool.');return;}
 if(mode==='article')pool=pool.filter(v=>/^(der|die|das)\s/i.test(v.german));
 if(pool.length<4){toast('Not enough nouns with articles in this pool.');return;}
 let qs=[];for(let i=0;i<10;i++)qs.push(makeQuestion(mode,pool));
 quiz={mode,questions:qs,index:0,correct:0,answered:false,results:[]};showView('quizPlayView');renderQuestion();
}
function renderQuestion(){
 let q=quiz.questions[quiz.index];$('quizModeLabel').textContent=({ 'de-en':'GERMAN → ENGLISH','en-de':'ENGLISH → GERMAN',article:'ARTICLE CHALLENGE',cloze:'MISSING WORD',mixed:'MIXED REVISION'})[quiz.mode];
 $('questionCounter').textContent='QUESTION '+(quiz.index+1)+' / '+quiz.questions.length;$('liveScore').textContent=quiz.correct+' correct';$('quizProgress').style.width=(quiz.index/quiz.questions.length*100)+'%';
 $('questionText').textContent=q.prompt;$('questionSub').textContent=q.sub;$('feedback').textContent='';$('feedback').className='feedback';$('nextQuestion').disabled=true;$('nextQuestion').textContent=quiz.index===quiz.questions.length-1?'See results →':'Continue →';quiz.answered=false;
 $('answerOptions').innerHTML=q.opts.map((o,i)=>`<button class="answer-option" data-answer="${i}">${esc(o)}</button>`).join('');
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answerQuestion(Number(b.dataset.answer)));
}
function answerQuestion(n){if(quiz.answered)return;quiz.answered=true;let q=quiz.questions[quiz.index],chosen=q.opts[n],correct=quiz.mode==='article'?q.answer: q.answer;let ok=chosen===correct;if(ok)quiz.correct++;quiz.results.push({idx:q.idx,correct:ok});document.querySelectorAll('[data-answer]').forEach((b,i)=>{b.disabled=true;if(q.opts[i]===correct)b.classList.add('correct');else if(i===n)b.classList.add('wrong');});
 let f=$('feedback');f.textContent=ok?'✓ Richtig! Well done.':'Not quite. Correct answer: '+correct;f.className='feedback '+(ok?'good':'bad');$('liveScore').textContent=quiz.correct+' correct';$('nextQuestion').disabled=false;}
function finishQuiz(){let total=quiz.questions.length,correct=quiz.correct,acc=Math.round(correct/total*100);progress().quizHistory.push({date:new Date().toISOString(),mode:quiz.mode,correct,total});markActivity();save();$('finalScore').textContent=correct+'/'+total;$('resultAccuracy').textContent=acc+'%';$('resultCorrect').textContent=correct;$('resultTotal').textContent=total;$('resultTitle').textContent=acc>=80?'Sehr gut!':acc>=60?'Gut gemacht!':'Weiter so!';$('resultMessage').textContent=acc>=80?'Excellent work. Keep your daily rhythm.':acc>=60?'Good progress. A little revision will make it stick.':'Every attempt helps. Review the tricky words and try again.';showView('resultsView');}
function exportData(){let blob=new Blob([JSON.stringify({profile:profiles[activeProfile],progress:progress()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='deutsch-duo-'+profiles[activeProfile].id+'-progress.json';a.click();URL.revokeObjectURL(url);toast('Progress backup exported');}
function importData(file){let reader=new FileReader();reader.onload=()=>{try{let obj=JSON.parse(reader.result);if(!obj.progress||typeof obj.progress.status!=='object')throw Error('Invalid file');allProgress[profiles[activeProfile].id]=obj.progress;save();renderHome();toast('Progress imported');}catch(e){toast('Could not read that progress file');}};reader.readAsText(file);}
async function init(){try{let res=await fetch('vocabulary.json');vocab=await res.json();if(!Array.isArray(vocab)||vocab.length!==300)throw Error('Vocabulary data did not load');}catch(e){document.querySelector('main').innerHTML='<div class="empty-state">The vocabulary database could not be loaded. Please open this app through its local web server or HTTPS hosting.</div>';return;}
 loadState();renderHome();
 $('profileButton').onclick=()=>showView('profileView');$('flashcard').onclick=()=> $('flashcard').classList.toggle('flipped');$('speakBtn').onclick=sayWord;$('prevCard').onclick=previousCard;$('nextCard').onclick=nextCard;$('shuffleBtn').onclick=shuffleDeck;
 $('knowBtn').onclick=()=>{setStatus(deck[deckIndex]._i,'known');toast('Marked as known ✓');nextCard();};
 $('practiceBtn').onclick=()=>{setStatus(deck[deckIndex]._i,'practice');toast('Added to your revision list');nextCard();};
 $('reviewAllBtn').onclick=()=>openDeck(vocab.map((v,i)=>({...v,_i:i})),'All vocabulary','COMPLETE REVISION');
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{if(b.dataset.tab==='cardsView'){let d=progress().activeDay||1;openDay(d);}else showView(b.dataset.tab);});
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.mode));
 $('nextQuestion').onclick=()=>{if(quiz.index<quiz.questions.length-1){quiz.index++;renderQuestion();}else finishQuiz();};
 $('tryAgain').onclick=()=>startQuiz(lastQuizMode);$('exportProgress').onclick=exportData;$('importProgress').onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value='';};
 if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
}
init();