export class Game extends Phaser.Scene {

    constructor() {
        super('Game');
    }

    preload() {
    }

    create() {
        console.log("Started game scene")
        const bg = this.add.image(320, 160, 'bg');

        const horseSprite = this.add.sprite(320, 216, 'horse-color-3');
        horseSprite.play('horse-color-3-run');
        horseSprite.setInteractive({ draggable: true});
        horseSprite.on('drag', (pointer, dragX, dragY) => horseSprite.setPosition(dragX, dragY));
        horseSprite.on('dragend', (pointer) => {
            horseSprite.play('horse-color-3-walk');
        });

        const sprite = this.add.sprite(400, 220, 'horse-color-9');
        sprite.play('horse-color-7-run');
        sprite.setInteractive({ draggable: true });
        sprite.on('drag', (pointer, dragX, dragY) => sprite.setPosition(dragX, dragY));
        sprite.on('dragend', (pointer) => {
            sprite.play('horse-color-7-walk');
        });

    }

    update() {
    }
    
}
