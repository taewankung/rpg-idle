// ============================================================
// MAP — Tile generation, camera, collision, pathfinding
// ============================================================
const TILE_NAMES=['grass','dirt','water','tree','rock','townFloor','building'];

const map = {
  tiles: [],
  generate() {
    this.tiles=[];
    for(let y=0;y<MAP_H;y++){this.tiles[y]=[];for(let x=0;x<MAP_W;x++)this.tiles[y][x]=0}
    const cx=Math.floor(MAP_W/2),cy=Math.floor(MAP_H/2);
    // Town
    for(let y=cy-5;y<cy+5;y++)for(let x=cx-5;x<cx+5;x++)this.tiles[y][x]=5;
    // Buildings
    for(const[bx,by]of[[cx-4,cy-4],[cx+2,cy-4],[cx-4,cy+2],[cx+2,cy+2]])
      for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(bx+dx<MAP_W&&by+dy<MAP_H)this.tiles[by+dy][bx+dx]=6;
    // Paths
    for(let x=0;x<MAP_W;x++)if(this.tiles[cy][x]===0)this.tiles[cy][x]=1;
    for(let y=0;y<MAP_H;y++)if(this.tiles[y][cx]===0)this.tiles[y][cx]=1;
    for(let i=0;i<20;i++){if(cx+i<MAP_W&&cy+i<MAP_H&&this.tiles[cy+i][cx+i]===0)this.tiles[cy+i][cx+i]=1;if(cx+i<MAP_W&&cy-i>=0&&this.tiles[cy-i][cx+i]===0)this.tiles[cy-i][cx+i]=1}
    // Water
    for(const[wx,wy]of[[8,8],[40,10],[5,35],[42,38],[20,42],[35,5]]){
      const r=2+Math.floor(Math.sin(wx*wy)*1.5+2);
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r){const tx=wx+dx,ty=wy+dy;if(tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H&&this.tiles[ty][tx]===0)this.tiles[ty][tx]=2}
    }
    // Trees
    for(const[tx,ty]of[[3,3],[15,5],[45,8],[6,20],[38,18],[12,38],[44,30],[25,8],[8,45],[40,44]]){
      const r=2+Math.floor(Math.abs(Math.sin(tx+ty))*3);
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r){const nx=tx+dx,ny=ty+dy;if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&this.tiles[ny][nx]===0)this.tiles[ny][nx]=3}
    }
    // Rocks
    for(const[rx,ry]of[[18,12],[30,8],[10,28],[35,30],[22,45]]){
      const r=1+Math.floor(Math.abs(Math.cos(rx*ry))*2);
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r){const nx=rx+dx,ny=ry+dy;if(nx>=0&&nx<MAP_W&&ny>=0&&ny<MAP_H&&this.tiles[ny][nx]===0)this.tiles[ny][nx]=4}
    }
  },
  getTile(x,y){if(x<0||x>=MAP_W||y<0||y>=MAP_H)return-1;return this.tiles[y][x]},
  isWalkable(x,y){const t=this.getTile(x,y);return t===0||t===1||t===5},

  // --- A* PATHFINDING ---
  // Returns array of {x,y} in world coords (tile centers), or null if no path.
  // maxR = max search radius in tiles (default 20)
  findPath(wx1,wy1,wx2,wy2,maxR){
    maxR=maxR||20;
    const sx=Math.floor(wx1/TILE),sy=Math.floor(wy1/TILE);
    const ex=Math.floor(wx2/TILE),ey=Math.floor(wy2/TILE);
    // Quick checks
    if(sx===ex&&sy===ey)return[];
    if(!this.isWalkable(ex,ey)){
      // Find nearest walkable tile to target
      let best=null,bd=Infinity;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
        const nx=ex+dx,ny=ey+dy;
        if(this.isWalkable(nx,ny)){const d=Math.abs(dx)+Math.abs(dy);if(d<bd){bd=d;best={x:nx,y:ny}}}
      }
      if(!best)return null;
      return this.findPath(wx1,wy1,best.x*TILE+TILE/2,best.y*TILE+TILE/2,maxR);
    }
    if(Math.abs(sx-ex)>maxR||Math.abs(sy-ey)>maxR)return null;

    // A* with 8-directional movement
    const key=(x,y)=>x+y*MAP_W;
    const open=[];// {x,y,g,f}
    const gMap=new Map();
    const parent=new Map();
    const closed=new Set();

    const h=(x,y)=>Math.abs(x-ex)+Math.abs(y-ey);// Manhattan
    const startG=0;
    open.push({x:sx,y:sy,g:0,f:h(sx,sy)});
    gMap.set(key(sx,sy),0);

    const dirs=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    const dirCost=[1,1,1,1,1.41,1.41,1.41,1.41];

    let iters=0;const maxIters=maxR*maxR*4;// safety limit

    while(open.length>0&&iters++<maxIters){
      // Find lowest f in open
      let bi=0;
      for(let i=1;i<open.length;i++){if(open[i].f<open[bi].f)bi=i}
      const cur=open[bi];
      open[bi]=open[open.length-1];open.pop();

      const ck=key(cur.x,cur.y);
      if(closed.has(ck))continue;
      closed.add(ck);

      if(cur.x===ex&&cur.y===ey){
        // Reconstruct path
        const path=[];
        let k=key(ex,ey);
        while(k!==key(sx,sy)){
          const px=k%MAP_W,py=Math.floor(k/MAP_W);
          path.push({x:px*TILE+TILE/2,y:py*TILE+TILE/2});
          k=parent.get(k);
          if(k===undefined)break;
        }
        path.reverse();
        return path;
      }

      for(let d=0;d<8;d++){
        const nx=cur.x+dirs[d][0],ny=cur.y+dirs[d][1];
        if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H)continue;
        if(!this.isWalkable(nx,ny))continue;
        const nk=key(nx,ny);
        if(closed.has(nk))continue;
        // For diagonal, check that both cardinal neighbors are walkable (no corner cutting)
        if(d>=4){
          if(!this.isWalkable(cur.x+dirs[d][0],cur.y)||!this.isWalkable(cur.x,cur.y+dirs[d][1]))continue;
        }
        if(Math.abs(nx-sx)>maxR||Math.abs(ny-sy)>maxR)continue;

        const ng=cur.g+dirCost[d];
        const prev=gMap.get(nk);
        if(prev!==undefined&&ng>=prev)continue;
        gMap.set(nk,ng);
        parent.set(nk,ck);
        open.push({x:nx,y:ny,g:ng,f:ng+h(nx,ny)});
      }
    }
    return null;// No path found
  },

  // Find a random walkable tile within range of a world position
  findRandomWalkable(wx,wy,minR,maxR){
    const cx=Math.floor(wx/TILE),cy=Math.floor(wy/TILE);
    for(let att=0;att<20;att++){
      const a=Math.random()*Math.PI*2;
      const r=minR+Math.random()*(maxR-minR);
      const tx=Math.round(cx+Math.cos(a)*r);
      const ty=Math.round(cy+Math.sin(a)*r);
      if(tx>=1&&tx<MAP_W-1&&ty>=1&&ty<MAP_H-1&&this.isWalkable(tx,ty)){
        return{x:tx*TILE+TILE/2,y:ty*TILE+TILE/2};
      }
    }
    // Fallback: find any walkable nearby
    for(let r=1;r<=maxR;r++){
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
        if(Math.abs(dx)!==r&&Math.abs(dy)!==r)continue;// Only check perimeter
        const tx=cx+dx,ty=cy+dy;
        if(tx>=1&&tx<MAP_W-1&&ty>=1&&ty<MAP_H-1&&this.isWalkable(tx,ty)){
          return{x:tx*TILE+TILE/2,y:ty*TILE+TILE/2};
        }
      }
    }
    return null;
  }
};

