// ============================================================
// ATMOSPHERE — Day/night cycle, stars, weather effects
// ============================================================
function drawDayNight(){
  const c=game.dayNightCycle;let a=0;
  if(c<0.25)a=c/0.25*0.15;else if(c<0.5)a=0.15+(c-0.25)/0.25*0.25;
  else if(c<0.75)a=0.4-(c-0.5)/0.25*0.25;else a=0.15-(c-0.75)/0.25*0.15;
  if(a>0.01){ctx.save();ctx.fillStyle='rgba(0,0,40,'+a.toFixed(3)+')';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(a>0.2){const starAlpha=Math.min(1,(a-0.2)/0.2);ctx.fillStyle='rgba(255,255,255,'+starAlpha.toFixed(2)+')';
      const seed=42;for(let i=0;i<40;i++){const sx=(Math.sin(seed*i*137.5)*0.5+0.5)*canvas.width;const sy=(Math.cos(seed*i*73.1)*0.5+0.5)*canvas.height*0.5;
        const twinkle=Math.sin(game.time*2+i*1.7)*0.3+0.7;ctx.globalAlpha=starAlpha*twinkle;
        ctx.fillRect(Math.floor(sx),Math.floor(sy),Math.random()>0.7?2:1,1)}ctx.globalAlpha=1}
    ctx.restore()}
}
