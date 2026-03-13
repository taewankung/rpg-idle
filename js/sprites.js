// ============================================================
// SPRITES — Pixel art generation & sprite cache
// ============================================================
const spriteCache = {};

function genSprite(name, w, h, fn) {
  if (spriteCache[name]) return spriteCache[name];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  spriteCache[name] = c;
  return c;
}

// --- TILE SPRITES ---
function generateTiles() {
  genSprite('grass_0', 32, 32, (c) => {
    c.fillStyle='#4a7c3f';c.fillRect(0,0,32,32);
    c.fillStyle='#5a8f4f';
    for(let i=0;i<12;i++){c.fillRect((i*97)%28+2,(i*71+13)%28+2,2,2)}
    c.fillStyle='#3d6b34';
    for(let i=0;i<6;i++){c.fillRect((i*61+5)%28,(i*83+7)%28,3,3)}
  });
  genSprite('grass_1', 32, 32, (c) => {
    c.fillStyle='#4a7c3f';c.fillRect(0,0,32,32);
    c.fillStyle='#5a8f4f';
    for(let i=0;i<10;i++){c.fillRect((i*83)%28,(i*61+5)%28,2,2)}
    const fl=[[6,8],[18,5],[10,20],[24,15],[3,25]];
    for(const[fx,fy]of fl){c.fillStyle='#f1c40f';c.fillRect(fx+1,fy,2,1);c.fillRect(fx,fy+1,4,1);c.fillRect(fx+1,fy+2,2,1);c.fillStyle='#e74c3c';c.fillRect(fx+1,fy+1,2,1)}
  });
  genSprite('grass_2', 32, 32, (c) => {
    c.fillStyle='#3d6b34';c.fillRect(0,0,32,32);
    c.fillStyle='#4a7c3f';for(let i=0;i<8;i++){c.fillRect((i*4)%28+2,20,2,12)}
    c.fillStyle='#5a8f4f';for(let i=0;i<8;i++){c.fillRect((i*4+1)%28+1,14,2,18)}
    c.fillStyle='#6aaf5f';for(let i=0;i<6;i++){c.fillRect((i*5+2)%26+3,10,2,22)}
  });
  genSprite('dirt_0', 32, 32, (c) => {
    c.fillStyle='#c4a882';c.fillRect(0,0,32,32);
    c.fillStyle='#d4c5a9';for(let i=0;i<15;i++){c.fillRect((i*73+11)%28+2,(i*59+7)%28+2,2,1)}
    c.fillStyle='#b8976a';for(let i=0;i<8;i++){c.fillRect((i*97+3)%26+3,(i*67+15)%26+3,3,2)}
  });
  genSprite('dirt_1', 32, 32, (c) => {
    c.fillStyle='#c4a882';c.fillRect(0,0,32,32);
    c.fillStyle='#b8976a';c.fillRect(7,0,4,32);c.fillRect(21,0,4,32);
    c.fillStyle='#a07850';c.fillRect(8,0,2,32);c.fillRect(22,0,2,32);
  });
  for(let f=0;f<3;f++){
    genSprite('water_'+f, 32, 32, (c,w,h) => {
      const off=f*4;c.fillStyle='#3d85c6';c.fillRect(0,0,w,h);
      c.strokeStyle='#7ec8e3';c.lineWidth=1;
      for(let wy=4;wy<h;wy+=8){c.beginPath();for(let wx=0;wx<w;wx+=4){const v=wy+Math.sin((wx+off*3)*0.4)*2;wx===0?c.moveTo(wx,v):c.lineTo(wx,v)}c.stroke()}
    });
  }
  genSprite('tree', 32, 32, (c) => {
    c.fillStyle='rgba(0,0,0,0.25)';c.beginPath();c.ellipse(17,30,10,3,0,0,Math.PI*2);c.fill();
    c.fillStyle='#5d3a1a';c.fillRect(13,22,6,10);
    c.fillStyle='#3d6b34';c.beginPath();c.moveTo(16,2);c.lineTo(24,16);c.lineTo(8,16);c.closePath();c.fill();
    c.fillStyle='#4a7c3f';c.beginPath();c.moveTo(16,7);c.lineTo(26,22);c.lineTo(6,22);c.closePath();c.fill();
    c.fillStyle='#5a8f4f';c.fillRect(13,9,3,2);c.fillRect(18,14,3,2);
  });
  genSprite('rock', 32, 32, (c) => {
    c.fillStyle='#6b7280';c.beginPath();
    c.moveTo(10,26);c.lineTo(4,18);c.lineTo(6,10);c.lineTo(14,5);c.lineTo(22,6);c.lineTo(28,13);c.lineTo(27,22);c.lineTo(20,27);c.closePath();c.fill();
    c.fillStyle='#9ca3af';c.beginPath();c.moveTo(10,10);c.lineTo(14,6);c.lineTo(22,7);c.lineTo(25,12);c.lineTo(18,11);c.closePath();c.fill();
    c.fillStyle='#4b5563';c.beginPath();c.moveTo(10,26);c.lineTo(5,19);c.lineTo(8,16);c.lineTo(12,22);c.closePath();c.fill();
  });
  genSprite('townFloor', 32, 32, (c) => {
    c.fillStyle='#e8d9b5';c.fillRect(0,0,32,32);
    c.strokeStyle='#d4c090';c.lineWidth=1;
    for(let i=8;i<32;i+=8){c.beginPath();c.moveTo(i,0);c.lineTo(i,32);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(32,i);c.stroke()}
  });
  genSprite('building', 64, 64, (c) => {
    c.fillStyle='#92400e';c.fillRect(0,20,64,44);
    c.fillStyle='#c0392b';c.beginPath();c.moveTo(0,22);c.lineTo(32,2);c.lineTo(64,22);c.closePath();c.fill();
    c.fillStyle='#78350f';c.fillRect(24,40,16,24);
    c.fillStyle='#7ec8e3';c.fillRect(8,28,12,10);c.fillRect(44,28,12,10);
    c.strokeStyle='#5d3a1a';c.lineWidth=1;c.strokeRect(8,28,12,10);c.strokeRect(44,28,12,10);
  });
}

