import HorseState from "../consts/HorseState.js"

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

        this.state = HorseState.WILD;

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

        this.setDepth(this.getBottomCenter().y);

        const velocityX = this.body.velocity.x;

        if (!this.isTweeningFlip) {
            if (velocityX < 0 && this.flipX) {
                this.startFlipTween(false); // Moving left, currently facing right
            } else if (velocityX > 0 && !this.flipX) {
                this.startFlipTween(true);  // Moving right, currently facing left
            }
        }

        //  State switching
        const speed = Math.abs(this.body.velocity.x);
        if (speed < 64 && speed > 0) {

            this.calm = Math.max(0, this.calm - (delta * .001) * 2);

            // CALM
            this.pacing();

            if (this.calm <= 0) {
                this.escaping();
            }
        }

        // Check if the horse has moved off-screen
        if ((this.x < -this.width / 2) && velocityX < 0) {
            this.destroy(true);
        } else if ((this.x > this.scene.scale.width + this.width / 2) && velocityX > 0) {
            this.destroy(true);
        }
    }

    pacing() {

        const min = this.scene.scale.width * .35;
        const max = this.scene.scale.width * .85;
        const velX = this.body.velocity.x;

        if (this.x >= max && velX > 0) {
            this.setVelocityX(velX * -1);
        }
        else if (this.x <= min && velX < 0) {
            this.setVelocityX(velX * -1);
        }
    }

    escaping() {
        const speed = Math.abs(this.body.velocity.x);
        if (speed < 64) {
            this.body.velocity.x *= 5;
            this.playRun();
        }
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