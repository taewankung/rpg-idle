// ============================================================
// SOUND — Web Audio API oscillator-based sound effects
// ============================================================
const sfx={
  ctx:null,masterGain:null,volume:0.3,muted:false,ready:false,fadeTimer:0,
  init(){
    if(this.ctx)return;
    this.ctx=new(window.AudioContext||window.webkitAudioContext)();
    this.masterGain=this.ctx.createGain();
    this.masterGain.gain.value=0;// Start silent, fade in when game starts
    this.masterGain.connect(this.ctx.destination);
  },
  // Call when game world starts to enable sounds with fade-in
  startFadeIn(){this.ready=true;this.fadeTimer=0},
  // Called each frame from update() to ramp volume over 2 seconds
  updateFade(dt){
    if(!this.ready||!this.masterGain||this.muted)return;
    if(this.fadeTimer<2){this.fadeTimer+=dt;const t=Math.min(1,this.fadeTimer/2);this.masterGain.gain.value=this.volume*t}
  },
  ensureCtx(){if(!this.ready)return;if(!this.ctx)this.init();if(this.ctx.state==='suspended')this.ctx.resume()},
  setVolume(v){this.volume=v;if(this.masterGain){if(this.fadeTimer>=2)this.masterGain.gain.value=this.muted?0:v}},
  toggleMute(){this.muted=!this.muted;if(this.masterGain)this.masterGain.gain.value=this.muted?0:this.volume},

  // Play a tone: freq, duration, type, volume multiplier
  tone(freq,dur,type,vol){
    this.ensureCtx();const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type||'sine';o.frequency.value=freq;
    g.gain.value=(vol||1)*0.3;g.gain.linearRampToValueAtTime(0,t+dur);
    o.connect(g);g.connect(this.masterGain);o.start(t);o.stop(t+dur);
  },

  // White noise burst
  noise(dur,vol){
    this.ensureCtx();const t=this.ctx.currentTime;
    const buf=this.ctx.createBuffer(1,Math.floor(this.ctx.sampleRate*dur),this.ctx.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);
    const src=this.ctx.createBufferSource();src.buffer=buf;
    const g=this.ctx.createGain();g.gain.value=(vol||1)*0.15;g.gain.linearRampToValueAtTime(0,t+dur);
    src.connect(g);g.connect(this.masterGain);src.start(t);src.stop(t+dur);
  },

  // --- Sound effects ---
  hit(){this.noise(0.08,0.8);this.tone(200,0.08,'square',0.3)},
  crit(){this.noise(0.12,1.2);this.tone(400,0.1,'square',0.5);this.tone(800,0.15,'sine',0.4)},
  spell(){this.ensureCtx();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.2);g.gain.value=0.2;g.gain.linearRampToValueAtTime(0,t+0.25);o.connect(g);g.connect(this.masterGain);o.start(t);o.stop(t+0.25)},
  arrow(){this.tone(1200,0.05,'triangle',0.4);this.tone(800,0.03,'triangle',0.3)},
  monDeath(){this.ensureCtx();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(60,t+0.4);g.gain.value=0.15;g.gain.linearRampToValueAtTime(0,t+0.4);o.connect(g);g.connect(this.masterGain);o.start(t);o.stop(t+0.4)},
  levelUp(){
    this.ensureCtx();const t=this.ctx.currentTime;
    const notes=[523.25,659.25,783.99,1046.50];// C5-E5-G5-C6
    notes.forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0.25;g.gain.linearRampToValueAtTime(0,t+0.15*i+0.2);o.connect(g);g.connect(this.masterGain);o.start(t+0.12*i);o.stop(t+0.12*i+0.25)});
  },
  itemPickup(){this.tone(880,0.06,'sine',0.5);this.tone(1320,0.08,'sine',0.4)},
  fireBreath(){
    this.ensureCtx();const t=this.ctx.currentTime;
    // Rumbling noise + descending tone
    this.noise(0.5,1.5);
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';
    o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(80,t+0.5);
    g.gain.value=0.2;g.gain.linearRampToValueAtTime(0,t+0.5);
    o.connect(g);g.connect(this.masterGain);o.start(t);o.stop(t+0.5);
  },
  victoryFanfare(){
    this.ensureCtx();const t=this.ctx.currentTime;
    const notes=[523.25,659.25,783.99,659.25,783.99,1046.50];
    notes.forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.value=0.3;g.gain.linearRampToValueAtTime(0,t+0.15*i+0.3);o.connect(g);g.connect(this.masterGain);o.start(t+0.15*i);o.stop(t+0.15*i+0.35)});
  }
};
