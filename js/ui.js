// ============================================================
// UI — HUD, minimap, skill bar, panels, combat log, rendering
// ============================================================
let showInventory=false,showCharStats=false,showHelp=false,showTabMenu=false,mouseX=0,mouseY=0,selectedClass=null,hoveredClass=-1;
let waterFrame=0,waterTimer=0,blinkTimer=0;
let invTooltipIdx=-1,invTooltipSlot=null; // tooltip state for inventory
let invSelectedIdx=-1,invSelectedSlot=null; // selected item for actions

function roundRect(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()}

function drawClassSelect(){
  const W=canvas.width,H=canvas.height;
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0a0a1a');bg.addColorStop(1,'#1a0a2a');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.font='bold 42px serif';ctx.textAlign='center';ctx.shadowColor='#c0a020';ctx.shadowBlur=20;ctx.fillStyle='#f0c030';ctx.fillText('Choose Your Class',W/2,60);ctx.restore();
  const cW=180,cH=280,total=CLASS_LIST.length*cW+(CLASS_LIST.length-1)*20;
  const sx=(W-total)/2,sy=(H-cH)/2-10;
  CLASS_LIST.forEach((cls,i)=>{
    const def=CLASS_DEFS[cls],cx=sx+i*(cW+20),isH=i===hoveredClass,isS=selectedClass===cls;
    ctx.save();
    const cg=ctx.createLinearGradient(cx,sy,cx,sy+cH);cg.addColorStop(0,isH?'#2a2a4a':'#1a1a3a');cg.addColorStop(1,'#0f0f1f');
    ctx.fillStyle=cg;roundRect(ctx,cx,sy,cW,cH,10);ctx.fill();
    ctx.strokeStyle=isS?def.color:isH?'#ffffff88':'#444466';ctx.lineWidth=isS?3:1;roundRect(ctx,cx,sy,cW,cH,10);ctx.stroke();
    ctx.restore();
    const spr=spriteCache[cls.toLowerCase()+'_down_0'];
    if(spr){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(spr,cx+(cW-96)/2,sy+10,96,96);ctx.restore()}
    else{ctx.fillStyle=def.color;ctx.beginPath();ctx.arc(cx+cW/2,sy+55,30,0,Math.PI*2);ctx.fill()}
    ctx.save();ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillStyle=def.color;ctx.fillText(cls,cx+cW/2,sy+120);ctx.restore();
    const statKeys=['HP','MP','ATK','DEF','SPD','CRIT'];const statCols={HP:'#e74c3c',MP:'#3498db',ATK:'#e67e22',DEF:'#2980b9',SPD:'#27ae60',CRIT:'#e91e63'};
    ctx.font='9px monospace';ctx.textAlign='left';
    statKeys.forEach((sk,si)=>{const by=sy+130+si*16,bx=cx+10;
      ctx.fillStyle='#888';ctx.fillText(sk,bx,by+6);
      ctx.fillStyle='#222';ctx.fillRect(bx+30,by,cW-50,5);
      ctx.fillStyle=statCols[sk];ctx.fillRect(bx+30,by,(cW-50)*def.stats[sk],5)});
    ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#888';ctx.fillText(def.desc,cx+cW/2,sy+cH-20);
    if(isS){ctx.fillStyle=def.color;ctx.font='bold 14px sans-serif';ctx.fillText('SELECTED',cx+cW/2,sy+cH-5)}
  });
  const rbx=W/2-50,rby=sy+cH+20;
  ctx.fillStyle='#2a1a00';roundRect(ctx,rbx,rby,100,30,6);ctx.fill();ctx.strokeStyle='#c0a020';ctx.lineWidth=1;roundRect(ctx,rbx,rby,100,30,6);ctx.stroke();
  ctx.fillStyle='#f0c030';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('Random',rbx+50,rby+20);
  if(selectedClass){const sbx=W/2-60,sby=sy+cH+60;
    ctx.fillStyle='#103020';roundRect(ctx,sbx,sby,120,36,8);ctx.fill();ctx.strokeStyle='#40e060';ctx.lineWidth=2;roundRect(ctx,sbx,sby,120,36,8);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.fillText('Start Game',sbx+60,sby+24)}
}

function drawMapTiles(){
  const sC=Math.max(0,Math.floor(camera.x/TILE)),sR=Math.max(0,Math.floor(camera.y/TILE));
  const eC=Math.min(MAP_W-1,Math.ceil((camera.x+canvas.width)/TILE)),eR=Math.min(MAP_H-1,Math.ceil((camera.y+canvas.height)/TILE));
  for(let r=sR;r<=eR;r++)for(let c=sC;c<=eC;c++){
    const t=map.getTile(c,r);if(t<0)continue;
    const sx=c*TILE-camera.x,sy=r*TILE-camera.y;
    let spr;
    if(t===0){const v=(c*7+r*13)%3;spr=spriteCache['grass_'+v]}
    else if(t===1){spr=spriteCache['dirt_'+(c*5+r*11)%2]}
    else if(t===2){spr=spriteCache['water_'+waterFrame]}
    else if(t===3){spr=spriteCache['grass_0']}
    else if(t===4){spr=spriteCache['dirt_0']}
    else if(t===5){spr=spriteCache['townFloor']}
    else if(t===6){spr=spriteCache['townFloor']}
    if(!spr&&typeof worldMap!=='undefined'&&worldMap.getTileSprite){spr=worldMap.getTileSprite(t,c,r)}
    if(spr)ctx.drawImage(spr,sx,sy,TILE,TILE);
    if(t===3){const ts=spriteCache['tree'];if(ts)ctx.drawImage(ts,sx,sy,TILE,TILE)}
    if(t===4){const rs=spriteCache['rock'];if(rs)ctx.drawImage(rs,sx,sy,TILE,TILE)}
    if(t===6){const bs=spriteCache['building'];if(bs)ctx.drawImage(bs,sx-TILE/2,sy-TILE/2,TILE*2,TILE*2)}
  }
  waterTimer++;if(waterTimer>=20){waterTimer=0;waterFrame=(waterFrame+1)%3}
}

function drawEntity(e,isPlayer,isNPC){
  if(e.isDead&&!e.respawnTimer)return;
  const{x:sx,y:sy}=camera.worldToScreen(e.x,e.y);
  const isBoss=e.type==='dragon';const size=isBoss?64:32;const half=size/2;
  ctx.save();if(e.isDead)ctx.globalAlpha=0.3;
  ctx.imageSmoothingEnabled=false;
  if(isPlayer||isNPC){
    const prefix=(typeof classChangeSystem!=='undefined'&&classChangeSystem.getSpritePrefix)?classChangeSystem.getSpritePrefix(e):(e.className||'knight').toLowerCase();
    const key=prefix+'_'+(e.dir||'down')+'_'+(e.frame%3);
    const spr=spriteCache[key];if(spr)ctx.drawImage(spr,sx-16,sy-16,32,32);
    else{ctx.fillStyle=isPlayer?'#44ff88':'#4488ff';ctx.fillRect(sx-12,sy-12,24,24)}
  }else{
    const key=(e.type||'slime')+'_'+(e.frame%2);const spr=spriteCache[key];
    if(spr)ctx.drawImage(spr,sx-half,sy-half,size,size);
    else{ctx.fillStyle='#ff4444';ctx.fillRect(sx-half,sy-half,size,size)}
  }
  if(!e.isDead){
    ctx.font='10px monospace';ctx.textAlign='center';ctx.strokeStyle='#000';ctx.lineWidth=2;
    const guildTag=(isPlayer&&typeof guildSystem!=='undefined'&&guildSystem.getGuildTag)?guildSystem.getGuildTag():'';
    const label=(isPlayer||isNPC?'':'Lv.'+e.level+' ')+guildTag+(e.name||e.type||'');
    ctx.strokeText(label,sx,sy-half-14);ctx.fillStyle=isPlayer?'#44ff88':isNPC?'#fff':'#ffaaaa';ctx.fillText(label,sx,sy-half-14);
    if(isPlayer||isNPC){ctx.fillStyle='#ffdd44';const lvt='Lv.'+e.level;ctx.strokeText(lvt,sx,sy-half-4);ctx.fillText(lvt,sx,sy-half-4)}
    // Skip HP bar for dragon boss (drawn separately at top)
    if(!isBoss){
      const bw=30,bh=4,bx=sx-bw/2,by=sy-half-(isPlayer||isNPC?0:8);
      ctx.fillStyle='#330000';ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=isPlayer?'#44ff44':'#ff4444';ctx.fillRect(bx,by,bw*Math.max(0,e.hp/e.maxHp),bh);
    }
  }
  ctx.restore();
}

function drawEntities(){
  const all=[];
  game.itemDrops.forEach(d=>all.push({y:d.y,draw:()=>{
    const{x:sx,y:sy}=camera.worldToScreen(d.x,d.y);const b=Math.sin(Date.now()/400+d.x)*3;
    const gc=RARITY_COLORS[d.item.rarity]||'#aaa';ctx.save();ctx.shadowColor=gc;ctx.shadowBlur=8;
    const spr=spriteCache['loot_bag'];if(spr){ctx.imageSmoothingEnabled=false;ctx.drawImage(spr,sx-8,sy-8+b,16,16)}
    else{ctx.fillStyle=gc;ctx.fillRect(sx-6,sy-6+b,12,12)}ctx.restore();
    // Floating item name only when player is within 2 tiles
    const dropDist=game.player?Math.hypot(game.player.x-d.x,game.player.y-d.y):Infinity;
    if(dropDist<TILE*2){ctx.save();ctx.font='bold 9px sans-serif';ctx.textAlign='center';
    ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeText(d.item.name,sx,sy-14+b);
    ctx.fillStyle=gc;ctx.fillText(d.item.name,sx,sy-14+b);ctx.restore()}}}));
  game.monsters.forEach(m=>all.push({y:m.y,draw:()=>drawEntity(m,false,false)}));
  if(game.settings.showNPCs&&!dungeon.active)game.npcPlayers.forEach(n=>all.push({y:n.y,draw:()=>drawEntity(n,false,true)}));
  if(game.player)all.push({y:game.player.y,draw:()=>drawEntity(game.player,true,false)});
  all.sort((a,b)=>a.y-b.y);all.forEach(e=>e.draw());
}

function drawDmgNumbers(){
  for(const d of dmgNumbers){
    const{x:sx,y:sy}=camera.worldToScreen(d.x,d.y);
    ctx.save();ctx.globalAlpha=d.alpha;ctx.font='bold 14px monospace';ctx.textAlign='center';
    ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText(d.text,sx,sy);
    ctx.fillStyle=d.color||'#fff';ctx.fillText(d.text,sx,sy);ctx.restore();
  }
}

