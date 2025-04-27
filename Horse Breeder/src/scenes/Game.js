import HorseType from '../consts/HorseType.js';
import { Horse } from '../sprites/Horse.js';
import { CloudySky } from '../utils/CloudySky.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    preload() {
    }

    create() {

        // Game stats

        this.breederName = "Player";
        this.breederLevel = 1;

        this.stable = [];
        this.dropCount = 0;

        this.spriteGroup = this.add.group({runChildUpdate:true});

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

        this.time.addEvent({
            delay: 1000,
            callback: this.spawnLogic,
            callbackScope: this,
            loop: true
        });

        // Background clouds

        this.cloudManager = new CloudySky(this, ['cloud1', 'cloud2', 'cloud3'], 3000); // Adjust keys and interval

        // Create the first horse sprite using the new function

        for (let i =0; i<4; i++) {
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

        // Make the horse draggable and handle the drop event
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.setPosition(dragX, dragY);
            gameObject.setVelocityX(0);
            gameObject.setFrame(0);
            gameObject.stop();

            canvas.classList.remove("hand-open");
            canvas.classList.add("hand-fist");
        });
        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.play(`horse-color-${gameObject.colNum}-walk`);
            this.handleHorseDrop(gameObject, house);
            
            canvas.classList.remove("hand-fist");
            canvas.classList.add("hand-open");
        });
    }

    update() {
        this.cloudManager.update();
    }

    handleHorseDrop(horse, house) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(
            horse.getBounds(),
            house.getBounds()
        )) {
            
            this.stable.push(horse.type);
            horse.input.draggable = false;
            horse.destroy();

            if (this.stable.length === 1) {
                house.setFrame('stable_left');
            }
            else if (this.stable.length === 2) {
                house.setFrame('stable_closed');
                this.breedLogic();
            }
        }
        else {
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

    spawnLogic() {
        if (this.spriteGroup.countActive() < 8) {
            const lv = Phaser.Math.Between(1, this.breederLevel);
            const type = this.getHorseTypeByLevel(lv);
            const startY = Phaser.Math.Between(210, 222);
            const horse = new Horse(this, 0, startY, type);
            horse.init(64);
            this.spriteGroup.add(horse);
        }
    }

    breedLogic() {
        
        const type1 = this.stable[0].level;
        const type2 = this.stable[1].level;
        this.stable.length = 0;

        const res = Math.abs(type1 - type2);
        let breededLv;

        // Successful breed for new type
        if (res === 1) {
            const higher = Math.max(type1, type2);
            const newLv = higher + 1;
            this.breederLevel = Math.max(this.breederLevel, newLv);
            breededLv = newLv;
        }
        else if (type1 === 1 && type2 === 1) {
            breededLv = 2;
        }
        else if (type1 === 9 && type2 === 9) {
            breededLv = 10;
        }
        else {
            breededLv = Math.max(type1, type2);
        }

        const newType = this.getHorseTypeByLevel(breededLv);
        this.breedHorse(80, 194, newType);
        this.breedHUD();
    }

    breedHorse(x, y, type) {
        const horse = new Horse(this, x, y, type);
        horse.init(16);
        horse.playWalk();
        this.spriteGroup.add(horse);
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
            duration: 7000,
            ease: 'Linear',

            onUpdate: function (tween) {
                const currentProgress = tween.getValue(); // Gets the current value between 0 and 100
                fill.style.width = Math.max(0, Math.min(100, currentProgress)) + '%';
            },

            onComplete: function (tween) {
                container.classList.add('nodisplay');
                fill.style.width = '0%';
            },
            onCompleteScope: this,
            onUpdateScope: this
        });
    }
}