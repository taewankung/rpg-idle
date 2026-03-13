// ============================================================
// STAT POINTS — Stat point allocation & distribution system
// ============================================================

const STAT_DEFS = {
  STR:{name:'STR',color:'#e74c3c',desc:'Strength',effects:[{stat:'atk',per:2},{stat:'maxHp',per:1}]},
  VIT:{name:'VIT',color:'#e67e22',desc:'Vitality',effects:[{stat:'maxHp',per:5},{stat:'def',per:0.5}]},
  INT:{name:'INT',color:'#8e44ad',desc:'Intelligence',effects:[{stat:'matk',per:2},{stat:'maxMp',per:3}]},
  DEX:{name:'DEX',color:'#27ae60',desc:'Dexterity',effects:[{stat:'atk',per:1},{stat:'spd',per:0.3},{stat:'crit',per:0.005}]},
  AGI:{name:'AGI',color:'#3498db',desc:'Agility',effects:[{stat:'spd',per:0.5},{stat:'evasion',per:0.01},{stat:'crit',per:0.003}]},
  LUK:{name:'LUK',color:'#f1c40f',desc:'Luck',effects:[{stat:'crit',per:0.01},{stat:'dropRate',per:0.01},{stat:'critDmg',per:0.005}]}
};

const CLASS_STAT_GUIDE = {
  Knight: {STR:3,VIT:3,INT:0,DEX:2,AGI:0,LUK:0},
  Mage:   {STR:0,VIT:2,INT:3,DEX:0,AGI:0,LUK:2},
  Ranger: {STR:0,VIT:0,INT:0,DEX:3,AGI:3,LUK:2},
  Priest: {STR:0,VIT:3,INT:3,DEX:1,AGI:0,LUK:0}
};

const BOT_STAT_DIST = {
  Knight: {STR:2,VIT:2,INT:0,DEX:1,AGI:0,LUK:0},
  Mage:   {STR:0,VIT:1,INT:3,DEX:0,AGI:0,LUK:1},
  Ranger: {STR:0,VIT:0,INT:0,DEX:2,AGI:2,LUK:1},
  Priest: {STR:0,VIT:2,INT:2,DEX:1,AGI:0,LUK:0}
};

const STAT_KEYS = ['STR','VIT','INT','DEX','AGI','LUK'];

function _emptyStats(){return {STR:0,VIT:0,INT:0,DEX:0,AGI:0,LUK:0}}

