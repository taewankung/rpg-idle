// ============================================================
// CONFIG — Constants, data tables, utility, global game state
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE = 32;
const MAP_W = 50, MAP_H = 50;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function rf(a,b){return Math.random()*(b-a)+a}

// --- CLASS DATA ---
const CLASS_DATA = {
  Knight:{hp:150,mp:40,atk:12,def:10,spd:2.5,crit:0.05,growth:{hp:20,mp:3,atk:2,def:2.5,spd:0.3},attackRange:TILE*1.2,
    skills:[{name:'Sword Slash',key:'Q',dmgPct:1.5,cd:4,range:TILE*1.5,aoe:true,aoeR:TILE*1.5},{name:'Iron Wall',key:'W',dmgPct:0,cd:15,range:0,buff:{type:'def',pct:0.5,dur:5}},{name:'War Cry',key:'E',dmgPct:0,cd:20,range:TILE*3,aoe:true,aoeR:TILE*3,aggro:3},{name:'Berserk',key:'R',dmgPct:0,cd:45,range:0,buff:{type:'berserk',atkPct:0.8,defPct:-0.3,dur:8},reqLv:10}]},
  Mage:{hp:80,mp:120,atk:15,def:4,spd:2.8,crit:0.08,growth:{hp:10,mp:12,atk:3,def:1,spd:0.3},attackRange:TILE*3,
    skills:[{name:'Fireball',key:'Q',dmgPct:1.8,cd:3,range:TILE*5},{name:'Frost Nova',key:'W',dmgPct:1.2,cd:10,range:TILE*2,aoe:true,aoeR:TILE*2,slow:true},{name:'Mana Shield',key:'E',dmgPct:0,cd:18,range:0,buff:{type:'manaShield',dur:5}},{name:'Meteor',key:'R',dmgPct:3.5,cd:50,range:TILE*6,aoe:true,aoeR:TILE*3,reqLv:10}]},
  Ranger:{hp:100,mp:60,atk:13,def:5,spd:4.0,crit:0.15,growth:{hp:12,mp:5,atk:2.5,def:1.5,spd:0.5},attackRange:TILE*4,
    skills:[{name:'Power Shot',key:'Q',dmgPct:2.0,cd:3,range:TILE*6,piercing:true},{name:'Multi-Arrow',key:'W',dmgPct:0.8,cd:8,range:TILE*4,aoe:true,hits:3,aoeR:TILE*2},{name:'Evasion',key:'E',dmgPct:0,cd:12,range:0,buff:{type:'evasion',dur:2,spdPct:0.5}},{name:'Snipe',key:'R',dmgPct:4.0,cd:40,range:TILE*10,reqLv:10}]},
  Priest:{hp:110,mp:100,atk:8,def:6,spd:2.8,crit:0.05,growth:{hp:14,mp:10,atk:1.5,def:1.5,spd:0.3},attackRange:TILE*2.5,
    skills:[{name:'Holy Smite',key:'Q',dmgPct:1.6,cd:3,range:TILE*3},{name:'Heal',key:'W',dmgPct:0,cd:8,range:0,heal:0.3},{name:'Purify',key:'E',dmgPct:0,cd:15,range:0,buff:{type:'purify',mpPct:0.2}},{name:'Divine Judgment',key:'R',dmgPct:2.8,cd:45,range:TILE*4,aoe:true,aoeR:TILE*3,healPct:0.15,reqLv:10}]}
};

// --- MONSTER DATA ---
const MON_DATA={
  slime:{hpR:[30,50],atkR:[5,8],def:2,spd:1,expR:[20,30],goldR:[5,10],lvR:[1,3],zone:[5,15]},
  goblin:{hpR:[60,90],atkR:[10,15],def:5,spd:2.5,expR:[40,60],goldR:[10,20],lvR:[3,6],zone:[15,25]},
  wolf:{hpR:[80,120],atkR:[15,22],def:6,spd:3.5,expR:[60,80],goldR:[15,25],lvR:[5,8],zone:[15,25]},
  skeleton:{hpR:[150,200],atkR:[20,30],def:15,spd:2,expR:[100,140],goldR:[25,40],lvR:[8,12],zone:[25,35]},
  dragon:{hpR:[800,800],atkR:[50,50],def:25,spd:2,expR:[500,500],goldR:[200,200],lvR:[15,15],zone:[35,48]}
};

// --- ITEM DATA ---
const RARITY_COLORS={common:'#AAAAAA',uncommon:'#44FF44',rare:'#4488FF',epic:'#AA44FF',legendary:'#FF8800'};
const RARITY_W=[{r:'common',w:50},{r:'uncommon',w:25},{r:'rare',w:15},{r:'epic',w:8},{r:'legendary',w:2}];
const WPNS=['Sword','Axe','Staff','Bow','Mace','Dagger'];
const ARMRS=['Robe','Plate','Leather','Chain'];
const ACCS=['Ring','Amulet','Bracelet'];
const PRFX=['','Iron ','Steel ','Shadow ','Sacred ','Blazing ','Ancient '];

// --- NPC DATA ---
const NPC_NAMES=['xXDarkKnightXx','SakuraHime','ProGamer99','L33tSlayer','MoonWitch','IronFist','ShadowArcher','HolyLight','DragonBorn','PixelHero','NightBlade','StarMage'];
const CLASSES=['Knight','Mage','Ranger','Priest'];

// --- UI CLASS DEFS ---
const CLASS_DEFS={
  Knight:{color:'#c0392b',desc:'Tank warrior. Tough and relentless.',stats:{HP:1,MP:.3,ATK:.6,DEF:1,SPD:.4,CRIT:.3}},
  Mage:{color:'#8e44ad',desc:'Arcane master. Devastating AoE magic.',stats:{HP:.4,MP:1,ATK:1,DEF:.3,SPD:.5,CRIT:.7}},
  Ranger:{color:'#27ae60',desc:'Swift hunter. Fast kills, fast moves.',stats:{HP:.5,MP:.5,ATK:.8,DEF:.4,SPD:1,CRIT:.9}},
  Priest:{color:'#f1c40f',desc:'Holy healer. Nearly unkillable sustain.',stats:{HP:.7,MP:.9,ATK:.3,DEF:.7,SPD:.5,CRIT:.2}}
};
const CLASS_LIST=['Knight','Mage','Ranger','Priest'];

// --- GLOBAL GAME STATE ---
const game={
  state:'classSelect',player:null,monsters:[],npcPlayers:[],itemDrops:[],
  dayNightCycle:0,time:0,dt:0,lastTime:0,killCount:0,sessionExp:0,sessionStart:Date.now(),
  // Screen shake
  shakeTimer:0,shakeIntensity:0,
  // Item drop notifications (slide from right)
  notifications:[],
  // Kill streak popups
  streakPopup:null,
  // Ranger speed trail particles
  trails:[],
  // Settings (saved to localStorage)
  settings:{
    volume:0.3,muted:false,gameSpeed:1,
    showDmgNumbers:true,showNPCs:true,showChat:true,autoBuyPotions:true
  }
};
