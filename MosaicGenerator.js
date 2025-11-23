class MosaicGenerator {
    constructor(tileDesigner) {
        this.tileDesigner = tileDesigner;
        this.grid = [];
        this.cols = 5;
        this.rows = 5;
        this.needsUpdate = true;
        this.seed = 0;
        this.tiles = []; // List of serialized tile data
    }

    reset() {
        this.grid = [];
        this.tiles = [];
        this.needsUpdate = true;
    }

    _selectWeightedRandomTile() {
        // Handle case where tiles might not have probability
        let totalWeight = this.tiles.reduce((sum, tile) => sum + (tile.probability !== undefined ? tile.probability : 1.0), 0);

        if (totalWeight === 0) {
            // If all weights are zero, fall back to equiprobable
            return floor(random(this.tiles.length));
        }

        let randomVal = random(totalWeight);
        let currentWeight = 0;

        for (let i = 0; i < this.tiles.length; i++) {
            currentWeight += (this.tiles[i].probability !== undefined ? this.tiles[i].probability : 1.0);
            if (randomVal < currentWeight) {
                return i;
            }
        }

        // Fallback in case of floating point issues
        return this.tiles.length - 1;
    }


    generate(cols, rows, tiles, equiprobable = true) {
        this.cols = cols;
        this.rows = rows || cols; // Default to square if rows not provided
        this.tiles = tiles;
        this.grid = [];

        // Generate a new seed if we are regenerating
        this.seed = floor(random(1000000));
        randomSeed(this.seed);

        for (let i = 0; i < this.cols; i++) {
            let row = [];
            for (let j = 0; j < this.rows; j++) {
                let tileIndex;
                if (equiprobable) {
                    tileIndex = floor(random(this.tiles.length));
                } else {
                    tileIndex = this._selectWeightedRandomTile();
                }

                row.push({
                    rotation: floor(random(4)) * 90,
                    tileIndex: tileIndex
                });
            }
            this.grid.push(row);
        }
        this.needsUpdate = false;
        return this.seed;
    }

    updateTiles(tiles) {
        this.tiles = tiles;
        this.needsUpdate = false;
    }

    draw(pg) {
        const target = pg || window;
        const w = target.width / this.cols;
        const h = target.height / this.rows;

        target.background(240);

        if (this.needsUpdate || this.tiles.length === 0) return;

        // Scale factors relative to the original tile design size (600x600)
        const scaleX = w / 600;
        const scaleY = h / 600;

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const cell = this.grid[i][j];
                const x = i * w;
                const y = j * h;

                target.push();
                target.translate(x + w / 2, y + h / 2);
                target.rotate(target.radians(cell.rotation));
                target.scale(scaleX, scaleY);
                target.translate(-300, -300);

                // Load tile data into the designer and draw
                this.tileDesigner.load(this.tiles[cell.tileIndex]);
                this.tileDesigner.draw(target);

                target.pop();
            }
        }
    }

    drawBackgrounds(pg) {
        const target = pg || window;
        const w = target.width / this.cols;
        const h = target.height / this.rows;

        target.background(240);

        if (this.needsUpdate || this.tiles.length === 0) return;

        const scaleX = w / 600;
        const scaleY = h / 600;

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const cell = this.grid[i][j];
                const x = i * w;
                const y = j * h;

                target.push();
                target.translate(x + w / 2, y + h / 2);
                target.rotate(target.radians(cell.rotation));
                target.scale(scaleX, scaleY);
                target.translate(-300, -300);

                this.tileDesigner.load(this.tiles[cell.tileIndex]);
                this.tileDesigner.drawBackground(target);

                target.pop();
            }
        }
    }

    drawPreview(tiles, selectedIndices = []) {
        background(50); // Match Design mode's dark background

        let n = tiles.length;
        if (n === 0) return;

        // Calculate grid size for preview
        let cols = ceil(sqrt(n));
        let rows = ceil(n / cols);

        let w = width / cols;
        let h = height / rows;
        let cellSize = min(w, h);
        let scaleFactor = cellSize / 600; // Scale from 600px tile to cell size

        for (let i = 0; i < n; i++) {
            let col = i % cols;
            let row = floor(i / cols);

            let x = col * w;
            let y = row * h;

            let tileData = tiles[i];

            push();
            translate(x + w / 2, y + h / 2);
            scale(scaleFactor * 0.8); // Make it slightly smaller to have a margin
            translate(-300, -300); // Center around tile's center point (300, 300)

            // Draw background for the tile preview
            fill(tileData.backgroundColor);
            noStroke();
            rect(0, 0, 600, 600);

            this.tileDesigner.load(tileData);
            this.tileDesigner.draw();
            pop();

            // Draw border/number
            noFill();

            // Check if this tile is selected
            let isSelected = selectedIndices.includes(i);

            if (isSelected) {
                // Highlight selected tiles with accent color
                stroke(56, 189, 248); // Accent color (#38bdf8)
                strokeWeight(4);
            } else {
                stroke(0);
                strokeWeight(1);
            }

            rect(x, y, w, h);

            // Draw tile number and name
            const displayName = tileData.name || `Tile ${i + 1}`;
            fill(isSelected ? color(56, 189, 248) : 0);
            noStroke();
            textSize(isSelected ? 14 : 12);
            textStyle(isSelected ? BOLD : NORMAL);
            text(`${i + 1}: ${displayName}`, x + 5, y + 15);
        }
    }
}