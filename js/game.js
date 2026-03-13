// ============================================================
// GAME ENGINE — Main loop, state management, input
// ============================================================
let showSettings=false,confirmNewGame=false;

function startGame(cls){
  sfx.init();
  sfx.startFadeIn();
  initSprites();
  generateTownSprites();
  generateDungeonSprites();
  generatePetSprites();
  generateQuestSprites();
  if(typeof generateWorldBossSprites==='function')generateWorldBossSprites();
  if(typeof craftingSystem!=='undefined')craftingSystem.generateSprites();
  if(typeof worldMap!=='undefined')worldMap.generateSprites();
  if(typeof pvpArena!=='undefined')pvpArena.generateSprites();
  if(typeof classChangeSystem!=='undefined')classChangeSystem.generateSprites();
  if(typeof afkSystem!=='undefined')afkSystem.generateSprites();
  if(typeof enchantSystem!=='undefined')enchantSystem.generateSprites();
  if(typeof guildSystem!=='undefined')guildSystem.generateSprites();
  if(typeof gachaSystem!=='undefined')gachaSystem.generateSprites();
  map.generate();
  if(typeof worldMap!=='undefined'){worldMap.generateZone(0);worldMap.currentZone=0;worldMap.extendWalkability()}
  game.player=createPlayer(cls,'Hero');
  game.monsters=spawnMonsters();
  game.npcPlayers=createNPCs(ri(8,12));
  game.itemDrops=[];game.killCount=0;game.sessionExp=0;game.sessionStart=Date.now();
  game.dayNightCycle=0;game.time=0;game.state='playing';
  game.notifications=[];game.streakPopup=null;game.trails=[];
  talentSystem.snapshotBaseStats();
  if(typeof partySystem!=='undefined')partySystem.init();
  if(typeof achievementSystem!=='undefined')achievementSystem.init();
  if(typeof leaderboard!=='undefined')leaderboard.updateRankings();
  if(typeof craftingSystem!=='undefined')craftingSystem.initTownNPC();
  if(typeof pvpArena!=='undefined')pvpArena.initTownNPC();
  if(typeof classChangeSystem!=='undefined')classChangeSystem.initTownNPC();
  if(typeof enchantSystem!=='undefined')enchantSystem.initTownNPC();
  if(typeof guildSystem!=='undefined')guildSystem.initTownNPC();
  if(typeof gachaSystem!=='undefined')gachaSystem.initTownNPC();
  camera.update(game.player);
  addLog('Welcome, Hero the '+cls+'!','#FFD700');
  saveGame();
}

