// ============================================================
// CHAT — Combat log & fake world chat
// ============================================================
const combatLog=[];
const COMBAT_LOG_FILTERS=['self','party','all'];
const COMBAT_LOG_FILTER_LABELS={self:'SELF',party:'PARTY',all:'ALL'};

function normalizeCombatLogFilter(filter){
  return COMBAT_LOG_FILTERS.includes(filter)?filter:'self';
}

function getCombatLogFilter(){
  if(typeof game==='undefined'||!game.settings)return'self';
  game.settings.combatLogFilter=normalizeCombatLogFilter(game.settings.combatLogFilter);
  return game.settings.combatLogFilter;
}

function setCombatLogFilter(filter){
  const next=normalizeCombatLogFilter(filter);
  if(typeof game!=='undefined'&&game.settings)game.settings.combatLogFilter=next;
  return next;
}

function classifyCombatLogActor(actor){
  if(!actor)return'self';
  if(typeof game!=='undefined'&&actor===game.player)return'self';
  if(typeof partySystem!=='undefined'&&partySystem&&typeof partySystem.isInParty==='function'&&partySystem.isInParty(actor)){
    return actor===game.player?'self':'party';
  }
  return'other';
}

function resolveCombatLogScope(meta){
  if(meta&&meta.scope)return meta.scope;
  if(meta&&meta.victim)return classifyCombatLogActor(meta.victim);
  if(meta&&meta.target)return classifyCombatLogActor(meta.target);
  if(meta&&meta.actor)return classifyCombatLogActor(meta.actor);
  return'self';
}

function shouldShowCombatLogEntry(entry, filter){
  const scope=(entry&&entry.scope)||'self';
  const active=normalizeCombatLogFilter(filter||getCombatLogFilter());
  if(active==='all')return true;
  if(active==='party')return scope==='self'||scope==='party'||scope==='system';
  return scope==='self'||scope==='system';
}

function getVisibleCombatLogEntries(limit){
  const max=Math.max(1,limit||8);
  const filter=getCombatLogFilter();
  return combatLog.filter(entry=>shouldShowCombatLogEntry(entry,filter)).slice(0,max);
}

function cycleCombatLogFilter(){
  const current=getCombatLogFilter();
  const idx=COMBAT_LOG_FILTERS.indexOf(current);
  const next=COMBAT_LOG_FILTERS[(idx+1)%COMBAT_LOG_FILTERS.length];
  setCombatLogFilter(next);
  if(typeof saveSettings==='function')saveSettings();
  return next;
}

function addLog(text,color,meta){
  combatLog.unshift({text,color:color||'#CCC',timer:10,scope:resolveCombatLogScope(meta)});
  if(combatLog.length>50)combatLog.pop();
}

const CHAT_MSGS=['WTS Rare Sword 500g','LFG Dragon raid','gg','anyone know where to farm gold?','this game is so addicting lol','selling pots cheap','need healer for boss','just got legendary drop!!','how do I get to skeleton zone?','RIP died to dragon again','ez game ez life'];
const worldChat=[];
let chatTimer=3;

function updateChat(dt){
  chatTimer-=dt;
  if(chatTimer<=0&&game.npcPlayers.length>0){chatTimer=5+Math.random()*10;
    const npc=game.npcPlayers[ri(0,game.npcPlayers.length-1)];
    worldChat.unshift({name:npc.name,text:CHAT_MSGS[ri(0,CHAT_MSGS.length-1)],timer:12});
    if(worldChat.length>20)worldChat.pop();}
  for(let i=worldChat.length-1;i>=0;i--){worldChat[i].timer-=dt;if(worldChat[i].timer<=0)worldChat.splice(i,1)}
  for(let i=combatLog.length-1;i>=0;i--){combatLog[i].timer-=dt;if(combatLog[i].timer<=0)combatLog.splice(i,1)}
}
