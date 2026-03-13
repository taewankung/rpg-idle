// ============================================================
// UI — HUD, minimap, skill bar, panels, combat log, rendering
// ============================================================
let showInventory=false,showCharStats=false,mouseX=0,mouseY=0,selectedClass=null,hoveredClass=-1;
let waterFrame=0,waterTimer=0,blinkTimer=0;

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
    const key=(e.className||'knight').toLowerCase()+'_'+(e.dir||'down')+'_'+(e.frame%3);
    const spr=spriteCache[key];if(spr)ctx.drawImage(spr,sx-16,sy-16,32,32);
    else{ctx.fillStyle=isPlayer?'#44ff88':'#4488ff';ctx.fillRect(sx-12,sy-12,24,24)}
  }else{
    const key=(e.type||'slime')+'_'+(e.frame%2);const spr=spriteCache[key];
    if(spr)ctx.drawImage(spr,sx-half,sy-half,size,size);
    else{ctx.fillStyle='#ff4444';ctx.fillRect(sx-half,sy-half,size,size)}
  }
  if(!e.isDead){
    ctx.font='10px monospace';ctx.textAlign='center';ctx.strokeStyle='#000';ctx.lineWidth=2;
    const label=(isPlayer||isNPC?'':'Lv.'+e.level+' ')+(e.name||e.type||'');
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
    else{ctx.fillStyle=gc;ctx.fillRect(sx-6,sy-6+b,12,12)}ctx.restore()}}));
  game.monsters.forEach(m=>all.push({y:m.y,draw:()=>drawEntity(m,false,false)}));
  if(game.settings.showNPCs)game.npcPlayers.forEach(n=>all.push({y:n.y,draw:()=>drawEntity(n,false,true)}));
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
  ctx.save();ctx.fillStyle='rgba(0,0,0,0.7)';roundRect(ctx,10,10,220,115,8);ctx.fill();
  ctx.strokeStyle='#446688';ctx.lineWidth=1;roundRect(ctx,10,10,220,115,8);ctx.stroke();
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#44ff88';ctx.textAlign='left';ctx.fillText(p.name,20,30);
  ctx.font='11px sans-serif';ctx.fillStyle=CLASS_DEFS[p.className]?.color||'#fff';ctx.fillText('Lv.'+p.level+' '+p.className,20,44);
  drawUIBar(20,50,200,18,p.hp/p.maxHp,'#e74c3c','#880000','HP: '+p.hp+'/'+p.maxHp);
  drawUIBar(20,72,200,14,p.mp/p.maxMp,'#3498db','#002266','MP: '+p.mp+'/'+p.maxMp);
  const expR=p.exp/expToNext(p.level);
  drawUIBar(20,90,200,11,expR,'#f1c40f','#664400','EXP: '+Math.floor(expR*100)+'%');
  ctx.fillStyle='#ffcc00';ctx.font='11px monospace';ctx.fillText('Gold: '+p.gold,20,114);
  ctx.restore();
  drawMinimap();
  drawSkillBar(p);
  drawBotPanel();
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
  ctx.strokeStyle='#446688';ctx.lineWidth=1;ctx.strokeRect(mx-2,my-2,mm+4,mm+4);
  const ts=mm/MAP_W,th=mm/MAP_H;
  const mmColors=['#3a7a3a','#8b6040','#2040a0','#1a5020','#607070','#c8b090','#806040'];
  for(let r=0;r<MAP_H;r++)for(let c=0;c<MAP_W;c++){const t=map.getTile(c,r);if(t>=0){ctx.fillStyle=mmColors[t]||'#3a7a3a';ctx.fillRect(mx+c*ts,my+r*th,ts+.5,th+.5)}}
  ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1;
  ctx.strokeRect(mx+(camera.x/TILE)*ts,my+(camera.y/TILE)*th,(canvas.width/TILE)*ts,(canvas.height/TILE)*th);
  ctx.fillStyle='#ff4444';game.monsters.forEach(m=>{if(!m.isDead)ctx.fillRect(mx+(m.x/(MAP_W*TILE))*mm-1,my+(m.y/(MAP_H*TILE))*mm-1,2,2)});
  ctx.fillStyle='#44ff44';game.npcPlayers.forEach(n=>{if(!n.isDead)ctx.fillRect(mx+(n.x/(MAP_W*TILE))*mm-1,my+(n.y/(MAP_H*TILE))*mm-1,2,2)});
  blinkTimer++;if(game.player&&blinkTimer%30<20){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx+(game.player.x/(MAP_W*TILE))*mm,my+(game.player.y/(MAP_H*TILE))*mm,2.5,0,Math.PI*2);ctx.fill()}
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
      ctx.fillStyle=skColors[i];ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText(sk.name?sk.name.split(' ')[0]:'',x+btnW/2,by+btnW/2+3)}
    if(cdR>0){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();ctx.moveTo(x+btnW/2,by+btnW/2);
      ctx.arc(x+btnW/2,by+btnW/2,btnW/2,-Math.PI/2,-Math.PI/2+Math.PI*2*cdR);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(Math.ceil(sk.cdTimer)+'s',x+btnW/2,by+btnW/2+4)}
    if(locked){ctx.fillStyle='rgba(0,0,0,0.6)';roundRect(ctx,x,by,btnW,btnW,6);ctx.fill();
      ctx.fillStyle='#666';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('Lv'+sk.reqLv,x+btnW/2,by+btnW/2+3)}
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