function update(dt){
  if(game.state!=='playing')return;
  dt*=game.settings.gameSpeed;
  game.time+=dt;game.dayNightCycle=(game.dayNightCycle+dt/300)%1;
  sfx.updateFade(dt);
  // Bot AI — use dungeon monsters when in dungeon
  if(botAI.enabled&&game.player){
    talentBotLogic();
    if(typeof jobBotLogic==='function')jobBotLogic();
    if(typeof statPointSystem!=='undefined'&&statPointSystem.botAutoAllocate)statPointSystem.botAutoAllocate();
    // Bot auto-enter portal when nearby (overworld, level 5+)
    if(!dungeon.active&&typeof isNearPortal==='function'&&isNearPortal()&&game.player.level>=5){
      dungeon.enterDungeon();
    }
    // Capture activeMons AFTER potential dungeon enter so reference is fresh
    const activeMons=dungeon.active?dungeon.monsters:game.monsters;
    botAI.update(dt,game.player,activeMons);
  }
  // Smooth manual movement (when bot is off or keys held)
  updateManualMovement(dt);
  updatePlayer(dt);
  // Update monsters (overworld or dungeon)
  if(dungeon.active){
    dungeon.update(dt);
  }else{
    game.monsters.forEach(m=>updateMonster(m,dt));
    game.npcPlayers.forEach(n=>updateNPC(n,dt));
  }
  for(let i=game.itemDrops.length-1;i>=0;i--){game.itemDrops[i].timer-=dt;if(game.itemDrops[i].timer<=0)game.itemDrops.splice(i,1)}
  // Auto-pickup items within 1 tile
  if(game.player&&!game.player.isDead){
    for(let i=game.itemDrops.length-1;i>=0;i--){
      const d=game.itemDrops[i];
      if(Math.hypot(d.x-game.player.x,d.y-game.player.y)<TILE){
        if(game.player.inventory.length<20){
          game.player.inventory.push(d.item);autoEquip(game.player,d.item);
          addLog('Picked up '+d.item.name,'#FFDD44');sfx.itemPickup();
          if(typeof questSystem!=='undefined')questSystem.onItemPickup(d.item);
        }
        game.itemDrops.splice(i,1);
      }
    }
  }
  if(game.settings.showDmgNumbers)updateDmgNumbers(dt);else dmgNumbers.length=0;
  updateEffects(dt);
  if(game.settings.showChat)updateChat(dt);
  if(!dungeon.active)updateTown(dt);
  updatePet(dt);
  questSystem.checkProgress();
  questSystem.updateSurvival(dt);
  questSystem.refresh();
  if(typeof updateWorldBoss==='function')updateWorldBoss(dt);
  if(typeof updatePartySystem==='function')updatePartySystem(dt);
  if(typeof updateAchievementPopup==='function')updateAchievementPopup(dt);
  if(typeof updateLeaderboard==='function')updateLeaderboard(dt);
  if(typeof craftingSystem!=='undefined'&&craftingSystem.updateCrafting)craftingSystem.updateCrafting(dt);
  if(typeof worldMap!=='undefined'&&worldMap.updateParticles)worldMap.updateParticles(dt);
  if(typeof pvpArena!=='undefined'&&pvpArena.active)pvpArena.update(dt);
  if(typeof pvpArena!=='undefined'&&pvpArena.autoArena&&botAI.enabled){pvpArena.autoTimer-=dt;if(pvpArena.autoTimer<=0&&!pvpArena.active&&!dungeon.active){pvpArena.startMatch()}}
  if(typeof classChangeSystem!=='undefined'&&classChangeSystem.updateQuest)classChangeSystem.updateQuest(dt);
  if(typeof afkSystem!=='undefined'&&afkSystem.showPopup)afkSystem.updatePopup(dt);
  if(typeof enchantSystem!=='undefined'&&enchantSystem.updateAnim)enchantSystem.updateAnim(dt);
  if(typeof guildSystem!=='undefined'){if(guildSystem.updateQuests)guildSystem.updateQuests(dt);if(guildSystem.updateMembers)guildSystem.updateMembers(dt)}
  if(typeof gachaSystem!=='undefined'){if(gachaSystem.updateAnim)gachaSystem.updateAnim(dt);if(gachaSystem.updateSpecialBanner)gachaSystem.updateSpecialBanner(dt)}
  if(typeof updateJobPassives==='function')updateJobPassives(dt);
  if(typeof worldMap!=='undefined'&&!dungeon.active&&!(typeof pvpArena!=='undefined'&&pvpArena.active)){
    if(worldMap.announcement&&worldMap.announcement.timer>0)worldMap.announcement.timer-=dt;
    if(worldMap.fadeTimer>0)worldMap.fadeTimer-=dt;
  }
  updateAutoSave(dt);
  camera.update(game.player);
  if(dungeon.active)dungeon.clampCamera();
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
  // Inventory hover tooltips
  if(showInventory&&game.player){
    invTooltipIdx=-1;invTooltipSlot=null;
    const pw=280,ph=460,px=canvas.width-pw-10,py=80;
    const slotW=80,slotH=58,slotGap=8;
    const eqStartX=px+(pw-3*slotW-2*slotGap)/2,eqY=py+34;
    const slotKeys=['weapon','armor','accessory'];
    for(let i=0;i<3;i++){const sx=eqStartX+i*(slotW+slotGap),sy=eqY;if(mouseX>=sx&&mouseX<=sx+slotW&&mouseY>=sy&&mouseY<=sy+slotH){invTooltipSlot=slotKeys[i];break}}
    if(!invTooltipSlot){
      const cols=5,slotS=42,gap=4;
      const gx=px+(pw-(cols*slotS+(cols-1)*gap))/2,gy=eqY+slotH+12;
      for(let r2=0;r2<4;r2++)for(let c2=0;c2<cols;c2++){
        const idx=r2*cols+c2,sx=gx+c2*(slotS+gap),sy=gy+r2*(slotS+gap);
        if(mouseX>=sx&&mouseX<=sx+slotS&&mouseY>=sy&&mouseY<=sy+slotS){invTooltipIdx=idx;break}
      }
    }
  }
  // Stat point hover detection
  if(showCharStats&&typeof statPointSystem!=='undefined'){
    statPointSystem.handleStatHover(mouseX,mouseY);
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
  // AFK popup blocks everything
  if(typeof afkSystem!=='undefined'&&afkSystem.showPopup){if(typeof handleAfkClick==='function')handleAfkClick(cx2,cy2);return}
  if(typeof showTabMenu!=='undefined'&&showTabMenu){if(typeof handleTabMenuClick==='function')handleTabMenuClick(cx2,cy2);return}
  // Overlay panels (highest priority)
  if(showHelp){handleHelpClick(cx2,cy2);return}
  if(showSettings){handleSettingsClick(cx2,cy2);return}
  if(showInventory){handleInventoryClick(cx2,cy2);return}
  if(showCharStats&&typeof statPointSystem!=='undefined'){
    if(statPointSystem.handleStatClick(cx2,cy2))return;
  }
  if(typeof achievementSystem!=='undefined'&&achievementSystem.panelOpen){handleAchievementClick(cx2,cy2);return}
  if(typeof leaderboard!=='undefined'&&leaderboard.panelOpen){handleLeaderboardClick(cx2,cy2);return}
  if(talentSystem.panelOpen){handleTalentClick(cx2,cy2);return}
  if(typeof craftingSystem!=='undefined'&&craftingSystem.panelOpen){handleCraftingClick(cx2,cy2);return}
  if(typeof pvpArena!=='undefined'&&pvpArena.panelOpen){handleArenaClick(cx2,cy2);return}
  if(typeof pvpArena!=='undefined'&&pvpArena.state==='result'){if(typeof handleArenaResultClick==='function')handleArenaResultClick(cx2,cy2);return}
  if(typeof classChangeSystem!=='undefined'&&classChangeSystem.panelOpen){handleClassChangeClick(cx2,cy2);return}
  if(typeof enchantSystem!=='undefined'&&enchantSystem.panelOpen){if(typeof handleEnchantClick==='function')handleEnchantClick(cx2,cy2);return}
  if(typeof guildSystem!=='undefined'&&guildSystem.panelOpen){if(typeof handleGuildClick==='function')handleGuildClick(cx2,cy2);return}
  if(typeof gachaSystem!=='undefined'&&gachaSystem.panelOpen){if(typeof handleGachaClick==='function')handleGachaClick(cx2,cy2);return}
  if(typeof showSkillPanel!=='undefined'&&showSkillPanel){if(typeof handleSkillPanelClick==='function')handleSkillPanelClick(cx2,cy2);return}
  if(town.shopOpen){checkTownNPCClick(cx2,cy2);return}
  if(questSystem.boardOpen){checkQuestBoardClick(cx2,cy2);return}
  // Dungeon exit button click
  if(dungeon.active&&typeof dungeon.checkExitClick==='function'){if(dungeon.checkExitClick(cx2,cy2))return}
  // Party click
  if(typeof handlePartyClick==='function'){handlePartyClick(cx2,cy2)}
  // Pet panel dismiss click
  if(petSystem.active){handlePetPanelClick(cx2,cy2)}
  // Town NPC clicks
  if(!dungeon.active){
    if(checkTownNPCClick(cx2,cy2))return;
    if(checkQuestBoardClick(cx2,cy2))return;
    if(typeof checkPortalClick==='function'&&checkPortalClick(cx2,cy2))return;
    if(typeof craftingSystem!=='undefined'&&craftingSystem.checkNPCClick&&craftingSystem.checkNPCClick(cx2,cy2))return;
    if(typeof pvpArena!=='undefined'&&pvpArena.checkNPCClick&&pvpArena.checkNPCClick(cx2,cy2))return;
    if(typeof classChangeSystem!=='undefined'&&classChangeSystem.checkMasterClick&&classChangeSystem.checkMasterClick(cx2,cy2))return;
    if(typeof enchantSystem!=='undefined'&&enchantSystem.checkNPCClick&&enchantSystem.checkNPCClick(cx2,cy2))return;
    if(typeof guildSystem!=='undefined'&&guildSystem.checkNPCClick&&guildSystem.checkNPCClick(cx2,cy2))return;
    if(typeof gachaSystem!=='undefined'&&gachaSystem.checkNPCClick&&gachaSystem.checkNPCClick(cx2,cy2))return;
  }
  // Bot toggle
  const pw=200,ph=165,bpx=canvas.width-pw-10,bpy=canvas.height-ph-14;
  if(cx2>=bpx+pw-70&&cx2<=bpx+pw-10&&cy2>=bpy+6&&cy2<=bpy+26){botAI.enabled=!botAI.enabled;return}
  // Mute button
  const mx=bpx+pw-42,my=bpy+118;
  if(cx2>=mx&&cx2<=mx+36&&cy2>=my&&cy2<=my+16){sfx.toggleMute();game.settings.muted=sfx.muted;saveSettings();return}
  // Volume slider click
  const volX=bpx+40,volY=bpy+121,volW=pw-90;
  if(cx2>=volX&&cx2<=volX+volW&&cy2>=volY&&cy2<=volY+8){const v=Math.max(0,Math.min(1,(cx2-volX)/volW));sfx.setVolume(v);game.settings.volume=v;saveSettings();return}
  // Click monster
  const mons=dungeon.active?dungeon.monsters:game.monsters;
  for(const m of mons){if(m.isDead)continue;const{x:sx2,y:sy2}=camera.worldToScreen(m.x,m.y);if(Math.hypot(cx2-sx2,cy2-sy2)<24){botAI.target=m;botAI.state='approaching';return}}
});