// --- CHARACTER SPRITES ---
function drawHumanoid(c, dir, frame, skin, opts={}) {
  const {bodyColor='#888',armorColor='#888',legsColor='#555',headExtra=null,bodyExtra=null,leftHand=null,rightHand=null}=opts;
  const isLeft=dir==='left',isRight=dir==='right',isUp=dir==='up',isSide=isLeft||isRight;
  c.save();
  if(isLeft){c.translate(32,0);c.scale(-1,1)}
  c.fillStyle='rgba(0,0,0,0.2)';c.beginPath();c.ellipse(16,30,8,3,0,0,Math.PI*2);c.fill();
  let lOff=0,rOff=0;
  if(frame===1){lOff=-3;rOff=3}if(frame===2){lOff=3;rOff=-3}
  c.fillStyle=legsColor;
  if(!isSide){c.fillRect(11,22,4,9+lOff);c.fillRect(17,22,4,9+rOff);c.fillStyle='#333';c.fillRect(11,30+lOff,4,2);c.fillRect(17,30+rOff,4,2)}
  else{const s=frame===1?-2:frame===2?2:0;c.fillRect(12,22,4,9);c.fillRect(16+s,22,4,9);c.fillStyle='#333';c.fillRect(12,30,4,2);c.fillRect(16+s,30,4,2)}
  c.fillStyle=bodyColor;c.fillRect(9,12,14,12);c.fillStyle=armorColor;c.fillRect(9,12,14,4);
  const sw=frame===1?-2:frame===2?2:0;
  c.fillStyle=bodyColor;
  if(!isSide){c.fillRect(5,12+sw,4,9);c.fillRect(23,12-sw,4,9)}else{c.fillRect(5,12,4,9);c.fillRect(23,12+sw,4,9)}
  if(leftHand)leftHand(c,isSide);if(rightHand)rightHand(c,isSide);if(bodyExtra)bodyExtra(c,isSide);
  c.fillStyle=isUp?bodyColor:skin;c.fillRect(10,4,12,10);
  if(!isUp){c.fillStyle='#111';if(!isSide){c.fillRect(12,7,2,2);c.fillRect(18,7,2,2)}else{c.fillRect(19,7,2,2)}}
  if(headExtra)headExtra(c,isSide,isUp);
  c.restore();
}

