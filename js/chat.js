// ============================================================
// CHAT — Combat log & fake world chat
// ============================================================
const combatLog=[];
function addLog(text,color){combatLog.unshift({text,color:color||'#CCC',timer:10});if(combatLog.length>50)combatLog.pop()}

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
