// ============================================================
// COMBAT — Damage calc, skills, effects, projectiles
// ============================================================
const dmgNumbers=[];
function addDmg(x,y,text,color){dmgNumbers.push({x:x+rf(-8,8),y,text,color,timer:0.8,alpha:1})}
function updateDmgNumbers(dt){for(let i=dmgNumbers.length-1;i>=0;i--){const d=dmgNumbers[i];d.timer-=dt;d.y-=60*dt;d.alpha=Math.max(0,d.timer/0.8);if(d.timer<=0)dmgNumbers.splice(i,1)}}

const effects=[];
function addEffect(x,y,type,dur){effects.push({x,y,type,dur,timer:dur})}
function updateEffects(dt){for(let i=effects.length-1;i>=0;i--){effects[i].timer-=dt;if(effects[i].timer<=0)effects.splice(i,1)}}

function screenShake(intensity,dur){game.shakeIntensity=Math.max(game.shakeIntensity,intensity);game.shakeTimer=Math.max(game.shakeTimer,dur)}

function addNotification(text,color){game.notifications.push({text,color:color||'#fff',timer:3,alpha:1})}

function calcDamage(atk,def){
  const base=atk.atk-def.def*0.5+rf(-2,2);let dmg=Math.max(1,Math.round(base));
  const crit=Math.random()<(atk.crit||0.05);if(crit)dmg*=2;return{dmg,crit};
}

function useSkill(p,idx){
  if(!p||p.isDead)return;const sk=p.skills[idx];if(!sk||sk.cdTimer>0)return;
  if(sk.reqLv&&p.level<sk.reqLv)return;
  sk.cdTimer=sk.cd;
  if(sk.heal){const amt=Math.round(p.maxHp*sk.heal);p.hp=Math.min(p.maxHp,p.hp+amt);addDmg(p.x,p.y-TILE,'+'+amt,'#44FF44');addEffect(p.x,p.y,'heal',0.8);addLog(p.name+' healed '+amt+' HP','#44FF44');sfx.spell();return}
  if(sk.buff){
    const b={...sk.buff,timer:sk.buff.dur};
    p.buffs=p.buffs.filter(x=>x.type!==b.type);
    if(b.type==='def'){b.val=Math.round(p.def*b.pct);p.def+=b.val}
    else if(b.type==='berserk'){b.atkVal=Math.round(p.atk*b.atkPct);b.defVal=Math.round(p.def*Math.abs(b.defPct));p.atk+=b.atkVal;p.def-=b.defVal}
    else if(b.type==='evasion'){b.spdVal=Math.round(p.spd*b.spdPct);p.spd+=b.spdVal}
    else if(b.type==='purify'){p.mp=Math.min(p.maxMp,p.mp+Math.round(p.maxMp*b.mpPct))}
    p.buffs.push(b);addEffect(p.x,p.y,'buff',0.6);addLog(p.name+' used '+sk.name,'#88CCFF');sfx.spell();return;
  }
  if(sk.dmgPct>0){
    const base=Math.round(p.atk*sk.dmgPct);let hit=0;
    for(const m of game.monsters){
      if(m.isDead)continue;
      const dist=Math.hypot(m.x-p.x,m.y-p.y);
      if(dist>sk.range)continue;
      const hits=sk.hits||1;
      for(let h=0;h<hits;h++){
        const dmg=Math.max(1,Math.round(base-m.def*0.5+rf(-2,2)));
        const crit=Math.random()<p.crit;const fd=crit?dmg*2:dmg;
        m.hp-=fd;addDmg(m.x,m.y-TILE,fd+(crit?'!':''),crit?'#FFD700':'#FFFFFF');
        if(crit){screenShake(4,0.15);sfx.crit()}else{sfx.hit()}
        if(sk.slow)m.slowTimer=2;
        if(m.hp<=0&&!m.isDead)killMon(m,p);hit++;
      }
      if(!sk.aoe&&!sk.piercing)break;
    }
    if(sk.healPct&&hit>0){const ha=Math.round(p.maxHp*sk.healPct);p.hp=Math.min(p.maxHp,p.hp+ha);addDmg(p.x,p.y-TILE*2,'+'+ha,'#88FF88')}
    if(hit>0){const etype=sk.aoe?'aoe':sk.heal?'heal':'slash';addEffect(p.x,p.y,etype,0.5)}
    if(p.className==='Ranger')sfx.arrow();else sfx.spell();
    addLog(p.name+' used '+sk.name,'#FFAA44');
  }
}