function drawEffectsVis(){
  for(const e of effects){
    const{x:sx,y:sy}=camera.worldToScreen(e.x,e.y);const p=1-e.timer/e.dur;
    ctx.save();ctx.globalAlpha=Math.max(0,1-p);
    if(e.type==='levelup'){ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.strokeStyle='#000';ctx.lineWidth=3;
      ctx.strokeText('LEVEL UP!',sx,sy-30-p*30);ctx.fillStyle='#FFD700';ctx.fillText('LEVEL UP!',sx,sy-30-p*30);
      ctx.strokeStyle='#FFD700';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,20+p*40,0,Math.PI*2);ctx.stroke()}
    else if(e.type==='hit'){
      const n=6;for(let i=0;i<n;i++){const a=Math.PI*2*i/n+p*2;const r=8+p*18;
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx+Math.cos(a)*r,sy+Math.sin(a)*r,2-p*2,0,Math.PI*2);ctx.fill()}}
    else if(e.type==='heal'){
      const n=8;for(let i=0;i<n;i++){const a=Math.PI*2*i/n;const r=p*30;
        ctx.fillStyle='#44ff88';ctx.beginPath();ctx.arc(sx+Math.cos(a)*r,sy-p*20+Math.sin(a)*r*0.5,3-p*2,0,Math.PI*2);ctx.fill()}
      ctx.strokeStyle='#44ff88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx-4,sy-10-p*15);ctx.lineTo(sx+4,sy-10-p*15);ctx.moveTo(sx,sy-14-p*15);ctx.lineTo(sx,sy-6-p*15);ctx.stroke()}
    else if(e.type==='buff'){
      ctx.strokeStyle='#88ccff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,12+p*20,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(sx,sy,6+p*12,0,Math.PI*2);ctx.stroke()}
    else if(e.type==='slash'){
      ctx.strokeStyle='#ffffff';ctx.lineWidth=3-p*2;ctx.beginPath();
      ctx.arc(sx,sy,10+p*25,-Math.PI*0.4+p,Math.PI*0.4+p);ctx.stroke()}
    else if(e.type==='aoe'){
      ctx.strokeStyle='#ff6644';ctx.lineWidth=3-p*2;ctx.beginPath();ctx.arc(sx,sy,10+p*50,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#ffaa44';ctx.lineWidth=2-p;ctx.beginPath();ctx.arc(sx,sy,5+p*30,0,Math.PI*2);ctx.stroke();
      const n=10;for(let i=0;i<n;i++){const a=Math.PI*2*i/n+p*3;const r=p*45;
        ctx.fillStyle='#ff8844';ctx.beginPath();ctx.arc(sx+Math.cos(a)*r,sy+Math.sin(a)*r,2,0,Math.PI*2);ctx.fill()}}
    else if(e.type==='firebreath'){
      // Dragon fire breath cone effect
      const n=16;for(let i=0;i<n;i++){
        const a=Math.PI*2*i/n+p*1.5;const r=10+p*TILE*3;
        const sz=4-p*3;
        ctx.fillStyle=i%2===0?'#FF4400':'#FFAA00';
        ctx.globalAlpha=Math.max(0,(1-p)*0.8);
        ctx.beginPath();ctx.arc(sx+Math.cos(a)*r,sy+Math.sin(a)*r,Math.max(0.5,sz),0,Math.PI*2);ctx.fill()
      }
      ctx.strokeStyle='#FF6600';ctx.lineWidth=3-p*2;ctx.beginPath();ctx.arc(sx,sy,10+p*TILE*3,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}

// --- BOSS HP BAR (dragon) ---
function drawBossBar(){
  const dragon=game.monsters.find(m=>m.type==='dragon'&&!m.isDead);
  if(!dragon)return;
  const p=game.player;if(!p)return;
  // Only show if dragon is aggro or nearby
  const dist=Math.hypot(dragon.x-p.x,dragon.y-p.y);
  if(dist>TILE*12)return;
  const bw=400,bh=24,bx=(canvas.width-bw)/2,by=30;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.8)';roundRect(ctx,bx-4,by-20,bw+8,bh+28,6);ctx.fill();
  ctx.strokeStyle='#cc2200';ctx.lineWidth=2;roundRect(ctx,bx-4,by-20,bw+8,bh+28,6);ctx.stroke();
  ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#FF6644';
  ctx.fillText('Lv.'+dragon.level+' DRAGON BOSS',canvas.width/2,by-6);
  ctx.fillStyle='#220000';ctx.fillRect(bx,by,bw,bh);
  const hpR=Math.max(0,dragon.hp/dragon.maxHp);
  const g=ctx.createLinearGradient(bx,by,bx+bw*hpR,by);g.addColorStop(0,'#880000');g.addColorStop(1,'#FF2200');
  ctx.fillStyle=g;ctx.fillRect(bx,by,bw*hpR,bh);
  ctx.strokeStyle='#440000';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);
  ctx.font='bold 11px monospace';ctx.fillStyle='#fff';ctx.fillText(dragon.hp+' / '+dragon.maxHp,canvas.width/2,by+bh-6);
  ctx.restore();
}

// --- RANGER SPEED TRAIL ---
function drawTrails(){
  for(const t of game.trails){
    const{x:sx,y:sy}=camera.worldToScreen(t.x,t.y);
    ctx.save();ctx.globalAlpha=t.alpha*(t.timer/0.4);
    ctx.fillStyle='#44ff88';ctx.beginPath();ctx.arc(sx,sy,3*t.timer/0.4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

// --- NOTIFICATIONS (slide from right) ---
function drawNotifications(){
  const nots=game.notifications;
  for(let i=0;i<nots.length;i++){
    const n=nots[i];
    const slideIn=Math.min(1,(3-n.timer)/0.3);// slide in over 0.3s
    const fadeOut=n.timer<0.5?n.timer/0.5:1;
    const x=canvas.width-10-240*slideIn;
    const y=160+i*30;
    ctx.save();ctx.globalAlpha=fadeOut;
    ctx.fillStyle='rgba(0,0,0,0.7)';roundRect(ctx,x,y,230,24,4);ctx.fill();
    ctx.strokeStyle=n.color;ctx.lineWidth=1;roundRect(ctx,x,y,230,24,4);ctx.stroke();
    ctx.font='bold 11px monospace';ctx.textAlign='left';ctx.fillStyle=n.color;
    ctx.fillText(n.text.substring(0,28),x+8,y+16);
    ctx.restore();
  }
}

// --- KILL STREAK POPUP ---
function drawStreakPopup(){
  const sp=game.streakPopup;if(!sp||sp.timer<=0)return;
  const p=1-sp.timer/2.5;
  ctx.save();ctx.globalAlpha=sp.timer<0.5?sp.timer/0.5:1;
  ctx.font='bold 28px sans-serif';ctx.textAlign='center';
  ctx.strokeStyle='#000';ctx.lineWidth=4;
  const y=canvas.height/2-50-p*30;
  ctx.strokeText(sp.text,canvas.width/2,y);
  ctx.fillStyle='#FF8800';ctx.fillText(sp.text,canvas.width/2,y);
  ctx.restore();
}

function drawHUD(){
  const p=game.player;if(!p)return;
  ctx.save();ctx.fillStyle='rgba(0,0,0,0.7)';roundRect(ctx,10,10,220,135,8);ctx.fill();
  ctx.strokeStyle='#446688';ctx.lineWidth=1;roundRect(ctx,10,10,220,135,8);ctx.stroke();
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#44ff88';ctx.textAlign='left';ctx.fillText(p.name,20,30);
  ctx.font='11px sans-serif';ctx.fillStyle=CLASS_DEFS[p.className]?.color||'#fff';
  const jlvStr=(p.jobLevel&&p.jobLevel>1)?' / Job Lv.'+(p.jobLevel||1):'';
  ctx.fillText('Lv.'+p.level+' '+p.className+jlvStr,20,44);
  drawUIBar(20,50,200,18,p.hp/p.maxHp,'#e74c3c','#880000','HP: '+p.hp+'/'+p.maxHp);
  drawUIBar(20,72,200,14,p.mp/p.maxMp,'#3498db','#002266','MP: '+p.mp+'/'+p.maxMp);
  const expR=p.exp/expToNext(p.level);
  drawUIBar(20,90,200,10,expR,'#f1c40f','#664400','Base: '+Math.floor(expR*100)+'%');
  const jlv=p.jobLevel||1;const jexp=p.jobExp||0;
  const jnext=jlv>=30?1:(typeof jobExpToNext==='function'?jobExpToNext(jlv):1);
  const jr=jlv>=30?1:(jexp/jnext);
  drawUIBar(20,103,200,10,jr,'#00CED1','#004455','Job: '+(jlv>=30?'MAX':Math.floor(jr*100)+'%'));
  ctx.fillStyle='#ffcc00';ctx.font='11px monospace';ctx.fillText('Gold: '+p.gold,20,128);
  // Flashing SP icon when unspent stat points > 0
  if(typeof statPointSystem!=='undefined'&&statPointSystem.unspent>0){
    const pulse=Math.sin(Date.now()/250)*0.4+0.6;
    ctx.globalAlpha=pulse;ctx.fillStyle='#f1c40f';ctx.font='bold 10px sans-serif';
    ctx.fillText('SP:'+statPointSystem.unspent,180,128);ctx.globalAlpha=1;
  }
  ctx.restore();
  drawMinimap();
  drawSkillBar(p);
  drawBotPanel();
  if(typeof offlineExpeditionSystem!=='undefined'&&offlineExpeditionSystem.drawHudStatus)offlineExpeditionSystem.drawHudStatus(ctx);
}

function drawUIBar(x,y,w,h,ratio,c1,c2,label){
  ratio=Math.max(0,Math.min(1,ratio));
  ctx.fillStyle='#111';ctx.fillRect(x,y,w,h);
  const g=ctx.createLinearGradient(x,y,x+w*ratio,y);g.addColorStop(0,c2);g.addColorStop(1,c1);
  ctx.fillStyle=g;ctx.fillRect(x,y,w*ratio,h);
  ctx.strokeStyle='#000';ctx.lineWidth=0.5;ctx.strokeRect(x,y,w,h);
  if(label&&h>=10){ctx.font=(h<=12?'9':'11')+'px monospace';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(label,x+w/2,y+h-2)}
}

function drawMinimap(){
  const mm=140,mx=canvas.width-mm-10,my=10;
  ctx.save();ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(mx-2,my-2,mm+4,mm+4);
  ctx.strokeStyle=dungeon.active?'#8844aa':'#446688';ctx.lineWidth=1;ctx.strokeRect(mx-2,my-2,mm+4,mm+4);

  if(dungeon.active){
    // Dungeon minimap
    const DW=dungeon.DG_W,DH=dungeon.DG_H;
    const dungeonPxW=DW*TILE,dungeonPxH=DH*TILE;
    const ts=mm/DW,th=mm/DH;
    const dgColors={0:'#2a2a2a',1:'#444444',2:'#cc4400',3:'#8b6040',4:'#333355',5:'#aaaaaa'};
    for(let r=0;r<DH;r++)for(let c=0;c<DW;c++){const t=dungeon.getTile(c,r);ctx.fillStyle=dgColors[t]||'#111';ctx.fillRect(mx+c*ts,my+r*th,ts+.5,th+.5)}
    // Monsters
    ctx.fillStyle='#ff4444';dungeon.monsters.forEach(m=>{if(!m.isDead)ctx.fillRect(mx+(m.x/(DW*TILE))*mm-1,my+(m.y/(DH*TILE))*mm-1,m.isBoss?3:2,m.isBoss?3:2)});
    // Stairs (pulse yellow when unlocked)
    if(dungeon.stairsPos){
      const alive=dungeon.monsters.filter(m=>!m.isDead).length;
      if(alive===0){const pulse=Math.sin(Date.now()/200)*0.4+0.6;ctx.fillStyle='rgba(255,255,68,'+pulse+')';ctx.fillRect(mx+(dungeon.stairsPos.x/(DW*TILE))*mm-3,my+(dungeon.stairsPos.y/(DH*TILE))*mm-3,6,6)}
      else{ctx.fillStyle='#ffff44';ctx.fillRect(mx+(dungeon.stairsPos.x/(DW*TILE))*mm-2,my+(dungeon.stairsPos.y/(DH*TILE))*mm-2,4,4)}
    }
    // Exit
    if(dungeon.exitPos){ctx.fillStyle='#aa44ff';ctx.fillRect(mx+(dungeon.exitPos.x/(DW*TILE))*mm-2,my+(dungeon.exitPos.y/(DH*TILE))*mm-2,4,4)}
    // Camera viewport
    const viewW=Math.min(canvas.width,dungeonPxW),viewH=Math.min(canvas.height,dungeonPxH);
    const viewX=Math.max(0,Math.min(camera.x,dungeonPxW-viewW));
    const viewY=Math.max(0,Math.min(camera.y,dungeonPxH-viewH));
    ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1;
    ctx.strokeRect(mx+(viewX/TILE)*ts,my+(viewY/TILE)*th,(viewW/TILE)*ts,(viewH/TILE)*th);
    // Player
    blinkTimer++;if(game.player&&blinkTimer%30<20){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx+(game.player.x/(DW*TILE))*mm,my+(game.player.y/(DH*TILE))*mm,2.5,0,Math.PI*2);ctx.fill()}
    // Floor label + monster count
    ctx.fillStyle='#cc88ff';ctx.font='bold 10px monospace';ctx.textAlign='center';
    const dgAlive=dungeon.monsters.filter(m=>!m.isDead).length;
    ctx.fillText('Floor '+dungeon.floor+'/'+dungeon.maxFloor+(dgAlive>0?' — '+dgAlive+' left':''),mx+mm/2,my+mm+12);
    ctx.textAlign='left';
  }else{
    // Overworld minimap
    const ts=mm/MAP_W,th=mm/MAP_H;
    const mmColors=['#3a7a3a','#8b6040','#2040a0','#1a5020','#607070','#c8b090','#806040',
      '#3a7a3a','#3a7a3a','#3a7a3a',
      '#d4b878','#b08050','#3a7a3a','#3080b0',
      '#d0dae8','#a0c8e0','#506878','#506070'];
    for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){const t=map.getTile(c,r);if(t>=0){ctx.fillStyle=mmColors[t]||'#3a7a3a';ctx.fillRect(mx+c*ts,my+r*th,ts+.5,th+.5)}}
    ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1;
    ctx.strokeRect(mx+(camera.x/TILE)*ts,my+(camera.y/TILE)*th,(canvas.width/TILE)*ts,(canvas.height/TILE)*th);
    ctx.fillStyle='#ff4444';game.monsters.forEach(m=>{if(!m.isDead)ctx.fillRect(mx+(m.x/(MAP_W*TILE))*mm-1,my+(m.y/(MAP_H*TILE))*mm-1,2,2)});
    ctx.fillStyle='#44ff44';game.npcPlayers.forEach(n=>{if(!n.isDead)ctx.fillRect(mx+(n.x/(MAP_W*TILE))*mm-1,my+(n.y/(MAP_H*TILE))*mm-1,2,2)});
    // Zone portals on minimap
    if(typeof worldMap!=='undefined'&&worldMap.zones){
      const zone=worldMap.zones[worldMap.currentZone];
      if(zone&&zone.portals){for(const p of zone.portals){
        ctx.fillStyle=p.color||'#4488ff';
        ctx.fillRect(mx+(p.col/MAP_W)*mm-2,my+(p.row/MAP_H)*mm-2,4,4);
      }}
    }
    blinkTimer++;if(game.player&&blinkTimer%30<20){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx+(game.player.x/(MAP_W*TILE))*mm,my+(game.player.y/(MAP_H*TILE))*mm,2.5,0,Math.PI*2);ctx.fill()}
    // Zone name label
    const zoneName=(typeof worldMap!=='undefined'&&worldMap.getZoneName)?worldMap.getZoneName():'Green Forest';
    ctx.fillStyle='#88ccff';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText(zoneName,mx+mm/2,my+mm+12);ctx.textAlign='left';
  }
  ctx.restore();
}

function drawSkillBar(p){
  const skills=p.skills,btnW=44,gap=6,totalW=4*(btnW+gap)-gap;
  const bx=canvas.width/2-totalW/2,by=canvas.height-btnW-14;
  const skColors=['#e74c3c','#3498db','#2ecc71','#f1c40f'];
  ctx.save();
  for(let i=0;i<4;i++){
    const sk=skills[i]||{},x=bx+i*(btnW+gap);
    const locked=sk.reqLv&&p.level<sk.reqLv;const cdR=sk.cdTimer>0?sk.cdTimer/sk.cd:0;
    ctx.fillStyle='#111122';roundRect(ctx,x,by,btnW,btnW,6);ctx.fill();
    ctx.strokeStyle=locked?'#444':skColors[i];ctx.lineWidth=1.5;roundRect(ctx,x,by,btnW,btnW,6);ctx.stroke();
    if(!locked){ctx.fillStyle=skColors[i]+'44';ctx.fillRect(x+4,by+4,btnW-8,btnW-8);
      ctx.fillStyle=skColors[i];ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(sk.name?sk.name.split(' ')[0].substring(0,6):'',x+btnW/2,by+btnW/2+3)}
    if(cdR>0){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();ctx.moveTo(x+btnW/2,by+btnW/2);
      ctx.arc(x+btnW/2,by+btnW/2,btnW/2,-Math.PI/2,-Math.PI/2+Math.PI*2*cdR);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(Math.ceil(sk.cdTimer)+'s',x+btnW/2,by+btnW/2+4)}
    if(locked){ctx.fillStyle='rgba(0,0,0,0.6)';roundRect(ctx,x,by,btnW,btnW,6);ctx.fill();
      ctx.fillStyle='#666';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('Lv'+sk.reqLv,x+btnW/2,by+btnW/2+3)}
    // Skill level badge
    const slv=(p.skillLevels&&p.skillLevels[i])||0;
    if(slv>0){ctx.fillStyle=slv>=10?'#FFD700':'#00CED1';ctx.font='bold 7px monospace';ctx.textAlign='right';ctx.fillText('Lv'+slv,x+btnW-2,by+10)}
    ctx.fillStyle='#ccc';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(['Q','W','E','R'][i],x+btnW/2,by+btnW+12);
  }
  ctx.restore();
}

function drawBotPanel(){
  const pw=200,ph=165,px=canvas.width-pw-10,py=canvas.height-ph-14;
  ctx.save();ctx.fillStyle='rgba(0,0,10,0.8)';roundRect(ctx,px,py,pw,ph,8);ctx.fill();
  ctx.strokeStyle=botAI.enabled?'#20cc40':'#cc2020';ctx.lineWidth=1.5;roundRect(ctx,px,py,pw,ph,8);ctx.stroke();
  ctx.fillStyle='#ccccff';ctx.font='bold 12px monospace';ctx.textAlign='left';ctx.fillText('BOT',px+10,py+18);
  const bx2=px+pw-70,by2=py+6;
  ctx.fillStyle=botAI.enabled?'rgba(20,120,40,0.9)':'rgba(120,20,20,0.9)';roundRect(ctx,bx2,by2,60,20,4);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(botAI.enabled?'STOP':'START',bx2+30,by2+14);
  ctx.textAlign='left';ctx.font='11px monospace';
  const stateMap={idle:'Idle',roaming:'Roaming...',approaching:'Approaching...',combat:'Combat!',looting:'Looting...',retreating:'Retreating!'};
  ctx.fillStyle='#888';ctx.fillText('Status:',px+10,py+38);
  ctx.fillStyle=botAI.state==='combat'?'#ff8844':botAI.state==='retreating'?'#ff4444':'#44ff88';
  ctx.fillText(stateMap[botAI.state]||'Idle',px+70,py+38);
  ctx.fillStyle='#888';ctx.fillText('Kills:',px+10,py+54);ctx.fillStyle='#ff8888';ctx.fillText(''+game.killCount,px+70,py+54);
  const elapsed=(Date.now()-game.sessionStart)/3600000;const expH=elapsed>0.001?Math.floor(game.sessionExp/elapsed):0;
  ctx.fillStyle='#888';ctx.fillText('EXP/hr:',px+10,py+70);ctx.fillStyle='#ffdd44';ctx.fillText(expH.toLocaleString(),px+70,py+70);
  ctx.fillStyle='#888';ctx.font='10px monospace';ctx.fillText('Retreat:',px+10,py+90);
  const slW=pw-85,slX=px+65,slY=py+82;
  ctx.fillStyle='#222';ctx.fillRect(slX,slY,slW,8);ctx.fillStyle='#ff4444';ctx.fillRect(slX,slY,slW*(botAI.settings.hpThreshold/100),8);
  ctx.fillStyle='#faa';ctx.font='9px monospace';ctx.textAlign='right';ctx.fillText(botAI.settings.hpThreshold+'%',px+pw-6,slY+8);
  ctx.textAlign='left';ctx.fillStyle='#888';ctx.font='10px monospace';ctx.fillText('Target:',px+10,py+108);
  ctx.fillStyle='#88aaff';ctx.fillText(botAI.settings.targetPriority,px+65,py+108);
  // Volume slider
  ctx.fillStyle='#888';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('Vol:',px+10,py+128);
  const volX=px+40,volY=py+121,volW=pw-90;
  ctx.fillStyle='#222';ctx.fillRect(volX,volY,volW,8);
  ctx.fillStyle='#44aaff';ctx.fillRect(volX,volY,volW*sfx.volume,8);
  // Mute button
  const mx=px+pw-42,my=py+118;
  ctx.fillStyle=sfx.muted?'rgba(120,20,20,0.9)':'rgba(20,80,120,0.9)';roundRect(ctx,mx,my,36,16,3);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText(sfx.muted?'MUTE':'SND',mx+18,my+12);
  ctx.fillStyle='#445';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('[SPACE] toggle',px+pw/2,py+ph-6);
  ctx.restore();
}

function drawCombatLog(){
  const lW=300,lH=140,lx=10,ly=canvas.height-lH-14;
  ctx.save();ctx.fillStyle='rgba(0,0,0,0.6)';roundRect(ctx,lx,ly,lW,lH,6);ctx.fill();
  ctx.fillStyle='#556677';ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillText('COMBAT LOG',lx+8,ly+12);
  ctx.font='10px monospace';
  const msgs=combatLog.slice(0,8);
  msgs.forEach((m,i)=>{ctx.fillStyle=m.color||'#ccc';ctx.fillText(m.text.substring(0,40),lx+8,ly+24+i*14)});
  ctx.restore();
}

function drawWorldChatUI(){
  const vis=worldChat.slice(0,4);if(!vis.length)return;
  const cx2=10,cy2=canvas.height-14-140-vis.length*16-20;
  ctx.save();ctx.fillStyle='rgba(0,0,0,0.4)';roundRect(ctx,cx2,cy2,300,vis.length*16+8,4);ctx.fill();
  ctx.font='10px monospace';ctx.textAlign='left';
  vis.forEach((m,i)=>{ctx.globalAlpha=Math.max(0.2,m.timer/12);ctx.fillStyle='#8888aa';ctx.fillText('['+m.name+']: '+m.text,cx2+6,cy2+14+i*16)});
  ctx.globalAlpha=1;ctx.restore();
}

// --- Item icon helper ---
function _getItemIcon(item){
  if(!item)return null;
  if(item.type==='potion'){return item.stats.mp?'icon_potion_mp':'icon_potion_hp'}
  if(item.type==='weapon'){
    const n=item.name.toLowerCase();
    if(n.includes('staff'))return'icon_staff';if(n.includes('bow'))return'icon_bow';
    if(n.includes('axe'))return'icon_axe';if(n.includes('mace'))return'icon_mace';
    if(n.includes('dagger'))return'icon_dagger';return'icon_sword';
  }
  if(item.type==='armor'){
    const n=item.name.toLowerCase();
    if(n.includes('robe'))return'icon_robe';if(n.includes('shield'))return'icon_shield';return'icon_armor';
  }
  if(item.type==='accessory'){
    const n=item.name.toLowerCase();
    if(n.includes('amulet'))return'icon_amulet';if(n.includes('bracelet'))return'icon_bracelet';return'icon_ring';
  }
  return null;
}

function _drawItemIcon(x,y,size,item){
  const name=_getItemIcon(item);
  if(name&&spriteCache[name]){ctx.imageSmoothingEnabled=false;ctx.drawImage(spriteCache[name],x,y,size,size);ctx.imageSmoothingEnabled=true}
}

function _itemStatText(item){
  if(!item||!item.stats)return'';
  const parts=[];
  if(item.stats.atk)parts.push('+'+item.stats.atk+' ATK');
  if(item.stats.def)parts.push('+'+item.stats.def+' DEF');
  if(item.stats.hp)parts.push(item.type==='potion'?'Heal '+item.stats.hp+'HP':'+'+item.stats.hp+' HP');
  if(item.stats.mp)parts.push('+'+item.stats.mp+' MP');
  if(item.stats.spd)parts.push('+'+item.stats.spd+' SPD');
  if(item.stats.crit)parts.push('+'+(item.stats.crit*100).toFixed(0)+'% CRT');
  return parts.join(' ');
}

function _rarityStars(r){return{common:'★',uncommon:'★★',rare:'★★★',epic:'★★★★',legendary:'★★★★★'}[r]||'★'}

// --- INVENTORY PANEL (press I) ---
function drawInventoryPanel(){
  const p=game.player;if(!p)return;
  const pw=280,ph=460,px=canvas.width-pw-10,py=80;
  ctx.save();
  // Panel background
  ctx.fillStyle='rgba(5,5,20,0.94)';roundRect(ctx,px,py,pw,ph,10);ctx.fill();
  ctx.strokeStyle='#557799';ctx.lineWidth=1.5;roundRect(ctx,px,py,pw,ph,10);ctx.stroke();
  ctx.fillStyle='#aaccee';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText('Inventory [I]',px+pw/2,py+22);
  ctx.fillStyle='#ffcc00';ctx.font='11px monospace';ctx.textAlign='right';
  ctx.fillText(p.gold+'g',px+pw-12,py+22);

  // --- Equipment slots ---
  const slotW=80,slotH=58,slotGap=8;
  const eqStartX=px+(pw-3*slotW-2*slotGap)/2,eqY=py+34;
  const slotLabels=['Weapon','Armor','Accessory'];
  const slotKeys=['weapon','armor','accessory'];
  slotKeys.forEach((slot,i)=>{
    const sx=eqStartX+i*(slotW+slotGap),sy=eqY;
    const eq=p.equipment[slot];
    const isHov=invTooltipSlot===slot;
    // Background
    ctx.fillStyle=isHov?'#15152a':'#0a0a1a';
    roundRect(ctx,sx,sy,slotW,slotH,4);ctx.fill();
    if(eq){
      ctx.strokeStyle=RARITY_COLORS[eq.rarity]||'#555';ctx.lineWidth=2;
      roundRect(ctx,sx,sy,slotW,slotH,4);ctx.stroke();
      // Icon
      _drawItemIcon(sx+3,sy+4,24,eq);
      // Name (truncated)
      ctx.fillStyle=RARITY_COLORS[eq.rarity]||'#ccc';ctx.font='bold 8px monospace';ctx.textAlign='left';
      ctx.fillText(eq.name.substring(0,10),sx+28,sy+16);
      // Stat summary
      ctx.fillStyle='#8f8';ctx.font='7px monospace';
      ctx.fillText(_itemStatText(eq).substring(0,14),sx+28,sy+26);
      // Slot label
      ctx.fillStyle='#556';ctx.font='7px monospace';ctx.textAlign='center';
      ctx.fillText(slotLabels[i],sx+slotW/2,sy+slotH-4);
    }else{
      // Empty slot
      ctx.setLineDash([3,3]);ctx.strokeStyle='#334';ctx.lineWidth=1;
      roundRect(ctx,sx,sy,slotW,slotH,4);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#445';ctx.font='9px monospace';ctx.textAlign='center';
      ctx.fillText('Empty',sx+slotW/2,sy+28);
      ctx.fillStyle='#334';ctx.font='7px monospace';
      ctx.fillText(slotLabels[i],sx+slotW/2,sy+slotH-4);
    }
  });

  // --- Item grid ---
  const cols=5,slotS=42,gap=4;
  const gx=px+(pw-(cols*slotS+(cols-1)*gap))/2,gy=eqY+slotH+12;
  const rows=4;
  for(let r=0;r<rows;r++)for(let c2=0;c2<cols;c2++){
    const idx=r*cols+c2,sx=gx+c2*(slotS+gap),sy=gy+r*(slotS+gap);
    const isHov=invTooltipIdx===idx;
    const isSel=invSelectedIdx===idx&&invSelectedSlot===null;
    ctx.fillStyle=isHov?'#15152a':isSel?'#1a1a30':'#0a0a1a';
    roundRect(ctx,sx,sy,slotS,slotS,3);ctx.fill();
    const item=p.inventory[idx];
    if(item){
      // Rarity border
      ctx.strokeStyle=RARITY_COLORS[item.rarity]||'#555';ctx.lineWidth=isSel?2:1;
      roundRect(ctx,sx,sy,slotS,slotS,3);ctx.stroke();
      // Icon
      _drawItemIcon(sx+2,sy+2,20,item);
      // Name (truncated)
      ctx.fillStyle=RARITY_COLORS[item.rarity]||'#aaa';ctx.font='7px monospace';ctx.textAlign='center';
      ctx.fillText(item.name.substring(0,7),sx+slotS/2,sy+28);
      // Stat hint
      ctx.fillStyle='#888';ctx.font='6px monospace';
      const hint=item.type==='potion'?'Heal '+(item.stats.hp||0):_itemStatText(item).substring(0,12);
      ctx.fillText(hint,sx+slotS/2,sy+37);
      // Potion stack count
      if(item.type==='potion'){
        const potCount=p.inventory.filter(x=>x&&x.type==='potion'&&x.name===item.name).length;
        if(potCount>1){ctx.fillStyle='#fff';ctx.font='bold 8px monospace';ctx.textAlign='right';ctx.fillText('x'+potCount,sx+slotS-2,sy+12)}
      }
    }else{
      ctx.strokeStyle='#1a1a2a';ctx.lineWidth=1;
      roundRect(ctx,sx,sy,slotS,slotS,3);ctx.stroke();
    }
  }

  // --- Inventory count ---
  ctx.fillStyle='#556';ctx.font='9px monospace';ctx.textAlign='left';
  ctx.fillText(p.inventory.length+'/20 items',px+12,py+ph-36);

  // --- Action buttons (when item selected) ---
  if(invSelectedIdx>=0&&invSelectedSlot===null&&p.inventory[invSelectedIdx]){
    const item=p.inventory[invSelectedIdx];
    const btnY=py+ph-30,btnH=22;
    const btns=[];
    if(item.type==='potion')btns.push({label:'Use',color:'#2ecc71',action:'use'});
    else btns.push({label:'Equip',color:'#3498db',action:'equip'});
    btns.push({label:'Sell '+item.value+'g',color:'#f1c40f',action:'sell'});
    btns.push({label:'Drop',color:'#e74c3c',action:'drop'});
    const btnW=Math.floor((pw-20)/btns.length)-4;
    btns.forEach((b,i)=>{
      const bx=px+10+i*(btnW+4);
      ctx.fillStyle=b.color+'44';roundRect(ctx,bx,btnY,btnW,btnH,4);ctx.fill();
      ctx.strokeStyle=b.color;ctx.lineWidth=1;roundRect(ctx,bx,btnY,btnW,btnH,4);ctx.stroke();
      ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
      ctx.fillText(b.label,bx+btnW/2,btnY+15);
    });
  }
  // --- Selected equipment action ---
  else if(invSelectedSlot!==null&&p.equipment[invSelectedSlot]){
    const btnY=py+ph-30,btnH=22,btnW=80;
    const bx=px+(pw-btnW)/2;
    ctx.fillStyle='#e7434344';roundRect(ctx,bx,btnY,btnW,btnH,4);ctx.fill();
    ctx.strokeStyle='#e74c3c';ctx.lineWidth=1;roundRect(ctx,bx,btnY,btnW,btnH,4);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
    ctx.fillText('Unequip',bx+btnW/2,btnY+15);
  }

  // --- Tooltip ---
  const tipItem=invTooltipSlot?p.equipment[invTooltipSlot]:invTooltipIdx>=0?p.inventory[invTooltipIdx]:null;
  if(tipItem){
    _drawItemTooltip(tipItem,px-200,py+40,p);
  }
  ctx.restore();
}

// --- Item tooltip popup ---
function _drawItemTooltip(item,tx,ty,p){
  const tw=190,th=160;
  // Clamp position
  if(tx<4)tx=4;if(ty+th>canvas.height-4)ty=canvas.height-th-4;
  ctx.fillStyle='rgba(8,8,24,0.96)';roundRect(ctx,tx,ty,tw,th,6);ctx.fill();
  ctx.strokeStyle=RARITY_COLORS[item.rarity]||'#555';ctx.lineWidth=1.5;roundRect(ctx,tx,ty,tw,th,6);ctx.stroke();
  let cy=ty+16;
  // Name
  ctx.fillStyle=RARITY_COLORS[item.rarity]||'#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='left';
  ctx.fillText(item.name,tx+8,cy);cy+=14;
  // Type + rarity
  const typeLabel=item.type==='potion'?'Consumable':item.type==='weapon'?'Weapon':item.type==='armor'?'Armor':'Accessory';
  ctx.fillStyle='#888';ctx.font='9px monospace';
  ctx.fillText(typeLabel+'  Lv.'+item.level,tx+8,cy);cy+=12;
  ctx.fillStyle=RARITY_COLORS[item.rarity];ctx.fillText(_rarityStars(item.rarity)+' '+item.rarity.charAt(0).toUpperCase()+item.rarity.slice(1),tx+8,cy);cy+=14;
  // Stats
  const statEntries=Object.entries(item.stats);
  for(const[k,v]of statEntries){
    const label={atk:'ATK',def:'DEF',hp:'HP',mp:'MP',spd:'SPD',crit:'CRIT'}[k]||k;
    const val=k==='crit'?'+'+(v*100).toFixed(0)+'%':k==='spd'?'+'+v.toFixed(1):'+'+v;
    ctx.fillStyle='#8f8';ctx.font='10px monospace';ctx.fillText(label+': '+val,tx+12,cy);
    // Comparison with equipped
    if(p&&item.type!=='potion'){
      const slot=item.type==='weapon'?'weapon':item.type==='armor'?'armor':'accessory';
      const cur=p.equipment[slot];
      if(cur&&cur!==item){
        const curV=cur.stats[k]||0;const diff=v-curV;
        if(diff!==0){
          ctx.fillStyle=diff>0?'#4f4':'#f44';ctx.textAlign='right';
          ctx.fillText((diff>0?'+':'')+((k==='crit')?(diff*100).toFixed(0)+'%':k==='spd'?diff.toFixed(1):diff),tx+tw-10,cy);
          ctx.textAlign='left';
        }
      }
    }
    cy+=13;
  }
  // Value
  cy+=4;ctx.fillStyle='#cc0';ctx.font='9px monospace';ctx.fillText('Value: '+item.value+'g',tx+8,cy);cy+=12;
  // Hint
  ctx.fillStyle='#556';ctx.font='8px monospace';
  if(item.type==='potion')ctx.fillText('Click to use',tx+8,cy);
  else ctx.fillText('Click to equip/unequip',tx+8,cy);
}

// --- Handle inventory clicks ---
function handleInventoryClick(cx,cy){
  const p=game.player;if(!p)return false;
  const pw=280,ph=460,px=canvas.width-pw-10,py=80;
  // Outside panel
  if(cx<px||cx>px+pw||cy<py||cy>py+ph){showInventory=false;invSelectedIdx=-1;invSelectedSlot=null;return true}

  const slotW=80,slotH=58,slotGap=8;
  const eqStartX=px+(pw-3*slotW-2*slotGap)/2,eqY=py+34;
  const slotKeys=['weapon','armor','accessory'];

  // Equipment slot clicks
  for(let i=0;i<3;i++){
    const sx=eqStartX+i*(slotW+slotGap),sy=eqY;
    if(cx>=sx&&cx<=sx+slotW&&cy>=sy&&cy<=sy+slotH){
      if(invSelectedSlot===slotKeys[i])invSelectedSlot=null; // toggle off
      else{invSelectedSlot=slotKeys[i];invSelectedIdx=-1}
      return true;
    }
  }

  // Item grid clicks
  const cols=5,slotS=42,gap=4;
  const gx=px+(pw-(cols*slotS+(cols-1)*gap))/2,gy=eqY+slotH+12;
  for(let r=0;r<4;r++)for(let c2=0;c2<cols;c2++){
    const idx=r*cols+c2,sx=gx+c2*(slotS+gap),sy=gy+r*(slotS+gap);
    if(cx>=sx&&cx<=sx+slotS&&cy>=sy&&cy<=sy+slotS){
      if(p.inventory[idx]){
        if(invSelectedIdx===idx&&invSelectedSlot===null)invSelectedIdx=-1; // toggle off
        else{invSelectedIdx=idx;invSelectedSlot=null}
      }
      return true;
    }
  }

  // Action buttons
  if(invSelectedIdx>=0&&invSelectedSlot===null&&p.inventory[invSelectedIdx]){
    const item=p.inventory[invSelectedIdx];
    const btnY=py+ph-30,btnH=22;
    const btns=[];
    if(item.type==='potion')btns.push('use');
    else btns.push('equip');
    btns.push('sell');btns.push('drop');
    const btnW=Math.floor((pw-20)/btns.length)-4;
    for(let i=0;i<btns.length;i++){
      const bx=px+10+i*(btnW+4);
      if(cx>=bx&&cx<=bx+btnW&&cy>=btnY&&cy<=btnY+btnH){
        _doInventoryAction(btns[i],invSelectedIdx);
        return true;
      }
    }
  }
  // Unequip button
  if(invSelectedSlot!==null&&p.equipment[invSelectedSlot]){
    const btnY=py+ph-30,btnH=22,btnW=80;
    const bx=px+(pw-btnW)/2;
    if(cx>=bx&&cx<=bx+btnW&&cy>=btnY&&cy<=btnY+btnH){
      _doUnequip(invSelectedSlot);invSelectedSlot=null;
      return true;
    }
  }

  return true;
}

function _doInventoryAction(action,idx){
  const p=game.player;if(!p)return;
  const item=p.inventory[idx];if(!item)return;
  switch(action){
    case'use':
      if(item.type==='potion'){
        p.hp=Math.min(p.maxHp,p.hp+(item.stats.hp||50));
        addDmg(p.x,p.y-TILE,'+'+(item.stats.hp||50),'#44FF44');
        p.inventory.splice(idx,1);addLog('Used '+item.name,'#44FF44');
      }
      break;
    case'equip':{
      if(item.type==='potion')break;
      const slot=item.type==='weapon'?'weapon':item.type==='armor'?'armor':'accessory';
      const cur=p.equipment[slot];
      // Unequip current
      if(cur){for(const[k,v]of Object.entries(cur.stats))if(k in p)p[k]-=v;p.inventory.push(cur)}
      // Equip new
      for(const[k,v]of Object.entries(item.stats))if(k in p)p[k]+=v;
      p.equipment[slot]=item;
      const ii=p.inventory.indexOf(item);if(ii>=0)p.inventory.splice(ii,1);
      addLog('Equipped '+item.name,'#88CCFF');
      break;}

    case'sell':
      p.gold+=item.value||1;p.inventory.splice(idx,1);
      addLog('Sold '+item.name+' for '+item.value+'g','#ffcc00');
      break;
    case'drop':
      game.itemDrops.push({item,x:p.x,y:p.y,timer:30});
      p.inventory.splice(idx,1);addLog('Dropped '+item.name,'#888');
      break;
  }
  invSelectedIdx=-1;invSelectedSlot=null;
}

function _doUnequip(slot){
  const p=game.player;if(!p)return;
  const eq=p.equipment[slot];if(!eq)return;
  if(p.inventory.length>=20){addLog('Inventory full!','#FF4444');return}
  // Remove stats
  for(const[k,v]of Object.entries(eq.stats))if(k in p)p[k]-=v;
  p.inventory.push(eq);p.equipment[slot]=null;
  addLog('Unequipped '+eq.name,'#aaa');
}

function drawCharStatsPanel(){
  const p=game.player;if(!p)return;
  const hasStatSys=typeof statPointSystem!=='undefined';
  const pw=hasStatSys?320:260,ph=hasStatSys?740:420,px=canvas.width-pw-10,py=hasStatSys?20:80;
  ctx.save();
  ctx.fillStyle='rgba(5,5,20,0.94)';roundRect(ctx,px,py,pw,ph,10);ctx.fill();
  ctx.strokeStyle='#557799';ctx.lineWidth=1.5;roundRect(ctx,px,py,pw,ph,10);ctx.stroke();
  ctx.fillStyle='#aaccee';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText('Character [C]',px+pw/2,py+22);

  // --- Character preview (animated sprite) ---
  const sprKey=p.className.toLowerCase()+'_down_'+p.frame;
  const spr=spriteCache[sprKey];
  if(spr){ctx.imageSmoothingEnabled=false;ctx.drawImage(spr,px+14,py+32,48,48);ctx.imageSmoothingEnabled=true}

  // Name, level, class
  ctx.fillStyle=CLASS_DEFS[p.className]?.color||'#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='left';
  ctx.fillText(p.name,px+70,py+48);
  ctx.fillStyle='#ccc';ctx.font='11px monospace';
  ctx.fillText('Lv.'+p.level+' '+p.className,px+70,py+62);
  ctx.fillStyle='#00CED1';ctx.font='9px monospace';
  ctx.fillText('Job Lv.'+(p.jobLevel||1)+'  SP:'+(p.skillPoints||0),px+70,py+74);
  // Title
  if(typeof achievementSystem!=='undefined'&&achievementSystem.getTitle){
    const title=achievementSystem.getTitle();
    if(title){ctx.fillStyle='#f1c40f';ctx.font='9px monospace';ctx.fillText(title,px+70,py+74)}
  }

  // --- Stats with breakdown ---
  let sy=py+92;
  const cd=CLASS_DATA[p.className];
  const statRows=[
    {l:'HP',val:p.maxHp,base:cd?cd.hp:0,col:'#e74c3c',fmt:v=>''+v},
    {l:'MP',val:p.maxMp,base:cd?cd.mp:0,col:'#3498db',fmt:v=>''+v},
    {l:'ATK',val:p.atk,base:cd?cd.atk:0,col:'#e67e22',fmt:v=>''+v},
    {l:'DEF',val:p.def,base:cd?cd.def:0,col:'#2980b9',fmt:v=>''+v},
    {l:'SPD',val:p.spd,base:cd?cd.spd:0,col:'#27ae60',fmt:v=>v.toFixed(1)},
    {l:'CRIT',val:p.crit,base:cd?cd.crit:0,col:'#e91e63',fmt:v=>(v*100).toFixed(0)+'%'}
  ];
  // Calc equipment bonuses
  const eqBonus={hp:0,mp:0,atk:0,def:0,spd:0,crit:0};
  for(const slot of['weapon','armor','accessory']){
    const eq=p.equipment[slot];
    if(eq&&eq.stats){for(const[k,v]of Object.entries(eq.stats)){if(k in eqBonus)eqBonus[k]+=v}}
  }
  const eqMap={HP:'hp',MP:'mp',ATK:'atk',DEF:'def',SPD:'spd',CRIT:'crit'};

  for(const row of statRows){
    // Stat label
    ctx.fillStyle=row.col;ctx.font='bold 11px monospace';ctx.textAlign='left';
    ctx.fillText(row.l,px+14,sy+12);
    // Value
    ctx.fillStyle='#eee';ctx.textAlign='right';ctx.font='bold 11px monospace';
    ctx.fillText(row.fmt(row.val),px+pw-14,sy+12);
    // Breakdown (base + equip)
    const eKey=eqMap[row.l];
    const eVal=eqBonus[eKey]||0;
    const baseVal=row.val-eVal;
    if(eVal>0){
      ctx.fillStyle='#667';ctx.font='8px monospace';ctx.textAlign='left';
      ctx.fillText('base:'+row.fmt(baseVal),px+50,sy+12);
      ctx.fillStyle='#4f4';ctx.fillText('+'+row.fmt(eVal)+' equip',px+120,sy+12);
    }
    sy+=22;
  }

  // --- Equipped items visual ---
  sy+=6;
  ctx.fillStyle='#667';ctx.font='bold 10px sans-serif';ctx.textAlign='left';
  ctx.fillText('EQUIPMENT',px+14,sy);sy+=12;
  for(const slot of['weapon','armor','accessory']){
    const eq=p.equipment[slot];
    ctx.fillStyle='#0a0a1a';roundRect(ctx,px+10,sy,pw-20,28,3);ctx.fill();
    if(eq){
      _drawItemIcon(px+14,sy+4,20,eq);
      ctx.fillStyle=RARITY_COLORS[eq.rarity]||'#aaa';ctx.font='10px monospace';ctx.textAlign='left';
      ctx.fillText(eq.name,px+38,sy+14);
      ctx.fillStyle='#888';ctx.font='8px monospace';ctx.textAlign='right';
      ctx.fillText(_itemStatText(eq),px+pw-16,sy+14);
      ctx.strokeStyle=RARITY_COLORS[eq.rarity]||'#334';ctx.lineWidth=1;
      roundRect(ctx,px+10,sy,pw-20,28,3);ctx.stroke();
    }else{
      ctx.fillStyle='#334';ctx.font='9px monospace';ctx.textAlign='left';
      ctx.fillText(slot+': empty',px+14,sy+17);
    }
    sy+=32;
  }

  // --- Additional info ---
  sy+=8;
  ctx.fillStyle='#667';ctx.font='bold 10px sans-serif';ctx.textAlign='left';
  ctx.fillText('STATS',px+14,sy);sy+=14;
  const timeSec=Math.floor(game.time);
  const timeStr=Math.floor(timeSec/3600)+'h '+Math.floor((timeSec%3600)/60)+'m';
  const info=[
    ['Kills',p.killCount],
    ['Play Time',timeStr],
    ['Zone',dungeon.active?'Dungeon F'+dungeon.floor:'Overworld'],
  ];
  if(typeof petSystem!=='undefined'&&petSystem.active){
    info.push(['Pet',petSystem.active.type]);
  }
  for(const[l,v]of info){
    ctx.fillStyle='#888';ctx.font='9px monospace';ctx.textAlign='left';
    ctx.fillText(l+':',px+14,sy);
    ctx.fillStyle='#ccc';ctx.textAlign='right';
    ctx.fillText(''+v,px+pw-14,sy);
    sy+=14;
  }
  // Stat point allocation section
  if(typeof statPointSystem!=='undefined'){
    statPointSystem.drawStatAllocation(px,py,pw,sy+4);
  }
  // Flashing SP icon in HUD when unspent > 0
  ctx.restore();
}

// --- SETTINGS PANEL ---
function drawSettingsPanel(){
  if(!showSettings)return;
  const W=canvas.width,H=canvas.height;
  const pw=340,ph=474;
  const px=(W-pw)/2,py=(H-ph)/2;
  const s=game.settings;
  ctx.save();
  // Overlay
  ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(0,0,W,H);
  // Panel
  ctx.fillStyle='rgba(10,10,30,0.95)';roundRect(ctx,px,py,pw,ph,12);ctx.fill();
  ctx.strokeStyle='#557799';ctx.lineWidth=2;roundRect(ctx,px,py,pw,ph,12);ctx.stroke();
  // Title
  ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillStyle='#aaccee';
  ctx.fillText('Settings',px+pw/2,py+28);
  // X close
  ctx.fillStyle='rgba(180,40,40,0.8)';roundRect(ctx,px+pw-28,py+8,20,20,4);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.fillText('X',px+pw-18,py+23);

  let row=0;
  const rowY=i=>py+50+i*38;
  const lx=px+14,rx=px+pw-14;

  // Volume slider
  ctx.textAlign='left';ctx.font='12px monospace';ctx.fillStyle='#aaa';ctx.fillText('Master Volume',lx,rowY(row)+14);
  const volSx=px+160,volSw=pw-180;
  ctx.fillStyle='#222';ctx.fillRect(volSx,rowY(row)+5,volSw,10);
  ctx.fillStyle='#44aaff';ctx.fillRect(volSx,rowY(row)+5,volSw*s.volume,10);
  ctx.fillStyle='#ccc';ctx.font='10px monospace';ctx.textAlign='right';ctx.fillText(Math.round(s.volume*100)+'%',rx,rowY(row)+15);
  row++;

  // Mute toggle
  ctx.textAlign='left';ctx.font='12px monospace';ctx.fillStyle='#aaa';ctx.fillText('Mute',lx,rowY(row)+14);
  drawToggle(px+160,rowY(row)+2,!s.muted);
  row++;

  // Game speed
  ctx.textAlign='left';ctx.fillStyle='#aaa';ctx.fillText('Game Speed',lx,rowY(row)+14);
  const speeds=[{l:'1x',v:1},{l:'2x',v:2},{l:'4x',v:4}];
  speeds.forEach((sp,i)=>{
    const bx=px+160+i*50,by=rowY(row)+1;
    ctx.fillStyle=s.gameSpeed===sp.v?'rgba(20,120,180,0.9)':'rgba(40,40,60,0.9)';
    roundRect(ctx,bx,by,42,20,4);ctx.fill();
    ctx.fillStyle=s.gameSpeed===sp.v?'#fff':'#888';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText(sp.l,bx+21,by+14);
  });
  row++;

  // Toggles
  const toggles=[
    ['Show Damage Numbers','showDmgNumbers'],
    ['Show NPC Players','showNPCs'],
    ['Show World Chat','showChat'],
    ['Bot Auto-Buy Potions','autoBuyPotions'],
    ['Auto Stat Allocate','autoStatAllocate'],
    ['Auto Talent Allocate','autoTalentAllocate'],
    ['Auto Skill Allocate','autoSkillAllocate']
  ];
  toggles.forEach(([label,key])=>{
    ctx.textAlign='left';ctx.font='12px monospace';ctx.fillStyle='#aaa';ctx.fillText(label,lx,rowY(row)+14);
    drawToggle(px+260,rowY(row)+2,s[key]);
    row++;
  });

  // New Game button
  const ngx=px+(pw-140)/2,ngy=rowY(row)+4;
  if(confirmNewGame){
    ctx.fillStyle='rgba(180,40,40,0.9)';roundRect(ctx,ngx,ngy,140,28,6);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('Confirm Delete?',ngx+70,ngy+19);
  }else{
    ctx.fillStyle='rgba(120,30,30,0.9)';roundRect(ctx,ngx,ngy,140,28,6);ctx.fill();
    ctx.strokeStyle='#cc4444';ctx.lineWidth=1;roundRect(ctx,ngx,ngy,140,28,6);ctx.stroke();
    ctx.fillStyle='#ff6666';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('New Game',ngx+70,ngy+19);
  }

  ctx.fillStyle='#445';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('[ESC] close',px+pw/2,py+ph-10);
  ctx.restore();
}

function drawToggle(x,y,on){
  ctx.fillStyle=on?'rgba(20,120,40,0.9)':'rgba(80,30,30,0.9)';
  roundRect(ctx,x,y,50,20,4);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.textAlign='center';
  ctx.fillText(on?'ON':'OFF',x+25,y+14);
}

function handleSettingsClick(cx2,cy2){
  const W=canvas.width,H=canvas.height;
  const pw=340,ph=474;
  const px=(W-pw)/2,py=(H-ph)/2;
  const s=game.settings;

  // Click outside → close
  if(cx2<px||cx2>px+pw||cy2<py||cy2>py+ph){showSettings=false;confirmNewGame=false;return}
  // X close
  if(cx2>=px+pw-28&&cx2<=px+pw-8&&cy2>=py+8&&cy2<=py+28){showSettings=false;confirmNewGame=false;return}

  const rowY=i=>py+50+i*38;

  // Volume slider (row 0)
  const volSx=px+160,volSw=pw-180;
  if(cy2>=rowY(0)+3&&cy2<=rowY(0)+17&&cx2>=volSx&&cx2<=volSx+volSw){
    s.volume=Math.max(0,Math.min(1,(cx2-volSx)/volSw));sfx.setVolume(s.volume);sfx.volume=s.volume;saveSettings();return;
  }
  // Mute toggle (row 1)
  if(cx2>=px+160&&cx2<=px+210&&cy2>=rowY(1)&&cy2<=rowY(1)+24){s.muted=!s.muted;sfx.muted=s.muted;if(sfx.masterGain)sfx.masterGain.gain.value=s.muted?0:s.volume;saveSettings();return}
  // Game speed (row 2)
  const speeds=[1,2,4];
  speeds.forEach((v,i)=>{const bx=px+160+i*50,by=rowY(2)+1;if(cx2>=bx&&cx2<=bx+42&&cy2>=by&&cy2<=by+20){s.gameSpeed=v;saveSettings()}});
  // Toggles (rows 3-6)
  const toggleKeys=['showDmgNumbers','showNPCs','showChat','autoBuyPotions','autoStatAllocate','autoTalentAllocate','autoSkillAllocate'];
  toggleKeys.forEach((key,i)=>{
    if(cx2>=px+260&&cx2<=px+310&&cy2>=rowY(3+i)&&cy2<=rowY(3+i)+24){s[key]=!s[key];saveSettings()}
  });
  // New Game button (row 10)
  const ngx=px+(pw-140)/2,ngy=rowY(10)+4;
  if(cx2>=ngx&&cx2<=ngx+140&&cy2>=ngy&&cy2<=ngy+28){
    if(confirmNewGame){deleteSave();location.reload()}
    else{confirmNewGame=true}
  }
}

// --- HELP PANEL (F1 or ?) ---
function drawHelpPanel(){
  if(!showHelp)return;
  const W=canvas.width,H=canvas.height;
  const pw=420,ph=440;
  const px=(W-pw)/2,py=(H-ph)/2;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(8,8,28,0.96)';roundRect(ctx,px,py,pw,ph,12);ctx.fill();
  ctx.strokeStyle='#557799';ctx.lineWidth=2;roundRect(ctx,px,py,pw,ph,12);ctx.stroke();
  ctx.fillStyle='#aaccee';ctx.font='bold 18px sans-serif';ctx.textAlign='center';
  ctx.fillText('Controls & Help',px+pw/2,py+28);
  // X close
  ctx.fillStyle='rgba(180,40,40,0.8)';roundRect(ctx,px+pw-28,py+8,20,20,4);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.fillText('X',px+pw-18,py+23);

  let cy=py+50;const lx=px+16,rx=px+pw-16;
  const section=(title)=>{ctx.fillStyle='#88aacc';ctx.font='bold 12px sans-serif';ctx.textAlign='left';ctx.fillText(title,lx,cy);cy+=16};
  const row=(key,desc)=>{ctx.fillStyle='#f0c030';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText(key,lx,cy);ctx.fillStyle='#aaa';ctx.textAlign='right';ctx.fillText(desc,rx,cy);cy+=15};

  section('=== CONTROLS ===');
  row('WASD / Arrows','Movement (bot OFF)');
  row('Space','Toggle Bot AI');
  row('Q, W, E, R','Use Skills 1-4');
  row('I','Inventory');
  row('C','Character Stats');
  row('T','Talent Tree');
  row('H','Achievements');
  row('L','Leaderboard');
  row('ESC','Settings / Close Panel');
  row('F1 or ?','This Help Screen');
  row('M','Mute Sound');
  row('F','Enter Dungeon (near portal)');
  cy+=6;
  section('=== PANELS ===');
  row('Shop NPC','Click to buy/sell items');
  row('Quest Board','Click for quest list');
  row('Dungeon Portal','Click or press F (Lv.5+)');
  cy+=6;
  section('=== BOT CONTROLS ===');
  row('Bottom-right panel','Toggle + settings');
  row('Auto behavior','Farms, enters dungeon, quests');
  row('Retreat','Auto-potions when HP low');
  cy+=6;
  section('=== TIPS ===');
  ctx.fillStyle='#888';ctx.font='9px monospace';ctx.textAlign='left';
  ctx.fillText('Click items in inventory to equip/use/sell',lx,cy);cy+=13;
  ctx.fillText('Kill all monsters on a dungeon floor to unlock stairs',lx,cy);cy+=13;
  ctx.fillText('World Boss spawns every 5 minutes in overworld',lx,cy);cy+=13;
  ctx.fillText('Press H to track achievements and earn rewards',lx,cy);

  ctx.fillStyle='#445';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('[ESC] or [F1] close',px+pw/2,py+ph-10);
  ctx.restore();
}

function handleHelpClick(cx,cy){
  const W=canvas.width,H=canvas.height;
  const pw=420,ph=440;
  const px=(W-pw)/2,py=(H-ph)/2;
  // Outside or X button
  if(cx<px||cx>px+pw||cy<py||cy>py+ph||(cx>=px+pw-28&&cx<=px+pw-8&&cy>=py+8&&cy<=py+28)){showHelp=false;return true}
  return true;
}

// --- QUICK ACTION BUTTONS (left sidebar below HUD) ---
const QUICK_BTNS=[
  {label:'Items',icon:'bag',color:'#e67e22',key:'I'},
  {label:'Stats',icon:'chart',color:'#e74c3c',key:'C'},
  {label:'Skills',icon:'star',color:'#3498db',key:'B'},
  {label:'Talents',icon:'tree',color:'#f1c40f',key:'T'},
  {label:'Quest',icon:'scroll',color:'#2ecc71',key:'Q'},
  {label:'Craft',icon:'anvil',color:'#d35400',key:'K'},
  {label:'Guild',icon:'shield',color:'#e91e63',key:'G'},
  {label:'Enchant',icon:'gem',color:'#8e44ad',key:'N'},
  {label:'Summon',icon:'portal',color:'#c0392b',key:'U'},
  {label:'Menu',icon:'grid',color:'#95a5a6',key:'TAB'},
];
const QB_SIZE=34,QB_GAP=3,QB_X=10,QB_Y0=152;

function drawQuickButtons(){
  if(game.state!=='playing')return;
  ctx.save();
  for(let i=0;i<QUICK_BTNS.length;i++){
    const btn=QUICK_BTNS[i];
    const bx=QB_X,by=QB_Y0+i*(QB_SIZE+QB_GAP);
    // Check if this panel is currently open for highlight
    let active=false;
    switch(i){
      case 0:active=showInventory;break;
      case 1:active=showCharStats;break;
      case 2:active=typeof showSkillPanel!=='undefined'&&showSkillPanel;break;
      case 3:active=talentSystem.panelOpen;break;
      case 4:active=typeof questSystem!=='undefined'&&questSystem.boardOpen;break;
      case 5:active=typeof craftingSystem!=='undefined'&&craftingSystem.panelOpen;break;
      case 6:active=typeof guildSystem!=='undefined'&&guildSystem.panelOpen;break;
      case 7:active=typeof enchantSystem!=='undefined'&&enchantSystem.panelOpen;break;
      case 8:active=typeof gachaSystem!=='undefined'&&gachaSystem.panelOpen;break;
      case 9:active=showTabMenu;break;
    }
    // Background
    ctx.fillStyle=active?'rgba(255,255,255,0.15)':'rgba(0,0,10,0.7)';
    roundRect(ctx,bx,by,QB_SIZE,QB_SIZE,6);ctx.fill();
    ctx.strokeStyle=active?btn.color:btn.color+'88';ctx.lineWidth=active?2:1;
    roundRect(ctx,bx,by,QB_SIZE,QB_SIZE,6);ctx.stroke();
    // Icon (centered in button)
    const ix=bx+QB_SIZE/2,iy=by+QB_SIZE/2-2;
    ctx.fillStyle=btn.color;
    if(btn.icon==='bag'){ctx.fillRect(ix-5,iy-5,10,10)}
    else if(btn.icon==='chart'){ctx.fillRect(ix-6,iy-1,3,7);ctx.fillRect(ix-2,iy-5,3,11);ctx.fillRect(ix+3,iy-3,3,9)}
    else if(btn.icon==='star'){ctx.beginPath();ctx.moveTo(ix,iy-7);ctx.lineTo(ix+4,iy+5);ctx.lineTo(ix-4,iy+5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(ix,iy+7);ctx.lineTo(ix+4,iy-3);ctx.lineTo(ix-4,iy-3);ctx.closePath();ctx.fill()}
    else if(btn.icon==='tree'){ctx.beginPath();ctx.moveTo(ix,iy-7);ctx.lineTo(ix+7,iy+5);ctx.lineTo(ix-7,iy+5);ctx.closePath();ctx.fill();ctx.fillRect(ix-1.5,iy+5,3,4)}
    else if(btn.icon==='scroll'){ctx.fillRect(ix-4,iy-6,8,12);ctx.fillStyle='#111';ctx.fillRect(ix-2,iy-3,5,1);ctx.fillRect(ix-2,iy,5,1);ctx.fillRect(ix-2,iy+3,5,1)}
    else if(btn.icon==='anvil'){ctx.fillRect(ix-5,iy-1,10,3);ctx.fillRect(ix-2,iy+2,5,4);ctx.fillRect(ix-6,iy-4,4,3)}
    else if(btn.icon==='shield'){ctx.beginPath();ctx.moveTo(ix,iy-7);ctx.lineTo(ix+6,iy-3);ctx.lineTo(ix+5,iy+3);ctx.lineTo(ix,iy+7);ctx.lineTo(ix-5,iy+3);ctx.lineTo(ix-6,iy-3);ctx.closePath();ctx.fill()}
    else if(btn.icon==='gem'){ctx.beginPath();ctx.moveTo(ix,iy-6);ctx.lineTo(ix+5,iy);ctx.lineTo(ix,iy+6);ctx.lineTo(ix-5,iy);ctx.closePath();ctx.fill()}
    else if(btn.icon==='portal'){ctx.beginPath();ctx.arc(ix,iy,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ix,iy,3,0,Math.PI*2);ctx.fill()}
    else if(btn.icon==='grid'){ctx.fillRect(ix-6,iy-6,5,5);ctx.fillRect(ix+1,iy-6,5,5);ctx.fillRect(ix-6,iy+1,5,5);ctx.fillRect(ix+1,iy+1,5,5)}
    // Label to the right
    ctx.fillStyle=active?'#fff':'#aab';
    ctx.font='8px sans-serif';ctx.textAlign='left';
    ctx.fillText(btn.label,bx+QB_SIZE+4,by+QB_SIZE/2+3);
  }
  ctx.restore();
}

function handleQuickButtonClick(cx,cy){
  for(let i=0;i<QUICK_BTNS.length;i++){
    const bx=QB_X,by=QB_Y0+i*(QB_SIZE+QB_GAP);
    if(cx>=bx&&cx<=bx+QB_SIZE&&cy>=by&&cy<=by+QB_SIZE){
      switch(i){
        case 0:showInventory=!showInventory;showCharStats=false;invSelectedIdx=-1;invSelectedSlot=null;break;
        case 1:showCharStats=!showCharStats;showInventory=false;break;
        case 2:if(typeof showSkillPanel!=='undefined')showSkillPanel=!showSkillPanel;break;
        case 3:talentSystem.panelOpen=!talentSystem.panelOpen;break;
        case 4:if(typeof questSystem!=='undefined')questSystem.boardOpen=!questSystem.boardOpen;break;
        case 5:if(typeof craftingSystem!=='undefined')craftingSystem.panelOpen=!craftingSystem.panelOpen;break;
        case 6:if(typeof guildSystem!=='undefined')guildSystem.panelOpen=!guildSystem.panelOpen;break;
        case 7:if(typeof enchantSystem!=='undefined')enchantSystem.panelOpen=!enchantSystem.panelOpen;break;
        case 8:if(typeof gachaSystem!=='undefined')gachaSystem.panelOpen=!gachaSystem.panelOpen;break;
        case 9:showTabMenu=!showTabMenu;break;
      }
      return true;
    }
  }
  return false;
}

// --- CONTROL HINTS BAR (bottom of screen, always visible) ---
function drawControlHints(){
  if(game.state!=='playing')return;
  const y=canvas.height-4;
  ctx.save();ctx.globalAlpha=0.4;ctx.fillStyle='#000';ctx.fillRect(0,y-14,canvas.width,18);
  ctx.globalAlpha=0.7;ctx.fillStyle='#99aabb';ctx.font='9px monospace';ctx.textAlign='center';
  ctx.fillText('[TAB] Menu  [X] Expedition  [SPACE] Bot',canvas.width/2,y);ctx.restore();
}

// --- TAB MENU OVERLAY ---
function drawTabMenu(){
  if(!showTabMenu)return;
  const W=canvas.width,H=canvas.height;
  // Dark overlay
  ctx.save();ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
  // Panel
  const pw=360,ph=446;
  const px=(W-pw)/2,py=(H-ph)/2;
  ctx.fillStyle='rgba(12,12,30,0.96)';roundRect(ctx,px,py,pw,ph,12);ctx.fill();
  ctx.strokeStyle='#556688';ctx.lineWidth=2;roundRect(ctx,px,py,pw,ph,12);ctx.stroke();
  // Title
  ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ccddeeff';ctx.fillText('MENU',px+pw/2,py+28);
  // X close button
  const clx=px+pw-28,cly=py+8;
  ctx.fillStyle='rgba(180,40,40,0.8)';roundRect(ctx,clx,cly,20,20,4);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('X',clx+10,cly+15);
  // Button grid 4x4
  const buttons=[
    {label:'Items',key:'I',color:'#e67e22',icon:'bag'},{label:'Stats',key:'C',color:'#e74c3c',icon:'chart'},{label:'Skills',key:'B',color:'#3498db',icon:'star'},{label:'Talents',key:'T',color:'#f1c40f',icon:'tree'},
    {label:'Quests',key:'Q',color:'#2ecc71',icon:'scroll'},{label:'Achieve',key:'H',color:'#9b59b6',icon:'trophy'},{label:'Ranks',key:'L',color:'#1abc9c',icon:'crown'},{label:'Guild',key:'G',color:'#e91e63',icon:'shield'},
    {label:'Craft',key:'K',color:'#d35400',icon:'anvil'},{label:'Enchant',key:'N',color:'#8e44ad',icon:'gem'},{label:'Summon',key:'U',color:'#c0392b',icon:'portal'},{label:'PvP',key:'P',color:'#e74c3c',icon:'swords'},
    {label:'Settings',key:'ESC',color:'#7f8c8d',icon:'gear'},{label:'Help',key:'?',color:'#95a5a6',icon:'?'},{label:'Save',key:'',color:'#27ae60',icon:'disk'},{label:'Class',key:'J',color:'#f39c12',icon:'helm'}
  ];
  const bw=72,bh=60,gap=8;
  const gridW=4*bw+3*gap,gridH=4*bh+3*gap;
  const gx=px+(pw-gridW)/2,gy=py+42;
  for(let i=0;i<buttons.length;i++){
    const btn=buttons[i];
    const col=i%4,row=Math.floor(i/4);
    const bx=gx+col*(bw+gap),by=gy+row*(bh+gap);
    // Button bg
    ctx.fillStyle='rgba(20,20,40,0.9)';roundRect(ctx,bx,by,bw,bh,8);ctx.fill();
    ctx.strokeStyle=btn.color+'88';ctx.lineWidth=1;roundRect(ctx,bx,by,bw,bh,8);ctx.stroke();
    // Icon area
    const ix=bx+bw/2,iy=by+20;
    ctx.fillStyle=btn.color;
    if(btn.icon==='bag'){ctx.fillRect(ix-6,iy-6,12,12)}
    else if(btn.icon==='chart'){ctx.fillRect(ix-7,iy-2,4,8);ctx.fillRect(ix-2,iy-6,4,12);ctx.fillRect(ix+3,iy-4,4,10)}
    else if(btn.icon==='star'){ctx.beginPath();ctx.moveTo(ix,iy-8);ctx.lineTo(ix+5,iy+6);ctx.lineTo(ix-5,iy+6);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(ix,iy+8);ctx.lineTo(ix+5,iy-4);ctx.lineTo(ix-5,iy-4);ctx.closePath();ctx.fill()}
    else if(btn.icon==='tree'){ctx.beginPath();ctx.moveTo(ix,iy-8);ctx.lineTo(ix+8,iy+6);ctx.lineTo(ix-8,iy+6);ctx.closePath();ctx.fill();ctx.fillRect(ix-2,iy+6,4,4)}
    else if(btn.icon==='scroll'){ctx.fillRect(ix-5,iy-7,10,14);ctx.fillStyle='#111';ctx.fillRect(ix-3,iy-4,6,1);ctx.fillRect(ix-3,iy-1,6,1);ctx.fillRect(ix-3,iy+2,6,1)}
    else if(btn.icon==='trophy'){ctx.fillRect(ix-5,iy-5,10,8);ctx.fillRect(ix-2,iy+3,4,3);ctx.fillRect(ix-4,iy+6,8,2);ctx.fillStyle='#111';ctx.fillRect(ix-5,iy-5,1,8);ctx.fillRect(ix+4,iy-5,1,8)}
    else if(btn.icon==='crown'){ctx.beginPath();ctx.moveTo(ix-7,iy+4);ctx.lineTo(ix-7,iy-3);ctx.lineTo(ix-3,iy);ctx.lineTo(ix,iy-6);ctx.lineTo(ix+3,iy);ctx.lineTo(ix+7,iy-3);ctx.lineTo(ix+7,iy+4);ctx.closePath();ctx.fill()}
    else if(btn.icon==='shield'){ctx.beginPath();ctx.moveTo(ix,iy-8);ctx.lineTo(ix+7,iy-4);ctx.lineTo(ix+6,iy+3);ctx.lineTo(ix,iy+8);ctx.lineTo(ix-6,iy+3);ctx.lineTo(ix-7,iy-4);ctx.closePath();ctx.fill()}
    else if(btn.icon==='anvil'){ctx.fillRect(ix-6,iy-2,12,4);ctx.fillRect(ix-3,iy+2,6,5);ctx.fillRect(ix-7,iy-5,5,3)}
    else if(btn.icon==='gem'){ctx.beginPath();ctx.moveTo(ix,iy-7);ctx.lineTo(ix+6,iy);ctx.lineTo(ix,iy+7);ctx.lineTo(ix-6,iy);ctx.closePath();ctx.fill()}
    else if(btn.icon==='portal'){ctx.beginPath();ctx.arc(ix,iy,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ix,iy,4,0,Math.PI*2);ctx.fill()}
    else if(btn.icon==='swords'){ctx.strokeStyle=btn.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ix-6,iy-6);ctx.lineTo(ix+6,iy+6);ctx.moveTo(ix+6,iy-6);ctx.lineTo(ix-6,iy+6);ctx.stroke()}
    else if(btn.icon==='gear'){ctx.beginPath();ctx.arc(ix,iy,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ix,iy,3,0,Math.PI*2);ctx.fill();for(let n=0;n<6;n++){const a=Math.PI*2*n/6;ctx.fillStyle=btn.color;ctx.fillRect(ix+Math.cos(a)*7-1.5,iy+Math.sin(a)*7-1.5,3,3)}}
    else if(btn.icon==='?'){ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('?',ix,iy+6)}
    else if(btn.icon==='disk'){ctx.fillRect(ix-6,iy-6,12,12);ctx.fillStyle='#111';ctx.fillRect(ix-3,iy-6,6,5);ctx.fillRect(ix-4,iy+2,8,3)}
    else if(btn.icon==='helm'){ctx.beginPath();ctx.arc(ix,iy,7,Math.PI,0);ctx.fill();ctx.fillRect(ix-7,iy,14,3);ctx.fillStyle='#111';ctx.fillRect(ix-2,iy-4,4,4)}
    // Label
    ctx.fillStyle='#ccc';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText(btn.label,bx+bw/2,by+bh-6);
    // Key shortcut
    if(btn.key){ctx.fillStyle='#667';ctx.font='7px monospace';ctx.textAlign='right';ctx.fillText(btn.key,bx+bw-3,by+10)}
  }
  const ex=px+28,ey=gy+gridH+18,ew=pw-56,eh=50;
  ctx.fillStyle='rgba(20,28,50,0.92)';roundRect(ctx,ex,ey,ew,eh,8);ctx.fill();
  ctx.strokeStyle='#5dade2';ctx.lineWidth=1.5;roundRect(ctx,ex,ey,ew,eh,8);ctx.stroke();
  ctx.fillStyle='#5dade2';ctx.beginPath();ctx.arc(ex+28,ey+25,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ex+28,ey+25,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d8ecff';ctx.font='bold 14px sans-serif';ctx.textAlign='left';ctx.fillText('Expedition',ex+48,ey+21);
  ctx.fillStyle='#8fb7d9';ctx.font='10px sans-serif';ctx.fillText('Start or claim offline expedition rewards',ex+48,ey+37);
  ctx.fillStyle='#667';ctx.font='8px monospace';ctx.textAlign='right';ctx.fillText('X',ex+ew-10,ey+14);
  ctx.restore();
}

// --- TAB MENU CLICK HANDLER ---
function handleTabMenuClick(cx,cy){
  if(!showTabMenu)return false;
  const W=canvas.width,H=canvas.height;
  const pw=360,ph=446;
  const px=(W-pw)/2,py=(H-ph)/2;
  // Outside panel
  if(cx<px||cx>px+pw||cy<py||cy>py+ph){showTabMenu=false;return true}
  // X close
  const clx=px+pw-28,cly=py+8;
  if(cx>=clx&&cx<=clx+20&&cy>=cly&&cy<=cly+20){showTabMenu=false;return true}
  // Check grid buttons
  const bw=72,bh=60,gap=8;
  const gridW=4*bw+3*gap,gridH=4*bh+3*gap;
  const gx=px+(pw-gridW)/2,gy=py+42;
  for(let i=0;i<16;i++){
    const col=i%4,row=Math.floor(i/4);
    const bx=gx+col*(bw+gap),by=gy+row*(bh+gap);
    if(cx>=bx&&cx<=bx+bw&&cy>=by&&cy<=by+bh){
      showTabMenu=false;
      switch(i){
        case 0:showInventory=true;showCharStats=false;break; // Items
        case 1:showCharStats=true;showInventory=false;break; // Stats
        case 2:if(typeof showSkillPanel!=='undefined')showSkillPanel=true;break; // Skills
        case 3:if(typeof talentSystem!=='undefined')talentSystem.panelOpen=true;break; // Talents
        case 4:if(typeof questSystem!=='undefined')questSystem.boardOpen=true;break; // Quests
        case 5:if(typeof achievementSystem!=='undefined')achievementSystem.panelOpen=true;break; // Achieve
        case 6:if(typeof leaderboard!=='undefined')leaderboard.panelOpen=true;break; // Ranks
        case 7:if(typeof guildSystem!=='undefined')guildSystem.panelOpen=true;break; // Guild
        case 8:if(typeof craftingSystem!=='undefined')craftingSystem.panelOpen=true;break; // Craft
        case 9:if(typeof enchantSystem!=='undefined')enchantSystem.panelOpen=true;break; // Enchant
        case 10:if(typeof gachaSystem!=='undefined')gachaSystem.panelOpen=true;break; // Summon
        case 11:if(typeof pvpArena!=='undefined')pvpArena.panelOpen=true;break; // PvP
        case 12:showSettings=true;break; // Settings
        case 13:showHelp=true;break; // Help
        case 14:if(typeof saveGame==='function'){saveGame();addNotification('Game Saved!','#27ae60')}break; // Save
        case 15:if(typeof classChangeSystem!=='undefined')classChangeSystem.panelOpen=true;break; // Class
      }
      return true;
    }
  }
  const ex=px+28,ey=gy+gridH+18,ew=pw-56,eh=50;
  if(cx>=ex&&cx<=ex+ew&&cy>=ey&&cy<=ey+eh){
    showTabMenu=false;
    if(typeof offlineExpeditionSystem!=='undefined')offlineExpeditionSystem.panelOpen=true;
    return true;
  }
  return true;
}

function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(game.state==='classSelect'){drawClassSelect();return}
  // Screen shake
  ctx.save();
  if(game.shakeTimer>0){
    const sx=Math.round((Math.random()-0.5)*2*game.shakeIntensity);
    const sy=Math.round((Math.random()-0.5)*2*game.shakeIntensity);
    ctx.translate(sx,sy);
  }
  if(typeof pvpArena!=='undefined'&&pvpArena.active){
    pvpArena.drawArenaMap();
    drawEntities();
    if(pvpArena.opponent)pvpArena.drawOpponent();
  }else if(dungeon.active){
    dungeon.drawTiles();
    if(typeof dungeon.drawMonsters==='function')dungeon.drawMonsters();
    drawEntities();
  }else{
    drawMapTiles();drawTrails();drawTownNPCs();
    if(typeof drawDungeonPortal==='function')drawDungeonPortal();
    if(typeof drawQuestBoard==='function')drawQuestBoard();
    if(typeof worldMap!=='undefined')worldMap.drawPortals();
    if(typeof craftingSystem!=='undefined'&&craftingSystem.drawAnvilNPC)craftingSystem.drawAnvilNPC();
    if(typeof pvpArena!=='undefined'&&pvpArena.drawArenaNPC)pvpArena.drawArenaNPC();
    if(typeof classChangeSystem!=='undefined'&&classChangeSystem.drawMasterNPC)classChangeSystem.drawMasterNPC();
    if(typeof enchantSystem!=='undefined'&&enchantSystem.drawEnchantNPC)enchantSystem.drawEnchantNPC();
    if(typeof guildSystem!=='undefined'&&guildSystem.drawGuildNPC)guildSystem.drawGuildNPC();
    if(typeof gachaSystem!=='undefined'&&gachaSystem.drawAltarNPC)gachaSystem.drawAltarNPC();
    drawEntities();
  }
  if(typeof drawWorldBoss==='function')drawWorldBoss();
  if(typeof drawPet==='function')drawPet();
  if(game.settings.showDmgNumbers)drawDmgNumbers();
  drawEffectsVis();
  if(typeof pvpArena!=='undefined'&&pvpArena.active){
    pvpArena.drawOpponentHPBar();pvpArena.drawTimer();
    if(pvpArena.state==='countdown')pvpArena.drawCountdown();
  }else if(dungeon.active&&typeof dungeon.drawHUD==='function')dungeon.drawHUD();
  else drawDayNight();
  if(typeof worldMap!=='undefined')worldMap.drawOverlay();
  ctx.restore();
  // HUD drawn without shake
  drawBossBar();drawHUD();drawCombatLog();
  if(game.settings.showChat)drawWorldChatUI();
  drawNotifications();drawStreakPopup();
  if(typeof drawQuestTracker==='function')drawQuestTracker();
  if(typeof drawPetPanel==='function')drawPetPanel();
  if(showInventory)drawInventoryPanel();
  if(showCharStats)drawCharStatsPanel();
  drawShopPanel();
  if(typeof drawQuestPanel==='function')drawQuestPanel();
  if(typeof drawTalentPanel==='function')drawTalentPanel();
  if(typeof drawWorldBossSystem==='function')drawWorldBossSystem();
  if(typeof drawWorldBossHUDOverlays==='function')drawWorldBossHUDOverlays();
  if(typeof drawPartySystem==='function')drawPartySystem();
  if(typeof drawAchievementPopup==='function')drawAchievementPopup();
  if(typeof drawAchievementPanel==='function'&&typeof achievementSystem!=='undefined'&&achievementSystem.panelOpen)drawAchievementPanel();
  if(typeof drawLeaderboardPanel==='function'&&typeof leaderboard!=='undefined'&&leaderboard.panelOpen)drawLeaderboardPanel();
  if(typeof drawRankBadge==='function')drawRankBadge();
  if(typeof offlineExpeditionSystem!=='undefined'&&offlineExpeditionSystem.panelOpen&&typeof renderOfflineExpeditionPanel==='function')renderOfflineExpeditionPanel(ctx);
  if(typeof craftingSystem!=='undefined'&&craftingSystem.panelOpen&&typeof drawCraftingPanel==='function')drawCraftingPanel();
  if(typeof pvpArena!=='undefined'&&pvpArena.panelOpen&&typeof drawArenaPanel==='function')drawArenaPanel();
  if(typeof pvpArena!=='undefined'&&pvpArena.state==='result'&&pvpArena.drawResult)pvpArena.drawResult();
  if(typeof classChangeSystem!=='undefined'&&classChangeSystem.panelOpen&&typeof drawClassChangePanel==='function')drawClassChangePanel();
  if(typeof classChangeSystem!=='undefined'&&classChangeSystem.quest&&classChangeSystem.quest.active&&typeof drawQuestProgressHUD==='function')drawQuestProgressHUD();
  if(typeof showSkillPanel!=='undefined'&&showSkillPanel&&typeof drawSkillPanel==='function')drawSkillPanel();
  if(typeof enchantSystem!=='undefined'&&enchantSystem.panelOpen&&typeof drawEnchantPanel==='function')drawEnchantPanel();
  if(typeof guildSystem!=='undefined'&&guildSystem.panelOpen&&typeof drawGuildPanel==='function')drawGuildPanel();
  if(typeof gachaSystem!=='undefined'&&gachaSystem.panelOpen&&typeof drawGachaPanel==='function')drawGachaPanel();
  drawSettingsPanel();
  drawHelpPanel();
  drawControlHints();
  drawQuickButtons();
  if(showTabMenu)drawTabMenu();
  if(typeof afkSystem!=='undefined'&&afkSystem.showPopup&&typeof drawAfkPopup==='function')drawAfkPopup();
}
