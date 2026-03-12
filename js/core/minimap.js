/* ============================================
   Fantasy Idle MMORPG - Minimap Battle Renderer
   Top-down 2D canvas minimap with A* pathfinding
   ============================================ */

class MinimapRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.w = 0;
        this.h = 0;
        this.time = 0;

        // Grid config
        this.gridCols = 18;
        this.gridRows = 9;
        this.grid = []; // 0 = walkable, 1 = obstacle
        this.cellW = 0;
        this.cellH = 0;

        // Entity grid positions (col, row)
        this.player = {
            col: 1, row: 4, // start left side
            targetCol: 1, targetRow: 4,
            pixelX: 0, pixelY: 0,
            emoji: '🧙', label: 'Hero',
            path: [],
            moveSpeed: 5, // cells per second
            moving: false,
        };
        this.enemy = {
            col: 16, row: 4, // start right side
            targetCol: 16, targetRow: 4,
            pixelX: 0, pixelY: 0,
            emoji: '🐺', label: 'Wolf',
            path: [],
            moveSpeed: 4,
            moving: false,
        };

        // Battle state
        this.battlePhase = 'idle'; // 'idle', 'approaching', 'combat'
        this.combatRange = 1.5; // cells distance to start combat
        this.onReachedEnemy = null; // callback when in range

        // Animation state
        this.playerAttacking = false;
        this.enemyAttacking = false;
        this.playerHit = false;
        this.enemyHit = false;
        this.attackAnimTime = 0;
        this.enemyAttackAnimTime = 0;

        // Visual effects queue
        this.effects = [];

        // Terrain
        this.terrainObjects = [];
        this.zoneId = '';

        // HP ratios for overhead bars
        this.playerHpRatio = 1;
        this.enemyHpRatio = 1;

        this._raf = null;
        this._lastTime = 0;
    }

    init() {
        this.canvas = document.getElementById('minimap-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.generateTerrain();
        this.buildGrid();
        this.snapToGrid(this.player);
        this.snapToGrid(this.enemy);
        this._lastTime = performance.now();
        this._loop();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(rect.width * dpr);
        this.canvas.height = Math.floor(rect.height * dpr);
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.drawW = rect.width;
        this.drawH = rect.height;
        this.cellW = this.drawW / this.gridCols;
        this.cellH = this.drawH / this.gridRows;
        // Recalc pixel positions
        this.snapToGrid(this.player);
        this.snapToGrid(this.enemy);
    }

    snapToGrid(entity) {
        entity.pixelX = (entity.col + 0.5) * this.cellW;
        entity.pixelY = (entity.row + 0.5) * this.cellH;
    }

    _loop() {
        const now = performance.now();
        const dt = (now - this._lastTime) / 1000;
        this._lastTime = now;
        this.time += dt;

        this.update(dt);
        this.render();

        this._raf = requestAnimationFrame(() => this._loop());
    }

    // ========================
    // Grid & A* Pathfinding
    // ========================
    buildGrid() {
        this.grid = [];
        for (let r = 0; r < this.gridRows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.gridCols; c++) {
                this.grid[r][c] = 0; // walkable
            }
        }
        // Place obstacles from terrain
        this.placeObstacles();
    }

    placeObstacles() {
        const rng = this.seededRandom(this.zoneId + '_obs');
        const count = 3 + Math.floor(rng() * 5);
        for (let i = 0; i < count; i++) {
            const c = 3 + Math.floor(rng() * (this.gridCols - 6));
            const r = Math.floor(rng() * this.gridRows);
            // Don't block spawn columns
            if (c <= 2 || c >= this.gridCols - 3) continue;
            this.grid[r][c] = 1;
        }
    }

    isWalkable(col, row) {
        if (col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) return false;
        return this.grid[row][col] === 0;
    }

    // A* Search
    findPath(startCol, startRow, endCol, endRow) {
        const open = [];
        const closed = new Set();

        const heuristic = (c, r) => Math.abs(c - endCol) + Math.abs(r - endRow);

        const startNode = { col: startCol, row: startRow, g: 0, h: heuristic(startCol, startRow), parent: null };
        startNode.f = startNode.g + startNode.h;
        open.push(startNode);

        const key = (c, r) => r * this.gridCols + c;

        const directions = [
            { dc: 0, dr: -1 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 },
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 1 }, { dc: 1, dr: 1 },
        ];

        while (open.length > 0) {
            // Find lowest f
            open.sort((a, b) => a.f - b.f);
            const current = open.shift();

            if (current.col === endCol && current.row === endRow) {
                // Reconstruct path
                const path = [];
                let node = current;
                while (node.parent) {
                    path.unshift({ col: node.col, row: node.row });
                    node = node.parent;
                }
                return path;
            }

            closed.add(key(current.col, current.row));

            for (const dir of directions) {
                const nc = current.col + dir.dc;
                const nr = current.row + dir.dr;

                if (!this.isWalkable(nc, nr)) continue;
                if (closed.has(key(nc, nr))) continue;

                // Diagonal: check corners aren't blocked
                if (dir.dc !== 0 && dir.dr !== 0) {
                    if (!this.isWalkable(current.col + dir.dc, current.row) ||
                        !this.isWalkable(current.col, current.row + dir.dr)) continue;
                }

                const g = current.g + (dir.dc !== 0 && dir.dr !== 0 ? 1.414 : 1);
                const existing = open.find(n => n.col === nc && n.row === nr);
                if (existing) {
                    if (g < existing.g) {
                        existing.g = g;
                        existing.f = g + existing.h;
                        existing.parent = current;
                    }
                } else {
                    const h = heuristic(nc, nr);
                    open.push({ col: nc, row: nr, g, h, f: g + h, parent: current });
                }
            }
        }

        return []; // no path
    }

    // Find nearest walkable cell adjacent to target
    findApproachTarget(fromCol, fromRow, toCol, toRow) {
        const directions = [
            { dc: -1, dr: 0 }, { dc: 1, dr: 0 }, { dc: 0, dr: -1 }, { dc: 0, dr: 1 },
            { dc: -1, dr: -1 }, { dc: 1, dr: -1 }, { dc: -1, dr: 1 }, { dc: 1, dr: 1 },
        ];
        let best = null;
        let bestDist = Infinity;
        for (const d of directions) {
            const nc = toCol + d.dc;
            const nr = toRow + d.dr;
            if (this.isWalkable(nc, nr)) {
                const dist = Math.abs(nc - fromCol) + Math.abs(nr - fromRow);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = { col: nc, row: nr };
                }
            }
        }
        return best || { col: toCol, row: toRow };
    }

    // ========================
    // Terrain Generation
    // ========================
    generateTerrain(zoneId) {
        this.zoneId = zoneId || '';
        this.terrainObjects = [];
        const rng = this.seededRandom(this.zoneId);

        const terrainTypes = this.getTerrainForZone(zoneId);
        const count = 12 + Math.floor(rng() * 8);

        for (let i = 0; i < count; i++) {
            this.terrainObjects.push({
                x: rng(),
                y: rng(),
                emoji: terrainTypes[Math.floor(rng() * terrainTypes.length)],
                size: 8 + rng() * 10,
                alpha: 0.25 + rng() * 0.25,
            });
        }
    }

    getTerrainForZone(zoneId) {
        const terrainMap = {
            greenwood: ['🌲', '🌳', '🌿', '🍃', '🌾', '🪨'],
            dark_cave: ['🪨', '🕸️', '💀', '🦴', '🕯️', '🪨'],
            ancient_ruins: ['🏛️', '🪨', '⚱️', '🕯️', '💀', '🗿'],
            dragon_peak: ['🏔️', '🪨', '🔥', '💎', '🌋', '⛰️'],
            demon_realm: ['🌋', '💀', '🔥', '⛓️', '🩸', '👁️'],
        };
        return terrainMap[zoneId] || terrainMap.greenwood;
    }

    seededRandom(seed) {
        let h = 0;
        const str = seed || 'default';
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        }
        return function () {
            h = (h * 1103515245 + 12345) & 0x7fffffff;
            return (h % 10000) / 10000;
        };
    }

    getZoneBgColors(zoneId) {
        const colors = {
            greenwood: { bg: '#0d1a0d', grid: 'rgba(34, 85, 34, 0.15)', glow: 'rgba(46, 204, 113, 0.03)' },
            dark_cave: { bg: '#0a0a12', grid: 'rgba(60, 60, 80, 0.15)', glow: 'rgba(100, 50, 150, 0.03)' },
            ancient_ruins: { bg: '#12100d', grid: 'rgba(80, 70, 50, 0.15)', glow: 'rgba(200, 180, 100, 0.03)' },
            dragon_peak: { bg: '#1a0d0d', grid: 'rgba(120, 40, 20, 0.15)', glow: 'rgba(255, 100, 50, 0.03)' },
            demon_realm: { bg: '#1a0508', grid: 'rgba(120, 20, 40, 0.15)', glow: 'rgba(255, 0, 50, 0.04)' },
        };
        return colors[zoneId] || colors.greenwood;
    }

    // ========================
    // Movement & Update
    // ========================
    getDistanceBetween(e1, e2) {
        const dx = e1.pixelX - e2.pixelX;
        const dy = e1.pixelY - e2.pixelY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getGridDistance(e1, e2) {
        const dc = e1.col - e2.col;
        const dr = e1.row - e2.row;
        return Math.sqrt(dc * dc + dr * dr);
    }

    moveEntityAlongPath(entity, dt) {
        if (entity.path.length === 0) {
            entity.moving = false;
            return;
        }

        entity.moving = true;
        const target = entity.path[0];
        const targetX = (target.col + 0.5) * this.cellW;
        const targetY = (target.row + 0.5) * this.cellH;

        const dx = targetX - entity.pixelX;
        const dy = targetY - entity.pixelY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const speed = entity.moveSpeed * this.cellW * dt; // pixels per frame

        if (dist <= speed) {
            entity.pixelX = targetX;
            entity.pixelY = targetY;
            entity.col = target.col;
            entity.row = target.row;
            entity.path.shift();
        } else {
            entity.pixelX += (dx / dist) * speed;
            entity.pixelY += (dy / dist) * speed;
        }
    }

    update(dt) {
        // Move player along path
        if (this.player.path.length > 0) {
            this.moveEntityAlongPath(this.player, dt);
        } else {
            // Idle bobbing when not moving
            const baseX = (this.player.col + 0.5) * this.cellW;
            const baseY = (this.player.row + 0.5) * this.cellH;
            this.player.pixelX = baseX + Math.sin(this.time * 1.2) * 2;
            this.player.pixelY = baseY + Math.cos(this.time * 1.5) * 3;
            this.player.moving = false;
        }

        // Move enemy along path
        if (this.enemy.path.length > 0) {
            this.moveEntityAlongPath(this.enemy, dt);
        } else {
            const baseX = (this.enemy.col + 0.5) * this.cellW;
            const baseY = (this.enemy.row + 0.5) * this.cellH;
            this.enemy.pixelX = baseX + Math.sin(this.time * 1.0 + 2) * 2;
            this.enemy.pixelY = baseY + Math.cos(this.time * 1.3 + 1) * 3;
            this.enemy.moving = false;
        }

        // Check if approaching phase and in range
        if (this.battlePhase === 'approaching') {
            const gridDist = this.getGridDistance(this.player, this.enemy);
            const pathDone = this.player.path.length === 0 && !this.player.moving;
            if ((gridDist <= this.combatRange && pathDone) || pathDone) {
                this.battlePhase = 'combat';
                if (this.onReachedEnemy) this.onReachedEnemy();
            }
        }

        // Player attack animation
        if (this.playerAttacking) {
            this.attackAnimTime += dt;
            const t = this.attackAnimTime / 0.3;
            if (t >= 1) {
                this.playerAttacking = false;
                this.attackAnimTime = 0;
            }
        }

        // Enemy attack animation
        if (this.enemyAttacking) {
            this.enemyAttackAnimTime += dt;
            const t = this.enemyAttackAnimTime / 0.3;
            if (t >= 1) {
                this.enemyAttacking = false;
                this.enemyAttackAnimTime = 0;
            }
        }

        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const fx = this.effects[i];
            fx.age += dt;
            if (fx.age >= fx.duration) {
                this.effects.splice(i, 1);
            }
        }
    }

    // ========================
    // Render
    // ========================
    render() {
        const ctx = this.ctx;
        const w = this.drawW;
        const h = this.drawH;

        // Background
        const zoneBg = this.getZoneBgColors(this.zoneId);
        ctx.fillStyle = zoneBg.bg;
        ctx.fillRect(0, 0, w, h);

        // Grid
        this.drawGrid(ctx, w, h, zoneBg.grid);

        // Obstacles
        this.drawObstacles(ctx);

        // Terrain objects
        this.drawTerrain(ctx, w, h);

        // A* path preview
        this.drawPath(ctx, this.player, 'rgba(52, 152, 219, 0.2)');
        this.drawPath(ctx, this.enemy, 'rgba(231, 76, 60, 0.15)');

        // Ground shadows
        this.drawShadow(ctx, this.player.pixelX, this.player.pixelY + 18);
        this.drawShadow(ctx, this.enemy.pixelX, this.enemy.pixelY + 18);

        // Effects under entities
        this.drawEffects(ctx, w, h, 'under');

        // Entities
        this.drawEntity(ctx, this.player, 'player');
        this.drawEntity(ctx, this.enemy, 'enemy');

        // Effects over entities
        this.drawEffects(ctx, w, h, 'over');

        // HP bars overhead
        this.drawHpBar(ctx, this.player.pixelX, this.player.pixelY - 26, this.playerHpRatio, '#3498db');
        this.drawHpBar(ctx, this.enemy.pixelX, this.enemy.pixelY - 26, this.enemyHpRatio, '#e74c3c');

        // Position labels
        this.drawPositionLabel(ctx, this.player, '#5dade2');
        this.drawPositionLabel(ctx, this.enemy, '#e74c3c');

        // Battle phase indicator
        this.drawPhaseIndicator(ctx, w, h);
    }

    drawGrid(ctx, w, h, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= this.gridCols; c++) {
            const x = c * this.cellW;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let r = 0; r <= this.gridRows; r++) {
            const y = r * this.cellH;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    drawObstacles(ctx) {
        for (let r = 0; r < this.gridRows; r++) {
            for (let c = 0; c < this.gridCols; c++) {
                if (this.grid[r][c] === 1) {
                    const x = c * this.cellW;
                    const y = r * this.cellH;
                    ctx.fillStyle = 'rgba(80, 40, 20, 0.4)';
                    ctx.fillRect(x + 1, y + 1, this.cellW - 2, this.cellH - 2);
                    ctx.font = `${Math.min(this.cellW, this.cellH) * 0.6}px serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🪨', x + this.cellW / 2, y + this.cellH / 2);
                }
            }
        }
    }

    drawPath(ctx, entity, color) {
        if (entity.path.length === 0) return;

        ctx.fillStyle = color;
        for (const step of entity.path) {
            const x = step.col * this.cellW;
            const y = step.row * this.cellH;
            ctx.fillRect(x + 2, y + 2, this.cellW - 4, this.cellH - 4);
        }

        // Footstep dots
        ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.5)');
        for (let i = 0; i < entity.path.length; i++) {
            const step = entity.path[i];
            const cx = (step.col + 0.5) * this.cellW;
            const cy = (step.row + 0.5) * this.cellH;
            ctx.beginPath();
            ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawTerrain(ctx, w, h) {
        for (const obj of this.terrainObjects) {
            ctx.globalAlpha = obj.alpha;
            ctx.font = `${obj.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.emoji, obj.x * w, obj.y * h);
        }
        ctx.globalAlpha = 1;
    }

    drawShadow(ctx, cx, cy) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 16, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();
    }

    drawEntity(ctx, entity, type) {
        let cx = entity.pixelX;
        let cy = entity.pixelY;
        const isHit = (type === 'player' && this.playerHit) || (type === 'enemy' && this.enemyHit);

        // Attack lunge animation
        if (type === 'player' && this.playerAttacking) {
            const t = this.attackAnimTime / 0.3;
            const lunge = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
            const dx = this.enemy.pixelX - this.player.pixelX;
            const dy = this.enemy.pixelY - this.player.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                cx += (dx / dist) * lunge * 15;
                cy += (dy / dist) * lunge * 15;
            }
        }
        if (type === 'enemy' && this.enemyAttacking) {
            const t = this.enemyAttackAnimTime / 0.3;
            const lunge = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
            const dx = this.player.pixelX - this.enemy.pixelX;
            const dy = this.player.pixelY - this.enemy.pixelY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                cx += (dx / dist) * lunge * 15;
                cy += (dy / dist) * lunge * 15;
            }
        }

        // Direction indicator circle
        const color = type === 'player' ? 'rgba(52, 152, 219, 0.3)' : 'rgba(231, 76, 60, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, 15, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Moving indicator ring
        if (entity.moving) {
            ctx.beginPath();
            ctx.arc(cx, cy, 18 + Math.sin(this.time * 6) * 2, 0, Math.PI * 2);
            ctx.strokeStyle = type === 'player' ? 'rgba(52, 152, 219, 0.5)' : 'rgba(231, 76, 60, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Range ring
            const ringColor = type === 'player' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(231, 76, 60, 0.15)';
            ctx.beginPath();
            ctx.arc(cx, cy, 22 + Math.sin(this.time * 2) * 2, 0, Math.PI * 2);
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Hit flash
        if (isHit) {
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        }

        // Emoji character
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.emoji, cx, cy);

        // Name label
        ctx.font = '600 8px Sarabun, sans-serif';
        ctx.fillStyle = type === 'player' ? '#5dade2' : '#e74c3c';
        ctx.textAlign = 'center';
        ctx.fillText(entity.label, cx, cy - 28);
    }

    drawPositionLabel(ctx, entity, color) {
        const cx = entity.pixelX;
        const cy = entity.pixelY;
        ctx.font = '600 7px Sarabun, sans-serif';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.textAlign = 'center';
        ctx.fillText(`(${entity.col},${entity.row})`, cx, cy + 28);
        ctx.globalAlpha = 1;
    }

    drawPhaseIndicator(ctx, w, h) {
        const labels = {
            'idle': '⏸ Idle',
            'approaching': '🚶 Approaching...',
            'combat': '⚔️ Combat',
        };
        const text = labels[this.battlePhase] || '';
        ctx.font = '600 9px Sarabun, sans-serif';
        ctx.fillStyle = this.battlePhase === 'combat' ? '#e74c3c' :
                        this.battlePhase === 'approaching' ? '#f39c12' : '#7f8c8d';
        ctx.textAlign = 'right';
        ctx.fillText(text, w - 8, 14);
    }

    drawHpBar(ctx, cx, cy, ratio, color) {
        const barW = 36;
        const barH = 4;
        const x = cx - barW / 2;
        const y = cy;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, barW * Math.max(0, ratio), barH);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x - 1, y - 1, barW + 2, barH + 2);
    }

    // ========================
    // Effects System
    // ========================
    drawEffects(ctx, w, h, layer) {
        for (const fx of this.effects) {
            if (fx.layer !== layer) continue;
            const t = fx.age / fx.duration;

            switch (fx.type) {
                case 'slash':
                    this.drawSlashEffect(ctx, fx, t, w, h);
                    break;
                case 'impact':
                    this.drawImpactEffect(ctx, fx, t, w, h);
                    break;
                case 'heal':
                    this.drawHealEffect(ctx, fx, t, w, h);
                    break;
                case 'skill':
                    this.drawSkillEffect(ctx, fx, t, w, h);
                    break;
                case 'damageText':
                    this.drawDamageText(ctx, fx, t, w, h);
                    break;
                case 'deathBurst':
                    this.drawDeathBurst(ctx, fx, t, w, h);
                    break;
            }
        }
    }

    drawSlashEffect(ctx, fx, t, w, h) {
        const cx = fx.pixelX || fx.x * w;
        const cy = fx.pixelY || fx.y * h;
        const alpha = 1 - t;
        const size = 25 * (0.5 + t * 0.5);
        const angle = fx.angle || -Math.PI / 4;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = fx.color || '#fff';
        ctx.lineWidth = 3 * (1 - t);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-size, -size * 0.3);
        ctx.quadraticCurveTo(0, -size * 0.8, size, size * 0.3);
        ctx.stroke();

        ctx.fillStyle = fx.color || '#ffd700';
        for (let i = 0; i < 4; i++) {
            const sparkT = (t + i * 0.2) % 1;
            const sx = (sparkT - 0.5) * size * 2;
            const sy = Math.sin(sparkT * Math.PI) * -size * 0.5 + (Math.random() - 0.5) * 4;
            ctx.globalAlpha = alpha * (1 - sparkT);
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawImpactEffect(ctx, fx, t, w, h) {
        const cx = fx.pixelX || fx.x * w;
        const cy = fx.pixelY || fx.y * h;
        const alpha = 1 - t;
        const radius = 6 + t * 20;

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = fx.color || 'rgba(255, 200, 50, 0.8)';
        ctx.lineWidth = 2 * (1 - t);
        ctx.stroke();

        if (t < 0.3) {
            ctx.beginPath();
            ctx.arc(cx, cy, 8 * (1 - t / 0.3), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
        }
        ctx.restore();
    }

    drawHealEffect(ctx, fx, t, w, h) {
        const cx = fx.pixelX || fx.x * w;
        const cy = fx.pixelY || fx.y * h;

        ctx.save();
        ctx.globalAlpha = 1 - t;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.time * 2;
            const r = 10 + Math.sin(t * Math.PI) * 6;
            const px = cx + Math.cos(angle) * r;
            const py = cy - t * 25 + Math.sin(angle) * 4;
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(px, py, 2.5 * (1 - t), 0, Math.PI * 2);
            ctx.fill();
        }
        if (t < 0.5) {
            ctx.font = `${14 * (1 - t)}px serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('✚', cx, cy - t * 20);
        }
        ctx.restore();
    }

    drawSkillEffect(ctx, fx, t, w, h) {
        const cx = fx.pixelX || fx.x * w;
        const cy = fx.pixelY || fx.y * h;

        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.font = `${18 * (1 - t * 0.5)}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(fx.icon || '✨', cx, cy - t * 35);

        const radius = 12 + t * 25;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = fx.color || 'rgba(180, 130, 255, 0.6)';
        ctx.lineWidth = 2 * (1 - t);
        ctx.stroke();
        ctx.restore();
    }

    drawDamageText(ctx, fx, t, w, h) {
        const cx = fx.pixelX || fx.x * w;
        const cy = (fx.pixelY || fx.y * h) - t * 30;

        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.font = `bold ${fx.fontSize || 11}px Sarabun, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = fx.color || '#ffd700';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(fx.text, cx, cy);
        ctx.restore();
    }

    drawDeathBurst(ctx, fx, t, w, h) {
        const cx = fx.pixelX || fx.x * w;
        const cy = fx.pixelY || fx.y * h;

        ctx.save();
        ctx.globalAlpha = 1 - t;
        for (let i = 0; i < 3; i++) {
            const rt = Math.max(0, t - i * 0.1);
            const r = 8 + rt * 35;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, ${80 + i * 40}, ${50 + i * 30}, ${0.5 * (1 - rt)})`;
            ctx.lineWidth = 2 * (1 - rt);
            ctx.stroke();
        }
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const dist = t * 40;
            const px = cx + Math.cos(a) * dist;
            const py = cy + Math.sin(a) * dist;
            ctx.fillStyle = `rgba(255, ${100 + i * 20}, 50, ${(1 - t) * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, 3 * (1 - t), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ========================
    // Public API (called by UI)
    // ========================
    setPlayerInfo(emoji, name) {
        this.player.emoji = emoji;
        this.player.label = name;
    }

    setEnemyInfo(emoji, name) {
        this.enemy.emoji = emoji;
        this.enemy.label = name;
    }

    setPlayerHpRatio(ratio) {
        this.playerHpRatio = ratio;
    }

    setEnemyHpRatio(ratio) {
        this.enemyHpRatio = ratio;
    }

    // Start approach: player and enemy walk toward each other using A*
    startApproach() {
        this.battlePhase = 'approaching';

        // Find approach target (cell adjacent to enemy)
        const approachTarget = this.findApproachTarget(
            this.player.col, this.player.row,
            this.enemy.col, this.enemy.row
        );

        // Player path
        const playerPath = this.findPath(
            this.player.col, this.player.row,
            approachTarget.col, approachTarget.row
        );
        this.player.path = playerPath;
    }

    // Spawn enemy at random position across the entire map
    spawnEnemyPosition() {
        const rng = Math.random;
        const minCol = 1;
        const maxCol = this.gridCols - 2;
        const minRow = 1;
        const maxRow = this.gridRows - 2;

        let col, row;
        let attempts = 0;
        do {
            col = minCol + Math.floor(rng() * (maxCol - minCol + 1));
            row = minRow + Math.floor(rng() * (maxRow - minRow + 1));
            attempts++;
            // Avoid spawning too close to the player
            const dist = Math.abs(col - this.player.col) + Math.abs(row - this.player.row);
            if (dist < 3) continue;
        } while ((!this.isWalkable(col, row)) && attempts < 50);

        this.enemy.col = col;
        this.enemy.row = row;
        this.enemy.path = [];
        this.enemy.moving = false;
        this.snapToGrid(this.enemy);
        this.battlePhase = 'idle';
    }

    // Reset player to left side
    resetPlayerPosition() {
        const minCol = 1;
        const maxCol = Math.floor(this.gridCols * 0.25);
        let col = minCol + Math.floor(Math.random() * (maxCol - minCol));
        let row = Math.floor(Math.random() * this.gridRows);
        let attempts = 0;
        while (!this.isWalkable(col, row) && attempts < 30) {
            col = minCol + Math.floor(Math.random() * (maxCol - minCol));
            row = Math.floor(Math.random() * this.gridRows);
            attempts++;
        }
        this.player.col = col;
        this.player.row = row;
        this.player.path = [];
        this.player.moving = false;
        this.snapToGrid(this.player);
    }

    triggerPlayerAttack() {
        this.playerAttacking = true;
        this.attackAnimTime = 0;

        this.effects.push({
            type: 'slash',
            pixelX: this.enemy.pixelX,
            pixelY: this.enemy.pixelY,
            color: '#ffd700',
            angle: -Math.PI / 4 + (Math.random() - 0.5) * 0.5,
            age: 0,
            duration: 0.4,
            layer: 'over',
        });
        this.effects.push({
            type: 'impact',
            pixelX: this.enemy.pixelX,
            pixelY: this.enemy.pixelY,
            color: 'rgba(255, 200, 50, 0.8)',
            age: 0,
            duration: 0.35,
            layer: 'under',
        });
    }

    triggerEnemyAttack() {
        this.enemyAttacking = true;
        this.enemyAttackAnimTime = 0;

        this.effects.push({
            type: 'slash',
            pixelX: this.player.pixelX,
            pixelY: this.player.pixelY,
            color: '#e74c3c',
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
            age: 0,
            duration: 0.4,
            layer: 'over',
        });
        this.effects.push({
            type: 'impact',
            pixelX: this.player.pixelX,
            pixelY: this.player.pixelY,
            color: 'rgba(231, 76, 60, 0.8)',
            age: 0,
            duration: 0.35,
            layer: 'under',
        });
    }

    triggerEnemyHit() {
        this.enemyHit = true;
        setTimeout(() => { this.enemyHit = false; }, 200);
    }

    triggerPlayerHit() {
        this.playerHit = true;
        setTimeout(() => { this.playerHit = false; }, 200);
    }

    showDamageOnMap(value, type, target) {
        const entity = target === 'enemy' ? this.enemy : this.player;
        const colors = {
            'player-dmg': '#e74c3c',
            'enemy-dmg': '#ffd700',
            'crit': '#ff4444',
            'heal': '#2ecc71',
        };
        const isCrit = type === 'crit';
        const text = (type === 'heal' ? '+' : '-') + value;

        this.effects.push({
            type: 'damageText',
            pixelX: entity.pixelX + (Math.random() - 0.5) * 10,
            pixelY: entity.pixelY - 10,
            text: text + (isCrit ? ' CRIT!' : ''),
            color: colors[type] || '#fff',
            fontSize: isCrit ? 14 : 10,
            age: 0,
            duration: 0.9,
            layer: 'over',
        });
    }

    showHealEffect() {
        this.effects.push({
            type: 'heal',
            pixelX: this.player.pixelX,
            pixelY: this.player.pixelY,
            age: 0,
            duration: 0.8,
            layer: 'over',
        });
    }

    showSkillEffect(icon, target) {
        const entity = target === 'enemy' ? this.enemy : this.player;
        this.effects.push({
            type: 'skill',
            pixelX: entity.pixelX,
            pixelY: entity.pixelY,
            icon: icon,
            age: 0,
            duration: 0.7,
            layer: 'over',
        });
    }

    showEnemyDeath() {
        this.effects.push({
            type: 'deathBurst',
            pixelX: this.enemy.pixelX,
            pixelY: this.enemy.pixelY,
            age: 0,
            duration: 0.6,
            layer: 'over',
        });
    }

    setZone(zoneId) {
        if (this.zoneId !== zoneId) {
            this.generateTerrain(zoneId);
            this.buildGrid();
            this.resetPlayerPosition();
        }
    }

    destroy() {
        if (this._raf) cancelAnimationFrame(this._raf);
    }
}
