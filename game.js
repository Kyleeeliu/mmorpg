class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.npcs = [];
        // this.chatMessages = []; // Temporarily removed
        
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
            run: { frames: 8, row: 2 }  // Restored running animation
        };

        // Animation timing
        this.currentFrame = 0;
        this.frameCount = 4;
        this.animationSpeed = 100;
        this.lastFrameTime = 0;
        
        // Movement state
        this.keys = {
            a: false,
            d: false,
            e: false,
            shift: false  // Restored shift key for running
        };

        // Map properties
        this.map = {
            width: 2000,
            height: window.innerHeight,
            ground: { y: window.innerHeight - 100, height: 100 }
        };

        // Town buildings
        this.buildings = [
            { x: 50, y: this.map.ground.y - 200, width: 200, height: 200, type: 'house', style: 'traditional' },
            { x: 350, y: this.map.ground.y - 180, width: 180, height: 180, type: 'shop', style: 'merchant' },
            { x: 650, y: this.map.ground.y - 220, width: 220, height: 220, type: 'dojo', style: 'temple' },
            { x: 950, y: this.map.ground.y - 190, width: 190, height: 190, type: 'house', style: 'noble' }
        ];

        // Interaction system
        this.interactionRadius = 50;
        this.activeNPC = null;
        this.showInteractionPrompt = false;
        this.dialogueActive = false;
        this.currentDialogue = null;

        // NPC dialogues
        this.npcDialogues = {
            villager: {
                greeting: "Welcome to our peaceful town, traveler!",
                conversations: [
                    "The cherry blossoms are beautiful this time of year.",
                    "Have you visited the merchant's shop? He has rare items.",
                    "Our town is known for its peaceful way of life."
                ]
            },
            lord: {
                greeting: "Ah, a new face in our humble town.",
                conversations: [
                    "The dojo up ahead teaches meditation and inner peace.",
                    "As the town's lord, I ensure everyone lives in harmony.",
                    "Perhaps you'd like to settle here? We welcome peaceful souls."
                ]
            },
            ronin: {
                greeting: "Peace be with you, wanderer.",
                conversations: [
                    "I've found tranquility in tending to the garden.",
                    "The townspeople here showed me the beauty of peace.",
                    "Each day brings new opportunities for mindfulness."
                ]
            }
        };

        // Camera/viewport properties
        this.camera = {
            x: 0,
            y: 0
        };

        // Sky properties
        this.sky = {
            time: new Date(),
            stars: Array.from({ length: 100 }, () => ({
                x: Math.random() * 2000,
                y: Math.random() * (window.innerHeight - 200),
                size: Math.random() * 2 + 1,
                twinkle: Math.random()
            })),
            clouds: Array.from({ length: 15 }, () => ({
                x: Math.random() * 2000,
                y: Math.random() * (window.innerHeight / 2),
                width: Math.random() * 150 + 100,
                height: Math.random() * 40 + 30,
                speed: Math.random() * 0.2 + 0.1,
                opacity: Math.random() * 0.3 + 0.1
            }))
        };

        // Start sky update interval
        setInterval(() => this.updateSkyTime(), 60000);
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
        // Initialize player
        this.player = {
            x: 100,
            y: this.map.ground.y - this.canvasHeight * 2,
            width: this.canvasWidth * 2,
            height: this.canvasHeight * 2,
            speed: 3,
            runSpeed: 7, // Added separate run speed
            state: 'idle',
            direction: 'right',
            isMoving: false,
            isRunning: false // Added running state
        };
        
        // Initialize NPCs
        this.initNPCs();
        
        // Initialize controls
        this.initControls();
        
        // Load game assets
        this.loadAssets();
        
        // Start game loop
        this.lastTime = 0;
        this.gameLoop(0);
    }

    initNPCs() {
        const positions = [
            { x: 400, y: this.map.ground.y - 56, type: 'villager', direction: 'left' },
            { x: 700, y: this.map.ground.y - 56, type: 'lord', direction: 'right' },
            { x: 1000, y: this.map.ground.y - 56, type: 'ronin', direction: 'left' }
        ];

        this.npcs = positions.map(pos => ({
            type: pos.type,
            x: pos.x,
            y: pos.y,
            width: 29 * 2,
            height: 28 * 2,
            frame: 0,
            direction: pos.direction
        }));
    }
    
    initControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                if (key !== 'e') {
                    this.player.isMoving = true;
                }
                if (key === 'shift') {
                    this.player.isRunning = true;
                }
            }

            // Handle E key press for interaction
            if (key === 'e' && this.activeNPC && !this.dialogueActive) {
                this.startDialogue(this.activeNPC);
            } else if (key === 'e' && this.dialogueActive) {
                this.advanceDialogue();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
                if (key !== 'e') {
                    this.player.isMoving = Object.entries(this.keys)
                        .filter(([k, _]) => k !== 'e')
                        .some(([_, pressed]) => pressed);
                }
                if (key === 'shift') {
                    this.player.isRunning = false;
                }
            }
        });
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
    }
    
    updateCamera() {
        // Center camera on player
        const targetX = this.player.x - this.canvas.width / 2;
        
        // Clamp camera to map bounds
        this.camera.x = Math.max(0, Math.min(targetX, this.map.width - this.canvas.width));
    }

    updatePlayerPosition() {
        const currentSpeed = this.player.isRunning ? this.player.runSpeed : this.player.speed;
        
        if (this.keys.a) {
            this.player.x -= currentSpeed;
            this.player.direction = 'left';
        }
        if (this.keys.d) {
            this.player.x += currentSpeed;
            this.player.direction = 'right';
        }

        // Update player state
        if (!this.player.isMoving) {
            this.player.state = 'idle';
        } else {
            this.player.state = this.player.isRunning ? 'run' : 'walk';
        }
        
        // Keep player within map bounds
        this.player.x = Math.max(0, Math.min(this.map.width - this.player.width, this.player.x));
    }
    
    updateSkyTime() {
        this.sky.time = new Date();
    }

    updateClouds() {
        this.sky.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.map.width) {
                cloud.x = -cloud.width;
                cloud.y = Math.random() * (window.innerHeight / 2);
            }
        });
    }

    getTimeOfDay() {
        const hour = this.sky.time.getHours();
        const minute = this.sky.time.getMinutes();
        const timeRatio = (hour + minute / 60) / 24;

        // Define time periods
        const isDawn = hour >= 5 && hour < 8;
        const isDay = hour >= 8 && hour < 18;
        const isDusk = hour >= 18 && hour < 21;
        const isNight = hour >= 21 || hour < 5;

        return { isDawn, isDay, isDusk, isNight, timeRatio };
    }

    getSkyColor() {
        const { isDawn, isDay, isDusk, isNight, timeRatio } = this.getTimeOfDay();
        
        if (isDawn) {
            // Dawn: Pink to light blue
            return {
                top: `rgb(${255 - (timeRatio * 100)}, ${182 + (timeRatio * 30)}, ${193 + (timeRatio * 62)})`,
                bottom: `rgb(${255 - (timeRatio * 50)}, ${222 + (timeRatio * 20)}, ${233 + (timeRatio * 22)})`
            };
        } else if (isDay) {
            // Day: Light blue
            return {
                top: 'rgb(135, 206, 235)',
                bottom: 'rgb(208, 236, 247)'
            };
        } else if (isDusk) {
            // Dusk: Orange to dark blue
            return {
                top: `rgb(${255 - (timeRatio * 150)}, ${128 - (timeRatio * 100)}, ${0 + (timeRatio * 150)})`,
                bottom: `rgb(${255 - (timeRatio * 100)}, ${178 - (timeRatio * 100)}, ${102 + (timeRatio * 100)})`
            };
        } else {
            // Night: Dark blue
            return {
                top: 'rgb(5, 5, 30)',
                bottom: 'rgb(15, 15, 45)'
            };
        }
    }

    drawSky() {
        const { isDawn, isDay, isDusk, isNight } = this.getTimeOfDay();
        const skyColors = this.getSkyColor();

        // Create gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, skyColors.top);
        gradient.addColorStop(1, skyColors.bottom);

        // Draw sky
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars at night and during dusk/dawn transitions
        if (isNight || isDusk || isDawn) {
            const starOpacity = isNight ? 1 : isDusk ? 0.5 : 0.2;
            this.sky.stars.forEach(star => {
                const twinkle = Math.sin(Date.now() * 0.001 + star.twinkle * 10) * 0.3 + 0.7;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity * twinkle})`;
                this.ctx.beginPath();
                this.ctx.arc(
                    star.x - this.camera.x * 0.1, // Parallax effect
                    star.y,
                    star.size,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            });
        }

        // Draw clouds
        if (!isNight) {
            const cloudOpacity = isDusk ? 0.3 : isDawn ? 0.4 : 1;
            this.sky.clouds.forEach(cloud => {
                this.ctx.save();
                this.ctx.translate(-this.camera.x * 0.2, 0); // Parallax effect
                this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * cloudOpacity})`;
                
                // Draw cloud shape
                this.ctx.beginPath();
                this.ctx.moveTo(cloud.x, cloud.y);
                // Draw multiple circles to create cloud shape
                for (let i = 0; i < cloud.width; i += 30) {
                    const circleHeight = Math.sin(i / cloud.width * Math.PI) * cloud.height;
                    this.ctx.arc(
                        cloud.x + i,
                        cloud.y + circleHeight / 2,
                        cloud.height / 2,
                        0,
                        Math.PI * 2
                    );
                }
                this.ctx.fill();
                this.ctx.restore();
            });
        }
    }

    drawBuilding(building) {
        // Base building
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(building.x, building.y, building.width, building.height);

        // Roof
        this.ctx.beginPath();
        this.ctx.moveTo(building.x - 20, building.y);
        this.ctx.lineTo(building.x + building.width/2, building.y - 40);
        this.ctx.lineTo(building.x + building.width + 20, building.y);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fill();

        // Windows and details based on building type
        switch(building.style) {
            case 'traditional':
                this.drawTraditionalDetails(building);
                break;
            case 'merchant':
                this.drawShopDetails(building);
                break;
            case 'temple':
                this.drawTempleDetails(building);
                break;
            case 'noble':
                this.drawNobleDetails(building);
                break;
        }
    }

    drawTraditionalDetails(building) {
        // Sliding doors
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(building.x + building.width/4, building.y + building.height - 80,
                         building.width/2, 80);
        // Paper windows
        this.ctx.fillStyle = '#FFF5E1';
        this.ctx.fillRect(building.x + 30, building.y + 40, 50, 50);
        this.ctx.fillRect(building.x + building.width - 80, building.y + 40, 50, 50);
    }

    drawShopDetails(building) {
        // Shop front
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(building.x, building.y + building.height - 60,
                         building.width, 60);
        // Display window
        this.ctx.fillStyle = '#FFF5E1';
        this.ctx.fillRect(building.x + 20, building.y + building.height - 50,
                         building.width - 40, 40);
    }

    drawTempleDetails(building) {
        // Ornate entrance
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(building.x + building.width/4, building.y + building.height - 100,
                         building.width/2, 100);
        // Temple ornaments
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(building.x + building.width/2, building.y - 20, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawNobleDetails(building) {
        // Elegant entrance
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(building.x + building.width/3, building.y + building.height - 90,
                         building.width/3, 90);
        // Decorative windows
        this.ctx.fillStyle = '#FFF5E1';
        for(let i = 0; i < 3; i++) {
            this.ctx.fillRect(building.x + 30 + (i * 60), building.y + 40, 40, 60);
        }
    }

    checkNPCInteraction() {
        let nearestNPC = null;
        let shortestDistance = this.interactionRadius;

        this.npcs.forEach(npc => {
            const dx = (this.player.x + this.player.width/2) - (npc.x + npc.width/2);
            const dy = (this.player.y + this.player.height/2) - (npc.y + npc.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestNPC = npc;
            }
        });

        this.activeNPC = nearestNPC;
        this.showInteractionPrompt = !!nearestNPC;
    }

    startDialogue(npc) {
        this.dialogueActive = true;
        this.currentDialogue = {
            npc: npc,
            text: this.npcDialogues[npc.type].greeting,
            conversationIndex: -1
        };
    }

    advanceDialogue() {
        if (!this.currentDialogue) return;

        this.currentDialogue.conversationIndex++;
        const conversations = this.npcDialogues[this.currentDialogue.npc.type].conversations;
        
        if (this.currentDialogue.conversationIndex >= conversations.length) {
            this.dialogueActive = false;
            this.currentDialogue = null;
        } else {
            this.currentDialogue.text = conversations[this.currentDialogue.conversationIndex];
        }
    }

    drawDialogue() {
        if (!this.dialogueActive || !this.currentDialogue) return;

        // Draw dialogue box
        const padding = 20;
        const boxWidth = this.canvas.width * 0.6;
        const boxHeight = 100;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = this.canvas.height - boxHeight - 50;

        // Box background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = '#C7A353';
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px Cinzel';
        this.ctx.textAlign = 'left';
        this.wrapText(this.currentDialogue.text, boxX + padding, boxY + padding + 20, boxWidth - padding * 2);

        // Prompt
        this.ctx.font = '14px Cinzel';
        this.ctx.fillStyle = '#C7A353';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Press E to continue', boxX + boxWidth - padding, boxY + boxHeight - padding);
    }

    wrapText(text, x, y, maxWidth) {
        const words = text.split(' ');
        let line = '';
        const lineHeight = 25;

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }

    drawInteractionPrompt() {
        if (!this.showInteractionPrompt || this.dialogueActive) return;

        const text = 'Press E to interact';
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        this.ctx.font = '14px Cinzel';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, 
            this.activeNPC.x + this.activeNPC.width/2,
            this.activeNPC.y - 20);
        this.ctx.restore();
    }

    update(timestamp) {
        this.updatePlayerPosition();
        this.updateCamera();
        this.updateClouds();
        this.checkNPCInteraction();
        this.updateUI();
        
        // Update animation frame
        if (timestamp - this.lastFrameTime > this.animationSpeed) {
            const animation = this.animations[this.player.state];
            
            this.currentFrame = (this.currentFrame + 1) % animation.frames;
            
            // Update NPCs
            this.npcs.forEach(npc => {
                npc.frame = (npc.frame + 1) % 4;
            });
            
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
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky
        this.drawSky();

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw buildings
        this.buildings.forEach(building => this.drawBuilding(building));

        // Draw ground
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(0, this.map.ground.y, this.map.width, this.map.ground.height);

        // Draw decorative elements on ground
        this.drawGroundDecorations();

        // Draw NPCs and player
        this.drawCharacters();

        // Restore context
        this.ctx.restore();

        // Draw interaction prompt and dialogue (in screen space)
        this.drawInteractionPrompt();
        this.drawDialogue();
    }
    
    drawGroundDecorations() {
        // Draw grass patches
        this.ctx.fillStyle = '#8D6E63';
        for (let x = 0; x < this.map.width; x += 100) {
            const height = 5 + Math.sin(x * 0.1) * 3;
            this.ctx.fillRect(x, this.map.ground.y - height, 50, height);
        }

        // Draw small flowers or stones
        for (let x = 20; x < this.map.width; x += 200) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(x, this.map.ground.y - 5, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawCharacters() {
        // Draw NPCs
        this.npcs.forEach(npc => {
            if (this.npcSprites[npc.type] && this.npcSprites[npc.type].complete) {
                this.ctx.save();
                if (npc.direction === 'left') {
                    this.ctx.scale(-1, 1);
                    this.ctx.translate(-npc.x - npc.width, 0);
                }
                this.ctx.drawImage(
                    this.npcSprites[npc.type],
                    npc.frame * 29, 0,
                    29, 28,
                    npc.direction === 'left' ? 0 : npc.x, npc.y,
                    npc.width, npc.height
                );
                this.ctx.restore();
            }
        });

        // Draw player
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