function killMon(m,killer){
  if(m.isDead)return;m.isDead=true;m.respawnTimer=rf(8,15);m.hp=0;
  sfx.monDeath();
  if(killer){
    gainExp(killer,m.expReward);killer.gold+=m.goldReward;killer.killCount++;
    const isPlayer=killer===game.player;
    if(isPlayer)game.killCount++;
    addLog('Killed '+m.type+'! +'+m.expReward+'XP +'+m.goldReward+'G','#FFD700');
    // Kill streak popup every 10 player kills only
    if(isPlayer&&game.killCount%10===0){game.streakPopup={text:game.killCount+' Kill Streak!',timer:2.5}}
    // Dragon: guaranteed rare+ loot + victory fanfare
    if(m.type==='dragon'){
      sfx.victoryFanfare();screenShake(8,0.4);
      const rar=['rare','epic','legendary'][ri(0,2)];
      const mult=rarMult(rar)*(1+m.level*0.1);const tr=Math.random();
      let type,name;
      if(tr<0.4){type='weapon';name=PRFX[ri(0,PRFX.length-1)]+WPNS[ri(0,WPNS.length-1)]}
      else if(tr<0.75){type='armor';name=PRFX[ri(0,PRFX.length-1)]+ARMRS[ri(0,ARMRS.length-1)]}
      else{type='accessory';name=PRFX[ri(0,PRFX.length-1)]+ACCS[ri(0,ACCS.length-1)]}
      const stats={};
      if(type==='weapon'){stats.atk=Math.round((2+m.level*1.5)*mult);if(Math.random()<0.5)stats.crit=parseFloat((0.02*mult).toFixed(2))}
      else if(type==='armor'){stats.def=Math.round((1+m.level)*mult);stats.hp=Math.round((10+m.level*5)*mult)}
      else{stats.spd=parseFloat((0.15*mult).toFixed(2));if(Math.random()<0.5)stats.mp=Math.round((5+m.level*3)*mult)}
      const item={name,type,rarity:rar,stats,level:m.level,value:Math.round((5+m.level*10)*rarMult(rar))};
      game.itemDrops.push({item,x:m.x,y:m.y,timer:60});
      addNotification('Dragon dropped '+item.name+'!',RARITY_COLORS[rar]);
    }else{
      const item=genItem(m.level);
      if(item){game.itemDrops.push({item,x:m.x,y:m.y,timer:30});addNotification(item.name,RARITY_COLORS[item.rarity])}
    }
  }
}

function updateBuffs(p,dt){
  if(!p.buffs)return;
  for(let i=p.buffs.length-1;i>=0;i--){
    const b=p.buffs[i];b.timer-=dt;
    if(b.timer<=0){
      if(b.type==='def'&&b.val)p.def-=b.val;
      if(b.type==='berserk'){if(b.atkVal)p.atk-=b.atkVal;if(b.defVal)p.def+=b.defVal}
      if(b.type==='evasion'&&b.spdVal)p.spd-=b.spdVal;
      p.buffs.splice(i,1);
    }
  }
}

function updatePlayer(dt){
  const p=game.player;if(!p)return;
  updateBuffs(p,dt);
  for(const sk of p.skills)if(sk.cdTimer>0)sk.cdTimer=Math.max(0,sk.cdTimer-dt);
  if(p.isDead){p.respawnTimer-=dt;if(p.respawnTimer<=0){p.isDead=false;p.hp=Math.round(p.maxHp*0.5);p.mp=Math.round(p.maxMp*0.5);p.x=Math.floor(MAP_W/2)*TILE+TILE/2;p.y=Math.floor(MAP_H/2)*TILE+TILE/2;addLog('Respawned at town.','#AAAAAA')}return}
  if(p.attackTimer>0)p.attackTimer-=dt;
  // Auto attack nearest monster only
  let nearest=null,nd=Infinity;
  for(const m of game.monsters){if(m.isDead)continue;const d=Math.hypot(m.x-p.x,m.y-p.y);if(d<nd){nd=d;nearest=m}}
  if(nearest&&nd<=p.attackRange&&p.attackTimer<=0){
    const r=calcDamage(p,nearest);nearest.hp-=r.dmg;
    addDmg(nearest.x,nearest.y-TILE,r.dmg+(r.crit?'!':''),r.crit?'#FFD700':'#FFFFFF');
    addEffect(nearest.x,nearest.y,'hit',0.25);
    if(r.crit){screenShake(4,0.15);sfx.crit()}else{sfx.hit()}
    p.attackTimer=1/p.spd;if(nearest.hp<=0)killMon(nearest,p);
  }
  // Regen
  if(game.time%1<dt){
    const inTown=map.getTile(Math.floor(p.x/TILE),Math.floor(p.y/TILE))===5;
    if(inTown){p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*0.05));p.mp=Math.min(p.maxMp,p.mp+Math.round(p.maxMp*0.05))}
  }
  p.animTimer+=dt;if(p.animTimer>0.15){p.frame=(p.state!=='idle')?(p.frame+1)%3:0;p.animTimer=0}
  // Ranger speed trail
  if(p.className==='Ranger'&&(p.state==='walking'||botAI.state==='approaching'||botAI.state==='roaming')){
    game.trails.push({x:p.x,y:p.y,timer:0.4,alpha:0.6})}
}