const camera = {
  x:0, y:0,
  update(target){
    if(!target)return;
    this.x=target.x-canvas.width/2;this.y=target.y-canvas.height/2;
    this.x=Math.max(0,Math.min(this.x,MAP_W*TILE-canvas.width));
    this.y=Math.max(0,Math.min(this.y,MAP_H*TILE-canvas.height));
  },
  worldToScreen(wx,wy){return{x:wx-this.x,y:wy-this.y}},
  screenToWorld(sx,sy){return{x:sx+this.x,y:sy+this.y}}
};

// --- Shared path-following movement ---
// Moves entity along a path, returns true if reached end.
// entity needs: x, y, spd, dir, state, _path, _pathIdx
function followPath(ent,dt){
  if(!ent._path||ent._pathIdx>=ent._path.length)return true;
  const target=ent._path[ent._pathIdx];
  const dx=target.x-ent.x,dy=target.y-ent.y;
  const dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<6){ent._pathIdx++;return ent._pathIdx>=ent._path.length}
  const s=ent.spd*TILE*dt;
  const nx=ent.x+(dx/dist)*s,ny=ent.y+(dy/dist)*s;
  // Try full move
  if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){ent.x=nx;ent.y=ny}
  // Wall slide: try X only
  else if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ent.y/TILE))){ent.x=nx}
  // Wall slide: try Y only
  else if(map.isWalkable(Math.floor(ent.x/TILE),Math.floor(ny/TILE))){ent.y=ny}
  // Set facing direction
  if(Math.abs(dx)>Math.abs(dy))ent.dir=dx>0?'right':'left';
  else ent.dir=dy>0?'down':'up';
  return false;
}

// Assign a path to an entity. Returns true if path was found.
function assignPath(ent,wx,wy,maxR){
  const path=map.findPath(ent.x,ent.y,wx,wy,maxR||20);
  if(path&&path.length>0){ent._path=path;ent._pathIdx=0;return true}
  ent._path=null;ent._pathIdx=0;return false;
}

// Direct move toward a point with wall sliding (no pathfinding fallback)
function moveTowardDirect(ent,tx,ty,dt){
  const dx=tx-ent.x,dy=ty-ent.y,dist=Math.sqrt(dx*dx+dy*dy);
  if(dist<4)return true;
  const s=ent.spd*TILE*dt,nx=ent.x+(dx/dist)*s,ny=ent.y+(dy/dist)*s;
  if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ny/TILE))){ent.x=nx;ent.y=ny}
  else if(map.isWalkable(Math.floor(nx/TILE),Math.floor(ent.y/TILE)))ent.x=nx;
  else if(map.isWalkable(Math.floor(ent.x/TILE),Math.floor(ny/TILE)))ent.y=ny;
  if(Math.abs(dx)>Math.abs(dy))ent.dir=dx>0?'right':'left';else ent.dir=dy>0?'down':'up';
  return false;
}
