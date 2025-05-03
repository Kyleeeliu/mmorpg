class Game {
    constructor() {
        try {
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Could not find game canvas element');
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Could not get 2D context from canvas');
            }
            
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
                run: { frames: 8, row: 2 },
                jump: { frames: 4, row: 3 },
                fall: { frames: 3, row: 4 }
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
                shift: false,
                m: false,
                space: false  // Add space for jumping
            };

            // Map properties
            this.map = {
                width: 2000,
                height: window.innerHeight,
                ground: { y: window.innerHeight - 100, height: 100 }
            };

            // Simplify spiritual progress to just track shrine completions
            this.spiritualProgress = {
                totalShrinesCompleted: 0
            };

            // Quest system
            this.questSystem = {
                currentQuest: 0,
                quests: [
                    {
                        id: 0,
                        title: "The Path Begins",
                        description: "Find the mysterious elder near the first house.",
                        state: "active",
                        type: "talk",
                        targetNPC: "lord",
                        completed: false,
                        nextQuestId: 1
                    },
                    {
                        id: 1,
                        title: "First Steps",
                        description: "Meditate at the Garden of Wisdom for 30 seconds.",
                        state: "locked",
                        type: "meditate",
                        targetShrine: "Garden of Wisdom",
                        requiredTime: 30,
                        completed: false,
                        nextQuestId: 2
                    },
                    {
                        id: 2,
                        title: "The Wandering Ronin",
                        description: "Seek out the ronin who guards ancient knowledge.",
                        state: "locked",
                        type: "talk",
                        targetNPC: "ronin",
                        completed: false,
                        nextQuestId: 3
                    },
                    {
                        id: 3,
                        title: "Trial of Patience",
                        description: "Complete offerings at all three shrines to prove your dedication.",
                        state: "locked",
                        type: "shrines",
                        requiredShrines: 3,
                        completed: false,
                        nextQuestId: 4
                    },
                    {
                        id: 4,
                        title: "Inner Peace",
                        description: "Return to the elder to complete your journey.",
                        state: "locked",
                        type: "talk",
                        targetNPC: "lord",
                        completed: false,
                        nextQuestId: null
                    }
                ],
                showQuestPrompt: false,
                questPromptTimer: 0
            };

            // Simplify shrine system
            this.shrines = [
                {
                    x: 650,
                    y: this.map.ground.y - 220,
                    width: 220,
                    height: 220,
                    type: 'shrine',
                    style: 'temple',
                    name: 'Temple of Serenity',
                    completed: false,
                    wisdom: "Peace begins within."
                },
                {
                    x: 3000,  // Moved into the forest (forest starts at 2200)
                    y: this.map.ground.y - 200,
                    width: 200,
                    height: 200,
                    type: 'shrine',
                    style: 'temple',
                    name: 'Garden of Wisdom',
                    completed: false,
                    wisdom: "Knowledge flows like water."
                },
                {
                    x: 5800,  // Moved to end of forest (forest ends at 6200)
                    y: this.map.ground.y - 210,
                    width: 210,
                    height: 210,
                    type: 'shrine',
                    style: 'temple',
                    name: 'Sanctuary of Compassion',
                    completed: false,
                    wisdom: "In giving, we receive."
                }
            ];

            // Replace buildings array with combined buildings and shrines
            this.buildings = [
                { x: 50, y: this.map.ground.y - 200, width: 200, height: 200, type: 'house', style: 'traditional' },
                { x: 350, y: this.map.ground.y - 180, width: 180, height: 180, type: 'shop', style: 'merchant' },
                { x: 950, y: this.map.ground.y - 190, width: 190, height: 190, type: 'house', style: 'noble' },
                ...this.shrines
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
                        "The Garden of Wisdom shrine lies deep in the forest to the east.",
                        "Follow the path through the forest, you'll find it around the halfway point.",
                        "The shrine's massive torii gate can be seen from afar."
                    ]
                },
                lord: {
                    greeting: "Ah, a new face in our humble town.",
                    conversations: [
                        "The Garden of Wisdom awaits you in the forest, about halfway through.",
                        "Seek enlightenment at the shrine, it lies at position 3000 paces east.",
                        "The forest holds many secrets, but the Garden's torii gate stands tall."
                    ]
                },
                ronin: {
                    greeting: "Peace be with you, wanderer.",
                    conversations: [
                        "I guard the path to the Garden of Wisdom, deep in these woods.",
                        "The shrine lies halfway through the forest, marked by a grand torii gate.",
                        "Follow the path east, you'll find the Garden around position 3000."
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
                }))
            };

            // Start sky update interval
            setInterval(() => this.updateSkyTime(), 60000);

            // Add meditation state
            this.meditation = {
                active: false,
                duration: 0,
                maxDuration: 60, // seconds
                benefits: {
                    peace: 0,
                    wisdom: 0
                }
            };
            
            // Add dojo interaction
            this.dojoInteraction = {
                active: false,
                nearDojo: false,
                meditationPrompt: false
            };

            // UI state for spiritual journey
            this.spiritualUI = {
                showProgress: false,
                showInventory: false,
                showObjective: false
            };

            // Animation state for shrine offerings
            this.offeringAnimation = {
                active: false,
                shrine: null,
                startTime: 0,
                duration: 3000, // 3 seconds
                particles: [],
                initialPlayerY: 0,
                floatHeight: 0
            };

            // Physics properties
            this.physics = {
                gravity: 0.8,
                jumpForce: -10,
                maxFallSpeed: 15,
                groundFriction: 0.8,
                airFriction: 0.95
            };

            // Add yin yang meter properties
            this.yinYangMeter = {
                progress: 0,  // 0 to 1
                size: 80,    // Size of the meter
                x: 20,       // Position from left
                y: 100      // Position from top
            };

            // Add control guide properties
            this.controlGuide = {
                x: window.innerWidth - 200,  // Position from right
                y: 20,                       // Position from top
                width: 180,                  // Width of guide
                controls: [
                    { key: 'A/D', action: 'Move' },
                    { key: 'SPACE', action: 'Jump' },
                    { key: 'SHIFT', action: 'Run' },
                    { key: 'E', action: 'Interact' },
                    { key: 'M', action: 'Meditate' }
                ]
            };

            // Initialize forest properties with logs
            this.forest = {
                startX: 2200,
                width: 4000,
                trees: [],
                logs: []  // Add logs array
            };

            // Initialize trees with consistent spacing pattern
            const treeSpacing = 100;
            const treeY = this.map.ground.y - 240;
            const rowOffset = treeSpacing / 2;

            // Create main row of trees
            for (let x = this.forest.startX; x < this.forest.startX + this.forest.width; x += treeSpacing) {
                // Add main row trees
                this.forest.trees.push({
                    x: x,
                    y: treeY,
                    width: 150,
                    height: 250
                });

                // Add offset row trees (between main row trees)
                if (x < this.forest.startX + this.forest.width - rowOffset) {
                    this.forest.trees.push({
                        x: x + rowOffset,
                        y: treeY,
                        width: 150,
                        height: 250
                    });
                }

                // Randomly add logs near some trees
                if (Math.random() < 0.3) { // 30% chance for a log
                    const logOffset = Math.random() * 100 - 50; // Random offset from tree
                    this.forest.logs.push({
                        x: x + logOffset,
                        y: this.map.ground.y - 20, // Place log slightly above ground
                        width: 60,  // Log dimensions
                        height: 30,
                        rotation: Math.random() * 0.5 - 0.25 // Slight random rotation (-0.25 to 0.25 radians)
                    });
                }
            }

            // Load tree sprite
            this.treeSprite = new Image();
            this.treeSprite.onerror = () => console.error('Failed to load tree sprite:', this.treeSprite.src);
            this.treeSprite.onload = () => console.log('Successfully loaded tree sprite');
            this.treeSprite.src = 'assets/environment/tree.png';

            // Load log sprite
            this.logSprite = new Image();
            this.logSprite.onerror = () => console.error('Failed to load log sprite:', this.logSprite.src);
            this.logSprite.onload = () => console.log('Successfully loaded log sprite');
            this.logSprite.src = 'assets/environment/log.png';

            // Extend map width to accommodate forest
            this.map.width = this.forest.startX + this.forest.width + 400;

        } catch (error) {
            console.error('Game initialization failed:', error);
            // Display error message to user
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,0,0,0.8); color: white; padding: 20px; border-radius: 5px; text-align: center;';
            errorDiv.innerHTML = `Game failed to start: ${error.message}<br>Please refresh the page or contact support.`;
            document.body.appendChild(errorDiv);
        }
    }
    
    initStartScreen() {
        try {
            const startScreen = document.getElementById('startScreen');
            const introCutscene = document.getElementById('introCutscene');
            const gameContainer = document.getElementById('gameContainer');
            const startButton = document.getElementById('startButton');
            const continueButton = document.getElementById('continueButton');
            
            if (!startScreen || !gameContainer || !startButton || !introCutscene || !continueButton) {
                throw new Error('Could not find required UI elements');
            }
            
            startButton.addEventListener('click', () => {
                startScreen.style.display = 'none';
                introCutscene.style.display = 'flex';
            });

            continueButton.addEventListener('click', () => {
                introCutscene.style.display = 'none';
                gameContainer.style.display = 'block';
                this.initGame();
            });
        } catch (error) {
            console.error('Start screen initialization failed:', error);
            throw error; // Re-throw to be caught by constructor
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update control guide position on resize
        if (this.controlGuide) {
            this.controlGuide.x = this.canvas.width - 200;
        }
    }
    
    initGame() {
        // Initialize player with physics properties
        this.player = {
            x: 100,
            y: this.map.ground.y - this.canvasHeight * 2,
            width: this.canvasWidth * 2,
            height: this.canvasHeight * 2,
            speed: 3,
            runSpeed: 7,
            state: 'idle',
            direction: 'right',
            isMoving: false,
            isRunning: false,
            // Add physics properties
            velocityX: 0,
            velocityY: 0,
            isJumping: false,
            isGrounded: true,
            jumpCount: 0,
            maxJumps: 1  // Single jump for now
        };

        // Initialize game panel
        this.gamePanel = {
            x: 20,
            y: 200,
            width: 180,
            height: 250,
            sections: [
                {
                    title: "Character",
                    stats: [
                        { label: "Spirit", value: 0, max: 100 },
                        { label: "Wisdom", value: 0, max: 100 }
                    ]
                },
                {
                    title: "Journey",
                    stats: [
                        { label: "Shrines", value: 0, max: 3 },
                        { label: "Meditation", value: 0, unit: "min" }
                    ]
                }
            ]
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
            { x: 150, y: this.map.ground.y - 56, type: 'lord', direction: 'right' },  // Moved lord next to first house
            { x: 1200, y: this.map.ground.y - 56, type: 'ronin', direction: 'left' }
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
            if (key === ' ') {
                this.keys.space = true;
                this.handleJump();
            } else if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                if (key !== 'e' && key !== 'm') {
                    this.player.isMoving = true;
                }
                if (key === 'shift') {
                    this.player.isRunning = true;
                }
                if (key === 'e') {
                    // Handle NPC interaction
                    if (this.showInteractionPrompt && this.activeNPC) {
                        if (this.dialogueActive) {
                            this.advanceDialogue();
                        } else {
                            this.startDialogue(this.activeNPC);
                        }
                    }
                    // Handle shrine interaction
                    const nearestShrine = this.findNearestShrine();
                    if (nearestShrine && !nearestShrine.completed && !this.offeringAnimation.active) {
                        this.startOfferingAnimation(nearestShrine);
                    }
                }
                if (key === 'm') {
                    this.toggleMeditation();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === ' ') {
                this.keys.space = false;
            } else if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
                if (key !== 'e' && key !== 'm') {
                    this.player.isMoving = Object.entries(this.keys)
                        .filter(([k, _]) => k !== 'e' && k !== 'm')
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
        this.playerSprite.onerror = () => console.error('Failed to load player sprite:', this.playerSprite.src);
        this.playerSprite.onload = () => console.log('Successfully loaded player sprite');
        this.playerSprite.src = 'assets/Tiny Pixel Japan Male Character Pack/Samurai.png';
        
        // Load gate sprite
        this.gateSprite = new Image();
        this.gateSprite.onerror = () => console.error('Failed to load gate sprite:', this.gateSprite.src);
        this.gateSprite.onload = () => console.log('Successfully loaded gate sprite');
        this.gateSprite.src = 'assets/environment/gate.png';
        
        // Load NPC sprites with correct filenames
        this.npcSprites = {};
        const npcTypes = {
            'villager': 'Villager',
            'lord': 'Lord',
            'ronin': 'Samurai'  // Using Samurai sprite for ronin
        };
        
        Object.entries(npcTypes).forEach(([type, filename]) => {
            this.npcSprites[type] = new Image();
            this.npcSprites[type].onerror = () => console.error(`Failed to load ${type} sprite:`, this.npcSprites[type].src);
            this.npcSprites[type].onload = () => console.log(`Successfully loaded ${type} sprite`);
            this.npcSprites[type].src = `assets/Tiny Pixel Japan Male Character Pack/NPC_${filename}.png`;
        });

        // Add game initialization check
        window.addEventListener('load', () => {
            console.log('Game assets status:', {
                playerSprite: this.playerSprite.complete,
                npcSprites: Object.fromEntries(
                    Object.entries(this.npcSprites).map(([type, sprite]) => [type, sprite.complete])
                ),
                treeSprite: this.treeSprite.complete
            });
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
        
        // Handle horizontal movement
        if (this.keys.a) {
            this.player.velocityX = -currentSpeed;
            this.player.direction = 'left';
        }
        if (this.keys.d) {
            this.player.velocityX = currentSpeed;
            this.player.direction = 'right';
        }
        if (!this.keys.a && !this.keys.d) {
            // Let friction handle deceleration
            this.player.velocityX *= this.player.isGrounded ? 0.8 : 0.95;
        }
    }

    updatePlayerPhysics() {
        // Apply gravity
        this.player.velocityY += this.physics.gravity;
        
        // Clamp fall speed
        if (this.player.velocityY > this.physics.maxFallSpeed) {
            this.player.velocityY = this.physics.maxFallSpeed;
        }

        // Update position
        this.player.y += this.player.velocityY;
        this.player.x += this.player.velocityX;

        // Ground collision
        if (this.player.y > this.map.ground.y - this.player.height) {
            this.player.y = this.map.ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isGrounded = true;
            this.player.isJumping = false;
            this.player.jumpCount = 0;
        }

        // Apply friction
        if (this.player.isGrounded) {
            this.player.velocityX *= this.physics.groundFriction;
        } else {
            this.player.velocityX *= this.physics.airFriction;
        }

        // Update animation state based on physics
        if (!this.player.isGrounded) {
            this.player.state = this.player.velocityY < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.player.velocityX) > 0.1) {
            this.player.state = this.player.isRunning ? 'run' : 'walk';
        } else {
            this.player.state = 'idle';
        }

        // Keep player within map bounds
        this.player.x = Math.max(0, Math.min(this.map.width - this.player.width, this.player.x));
    }

    updateSkyTime() {
        this.sky.time = new Date();
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
                // Draw square stars instead of circles
                this.ctx.fillRect(
                    star.x - this.camera.x * 0.1 - star.size/2,
                    star.y - star.size/2,
                    star.size,
                    star.size
                );
            });
        }
    }

    drawBuilding(building) {
        // Skip base building for temples
        if (building.style !== 'temple') {
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
        }

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
        // Main entrance (Using gate sprite)
        if (this.gateSprite && this.gateSprite.complete) {
            const gateWidth = building.width * 3.0;  // Made enormous
            const gateHeight = building.height * 2.5;  // Made towering
            const gateX = building.x + (building.width - gateWidth) / 2;
            const gateY = building.y + building.height - gateHeight * 0.7;  // Brought lower down
            
            this.ctx.drawImage(
                this.gateSprite,
                gateX,
                gateY,
                gateWidth,
                gateHeight
            );
        }
    }
    
    drawMeditationArea(building) {
        // Stone path
        this.ctx.fillStyle = '#808080';
        for(let i = 0; i < 5; i++) {
            this.ctx.fillRect(
                building.x + building.width/2 - 100 + (i * 45),
                building.y + building.height,
                35, 20
            );
        }
        
        // Zen garden
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillRect(
            building.x - 50,
            building.y + building.height + 20,
            building.width + 100,
            40
        );
        
        // Zen garden patterns
        this.ctx.strokeStyle = '#D3D3D3';
        this.ctx.beginPath();
        for(let i = 0; i < 15; i++) {
            const x = building.x - 50 + (i * 30);
            const y = building.y + building.height + 20;
            // Draw angular patterns instead of curves
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 15, y + 20);
            this.ctx.lineTo(x, y + 40);
        }
        this.ctx.stroke();
        
        // Meditation stones (squares)
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(
            building.x + building.width/2 - 45,
            building.y + building.height + 35,
            20, 20
        );
        this.ctx.fillRect(
            building.x + building.width/2 + 25,
            building.y + building.height + 35,
            20, 20
        );
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

        // Update interaction state
        if (nearestNPC) {
            this.activeNPC = nearestNPC;
            this.showInteractionPrompt = true;
        } else {
            this.activeNPC = null;
            this.showInteractionPrompt = false;
            // Close dialogue if player moves away
            if (this.dialogueActive) {
                this.dialogueActive = false;
                this.currentDialogue = null;
            }
        }
    }

    startDialogue(npc) {
        if (!npc) return;
        
        this.dialogueActive = true;
        this.currentDialogue = {
            npc: npc,
            text: this.npcDialogues[npc.type].greeting,
            conversationIndex: -1
        };
    }

    advanceDialogue() {
        if (!this.dialogueActive || !this.currentDialogue) return;

        this.currentDialogue.conversationIndex++;
        const conversations = this.npcDialogues[this.currentDialogue.npc.type].conversations;
        
        if (this.currentDialogue.conversationIndex >= conversations.length) {
            this.dialogueActive = false;
            this.currentDialogue = null;
        } else {
            this.currentDialogue.text = conversations[this.currentDialogue.conversationIndex];
        }
    }

    drawInteractionPrompt() {
        if (!this.showInteractionPrompt || this.dialogueActive) return;

        const text = 'Press E to interact';
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        this.ctx.font = '16px Cinzel';  // Increased font size
        this.ctx.fillStyle = '#FFD700';  // Changed to gold color
        this.ctx.textAlign = 'center';
        
        // Add background for better visibility
        const textWidth = this.ctx.measureText(text).width;
        const padding = 10;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(
            this.activeNPC.x + this.activeNPC.width/2 - textWidth/2 - padding,
            this.activeNPC.y - 40,
            textWidth + padding * 2,
            30
        );
        
        // Draw text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(text, 
            this.activeNPC.x + this.activeNPC.width/2,
            this.activeNPC.y - 20);
        this.ctx.restore();
    }

    drawDialogue() {
        if (!this.dialogueActive || !this.currentDialogue) return;

        // Draw dialogue box with improved visibility
        const padding = 20;
        const boxWidth = this.canvas.width * 0.6;
        const boxHeight = 120;  // Increased height
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = this.canvas.height - boxHeight - 50;

        // Box background with higher opacity
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Decorative border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // NPC name
        this.ctx.font = 'bold 18px Cinzel';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
            this.currentDialogue.npc.type.charAt(0).toUpperCase() + this.currentDialogue.npc.type.slice(1),
            boxX + padding,
            boxY + padding + 10
        );

        // Dialogue text
        this.ctx.font = '16px Cinzel';
        this.ctx.fillStyle = '#FFFFFF';
        this.wrapText(
            this.currentDialogue.text,
            boxX + padding,
            boxY + padding + 40,
            boxWidth - padding * 2
        );

        // Continue prompt with animation
        const promptText = 'Press E to continue';
        this.ctx.font = '14px Cinzel';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'right';
        this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;  // Pulsing animation
        this.ctx.fillText(promptText, boxX + boxWidth - padding, boxY + boxHeight - padding);
        this.ctx.globalAlpha = 1;  // Reset opacity
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

    toggleMeditation() {
        const nearestShrine = this.findNearestShrine();
        if (!this.meditation.active && nearestShrine) {
            this.meditation.active = true;
            this.meditation.duration = 0;
            this.player.isMoving = false;
        } else {
            this.meditation.active = false;
        }
    }
    
    updateMeditation(timestamp) {
        if (!this.meditation.active) return;
        
        // Increment meditation duration
        this.meditation.duration += 1/60; // Assuming 60 FPS
        
        // Update benefits
        this.meditation.benefits.peace = Math.min(100, this.meditation.benefits.peace + 0.1);
        this.meditation.benefits.wisdom = Math.min(100, this.meditation.benefits.wisdom + 0.05);
        
        // Update game panel stats
        if (this.gamePanel) {
            // Update Character section stats
            this.gamePanel.sections[0].stats[0].value = Math.floor(this.meditation.benefits.peace); // Spirit
            this.gamePanel.sections[0].stats[1].value = Math.floor(this.meditation.benefits.wisdom); // Wisdom
            
            // Update Journey section meditation stat
            this.gamePanel.sections[1].stats[1].value = Math.floor(this.meditation.duration / 60); // Convert to minutes
        }
        
        // Visual effects during meditation
        this.drawMeditationEffects();
    }
    
    drawMeditationEffects() {
        if (!this.meditation.active) return;
        
        const nearestShrine = this.findNearestShrine();
        if (!nearestShrine) {
            this.meditation.active = false;
            return;
        }
        
        // Draw peaceful aura around player as a square
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Create square aura
        const auraSize = 200;
        const x = this.player.x + this.player.width/2 - auraSize/2;
        const y = this.player.y + this.player.height/2 - auraSize/2;
        
        // Draw layered squares for aura effect
        for(let i = 0; i < 5; i++) {
            const size = auraSize - (i * 40);
            const opacity = 0.2 - (i * 0.04);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fillRect(
                x + (auraSize - size)/2,
                y + (auraSize - size)/2,
                size,
                size
            );
        }
        
        // Draw meditation timer and shrine name
        this.ctx.font = '16px Cinzel';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Meditating at ${nearestShrine.name}: ${Math.floor(this.meditation.duration)}s`,
            this.player.x + this.player.width/2,
            this.player.y - 20
        );
        
        this.ctx.restore();
    }
    
    checkDojoInteraction() {
        // Find the dojo building
        const dojo = this.buildings.find(b => b.type === 'dojo');
        if (!dojo) return;
        
        // Check if player is near the dojo
        const dojoCenter = {
            x: dojo.x + dojo.width/2,
            y: dojo.y + dojo.height/2
        };
        
        const playerCenter = {
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2
        };
        
        const dx = dojoCenter.x - playerCenter.x;
        const dy = dojoCenter.y - playerCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.dojoInteraction.nearDojo = distance < 150;
        this.dojoInteraction.meditationPrompt = this.dojoInteraction.nearDojo && !this.meditation.active;
    }
    
    drawDojoPrompt() {
        if (!this.dojoInteraction.meditationPrompt) return;
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw meditation prompt
        this.ctx.font = '14px Cinzel';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Press M to meditate',
            this.player.x + this.player.width/2,
            this.player.y - 40
        );
        
        this.ctx.restore();
    }

    checkShrineInteraction() {
        if (this.meditation.active || this.offeringAnimation.active) return;

        let nearestShrine = null;
        let shortestDistance = 150; // Interaction radius for shrines

        this.shrines.forEach(shrine => {
            const dx = (this.player.x + this.player.width/2) - (shrine.x + shrine.width/2);
            const dy = (this.player.y + this.player.height/2) - (shrine.y + shrine.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestShrine = shrine;
            }
        });

        if (nearestShrine) {
            if (!nearestShrine.completed) {
                this.showShrinePrompt(nearestShrine);
            }
            // Show meditation prompt regardless of shrine completion
            this.showMeditationPrompt(nearestShrine);
        }
    }

    showMeditationPrompt(shrine) {
        if (this.meditation.active) return;
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw meditation prompt
        this.ctx.font = '14px Cinzel';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Press M to meditate',
            shrine.x + shrine.width/2,
            shrine.y - 60
        );
        
        this.ctx.restore();
    }

    showShrinePrompt(shrine) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw prompt
        this.ctx.font = '14px Cinzel';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Press E to make an offering',
            shrine.x + shrine.width/2,
            shrine.y - 40
        );
        
        this.ctx.restore();
    }

    startOfferingAnimation(shrine) {
        if (shrine.completed || this.offeringAnimation.active) return;

        this.offeringAnimation = {
            active: true,
            shrine: shrine,
            startTime: Date.now(),
            duration: 3000,
            initialPlayerY: this.player.y,
            floatHeight: 100
        };

        // Mark shrine as completed and update yin yang meter
        shrine.completed = true;
        this.spiritualProgress.totalShrinesCompleted++;
        this.yinYangMeter.progress = this.spiritualProgress.totalShrinesCompleted / this.shrines.length;

        // Update game panel shrine count
        if (this.gamePanel) {
            this.gamePanel.sections[1].stats[0].value = this.spiritualProgress.totalShrinesCompleted;
            
            // Also increase wisdom and spirit for completing a shrine
            this.gamePanel.sections[0].stats[0].value = Math.min(100, (this.gamePanel.sections[0].stats[0].value || 0) + 20); // Spirit +20
            this.gamePanel.sections[0].stats[1].value = Math.min(100, (this.gamePanel.sections[0].stats[1].value || 0) + 15); // Wisdom +15
        }

        // Show wisdom message after animation
        setTimeout(() => {
            this.showShrineCompletionMessage(shrine);
        }, this.offeringAnimation.duration);
    }

    updateOfferingAnimation() {
        if (!this.offeringAnimation.active) return;

        const elapsed = Date.now() - this.offeringAnimation.startTime;
        const progress = elapsed / this.offeringAnimation.duration;

        if (progress >= 1) {
            this.offeringAnimation.active = false;
            // Reset player position if needed
            this.player.y = this.offeringAnimation.initialPlayerY;
            // Lock player position during animation
            this.player.velocityX = 0;
            return;
        }

        // Calculate player floating animation
        // Use sine wave for smooth up and down motion
        const floatProgress = Math.sin(progress * Math.PI);
        this.player.y = this.offeringAnimation.initialPlayerY - (floatProgress * this.offeringAnimation.floatHeight);
        
        // Lock player horizontal movement during animation
        this.player.velocityX = 0;
    }

    drawOfferingAnimation() {
        if (!this.offeringAnimation.active) return;

        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);

        const elapsed = Date.now() - this.offeringAnimation.startTime;
        const progress = elapsed / this.offeringAnimation.duration;
        
        // Calculate player center - update continuously to follow player
        const playerCenterX = this.player.x + this.player.width/2;
        
        // Create gradient for main light beam
        const gradient = this.ctx.createLinearGradient(
            playerCenterX,
            0,
            playerCenterX,
            this.map.ground.y
        );
        gradient.addColorStop(0, `rgba(255, 223, 0, ${0.8 * (1 - progress)})`);
        gradient.addColorStop(1, `rgba(255, 223, 0, ${0.4 * (1 - progress)})`);

        // Draw main light beam from sky to ground, centered on player
        this.ctx.fillStyle = gradient;
        const beamWidth = 40 + Math.sin(progress * Math.PI) * 20;
        this.ctx.fillRect(
            playerCenterX - beamWidth/2,
            0,
            beamWidth,
            this.map.ground.y + 10 // Extend slightly into ground for seamless connection
        );

        // Draw impact effect on the ground, centered on player
        const impactWidth = beamWidth * 2 + Math.sin(progress * Math.PI * 4) * 20;
        const impactHeight = 20 + Math.sin(progress * Math.PI * 4) * 10;
        this.ctx.fillStyle = `rgba(255, 223, 0, ${0.6 * (1 - progress)})`;
        this.ctx.fillRect(
            playerCenterX - impactWidth/2,
            this.map.ground.y - impactHeight/2,
            impactWidth,
            impactHeight
        );

        // Draw horizontal light rays, centered on player
        const rayCount = 5;
        for(let i = 0; i < rayCount; i++) {
            const rayY = this.map.ground.y - (i * 50) - progress * 50;
            if (rayY > 0) {
                const rayWidth = beamWidth + 40 + Math.sin((progress + i) * Math.PI) * 20;
                this.ctx.fillStyle = `rgba(255, 223, 0, ${0.2 * (1 - progress)})`;
                this.ctx.fillRect(
                    playerCenterX - rayWidth/2,
                    rayY,
                    rayWidth,
                    10
                );
            }
        }

        this.ctx.restore();
    }

    showShrineCompletionMessage(shrine) {
        const message = {
            title: `${shrine.name} Blessed!`,
            text: shrine.wisdom,
            effect: `Shrines Completed: ${this.spiritualProgress.totalShrinesCompleted}/${this.shrines.length}`
        };
        
        this.showMessage(message);

        // Check for game completion
        if (this.spiritualProgress.totalShrinesCompleted >= this.shrines.length) {
            setTimeout(() => this.showGameCompletion(), 3000);
        }
    }

    showGameCompletion() {
        const message = {
            title: "Inner Peace Achieved!",
            text: "You have completed your spiritual journey and found true inner peace.",
            footer: "Thank you for playing!"
        };
        
        this.showMessage(message);
    }

    showMessage(message) {
        // Draw message box
        const boxWidth = this.canvas.width * 0.6;
        const boxHeight = 150;
        const boxX = (this.canvas.width - boxWidth) / 2;
        const boxY = (this.canvas.height - boxHeight) / 2;

        // Draw traditional paper background
        this.ctx.fillStyle = '#F4E4BC';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw pixel perfect border and decorations
        this.drawPixelBorder(boxX, boxY, boxWidth, boxHeight);
        this.drawCornerDecorations(boxX, boxY, boxWidth, boxHeight);

        // Draw horizontal decorative lines
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(boxX + 20, boxY + 50, boxWidth - 40, 2);
        this.ctx.fillRect(boxX + 20, boxY + boxHeight - 40, boxWidth - 40, 2);

        // Draw title
        this.ctx.font = 'bold 16px "Press Start 2P"';
        this.ctx.fillStyle = '#8B4513';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message.title, boxX + boxWidth/2, boxY + 35);

        // Draw main text
        this.ctx.font = '12px "Press Start 2P"';
        this.wrapPixelText(message.text, boxX + 30, boxY + 80, boxWidth - 60);

        // Draw effect text if present
        if (message.effect) {
            this.ctx.fillStyle = '#A52A2A';
            this.wrapPixelText(message.effect, boxX + 30, boxY + boxHeight - 25, boxWidth - 60);
        }

        // Draw pixel art scroll decorations
        this.drawScrollDecoration(boxX, boxY, boxWidth, boxHeight);
    }

    drawScrollDecoration(x, y, width, height) {
        // Draw scroll ends
        this.ctx.fillStyle = '#8B4513';
        
        // Left scroll
        const scrollWidth = 8;
        const scrollPattern = [
            [1,1,1,1],
            [0,1,1,0],
            [1,1,1,1]
        ];
        
        // Draw left scroll
        scrollPattern.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    this.ctx.fillRect(x + j * 2, y + height/2 - 3 + i * 2, 2, 2);
                }
            });
        });
        
        // Draw right scroll
        scrollPattern.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    this.ctx.fillRect(x + width - 8 + j * 2, y + height/2 - 3 + i * 2, 2, 2);
                }
            });
        });
    }

    updateQuest() {
        const currentQuest = this.questSystem.quests[this.questSystem.currentQuest];
        if (!currentQuest || currentQuest.completed) return;

        switch (currentQuest.type) {
            case "talk":
                if (this.activeNPC && this.activeNPC.type === currentQuest.targetNPC && this.dialogueActive) {
                    this.completeQuest(currentQuest);
                }
                break;
            case "meditate":
                if (this.meditation.active) {
                    const nearestShrine = this.findNearestShrine();
                    if (nearestShrine && nearestShrine.name === currentQuest.targetShrine) {
                        if (this.meditation.duration >= currentQuest.requiredTime) {
                            this.completeQuest(currentQuest);
                        }
                    }
                }
                break;
            case "shrines":
                if (this.spiritualProgress.totalShrinesCompleted >= currentQuest.requiredShrines) {
                    this.completeQuest(currentQuest);
                }
                break;
        }
    }

    completeQuest(quest) {
        quest.completed = true;
        quest.state = "completed";
        
        // Show completion message
        this.showQuestComplete(quest);
        
        // Advance to next quest if there is one
        if (quest.nextQuestId !== null) {
            const nextQuest = this.questSystem.quests.find(q => q.id === quest.nextQuestId);
            if (nextQuest) {
                nextQuest.state = "active";
                this.questSystem.currentQuest = quest.nextQuestId;
                
                // Show new quest notification after a delay
                setTimeout(() => {
                    this.showNewQuest(nextQuest);
                }, 2000);
            }
        } else {
            // Game completion
            setTimeout(() => {
                this.showGameCompletion();
            }, 2000);
        }
    }

    showQuestComplete(quest) {
        const message = {
            title: "Quest Complete!",
            text: quest.title,
            effect: "You have grown in wisdom and understanding."
        };
        this.showMessage(message);
    }

    showNewQuest(quest) {
        const message = {
            title: "New Quest",
            text: quest.title,
            effect: quest.description
        };
        this.showMessage(message);
    }

    drawQuestIndicator() {
        const currentQuest = this.questSystem.quests[this.questSystem.currentQuest];
        if (!currentQuest || currentQuest.completed) return;

        const x = 10;
        const y = 10;
        const width = 300;
        const height = 70;

        // Draw traditional paper background
        this.ctx.fillStyle = '#F4E4BC'; // Aged paper color
        this.ctx.fillRect(x, y, width, height);

        // Draw pixel perfect border pattern
        this.drawPixelBorder(x, y, width, height);

        // Draw traditional corner decorations
        this.drawCornerDecorations(x, y, width, height);

        // Draw title with pixel shadow
        this.ctx.font = 'bold 16px "Press Start 2P"';
        this.ctx.fillStyle = '#8B4513'; // Dark brown
        this.ctx.textAlign = 'left';
        this.ctx.fillText(currentQuest.title, x + 20, y + 30);

        // Draw description with pixel-perfect line breaks
        this.ctx.font = '12px "Press Start 2P"';
        this.wrapPixelText(currentQuest.description, x + 20, y + 50, width - 40);
    }

    drawPixelBorder(x, y, width, height) {
        // Draw outer border (2px thick)
        this.ctx.fillStyle = '#8B4513'; // Dark brown
        this.ctx.fillRect(x, y, width, 2);
        this.ctx.fillRect(x, y + height - 2, width, 2);
        this.ctx.fillRect(x, y, 2, height);
        this.ctx.fillRect(x + width - 2, y, 2, height);

        // Draw traditional pattern along the border
        this.ctx.fillStyle = '#A52A2A'; // Darker red
        for (let i = x + 6; i < x + width - 6; i += 8) {
            // Top pattern
            this.ctx.fillRect(i, y + 4, 4, 2);
            // Bottom pattern
            this.ctx.fillRect(i, y + height - 6, 4, 2);
        }
        for (let i = y + 6; i < y + height - 6; i += 8) {
            // Left pattern
            this.ctx.fillRect(x + 4, i, 2, 4);
            // Right pattern
            this.ctx.fillRect(x + width - 6, i, 2, 4);
        }
    }

    drawCornerDecorations(x, y, width, height) {
        const cornerSize = 12;
        this.ctx.fillStyle = '#A52A2A'; // Darker red

        // Top-left corner
        this.drawPixelCorner(x + 4, y + 4, cornerSize, 'tl');
        // Top-right corner
        this.drawPixelCorner(x + width - 4 - cornerSize, y + 4, cornerSize, 'tr');
        // Bottom-left corner
        this.drawPixelCorner(x + 4, y + height - 4 - cornerSize, cornerSize, 'bl');
        // Bottom-right corner
        this.drawPixelCorner(x + width - 4 - cornerSize, y + height - 4 - cornerSize, cornerSize, 'br');
    }

    drawPixelCorner(x, y, size, position) {
        const pattern = [
            [1,1,0],
            [1,0,1],
            [0,1,1]
        ];
        
        pattern.forEach((row, i) => {
            row.forEach((pixel, j) => {
                if (pixel) {
                    let px = x + (position.includes('r') ? size - j * 4 : j * 4);
                    let py = y + (position.includes('b') ? size - i * 4 : i * 4);
                    this.ctx.fillRect(px, py, 2, 2);
                }
            });
        });
    }

    wrapPixelText(text, x, y, maxWidth) {
        const words = text.split(' ');
        let line = '';
        let lineHeight = 16;

        for (let word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                this.ctx.fillStyle = '#5C4033'; // Brown text
                this.ctx.fillText(line, x, y);
                line = word;
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillStyle = '#5C4033'; // Brown text
        this.ctx.fillText(line, x, y);
    }

    drawGamePanel() {
        const panel = this.gamePanel;
        const x = panel.x;
        const y = panel.y;
        const width = panel.width;
        const height = panel.height;

        // Draw traditional paper background
        this.ctx.fillStyle = '#F4E4BC';
        this.ctx.fillRect(x, y, width, height);

        // Draw pixel perfect border and decorations
        this.drawPixelBorder(x, y, width, height);
        this.drawCornerDecorations(x, y, width, height);

        let currentY = y + 25;

        // Draw sections
        panel.sections.forEach((section, index) => {
            // Section title with traditional decoration
            this.ctx.fillStyle = '#8B4513';
            this.ctx.font = 'bold 16px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            
            // Draw title
            this.ctx.fillText(section.title, x + width/2, currentY);
            currentY += 25;

            // Draw horizontal line after the title (not before)
            this.ctx.fillRect(x + 15, currentY - 5, width - 30, 2);
            
            // Draw stats with pixel perfect bars
            section.stats.forEach(stat => {
                this.ctx.font = '12px "Press Start 2P"';
                this.ctx.fillStyle = '#5C4033';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(stat.label, x + 15, currentY + 15);

                if (stat.max) {
                    // Draw pixel perfect progress bar
                    const barWidth = width - 45;
                    const barHeight = 8;
                    const barX = x + 15;
                    const barY = currentY + 20;

                    // Bar background (pixel pattern)
                    this.ctx.fillStyle = '#D3D3D3';
                    for (let i = 0; i < barWidth; i += 2) {
                        this.ctx.fillRect(barX + i, barY, 1, barHeight);
                    }

                    // Progress
                    const progress = Math.min(1, stat.value / stat.max);
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

                    // Pixel perfect border
                    this.ctx.strokeStyle = '#5C4033';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
                }

                const valueText = stat.unit ? 
                    `${stat.value}${stat.unit}` : 
                    `${stat.value}/${stat.max}`;
                this.ctx.textAlign = 'right';
                this.ctx.fillText(valueText, x + width - 15, currentY + 15);

                currentY += 35;
            });

            currentY += 10;
        });
    }

    findNearestShrine() {
        let nearest = null;
        let shortestDistance = 150;

        this.shrines.forEach(shrine => {
            const dx = (this.player.x + this.player.width/2) - (shrine.x + shrine.width/2);
            const dy = (this.player.y + this.player.height/2) - (shrine.y + shrine.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearest = shrine;
            }
        });

        return nearest;
    }

    handleJump() {
        if (this.player.jumpCount < this.player.maxJumps) {
            this.player.velocityY = this.physics.jumpForce;
            this.player.isJumping = true;
            this.player.isGrounded = false;
            this.player.jumpCount++;
        }
    }

    update(timestamp) {
        if (!this.meditation.active && !this.offeringAnimation.active) {
            this.updatePlayerPosition();
            this.updatePlayerPhysics();
        }
        this.updateCamera();
        this.checkNPCInteraction();
        this.checkDojoInteraction();
        this.checkShrineInteraction();
        this.updateMeditation(timestamp);
        this.updateOfferingAnimation();
        this.updateUI();
        this.updateQuest();
        
        // Update animation frame
        if (timestamp - this.lastFrameTime > this.animationSpeed) {
            if (!this.meditation.active) {
                const animation = this.animations[this.player.state];
                this.currentFrame = (this.currentFrame + 1) % animation.frames;
            }
            
            // Update NPCs
            this.npcs.forEach(npc => {
                npc.frame = (npc.frame + 1) % 4;
            });
            
            this.lastFrameTime = timestamp;
        }
    }
    
    updateUI() {
        // Draw the yin yang meter
        this.drawYinYangMeter();
        
        // Draw the control guide
        this.drawControlGuide();

        // Draw the game panel
        if (this.gamePanel) {
            this.drawGamePanel();
        }
    }
    
    drawYinYangMeter() {
        const { size, x, y, progress } = this.yinYangMeter;
        const centerX = x + size/2;
        const centerY = y + size/2;
        const radius = size/2;

        // Draw outer circle background
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#2A4858';
        this.ctx.fill();
        this.ctx.strokeStyle = '#90A955';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Only draw the symbol if there's any progress
        if (progress > 0) {
            // Save context for clipping
            this.ctx.save();
            
            // Create clipping path based on progress
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + (2 * Math.PI * progress));
            this.ctx.closePath();
            this.ctx.clip();

            // Draw the complete yin-yang symbol
            // White half
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, Math.PI/2, -Math.PI/2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fill();

            // Black half
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, -Math.PI/2, Math.PI/2);
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();

            // White swirl
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY - radius/2, radius/2, -Math.PI/2, Math.PI/2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fill();

            // Black swirl
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY + radius/2, radius/2, Math.PI/2, -Math.PI/2);
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();

            // Small black dot
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY - radius/2, radius/8, 0, Math.PI * 2);
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();

            // Small white dot
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY + radius/2, radius/8, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fill();

            // Restore context
            this.ctx.restore();
        }

        // Draw border again to ensure it's always visible
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#90A955';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    drawControlGuide() {
        this.ctx.save();

        // Update position based on current window width
        this.controlGuide.x = this.canvas.width - 200;

        // Draw background
        this.ctx.fillStyle = 'rgba(42, 72, 88, 0.8)';  // Match game's color scheme
        this.ctx.fillRect(
            this.controlGuide.x,
            this.controlGuide.y,
            this.controlGuide.width,
            this.controlGuide.controls.length * 25 + 20  // Height based on number of controls
        );

        // Draw border
        this.ctx.strokeStyle = '#90A955';  // Sage green border
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.controlGuide.x,
            this.controlGuide.y,
            this.controlGuide.width,
            this.controlGuide.controls.length * 25 + 20
        );

        // Draw controls
        this.controlGuide.controls.forEach((control, index) => {
            const y = this.controlGuide.y + 20 + (index * 25);
            
            // Draw key background
            this.ctx.fillStyle = '#90A955';  // Sage green for key background
            this.ctx.fillRect(
                this.controlGuide.x + 10,
                y - 10,
                60,
                20
            );

            // Draw key text
            this.ctx.font = '12px monospace';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                control.key,
                this.controlGuide.x + 40,
                y + 4
            );

            // Draw action text
            this.ctx.font = '12px Cinzel';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                control.action,
                this.controlGuide.x + 80,
                y + 4
            );
        });

        this.ctx.restore();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky
        this.drawSky();

        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw regular buildings (excluding shrines)
        this.buildings.filter(b => !b.type || b.type !== 'shrine').forEach(building => this.drawBuilding(building));

        // Draw ground
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(0, this.map.ground.y, this.map.width, this.map.ground.height);

        // Draw forest
        this.drawForest();

        // Draw decorative elements on ground
        this.drawGroundDecorations();

        // Draw shrines after forest to ensure visibility
        this.buildings.filter(b => b.type === 'shrine').forEach(building => this.drawBuilding(building));

        // Draw NPCs and player
        this.drawCharacters();

        // Restore context
        this.ctx.restore();

        // Draw UI elements (in screen space)
        this.updateUI();
        this.drawQuestIndicator();

        // Draw interaction prompt and dialogue
        this.drawInteractionPrompt();
        this.drawDialogue();

        // Draw meditation effects and prompts
        this.drawMeditationEffects();
        this.drawDojoPrompt();

        // Draw offering animation on top of everything
        this.drawOfferingAnimation();
    }
    
    drawGroundDecorations() {
        // Draw small square stones
        for (let x = 20; x < this.map.width; x += 200) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(x - 2, this.map.ground.y - 7, 4, 4);
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

    drawForest() {
        if (!this.treeSprite || !this.treeSprite.complete) {
            console.log('Tree sprite not ready');
            return;
        }

        // Draw trees first (so they appear behind logs)
        this.forest.trees.forEach(tree => {
            this.ctx.drawImage(
                this.treeSprite,
                tree.x,
                tree.y,
                tree.width,
                tree.height
            );
        });

        // Draw logs on top of trees
        if (this.logSprite && this.logSprite.complete) {
            this.forest.logs.forEach(log => {
                this.ctx.save();
                // Translate to log center for rotation
                this.ctx.translate(log.x + log.width/2, log.y + log.height/2);
                this.ctx.rotate(log.rotation);
                // Draw log centered at rotation point
                this.ctx.drawImage(
                    this.logSprite,
                    -log.width/2, -log.height/2,
                    log.width, log.height
                );
                this.ctx.restore();
            });
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