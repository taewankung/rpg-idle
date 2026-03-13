// ============================================================
// ENTITIES — Player, Monster, NPC creation & updates
// ============================================================
function createPlayer(className, name) {
  const cd=CLASS_DATA[className];if(!cd)return null;
  const cx=Math.floor(MAP_W/2)*TILE+TILE/2,cy=Math.floor(MAP_H/2)*TILE+TILE/2;
  const skills=cd.skills.map(s=>({...s,cdTimer:0}));
  return{entityType:'player',name,className,level:1,exp:0,gold:0,hp:cd.hp,maxHp:cd.hp,mp:cd.mp,maxMp:cd.mp,
    atk:cd.atk,def:cd.def,spd:cd.spd,crit:cd.crit,x:cx,y:cy,dir:'down',frame:0,animTimer:0,
    skills,equipment:{weapon:null,armor:null,accessory:null},inventory:[],
    attackTimer:0,attackRange:cd.attackRange,state:'idle',buffs:[],respawnTimer:0,isDead:false,killCount:0,
    jobLevel:1,jobExp:0,skillPoints:0,skillLevels:[0,0,0,0],_jobPassives:{},
    evasion:0,dropRate:0,critDmg:1.5,matk:0,
    _path:null,_pathIdx:0};
}

function expToNext(lv){return lv*100+lv*lv*10}

function levelUp(p){
  const g=CLASS_DATA[p.className].growth;
  p.level++;p.maxHp+=g.hp;p.maxMp+=g.mp;p.atk+=g.atk;p.def+=g.def;p.spd+=g.spd;
  p.hp=p.maxHp;p.mp=p.maxMp;
  addLog(p.name+' reached Level '+p.level+'!','#FFD700');
  addEffect(p.x,p.y,'levelup',1.5);
  sfx.levelUp();
  // Grant stat points
  if(p===game.player&&typeof statPointSystem!=='undefined'){
    const sp=5+statPointSystem.milestoneBonus(p.level);
    statPointSystem.grantPoints(sp);
    addNotification('Level Up! +'+sp+' Stat Points!','#f1c40f');
  }
  if(p===game.player&&typeof petSystem!=='undefined'&&petSystem.active)petSystem.recalcStats();
  if(p===game.player&&typeof achievementSystem!=='undefined')achievementSystem.onLevelUp(p.level);
  if(p!==game.player&&typeof classChangeSystem!=='undefined'&&classChangeSystem.checkNPCClassChange)classChangeSystem.checkNPCClassChange(p);
}

function gainExp(p,amt){
  p.exp+=amt;
  if(p===game.player)game.sessionExp+=amt;
  while(p.exp>=expToNext(p.level)){p.exp-=expToNext(p.level);levelUp(p)}
}

// --- MONSTERS ---
function createMon(type,sx,sy){
  const d=MON_DATA[type],lv=ri(d.lvR[0],d.lvR[1]),hp=ri(d.hpR[0],d.hpR[1]);
  return{entityType:'monster',type,level:lv,hp,maxHp:hp,atk:ri(d.atkR[0],d.atkR[1]),def:d.def,spd:d.spd,
    expReward:ri(d.expR[0],d.expR[1]),goldReward:ri(d.goldR[0],d.goldR[1]),
    x:sx,y:sy,dir:'down',frame:0,animTimer:0,state:'patrol',
    patrolCenter:{x:sx,y:sy},patrolAngle:Math.random()*Math.PI*2,
    target:null,respawnTimer:0,attackTimer:0,aggroRange:TILE*5,attackRange:TILE*1.2,
    slowTimer:0,isDead:false};
}

function spawnMonsters(){
  const mons=[],cx=Math.floor(MAP_W/2)*TILE,cy=Math.floor(MAP_H/2)*TILE;
  for(const[type,count]of[['slime',8],['goblin',5],['wolf',5],['skeleton',5],['dragon',2]]){
    const d=MON_DATA[type];
    for(let i=0;i<count;i++){
      let sx,sy,att=0;
      do{const a=Math.random()*Math.PI*2,dist=rf(d.zone[0],Math.min(d.zone[1],48))*TILE;
        sx=Math.max(TILE,Math.min(cx+Math.cos(a)*dist,(MAP_W-2)*TILE));
        sy=Math.max(TILE,Math.min(cy+Math.sin(a)*dist,(MAP_H-2)*TILE));att++
      }while(!map.isWalkable(Math.floor(sx/TILE),Math.floor(sy/TILE))&&att<20);
      mons.push(createMon(type,sx,sy));
    }
  }
  return mons;
}

