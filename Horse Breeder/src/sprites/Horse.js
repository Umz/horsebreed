let UID = 1;

export class Horse extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, horseType) {
        super(scene, x, y, `horse-color-${horseType.sheet}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.uid = UID ++;

        const maxTame = horseType.level * 5;
        this.tame = Math.max(1, Phaser.Math.Between(maxTame - 10, maxTame));
        this.horseName = horseType.name;
        this.calm = Phaser.Math.Between(5, 20);
        this.sex =  Phaser.Math.Between(1, 2);

        this.calm = 100;

        this.type = horseType;
        this.colNum = horseType.sheet;
        this.setInteractive({ draggable: true });
        this.init();
        this.isTweeningFlip = false;

        this.playRun();
    }

    init(velX) {
        this.setVelocityX(velX);
        this.setFlipX(velX > 0); // Flip based on initial direction
    }

    update(_, delta) {

        const velocityX = this.body.velocity.x;

        if (!this.isTweeningFlip) {
            if (velocityX < 0 && this.flipX) {
                this.startFlipTween(false); // Moving left, currently facing right
            } else if (velocityX > 0 && !this.flipX) {
                this.startFlipTween(true);  // Moving right, currently facing left
            }
        }

        this.setDepth(this.getBottomCenter().y);

        // Check if the horse has moved off-screen
        if ((this.x < -this.width / 2) && velocityX < 0) {
            this.destroy(true);
        } else if ((this.x > this.scene.scale.width + this.width / 2) && velocityX > 0) {
            this.destroy(true);
        }
    }

    setDragging() {
    }

    stopDrag() {
    }

    getShadowColour() {
        const calm = this.calm;
        if (calm >= 0 && calm <= 20) {
            return {col: 0x000000, alpha: .3};
        } else if (calm > 20 && calm <= 40) {
            return {col: 0x888888, alpha: .4};
        } else if (calm > 40 && calm <= 60) {
            return {col: 0x0D78F1, alpha: .5};
        } else if (calm > 60 && calm <= 80) {
            return {col: 0xCE1616, alpha: .6};
        } else {
            return {col: 0xDF0DDF, alpha: .7};
        }
    }

    getCalmState() {

        const calm = this.calm;
        if (calm >= 0 && calm <= 20) {
            return "Fleeing";
        } else if (calm > 20 && calm <= 40) {
            return "Anxious";
        } else if (calm > 40 && calm <= 60) {
            return "Calm";
        } else if (calm > 60 && calm <= 80) {
            return "Happy";
        } else {
            return "Ready";
        }
    }

    startFlipTween(shouldFlipX) {
        this.isTweeningFlip = true;
        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            duration: 150, // Adjust duration as needed
            ease: 'Linear',
            onComplete: () => {
                this.setFlipX(shouldFlipX);
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    duration: 150, // Match the first duration
                    ease: 'Linear',
                    onComplete: () => {
                        this.isTweeningFlip = false;
                    }
                });
            }
        });
    }

    playRun() {
        this.play(`horse-color-${this.colNum}-run`);
    }

    playWalk() {
        this.play(`horse-color-${this.colNum}-walk`);
    }
}