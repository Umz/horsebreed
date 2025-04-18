
export class Horse extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, horseType) {
        super(scene, x, y, `horse-color-${horseType.sheet}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.type = horseType;
        this.colNum = horseType.sheet;
        this.setInteractive({ draggable: true });
        this.init(); // Call the init function when the horse is created
        this.isTweeningFlip = false;

        this.playRun();
    }

    init(velX) {
        this.setVelocityX(velX);
        this.setFlipX(velX > 0); // Flip based on initial direction
    }

    update() {
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