import HorseType from '../consts/HorseType.js';
import Sfx from "../consts/Sfx.js";
import { Horse } from '../sprites/Horse.js';
import { CloudySky } from '../utils/CloudySky.js';
import { Notification } from '../utils/Notification.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    preload() {
        // Session data
    }

    create() {

        const music = this.sound.add(Sfx.BG);
        music.play({loop:true});

        // Game stats

        this.breederName = "Player";
        this.breederLevel = 1;
        this.bredHorses = 0;
        this.trainedHorses = 0;   // ITCN value

        this.updatePlayerDOM();

        this.captured = [];
        this.grabbed = null;
        this.isGrabbing = false;
        this.firstGrab = true;

        //this.breedTime = 7000;
        //this.breedDelay = 3000;
        this.breedTime = 1000;
        this.breedDelay = 3000;
        this.isStableReady = true;

        this.stable = [];
        this.dropCount = 0;

        this.spriteGroup = this.add.group({runChildUpdate:true});
        this.feedGroup = this.add.group();

        //  Graphics tools

        this.staticShadows = this.add.graphics().setDepth(6);
        this.horseShadows = this.add.graphics().setDepth(7);

        // Create the scene

        const sky = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'sky').setOrigin(0);
        const moon = this.add.image(370, 90, 'moon').setAlpha(.4);
        const mount = this.add.image(-20, 0, 'mountain').setOrigin(0);
        const ground = this.add.image(320, 160, 'ground').setDepth(5);

        // Add other elements

        const silo = this.add.sprite(80, 190, "atlas", "silo").setOrigin(0, 1).setDepth(170);
        const trough = this.add.sprite(120, 190, "atlas", "trough").setOrigin(0, 1).setDepth(170);
        const hay = this.add.sprite(220, 186, "atlas", "hay").setOrigin(0, 1).setDepth(170);
        const cart = this.add.sprite(300, 186, "atlas", "cart").setOrigin(0, 1).setDepth(170);
        const fence = this.add.sprite(30, 222, "atlas", "fence").setOrigin(0, 1).setDepth(222);

        const tree21 = this.add.sprite(500, 182, "atlas", "tree2").setOrigin(0, 1).setDepth(170);
        const tree11 = this.add.sprite(540, 186, "atlas", "tree1").setOrigin(0, 1).setDepth(171);
        const tree12 = this.add.sprite(560, 184, "atlas", "tree1").setOrigin(0, 1).setDepth(170);

        // Create the house sprite
        const house = this.add.sprite(20, 190, "atlas", "stable").setOrigin(0, 1).setDepth(175);
        this.stableSprite = house;

        const stableBounds = this.stableSprite.getBounds();
        const topEdgeRect = new Phaser.Geom.Rectangle(
            stableBounds.x,
            stableBounds.y, // Top of the sprite
            stableBounds.width,
            1
        );

        const emitZoneConfig = {
            type: 'random', // 'edge' is for emitting along the perimeter. 'random' for anywhere within the source.
                            // If you want strictly the top line, 'random' with a thin rectangle is better.
                            // If 'edge' is desired, it will emit from all 4 edges of the rectangle.
            source: topEdgeRect,
            // quantity: 42 // Quantity for burst emission, not continuous.
        };

        const emitter = this.add.particles(0, 0, 'heart', {
            speedY: { min: -50, max: -150 },
            speedX: { min: -20, max: 20 },
            gravityY: -30,
            lifespan: 1000,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            frequency: 200, // Continuous emission: 2 particles per second
            emitting: false, // Start with emitter off, you can turn it on later with emitter.start()
            emitZone: emitZoneConfig,
        });
        emitter.setDepth(180);
        this.breedEmitter = emitter;

        this.grabEmitter = this.add.particles(
            0,
            0,
            'star',
            {
                speed: 100,
                angle: { min: 0, max: 360 },
                lifespan: 1000,
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 },
                frequency: 250,
                emitting: false,
            }
        );
        this.grabEmitter.setDepth(200);

        this.pixelExplosionEmitter = this.add.particles(0, 0, 'redPixel', {
            speed: { min: 20, max: 100 }, // Speed for the pixels to spread out
            angle: { min: 0, max: 360 }, // Emit in all directions
            gravityY: 300, // Pixels fall downwards over time
            lifespan: 800, // Pixels disappear quickly
            scale: { start: 1, end: 0 }, // Pixels shrink as they disappear
            alpha: { start: 1, end: 0 }, // Pixels fade out
            quantity: 10, // Number of pixels in one explosion
            emitting: false, // Emitter starts off, will be triggered by collision
            blendMode: 'NORMAL', // Or 'ADD' for a brighter effect
        });
        this.pixelExplosionEmitter.setDepth(320); // Ensure it's visible above other elements

        //  ------

        const top = house.getTopCenter();
        const ele = document.getElementById("id-bbar");
        const fillDom = this.add.dom(top.x, top.y, ele);
        fillDom.setDepth(120);
        fillDom.setPosition(top.x + fillDom.width * .3, top.y + 40);

        // Draw shadows of all sprites

        this.staticShadows.lineStyle(1, 0x000000, 0.3); // Set line style once

        // Define the array of sprites that need static shadows using an array literal
        const shadowedSprites = [
            silo,
            trough,
            hay,
            cart,
            fence,
            tree21,
            tree11,
            tree12,
            house // Include house here
        ];

        // Loop through the array and draw shadows for each sprite
        shadowedSprites.forEach(sprite => {
            const bounds = sprite.getBounds();

            // Draw the three horizontal lines beneath the sprite's bottom edge
            this.staticShadows.lineBetween(bounds.left + 2, bounds.bottom - 1, bounds.right - 2, bounds.bottom - 1);
            this.staticShadows.lineBetween(bounds.left, bounds.bottom, bounds.right, bounds.bottom);
            this.staticShadows.lineBetween(bounds.left + 3, bounds.bottom + 1, bounds.right - 3, bounds.bottom + 1);
        });

        // Spawning

        this.time.addEvent({
            delay: 3000,
            callback: this.spawnLogic,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 3000,
            callback: this.spawnFeed,
            callbackScope: this,
            loop: true
        });

        // Background clouds

        this.cloudManager = new CloudySky(this, ['cloud1', 'cloud2', 'cloud3'], 3000); // Adjust keys and interval

        // Create the first horse sprite using the new function

        for (let i =0; i<6; i++) {
            const startX = Phaser.Math.Between(0, 640);
            const startY = 216; // Keeping the y-coordinate the same for now
            const randomVelocity = Phaser.Math.RND.pick([-64, 64]);
            const horse = new Horse(this, startX, startY, HorseType.BROWN_BROWN);
            horse.init(randomVelocity);
            this.spriteGroup.add(horse);
        }

        //const canvas = this.game.canvas;
        const canvas = document.getElementById('game-container');
        canvas.classList.add("hand-open");

        //  ---------------------------------------------------------------------------------------

        // Make the horse draggable and handle the drop event
        this.input.on('drag', (pointer, sprite, dragX, dragY) => {

            sprite.setPosition(dragX, dragY);
            this.handleDrag(sprite);
            this.firstGrab = false;

            canvas.classList.remove("hand-open");
            canvas.classList.add("hand-fist");
        });
        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.play(`horse-color-${gameObject.colNum}-walk`);
            this.handleHorseDrop(gameObject, house);
            
            canvas.classList.remove("hand-fist");
            canvas.classList.add("hand-open");

            this.grabEmitter.stop();
        });

        this.spawnFeed();
    }

    update(_, delta) {
        this.cloudManager.update();

        if (this.isGrabbing) {
            this.updateDOM(this.grabbed);
        }

        this.horseShadows.clear();
        const sprites = this.spriteGroup.getChildren();
        for (let sprite of sprites) {
            const bounds = sprite.getBounds();
            const velX = Math.abs(sprite.body.velocity.x);
            if (velX > 60) {
                this.horseShadows.fillStyle(0x000000, .3);
                this.horseShadows.fillEllipse(bounds.centerX, bounds.bottom - 1, bounds.width, 4);
            }
            else if (velX > 0) {

                const shadow = sprite.getShadowColour();

                this.horseShadows.fillStyle(shadow.col, shadow.alpha);
                this.horseShadows.fillEllipse(bounds.centerX, bounds.bottom - 1, bounds.width, 4);

                if (sprite.calm >= 80) {
                    this.horseShadows.lineStyle(1, 0xffffff, shadow.alpha);
                    this.horseShadows.strokeEllipse(bounds.centerX, bounds.bottom - 1, bounds.width, 4);
                }
            }
        }

        const feeds = this.feedGroup.getChildren();
        for (let sprite of feeds) {
            const bounds = sprite.getBounds();
            this.horseShadows.fillStyle(0x000000, .3);
            this.horseShadows.fillEllipse(bounds.centerX, bounds.bottom - 1, bounds.width, 4);
        }
    }

    //  - DOM

    updateDOM(sprite) {

        const horseProfileElement = document.getElementById('horse-profile-1');
        const nameElement = horseProfileElement.querySelector('.horse-stats p:first-child');
        if (nameElement) {
            const sex = sprite.sex === 1 ? '(M)' : '(F)';
            nameElement.innerHTML = `${sprite.horseName} <span class="sex">${sex}</span>`;
        }

        // Update the tame percentage
        const tameElement = horseProfileElement.querySelector('.horse-stats p:nth-child(2)');
        if (tameElement) {
            tameElement.textContent = `${sprite.tame}% tame`;
        }

        // Update the calm state (assuming getCalmState() returns a string)
        const stateElement = horseProfileElement.querySelector('.horse-stats p.horse-state');
        if (stateElement) {
            stateElement.textContent = `${sprite.getCalmState()}:`;
        }

        const fillElement = horseProfileElement.querySelector('div.horse-stat-fill');
        if (fillElement) {
            fillElement.style.width = `${sprite.calm}%`;
        }

        const top = this.stableSprite.getTopCenter();
        const ele = document.getElementById("id-bbar");
        const fillDom = this.add.dom(top.x, top.y, ele);
        fillDom.setDepth(120);
        fillDom.setPosition(top.x + fillDom.width * .3, top.y + 40);
    }

    updatePlayerDOM() {
        
        const nameElement = document.getElementById('player-name');
        const levelElement = document.getElementById('player-level');
        const bredElement = document.getElementById("player-bred");
        //const tamedElement = document.getElementById("player-tamed");

        nameElement.textContent = this.breederName;
        levelElement.textContent = `Lv. ${this.breederLevel}`;
        bredElement.textContent = `Bred: ${this.bredHorses}`;
        //tamedElement.textContent = `Tamed: ${this.tamedHorses}`;
    }

    //  - Sprites

    handleDrag(horse) {

        horse.setVelocityX(0);
        horse.setFrame(0);
        horse.stop();

        this.grabbed = horse;
        this.isGrabbing = true;

        if (this.firstGrab) {
            this.changeHorseProfile(horse.type);

            const profileElement = document.getElementById('horse-profile-1');
            profileElement.classList.remove("nodisplay");
            profileElement.classList.add("flex");

            this.grabEmitter.start();
            this.grabEmitter.startFollow(this.grabbed);

            this.sound.play(Sfx.GRAB, {volume:.2});
        }
    }

    handleHorseDrop(horse, house) {

        this.isGrabbing = false;
        this.firstGrab = true;

        const profileElement = document.getElementById('horse-profile-1');
        profileElement.classList.remove("flex");
        profileElement.classList.add("nodisplay");

        const isAvailable = this.stable.filter(h => h.sex === horse.sex).length === 0;
        const isReady = horse.calm >= 80;

        if (Phaser.Geom.Intersects.RectangleToRectangle(horse.getBounds(), house.getBounds()) && isAvailable && isReady && this.isStableReady) {
            
            const type = {...horse.type}
            type.sex = horse.sex;
            type.tame = horse.tame;

            const sexLtr = horse.sex === 1 ? 'M' : 'F'
            let stableMsg = `Put ${type.name} (${sexLtr}), ${horse.tame}% in stable`;
            Notification.AddNotice(stableMsg, "plain");

            this.stable.push(type);
            horse.input.draggable = false;
            horse.destroy();

            this.sound.play(Sfx.DOOR_SHUT);

            if (this.stable.length === 1) {
                if (horse.sex === 1) {
                    house.setFrame('stable_left');
                }
                else {
                    house.setFrame('stable_right');
                }
            }
            else if (this.stable.length === 2) {
                house.setFrame('stable_closed');
                this.breedLogic();
            }
        }
        else {

            if (this.captured.length < 4) {

                //this.captured.push(horse);
                horse.setVelocityX(-16);

                const bottomY = horse.getBottomCenter().y;
                const minY = 196, maxY = 220;

                if (bottomY > maxY) {
                    this.tweens.add({
                        targets: horse,
                        y: maxY - (horse.height / 2),
                        duration: 200,
                        ease: 'Linear'
                    });
                } else if (bottomY <= minY) {
                    this.tweens.add({
                        targets: horse,
                        y: minY - (horse.height / 2),
                        duration: 200,
                        ease: 'Linear'
                    });
                }

                // Feed group check 
                const isOverlappingFeed = this.feedGroup.getChildren().some(feedItem => {
                    return Phaser.Geom.Intersects.RectangleToRectangle(horse.getBounds(), feedItem.getBounds());
                });
                if (isOverlappingFeed) {

                    const overlappedFeedItem = this.feedGroup.getChildren().find(feedItem =>
                        Phaser.Geom.Intersects.RectangleToRectangle(horse.getBounds(), feedItem.getBounds())
                    );
                    this.pixelExplosionEmitter.explode(10, overlappedFeedItem.x, overlappedFeedItem.y);
                    overlappedFeedItem.destroy(true);

                    horse.calm = Math.min(100, horse.calm + 20);

                    
                    this.sound.play(Sfx.EAT, {volume:.4});
                    if (horse.calm >= 80) {
                        this.sound.play(Sfx.READY, {volume:.4});
                    }
                }
            }
            else {
                this.tweens.add({
                    targets: horse,
                    y: 234 - (horse.height / 2),
                    duration: 200,
                    ease: 'Linear'
                });
                horse.play(`horse-color-${horse.colNum}-run`);
                const randomVelocity = Phaser.Math.RND.pick([-96, 96]);
                horse.setVelocityX(randomVelocity);
            }
        }
    }

    getHorseTypeByLevel(level) {
        for (const key in HorseType) {
            if (HorseType.hasOwnProperty(key) && HorseType[key].level === level) {
                return HorseType[key];
            }
        }
        return HorseType.BROWN_BROWN;
    }

    isReqTameness(h1, h2, tameLv) {
        const max = Math.max(h1, h2);
        console.log("is tame enough", h1, h2, tameLv, (tameLv >= max * 10))
        return (tameLv >= max * 10);
    }

    spawnLogic() {
        if (this.spriteGroup.countActive() < 7) {
            const lv = Phaser.Math.Between(1, this.breederLevel);
            const type = this.getHorseTypeByLevel(lv);
            const startY = Phaser.Math.Between(210, 222);
            const startX = Phaser.Utils.Array.GetRandom([-80, this.scale.width + 80]);
            const initX = startX < 0 ? 64 : -64;

            const horse = new Horse(this, startX, startY, type);
            horse.init(initX);
            this.spriteGroup.add(horse);
        }
    }

    //  -
    spawnFeed() {
        if (this.feedGroup.countActive() < 3) {

            const width = this.scale.width;

            const startX = Phaser.Math.Between(width * .45, width * .86);
            const startY = Phaser.Math.Between(198, 216) - 8;

            const feed = this.add.sprite(startX, startY, "atlas", "feed");
            feed.setDepth(startY + 8);
            this.feedGroup.add(feed);
        }
    }

    //  -

    breedLogic() {
        
        const type1 = this.stable[0].level;
        const type2 = this.stable[1].level;

        const res = Math.abs(type1 - type2);
        const fullTame = this.stable[0].tame + this.stable[1].tame;
        const newTame = Math.min(100, fullTame);
        const isTameEnough = this.isReqTameness(type1, type2, newTame);

        let breededLv, isNewHorse;

        // Successful breed for new type
        if (isTameEnough) {
            if (res === 1) {
                const higher = Math.max(type1, type2);
                const newLv = higher + 1;
                this.breederLevel = Math.max(this.breederLevel, newLv);
                breededLv = newLv;
                isNewHorse = true;

                this.updatePlayerDOM();
            }
            else if (type1 === 1 && type2 === 1) {
                breededLv = 2;
                isNewHorse = true;
            }
            else if (type1 === 9 && type2 === 9) {
                breededLv = 10;
                isNewHorse = true;
            }
            else {
                breededLv = Math.max(type1, type2);
            }
        }
        else {
            breededLv = Math.max(type1, type2);
        }

        this.breedEmitter.start();
        this.breedHUD();
        this.time.addEvent({
            delay: this.breedTime,
            callback: ()=>{

                const newType = this.getHorseTypeByLevel(breededLv);
                this.breedHorse(80, 194, newType, newTame, isNewHorse);
                this.stable.length = 0;

                this.bredHorses ++;
                this.breedEmitter.stop();
            },
            callbackScope: this,
        });
        
    }

    breedHorse(x, y, type, tame, isNewType) {
        
        const horse = new Horse(this, x, y, type);
        horse.calm = 100;
        horse.tame = isNewType ? Math.round(tame * .5) : tame;

        horse.init(16);
        horse.playWalk();
        this.spriteGroup.add(horse);

        if (isNewType) {
            const typeMsg = `You have bred a ${type.name}`;
            Notification.AddNotice(typeMsg, "flashing");
            this.sound.play(Sfx.UNLOCK);
        }
        else {
            const sexLtr = horse.sex === 1 ? 'M' : 'F';
            const breedMsg = `Bred a ${type.name} (${sexLtr}) with ${horse.tame}% tameness`;
            Notification.AddNotice(breedMsg, "breed-notice");
            this.sound.play(Sfx.BORN);
        }
    }

    breedHUD() {

        const container = document.getElementById('breeding-bar-container');
        const bar = document.getElementById('id-bbar');
        const fill = document.getElementById('id-bfill');

        container.classList.remove('nodisplay');

        fill.style.width = '0%';
        const tweenProgress = { value: 0 };
        this.tweens.add({
            targets: tweenProgress,
            value: 100,
            duration: this.breedTime,
            ease: 'Linear',

            onUpdate: function (tween) {
                const currentProgress = tween.getValue(); // Gets the current value between 0 and 100
                fill.style.width = Math.max(0, Math.min(100, currentProgress)) + '%';
            },

            onComplete: (tween) => {
                container.classList.add('nodisplay');
                fill.style.width = '0%';

                this.stableRefresh();
            },
            onCompleteScope: this,
            onUpdateScope: this
        });
    }

    stableRefresh() {
        const stable = this.stableSprite;
        this.time.delayedCall(this.breedDelay, ()=>{
            this.isStableReady = true;
            stable.setFrame("stable");
        });
    }

    changeHorseProfile(horseType) {

        const c = document.getElementById("horse-canvas-1");
        const ctx = c.getContext("2d", {willReadFrequently:true});
        ctx.imageSmoothingEnabled = false;

        let palette = document.getElementById("horse-palette");
        let horseFace = document.getElementById("horse-head-image");

        ctx.clearRect(0, 0, 90, 80);
        ctx.drawImage(palette, 0, 0);

        const imageData = ctx.getImageData(0, 0, 44, 12);
        const data = imageData.data;
        const imageDataWidth = imageData.width

        // --- Code to extract colors ---

        // Define the structure of your palette colors based on description
        const columnWidth = 4; // pixels
        const colorSquareSize = 4; // pixels (height and width of a single color block)
        const colorsPerColumn = 3; // Number of unique colors stacked vertically in a column
        const numColumnsToExtract = 11; // You want to extract 3 columns

        let baseColors = [];
        let toColours = [];

        let pick = horseType.sheet;

        for (let i=0; i<colorsPerColumn; i++) {

            let startX = 0;
            let startY = i * colorSquareSize;

            // Calculate the index in the data array for the R component of the pixel
            // The formula is (y * image_width + x) * 4 for RGBA data
            const pixelIndex = (startY * imageDataWidth + startX) * 4;

            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            // data[pixelIndex + 3] would be the A (alpha) value if needed

            // Store the extracted color (e.g., as an object)
            const color = { r: r, g: g, b: b };
            baseColors.push(color);
        }

        for (let i=0; i<colorsPerColumn; i++) {

            let startX = pick * columnWidth;
            let startY = i * colorSquareSize;

            const pixelIndex = (startY * imageDataWidth + startX) * 4;

            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];

            // Store the extracted color (e.g., as an object)
            const color = { r: r, g: g, b: b };
            toColours.push(color);
        }

        ctx.clearRect(0, 0, 90, 80);
        ctx.drawImage(horseFace, 0, 0, 90, 80);

        // Get the image data for the area where the horseFace was drawn
        const horseFaceImageData = ctx.getImageData(0, 0, 90, 80);
        const horseFaceData = horseFaceImageData.data; // The pixel data array
        const horseFaceWidth = horseFaceImageData.width; // Should be 90
        const horseFaceHeight = horseFaceImageData.height; // Should be 80

        // --- Perform color replacement for all colors ---
        // Loop through every pixel in the horseFace data
        // The data array is [R, G, B, A, R, G, B, A, ...]
        for (let i = 0; i < horseFaceData.length; i += 4) {
            const r = horseFaceData[i];     // Red component of the current pixel
            const g = horseFaceData[i + 1]; // Green component
            const b = horseFaceData[i + 2]; // Blue component
            // horseFaceData[i + 3] is the Alpha component

            // Loop through each base color we want to replace
            for (let j = 0; j < colorsPerColumn; j++) {
                const colorToReplace = baseColors[j];
                const replacementColor = toColours[j];

                // Check if the current pixel's color matches the current base color
                // You might add a small tolerance here if needed
                if (r === colorToReplace.r && g === colorToReplace.g && b === colorToReplace.b) {
                    // If it matches, change the pixel's color to the corresponding replacement color
                    horseFaceData[i] = replacementColor.r;     // Set Red
                    horseFaceData[i + 1] = replacementColor.g; // Set Green
                    horseFaceData[i + 2] = replacementColor.b; // Set Blue
                    // Keep the original Alpha value

                    // Important: Once we've found a match and replaced the color,
                    // we can break out of this inner loop and move to the next pixel.
                    // A pixel should only match one color from the base palette set.
                    break;
                }
            }
            // If the inner loop finishes without finding a match, the pixel remains unchanged.
        }

        // Put the modified image data back onto the canvas
        ctx.putImageData(horseFaceImageData, 0, 0);
    }

}