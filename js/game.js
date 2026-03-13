// ============================================================
// GAME ENGINE — Main loop, state management, input
// ============================================================
let showSettings=false,confirmNewGame=false;

function startGame(cls){
  sfx.init();
  sfx.startFadeIn();
  initSprites();
  generateTownSprites();
  map.generate();
  game.player=createPlayer(cls,'Hero');
  game.monsters=spawnMonsters();
  game.npcPlayers=createNPCs(ri(8,12));
  game.itemDrops=[];game.killCount=0;game.sessionExp=0;game.sessionStart=Date.now();
  game.dayNightCycle=0;game.time=0;game.state='playing';
  game.notifications=[];game.streakPopup=null;game.trails=[];
  camera.update(game.player);
  addLog('Welcome, Hero the '+cls+'!','#FFD700');
}

function update(dt){
  if(game.state!=='playing')return;
  // Apply game speed
  dt*=game.settings.gameSpeed;
  game.time+=dt;game.dayNightCycle=(game.dayNightCycle+dt/300)%1;
  sfx.updateFade(dt);
  if(botAI.enabled&&game.player)botAI.update(dt,game.player,game.monsters);
  updatePlayer(dt);
  game.monsters.forEach(m=>updateMonster(m,dt));
  game.npcPlayers.forEach(n=>updateNPC(n,dt));
  for(let i=game.itemDrops.length-1;i>=0;i--){game.itemDrops[i].timer-=dt;if(game.itemDrops[i].timer<=0)game.itemDrops.splice(i,1)}
  if(game.settings.showDmgNumbers)updateDmgNumbers(dt);else dmgNumbers.length=0;
  updateEffects(dt);
  if(game.settings.showChat)updateChat(dt);
  updateTown(dt);
  updateAutoSave(dt);
  camera.update(game.player);
  // Screen shake decay
  if(game.shakeTimer>0){game.shakeTimer-=dt;if(game.shakeTimer<=0){game.shakeTimer=0;game.shakeIntensity=0}}
  // Notifications
  for(let i=game.notifications.length-1;i>=0;i--){game.notifications[i].timer-=dt;if(game.notifications[i].timer<=0)game.notifications.splice(i,1)}
  if(game.notifications.length>5)game.notifications.splice(0,game.notifications.length-5);
  // Kill streak popup
  if(game.streakPopup){game.streakPopup.timer-=dt;if(game.streakPopup.timer<=0)game.streakPopup=null}
  // Ranger trails
  for(let i=game.trails.length-1;i>=0;i--){game.trails[i].timer-=dt;game.trails[i].alpha*=0.95;if(game.trails[i].timer<=0)game.trails.splice(i,1)}
  if(game.trails.length>50)game.trails.splice(0,game.trails.length-50);
}

function gameLoop(ts){
  const dt=Math.min((ts-game.lastTime)/1000,0.1);game.lastTime=ts;game.dt=dt;
  update(dt);render();requestAnimationFrame(gameLoop);
}

// --- INPUT ---
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();mouseX=(e.clientX-r.left)*(canvas.width/r.width);mouseY=(e.clientY-r.top)*(canvas.height/r.height);
  if(game.state==='classSelect'){
    const cW=180,total=4*cW+3*20,sx=(canvas.width-total)/2,sy=(canvas.height-280)/2-10;
    hoveredClass=-1;
    CLASS_LIST.forEach((_,i)=>{const cx2=sx+i*(cW+20);if(mouseX>=cx2&&mouseX<=cx2+cW&&mouseY>=sy&&mouseY<=sy+280)hoveredClass=i});
  }
});

