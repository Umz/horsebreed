export class Preload extends Phaser.Scene {

    constructor() {
        super('Preload');
    }

    preload() {

        //  Load the images
        this.load.image('bg', 'assets/bg-mock.png');

        // Load the palette image
        this.load.image('palette', 'assets/colour-pallette.png');

        // Load the horse base asset as a spritesheet
        this.load.spritesheet('horse-base', 'assets/horse-base.png', {
            frameWidth: 60,
            frameHeight: 33
        });
    }

    create() {
        // Get the textures from the texture manager
        const paletteTexture = this.textures.get('palette');
        const horseBaseTexture = this.textures.get('horse-base'); // Original spritesheet texture

        // --- Error Handling: Check if textures loaded ---
        if (paletteTexture.key === '__MISSING' || horseBaseTexture.key === '__MISSING') {
            console.error('Error: Palette or horse-base texture failed to load! Check asset paths and preload method.');
            return;
        }

        // Get the source image elements
        const paletteImage = paletteTexture.getSourceImage();
        const horseBaseImage = horseBaseTexture.getSourceImage(); // Full image of the original spritesheet

        // --- Create Temporary Canvas for Palette ---
        const tempPaletteCanvas = document.createElement('canvas');
        tempPaletteCanvas.width = paletteImage.width;
        tempPaletteCanvas.height = paletteImage.height;
        const tempPaletteContext = tempPaletteCanvas.getContext('2d', { willReadFrequently: true });

        if (!tempPaletteContext) {
            console.error('Error: Could not get 2D context from temporary palette canvas.');
            return;
        }
        tempPaletteContext.drawImage(paletteImage, 0, 0);

        // --- Palette Configuration ---
        const paletteColumns = 11;
        const paletteRows = 3;
        const paletteSquareWidth = paletteImage.width / paletteColumns;
        const paletteSquareHeight = paletteImage.height / paletteRows;

        // --- Function to get a color from the temporary palette canvas ---
        const getPaletteColor = (row, col) => {
            const x = col * paletteSquareWidth + paletteSquareWidth / 2;
            const y = row * paletteSquareHeight + paletteSquareHeight / 2;
            try {
                const pixelData = tempPaletteContext.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
                return Phaser.Display.Color.GetColor(pixelData[0], pixelData[1], pixelData[2]);
            } catch (e) {
                console.error(`Error getting palette color at row ${row}, col ${col} (coords ${x}, ${y}):`, e);
                return Phaser.Display.Color.GetColor(0, 0, 0);
            }
        };

        // Get the base horse colors from the first column (index 0) of the palette
        const baseColors = [];
        for (let i = 0; i < paletteRows; i++) {
            baseColors.push(getPaletteColor(i, 0));
            // console.log(`Base color ${i}:`, Phaser.Display.Color.ValueToColor(baseColors[i])); // Optional logging
        }

        // --- Generate Recolored Horse Spritesheets & Animations ---

        // Iterate through the palette columns (starting from the second column, index 1)
        for (let col = 1; col < paletteColumns; col++) {
            const newTextureKey = `horse-color-${col}`;

            if (this.textures.exists(newTextureKey)) {
                console.warn(`Texture ${newTextureKey} already exists. Skipping creation.`);
                continue;
            }

            // Create a new canvas texture in Phaser for the recolored spritesheet
            const newTexture = this.textures.createCanvas(newTextureKey, horseBaseImage.width, horseBaseImage.height);
            if (!newTexture) {
                console.error(`Failed to create canvas texture: ${newTextureKey}`);
                continue;
            }
            const newTextureContext = newTexture.context;

            // Draw the original horse base spritesheet image onto the new texture's canvas
            newTextureContext.drawImage(horseBaseImage, 0, 0);

            // Get the pixel data of the newly drawn spritesheet image
            let newTextureData;
            try {
                 newTextureData = newTextureContext.getImageData(0, 0, newTexture.width, newTexture.height);
            } catch (e) {
                console.error(`Error getting ImageData for ${newTextureKey}:`, e);
                continue;
            }
            const newTexturePixels = newTextureData.data;

            console.log(`Processing column ${col} for texture ${newTextureKey}`);

            // --- Perform Color Replacement on the full spritesheet ---
            for (let i = 0; i < paletteRows; i++) {
                const targetColorInt = baseColors[i];
                const replacementColorInt = getPaletteColor(i, col);
                const replacementColorRGBA = Phaser.Display.Color.ValueToColor(replacementColorInt);
                let pixelsReplaced = 0; // Counter for replaced pixels (optional)

                for (let p = 0; p < newTexturePixels.length; p += 4) {
                    const r = newTexturePixels[p];
                    const g = newTexturePixels[p + 1];
                    const b = newTexturePixels[p + 2];
                    const currentPixelColorInt = Phaser.Display.Color.GetColor(r, g, b);

                    if (currentPixelColorInt === targetColorInt) {
                        newTexturePixels[p] = replacementColorRGBA.r;
                        newTexturePixels[p + 1] = replacementColorRGBA.g;
                        newTexturePixels[p + 2] = replacementColorRGBA.b;
                        pixelsReplaced++;
                    }
                }
                // console.log(`Replaced ${pixelsReplaced} pixels for color ${i}.`); // Optional logging
            }

            // Put the modified pixel data back onto the new texture's canvas
            newTextureContext.putImageData(newTextureData, 0, 0);

            // Refresh the texture in Phaser so the canvas changes are uploaded to the GPU
            newTexture.refresh();

            // --- *** FIX: Add Frame Data to the New Texture *** ---
            // Iterate through all frames defined in the original 'horse-base' texture
            const frameNames = horseBaseTexture.getFrameNames();
            for (const frameName of frameNames) {
                 // Skip the internal __BASE frame Phaser uses for the whole sheet
                if (frameName === '__BASE') {
                    continue;
                }
                // Get the frame object from the original texture
                const frame = horseBaseTexture.get(frameName);
                // Add a frame with the same name and dimensions to the new texture
                // Arguments for add(): name, sourceIndex, x, y, width, height
                // sourceIndex is 0 because our new texture uses a single canvas source
                // cutX/Y/Width/Height define the frame's area within the texture's source image
                newTexture.add(frame.name, 0, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight);
            }
            console.log(`Added ${newTexture.getFrameNames().length -1} frames to texture: ${newTextureKey}`); // -1 to exclude __BASE

            // --- Define Animations for the new spritesheet ---
            // This should now work because the frames have been added to newTexture
            const frameRate = 12; // Adjust as needed

            // Define 'run' animation (frames 0-5)
            this.anims.create({
                key: `${newTextureKey}-run`,
                frames: this.anims.generateFrameNumbers(newTextureKey, { start: 0, end: 5 }),
                frameRate: frameRate,
                repeat: -1
            });
             console.log(`Created animation: ${newTextureKey}-run`);

            // Define 'walk' animation (frames 8-15)
            this.anims.create({
                key: `${newTextureKey}-walk`,
                frames: this.anims.generateFrameNumbers(newTextureKey, { start: 8, end: 15 }),
                frameRate: frameRate - 3,
                repeat: -1
            });
            console.log(`Created animation: ${newTextureKey}-walk`);


        } // End of column loop

        // --- Cleanup Temporary Canvas ---
        tempPaletteCanvas.remove();

        console.log('Finished generating recolored horse textures and animations.');

        // Example: How to create a sprite and play an animation
        /*
        if (this.textures.exists('horse-color-1')) {
             const horseSprite = this.add.sprite(100, 100, 'horse-color-1'); // Use the generated texture key
             // Ensure the frame exists before playing animation
             if (horseSprite.texture.has('0')) {
                 console.log(`Playing animation horse-color-1-run on sprite.`);
                 horseSprite.play('horse-color-1-run'); // Play the corresponding animation
             } else {
                 console.error(`Frame '0' still not found in texture 'horse-color-1' after fix.`);
             }
        } else {
            console.error(`Texture 'horse-color-1' does not exist.`);
        }
        */

        // Optionally, transition to the main game scene
        this.scene.start('Game');
    }

    update() {
        // The update loop is typically used for game logic that runs every frame
    }
}