function drawInventoryPanel(){
  const p=game.player;if(!p)return;
  const pw=240,ph=380,px=canvas.width-pw-10,py=170;
  ctx.save();ctx.fillStyle='rgba(5,5,20,0.92)';roundRect(ctx,px,py,pw,ph,10);ctx.fill();
  ctx.strokeStyle='#557799';ctx.lineWidth=1.5;roundRect(ctx,px,py,pw,ph,10);ctx.stroke();
  ctx.fillStyle='#aaccee';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('Inventory [I]',px+pw/2,py+20);
  ['weapon','armor','accessory'].forEach((slot,i)=>{
    const sx2=px+10+i*75,sy2=py+30;
    ctx.fillStyle='#0a0a1a';ctx.strokeStyle='#334';ctx.lineWidth=1;ctx.fillRect(sx2,sy2,60,50);ctx.strokeRect(sx2,sy2,60,50);
    const eq=p.equipment[slot];
    if(eq){ctx.fillStyle=RARITY_COLORS[eq.rarity]||'#aaa';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(eq.name.substring(0,8),sx2+30,sy2+28);
      ctx.strokeStyle=RARITY_COLORS[eq.rarity];ctx.lineWidth=1.5;ctx.strokeRect(sx2+1,sy2+1,58,48)}
    else{ctx.fillStyle='#334';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(slot,sx2+30,sy2+28)}
  });
  const cols=4,slotS=44,gap=4,gx=px+(pw-(cols*slotS+(cols-1)*gap))/2,gy=py+90;
  for(let r=0;r<5;r++)for(let c2=0;c2<cols;c2++){
    const idx=r*cols+c2,sx2=gx+c2*(slotS+gap),sy2=gy+r*(slotS+gap);
    ctx.fillStyle='#0a0a1a';ctx.strokeStyle='#334';ctx.lineWidth=1;ctx.fillRect(sx2,sy2,slotS,slotS);ctx.strokeRect(sx2,sy2,slotS,slotS);
    const item=p.inventory[idx];
    if(item){ctx.fillStyle=RARITY_COLORS[item.rarity]||'#aaa';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(item.name.substring(0,5),sx2+slotS/2,sy2+slotS/2+3);
      ctx.strokeStyle=RARITY_COLORS[item.rarity];ctx.lineWidth=1;ctx.strokeRect(sx2+1,sy2+1,slotS-2,slotS-2)}
  }
  ctx.fillStyle='#ffcc00';ctx.font='11px monospace';ctx.textAlign='left';ctx.fillText('Gold: '+p.gold+'g',px+10,py+ph-10);
  ctx.restore();
}

function drawCharStatsPanel(){
  const p=game.player;if(!p)return;
  const pw=220,ph=250,px=canvas.width-pw-10,py=170;
  ctx.save();ctx.fillStyle='rgba(5,5,20,0.92)';roundRect(ctx,px,py,pw,ph,10);ctx.fill();
  ctx.strokeStyle='#557799';ctx.lineWidth=1.5;roundRect(ctx,px,py,pw,ph,10);ctx.stroke();
  ctx.fillStyle='#aaccee';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('Stats [C]',px+pw/2,py+20);
  ctx.fillStyle=CLASS_DEFS[p.className]?.color||'#fff';ctx.font='12px sans-serif';
  ctx.fillText(p.name+' - Lv.'+p.level+' '+p.className,px+pw/2,py+40);
  const stats=[['HP',p.maxHp,'#e74c3c'],['MP',p.maxMp,'#3498db'],['ATK',p.atk,'#e67e22'],['DEF',p.def,'#2980b9'],['SPD',p.spd.toFixed(1),'#27ae60'],['CRIT',(p.crit*100).toFixed(0)+'%','#e91e63']];
  stats.forEach(([l,v,c],i)=>{
    const ry=py+60+i*28;
    ctx.textAlign='left';ctx.fillStyle=c;ctx.font='12px monospace';ctx.fillText(l,px+14,ry+14);
    ctx.fillStyle='#ccc';ctx.textAlign='right';ctx.fillText(''+v,px+pw-14,ry+14);
  });
  ctx.restore();
}

// --- SETTINGS PANEL ---
function drawSettingsPanel(){
  if(!showSettings)return;
  const W=canvas.width,H=canvas.height;
  const pw=340,ph=360;
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
    ['Bot Auto-Buy Potions','autoBuyPotions']
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
  const pw=340,ph=360;
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
  const toggleKeys=['showDmgNumbers','showNPCs','showChat','autoBuyPotions'];
  toggleKeys.forEach((key,i)=>{
    if(cx2>=px+260&&cx2<=px+310&&cy2>=rowY(3+i)&&cy2<=rowY(3+i)+24){s[key]=!s[key];saveSettings()}
  });
  // New Game button (row 7)
  const ngx=px+(pw-140)/2,ngy=rowY(7)+4;
  if(cx2>=ngx&&cx2<=ngx+140&&cy2>=ngy&&cy2<=ngy+28){
    if(confirmNewGame){deleteSave();location.reload()}
    else{confirmNewGame=true}
  }
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
  drawMapTiles();drawTrails();drawTownNPCs();drawEntities();
  if(game.settings.showDmgNumbers)drawDmgNumbers();
  drawEffectsVis();drawDayNight();
  ctx.restore();
  // HUD drawn without shake
  drawBossBar();drawHUD();drawCombatLog();
  if(game.settings.showChat)drawWorldChatUI();
  drawNotifications();drawStreakPopup();
  if(showInventory)drawInventoryPanel();
  if(showCharStats)drawCharStatsPanel();
  drawShopPanel();
  drawSettingsPanel();
}
