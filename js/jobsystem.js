// ============================================================
// JOB LEVEL SYSTEM — Separate job level, skill leveling, passives
// ============================================================

// --- Job EXP formula ---
function jobExpToNext(jlv){return jlv*80+jlv*jlv*8}

// --- Job passives per class at milestones ---
const JOB_PASSIVES={
  Knight:{
    10:{name:'Iron Body',desc:'5% chance to take 0 damage',type:'ironBody',val:0.05},
    20:{name:'Fortress',desc:'+15% max HP',type:'hpMult',val:0.15},
    30:{name:'Warlord',desc:'+20% ATK',type:'atkMult',val:0.20}
  },
  Mage:{
    10:{name:'Mana Surge',desc:'10% chance skills cost 0 MP',type:'manaSurge',val:0.10},
    20:{name:'Arcane Mind',desc:'+15% max MP',type:'mpMult',val:0.15},
    30:{name:'Spellweaver',desc:'-20% all cooldowns',type:'cdMult',val:0.20}
  },
  Ranger:{
    10:{name:'Quick Draw',desc:'15% chance no cooldown on skill',type:'quickDraw',val:0.15},
    20:{name:'Wind Walker',desc:'+15% SPD',type:'spdMult',val:0.15},
    30:{name:'Deadeye',desc:'+20% ATK',type:'atkMult',val:0.20}
  },
  Priest:{
    10:{name:'Blessed',desc:'Passive 1% HP regen/sec',type:'hpRegen',val:0.01},
    20:{name:'Divine Grace',desc:'+15% DEF',type:'defMult',val:0.15},
    30:{name:'Miracle',desc:'+30% heal effectiveness',type:'healMult',val:0.30}
  }
};

const SKILL_LEVEL_MAX=10;

// --- Job Level Up ---
function jobLevelUp(p){
  if(p.jobLevel>=30)return;
  p.jobLevel++;
  p.skillPoints++;
  addLog(p.name+' reached Job Level '+p.jobLevel+'!','#00CED1');
  if(p===game.player){
    addNotification('Job Level '+p.jobLevel+'!','#00CED1');
    addEffect(p.x,p.y,'jobLevelUp',1.5);
    sfx.spell();
  }
  // Apply milestone passives
  const cls=p._baseClassName||p.className;
  const passives=JOB_PASSIVES[cls];
  if(passives&&passives[p.jobLevel]){
    applyJobPassive(p,passives[p.jobLevel]);
    if(p===game.player)addNotification('Unlocked: '+passives[p.jobLevel].name,'#FFD700');
  }
}

function applyJobPassive(p,passive){
  if(!p._jobPassives)p._jobPassives={};
  if(p._jobPassives[passive.type])return; // already applied
  p._jobPassives[passive.type]=passive.val;
  switch(passive.type){
    case'hpMult':p.maxHp=Math.round(p.maxHp*(1+passive.val));p.hp=Math.min(p.hp,p.maxHp);break;
    case'mpMult':p.maxMp=Math.round(p.maxMp*(1+passive.val));p.mp=Math.min(p.mp,p.maxMp);break;
    case'atkMult':p.atk=Math.round(p.atk*(1+passive.val));break;
    case'defMult':p.def=Math.round(p.def*(1+passive.val));break;
    case'spdMult':p.spd=parseFloat((p.spd*(1+passive.val)).toFixed(2));break;
    // ironBody, manaSurge, quickDraw, hpRegen, healMult, cdMult — checked at runtime
  }
}

function applyAllJobPassives(p){
  const cls=p._baseClassName||p.className;
  const passives=JOB_PASSIVES[cls];
  if(!passives)return;
  for(const lv of[10,20,30]){
    if(p.jobLevel>=lv&&passives[lv])applyJobPassive(p,passives[lv]);
  }
}

// --- Gain Job EXP ---
function gainJobExp(p,amt){
  if(!p||p.jobLevel>=30)return;
  p.jobExp+=amt;
  while(p.jobExp>=jobExpToNext(p.jobLevel)&&p.jobLevel<30){
    p.jobExp-=jobExpToNext(p.jobLevel);
    jobLevelUp(p);
  }
  if(p.jobLevel>=30)p.jobExp=0;
}

