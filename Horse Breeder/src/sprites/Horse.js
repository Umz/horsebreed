let UID = 1;

export class Horse extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, horseType) {
        super(scene, x, y, `horse-color-${horseType.sheet}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.uid = UID ++;

        const maxTame = horseType.level * 10;
        this.tame = Phaser.Math.Between(maxTame - 10, maxTame);
        this.horseName = horseType.name;
        this.calm = Phaser.Math.Between(45, 60);
        this.sex =  Phaser.Math.Between(1, 2);

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
        const currentVelocityX = this.body.velocity.x;

        if (!this.isTweeningFlip) {
            if (currentVelocityX < 0 && this.flipX) {
                this.startFlipTween(false); // Moving left, currently facing right
            } else if (currentVelocityX > 0 && !this.flipX) {
                this.startFlipTween(true);  // Moving right, currently facing left
            }
        }

        this.setDepth(this.getBottomCenter().y);

        // Check if the horse has moved off-screen
        if (this.x < -this.width / 2) {
            this.x = this.scene.scale.width + this.width / 2;
        } else if (this.x > this.scene.scale.width + this.width / 2) {
            this.x = -this.width / 2;
        }
    }

    setDragging() {
    }

    stopDrag() {
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