export class CloudySky {

    constructor(scene, cloudKeys = ['cloud1', 'cloud2', 'cloud3'], spawnIntervalMs = 1000) {
        this.scene = scene;
        this.clouds = scene.add.group();
        this.cloudTextureKeys = cloudKeys;
        this.spawnInterval = spawnIntervalMs;
        this.startSpawning();
    }

    startSpawning() {
        
         // Spawn low clouds every 500 ms
        this.scene.time.addEvent({
            delay: 1000,
            callback: this.spawnLow,
            callbackScope: this,
            loop: true,
        });

        // Spawn high front clouds every 3 seconds
        this.scene.time.addEvent({
            delay: 15000,
            callback: this.spawnHighFront,
            callbackScope: this,
            loop: true,
        });

        // Spawn high back clouds every 1.5 seconds
        this.scene.time.addEvent({
            delay: 5000,
            callback: this.spawnHighBack,
            callbackScope: this,
            loop: true,
        });

        this.initClouds();
        this.spawnClouds();
    }

    stopSpawning() {
        if (this.timer) {
            this.timer.remove();
            this.timer = null;
        }
    }

    initClouds() {

        for (let i=0; i<30; i++) {
            const startX = Phaser.Math.Between(0, 640);
            let lowCloud = this.spawnCloud(260, 320, 10, 20, 320, .85, false);
            lowCloud.setX(startX);
        }

        for (let i=0; i<3; i++) {
            const startX = Phaser.Math.Between(0, 640);
            let highCloud = this.spawnCloud(40, 140, 40, 50, 320, .85, false);
            highCloud.setX(startX);
        }

        for (let i=0; i<3; i++) {
            const startX = Phaser.Math.Between(0, 640);
            let lowCloud = this.spawnCloud(0, 100, 20, 30, 1, 1, false);
            lowCloud.setX(startX);
        }
    }

    spawnClouds() {
        this.spawnHighFront();
        this.spawnHighBack();
        this.spawnLow();
    }

    spawnHighFront() {
        this.spawnCloud(50, 150, 40, 50, 320, .85);
    }

    spawnHighBack() {
        this.spawnCloud(0, 100, 20, 30, 1, 1);
    }

    spawnLow() {
        const depth = Phaser.Utils.Array.GetRandom([1, 320]);
        this.spawnCloud(260, 320, 10, 20, depth, .85);
    }

    update() {
        this.clouds.getChildren().forEach(cloud => {
            if (cloud.x > this.scene.scale.width + cloud.width / 2) {
                this.clouds.remove(cloud, true, true);
            }
        });
    }

    destroy() {
        this.stopSpawning();
        this.clouds.destroy(true, true);
    }

    //  -

    spawnCloud(startYMin, startYMax, speedMin, speedMax, depth = 320, alpha = 0.9, fade=true) {

        const startX = -Phaser.Math.Between(50, 100);
        const startY = Phaser.Math.Between(startYMin, startYMax);
        const randNum = Phaser.Math.Between(1, 9);
        const cloud = this.scene.physics.add.sprite(startX, startY, 'atlas', `cloud${randNum}`);
        cloud.setDepth(depth);
        cloud.setAlpha(alpha);

        this.clouds.add(cloud);
        const speed = Phaser.Math.FloatBetween(speedMin, speedMax);
        cloud.setVelocityX(speed);

        if (fade) {
            this.scene.tweens.add({
                targets: cloud,
                alpha: {from:0, to:alpha},
                duration: 2000,
                ease: 'Linear'
            });
        }

        return cloud;
    }
}