canvas.addEventListener('click',e=>{
  const r=canvas.getBoundingClientRect(),cx2=(e.clientX-r.left)*(canvas.width/r.width),cy2=(e.clientY-r.top)*(canvas.height/r.height);
  if(game.state==='classSelect'){
    const cW=180,total=4*cW+3*20,sx=(canvas.width-total)/2,sy=(canvas.height-280)/2-10;
    CLASS_LIST.forEach((cls,i)=>{const x=sx+i*(cW+20);if(cx2>=x&&cx2<=x+cW&&cy2>=sy&&cy2<=sy+280){if(selectedClass===cls)startGame(cls);else selectedClass=cls}});
    const rbx=canvas.width/2-50,rby=sy+280+20;
    if(cx2>=rbx&&cx2<=rbx+100&&cy2>=rby&&cy2<=rby+30)selectedClass=CLASS_LIST[ri(0,3)];
    if(selectedClass){const sbx=canvas.width/2-60,sby=sy+280+60;if(cx2>=sbx&&cx2<=sbx+120&&cy2>=sby&&cy2<=sby+36)startGame(selectedClass)}
    return;
  }
  // Settings panel clicks
  if(showSettings){handleSettingsClick(cx2,cy2);return}
  // Shop panel clicks
  if(town.shopOpen){checkTownNPCClick(cx2,cy2);return}
  // Town NPC click (open shop)
  if(checkTownNPCClick(cx2,cy2))return;
  // Bot toggle
  const pw=200,ph=165,bpx=canvas.width-pw-10,bpy=canvas.height-ph-14;
  if(cx2>=bpx+pw-70&&cx2<=bpx+pw-10&&cy2>=bpy+6&&cy2<=bpy+26){botAI.enabled=!botAI.enabled;return}
  // Mute button
  const mx=bpx+pw-42,my=bpy+118;
  if(cx2>=mx&&cx2<=mx+36&&cy2>=my&&cy2<=my+16){sfx.toggleMute();game.settings.muted=sfx.muted;saveSettings();return}
  // Volume slider click
  const volX=bpx+40,volY=bpy+121,volW=pw-90;
  if(cx2>=volX&&cx2<=volX+volW&&cy2>=volY&&cy2<=volY+8){const v=Math.max(0,Math.min(1,(cx2-volX)/volW));sfx.setVolume(v);game.settings.volume=v;saveSettings();return}
  // Click monster only
  for(const m of game.monsters){if(m.isDead)continue;const{x:sx2,y:sy2}=camera.worldToScreen(m.x,m.y);if(Math.hypot(cx2-sx2,cy2-sy2)<24){botAI.target=m;botAI.state='approaching';return}}
});

window.addEventListener('keydown',e=>{
  if(game.state==='classSelect')return;
  switch(e.code){
    case'Space':e.preventDefault();botAI.enabled=!botAI.enabled;break;
    case'KeyI':if(!showSettings){showInventory=!showInventory;showCharStats=false;town.shopOpen=false}break;
    case'KeyC':if(!showSettings){showCharStats=!showCharStats;showInventory=false;town.shopOpen=false}break;
    case'Escape':
      if(town.shopOpen){town.shopOpen=false}
      else if(showInventory||showCharStats){showInventory=false;showCharStats=false}
      else{showSettings=!showSettings;confirmNewGame=false}
      break;
    case'KeyQ':if(game.player)useSkill(game.player,0);break;
    case'KeyW':if(!botAI.enabled&&game.player){const p=game.player,ny=p.y-p.spd*TILE*0.1;if(map.isWalkable(Math.floor(p.x/TILE),Math.floor(ny/TILE))){p.y=ny;p.dir='up'}}else if(game.player)useSkill(game.player,1);break;
    case'KeyE':if(game.player)useSkill(game.player,2);break;
    case'KeyR':if(game.player)useSkill(game.player,3);break;
    case'KeyM':sfx.toggleMute();game.settings.muted=sfx.muted;saveSettings();break;
    case'KeyA':case'ArrowLeft':if(!botAI.enabled&&game.player){const p=game.player,nx=p.x-p.spd*TILE*0.1;if(map.isWalkable(Math.floor(nx/TILE),Math.floor(p.y/TILE))){p.x=nx;p.dir='left'}}break;
    case'KeyD':case'ArrowRight':if(!botAI.enabled&&game.player){const p=game.player,nx=p.x+p.spd*TILE*0.1;if(map.isWalkable(Math.floor(nx/TILE),Math.floor(p.y/TILE))){p.x=nx;p.dir='right'}}break;
    case'KeyS':case'ArrowDown':if(!botAI.enabled&&game.player){const p=game.player,ny=p.y+p.spd*TILE*0.1;if(map.isWalkable(Math.floor(p.x/TILE),Math.floor(ny/TILE))){p.y=ny;p.dir='down'}}break;
    case'ArrowUp':e.preventDefault();if(!botAI.enabled&&game.player){const p=game.player,ny=p.y-p.spd*TILE*0.1;if(map.isWalkable(Math.floor(p.x/TILE),Math.floor(ny/TILE))){p.y=ny;p.dir='up'}}break;
  }
});

// --- BOOTSTRAP ---
initSprites();
generateTownSprites();
loadSettings();
// Try to load saved game, otherwise show class select
if(hasSaveData()){
  if(!loadGame()){game.state='classSelect'}
}
game.lastTime=performance.now();
requestAnimationFrame(gameLoop);
