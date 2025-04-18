import { Game } from './scenes/Game.js';
import { Preload } from './scenes/Preload.js';

const config = {
    type: Phaser.AUTO,
    title: 'Horse Breeding',
    description: 'Breed horses to create pure colours.',
    parent: 'game-container',
    width: 640,
    height: 320,
    backgroundColor: '#ADD8E6',
    pixelArt: true,
    scene: [
        Preload,
        Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        gravity: { y: 0 },
        arcade: {
            debug: false
        }
    }
}

new Phaser.Game(config);
            