// --- KEY TRACKING for smooth movement ---
const keysHeld={};
window.addEventListener('keydown',e=>{
  keysHeld[e.code]=true;
  if(e.code==='Space'||e.code==='ArrowUp'||e.code==='ArrowDown')e.preventDefault();
  if(game.state==='classSelect')return;
  // F1 or ? for help
  if(e.code==='F1'||(e.code==='Slash'&&e.shiftKey)){e.preventDefault();showHelp=!showHelp;return}
  switch(e.code){
    case'Space':botAI.enabled=!botAI.enabled;break;
    case'KeyI':if(!showSettings&&!talentSystem.panelOpen){showInventory=!showInventory;showCharStats=false;showHelp=false;town.shopOpen=false;invSelectedIdx=-1;invSelectedSlot=null}break;
    case'KeyC':if(!showSettings&&!talentSystem.panelOpen){showCharStats=!showCharStats;showInventory=false;showHelp=false;town.shopOpen=false}break;
    case'KeyT':if(!showSettings){talentSystem.panelOpen=!talentSystem.panelOpen;showInventory=false;showCharStats=false;town.shopOpen=false}break;
    case'Escape':
      if(typeof showTabMenu!=='undefined'&&showTabMenu){showTabMenu=false}
      else if(showHelp){showHelp=false}
      else if(typeof achievementSystem!=='undefined'&&achievementSystem.panelOpen){achievementSystem.panelOpen=false}
      else if(typeof leaderboard!=='undefined'&&leaderboard.panelOpen){leaderboard.panelOpen=false}
      else if(talentSystem.panelOpen){talentSystem.panelOpen=false}
      else if(typeof craftingSystem!=='undefined'&&craftingSystem.panelOpen){craftingSystem.panelOpen=false}
      else if(typeof pvpArena!=='undefined'&&pvpArena.panelOpen){pvpArena.panelOpen=false}
      else if(typeof classChangeSystem!=='undefined'&&classChangeSystem.panelOpen){classChangeSystem.panelOpen=false}
      else if(typeof enchantSystem!=='undefined'&&enchantSystem.panelOpen){enchantSystem.panelOpen=false}
      else if(typeof guildSystem!=='undefined'&&guildSystem.panelOpen){guildSystem.panelOpen=false}
      else if(typeof gachaSystem!=='undefined'&&gachaSystem.panelOpen){gachaSystem.panelOpen=false}
      else if(typeof showSkillPanel!=='undefined'&&showSkillPanel){showSkillPanel=false}
      else if(questSystem.boardOpen){questSystem.boardOpen=false}
      else if(town.shopOpen){town.shopOpen=false}
      else if(showInventory||showCharStats){showInventory=false;showCharStats=false;invSelectedIdx=-1;invSelectedSlot=null}
      else{showSettings=!showSettings;confirmNewGame=false}
      break;
    case'KeyQ':if(game.player)useSkill(game.player,0);break;
    case'KeyW':if(botAI.enabled&&game.player)useSkill(game.player,1);break;
    case'KeyE':if(game.player)useSkill(game.player,2);break;
    case'KeyR':if(game.player)useSkill(game.player,3);break;
    case'KeyH':if(typeof achievementSystem!=='undefined'){achievementSystem.panelOpen=!achievementSystem.panelOpen;if(typeof leaderboard!=='undefined')leaderboard.panelOpen=false}break;
    case'KeyL':if(typeof leaderboard!=='undefined'){leaderboard.panelOpen=!leaderboard.panelOpen;if(typeof achievementSystem!=='undefined')achievementSystem.panelOpen=false}break;
    case'KeyM':sfx.toggleMute();game.settings.muted=sfx.muted;saveSettings();break;
    case'KeyF':
      if(dungeon.active){
        // F key in dungeon: descend stairs or exit
        if(dungeon.stairsPos&&dungeon.transitionCooldown<=0){
          const alive=dungeon.monsters.filter(m=>!m.isDead);
          if(alive.length===0){
            const sd=Math.hypot(game.player.x-dungeon.stairsPos.x,game.player.y-dungeon.stairsPos.y);
            if(sd<TILE*1.5){dungeon.nextFloor()}
            else{addNotification('Move closer to the stairs!','#ffcc44')}
          }else{addNotification('Defeat all monsters first! ('+alive.length+' remaining)','#ff6644')}
        }
        // Exit portal
        if(dungeon.exitPos&&dungeon.transitionCooldown<=0){
          const ed=Math.hypot(game.player.x-dungeon.exitPos.x,game.player.y-dungeon.exitPos.y);
          if(ed<TILE*1.5){dungeon.exitDungeon()}
        }
      }else{
        if(typeof isNearPortal==='function'&&isNearPortal()){dungeon.enterDungeon()}
        else if(typeof worldMap!=='undefined'&&worldMap.checkPortalProximity){
          const targetZone=worldMap.checkPortalProximity(game.player);
          if(targetZone!==null)worldMap.transitionToZone(targetZone);
        }
      }
      break;
    case'KeyJ':if(typeof classChangeSystem!=='undefined'){classChangeSystem.panelOpen=!classChangeSystem.panelOpen}break;
    case'KeyP':if(typeof pvpArena!=='undefined'){pvpArena.panelOpen=!pvpArena.panelOpen}break;
    case'KeyK':if(typeof craftingSystem!=='undefined'){craftingSystem.panelOpen=!craftingSystem.panelOpen}break;
    case'KeyN':if(typeof enchantSystem!=='undefined'){enchantSystem.panelOpen=!enchantSystem.panelOpen}break;
    case'KeyG':if(typeof guildSystem!=='undefined'){guildSystem.panelOpen=!guildSystem.panelOpen}break;
    case'KeyU':if(typeof gachaSystem!=='undefined'){gachaSystem.panelOpen=!gachaSystem.panelOpen}break;
    case'KeyB':if(typeof showSkillPanel!=='undefined'){showSkillPanel=!showSkillPanel}break;
    case'Tab':e.preventDefault();if(typeof showTabMenu!=='undefined'){showTabMenu=!showTabMenu}break;
  }
});
window.addEventListener('keyup',e=>{keysHeld[e.code]=false});
window.addEventListener('blur',()=>{for(const k in keysHeld)keysHeld[k]=false});