function updateMonster(m,dt){
  if(m.isDead){m.respawnTimer-=dt;if(m.respawnTimer<=0){const d=MON_DATA[m.type];m.hp=ri(d.hpR[0],d.hpR[1]);m.maxHp=m.hp;m.x=m.patrolCenter.x;m.y=m.patrolCenter.y;m.isDead=false;m.state='patrol'}return}
  if(m.slowTimer>0)m.slowTimer-=dt;
  m.animTimer+=dt;if(m.animTimer>0.25){m.frame=(m.frame+1)%2;m.animTimer=0}
  if(m.attackTimer>0)m.attackTimer-=dt;
  const spd=m.slowTimer>0?m.spd*0.5:m.spd;
  const p=game.player;
  switch(m.state){
    case'patrol':{
      if(p&&!p.isDead){const dx=p.x-m.x,dy=p.y-m.y;if(Math.sqrt(dx*dx+dy*dy)<m.aggroRange){m.state='chase';m.target=p;break}}
      m.patrolAngle+=dt*0.4;
      const px=m.patrolCenter.x+Math.cos(m.patrolAngle)*TILE*2,py=m.patrolCenter.y+Math.sin(m.patrolAngle)*TILE*2;
      const dx=px-m.x,dy=py-m.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>4){const s=spd*TILE*dt,nx=m.x+(dx/dist)*s,ny=m.y+(dy/dist)*s;
        if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){m.x=nx;m.y=ny}}
      break;}
    case'chase':{
      if(!m.target||m.target.isDead){m.state='patrol';m.target=null;break}
      const dx=m.target.x-m.x,dy=m.target.y-m.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>m.aggroRange*2){m.state='patrol';m.target=null;break}
      if(dist<=m.attackRange){m.state='attack';break}
      const s=spd*TILE*dt,nx=m.x+(dx/dist)*s,ny=m.y+(dy/dist)*s;
      if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){m.x=nx;m.y=ny}
      else if(map.isWalkable(Math.floor(nx/TILE),Math.floor(m.y/TILE)))m.x=nx;
      else if(map.isWalkable(Math.floor(m.x/TILE),Math.floor(ny/TILE)))m.y=ny;
      break;}
    case'attack':{
      if(!m.target||m.target.isDead){m.state='patrol';m.target=null;break}
      const dx=m.target.x-m.x,dy=m.target.y-m.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>m.attackRange*1.5){m.state='chase';break}
      if(m.attackTimer<=0){
        // Dragon fire breath AoE
        if(m.type==='dragon'){
          sfx.fireBreath();screenShake(6,0.3);addEffect(m.x,m.y,'firebreath',0.6);
          const dx=m.target.x-m.x,dy=m.target.y-m.y,dist=Math.sqrt(dx*dx+dy*dy);
          // Damage all players/NPCs in cone
          const targets=[game.player,...game.npcPlayers].filter(t=>t&&!t.isDead);
          for(const t of targets){
            const td=Math.hypot(t.x-m.x,t.y-m.y);
            if(td<TILE*3){
              const r=calcDamage(m,t);t.hp=Math.max(0,t.hp-r.dmg);
              addDmg(t.x,t.y-TILE,'-'+r.dmg,'#FF4444');
              if(t.hp<=0){t.isDead=true;t.respawnTimer=3;
                if(t===game.player){addLog(t.name+' was killed by dragon fire!','#FF4444');t.gold=Math.max(0,Math.round(t.gold*0.95));if(typeof questSystem!=='undefined')questSystem.onPlayerDeath()}
              }
            }
          }
          m.attackTimer=1/(spd*0.3+0.3);
        }else{
        const r=calcDamage(m,m.target);m.target.hp=Math.max(0,m.target.hp-r.dmg);
        addDmg(m.target.x,m.target.y-TILE,'-'+r.dmg,r.crit?'#FF4444':'#FF8888');
        m.attackTimer=1/(spd*0.5+0.5);
        }
        if(m.target&&m.target.hp<=0){m.target.isDead=true;m.target.respawnTimer=3;
          addLog(m.target.name+' was killed by '+m.type+'!','#FF4444');
          m.target.gold=Math.max(0,Math.round(m.target.gold*0.95));
          if(m.target===game.player&&typeof questSystem!=='undefined')questSystem.onPlayerDeath();
          m.target=null;m.state='patrol'}
      }
      break;}
  }
}

// --- NPC PLAYERS ---
function createNPCs(count){
  const npcs=[],used=new Set();
  for(let i=0;i<count;i++){
    let nm;do{nm=NPC_NAMES[ri(0,NPC_NAMES.length-1)]}while(used.has(nm)&&used.size<NPC_NAMES.length);used.add(nm);
    const cls=CLASSES[ri(0,3)],lv=ri(1,15),npc=createPlayer(cls,nm);
    for(let l=1;l<lv;l++)levelUp(npc);npc.level=lv;npc.exp=0;npc.isNPC=true;npc.entityType='npc';
    npc.jobLevel=Math.min(30,Math.floor(lv*1.2));npc.skillLevels=[ri(0,Math.min(5,npc.jobLevel)),ri(0,Math.min(4,npc.jobLevel)),ri(0,Math.min(3,npc.jobLevel)),ri(0,Math.min(2,npc.jobLevel))];
    if(typeof applyAllJobPassives==='function')applyAllJobPassives(npc);
    let nx,ny,att=0;do{nx=ri(5,MAP_W-5)*TILE+TILE/2;ny=ri(5,MAP_H-5)*TILE+TILE/2;att++}while(!map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))&&att<30);
    npc.x=nx;npc.y=ny;npc.botState='idle';npc.roamTarget=null;npc.roamTimer=0;npc.npcTarget=null;
    npc._path=null;npc._pathIdx=0;npc._pathTimer=0;
    if(typeof statPointSystem!=='undefined'&&statPointSystem.npcAllocate)statPointSystem.npcAllocate(npc);
    npcs.push(npc);
  }
  return npcs;
}

