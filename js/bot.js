// ============================================================
// BOT AI — State machine, A* pathfinding, stuck detection
// ============================================================
const botAI={
  enabled:true,state:'idle',target:null,roamTarget:null,
  stuckTimer:0,lastX:0,lastY:0,
  pathTimer:0,// Time since last path recalc
  settings:{hpThreshold:30,autoSkill:true,targetPriority:'nearest'},
  isValidTarget(t){return t&&!t.isDead&&t.entityType==='monster'},

  checkStuck(p,dt){
    const moved=Math.hypot(p.x-this.lastX,p.y-this.lastY);
    if(moved<2){this.stuckTimer+=dt}else{this.stuckTimer=0}
    this.lastX=p.x;this.lastY=p.y;
    if(this.stuckTimer>=3){
      this.stuckTimer=0;this.target=null;p._path=null;
      // Pick a random walkable tile to roam to
      const dest=map.findRandomWalkable(p.x,p.y,3,8);
      if(dest){this.roamTarget=dest;this.state='roaming';assignPath(p,dest.x,dest.y,15)}
      else{this.state='idle'}
      p.state='idle';return true;
    }
    return false;
  },

  // Request a path to target, returns false if no path exists
  requestPath(p,tx,ty){
    this.pathTimer=0;
    return assignPath(p,tx,ty,20);
  },

  // Check if we should recalculate the path (every 2s or target moved a lot)
  shouldRepath(p,tx,ty){
    this.pathTimer+=game.dt;
    if(this.pathTimer>2)return true;
    // If target moved >3 tiles from path end, repath
    if(p._path&&p._path.length>0){
      const end=p._path[p._path.length-1];
      if(Math.hypot(end.x-tx,end.y-ty)>TILE*3)return true;
    }
    return !p._path;
  },

  update(dt,p,mons){
    if(!p||p.isDead)return;
    const hpR=p.hp/p.maxHp*100;
    const classThresh={Knight:20,Mage:40,Ranger:35,Priest:70}[p.className]||30;
    const thresh=this.settings.hpThreshold||classThresh;
    // Auto potion
    if(hpR<thresh){const pi=p.inventory.findIndex(i=>i&&i.type==='potion');
      if(pi>=0){const pot=p.inventory[pi];p.hp=Math.min(p.maxHp,p.hp+(pot.stats.hp||50));p.inventory.splice(pi,1);addDmg(p.x,p.y-TILE,'+'+(pot.stats.hp||50),'#44FF44')}}
    if(hpR<thresh&&this.state!=='retreating'){this.state='retreating';this.target=null;p._path=null}
    // Stuck detection for approaching/combat/roaming
    if(this.state==='approaching'||this.state==='combat'||this.state==='roaming'){if(this.checkStuck(p,dt))return}
    // Validate current target
    if(this.target&&!this.isValidTarget(this.target)){this.target=null;p._path=null;if(this.state==='approaching'||this.state==='combat'){this.state='idle';p.state='idle'}}

    switch(this.state){
      case'idle':{
        this.stuckTimer=0;
        this.target=this.pickTarget(p,mons);
        if(this.target){
          if(this.requestPath(p,this.target.x,this.target.y)){
            this.state='approaching';this.lastX=p.x;this.lastY=p.y;
          }else{
            // No path to this target, skip it
            this.target=null;
            const dest=map.findRandomWalkable(p.x,p.y,3,8);
            if(dest){this.roamTarget=dest;this.state='roaming';assignPath(p,dest.x,dest.y,15)}
          }
        }else{
          this.state='roaming';
          const dest=map.findRandomWalkable(p.x,p.y,3,8);
          if(dest){this.roamTarget=dest;assignPath(p,dest.x,dest.y,15)}
          else this.roamTarget={x:p.x,y:p.y};
        }
        break;}

      case'roaming':{
        if(!this.roamTarget){this.state='idle';break}
        const t=this.pickTarget(p,mons);
        if(t){
          if(assignPath(p,t.x,t.y,20)){
            this.target=t;this.state='approaching';this.lastX=p.x;this.lastY=p.y;this.stuckTimer=0;this.pathTimer=0;break;
          }
        }
        const arrived=followPath(p,dt);
        p.state=arrived?'idle':'walking';
        if(arrived)this.state='idle';
        break;}

      case'approaching':{
        if(!this.isValidTarget(this.target)){this.state='idle';this.target=null;p._path=null;break}
        const dist=Math.hypot(this.target.x-p.x,this.target.y-p.y);
        if(dist<=p.attackRange){this.state='combat';p.state='combat';this.stuckTimer=0;break}
        // Repath if needed
        if(this.shouldRepath(p,this.target.x,this.target.y)){
          if(!this.requestPath(p,this.target.x,this.target.y)){
            // Can't reach target, drop it
            this.target=null;this.state='idle';p._path=null;break;
          }
        }
        followPath(p,dt);
        p.state='walking';
        // Mage kiting
        if(p.className==='Mage'&&dist<TILE*2){const dx=p.x-this.target.x,dy=p.y-this.target.y,d=Math.hypot(dx,dy);
          if(d>0){const s=p.spd*TILE*dt,nx=p.x+(dx/d)*s,ny=p.y+(dy/d)*s;if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){p.x=nx;p.y=ny}}}
        break;}

      case'combat':{
        if(!this.isValidTarget(this.target)){
          const drop=game.itemDrops.find(d=>Math.hypot(d.x-p.x,d.y-p.y)<TILE*3);
          if(drop){this.state='looting';p._path=null;break}
          this.state='idle';this.target=null;p.state='idle';p._path=null;break}
        const dist=Math.hypot(this.target.x-p.x,this.target.y-p.y);
        if(dist>p.attackRange*1.5){this.state='approaching';this.requestPath(p,this.target.x,this.target.y);break}
        // Ranger kite
        if(p.className==='Ranger'&&dist<p.attackRange*0.7){const dx=p.x-this.target.x,dy=p.y-this.target.y,d=Math.hypot(dx,dy);
          if(d>0){const s=p.spd*TILE*dt,nx=p.x+(dx/d)*s,ny=p.y+(dy/d)*s;if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){p.x=nx;p.y=ny}}}
        if(this.settings.autoSkill)this.autoSkills(p,mons);
        break;}

      case'looting':{
        let near=null,nd2=Infinity;for(const d of game.itemDrops){const dist=Math.hypot(d.x-p.x,d.y-p.y);if(dist<nd2){nd2=dist;near=d}}
        if(!near){this.state='idle';break}
        if(nd2<TILE){if(p.inventory.length<20){p.inventory.push(near.item);autoEquip(p,near.item);addLog('Picked up '+near.item.name,'#FFDD44');sfx.itemPickup()}
          const idx=game.itemDrops.indexOf(near);if(idx>=0)game.itemDrops.splice(idx,1);this.state='idle';p._path=null}
        else{
          // Path to loot
          if(!p._path||p._pathIdx>=p._path.length)assignPath(p,near.x,near.y,15);
          followPath(p,dt);p.state='walking';
        }
        break;}

      case'retreating':{
        // Use town healer + auto-buy potions
        const townTarget=townBotLogic(p);
        if(townTarget){
          if(!p._path||p._pathIdx>=p._path.length)assignPath(p,townTarget.x,townTarget.y,25);
          followPath(p,dt);p.state='walking';
        }else{
          // Fully healed and stocked — resume hunting
          if(hpR>0.5){this.state='idle';p._path=null}
          else{
            // Still need healing, walk to town center
            const tcx=Math.floor(MAP_W/2)*TILE+TILE/2,tcy=Math.floor(MAP_H/2)*TILE+TILE/2;
            if(!p._path||p._pathIdx>=p._path.length)assignPath(p,tcx,tcy,25);
            followPath(p,dt);p.state='walking';
          }
        }
        if(p.className==='Priest'){const hs=p.skills.find(s=>s.name==='Heal');if(hs&&hs.cdTimer<=0)useSkill(p,p.skills.indexOf(hs))}
        break;}
    }
  },

  pickTarget(p,mons){
    const range=6*TILE;
    const cands=mons.filter(m=>m.entityType==='monster'&&!m.isDead&&Math.hypot(m.x-p.x,m.y-p.y)<=range);
    if(!cands.length)return null;
    // Sort by priority
    let sorted;
    if(this.settings.targetPriority==='lowestHp')sorted=cands.sort((a,b)=>a.hp-b.hp);
    else if(this.settings.targetPriority==='highestExp')sorted=cands.sort((a,b)=>b.expReward-a.expReward);
    else sorted=cands.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    // Return first one that has a valid path
    for(const m of sorted){
      const path=map.findPath(p.x,p.y,m.x,m.y,20);
      if(path!==null)return m;
    }
    return null;
  },

  autoSkills(p,mons){
    const cls=p.className,hpR=p.hp/p.maxHp,nearby=mons.filter(m=>m.entityType==='monster'&&!m.isDead&&Math.hypot(m.x-p.x,m.y-p.y)<TILE*5).length;
    if(cls==='Knight'){if(hpR<0.5)useSkill(p,1);if(nearby>=2)useSkill(p,0);if(nearby>=3){useSkill(p,3);useSkill(p,2)}}
    else if(cls==='Mage'){if(p.mp/p.maxMp<0.15)return;if(nearby>=3)useSkill(p,3);if(nearby>=2)useSkill(p,1);useSkill(p,0);if(hpR<0.4)useSkill(p,2)}
    else if(cls==='Ranger'){useSkill(p,0);useSkill(p,1);if(hpR<0.5)useSkill(p,2);if(this.target)useSkill(p,3)}
    else if(cls==='Priest'){if(hpR<0.7)useSkill(p,1);useSkill(p,2);useSkill(p,0);if(nearby>=2)useSkill(p,3)}
  }
};