// --- Catch-up: grant missed job levels based on kill count ---
function jobLevelCatchUp(p){
  if(!p||p.jobLevel>=30)return;
  // Estimate expected job level from total kill count and player level
  const kc=p.killCount||0;
  if(kc<5)return; // not enough data
  const avgMonLv=Math.max(1,Math.floor(p.level*0.6));
  const totalJobExp=kc*avgMonLv*15;
  // Sum exp needed from current job level to see how many levels we'd gain
  let simLv=p.jobLevel,simExp=p.jobExp||0;
  let remaining=totalJobExp-simExp;
  // Subtract exp already accounted for by current job level
  for(let lv=1;lv<simLv;lv++)remaining-=jobExpToNext(lv);
  if(remaining<=0)return;
  // Silently grant the exp (will trigger jobLevelUp with notifications)
  gainJobExp(p,remaining);
}

// --- Reset skill points (refund all SP, cost gold) ---
function resetSkillPoints(){
  const p=game.player;
  if(!p)return false;
  const totalSpent=(p.skillLevels||[0,0,0,0]).reduce((a,b)=>a+b,0);
  if(totalSpent===0){addNotification('No skills to reset!','#999');return false;}
  const cost=50*p.level;
  if(p.gold<cost){addNotification('Need '+cost+' Gold to reset skills!','#e74c3c');return false;}
  p.gold-=cost;
  p.skillPoints+=totalSpent;
  p.skillLevels=[0,0,0,0];
  addNotification('Skills reset! (-'+cost+'G) +'+totalSpent+' SP','#00CED1');
  addLog('Reset all skills for '+cost+' gold. Refunded '+totalSpent+' SP.','#00CED1');
  sfx.spell();
  return true;
}

// --- Skill Level Up ---
function skillLevelUp(p,skillIdx){
  if(!p||skillIdx<0||skillIdx>=p.skills.length)return false;
  if(p.skillPoints<=0)return false;
  if(!p.skillLevels)p.skillLevels=[0,0,0,0];
  if(p.skillLevels[skillIdx]>=SKILL_LEVEL_MAX)return false;
  p.skillLevels[skillIdx]++;
  p.skillPoints--;
  const sk=p.skills[skillIdx];
  addLog('Upgraded '+sk.name+' to Lv.'+p.skillLevels[skillIdx],'#00CED1');
  if(p===game.player)sfx.spell();
  return true;
}

// --- Get effective skill stats at a level ---
function getSkillEffective(sk,slv){
  if(!sk)return{dmgPct:0,cd:0,heal:0};
  const dmgMult=1+slv*0.15;
  const cdReduction=slv*0.3;
  return{
    dmgPct:sk.dmgPct?(sk.dmgPct*dmgMult):0,
    cd:Math.max(0.5,sk.cd-cdReduction),
    heal:sk.heal?(sk.heal*dmgMult):0,
    healPct:sk.healPct?(sk.healPct*dmgMult):0,
    buffDur:sk.buff?(sk.buff.dur+slv*0.5):0
  };
}

// --- Check runtime passives ---
function hasJobPassive(p,type){
  return p._jobPassives&&p._jobPassives[type]?p._jobPassives[type]:0;
}

// --- Priest passive HP regen ---
function updateJobPassives(dt){
  const p=game.player;
  if(!p||p.isDead)return;
  const regen=hasJobPassive(p,'hpRegen');
  if(regen>0&&game.time%1<dt){
    const amt=Math.max(1,Math.round(p.maxHp*regen));
    p.hp=Math.min(p.maxHp,p.hp+amt);
  }
}

// --- Bot auto-spend SP ---
function jobBotLogic(){
  const p=game.player;
  if(!p||p.skillPoints<=0||!p.skillLevels)return;
  // Priority: Q (main dmg) → W (utility) → E (defensive) → R (ultimate)
  const priority=[0,1,2,3];
  for(const idx of priority){
    if(p.skillLevels[idx]<SKILL_LEVEL_MAX){
      skillLevelUp(p,idx);
      return;
    }
  }
}

// ============================================================
// SKILL PANEL UI
// ============================================================
let showSkillPanel=false;

