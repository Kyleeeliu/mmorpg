class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.npcs = [];
        this.chatMessages = [];
        
        // Initialize start screen
        this.initStartScreen();
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Sprite properties
        this.spriteWidth = 23;
        this.spriteHeight = 25;
        this.canvasWidth = 48;
        this.canvasHeight = 32;
        
        // Animation states
        this.animations = {
            idle: { frames: 4, row: 0 },
            walk: { frames: 4, row: 1 },
            run: { frames: 8, row: 2 },
            jump: { frames: 4, row: 3 },
            fall: { frames: 3, row: 4 },
            land: { frames: 2, row: 5 },
            death: { frames: 4, row: 6 },
            hurt: { frames: 4, row: 7 },
            attack1: { frames: 9, row: 8 },
            attack2: { frames: 10, row: 9 },
            attack3: { frames: 15, row: 10 }
        };

        // Animation timing
        this.currentFrame = 0;
        this.frameCount = 4;
        this.animationSpeed = 100;
        this.lastFrameTime = 0;
        this.attackStartTime = 0;
        
        // Combat state
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackFrame = 0;

        // Movement state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            shift: false
        };

        // Map properties (flat ground only)
        this.map = {
            width: 2000,
            height: window.innerHeight,
            platforms: [
                { x: 0, y: window.innerHeight - 100, width: 2000, height: 100, type: 'ground' }
            ]
        };

        // Camera/viewport properties
        this.camera = { x: 0, y: 0 };

        // Boss properties
        this.boss = {
            x: 1700,
            y: this.map.platforms[0].y - 128,
            width: 96,
            height: 128,
            health: 300,
            maxHealth: 300,
            state: 'idle',
            stage: 1,
            attackTimer: 0,
            attackCooldown: 2000,
            currentPattern: null,
            patternTimer: 0,
            isDashing: false,
            dashDirection: -1,
            projectiles: []
        };
        this.bossSprite = null;

        // Fire Worm boss sprite info
        this.bossSprites = {
            idle: { src: 'assets/Tiny Pixel Japan Male Character Pack/Fire Worm/Sprites/Worm/Idle.png', frames: 9, width: 51, height: 41 },
            walk: { src: 'assets/Tiny Pixel Japan Male Character Pack/Fire Worm/Sprites/Worm/Walk.png', frames: 9, width: 51, height: 41 },
            attack: { src: 'assets/Tiny Pixel Japan Male Character Pack/Fire Worm/Sprites/Worm/Attack.png', frames: 16, width: 51, height: 41 },
            hit: { src: 'assets/Tiny Pixel Japan Male Character Pack/Fire Worm/Sprites/Worm/Get Hit.png', frames: 3, width: 51, height: 41 },
            death: { src: 'assets/Tiny Pixel Japan Male Character Pack/Fire Worm/Sprites/Worm/Death.png', frames: 8, width: 51, height: 41 }
        };
        this.bossStateMap = {
            idle: 'idle',
            projectile: 'attack',
            dash: 'walk',
            hit: 'hit',
            death: 'death'
        };
        this.bossFrame = 0;
        this.bossFrameTime = 0;
        this.bossFrameSpeed = 100;
        this.loadedBossSprites = {};
        // Fire Ball sprite
        this.fireBallSprite = new Image();
        this.fireBallSprite.src = 'assets/Tiny Pixel Japan Male Character Pack/Fire Worm/Sprites/Fire Ball/Move.png';
        this.fireBallFrames = 4; // Assume 4 frames horizontally
        this.fireBallWidth = 19;
        this.fireBallHeight = 11;
    }
    
    initStartScreen() {
        const startScreen = document.getElementById('startScreen');
        const gameContainer = document.getElementById('gameContainer');
        const startButton = document.getElementById('startButton');
        
        startButton.addEventListener('click', () => {
            startScreen.style.display = 'none';
            gameContainer.style.display = 'block';
            this.initGame();
        });
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    initGame() {
        // Initialize player on ground
        this.player = {
            x: 100,
            y: this.map.platforms[0].y - this.canvasHeight * 2,
            width: this.canvasWidth * 2,
            height: this.canvasHeight * 2,
            speed: 5,
            health: 100,
            maxHealth: 100,
            mana: 100,
            maxMana: 100,
            state: 'idle',
            direction: 'right',
            isMoving: false,
            velocityY: 0,
            isJumping: false,
            isFalling: false
        };
        // Remove NPCs
        this.npcs = [];
        
        // Initialize chat system
        this.initChat();
        
        // Initialize controls
        this.initControls();
        
        // Load game assets
        this.loadAssets();
        
        // Start game loop
        this.lastTime = 0;
        this.gameLoop(0);
    }
    
    initChat() {
        const chatInput = document.querySelector('.chat-input');
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                const message = chatInput.value.trim();
                this.addChatMessage('Player', message);
                chatInput.value = '';
            }
        });
    }
    
    addChatMessage(sender, message) {
        const chatMessages = document.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    initControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                if (key !== 'shift') {
                    this.player.isMoving = true;
                }
            }
            
            if (e.code === 'Space' && !this.player.isJumping && !this.player.isFalling) {
                this.player.velocityY = -15;
                this.player.isJumping = true;
                this.player.state = 'jump';
            }

            if (key === 'q' && !this.isAttacking) {
                this.startAttack('attack3');
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
                if (key !== 'shift') {
                    // Only set isMoving to false if no movement keys are pressed
                    this.player.isMoving = Object.entries(this.keys)
                        .filter(([k, _]) => k !== 'shift')
                        .some(([_, pressed]) => pressed);
                }
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.isAttacking) {
                if (e.button === 0) { // Left click
                    this.startAttack('attack1');
                } else if (e.button === 2) { // Right click
                    this.startAttack('attack2');
                }
            }
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startAttack(attackType) {
        this.isAttacking = true;
        this.currentAttack = attackType;
        this.attackFrame = 0;
        this.player.state = attackType;
        this.attackStartTime = performance.now();

        // Set timeout based on attack duration
        const duration = this.animations[attackType].frames * this.animationSpeed;
        setTimeout(() => {
            if (this.currentAttack === attackType) {
                this.isAttacking = false;
                this.currentAttack = null;
                this.player.state = 'idle';
                this.currentFrame = 0;
            }
        }, duration);
    }
    
    loadAssets() {
        // Load player sprite
        this.playerSprite = new Image();
        this.playerSprite.src = 'assets/Tiny Pixel Japan Male Character Pack/Samurai.png';
        
        // Load NPC sprites
        this.npcSprites = {};
        ['villager', 'lord', 'ronin'].forEach(type => {
            this.npcSprites[type] = new Image();
            this.npcSprites[type].src = `assets/Tiny Pixel Japan Male Character Pack/NPC_${type.charAt(0).toUpperCase() + type.slice(1)}.png`;
        });

        // Load Fire Worm boss sprites
        for (const key in this.bossSprites) {
            this.loadedBossSprites[key] = new Image();
            this.loadedBossSprites[key].src = this.bossSprites[key].src;
        }
        // Fire Ball sprite already loaded in constructor
    }
    
    updateCamera() {
        // Center camera on player
        const targetX = this.player.x - this.canvas.width / 2;
        
        // Clamp camera to map bounds
        this.camera.x = Math.max(0, Math.min(targetX, this.map.width - this.canvas.width));
    }

    updatePlayerPosition() {
        const previousY = this.player.y;
        if (!this.isAttacking) {
            if (this.keys.a) {
                this.player.x -= this.player.speed;
                this.player.direction = 'left';
            }
            if (this.keys.d) {
                this.player.x += this.player.speed;
                this.player.direction = 'right';
            }
        }
        // Apply gravity
        this.player.velocityY += 0.8;
        this.player.y += this.player.velocityY;
        // Only ground collision
        const ground = this.map.platforms[0];
        if (this.player.y + this.player.height > ground.y) {
            this.player.y = ground.y - this.player.height;
            this.player.velocityY = 0;
            if (this.player.isJumping) {
                this.player.state = 'land';
                setTimeout(() => {
                    this.player.state = 'idle';
                }, 200);
            }
            this.player.isJumping = false;
            this.player.isFalling = false;
        } else if (!this.player.isJumping) {
            this.player.isFalling = true;
            this.player.state = 'fall';
        }
        // Update player state
        if (!this.isAttacking) {
            if (this.player.isJumping || this.player.isFalling) {
                this.player.state = this.player.velocityY > 0 ? 'fall' : 'jump';
            } else if (this.player.isMoving) {
                this.player.state = this.keys.shift ? 'run' : 'walk';
            } else {
                this.player.state = 'idle';
            }
        }
        // Keep player within map bounds
        this.player.x = Math.max(0, Math.min(this.map.width - this.player.width, this.player.x));
    }
    
    update(timestamp) {
        this.updatePlayerPosition();
        this.updateCamera();
        this.updateUI();
        this.updateBoss(timestamp);
        
        // Update animation frame
        if (timestamp - this.lastFrameTime > this.animationSpeed) {
            const animation = this.animations[this.player.state];
            
            if (this.isAttacking) {
                // Calculate attack progress
                const attackDuration = this.animations[this.currentAttack].frames * this.animationSpeed;
                const elapsedTime = timestamp - this.attackStartTime;
                
                if (elapsedTime < attackDuration) {
                    this.currentFrame = Math.floor((elapsedTime / attackDuration) * this.animations[this.currentAttack].frames);
                } else {
                    this.currentFrame = 0;
                }
            } else {
                this.currentFrame = (this.currentFrame + 1) % animation.frames;
            }
            
            this.lastFrameTime = timestamp;
        }
    }
    
    updateUI() {
        // Update health bar
        const healthFill = document.querySelector('.health-fill');
        const healthPercentage = (this.player.health / this.player.maxHealth) * 100;
        healthFill.style.width = `${healthPercentage}%`;
        
        // Update mana bar
        const manaFill = document.querySelector('.mana-fill');
        const manaPercentage = (this.player.mana / this.player.maxMana) * 100;
        manaFill.style.width = `${manaPercentage}%`;
    }
    
    updateBoss(timestamp) {
        // Stage transition
        if (this.boss.health < this.boss.maxHealth / 2 && this.boss.stage === 1) {
            this.boss.stage = 2;
            this.boss.attackCooldown = 1200;
        }
        // Attack pattern switching
        if (timestamp - this.boss.attackTimer > this.boss.attackCooldown) {
            this.boss.attackTimer = timestamp;
            // Randomly pick an attack pattern
            if (this.boss.stage === 1) {
                this.boss.currentPattern = Math.random() < 0.5 ? 'projectile' : 'dash';
            } else {
                this.boss.currentPattern = Math.random() < 0.7 ? 'projectile' : 'dash';
            }
            this.boss.patternTimer = 0;
            if (this.boss.currentPattern === 'dash') {
                this.boss.isDashing = true;
                this.boss.dashDirection = this.player.x < this.boss.x ? -1 : 1;
            }
        }
        // Execute attack pattern
        if (this.boss.currentPattern === 'projectile') {
            if (this.boss.patternTimer === 0) {
                // Fire a projectile toward the player
                const dx = this.player.x + this.player.width / 2 - (this.boss.x + this.boss.width / 2);
                const dy = this.player.y + this.player.height / 2 - (this.boss.y + this.boss.height / 2);
                const mag = Math.sqrt(dx * dx + dy * dy);
                const speed = this.boss.stage === 1 ? 6 : 10;
                this.boss.projectiles.push({
                    x: this.boss.x + this.boss.width / 2,
                    y: this.boss.y + this.boss.height / 2,
                    vx: (dx / mag) * speed,
                    vy: (dy / mag) * speed,
                    radius: 16
                });
            }
            this.boss.patternTimer++;
            if (this.boss.patternTimer > 30) {
                this.boss.currentPattern = null;
            }
        } else if (this.boss.currentPattern === 'dash' && this.boss.isDashing) {
            // Dash horizontally
            this.boss.x += this.boss.dashDirection * (this.boss.stage === 1 ? 12 : 20);
            // Stop dash at map edge or after a distance
            if (this.boss.x < 1200) {
                this.boss.x = 1200;
                this.boss.isDashing = false;
                this.boss.currentPattern = null;
            } else if (this.boss.x > this.map.width - this.boss.width) {
                this.boss.x = this.map.width - this.boss.width;
                this.boss.isDashing = false;
                this.boss.currentPattern = null;
            }
        }
        // Update projectiles
        this.boss.projectiles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
        });
        // Remove projectiles out of bounds
        this.boss.projectiles = this.boss.projectiles.filter(p => p.x > 0 && p.x < this.map.width && p.y > 0 && p.y < this.map.height);
        // Player-boss collision
        this.checkBossCollisions();

        // Animate boss
        if (timestamp - this.bossFrameTime > this.bossFrameSpeed) {
            const state = this.bossStateMap[this.boss.currentPattern] || this.boss.state || 'idle';
            const spriteInfo = this.bossSprites[state];
            this.bossFrame = (this.bossFrame + 1) % spriteInfo.frames;
            this.bossFrameTime = timestamp;
        }
    }

    checkBossCollisions() {
        // Player attack hits boss
        if (this.isAttacking && this.currentAttack && this.player.state.startsWith('attack')) {
            // Simple hitbox in front of player
            let hitX = this.player.x + (this.player.direction === 'right' ? this.player.width : -40);
            let hitY = this.player.y + this.player.height / 2 - 20;
            let hitW = 40;
            let hitH = 40;
            if (
                hitX < this.boss.x + this.boss.width &&
                hitX + hitW > this.boss.x &&
                hitY < this.boss.y + this.boss.height &&
                hitY + hitH > this.boss.y
            ) {
                this.boss.health -= this.currentAttack === 'attack3' ? 10 : 5;
                // Prevent multiple hits per attack
                this.isAttacking = false;
            }
        }
        // Boss projectiles hit player
        for (const p of this.boss.projectiles) {
            if (
                p.x + p.radius > this.player.x &&
                p.x - p.radius < this.player.x + this.player.width &&
                p.y + p.radius > this.player.y &&
                p.y - p.radius < this.player.y + this.player.height
            ) {
                this.player.health -= 10;
                p.x = -9999; // Remove projectile
            }
        }
        // Boss dash hits player
        if (this.boss.isDashing) {
            if (
                this.boss.x < this.player.x + this.player.width &&
                this.boss.x + this.boss.width > this.player.x &&
                this.boss.y < this.player.y + this.player.height &&
                this.boss.y + this.boss.height > this.player.y
            ) {
                this.player.health -= 20;
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#2c1810';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw map ground only
        const ground = this.map.platforms[0];
        this.ctx.fillStyle = '#4A3B2B';
        this.ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
        
        // Draw player with camera offset
        if (this.playerSprite && this.playerSprite.complete) {
            const animation = this.animations[this.player.state];
            const maxFrame = animation.frames - 1;
            const frameToRender = Math.min(this.currentFrame, maxFrame);
            
            this.ctx.save();
            if (this.player.direction === 'left') {
                this.ctx.scale(-1, 1);
                this.ctx.translate(-this.player.x - this.player.width, 0);
            }
            this.ctx.drawImage(
                this.playerSprite,
                frameToRender * this.canvasWidth,
                animation.row * this.canvasHeight,
                this.canvasWidth, this.canvasHeight,
                this.player.direction === 'left' ? 0 : this.player.x,
                this.player.y,
                this.player.width, this.player.height
            );
            this.ctx.restore();
        }

        // Draw boss health bar
        this.renderBossHealthBar();

        // Draw boss (Fire Worm sprite)
        if (this.boss.health > 0) {
            // Determine boss state for sprite
            const state = this.bossStateMap[this.boss.currentPattern] || this.boss.state || 'idle';
            const spriteInfo = this.bossSprites[state];
            const sprite = this.loadedBossSprites[state];
            if (sprite && sprite.complete) {
                this.ctx.drawImage(
                    sprite,
                    this.bossFrame * spriteInfo.width, 0,
                    spriteInfo.width, spriteInfo.height,
                    this.boss.x, this.boss.y,
                    this.boss.width, this.boss.height
                );
            } else {
                // fallback: rectangle
                this.ctx.fillStyle = this.boss.stage === 1 ? '#BC002D' : '#C7A353';
                this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
            }
            // Draw projectiles (Fire Ball)
            for (const p of this.boss.projectiles) {
                if (this.fireBallSprite && this.fireBallSprite.complete) {
                    // Animate fireball
                    const frame = Math.floor((performance.now() / 100) % this.fireBallFrames);
                    this.ctx.drawImage(
                        this.fireBallSprite,
                        frame * this.fireBallWidth, 0,
                        this.fireBallWidth, this.fireBallHeight,
                        p.x - this.fireBallWidth / 2, p.y - this.fireBallHeight / 2,
                        this.fireBallWidth * 2, this.fireBallHeight * 2
                    );
                } else {
                    // fallback: circle
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
                    this.ctx.fillStyle = this.boss.stage === 1 ? '#BC002D' : '#C7A353';
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.stroke();
                }
            }
        }

        // Restore context
        this.ctx.restore();
    }
    
    renderBossHealthBar() {
        if (this.boss.health > 0) {
            const barWidth = 400;
            const barHeight = 24;
            const x = (this.canvas.width - barWidth) / 2;
            const y = 30;
            this.ctx.save();
            this.ctx.globalAlpha = 0.95;
            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(x, y, barWidth, barHeight);
            this.ctx.fillStyle = this.boss.stage === 1 ? '#BC002D' : '#C7A353';
            this.ctx.fillRect(x, y, (this.boss.health / this.boss.maxHealth) * barWidth, barHeight);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, barWidth, barHeight);
            this.ctx.font = 'bold 18px Cinzel, serif';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BOSS', x + barWidth / 2, y + barHeight - 6);
            this.ctx.restore();
        }
    }
    
    gameLoop(timestamp) {
        this.update(timestamp);
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 