function updateNPC(npc,dt){
  if(!npc||npc.isDead){npc.respawnTimer-=dt;if(npc.respawnTimer<=0){npc.isDead=false;npc.hp=npc.maxHp;npc.x=Math.floor(MAP_W/2)*TILE+TILE/2;npc.y=Math.floor(MAP_H/2)*TILE+TILE/2;npc.botState='idle';npc._path=null}return}
  updateBuffs(npc,dt);for(const sk of npc.skills)if(sk.cdTimer>0)sk.cdTimer=Math.max(0,sk.cdTimer-dt);
  if(npc.attackTimer>0)npc.attackTimer-=dt;
  npc._pathTimer+=dt;
  const hpR=npc.hp/npc.maxHp;
  let near=null,nd=Infinity;
  for(const m of game.monsters){if(m.isDead)continue;const d=Math.hypot(m.x-npc.x,m.y-npc.y);if(d<nd){nd=d;near=m}}
  if(hpR<0.25&&npc.botState!=='retreating'){npc.botState='retreating';npc.npcTarget=null;npc._path=null}

  // World boss: NPCs prioritize boss
  if(typeof worldBossNPCLogic==='function'){const wbTarget=worldBossNPCLogic(npc);if(wbTarget&&npc.botState==='idle'){assignPath(npc,wbTarget.x,wbTarget.y,25);npc.botState='roaming';npc.roamTarget=wbTarget}}
  switch(npc.botState){
    case'idle':npc.roamTimer-=dt;
      if(near&&nd<TILE*5){
        npc.npcTarget=near;npc.botState='approaching';
        assignPath(npc,near.x,near.y,15);npc._pathTimer=0;
      }
      else if(npc.roamTimer<=0){
        npc.botState='roaming';
        const dest=map.findRandomWalkable(npc.x,npc.y,2,6);
        if(dest){npc.roamTarget=dest;assignPath(npc,dest.x,dest.y,15)}
        else npc.roamTarget={x:npc.x,y:npc.y};
        npc.roamTimer=3+Math.random()*4;
      }
      break;

    case'roaming':
      if(!npc.roamTarget){npc.botState='idle';break}
      if(near&&nd<TILE*5){
        npc.npcTarget=near;npc.botState='approaching';
        assignPath(npc,near.x,near.y,15);npc._pathTimer=0;break;
      }
      if(followPath(npc,dt))npc.botState='idle';
      break;

    case'approaching':
      if(!npc.npcTarget||npc.npcTarget.isDead){npc.botState='idle';npc.npcTarget=null;npc._path=null;break}
      if(Math.hypot(npc.npcTarget.x-npc.x,npc.npcTarget.y-npc.y)<=npc.attackRange){npc.botState='combat';break}
      // Repath every 2 seconds
      if(npc._pathTimer>2){
        assignPath(npc,npc.npcTarget.x,npc.npcTarget.y,15);npc._pathTimer=0;
      }
      followPath(npc,dt);
      break;

    case'combat':
      if(!npc.npcTarget||npc.npcTarget.isDead){npc.botState='idle';npc.npcTarget=null;npc._path=null;break}
      if(Math.hypot(npc.npcTarget.x-npc.x,npc.npcTarget.y-npc.y)>npc.attackRange*1.5){
        npc.botState='approaching';assignPath(npc,npc.npcTarget.x,npc.npcTarget.y,15);npc._pathTimer=0;break;
      }
      if(npc.attackTimer<=0){const r=calcDamage(npc,npc.npcTarget);npc.npcTarget.hp-=r.dmg;
        addDmg(npc.npcTarget.x,npc.npcTarget.y-TILE,''+r.dmg,'#CCCCCC');npc.attackTimer=1/npc.spd;
        if(npc.npcTarget.hp<=0){killMon(npc.npcTarget,npc);npc.npcTarget=null;npc.botState='idle';npc._path=null}}
      break;

    case'retreating':{
      const cx=Math.floor(MAP_W/2)*TILE+TILE/2,cy=Math.floor(MAP_H/2)*TILE+TILE/2;
      if(!npc._path||npc._pathIdx>=npc._path.length)assignPath(npc,cx,cy,25);
      followPath(npc,dt);
      if(hpR>0.6){npc.botState='idle';npc._path=null}
      if(npc.className==='Priest'){const hs=npc.skills.find(s=>s.name==='Heal');if(hs&&hs.cdTimer<=0){hs.cdTimer=hs.cd;npc.hp=Math.min(npc.maxHp,npc.hp+Math.round(npc.maxHp*0.3))}}
      break;}
  }
  npc.animTimer+=dt;if(npc.animTimer>0.15){npc.frame=(npc.botState!=='idle')?(npc.frame+1)%3:0;npc.animTimer=0}
}