function drawSkillPanel(){
  const p=game.player;if(!p)return;
  const pw=340,ph=380,px=(canvas.width-pw)/2,py=(canvas.height-ph)/2;

  // Background
  ctx.save();
  ctx.fillStyle='rgba(8,8,20,0.95)';roundRect(ctx,px,py,pw,ph,10);ctx.fill();
  ctx.strokeStyle='#00CED1';ctx.lineWidth=2;roundRect(ctx,px,py,pw,ph,10);ctx.stroke();

  // Header
  ctx.fillStyle='#00CED1';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText('Skills [B]',px+pw/2,py+22);

  // Auto toggle (top-left)
  const autoOn=game.settings.autoSkillAllocate;
  const atx=px+10,aty=py+10;
  ctx.fillStyle=autoOn?'rgba(20,120,40,0.9)':'rgba(80,30,30,0.9)';
  roundRect(ctx,atx,aty,56,18,4);ctx.fill();
  ctx.strokeStyle=autoOn?'#44ff88':'#cc4444';ctx.lineWidth=1;
  roundRect(ctx,atx,aty,56,18,4);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='center';
  ctx.fillText('Auto:'+(autoOn?'ON':'OFF'),atx+28,aty+13);

  // SP counter
  ctx.fillStyle='#FFD700';ctx.font='bold 12px monospace';ctx.textAlign='right';
  ctx.fillText('SP: '+(p.skillPoints||0),px+pw-16,py+22);

  // Job level info
  ctx.fillStyle='#88cccc';ctx.font='11px monospace';ctx.textAlign='left';
  const jlv=p.jobLevel||1;const jexp=p.jobExp||0;
  const jnext=jlv>=30?1:jobExpToNext(jlv);
  const jr=jlv>=30?1:(jexp/jnext);
  ctx.fillText('Job Lv.'+jlv+(jlv>=30?' MAX':''),px+16,py+42);
  // Job EXP bar
  drawUIBar(px+16,py+48,pw-32,10,jr,'#00CED1','#004455',jlv>=30?'MAX':Math.floor(jr*100)+'%');

  // Skill rows
  const skColors=['#e74c3c','#3498db','#2ecc71','#f1c40f'];
  const keys=['Q','W','E','R'];
  let sy=py+72;

  for(let i=0;i<4;i++){
    const sk=p.skills[i];if(!sk)continue;
    const slv=(p.skillLevels&&p.skillLevels[i])||0;
    const eff=getSkillEffective(sk,slv);
    const nextEff=slv<SKILL_LEVEL_MAX?getSkillEffective(sk,slv+1):null;

    // Row bg
    ctx.fillStyle='rgba(20,20,40,0.8)';roundRect(ctx,px+10,sy,pw-20,66,6);ctx.fill();
    ctx.strokeStyle=skColors[i]+'88';ctx.lineWidth=1;roundRect(ctx,px+10,sy,pw-20,66,6);ctx.stroke();

    // Skill key + name
    ctx.fillStyle=skColors[i];ctx.font='bold 12px monospace';ctx.textAlign='left';
    ctx.fillText('['+keys[i]+'] '+sk.name,px+18,sy+16);

    // Level badge
    ctx.fillStyle=slv>=SKILL_LEVEL_MAX?'#FFD700':'#aaa';ctx.font='bold 11px monospace';ctx.textAlign='right';
    ctx.fillText('Lv.'+slv+'/'+SKILL_LEVEL_MAX,px+pw-70,sy+16);

    // Current stats
    ctx.fillStyle='#ccc';ctx.font='9px monospace';ctx.textAlign='left';
    let statText='';
    if(sk.dmgPct)statText+='DMG: '+(eff.dmgPct*100).toFixed(0)+'%  ';
    if(sk.heal)statText+='Heal: '+(eff.heal*100).toFixed(0)+'%  ';
    statText+='CD: '+eff.cd.toFixed(1)+'s';
    if(sk.buff)statText+='  Dur: '+eff.buffDur.toFixed(1)+'s';
    ctx.fillText(statText,px+18,sy+32);

    // Next level preview
    if(nextEff&&slv<SKILL_LEVEL_MAX){
      ctx.fillStyle='#4f4';ctx.font='8px monospace';
      let nextText='Next: ';
      if(sk.dmgPct)nextText+='DMG '+(nextEff.dmgPct*100).toFixed(0)+'%  ';
      if(sk.heal)nextText+='Heal '+(nextEff.heal*100).toFixed(0)+'%  ';
      nextText+='CD '+nextEff.cd.toFixed(1)+'s';
      ctx.fillText(nextText,px+18,sy+44);
    }else if(slv>=SKILL_LEVEL_MAX){
      ctx.fillStyle='#FFD700';ctx.font='8px monospace';
      ctx.fillText('MAX LEVEL',px+18,sy+44);
    }

    // Level up button
    if(slv<SKILL_LEVEL_MAX){
      const bx=px+pw-58,bby=sy+34,bw=42,bh=22;
      const canUp=(p.skillPoints||0)>0;
      ctx.fillStyle=canUp?'rgba(0,180,100,0.8)':'rgba(60,60,60,0.8)';
      roundRect(ctx,bx,bby,bw,bh,4);ctx.fill();
      ctx.strokeStyle=canUp?'#44ff88':'#555';ctx.lineWidth=1;roundRect(ctx,bx,bby,bw,bh,4);ctx.stroke();
      ctx.fillStyle=canUp?'#fff':'#666';ctx.font='bold 9px monospace';ctx.textAlign='center';
      ctx.fillText('+1 SP',bx+bw/2,bby+15);
    }

    sy+=72;
  }

  // --- Job Passives section ---
  sy+=4;
  ctx.fillStyle='#667';ctx.font='bold 10px sans-serif';ctx.textAlign='left';
  ctx.fillText('JOB PASSIVES',px+16,sy);sy+=14;

  const cls=p._baseClassName||p.className;
  const passives=JOB_PASSIVES[cls];
  if(passives){
    for(const lv of[10,20,30]){
      const pas=passives[lv];if(!pas)continue;
      const unlocked=jlv>=lv;
      ctx.fillStyle=unlocked?'#44ff88':'#555';ctx.font='9px monospace';ctx.textAlign='left';
      ctx.fillText((unlocked?'✓':'○')+' Lv.'+lv+': '+pas.name+' — '+pas.desc,px+18,sy);
      sy+=13;
    }
  }

  // Reset Skills button (bottom of panel)
  const totalSpent=(p.skillLevels||[0,0,0,0]).reduce((a,b)=>a+b,0);
  const resetCost=50*(p.level||1);
  const hasSpent=totalSpent>0;
  const rbx=px+pw/2-40,rby=py+ph-32;
  ctx.fillStyle=hasSpent?'rgba(140,50,50,0.9)':'rgba(50,50,50,0.7)';
  roundRect(ctx,rbx,rby,80,22,4);ctx.fill();
  ctx.strokeStyle=hasSpent?'#ff6666':'#555';ctx.lineWidth=1;
  roundRect(ctx,rbx,rby,80,22,4);ctx.stroke();
  ctx.fillStyle=hasSpent?'#fff':'#666';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
  ctx.fillText('Reset '+resetCost+'G',rbx+40,rby+15);

  // Close button
  ctx.fillStyle='#888';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText('✕',px+pw-14,py+16);

  ctx.restore();
}