function generateCharacters() {
  const dirs=['down','up','left','right'];
  const classes={
    knight:{body:'#bdc3c7',armor:'#c0392b',legs:'#7f8c8d',
      head:(c,s,u)=>{c.fillStyle='#bdc3c7';c.fillRect(9,2,14,7);c.fillStyle='#95a5a6';c.fillRect(9,7,14,3);if(!u){c.fillStyle='#2c3e50';if(!s){c.fillRect(11,7,4,2);c.fillRect(17,7,4,2)}else{c.fillRect(18,7,4,2)}}c.fillStyle='#c0392b';c.fillRect(5,11,5,4);c.fillRect(22,11,5,4)},
      right:(c)=>{c.fillStyle='#bdc3c7';c.fillRect(25,6,2,14);c.fillStyle='#7f8c8d';c.fillRect(23,14,6,2);c.fillStyle='#f1c40f';c.fillRect(25,19,2,2)},
      left:(c)=>{c.fillStyle='#c0392b';c.fillRect(3,12,5,7);c.fillStyle='#e74c3c';c.fillRect(4,13,3,5)}},
    mage:{body:'#8e44ad',armor:'#7d3c98',legs:'#6c3483',
      head:(c,s,u)=>{c.fillStyle='#8e44ad';c.beginPath();c.moveTo(16,-4);c.lineTo(23,4);c.lineTo(9,4);c.closePath();c.fill();c.fillStyle='#7d3c98';c.fillRect(7,4,18,3);c.fillStyle='#f1c40f';c.fillRect(15,-2,2,2)},
      right:(c)=>{c.fillStyle='#8B4513';c.fillRect(26,2,2,22);c.fillStyle='#2980b9';c.beginPath();c.arc(27,1,4,0,Math.PI*2);c.fill();c.fillStyle='#7ec8e3';c.beginPath();c.arc(26,0,2,0,Math.PI*2);c.fill()}},
    ranger:{body:'#27ae60',armor:'#1e8449',legs:'#8B4513',
      head:(c,s,u)=>{c.fillStyle='#27ae60';c.fillRect(8,2,16,10);c.fillStyle='#1e8449';c.fillRect(8,2,3,10);c.fillRect(21,2,3,10);c.fillRect(6,12,3,8);c.fillRect(23,12,3,8)},
      left:(c)=>{c.strokeStyle='#8B4513';c.lineWidth=2;c.beginPath();c.arc(5,16,9,-Math.PI*0.6,Math.PI*0.6);c.stroke();c.strokeStyle='#d4c5a9';c.lineWidth=1;c.beginPath();c.moveTo(5,8);c.lineTo(5,24);c.stroke()},
      bodyExtra:(c)=>{c.fillStyle='#8B4513';c.fillRect(22,10,4,10);c.fillStyle='#f1c40f';c.fillRect(23,8,1,4);c.fillRect(25,7,1,5)}},
    priest:{body:'#ecf0f1',armor:'#f1c40f',legs:'#bdc3c7',
      head:(c,s,u)=>{c.strokeStyle='#f1c40f';c.lineWidth=2;c.beginPath();c.ellipse(16,2,8,3,0,0,Math.PI*2);c.stroke();c.strokeStyle='#f1c40f';c.lineWidth=1;c.strokeRect(9,11,14,2)},
      right:(c)=>{c.fillStyle='#f1c40f';c.fillRect(26,6,2,18);c.fillStyle='#85c1e9';c.fillRect(24,4,6,4);c.fillStyle='#aed6f1';c.fillRect(25,4,2,2)}}
  };
  for(const[cls,d]of Object.entries(classes)){
    for(const dir of dirs){
      for(let f=0;f<3;f++){
        genSprite(cls+'_'+dir+'_'+f, 32, 32, (c)=>{
          drawHumanoid(c,dir,f,'#f4c99a',{bodyColor:d.body,armorColor:d.armor,legsColor:d.legs,headExtra:d.head,rightHand:d.right,leftHand:d.left,bodyExtra:d.bodyExtra||null});
        });
      }
    }
  }
}