const statPointSystem = {
  allocated: _emptyStats(),
  pending: _emptyStats(),
  unspent: 0,
  resetCount: 0,
  panelOpen: false,
  hoverStat: null,
  autoStats: true,
  buttonRects: [],
  flashTimer: 0,
  flashStat: null,
  flashType: null,

  // --- Core methods ---

  grantPoints(amount){
    this.unspent += amount;
  },

  milestoneBonus(level){
    return (level===10||level===20||level===30||level===40||level===50)?3:0;
  },

  addPoint(stat){
    if(this.unspent<=0||!STAT_DEFS[stat])return false;
    this.unspent--;
    this.pending[stat]++;
    return true;
  },

  removePoint(stat){
    if(!STAT_DEFS[stat]||this.pending[stat]<=0)return false;
    this.pending[stat]--;
    this.unspent++;
    return true;
  },

  confirm(){
    let any=false;
    for(const k of STAT_KEYS){
      if(this.pending[k]>0){this.allocated[k]+=this.pending[k];any=true}
      this.pending[k]=0;
    }
    if(!any)return;
    const p=game.player;if(p)this.applyStats(p);
    if(typeof sfx!=='undefined'&&sfx.levelUp)sfx.levelUp();
    addNotification('Stat points applied!','#44ff88');
  },

  autoDistribute(){
    if(this.unspent<=0)return;
    const p=game.player;if(!p)return;
    const dist=BOT_STAT_DIST[p.className]||BOT_STAT_DIST.Knight;
    const total=STAT_KEYS.reduce((s,k)=>s+(dist[k]||0),0);
    if(total<=0)return;
    while(this.unspent>0){
      for(const k of STAT_KEYS){
        if(this.unspent<=0)break;
        if((dist[k]||0)>0){this.pending[k]++;this.unspent--}
      }
    }
  },

  reset(){
    const p=game.player;if(!p)return false;
    const cost=this.getResetCost();
    if(p.gold<cost){addNotification('Need '+cost+' gold to reset!','#e74c3c');return false}
    p.gold-=cost;
    // Refund all allocated
    let total=0;
    for(const k of STAT_KEYS){total+=this.allocated[k];this.allocated[k]=0;this.pending[k]=0}
    this.unspent+=total;
    this.resetCount++;
    this.applyStats(p);
    addNotification('Stats reset! '+total+' points refunded.','#f1c40f');
    addLog('Reset stat points (cost: '+cost+'g)','#f1c40f');
    return true;
  },

  getTotalPoints(stat){
    return (this.allocated[stat]||0)+(this.pending[stat]||0);
  },

  getStatBonus(stat){
    const def=STAT_DEFS[stat];if(!def)return {};
    const pts=this.getTotalPoints(stat);
    const out={};
    for(const e of def.effects)out[e.stat]=(out[e.stat]||0)+pts*e.per;
    return out;
  },

  getAllBonuses(){
    const b={atk:0,maxHp:0,def:0,spd:0,crit:0,maxMp:0,evasion:0,dropRate:0,critDmg:0,matk:0};
    for(const k of STAT_KEYS){
      const sb=this.getStatBonus(k);
      for(const s in sb)b[s]=(b[s]||0)+sb[s];
    }
    return b;
  },

  applyStats(p){
    if(!p)return;
    const cd=CLASS_DATA[p.className];if(!cd)return;
    const lv=p.level||1;
    const g=cd.growth||{hp:0,mp:0,atk:0,def:0,spd:0};
    // 1. Base stats from class
    p.maxHp=cd.hp+(g.hp||0)*(lv-1);
    p.maxMp=cd.mp+(g.mp||0)*(lv-1);
    p.atk=cd.atk+(g.atk||0)*(lv-1);
    p.def=cd.def+(g.def||0)*(lv-1);
    p.spd=cd.spd+(g.spd||0)*(lv-1);
    p.crit=cd.crit||0.05;
    // 2. Equipment bonuses
    for(const slot of['weapon','armor','accessory']){
      const eq=p.equipment&&p.equipment[slot];
      if(eq&&eq.stats){
        if(eq.stats.hp)p.maxHp+=eq.stats.hp;
        if(eq.stats.mp)p.maxMp+=eq.stats.mp;
        if(eq.stats.atk)p.atk+=eq.stats.atk;
        if(eq.stats.def)p.def+=eq.stats.def;
        if(eq.stats.spd)p.spd+=eq.stats.spd;
        if(eq.stats.crit)p.crit+=eq.stats.crit;
      }
    }
    // 3. Stat point bonuses
    const spb=this.getAllBonuses();
    p.maxHp+=spb.maxHp||0;
    p.maxMp+=spb.maxMp||0;
    p.atk+=spb.atk||0;
    p.def+=spb.def||0;
    p.spd+=spb.spd||0;
    p.crit+=spb.crit||0;
    // 4. Talent bonuses
    if(typeof talentSystem!=='undefined'&&talentSystem.getPassiveBonuses){
      const tb=talentSystem.getPassiveBonuses(p);
      if(tb){
        if(tb.maxHp)p.maxHp+=p.maxHp*tb.maxHp;
        if(tb.atk)p.atk+=p.atk*tb.atk;
        if(tb.def)p.def+=p.def*tb.def;
        if(tb.crit)p.crit+=tb.crit;
        if(tb.spd)p.spd+=p.spd*(tb.spd||0);
      }
    }
    // 5. Guild bonuses
    if(typeof guildSystem!=='undefined'&&guildSystem.getBonuses){
      const gb=guildSystem.getBonuses();
      if(gb){
        if(gb.atk)p.atk+=gb.atk;
        if(gb.def)p.def+=gb.def;
        if(gb.maxHp)p.maxHp+=gb.maxHp;
        if(gb.spd)p.spd+=gb.spd;
        if(gb.crit)p.crit+=gb.crit;
      }
    }
    // 6. Derived stats
    p.evasion=spb.evasion||0;
    p.dropRate=spb.dropRate||0;
    p.critDmg=1.5+(spb.critDmg||0);
    p.matk=spb.matk||0;
    // 7. Clamp hp/mp
    p.maxHp=Math.floor(p.maxHp);
    p.maxMp=Math.floor(p.maxMp);
    p.atk=Math.floor(p.atk);
    p.def=Math.floor(p.def);
    if(p.hp>p.maxHp)p.hp=p.maxHp;
    if(p.mp>p.maxMp)p.mp=p.maxMp;
  },

  botAutoAllocate(){
    if(!this.autoStats||this.unspent<=0)return;
    const p=game.player;if(!p)return;
    const dist=BOT_STAT_DIST[p.className]||BOT_STAT_DIST.Knight;
    const total=STAT_KEYS.reduce((s,k)=>s+(dist[k]||0),0);
    if(total<=0)return;
    while(this.unspent>0){
      for(const k of STAT_KEYS){
        if(this.unspent<=0)break;
        if((dist[k]||0)>0){
          // Small randomization: 20% chance to pick a random stat instead
          if(Math.random()<0.2){
            const rk=STAT_KEYS[ri(0,5)];
            this.allocated[rk]++;
          }else{
            this.allocated[k]++;
          }
          this.unspent--;
        }
      }
    }
    this.applyStats(p);
  },

  npcAllocate(npc){
    if(!npc||!npc.className)return;
    const lv=npc.level||1;
    const pts=lv*2;
    // 10% chance of meme build
    if(Math.random()<0.1){
      const meme=STAT_KEYS[ri(0,5)];
      npc._statAlloc=_emptyStats();
      npc._statAlloc[meme]=pts;
    }else{
      const guide=CLASS_STAT_GUIDE[npc.className]||CLASS_STAT_GUIDE.Knight;
      const total=STAT_KEYS.reduce((s,k)=>s+(guide[k]||0),0)||1;
      npc._statAlloc=_emptyStats();
      let rem=pts;
      while(rem>0){
        for(const k of STAT_KEYS){
          if(rem<=0)break;
          const base=Math.round(pts*(guide[k]||0)/total/STAT_KEYS.length);
          const add=Math.max(0,base+ri(-1,1));
          const give=Math.min(add,rem);
          npc._statAlloc[k]+=give;
          rem-=give;
        }
        // safety
        if(rem>0){npc._statAlloc[STAT_KEYS[ri(0,5)]]++;rem--}
      }
    }
    // Apply bonuses to npc
    const b={atk:0,maxHp:0,def:0,spd:0,crit:0,maxMp:0,evasion:0,dropRate:0,critDmg:0,matk:0};
    for(const k of STAT_KEYS){
      const def=STAT_DEFS[k];if(!def)continue;
      const p2=npc._statAlloc[k]||0;
      for(const e of def.effects)b[e.stat]=(b[e.stat]||0)+p2*e.per;
    }
    npc.maxHp=(npc.maxHp||100)+Math.floor(b.maxHp);
    npc.maxMp=(npc.maxMp||50)+Math.floor(b.maxMp);
    npc.atk=(npc.atk||10)+Math.floor(b.atk);
    npc.def=(npc.def||5)+Math.floor(b.def);
    npc.spd=(npc.spd||2)+(b.spd||0);
    npc.crit=(npc.crit||0.05)+(b.crit||0);
    npc.evasion=b.evasion||0;
    npc.dropRate=b.dropRate||0;
    npc.critDmg=1.5+(b.critDmg||0);
    npc.matk=b.matk||0;
    npc.hp=npc.maxHp;
    npc.mp=npc.maxMp;
  },

  getResetCost(){
    return 500*(this.resetCount+1);
  },

  getHoverPreview(stat){
    const def=STAT_DEFS[stat];if(!def)return {};
    const out={};
    for(const e of def.effects)out[e.stat]='+'+e.per;
    return out;
  },

  // --- Save / Load ---

  save(){
    return {allocated:this.allocated,unspent:this.unspent,resetCount:this.resetCount,autoStats:this.autoStats};
  },

  load(data){
    if(!data)return;
    if(data.allocated){for(const k of STAT_KEYS)this.allocated[k]=data.allocated[k]||0}
    this.unspent=data.unspent||0;
    this.resetCount=data.resetCount||0;
    this.autoStats=data.autoStats!==undefined?data.autoStats:true;
    for(const k of STAT_KEYS)this.pending[k]=0;
    const p=game.player;if(p)this.applyStats(p);
  },

  // --- Drawing (inside char stats panel) ---

  drawStatAllocation(px,py,pw,startY){
    const c=ctx;
    let y=startY;
    this.buttonRects=[];
    // Decay flash timer
    if(this.flashTimer>0)this.flashTimer-=game.dt||0.016;
    // Section header
    c.fillStyle='#557799';c.fillRect(px+10,y,pw-20,1);y+=6;
    c.fillStyle='#aaccee';c.font='bold 11px sans-serif';c.textAlign='center';
    c.fillText('STAT ALLOCATION',px+pw/2,y+10);y+=18;
    // Available points
    const avail=this.unspent;
    if(avail>0){
      const pulse=Math.sin(Date.now()/300)*0.3+0.7;
      c.globalAlpha=pulse;c.fillStyle='#f1c40f';
    }else{
      c.fillStyle='#888';
    }
    c.font='bold 10px monospace';c.textAlign='left';
    c.fillText('Available: '+avail,px+14,y+8);
    c.globalAlpha=1;y+=16;

    const p=game.player;
    const guide=CLASS_STAT_GUIDE[p?p.className:'Knight']||CLASS_STAT_GUIDE.Knight;

    // Stat rows
    for(const sk of STAT_KEYS){
      const def=STAT_DEFS[sk];
      const alloc=this.allocated[sk]||0;
      const pend=this.pending[sk]||0;
      const total=alloc+pend;
      // Stat name
      c.fillStyle=def.color;c.font='bold 10px monospace';c.textAlign='left';
      c.fillText(sk,px+14,y+11);
      // Star rating
      const stars=guide[sk]||0;
      c.font='9px sans-serif';c.fillStyle='#f1c40f';
      let starStr='';
      for(let i=0;i<3;i++)starStr+=(i<stars)?'\u2605':'\u2606';
      c.fillText(starStr,px+42,y+11);
      // Value
      c.font='bold 10px monospace';c.textAlign='right';
      if(pend>0){
        c.fillStyle='#eee';c.fillText(''+alloc,px+105,y+11);
        c.fillStyle='#44ff88';c.fillText('+'+pend,px+130,y+11);
      }else{
        c.fillStyle='#eee';c.fillText(''+total,px+115,y+11);
      }
      // [-] button (32x20 hit area, drawn 16x14 centered)
      const bx1=px+128,by1=y-3,bw1=32,bh1=20;
      const dbx1=px+136,dby1=y;
      const isFlashMinus=this.flashTimer>0&&this.flashStat===sk&&this.flashType==='minus';
      if(pend>0){
        c.fillStyle=isFlashMinus?'#aa2222':'#661111';roundRect(c,dbx1,dby1,16,14,2);c.fill();
        c.fillStyle='#ff4444';c.font='bold 11px monospace';c.textAlign='center';c.fillText('-',dbx1+8,dby1+11);
      }else{
        c.fillStyle='#222';roundRect(c,dbx1,dby1,16,14,2);c.fill();
        c.fillStyle='#444';c.font='bold 11px monospace';c.textAlign='center';c.fillText('-',dbx1+8,dby1+11);
      }
      this.buttonRects.push({stat:sk,type:'minus',x:bx1,y:by1,w:bw1,h:bh1});
      // [+] button (32x20 hit area, drawn 16x14 centered)
      const bx2=px+148,by2=y-3,bw2=32,bh2=20;
      const dbx2=px+156,dby2=y;
      const isFlashPlus=this.flashTimer>0&&this.flashStat===sk&&this.flashType==='plus';
      if(avail>0){
        c.fillStyle=isFlashPlus?'#22aa22':'#116611';roundRect(c,dbx2,dby2,16,14,2);c.fill();
        c.fillStyle='#44ff44';c.font='bold 11px monospace';c.textAlign='center';c.fillText('+',dbx2+8,dby2+11);
      }else{
        c.fillStyle='#222';roundRect(c,dbx2,dby2,16,14,2);c.fill();
        c.fillStyle='#444';c.font='bold 11px monospace';c.textAlign='center';c.fillText('+',dbx2+8,dby2+11);
      }
      this.buttonRects.push({stat:sk,type:'plus',x:bx2,y:by2,w:bw2,h:bh2});
      // Effect preview
      c.font='8px monospace';c.textAlign='left';c.fillStyle='#889';
      const effs=[];
      for(const e of def.effects){
        const v=total*e.per;
        if(v>0)effs.push(e.stat.toUpperCase().replace('MAXHP','HP').replace('MAXMP','MP')+'+'+((e.per>=1)?Math.floor(v):v.toFixed(1)));
      }
      if(effs.length)c.fillText('\u2192 '+effs.join(', '),px+178,y+11);
      // Hover preview
      if(this.hoverStat===sk){
        c.fillStyle='rgba(68,255,136,0.12)';c.fillRect(px+10,y-2,pw-20,18);
        const prev=this.getHoverPreview(sk);
        c.fillStyle='#44ff88';c.font='8px monospace';c.textAlign='right';
        const pStr=Object.entries(prev).map(([k2,v])=>k2+v).join(' ');
        c.fillText('+1: '+pStr,px+pw-14,y+11);
      }
      y+=24;
    }

    // --- Buttons ---
    y+=4;
    const hasPending=STAT_KEYS.some(k=>this.pending[k]>0);
    let bx=px+14;
    // Confirm
    if(hasPending){
      c.fillStyle='#115522';roundRect(c,bx,y,70,22,4);c.fill();
      c.strokeStyle='#44ff88';c.lineWidth=1;roundRect(c,bx,y,70,22,4);c.stroke();
      c.fillStyle='#44ff88';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('Confirm',bx+35,y+15);
    }else{
      c.fillStyle='#1a1a1a';roundRect(c,bx,y,70,22,4);c.fill();
      c.fillStyle='#444';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('Confirm',bx+35,y+15);
    }
    this.buttonRects.push({stat:null,type:'confirm',x:bx,y:y,w:70,h:22});
    bx+=76;
    // Auto
    if(avail>0){
      c.fillStyle='#112244';roundRect(c,bx,y,50,22,4);c.fill();
      c.strokeStyle='#4488ff';c.lineWidth=1;roundRect(c,bx,y,50,22,4);c.stroke();
      c.fillStyle='#4488ff';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('Auto',bx+25,y+15);
    }else{
      c.fillStyle='#1a1a1a';roundRect(c,bx,y,50,22,4);c.fill();
      c.fillStyle='#444';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('Auto',bx+25,y+15);
    }
    this.buttonRects.push({stat:null,type:'auto',x:bx,y:y,w:50,h:22});
    bx+=56;
    // Reset
    const cost=this.getResetCost();
    const canReset=p&&p.gold>=cost;
    if(canReset){
      c.fillStyle='#331111';roundRect(c,bx,y,80,22,4);c.fill();
      c.strokeStyle='#ff4444';c.lineWidth=1;roundRect(c,bx,y,80,22,4);c.stroke();
      c.fillStyle='#ff6644';
    }else{
      c.fillStyle='#1a1a1a';roundRect(c,bx,y,80,22,4);c.fill();
      c.fillStyle='#444';
    }
    c.font='bold 9px sans-serif';c.textAlign='center';c.fillText('Reset ('+cost+'G)',bx+40,y+15);
    this.buttonRects.push({stat:null,type:'reset',x:bx,y:y,w:80,h:22});
    y+=30;

    // --- Total stat summary ---
    c.fillStyle='#557799';c.fillRect(px+10,y,pw-20,1);y+=8;
    c.fillStyle='#889';c.font='bold 9px monospace';c.textAlign='left';
    c.fillText('STAT BONUSES',px+14,y+8);y+=14;

    const cd=CLASS_DATA[p?p.className:'Knight'];
    const g=cd?cd.growth:{hp:0,mp:0,atk:0,def:0,spd:0};
    const lv=(p?p.level:1)||1;
    const spb=this.getAllBonuses();
    const eqBonus={atk:0,def:0,maxHp:0,maxMp:0,spd:0,crit:0};
    if(p&&p.equipment){
      for(const slot of['weapon','armor','accessory']){
        const eq=p.equipment[slot];
        if(eq&&eq.stats){for(const[k,v]of Object.entries(eq.stats)){
          const mk=k==='hp'?'maxHp':k==='mp'?'maxMp':k;
          if(mk in eqBonus)eqBonus[mk]+=v;
        }}
      }
    }
    const summaryRows=[
      {l:'ATK',base:cd?(cd.atk+(g.atk||0)*(lv-1)):0,sp:Math.floor(spb.atk||0),eq:Math.floor(eqBonus.atk)},
      {l:'DEF',base:cd?(cd.def+(g.def||0)*(lv-1)):0,sp:Math.floor(spb.def||0),eq:Math.floor(eqBonus.def)},
      {l:'HP', base:cd?(cd.hp+(g.hp||0)*(lv-1)):0,sp:Math.floor(spb.maxHp||0),eq:Math.floor(eqBonus.maxHp)},
      {l:'SPD',base:cd?(cd.spd+(g.spd||0)*(lv-1)):0,sp:+(spb.spd||0).toFixed(1),eq:+(eqBonus.spd||0).toFixed(1)},
      {l:'CRIT',base:cd?cd.crit:0.05,sp:+(spb.crit||0).toFixed(3),eq:+(eqBonus.crit||0).toFixed(3)},
    ];
    for(const row of summaryRows){
      c.font='8px monospace';c.textAlign='left';
      c.fillStyle='#fff';c.fillText(row.l+':'+Math.floor(row.base),px+14,y+8);
      if(row.sp){c.fillStyle='#f1c40f';c.fillText('+'+row.sp+'sp',px+75,y+8)}
      if(row.eq){c.fillStyle='#44ff88';c.fillText('+'+row.eq+'eq',px+120,y+8)}
      // Talent bonus
      if(typeof talentSystem!=='undefined'&&talentSystem.getPassiveBonuses&&p){
        c.fillStyle='#00ced1';
        const tl=row.l==='HP'?'maxHp':row.l==='CRIT'?'crit':row.l.toLowerCase();
        c.fillText('T',px+165,y+8);
      }
      // Guild bonus
      if(typeof guildSystem!=='undefined'&&guildSystem.getBonuses){
        c.fillStyle='#aa44ff';c.fillText('G',px+175,y+8);
      }
      y+=12;
    }
    // Derived stats
    c.fillStyle='#667';c.font='8px monospace';c.textAlign='left';
    const eva=((spb.evasion||0)*100).toFixed(1);
    const dr=((spb.dropRate||0)*100).toFixed(1);
    const cdmg=((1.5+(spb.critDmg||0))*100).toFixed(0);
    c.fillText('EVA:'+eva+'%  DROP:+'+dr+'%  CDMG:'+cdmg+'%',px+14,y+8);
    y+=14;

    return y; // return final y position for caller
  },

  // --- Click handler ---

  handleStatClick(cx,cy){
    console.log("STAT CLICK:",cx,cy,"rects:",this.buttonRects.length);
    for(const r of this.buttonRects){
      if(cx>=r.x&&cx<=r.x+r.w&&cy>=r.y&&cy<=r.y+r.h){
        console.log("Button hit:",r.type,r.stat,r.x,r.y,r.w,r.h);
        if(r.type==='plus'){
          if(this.addPoint(r.stat)){
            this.flashStat=r.stat;this.flashType='plus';this.flashTimer=0.15;
            if(typeof sfx!=='undefined'&&sfx.ready)try{const a=sfx.ctx;const o=a.createOscillator();const g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=0.08*sfx.volume;o.start();g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.08);o.stop(a.currentTime+0.08)}catch(e){}
            return true;
          }
        }else if(r.type==='minus'){
          if(this.removePoint(r.stat)){
            this.flashStat=r.stat;this.flashType='minus';this.flashTimer=0.15;
            if(typeof sfx!=='undefined'&&sfx.ready)try{const a=sfx.ctx;const o=a.createOscillator();const g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=440;g.gain.value=0.08*sfx.volume;o.start();g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+0.08);o.stop(a.currentTime+0.08)}catch(e){}
            return true;
          }
        }else if(r.type==='confirm'){
          this.confirm();return true;
        }else if(r.type==='auto'){
          if(this.unspent>0){this.autoDistribute();return true}
        }else if(r.type==='reset'){
          this.reset();return true;
        }
      }
    }
    return false;
  },

  // --- Hover detection ---

  handleStatHover(cx,cy){
    this.hoverStat=null;
    for(const r of this.buttonRects){
      if(r.type==='plus'&&cx>=r.x-120&&cx<=r.x+r.w+60&&cy>=r.y&&cy<=r.y+r.h){
        this.hoverStat=r.stat;return;
      }
    }
  }
};

// --- Evasion check (standalone) ---

function checkEvasion(attacker,defender){
  const evasion=defender.evasion||0;
  const lvDiff=(defender.level||1)-(attacker.level||1);
  const lvBonus=Math.max(0,lvDiff*0.02);
  const totalEvasion=Math.min(0.5,evasion+lvBonus);
  if(Math.random()<totalEvasion){
    addDmg(defender.x,defender.y-TILE,'MISS','#ffffff');
    return true;
  }
  return false;
}