// Smooth per-frame movement using held keys
function updateManualMovement(dt){
  const p=game.player;
  if(!p||p.isDead||botAI.enabled)return;
  const up=keysHeld['KeyW']||keysHeld['ArrowUp'];
  const down=keysHeld['KeyS']||keysHeld['ArrowDown'];
  const left=keysHeld['KeyA']||keysHeld['ArrowLeft'];
  const right=keysHeld['KeyD']||keysHeld['ArrowRight'];
  if(!up&&!down&&!left&&!right){p.state='idle';return}
  let vx=0,vy=0;
  if(up)vy=-1;if(down)vy=1;if(left)vx=-1;if(right)vx=1;
  // Normalize diagonal
  if(vx!==0&&vy!==0){vx*=0.707;vy*=0.707}
  const spd=p.spd*TILE*dt;
  const nx=p.x+vx*spd,ny=p.y+vy*spd;
  const isWalk=dungeon.active?dungeon.isWalkable.bind(dungeon):map.isWalkable.bind(map);
  // Try full move, then axis-separate
  if(isWalk(Math.floor(nx/TILE),Math.floor(ny/TILE))){p.x=nx;p.y=ny}
  else if(isWalk(Math.floor(nx/TILE),Math.floor(p.y/TILE))){p.x=nx}
  else if(isWalk(Math.floor(p.x/TILE),Math.floor(ny/TILE))){p.y=ny}
  // Set direction
  if(Math.abs(vx)>Math.abs(vy))p.dir=vx<0?'left':'right';
  else p.dir=vy<0?'up':'down';
  p.state='walking';
}

// --- BOOTSTRAP ---
initSprites();
generateTownSprites();
generateDungeonSprites();
generatePetSprites();
generateQuestSprites();
if(typeof generateWorldBossSprites==='function')generateWorldBossSprites();
if(typeof craftingSystem!=='undefined')craftingSystem.generateSprites();
if(typeof worldMap!=='undefined')worldMap.generateSprites();
if(typeof pvpArena!=='undefined')pvpArena.generateSprites();
if(typeof classChangeSystem!=='undefined')classChangeSystem.generateSprites();
if(typeof afkSystem!=='undefined')afkSystem.generateSprites();
if(typeof enchantSystem!=='undefined')enchantSystem.generateSprites();
if(typeof guildSystem!=='undefined')guildSystem.generateSprites();
if(typeof gachaSystem!=='undefined')gachaSystem.generateSprites();
loadSettings();
if(hasSaveData()){
  if(!loadGame()){game.state='classSelect'}
}
game.lastTime=performance.now();
requestAnimationFrame(gameLoop);
