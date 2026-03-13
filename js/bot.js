// ============================================================
// BOT AI — State machine, A* pathfinding, stuck detection
// ============================================================
const botAI={
  enabled:true,state:'idle',target:null,roamTarget:null,
  stuckTimer:0,lastX:0,lastY:0,
  pathTimer:0,// Time since last path recalc
  _debugTimer:0,// periodic debug logging
  _potionCd:0,// cooldown between potion uses
  settings:{hpThreshold:30,autoSkill:true,targetPriority:'nearest'},
  isValidTarget(t){return t&&!t.isDead&&t.entityType==='monster'},

  checkStuck(p,dt){
    const moved=Math.hypot(p.x-this.lastX,p.y-this.lastY);
    if(moved<2){this.stuckTimer+=dt}else{this.stuckTimer=0}
    this.lastX=p.x;this.lastY=p.y;
    if(this.stuckTimer>=3){
      this.stuckTimer=0;this.target=null;p._path=null;
      const dest=_findRandomWalkable(p.x,p.y,2,6);
      if(dest){this.roamTarget=dest;this.state='roaming';assignPath(p,dest.x,dest.y,25)}
      else{this.state='idle'}
      p.state='idle';return true;
    }
    return false;
  },

  requestPath(p,tx,ty){
    this.pathTimer=0;
    // Use larger maxR in dungeon to cover full 20x20 grid
    const maxR=dungeon.active?25:20;
    return assignPath(p,tx,ty,maxR);
  },

  shouldRepath(p,tx,ty){
    this.pathTimer+=game.dt;
    if(this.pathTimer>2)return true;
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

    // Debug logging (once per second in dungeon)
    if(dungeon.active){
      this._debugTimer-=dt;
      if(this._debugTimer<=0){
        this._debugTimer=2;
        const alive=mons.filter(m=>!m.isDead);
        console.log('BOT STATE:',this.state,'targets:',alive.length,'hasPath:',!!(p._path&&p._path.length),'pos:',Math.floor(p.x/TILE)+','+Math.floor(p.y/TILE));
      }
    }

    // Auto potion (with cooldown to avoid spam)
    if(this._potionCd>0)this._potionCd-=dt;
    if(this._potionCd<=0){
      // HP potion at 30% HP
      if(hpR<30){const pi=p.inventory.findIndex(i=>i&&i.type==='potion'&&i.stats.hp);
        if(pi>=0){const pot=p.inventory[pi];const heal=pot.stats.hp||50;p.hp=Math.min(p.maxHp,p.hp+heal);p.inventory.splice(pi,1);addDmg(p.x,p.y-TILE,'+'+heal,'#44FF44');sfx.itemPickup();this._potionCd=1}}
      // MP potion at 30% MP
      const mpR=p.mp/p.maxMp*100;
      if(this._potionCd<=0&&mpR<30){const mi=p.inventory.findIndex(i=>i&&i.type==='potion'&&i.stats.mp);
        if(mi>=0){const pot=p.inventory[mi];const restore=pot.stats.mp||50;p.mp=Math.min(p.maxMp,p.mp+restore);p.inventory.splice(mi,1);addDmg(p.x,p.y-TILE,'+'+restore+' MP','#3498db');sfx.itemPickup();this._potionCd=1}}
    }
    if(hpR<thresh&&this.state!=='retreating'){this.state='retreating';this.target=null;p._path=null}
    // Stuck detection for approaching/combat/roaming
    if(this.state==='approaching'||this.state==='combat'||this.state==='roaming'){if(this.checkStuck(p,dt))return}
    // Validate current target
    if(this.target&&!this.isValidTarget(this.target)){this.target=null;p._path=null;if(this.state==='approaching'||this.state==='combat'){this.state='idle';p.state='idle'}}

    switch(this.state){
      case'idle':{
        this.stuckTimer=0;
        // Zone travel check (overworld only)
        if(!dungeon.active&&typeof worldMap!=='undefined'&&worldMap.botCheckZoneTravel){
          const zt=worldMap.botCheckZoneTravel(p);
          if(zt&&!p._path){botAI.roamTarget=zt;botAI.state='roaming';assignPath(p,zt.x,zt.y,25);break}
        }
        // Auto-craft/enchant/summon when in town
        if(!dungeon.active){const inTown=map.getTile(Math.floor(p.x/TILE),Math.floor(p.y/TILE))===5;if(inTown){
          if(typeof craftingSystem!=='undefined'&&craftingSystem.botAutoCraft)craftingSystem.botAutoCraft(p);
          if(typeof enchantSystem!=='undefined'&&enchantSystem.botAutoEnchant)enchantSystem.botAutoEnchant(p);
          if(typeof gachaSystem!=='undefined'&&gachaSystem.botAutoSummon)gachaSystem.botAutoSummon(p);
        }}
        // World boss priority (overworld only)
        if(!dungeon.active&&typeof worldBoss!=='undefined'&&worldBoss.active&&!worldBoss.active.isDead){
          const wb=worldBoss.active;
          const d=Math.hypot(wb.x-p.x,wb.y-p.y);
          if(d<TILE*30){this.target=wb;if(this.requestPath(p,wb.x,wb.y,30)){this.state='approaching';this.lastX=p.x;this.lastY=p.y;break}}
        }
        // In dungeon: check stairs/exit navigation first
        if(dungeon.active){
          const nav=this._dungeonNav(p,mons);
          if(nav)break;
        }
        this.target=this.pickTarget(p,mons);
        if(this.target){
          console.log('BOT: targeting',this.target.type,'at',Math.floor(this.target.x/TILE)+','+Math.floor(this.target.y/TILE));
          if(this.requestPath(p,this.target.x,this.target.y)){
            this.state='approaching';this.lastX=p.x;this.lastY=p.y;
          }else{
            console.log('BOT: path failed to target, trying direct move');
            this.target=null;
            // In dungeon, try to walk toward nearest monster directly
            if(dungeon.active){
              const alive=mons.filter(m=>!m.isDead);
              if(alive.length>0){
                const nearest=alive.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
                const dest=_findRandomWalkable(nearest.x,nearest.y,1,3);
                if(dest){this.roamTarget=dest;this.state='roaming';assignPath(p,dest.x,dest.y,25);break}
              }
            }
            const dest=_findRandomWalkable(p.x,p.y,2,6);
            if(dest){this.roamTarget=dest;this.state='roaming';assignPath(p,dest.x,dest.y,25)}
          }
        }else{
          // No targets — in dungeon, navigate to stairs/exit
          if(dungeon.active){
            const nav=this._dungeonNav(p,mons);
            if(nav)break;
          }
          this.state='roaming';
          const dest=_findRandomWalkable(p.x,p.y,2,6);
          if(dest){this.roamTarget=dest;assignPath(p,dest.x,dest.y,25)}
          else this.roamTarget={x:p.x,y:p.y};
        }
        break;}

      case'roaming':{
        if(!this.roamTarget){this.state='idle';break}
        const t=this.pickTarget(p,mons);
        if(t){
          const maxR=dungeon.active?25:20;
          if(assignPath(p,t.x,t.y,maxR)){
            this.target=t;this.state='approaching';this.lastX=p.x;this.lastY=p.y;this.stuckTimer=0;this.pathTimer=0;break;
          }
        }
        // In dungeon while roaming, also check if floor is clear for stairs nav
        if(dungeon.active){
          const alive=mons.filter(m=>!m.isDead);
          if(alive.length===0){
            const nav=this._dungeonNav(p,mons);
            if(nav)break;
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
        if(this.shouldRepath(p,this.target.x,this.target.y)){
          if(!this.requestPath(p,this.target.x,this.target.y)){
            this.target=null;this.state='idle';p._path=null;break;
          }
        }
        followPath(p,dt);
        p.state='walking';
        // Mage kiting
        if(p.className==='Mage'&&dist<TILE*2){const dx=p.x-this.target.x,dy=p.y-this.target.y,d=Math.hypot(dx,dy);
          if(d>0){const s=p.spd*TILE*dt,nx=p.x+(dx/d)*s,ny=p.y+(dy/d)*s;if(_isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){p.x=nx;p.y=ny}}}
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
          if(d>0){const s=p.spd*TILE*dt,nx=p.x+(dx/d)*s,ny=p.y+(dy/d)*s;if(_isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){p.x=nx;p.y=ny}}}
        if(this.settings.autoSkill)this.autoSkills(p,mons);
        // Quest auto-accept when near board (overworld only)
        if(!dungeon.active&&typeof questBotLogic==='function')questBotLogic();
        // Party bot logic (auto-invite nearby NPCs)
        if(!dungeon.active&&typeof partyBotLogic==='function')partyBotLogic();
        break;}

      case'looting':{
        let near=null,nd2=Infinity;for(const d of game.itemDrops){const dist=Math.hypot(d.x-p.x,d.y-p.y);if(dist<nd2){nd2=dist;near=d}}
        if(!near){this.state='idle';break}
        if(nd2<TILE){if(p.inventory.length<20){p.inventory.push(near.item);autoEquip(p,near.item);addLog('Picked up '+near.item.name,'#FFDD44');sfx.itemPickup();if(typeof questSystem!=='undefined')questSystem.onItemPickup(near.item)}
          const idx=game.itemDrops.indexOf(near);if(idx>=0)game.itemDrops.splice(idx,1);this.state='idle';p._path=null}
        else{
          if(!p._path||p._pathIdx>=p._path.length)assignPath(p,near.x,near.y,15);
          followPath(p,dt);p.state='walking';
        }
        break;}

      case'retreating':{
        if(dungeon.active){
          // In dungeon: just use potions and heal, no town healer
          if(p.className==='Priest'){const hs=p.skills.find(s=>s.name==='Heal');if(hs&&hs.cdTimer<=0)useSkill(p,p.skills.indexOf(hs))}
          // If healed enough or no potions left, resume fighting
          if(hpR>50||p.inventory.findIndex(i=>i&&i.type==='potion')<0){this.state='idle';p._path=null}
          break;
        }
        // Overworld: use town healer + auto-buy potions
        const townTarget=townBotLogic(p);
        if(townTarget){
          if(!p._path||p._pathIdx>=p._path.length)assignPath(p,townTarget.x,townTarget.y,25);
          followPath(p,dt);p.state='walking';
        }else{
          if(hpR>50){this.state='idle';p._path=null}
          else{
            const tcx=Math.floor(MAP_W/2)*TILE+TILE/2,tcy=Math.floor(MAP_H/2)*TILE+TILE/2;
            if(!p._path||p._pathIdx>=p._path.length)assignPath(p,tcx,tcy,25);
            followPath(p,dt);p.state='walking';
          }
        }
        if(p.className==='Priest'){const hs=p.skills.find(s=>s.name==='Heal');if(hs&&hs.cdTimer<=0)useSkill(p,p.skills.indexOf(hs))}
        break;}
    }
  },

  // Dungeon navigation: walk to stairs or exit when floor is clear
  _dungeonNav(p,mons){
    const alive=mons.filter(m=>!m.isDead);
    if(alive.length>0)return false; // still monsters to fight
    // Floor clear — go to stairs or exit
    if(dungeon.stairsPos&&dungeon.floor<dungeon.maxFloor){
      const sd=Math.hypot(p.x-dungeon.stairsPos.x,p.y-dungeon.stairsPos.y);
      if(sd<TILE*1.0){
        // Bot is at stairs — auto-descend
        if(dungeon.transitionCooldown<=0){
          console.log('BOT: auto-descending stairs on floor',dungeon.floor);
          dungeon.nextFloor();
          return true;
        }
      }
      if(!p._path||p._pathIdx>=p._path.length){
        console.log('BOT: floor clear, pathing to stairs');
        assignPath(p,dungeon.stairsPos.x,dungeon.stairsPos.y,25);
      }
      followPath(p,game.dt);p.state='walking';
      this.state='roaming';this.roamTarget={x:dungeon.stairsPos.x,y:dungeon.stairsPos.y};
      return true;
    }
    // Floor 5 boss defeated — walk to exit
    if(dungeon.exitPos){
      const ed=Math.hypot(p.x-dungeon.exitPos.x,p.y-dungeon.exitPos.y);
      if(ed<TILE*1.0&&dungeon.transitionCooldown<=0){
        console.log('BOT: auto-exiting dungeon');
        dungeon.exitDungeon();
        return true;
      }
      if(!p._path||p._pathIdx>=p._path.length){
        console.log('BOT: dungeon cleared, pathing to exit');
        assignPath(p,dungeon.exitPos.x,dungeon.exitPos.y,25);
      }
      followPath(p,game.dt);p.state='walking';
      this.state='roaming';this.roamTarget={x:dungeon.exitPos.x,y:dungeon.exitPos.y};
      return true;
    }
    return false;
  },

  pickTarget(p,mons){
    const range=dungeon.active?Infinity:6*TILE;
    const cands=mons.filter(m=>m.entityType==='monster'&&!m.isDead&&Math.hypot(m.x-p.x,m.y-p.y)<=range);
    if(!cands.length)return null;

    // Score each candidate: lower score = better target
    const scored=cands.map(m=>{
      const dist=Math.hypot(m.x-p.x,m.y-p.y);
      const lvDiff=Math.abs((m.level||1)-(p.level||1));
      let score;
      if(dist<TILE*2){
        // Very close: fight immediately, just sort by distance
        score=dist;
      }else{
        // Prefer level-matched monsters; distance as tiebreaker
        // lvDiff weight: each level of difference costs ~1 tile of distance
        score=dist+lvDiff*TILE*1.5;
      }
      // Apply user priority tweaks on top
      if(this.settings.targetPriority==='lowestHp')score-=(1-m.hp/m.maxHp)*TILE*3;
      else if(this.settings.targetPriority==='highestExp')score-=(m.expReward||0)*0.5;
      return{m,score};
    });
    scored.sort((a,b)=>a.score-b.score);

    const maxR=dungeon.active?25:20;
    for(const{m}of scored){
      const path=_findPath(p.x,p.y,m.x,m.y,maxR);
      if(path!==null)return m;
    }
    if(dungeon.active&&scored.length>0){
      console.log('BOT: no pathable target, picking nearest anyway');
      return scored[0].m;
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