// --- MONSTER SPRITES ---
function generateMonsters() {
  for(let f=0;f<2;f++){
    genSprite('slime_'+f, 32, 32, (c)=>{
      const sq=f===0,bw=sq?22:18,bh=sq?14:18,by=32-bh-2;
      c.fillStyle='rgba(0,0,0,0.2)';c.beginPath();c.ellipse(16,31,bw/2,2,0,0,Math.PI*2);c.fill();
      c.fillStyle='#2ecc71';c.beginPath();c.ellipse(16,by+bh/2,bw/2,bh/2,0,0,Math.PI*2);c.fill();
      c.fillStyle='#27ae60';c.beginPath();c.ellipse(16,by+bh/2+2,bw/2,bh/2-2,0,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(255,255,255,0.3)';c.beginPath();c.ellipse(13,by+3,4,2,-0.3,0,Math.PI*2);c.fill();
      c.fillStyle='#fff';c.fillRect(11,by+3,4,3);c.fillRect(18,by+3,4,3);
      c.fillStyle='#1a1a1a';c.fillRect(12,by+4,2,2);c.fillRect(19,by+4,2,2);
    });
  }
  for(let f=0;f<2;f++){
    genSprite('goblin_'+f, 32, 32, (c)=>{
      c.fillStyle='rgba(0,0,0,0.2)';c.beginPath();c.ellipse(16,31,7,2,0,0,Math.PI*2);c.fill();
      c.fillStyle='#5a7a2e';c.fillRect(11,22,4,8);c.fillRect(17,22,4,8);
      c.fillStyle='#7d9a3e';c.fillRect(9,14,14,10);c.fillRect(5,14,4,8);c.fillRect(23,14,4,8);
      c.fillStyle='#9ca3af';c.fillRect(27,10,2,8);
      c.fillStyle='#7d9a3e';c.fillRect(9,6,14,10);
      c.beginPath();c.moveTo(9,8);c.lineTo(5,4);c.lineTo(9,11);c.fill();
      c.beginPath();c.moveTo(23,8);c.lineTo(27,4);c.lineTo(23,11);c.fill();
      c.fillStyle='#e74c3c';c.fillRect(11,9,3,2);c.fillRect(18,9,3,2);
    });
  }
  for(let f=0;f<2;f++){
    genSprite('wolf_'+f, 32, 32, (c)=>{
      const run=f===1;
      c.fillStyle='rgba(0,0,0,0.2)';c.beginPath();c.ellipse(16,31,12,2,0,0,Math.PI*2);c.fill();
      c.fillStyle='#5d6d7e';c.fillRect(6,16,22,10);
      c.fillStyle='#4a5568';const lo=run?3:0;
      c.fillRect(7,25,3,6-lo);c.fillRect(11,25,3,6+lo);c.fillRect(18,25,3,6+lo);c.fillRect(22,25,3,6-lo);
      c.fillStyle='#5d6d7e';c.beginPath();c.moveTo(28,17);c.quadraticCurveTo(34,run?10:14,30,run?12:15);c.fill();
      c.fillRect(4,9,12,8);
      c.beginPath();c.moveTo(6,9);c.lineTo(4,4);c.lineTo(9,8);c.fill();
      c.beginPath();c.moveTo(13,9);c.lineTo(15,5);c.lineTo(15,9);c.fill();
      c.fillStyle='#f1c40f';c.fillRect(5,11,2,2);c.fillRect(11,11,2,2);
      c.fillStyle='#000';c.fillRect(6,11,1,2);c.fillRect(12,11,1,2);
      c.fillStyle='#2d3748';c.fillRect(2,13,2,2);
    });
  }
  for(let f=0;f<2;f++){
    genSprite('skeleton_'+f, 32, 32, (c)=>{
      const sw=f===1?-3:0;
      c.fillStyle='rgba(0,0,0,0.15)';c.beginPath();c.ellipse(16,31,8,2,0,0,Math.PI*2);c.fill();
      c.fillStyle='#f5f0e1';c.fillRect(11,22,3,10);c.fillRect(18,22,3,10);
      c.fillStyle='#e8e0cc';c.fillRect(10,19,12,4);
      c.fillStyle='#f5f0e1';c.fillRect(10,12,12,8);
      c.strokeStyle='#c8bfa8';c.lineWidth=1;
      for(let r=0;r<3;r++){c.beginPath();c.moveTo(10,13+r*2);c.lineTo(22,13+r*2);c.stroke()}
      c.fillStyle='#f5f0e1';c.fillRect(5,12+sw,5,8);c.fillRect(22,12-sw,5,8);
      c.fillStyle='#9ca3af';c.fillRect(27,4-sw,2,16);
      c.fillStyle='#f5f0e1';c.fillRect(10,2,12,11);
      c.fillStyle='#111';c.fillRect(12,6,3,4);c.fillRect(17,6,3,4);c.fillRect(15,9,2,2);
    });
  }
  for(let f=0;f<2;f++){
    genSprite('dragon_'+f, 64, 64, (c)=>{
      const b=f===1;
      c.fillStyle='rgba(0,0,0,0.25)';c.beginPath();c.ellipse(32,62,20,4,0,0,Math.PI*2);c.fill();
      c.fillStyle='#c0392b';c.fillRect(18,30,34,24);
      c.fillStyle='#e67e22';c.beginPath();c.ellipse(35,46,11,8,0,0,Math.PI*2);c.fill();
      c.fillStyle='#a93226';c.fillRect(18,50,8,12);c.fillRect(40,50,8,12);
      const wf=b?-5:0;
      c.fillStyle='#a93226';c.beginPath();c.moveTo(24,32);c.lineTo(4,10+wf);c.lineTo(14,32);c.closePath();c.fill();
      c.beginPath();c.moveTo(46,32);c.lineTo(60,10+wf);c.lineTo(50,32);c.closePath();c.fill();
      c.fillStyle='#c0392b';c.fillRect(22,4,22,16);
      c.fillStyle='#7b241c';c.beginPath();c.moveTo(26,4);c.lineTo(22,-4);c.lineTo(28,3);c.fill();
      c.beginPath();c.moveTo(40,4);c.lineTo(44,-4);c.lineTo(38,3);c.fill();
      c.fillStyle='#f1c40f';c.fillRect(24,7,6,5);c.fillRect(36,7,6,5);
      c.fillStyle='#1a1a1a';c.fillRect(26,7,2,5);c.fillRect(38,7,2,5);
      c.fillStyle='#f5f0e1';c.fillRect(20,16,2,3);c.fillRect(23,17,2,3);c.fillRect(26,17,2,3);
      if(b){const g=c.createRadialGradient(14,14,0,14,14,16);g.addColorStop(0,'rgba(255,255,200,0.9)');g.addColorStop(1,'rgba(200,40,0,0)');c.fillStyle=g;c.beginPath();c.arc(14,14,16,0,Math.PI*2);c.fill()}
    });
  }
}

// --- ITEM SPRITES ---
function generateItems() {
  genSprite('sword',16,16,(c)=>{c.fillStyle='#9ca3af';c.fillRect(7,1,3,11);c.fillStyle='#d4a017';c.fillRect(4,10,9,2);c.fillStyle='#8B4513';c.fillRect(7,12,3,4)});
  genSprite('staff',16,16,(c)=>{c.fillStyle='#8B4513';c.fillRect(7,4,2,12);c.fillStyle='#2980b9';c.beginPath();c.arc(8,4,4,0,Math.PI*2);c.fill();c.fillStyle='#7ec8e3';c.beginPath();c.arc(7,3,2,0,Math.PI*2);c.fill()});
  genSprite('bow',16,16,(c)=>{c.strokeStyle='#8B4513';c.lineWidth=2;c.beginPath();c.arc(8,8,6,-Math.PI*0.7,Math.PI*0.7);c.stroke();c.strokeStyle='#d4c5a9';c.lineWidth=1;c.beginPath();c.moveTo(8,3);c.lineTo(8,13);c.stroke()});
  genSprite('scepter',16,16,(c)=>{c.fillStyle='#d4a017';c.fillRect(7,5,2,11);c.fillStyle='#85c1e9';c.fillRect(4,1,8,6);c.fillStyle='#d4a017';c.fillRect(3,5,10,2)});
  genSprite('potion_hp',16,16,(c)=>{c.fillStyle='#d4a017';c.fillRect(6,1,4,3);c.fillStyle='#e74c3c';c.beginPath();c.ellipse(8,10,5,6,0,0,Math.PI*2);c.fill();c.fillStyle='#ff8080';c.beginPath();c.ellipse(6,7,2,3,-0.3,0,Math.PI*2);c.fill()});
  genSprite('potion_mp',16,16,(c)=>{c.fillStyle='#d4a017';c.fillRect(6,1,4,3);c.fillStyle='#2980b9';c.beginPath();c.ellipse(8,10,5,6,0,0,Math.PI*2);c.fill();c.fillStyle='#7ec8e3';c.beginPath();c.ellipse(6,7,2,3,-0.3,0,Math.PI*2);c.fill()});
  genSprite('accessory',16,16,(c)=>{c.strokeStyle='#d4a017';c.lineWidth=2.5;c.beginPath();c.arc(8,9,5,0,Math.PI*2);c.stroke();c.fillStyle='#e74c3c';c.beginPath();c.arc(8,4,3,0,Math.PI*2);c.fill()});
  genSprite('loot_bag',16,16,(c)=>{c.fillStyle='#8B4513';c.beginPath();c.ellipse(8,11,6,5,0,0,Math.PI*2);c.fill();c.fillStyle='#a0522d';c.beginPath();c.ellipse(7,10,4,3,-0.2,0,Math.PI*2);c.fill();c.fillStyle='#d4a017';c.fillRect(6,4,4,2)});
  genSprite('armor_leather',16,16,(c)=>{c.fillStyle='#8B4513';c.fillRect(3,2,10,12);c.fillStyle='#a0522d';c.fillRect(4,3,3,10);c.fillStyle='#d4a017';c.fillRect(6,5,4,1);c.fillRect(6,8,4,1)});
  genSprite('armor_chain',16,16,(c)=>{c.fillStyle='#6b7280';c.fillRect(3,2,10,12);for(let y=2;y<14;y+=2)for(let x=3;x<13;x+=2){c.fillStyle=(Math.floor(y/2)%2===0?x%4===1:x%4===3)?'#9ca3af':'#4b5563';c.fillRect(x,y,2,2)}});
  genSprite('armor_plate',16,16,(c)=>{c.fillStyle='#9ca3af';c.fillRect(3,2,10,12);c.fillStyle='#bdc3c7';c.fillRect(4,3,8,4);c.fillStyle='#d5d8dc';c.fillRect(4,3,3,3)});
  // --- Additional item icons ---
  genSprite('icon_sword',16,16,(c)=>{
    c.fillStyle='#9ca3af';c.save();c.translate(8,8);c.rotate(-Math.PI/4);c.fillRect(-1,-7,3,11);c.restore();
    c.fillStyle='#d4a017';c.fillRect(4,10,8,2);c.fillStyle='#8B4513';c.fillRect(6,12,4,3);
  });
  genSprite('icon_axe',16,16,(c)=>{
    c.fillStyle='#8B4513';c.fillRect(7,4,2,12);
    c.fillStyle='#9ca3af';c.beginPath();c.moveTo(4,2);c.lineTo(9,5);c.lineTo(9,9);c.lineTo(4,12);c.quadraticCurveTo(2,7,4,2);c.fill();
    c.fillStyle='#bdc3c7';c.beginPath();c.moveTo(5,4);c.lineTo(8,6);c.lineTo(8,8);c.lineTo(5,10);c.quadraticCurveTo(3,7,5,4);c.fill();
  });
  genSprite('icon_staff',16,16,(c)=>{
    c.fillStyle='#8B4513';c.fillRect(7,4,2,12);
    c.fillStyle='#2980b9';c.beginPath();c.arc(8,3,3,0,Math.PI*2);c.fill();
    c.fillStyle='#7ec8e3';c.beginPath();c.arc(7,2,1.5,0,Math.PI*2);c.fill();
  });
  genSprite('icon_bow',16,16,(c)=>{
    c.strokeStyle='#8B4513';c.lineWidth=2;c.beginPath();c.arc(6,8,6,-Math.PI*0.6,Math.PI*0.6);c.stroke();
    c.strokeStyle='#d4c5a9';c.lineWidth=1;c.beginPath();c.moveTo(6,3);c.lineTo(6,13);c.stroke();
    c.fillStyle='#9ca3af';c.fillRect(10,7,5,1);c.beginPath();c.moveTo(15,7);c.lineTo(12,5);c.lineTo(12,10);c.fill();
  });
  genSprite('icon_mace',16,16,(c)=>{
    c.fillStyle='#8B4513';c.fillRect(7,6,2,10);
    c.fillStyle='#9ca3af';c.beginPath();c.arc(8,5,4,0,Math.PI*2);c.fill();
    c.fillStyle='#6b7280';c.fillRect(4,3,8,2);c.fillRect(6,1,4,2);
  });
  genSprite('icon_dagger',16,16,(c)=>{
    c.fillStyle='#bdc3c7';c.save();c.translate(8,8);c.rotate(-Math.PI/4);c.fillRect(-1,-6,2,8);c.restore();
    c.fillStyle='#d4a017';c.fillRect(6,9,4,2);c.fillStyle='#8B4513';c.fillRect(7,11,2,3);
  });
  genSprite('icon_armor',16,16,(c)=>{
    c.fillStyle='#9ca3af';c.fillRect(3,3,10,10);
    c.fillStyle='#bdc3c7';c.fillRect(4,3,8,4);
    c.fillStyle='#6b7280';c.fillRect(3,3,2,6);c.fillRect(11,3,2,6);
    c.fillStyle='#d5d8dc';c.fillRect(5,4,2,2);
  });
  genSprite('icon_shield',16,16,(c)=>{
    c.fillStyle='#2980b9';c.beginPath();c.moveTo(3,2);c.lineTo(13,2);c.lineTo(13,8);c.lineTo(8,14);c.lineTo(3,8);c.closePath();c.fill();
    c.fillStyle='#3498db';c.beginPath();c.moveTo(5,4);c.lineTo(11,4);c.lineTo(11,7);c.lineTo(8,11);c.lineTo(5,7);c.closePath();c.fill();
    c.fillStyle='#d4a017';c.fillRect(7,4,2,8);c.fillRect(5,6,6,2);
  });
  genSprite('icon_robe',16,16,(c)=>{
    c.fillStyle='#8e44ad';c.beginPath();c.moveTo(4,3);c.lineTo(12,3);c.lineTo(14,14);c.lineTo(2,14);c.closePath();c.fill();
    c.fillStyle='#7d3c98';c.fillRect(5,3,6,3);
    c.fillStyle='#f1c40f';c.fillRect(6,5,4,1);c.fillRect(7,8,2,1);
  });
  genSprite('icon_potion_hp',16,16,(c)=>{
    c.fillStyle='#8B4513';c.fillRect(6,1,4,3);
    c.fillStyle='#e74c3c';c.beginPath();c.ellipse(8,10,5,6,0,0,Math.PI*2);c.fill();
    c.fillStyle='#ff8080';c.beginPath();c.ellipse(6,7,2,3,-0.3,0,Math.PI*2);c.fill();
    c.fillStyle='#fff';c.fillRect(7,8,2,4);c.fillRect(6,9,4,2);
  });
  genSprite('icon_potion_mp',16,16,(c)=>{
    c.fillStyle='#8B4513';c.fillRect(6,1,4,3);
    c.fillStyle='#2980b9';c.beginPath();c.ellipse(8,10,5,6,0,0,Math.PI*2);c.fill();
    c.fillStyle='#7ec8e3';c.beginPath();c.ellipse(6,7,2,3,-0.3,0,Math.PI*2);c.fill();
    c.fillStyle='#fff';c.fillRect(6,9,1,3);c.fillRect(7,8,1,1);
  });
  genSprite('icon_ring',16,16,(c)=>{
    c.strokeStyle='#d4a017';c.lineWidth=2;c.beginPath();c.arc(8,9,4,0,Math.PI*2);c.stroke();
    c.fillStyle='#e74c3c';c.beginPath();c.arc(8,5,2.5,0,Math.PI*2);c.fill();
    c.fillStyle='#ff8080';c.beginPath();c.arc(7,4,1,0,Math.PI*2);c.fill();
  });
  genSprite('icon_amulet',16,16,(c)=>{
    c.strokeStyle='#d4a017';c.lineWidth=1.5;c.beginPath();c.arc(8,6,5,Math.PI*0.1,Math.PI*0.9);c.stroke();
    c.fillStyle='#2ecc71';c.beginPath();c.moveTo(8,8);c.lineTo(5,12);c.lineTo(8,14);c.lineTo(11,12);c.closePath();c.fill();
    c.fillStyle='#82e0aa';c.beginPath();c.moveTo(8,9);c.lineTo(6,11);c.lineTo(8,12);c.closePath();c.fill();
  });
  genSprite('icon_bracelet',16,16,(c)=>{
    c.strokeStyle='#d4a017';c.lineWidth=2.5;c.beginPath();c.ellipse(8,9,5,3,0,0,Math.PI*2);c.stroke();
    c.fillStyle='#85c1e9';c.beginPath();c.arc(4,8,2,0,Math.PI*2);c.fill();
    c.fillStyle='#3498db';c.beginPath();c.arc(12,8,2,0,Math.PI*2);c.fill();
  });
  genSprite('icon_gem_fire',16,16,(c)=>{
    c.fillStyle='#e74c3c';c.beginPath();c.moveTo(8,2);c.lineTo(3,8);c.lineTo(5,14);c.lineTo(11,14);c.lineTo(13,8);c.closePath();c.fill();
    c.fillStyle='#ff6b6b';c.beginPath();c.moveTo(8,4);c.lineTo(5,8);c.lineTo(8,12);c.closePath();c.fill();
  });
  genSprite('icon_gem_ice',16,16,(c)=>{
    c.fillStyle='#3498db';c.beginPath();c.moveTo(8,2);c.lineTo(3,8);c.lineTo(5,14);c.lineTo(11,14);c.lineTo(13,8);c.closePath();c.fill();
    c.fillStyle='#85c1e9';c.beginPath();c.moveTo(8,4);c.lineTo(5,8);c.lineTo(8,12);c.closePath();c.fill();
  });
  genSprite('icon_gem_lightning',16,16,(c)=>{
    c.fillStyle='#f1c40f';c.beginPath();c.moveTo(8,2);c.lineTo(3,8);c.lineTo(5,14);c.lineTo(11,14);c.lineTo(13,8);c.closePath();c.fill();
    c.fillStyle='#f9e79f';c.beginPath();c.moveTo(8,4);c.lineTo(5,8);c.lineTo(8,12);c.closePath();c.fill();
  });
  genSprite('icon_gem_shield',16,16,(c)=>{
    c.fillStyle='#6b7280';c.beginPath();c.moveTo(8,2);c.lineTo(3,8);c.lineTo(5,14);c.lineTo(11,14);c.lineTo(13,8);c.closePath();c.fill();
    c.fillStyle='#9ca3af';c.beginPath();c.moveTo(8,4);c.lineTo(5,8);c.lineTo(8,12);c.closePath();c.fill();
  });
  genSprite('icon_soul_gem',16,16,(c)=>{
    const g=c.createRadialGradient(8,8,0,8,8,7);g.addColorStop(0,'#d8b4fe');g.addColorStop(1,'#7c3aed');c.fillStyle=g;
    c.beginPath();c.moveTo(8,1);c.lineTo(3,6);c.lineTo(3,11);c.lineTo(8,15);c.lineTo(13,11);c.lineTo(13,6);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,0.4)';c.beginPath();c.moveTo(8,3);c.lineTo(5,6);c.lineTo(8,9);c.closePath();c.fill();
  });
  genSprite('icon_enhance_stone',16,16,(c)=>{
    const g=c.createRadialGradient(8,8,0,8,8,7);g.addColorStop(0,'#f9e79f');g.addColorStop(1,'#d4a017');c.fillStyle=g;
    c.beginPath();c.moveTo(8,1);c.lineTo(13,5);c.lineTo(13,11);c.lineTo(8,15);c.lineTo(3,11);c.lineTo(3,5);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,0.5)';c.beginPath();c.moveTo(8,3);c.lineTo(11,5);c.lineTo(8,8);c.closePath();c.fill();
  });
  genSprite('icon_ore',16,16,(c)=>{
    c.fillStyle='#6b7280';c.beginPath();c.moveTo(2,12);c.lineTo(4,6);c.lineTo(8,4);c.lineTo(13,5);c.lineTo(14,10);c.lineTo(12,14);c.lineTo(5,14);c.closePath();c.fill();
    c.fillStyle='#9ca3af';c.beginPath();c.moveTo(4,7);c.lineTo(8,5);c.lineTo(11,6);c.lineTo(9,9);c.closePath();c.fill();
    c.fillStyle='#bdc3c7';c.fillRect(6,6,2,2);
  });
  genSprite('icon_wood',16,16,(c)=>{
    c.fillStyle='#8B4513';c.fillRect(3,5,10,7);
    c.fillStyle='#a0522d';c.beginPath();c.ellipse(3,8,2,4,0,Math.PI*0.5,Math.PI*1.5);c.fill();
    c.beginPath();c.ellipse(13,8,2,4,0,-Math.PI*0.5,Math.PI*0.5);c.fill();
    c.strokeStyle='#5d3a1a';c.lineWidth=0.5;
    for(let y=6;y<12;y+=2){c.beginPath();c.moveTo(3,y);c.lineTo(13,y);c.stroke();}
  });
  genSprite('icon_leather',16,16,(c)=>{
    c.fillStyle='#c4a882';c.fillRect(2,3,12,11);
    c.fillStyle='#b8976a';c.fillRect(3,4,10,9);
    c.strokeStyle='#8B4513';c.lineWidth=0.5;
    c.beginPath();c.moveTo(4,6);c.quadraticCurveTo(8,4,12,6);c.stroke();
    c.beginPath();c.moveTo(4,10);c.quadraticCurveTo(8,8,12,10);c.stroke();
  });
}

function initSprites() {
  generateTiles();
  generateCharacters();
  generateMonsters();
  generateItems();
}
