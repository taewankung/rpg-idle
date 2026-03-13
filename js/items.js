// ============================================================
// ITEMS — Inventory, equipment, drops, auto-equip
// ============================================================
function rollRarity(){let total=100,roll=Math.random()*total;for(const r of RARITY_W){roll-=r.w;if(roll<=0)return r.r}return'common'}
function rarMult(r){return{common:1,uncommon:1.3,rare:1.7,epic:2.5,legendary:4}[r]||1}

function genItem(level){
  if(Math.random()<0.3)return{name:'Health Potion',type:'potion',rarity:'common',stats:{hp:30+level*5},level,value:10+level*2};
  if(Math.random()<0.4)return null;
  const rar=rollRarity(),mult=rarMult(rar)*(1+level*0.1);
  const tr=Math.random();let type,name;
  if(tr<0.4){type='weapon';name=PRFX[ri(0,PRFX.length-1)]+WPNS[ri(0,WPNS.length-1)]}
  else if(tr<0.75){type='armor';name=PRFX[ri(0,PRFX.length-1)]+ARMRS[ri(0,ARMRS.length-1)]}
  else{type='accessory';name=PRFX[ri(0,PRFX.length-1)]+ACCS[ri(0,ACCS.length-1)]}
  const stats={};
  if(type==='weapon'){stats.atk=Math.round((2+level*1.5)*mult);if(Math.random()<0.3)stats.crit=parseFloat((0.01*mult).toFixed(2))}
  else if(type==='armor'){stats.def=Math.round((1+level)*mult);if(Math.random()<0.4)stats.hp=Math.round((10+level*5)*mult)}
  else{stats.spd=parseFloat((0.1*mult).toFixed(2));if(Math.random()<0.3)stats.mp=Math.round((5+level*3)*mult)}
  return{name,type,rarity:rar,stats,level,value:Math.round((5+level*10)*rarMult(rar))};
}

function statScore(s){return(s.atk||0)*2+(s.def||0)*2+(s.hp||0)*0.5+(s.mp||0)*0.5+(s.spd||0)*10+(s.crit||0)*100}

function autoEquip(p,item){
  if(!item||item.type==='potion')return;
  const slot=item.type==='weapon'?'weapon':item.type==='armor'?'armor':'accessory';
  const cur=p.equipment[slot];
  if(!cur||statScore(item.stats)>statScore(cur.stats)){
    if(cur)for(const[k,v]of Object.entries(cur.stats))if(k in p)p[k]-=v;
    for(const[k,v]of Object.entries(item.stats))if(k in p)p[k]+=v;
    p.equipment[slot]=item;
    const idx=p.inventory.indexOf(item);if(idx>=0)p.inventory.splice(idx,1);
    const statStr=Object.entries(item.stats).map(([k,v])=>'+'+v+' '+k.toUpperCase()).join(' ');
    addLog('Equipped: '+(_rarityLabel(item.rarity))+' '+item.name+' ('+statStr+')','#88CCFF');
    addNotification('Equipped: '+item.name+' ('+statStr+')',RARITY_COLORS[item.rarity]);
    console.log('Item equipped:',item.name,'['+item.rarity+']',statStr);
  }
}
function _rarityLabel(r){return r?r.charAt(0).toUpperCase()+r.slice(1):''}