function handleSkillPanelClick(cx,cy){
  const p=game.player;if(!p)return;
  const pw=340,ph=380,px=(canvas.width-pw)/2,py=(canvas.height-ph)/2;

  // Close button
  if(cx>=px+pw-24&&cx<=px+pw-4&&cy>=py+4&&cy<=py+24){showSkillPanel=false;return}
  // Outside panel
  if(cx<px||cx>px+pw||cy<py||cy>py+ph){showSkillPanel=false;return}

  // Auto toggle click
  const atx=px+10,aty=py+10;
  if(cx>=atx&&cx<=atx+56&&cy>=aty&&cy<=aty+18){
    game.settings.autoSkillAllocate=!game.settings.autoSkillAllocate;
    if(typeof saveSettings==='function')saveSettings();
    return;
  }

  // Reset Skills button
  const rbx=px+pw/2-40,rby=py+ph-32;
  if(cx>=rbx&&cx<=rbx+80&&cy>=rby&&cy<=rby+22){
    if(typeof resetSkillPoints==='function')resetSkillPoints();
    return;
  }

  // Skill level up buttons
  let sy=py+72;
  for(let i=0;i<4;i++){
    const slv=(p.skillLevels&&p.skillLevels[i])||0;
    if(slv<SKILL_LEVEL_MAX){
      const bx=px+pw-58,bby=sy+34,bw=42,bh=22;
      if(cx>=bx&&cx<=bx+bw&&cy>=bby&&cy<=bby+bh){
        skillLevelUp(p,i);
        return;
      }
    }
    sy+=72;
  }
}
