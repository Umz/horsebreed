import HorseType from '../consts/HorseType.js';
import { Horse } from '../sprites/Horse.js';

export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    preload() {
    }

    create() {

        //  Game stats

        this.breederName = "Player";
        this.breederLevel = 1;

        this.stable = [];
        this.dropCount = 0;

        this.spriteGroup = this.add.group({runChildUpdate:true});

        const bg = this.add.image(320, 160, 'bg');

        // Create the house sprite
        const house = this.add.sprite(20, 190, "atlas", "stable").setOrigin(0, 1).setDepth(175);

        this.time.addEvent({
            delay: 1000,
            callback: this.spawnLogic,
            callbackScope: this,
            loop: true
        });

        // Create the first horse sprite using the new function

        for (let i =0; i<4; i++) {
            const startX = Phaser.Math.Between(0, 640);
            const startY = 216; // Keeping the y-coordinate the same for now
            const randomVelocity = Phaser.Math.RND.pick([-64, 64]);
            const horse = new Horse(this, startX, startY, HorseType.BROWN_BROWN);
            horse.init(randomVelocity);
            this.spriteGroup.add(horse);
        }

        // Make the horse draggable and handle the drop event
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.setPosition(dragX, dragY);
            gameObject.setVelocityX(0);
            gameObject.setFrame(0);
            gameObject.stop();
        });
        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.play(`horse-color-${gameObject.colNum}-walk`);
            this.handleHorseDrop(gameObject, house);
        });
    }

    update() {
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

        const newMaxLevel = type1 + type2;
        this.breederLevel = Math.max(this.breederLevel, newMaxLevel);

        const newType = this.getHorseTypeByLevel(newMaxLevel);
        this.breedHorse(80, 194, newType);
    }

    breedHorse(x, y, type) {
        const horse = new Horse(this, x, y, type);
        horse.init(16);
        horse.playWalk();
        this.spriteGroup.add(horse);
    }
}