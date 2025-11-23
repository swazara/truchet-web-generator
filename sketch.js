let tileDesigner;
let mosaicGenerator;
let pathTracer; // PathTracer instance
let mode = 'design'; // 'design', 'tiles', 'mosaic'
const DESIGN_OFFSET = 300; // Offset for the design workspace


// State
let tiles = []; // List of tile data objects
let currentTileIndex = 0;
let savedStyles = [
    {
        name: "Teal & Coral",
        primaryColor: '#14B8A6',
        secondaryColor: '#F97316',
        backgroundColor: '#FEF3C7',
        strokeWeight: 50,
        secondaryStrokeWidth: 30,
        layeredRendering: false
    }
]; // List of saved styles with default preset

// UI Elements
let strokeWeightSlider;
let secondaryStrokeWidthSlider;
let primaryColorPicker;
let secondaryColorPicker;
let backgroundColorPicker;
let gridSizeSlider;
let showGridBtn;
let snapGridBtn;
let designGridResolutionInput;
let tileSelect;
let seedDisplay;
let gridShapeSelect;
let gridSizeDisplay;
let canvasSizeSelect;
let showAxesBtn;
let layeredRenderingBtn;
let projectTitleInput;
let tileNameInput;
let styleSelect;
let exportSizeSelect;
let customSizeInputs;
let exportWidthInput;
let exportHeightInput;
let exportFormatSelect;
let exportDpiInput;
let compositePathsCheckbox;
let pathToleranceSlider;
let pathToleranceDisplay;
let pathToleranceContainer;
let selectAllTilesCheckbox;
let tileCheckboxesContainer;
let tilesStyleSelect;
let tilesStrokeWeight;
let tilesSecondaryStrokeWidth;
let tilesPrimaryColor;
let tilesSecondaryColor;
let tilesBackgroundColor;
let tilesLayeredRendering;
let tilesStyleName;
let equiprobableToggle;
let tileProbabilitiesContainer;

// Tiles preview state
let tilesPreviewState = []; // Temporary state for preview
let tilesOriginalState = []; // Backup of original state

// State variables for toggles
let isGridVisible = true;
let isSnapEnabled = false;
let areAxesVisible = false;
let isLayeredRendering = false;
let designGridResolution = 10;

// Helper functions to create classic tiles
function createClassicTile() {
    // Classic Truchet: top-left to top-right curve, bottom-left to bottom-right curve
    return {
        name: "Classic",
        shapes: {
            points: [],
            quads: [
                // Left to top curve
                [
                    { x: 0, y: 300 },      // Start: left middle
                    { x: 300, y: 300 },    // Control point: center
                    { x: 300, y: 0 }       // End: top middle
                ],
                // Bottom to right curve
                [
                    { x: 300, y: 600 },    // Start: bottom middle
                    { x: 300, y: 300 },    // Control point: center
                    { x: 600, y: 300 }     // End: right middle
                ]
            ],
            beziers: []
        },
        backgroundColor: '#FEF3C7',
        primaryColor: '#14B8A6',
        secondaryColor: '#F97316',
        strokeWeight: 50,
        secondaryStrokeWidth: 30,
        layeredRendering: false,
        probability: 1.0
    };
}

function createCrossTile() {
    // Cross: four curves forming a cross pattern
    return {
        name: "Cross",
        shapes: {
            points: [],
            quads: [
                // Top to right
                [
                    { x: 300, y: 0 },      // Start: top middle
                    { x: 300, y: 300 },    // Control point: center
                    { x: 600, y: 300 }     // End: right middle
                ],
                // Right to bottom
                [
                    { x: 600, y: 300 },    // Start: right middle
                    { x: 300, y: 300 },    // Control point: center
                    { x: 300, y: 600 }     // End: bottom middle
                ],
                // Bottom to left
                [
                    { x: 300, y: 600 },    // Start: bottom middle
                    { x: 300, y: 300 },    // Control point: center
                    { x: 0, y: 300 }       // End: left middle
                ],
                // Left to top
                [
                    { x: 0, y: 300 },      // Start: left middle
                    { x: 300, y: 300 },    // Control point: center
                    { x: 300, y: 0 }       // End: top middle
                ]
            ],
            beziers: []
        },
        backgroundColor: '#FEF3C7',
        primaryColor: '#14B8A6',
        secondaryColor: '#F97316',
        strokeWeight: 50,
        secondaryStrokeWidth: 30,
        layeredRendering: false,
        probability: 1.0
    };
}

function setup() {
    console.log("Setup started");
    // Initialize with Design mode size (1200x1200)
    let canvas = createCanvas(1200, 1200);
    canvas.parent('canvas-wrapper');
    console.log("Canvas created");

    try {
        tileDesigner = new TileDesigner();
        mosaicGenerator = new MosaicGenerator(tileDesigner);
        console.log("Classes initialized");
    } catch (e) {
        console.error("Error initializing classes:", e);
    }

    // Initialize UI references
    strokeWeightSlider = select('#stroke-weight');
    secondaryStrokeWidthSlider = select('#secondary-stroke-width');
    primaryColorPicker = select('#color-primary');
    secondaryColorPicker = select('#color-secondary');
    backgroundColorPicker = select('#color-background');
    gridSizeSlider = select('#grid-size');
    showGridBtn = select('#btn-show-grid');
    snapGridBtn = select('#btn-snap-grid');
    designGridResolutionInput = select('#design-grid-resolution-input');
    tileSelect = select('#tile-select');
    seedDisplay = select('#seed-display');
    gridShapeSelect = select('#grid-shape');
    gridSizeDisplay = select('#grid-size-display');
    canvasSizeSelect = select('#canvas-size');
    showAxesBtn = select('#btn-show-axes');
    layeredRenderingBtn = select('#btn-layered-rendering');
    projectTitleInput = select('#project-title');
    tileNameInput = select('#tile-name');
    styleSelect = select('#style-select');
    styleNameInput = select('#style-name');
    exportSizeSelect = select('#export-size');
    customSizeInputs = select('#custom-size-inputs');
    exportWidthInput = select('#export-width');
    exportHeightInput = select('#export-height');
    exportFormatSelect = select('#export-format');
    exportDpiInput = select('#export-dpi');
    exportDpiInput.value(300);
    selectAllTilesCheckbox = select('#select-all-tiles');
    tileCheckboxesContainer = select('#tile-checkboxes-container');
    tilesStyleSelect = select('#tiles-style-select');
    tilesStrokeWeight = select('#tiles-stroke-weight');
    tilesSecondaryStrokeWidth = select('#tiles-secondary-stroke-width');
    tilesPrimaryColor = select('#tiles-color-primary');
    tilesSecondaryColor = select('#tiles-color-secondary');
    tilesBackgroundColor = select('#tiles-color-background');
    tilesLayeredRendering = select('#tiles-layered-rendering');
    tilesStyleName = select('#tiles-style-name');
    equiprobableToggle = select('#equiprobable-toggle');
    tileProbabilitiesContainer = select('#tile-probabilities-container');


    // Event Listeners
    select('#btn-design').mousePressed(() => setMode('design'));
    select('#btn-tiles').mousePressed(() => setMode('tiles'));
    select('#btn-mosaic').mousePressed(() => setMode('mosaic'));
    select('#btn-add-bezier').mousePressed(() => tileDesigner.addBezier());

    tileSelect.changed(onTileSelectChanged);

    // Update tile state immediately when UI changes
    tileNameInput.changed(handleTileNameChange);

    primaryColorPicker.input(() => tileDesigner.primaryColor = primaryColorPicker.value());
    secondaryColorPicker.input(() => tileDesigner.secondaryColor = secondaryColorPicker.value());
    backgroundColorPicker.input(() => tileDesigner.backgroundColor = backgroundColorPicker.value());

    // Stroke Weight Controls
    strokeWeightSlider.input(() => {
        let val = parseInt(strokeWeightSlider.value());
        if (val < 1) val = 1;
        strokeWeightSlider.value(val);
        tileDesigner.strokeWeight = val;
    });

    secondaryStrokeWidthSlider.input(() => {
        let val = parseInt(secondaryStrokeWidthSlider.value());
        if (val < 0) val = 0;
        secondaryStrokeWidthSlider.value(val);
        tileDesigner.secondaryStrokeWidth = val;
    });

    // Stroke Weight Buttons
    select('#btn-stroke-minus').mousePressed(() => {
        let val = parseInt(strokeWeightSlider.value());
        if (val > 1) {
            strokeWeightSlider.value(val - 1);
            tileDesigner.strokeWeight = val - 1;
        }
    });

    select('#btn-stroke-plus').mousePressed(() => {
        let val = parseInt(strokeWeightSlider.value());
        strokeWeightSlider.value(val + 1);
        tileDesigner.strokeWeight = val + 1;
    });

    select('#btn-sec-stroke-minus').mousePressed(() => {
        let val = parseInt(secondaryStrokeWidthSlider.value());
        if (val > 0) {
            secondaryStrokeWidthSlider.value(val - 1);
            tileDesigner.secondaryStrokeWidth = val - 1;
        }
    });

    select('#btn-sec-stroke-plus').mousePressed(() => {
        let val = parseInt(secondaryStrokeWidthSlider.value());
        secondaryStrokeWidthSlider.value(val + 1);
        tileDesigner.secondaryStrokeWidth = val + 1;
    });

    // Toggle Buttons Logic
    showGridBtn.mousePressed(() => {
        isGridVisible = !isGridVisible;
        isGridVisible ? showGridBtn.addClass('active') : showGridBtn.removeClass('active');
    });

    // Composite Paths Logic
    compositePathsCheckbox = select('#composite-paths');
    pathToleranceSlider = select('#path-tolerance');
    pathToleranceDisplay = select('#path-tolerance-display');
    pathToleranceContainer = select('#path-tolerance-container');

    if (compositePathsCheckbox) {
        compositePathsCheckbox.changed(() => {
            if (compositePathsCheckbox.checked()) {
                pathToleranceContainer.removeClass('hidden');
            } else {
                pathToleranceContainer.addClass('hidden');
            }
        });
    }

    if (pathToleranceSlider) {
        pathToleranceSlider.input(() => {
            pathToleranceDisplay.html(pathToleranceSlider.value());
        });
    }

    // Initialize UI state
    if (compositePathsCheckbox && compositePathsCheckbox.checked()) {
        pathToleranceContainer.removeClass('hidden');
    } else {
        pathToleranceContainer.addClass('hidden');
    }

    snapGridBtn.mousePressed(() => {
        isSnapEnabled = !isSnapEnabled;
        isSnapEnabled ? snapGridBtn.addClass('active') : snapGridBtn.removeClass('active');
    });

    showAxesBtn.mousePressed(() => {
        areAxesVisible = !areAxesVisible;
        areAxesVisible ? showAxesBtn.addClass('active') : showAxesBtn.removeClass('active');
    });

    layeredRenderingBtn.mousePressed(() => {
        isLayeredRendering = !isLayeredRendering;
        isLayeredRendering ? layeredRenderingBtn.addClass('active') : layeredRenderingBtn.removeClass('active');
        tileDesigner.layeredRendering = isLayeredRendering;
    });

    // Resolution Buttons Logic (step by 2 for even numbers)
    select('#btn-res-minus').mousePressed(() => {
        let val = parseInt(designGridResolutionInput.value());
        if (val > 2) {
            val -= 2;
            designGridResolutionInput.value(val);
            designGridResolution = val;
        }
    });

    select('#btn-res-plus').mousePressed(() => {
        let val = parseInt(designGridResolutionInput.value());
        if (val < 50) {
            val += 2;
            designGridResolutionInput.value(val);
            designGridResolution = val;
        }
    });

    // Input change listener
    designGridResolutionInput.input(() => {
        let val = parseInt(designGridResolutionInput.value());
        if (!isNaN(val) && val >= 2) {
            designGridResolution = val;
        }
    });

    // Grid controls event listeners
    gridShapeSelect.changed(updateGridShape);
    canvasSizeSelect.changed(generateMosaic);
    gridSizeSlider.input(() => {
        gridSizeDisplay.html(gridSizeSlider.value());
        // Regenerate mosaic with new size if in mosaic mode
        if (mode === 'mosaic') {
            generateMosaic();
        }
    });

    exportSizeSelect.changed(() => {
        if (exportSizeSelect.value() === 'custom') {
            customSizeInputs.removeClass('hidden');
        } else {
            customSizeInputs.addClass('hidden');
        }
    });

    // Tiles tab event listeners
    selectAllTilesCheckbox.changed(onSelectAllTilesChanged);

    // Tiles style editor - update preview in real-time
    tilesStrokeWeight.input(updateTilesPreview);
    tilesSecondaryStrokeWidth.input(updateTilesPreview);
    tilesPrimaryColor.input(updateTilesPreview);
    tilesSecondaryColor.input(updateTilesPreview);
    tilesBackgroundColor.input(updateTilesPreview);
    tilesLayeredRendering.changed(updateTilesPreview);

    // Tiles stroke weight buttons
    select('#btn-tiles-stroke-minus').mousePressed(() => {
        let val = parseInt(tilesStrokeWeight.value());
        if (val > 1) {
            tilesStrokeWeight.value(val - 1);
            updateTilesPreview();
        }
    });

    select('#btn-tiles-stroke-plus').mousePressed(() => {
        let val = parseInt(tilesStrokeWeight.value());
        tilesStrokeWeight.value(val + 1);
        updateTilesPreview();
    });

    select('#btn-tiles-sec-stroke-minus').mousePressed(() => {
        let val = parseInt(tilesSecondaryStrokeWidth.value());
        if (val > 0) {
            tilesSecondaryStrokeWidth.value(val - 1);
            updateTilesPreview();
        }
    });

    select('#btn-tiles-sec-stroke-plus').mousePressed(() => {
        let val = parseInt(tilesSecondaryStrokeWidth.value());
        tilesSecondaryStrokeWidth.value(val + 1);
        updateTilesPreview();
    });

    // Probability controls
    equiprobableToggle.changed(() => {
        if (equiprobableToggle.checked()) {
            tileProbabilitiesContainer.addClass('hidden');
        } else {
            tileProbabilitiesContainer.removeClass('hidden');
            // We might need to regenerate controls if tile list changed
            generateProbabilityControls();
        }
    });

    // Initialize with two classic tiles
    tiles = [createClassicTile(), createCrossTile()];
    currentTileIndex = 0;
    tileDesigner.load(tiles[0]);
    tileDesigner.resetHistory();
    updateTileSelect();
    updateUIForCurrentTile();

    // Initialize style selectors with default preset
    updateStyleSelect();
    updateTilesStyleSelect();

    console.log("Setup complete");
}

function draw() {
    let weight = parseInt(strokeWeightSlider.value());
    let pColor = primaryColorPicker.value();
    let sColor = secondaryColorPicker.value();

    if (mode === 'design') {
        // Design Mode Workspace
        background(50); // Dark background for workspace

        push();
        translate(DESIGN_OFFSET, DESIGN_OFFSET);

        // Draw Tile Area Background (White/Tile Color)
        // We let TileDesigner handle drawing the tile content, but we need to ensure it draws within 0-600

        let showGrid = isGridVisible;
        let showAxes = areAxesVisible;
        let designResolution = designGridResolution;

        // Draw using internal tile state (no overrides needed for main design view)
        tileDesigner.draw(null, showGrid, designResolution, showAxes);

        pop();

    } else if (mode === 'mosaic') {
        // Draw mosaic
        if (compositePathsCheckbox && compositePathsCheckbox.checked()) {
            // Draw background
            background(240);

            // Initialize or update PathTracer
            if (!pathTracer) {
                pathTracer = new PathTracer(mosaicGenerator, tiles, 100);
            }

            // Calculate current display tile size
            let currentTileSize = width / mosaicGenerator.cols;

            // Update PathTracer state
            pathTracer.mosaicGenerator = mosaicGenerator;
            pathTracer.tiles = tiles;
            pathTracer.tileSize = currentTileSize;

            // Draw composite paths
            let tolerance = pathToleranceSlider ? parseInt(pathToleranceSlider.value()) : 5;
            try {
                mosaicGenerator.drawBackgrounds();
                pathTracer.drawToCanvas(window, tolerance);
            } catch (e) {
                console.error("PathTracer error:", e);
                // Fallback to standard drawing if PathTracer fails
                mosaicGenerator.draw();
            }
        } else {
            mosaicGenerator.draw();
        }
    } else if (mode === 'tiles') {
        // Draw tiles preview with temporary state
        background(50); // Same dark background as design mode
        let selectedIndices = getSelectedTileIndices();
        mosaicGenerator.drawPreview(tilesPreviewState.length > 0 ? tilesPreviewState : tiles, selectedIndices);
    }
}

function setMode(newMode) {
    const oldMode = mode; // Capture the mode we are leaving
    if (oldMode === newMode) return; // No change

    // --- Actions for LEAVING a mode ---
    if (oldMode === 'design') {
        // Save current tile state when leaving design mode
        if (tiles.length > 0) {
            let data = tileDesigner.serialize();
            data.history = tileDesigner.history;
            data.historyIndex = tileDesigner.historyIndex;
            tiles[currentTileIndex] = data;
        }
    }

    // --- Update mode and UI for ENTERING new mode ---
    mode = newMode;

    // Deactivate all buttons and hide all sections first
    select('#btn-design').removeClass('active');
    select('#btn-tiles').removeClass('active');
    select('#btn-mosaic').removeClass('active');
    select('#design-controls').addClass('hidden');
    select('#tiles-controls').addClass('hidden');
    select('#mosaic-controls').addClass('hidden');

    if (mode === 'design') {
        select('#btn-design').addClass('active');
        select('#design-controls').removeClass('hidden');

        // Reset canvas to larger workspace for design mode
        resizeCanvas(1200, 1200);

        // Reload current tile into designer to reflect any changes from other tabs
        let data = tiles[currentTileIndex];
        tileDesigner.load(data);
        if (data.history) {
            tileDesigner.history = data.history;
            tileDesigner.historyIndex = data.historyIndex;
        } else {
            tileDesigner.resetHistory();
        }
        updateUIForCurrentTile();

    } else if (mode === 'tiles') {
        select('#btn-tiles').addClass('active');
        select('#tiles-controls').removeClass('hidden');

        // Set canvas size for preview
        resizeCanvas(800, 800);

        // This function handles creating deep copies, so it's safe to call every time.
        // It will also regenerate checkboxes which is good if tiles were added/deleted.
        initializeTilesPreviewState();

        // Update tiles style selector with saved styles
        updateTilesStyleSelect();

    } else if (mode === 'mosaic') {
        select('#btn-mosaic').addClass('active');
        select('#mosaic-controls').removeClass('hidden');

        // Invalidate PathTracer cache to ensure tile changes are reflected
        if (pathTracer) {
            pathTracer.clearCache();
        }

        // Check if we need to regenerate or just update
        let gridSize = parseInt(gridSizeSlider.value());
        let shape = gridShapeSelect.value();
        let cols, rows;

        // Calculate expected cols and rows based on shape
        if (shape === 'square') {
            cols = gridSize;
            rows = gridSize;
        } else if (shape === 'horizontal') {
            cols = Math.round(gridSize * 1.6);
            rows = gridSize;
        } else if (shape === 'vertical') {
            cols = gridSize;
            rows = Math.round(gridSize * 1.6);
        }

        // If grid dimensions match and we have a grid, just update tiles
        if (mosaicGenerator.grid.length > 0 &&
            mosaicGenerator.cols === cols &&
            mosaicGenerator.rows === rows) {

            // Just update the tile definitions (colors, shapes) without changing the grid layout
            mosaicGenerator.updateTiles(tiles);

            // Ensure canvas size is correct (in case it was changed in design mode)
            let baseSize = parseInt(canvasSizeSelect.value());
            let canvasWidth, canvasHeight;

            if (cols >= rows) {
                canvasWidth = baseSize;
                canvasHeight = baseSize * (rows / cols);
            } else {
                canvasHeight = baseSize;
                canvasWidth = baseSize * (cols / rows);
            }
            resizeCanvas(canvasWidth, canvasHeight);

        } else {
            // Generate mosaic with proper canvas sizing if dimensions changed or no grid exists
            generateMosaic();
        }
    }
}



// Tile Management
function addNewTile() {
    // Save current before switching
    if (tiles.length > 0) {
        let data = tileDesigner.serialize();
        data.history = tileDesigner.history;
        data.historyIndex = tileDesigner.historyIndex;
        tiles[currentTileIndex] = data;
    }

    tileDesigner.reset();

    // Generate unique name
    let counter = 1;
    let newName = `Tile ${counter}`;
    // Check against existing tiles (and the current one in designer which is about to be pushed, though it's empty now)
    // We need to check the 'tiles' array.
    while (tiles.some(t => t.name === newName)) {
        counter++;
        newName = `Tile ${counter}`;
    }
    tileDesigner.name = newName;

    let newTileData = tileDesigner.serialize();
    // New tile gets fresh history
    tiles.push(newTileData);
    currentTileIndex = tiles.length - 1;

    // We need to ensure the designer has the fresh history too
    tileDesigner.resetHistory();

    updateTileSelect();
    updateUIForCurrentTile();
}

function duplicateCurrentTile() {
    // Save current tile state
    if (tiles.length > 0) {
        let data = tileDesigner.serialize();
        data.history = tileDesigner.history;
        data.historyIndex = tileDesigner.historyIndex;
        tiles[currentTileIndex] = data;
    }

    // Create a deep copy of the current tile
    let duplicatedTile = JSON.parse(JSON.stringify(tiles[currentTileIndex]));

    // Generate unique name for the duplicate
    let baseName = duplicatedTile.name || 'Tile';
    let counter = 1;
    let newName = `${baseName} Copy`;

    // Check for existing names and increment if needed
    while (tiles.some(t => t.name === newName)) {
        counter++;
        newName = `${baseName} Copy ${counter}`;
    }

    duplicatedTile.name = newName;

    // Add the duplicated tile to the array
    tiles.push(duplicatedTile);
    currentTileIndex = tiles.length - 1;

    // Load the duplicated tile into the designer
    tileDesigner.load(duplicatedTile);
    // Duplicate should probably start with the same history or fresh?
    // Usually duplicate starts fresh history or inherits? 
    // Let's start fresh history for the duplicate to avoid confusion
    tileDesigner.resetHistory();

    updateTileSelect();
    updateUIForCurrentTile();
}

function deleteCurrentTile() {
    if (tiles.length <= 1) {
        alert("Cannot delete the last tile.");
        return;
    }

    tiles.splice(currentTileIndex, 1);
    if (currentTileIndex >= tiles.length) {
        currentTileIndex = tiles.length - 1;
    }

    let data = tiles[currentTileIndex];
    tileDesigner.load(data);
    if (data.history) {
        tileDesigner.history = data.history;
        tileDesigner.historyIndex = data.historyIndex;
    } else {
        tileDesigner.resetHistory();
    }
    updateTileSelect();
    updateUIForCurrentTile();

    // Regenerate mosaic to prevent index out of bounds errors
    generateMosaic();
}

function onTileSelectChanged() {
    // Save current
    let currentData = tileDesigner.serialize();
    currentData.history = tileDesigner.history;
    currentData.historyIndex = tileDesigner.historyIndex;
    tiles[currentTileIndex] = currentData;

    // Switch
    currentTileIndex = parseInt(tileSelect.value());
    let newTileData = tiles[currentTileIndex];
    tileDesigner.load(newTileData);

    if (newTileData.history) {
        tileDesigner.history = newTileData.history;
        tileDesigner.historyIndex = newTileData.historyIndex;
    } else {
        tileDesigner.resetHistory();
    }

    updateUIForCurrentTile();
}

function updateTileSelect() {
    // Save current state to ensure names are up to date in the array before rebuilding options
    if (tiles.length > 0) {
        tiles[currentTileIndex] = tileDesigner.serialize();
    }

    tileSelect.html('');
    for (let i = 0; i < tiles.length; i++) {
        let name = tiles[i].name || `Tile ${i + 1}`;
        tileSelect.option(name, i);
    }

    // Always set to currentTileIndex to ensure UI stays in sync with state
    tileSelect.value(currentTileIndex);
}

function updateUIForCurrentTile() {
    backgroundColorPicker.value(tileDesigner.backgroundColor);
    primaryColorPicker.value(tileDesigner.primaryColor);
    secondaryColorPicker.value(tileDesigner.secondaryColor);
    strokeWeightSlider.value(tileDesigner.strokeWeight);
    secondaryStrokeWidthSlider.value(tileDesigner.secondaryStrokeWidth);

    // Update toggle states based on tile data
    isLayeredRendering = tileDesigner.layeredRendering;
    isLayeredRendering ? layeredRenderingBtn.addClass('active') : layeredRenderingBtn.removeClass('active');

    tileNameInput.value(tileDesigner.name);
}

function handleTileNameChange() {
    let newName = tileNameInput.value().trim();

    // 1. Empty name validation
    if (!newName) {
        alert("Tile name cannot be empty.");
        tileNameInput.value(tileDesigner.name); // Revert to old name
        return;
    }

    // 2. Unique name generation
    // Check if name exists in other tiles (excluding current one)
    // We need to check against the 'tiles' array, but skip the current index
    let nameExists = tiles.some((t, index) => index !== currentTileIndex && t.name === newName);

    if (nameExists) {
        let baseName = newName;
        let counter = 2;
        let uniqueName = `${baseName} ${counter}`;

        // Keep incrementing until unique
        while (tiles.some((t, index) => index !== currentTileIndex && t.name === uniqueName)) {
            counter++;
            uniqueName = `${baseName} ${counter}`;
        }
        newName = uniqueName;
        alert(`Name already exists. Renamed to "${newName}".`);
    }

    // 3. Update Name
    tileDesigner.name = newName;
    tileNameInput.value(newName); // Update input in case it was modified by uniqueness logic

    // Update the tiles array with the new name
    if (tiles.length > 0) {
        tiles[currentTileIndex] = tileDesigner.serialize();
    }

    // 4. Update UI (Select option text)
    let currentOption = tileSelect.elt.options[tileSelect.elt.selectedIndex];
    if (currentOption) {
        currentOption.text = tileDesigner.name;
    }
}

// Global functions
function addPoint() { tileDesigner.addPoint(); }
function addQuad() { tileDesigner.addQuad(); }
function addBezier() { tileDesigner.addBezier(); }
function clearTile() { tileDesigner.clear(); }

function updateGridShape() {
    // When shape changes, regenerate the mosaic with new aspect ratio
    generateMosaic();
}

function generateMosaic() {
    let gridSize = parseInt(gridSizeSlider.value());
    let shape = gridShapeSelect.value();
    let cols, rows;

    // Calculate cols and rows based on shape
    if (shape === 'square') {
        cols = gridSize;
        rows = gridSize;
    } else if (shape === 'horizontal') {
        // 16:9 aspect ratio
        cols = Math.round(gridSize * 1.6);
        rows = gridSize;
    } else if (shape === 'vertical') {
        // 9:16 aspect ratio
        cols = gridSize;
        rows = Math.round(gridSize * 1.6);
    }

    // Resize canvas to match grid aspect ratio
    // Keep a base size and adjust based on aspect ratio
    let baseSize = parseInt(canvasSizeSelect.value());
    let canvasWidth, canvasHeight;

    if (cols >= rows) {
        // Wider or square
        canvasWidth = baseSize;
        canvasHeight = baseSize * (rows / cols);
    } else {
        // Taller
        canvasHeight = baseSize;
        canvasWidth = baseSize * (cols / rows);
    }

    if (mode === 'mosaic') {
        resizeCanvas(canvasWidth, canvasHeight);
    }

    // Invalidate PathTracer cache since grid changed
    if (pathTracer) {
        pathTracer.clearCache();
    }

    let isEquiprobable = equiprobableToggle.checked();
    let seed = mosaicGenerator.generate(cols, rows, tiles, isEquiprobable);
    seedDisplay.html(seed);
}



async function exportImage() {
    try {
        console.log("Exporting image...");
        const svgString = generateSVGString();

        const format = exportFormatSelect.value();
        const dpi = parseInt(exportDpiInput.value()) || 72;

        let exportWidth, exportHeight;
        const sizeOption = exportSizeSelect.value();

        if (sizeOption === 'custom') {
            exportWidth = parseInt(exportWidthInput.value());
            exportHeight = parseInt(exportHeightInput.value());
        } else {
            exportWidth = parseInt(sizeOption);
            exportHeight = exportWidth * (mosaicGenerator.rows / mosaicGenerator.cols);
        }

        if (!exportWidth || !exportHeight || exportWidth <= 0 || exportHeight <= 0) {
            alert("Invalid export dimensions.");
            return;
        }

        // Create a Blob from the SVG string
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Create an image to render the SVG
        const img = new Image();

        img.onload = function () {
            // Create canvas for final output
            const canvas = document.createElement('canvas');
            // Adjust for DPI if needed, but usually web export is pixel-based. 
            // If we want higher resolution for print, we just increase pixel dimensions.
            // The user's DPI input might be intended for metadata or scaling calculation.
            // For now, we'll stick to the requested pixel dimensions which is the standard for web canvas.
            // If DPI scaling is desired, we would multiply dimensions by (dpi/72).
            // Let's respect the logic from previous implementation:
            const scale = dpi / 72;
            canvas.width = exportWidth * scale;
            canvas.height = exportHeight * scale;

            const ctx = canvas.getContext('2d');

            // Fill background (optional, but good for JPEGs or non-transparent SVGs)
            ctx.fillStyle = '#FFFFFF';
            // Check if we want transparent background for PNG? 
            // The mosaic usually has a background color. 
            // If the SVG has a background rect, it will be drawn.

            // Draw the image onto the canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert to data URL and download
            const dataUrl = canvas.toDataURL(`image/${format}`);

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `mosaic.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        img.src = url;

    } catch (e) {
        console.error("Export failed:", e);
        alert("Export failed. See console for details.");
    }
}

function generateSVGString() {
    let cols = mosaicGenerator.cols;
    let rows = mosaicGenerator.rows;
    let tileSize = 100;
    let svgWidth = cols * tileSize;
    let svgHeight = rows * tileSize;

    let svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">\n`;

    // Check if Composite Paths is enabled
    if (compositePathsCheckbox && compositePathsCheckbox.checked()) {
        // Use PathTracer
        console.log("Generating Composite Paths SVG...");
        if (!pathTracer) {
            pathTracer = new PathTracer(mosaicGenerator, tiles, tileSize);
        } else {
            // Update data
            pathTracer.mosaicGenerator = mosaicGenerator;
            pathTracer.tiles = tiles;
            pathTracer.tileSize = tileSize; // Set to 100 for export
            // We MUST invalidate cache here because tileSize changed from display size to export size (100)
            // The segments were extracted with display offsets, they need to be re-extracted with export offsets?
            // WAIT. extractSegments uses internalSize (600) for offsets now. So segments are independent of tileSize!
            // So we DO NOT need to clear segments if only tileSize changed.
            // However, to be safe and ensure clean export state:
            // So it SHOULD work without clearing.
            // But let's clear just to be 100% sure we aren't using stale data.
            pathTracer.segments = []; // Clear cache
        }

        // Add background rectangles
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let cell = mosaicGenerator.grid[i][j];
                let tileData = tiles[cell.tileIndex];
                let x = i * tileSize;
                let y = j * tileSize;
                svg += `    <rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" fill="${tileData.backgroundColor}"/>\n`;
            }
        }

        let tolerance = parseInt(pathToleranceSlider.value());
        svg += pathTracer.generateSVG(tolerance);

    } else {
        // Standard Tile-by-Tile Export
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let cell = mosaicGenerator.grid[i][j];
                let tileData = tiles[cell.tileIndex];
                let x = i * tileSize;
                let y = j * tileSize;

                svg += `  <g transform="translate(${x + tileSize / 2}, ${y + tileSize / 2}) rotate(${cell.rotation}) translate(${-tileSize / 2}, ${-tileSize / 2})">\n`;
                svg += `    <rect x="0" y="0" width="${tileSize}" height="${tileSize}" fill="${tileData.backgroundColor}"/>\n`;
                svg += generateTileSVG(tileData, tileSize);
                svg += '  </g>\n';
            }
        }
    }

    svg += '</svg>';
    return svg;
}


function exportSVG() {
    const svg = generateSVGString();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truchet_mosaic_${mosaicGenerator.cols}x${mosaicGenerator.rows}.svg`;
    a.click();
    URL.revokeObjectURL(url);
}

function generateTileSVG(tileData, tileSize) {
    // Convert tile shapes to SVG paths
    let svg = '';
    let scaleFactor = tileSize / 600; // Assuming original canvas is 600x600

    // Helper to generate path string for a shape
    const getPath = (type, data) => {
        if (type === 'quad') {
            let path = 'M ' + (data[0].x * scaleFactor) + ' ' + (data[0].y * scaleFactor) + ' ';
            path += 'Q ' + (data[1].x * scaleFactor) + ' ' + (data[1].y * scaleFactor) + ' ';
            path += (data[2].x * scaleFactor) + ' ' + (data[2].y * scaleFactor);
            return path;
        } else if (type === 'bezier') {
            let path = 'M ' + (data[0].x * scaleFactor) + ' ' + (data[0].y * scaleFactor) + ' ';
            path += 'C ' + (data[1].x * scaleFactor) + ' ' + (data[1].y * scaleFactor) + ', ';
            path += (data[2].x * scaleFactor) + ' ' + (data[2].y * scaleFactor) + ', ';
            path += (data[3].x * scaleFactor) + ' ' + (data[3].y * scaleFactor);
            return path;
        }
        return '';
    };

    // Helper to generate circle string for a point
    const getPointCircle = (point) => {
        return '    <circle cx="' + (point.x * scaleFactor) + '" cy="' + (point.y * scaleFactor) + '" r="' + (tileData.strokeWeight * scaleFactor / 2) + '" fill="' + tileData.primaryColor + '"/>\n';
    };

    if (tileData.layeredRendering) {
        // Layered: Draw each shape fully (secondary then primary)

        // Quads
        for (let quad of tileData.shapes.quads) {
            let path = getPath('quad', quad);
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.secondaryColor + '" stroke-width="' + ((tileData.strokeWeight + tileData.secondaryStrokeWidth) * scaleFactor) + '" stroke-linecap="butt"/>\n';
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.primaryColor + '" stroke-width="' + (tileData.strokeWeight * scaleFactor) + '" stroke-linecap="butt"/>\n';
        }

        // Beziers
        for (let bezier of tileData.shapes.beziers) {
            let path = getPath('bezier', bezier);
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.secondaryColor + '" stroke-width="' + ((tileData.strokeWeight + tileData.secondaryStrokeWidth) * scaleFactor) + '" stroke-linecap="butt"/>\n';
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.primaryColor + '" stroke-width="' + (tileData.strokeWeight * scaleFactor) + '" stroke-linecap="butt"/>\n';
        }

        // Points
        for (let point of tileData.shapes.points) {
            svg += getPointCircle(point);
        }

    } else {
        // Fused: Draw all secondary strokes first, then all primary strokes

        // All Secondary Strokes
        for (let quad of tileData.shapes.quads) {
            let path = getPath('quad', quad);
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.secondaryColor + '" stroke-width="' + ((tileData.strokeWeight + tileData.secondaryStrokeWidth) * scaleFactor) + '" stroke-linecap="butt"/>\n';
        }
        for (let bezier of tileData.shapes.beziers) {
            let path = getPath('bezier', bezier);
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.secondaryColor + '" stroke-width="' + ((tileData.strokeWeight + tileData.secondaryStrokeWidth) * scaleFactor) + '" stroke-linecap="butt"/>\n';
        }

        // All Primary Strokes
        for (let quad of tileData.shapes.quads) {
            let path = getPath('quad', quad);
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.primaryColor + '" stroke-width="' + (tileData.strokeWeight * scaleFactor) + '" stroke-linecap="butt"/>\n';
        }
        for (let bezier of tileData.shapes.beziers) {
            let path = getPath('bezier', bezier);
            svg += '    <path d="' + path + '" fill="none" stroke="' + tileData.primaryColor + '" stroke-width="' + (tileData.strokeWeight * scaleFactor) + '" stroke-linecap="butt"/>\n';
        }

        // Points (usually drawn last or on top)
        for (let point of tileData.shapes.points) {
            svg += getPointCircle(point);
        }
    }

    return svg;
}

// Style Management
function saveStyle() {
    let name = styleNameInput.value();
    if (!name) {
        alert("Please enter a style name.");
        return;
    }

    let style = {
        name: name,
        primaryColor: tileDesigner.primaryColor,
        secondaryColor: tileDesigner.secondaryColor,
        backgroundColor: tileDesigner.backgroundColor,
        strokeWeight: tileDesigner.strokeWeight,
        secondaryStrokeWidth: tileDesigner.secondaryStrokeWidth,
        layeredRendering: tileDesigner.layeredRendering
    };

    savedStyles.push(style);
    updateStyleSelect();
    styleNameInput.value(''); // Clear input
}

function loadStyle() {
    let idx = styleSelect.value();
    if (idx === "") return;

    let style = savedStyles[idx];
    if (style) {
        tileDesigner.primaryColor = style.primaryColor;
        tileDesigner.secondaryColor = style.secondaryColor;
        tileDesigner.backgroundColor = style.backgroundColor;
        tileDesigner.strokeWeight = style.strokeWeight;
        tileDesigner.secondaryStrokeWidth = style.secondaryStrokeWidth;
        tileDesigner.layeredRendering = style.layeredRendering;

        updateUIForCurrentTile();
    }
}

function updateStyleSelect() {
    styleSelect.html('<option value="">Select a style...</option>');
    for (let i = 0; i < savedStyles.length; i++) {
        styleSelect.option(savedStyles[i].name, i);
    }
}

// Tiles Preview Management
function initializeTilesPreviewState() {
    // Create deep copy of tiles as original state
    tilesOriginalState = tiles.map(t => JSON.parse(JSON.stringify(t)));
    // Create preview state (starts as copy of original)
    tilesPreviewState = tiles.map(t => JSON.parse(JSON.stringify(t)));

    // Generate checkboxes for each tile
    generateTileCheckboxes();
    generateProbabilityControls();


    // Ensure the "Select All" checkbox is unchecked to sync with the new individual boxes
    if (selectAllTilesCheckbox) {
        selectAllTilesCheckbox.elt.checked = false;
    }

    if (equiprobableToggle.checked()) {
        tileProbabilitiesContainer.addClass('hidden');
    } else {
        tileProbabilitiesContainer.removeClass('hidden');
    }

    // Do not reset the style editor, allowing its values to persist across tab switches.
    // resetTilesStyleEditor();
}

function generateTileCheckboxes() {
    // Clear existing checkboxes
    tileCheckboxesContainer.elt.innerHTML = '';

    for (let i = 0; i < tiles.length; i++) {
        let name = tiles[i].name || `Tile ${i + 1}`;

        // Create wrapper div
        let wrapper = document.createElement('div');
        wrapper.className = 'checkbox-wrapper';

        // Create checkbox
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `tile-checkbox-${i}`;
        checkbox.setAttribute('data-tile-index', i);
        checkbox.addEventListener('change', onTileCheckboxChanged);

        // Create label
        let label = document.createElement('label');
        label.htmlFor = `tile-checkbox-${i}`;
        label.textContent = name;

        // Append to wrapper
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);

        // Append to container
        tileCheckboxesContainer.elt.appendChild(wrapper);
    }
}

function generateProbabilityControls() {
    tileProbabilitiesContainer.html(''); // Clear existing controls

    for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];
        let name = tile.name || `Tile ${i + 1}`;

        // Create wrapper for each tile's controls
        let controlWrapper = createDiv();
        controlWrapper.addClass('probability-control');
        controlWrapper.parent(tileProbabilitiesContainer);
        controlWrapper.style('display', 'flex');
        controlWrapper.style('flex-direction', 'column'); // Stack vertically
        controlWrapper.style('align-items', 'stretch'); // Full width
        controlWrapper.style('margin-bottom', '10px'); // Add spacing between tiles

        // Label
        let label = createDiv(`${name}`); // Use div for block layout
        label.parent(controlWrapper);
        label.style('text-align', 'center');
        label.style('width', '100%');
        label.style('white-space', 'nowrap');
        label.style('overflow', 'hidden');
        label.style('text-overflow', 'ellipsis');
        label.style('margin-bottom', '4px'); // Space between name and slider
        label.style('font-size', '0.9rem');

        // Slider Row Container
        let sliderRow = createDiv();
        sliderRow.parent(controlWrapper);
        sliderRow.style('display', 'flex');
        sliderRow.style('align-items', 'center');
        sliderRow.style('width', '100%');

        // Slider
        let initialProb = (tile.probability !== undefined) ? tile.probability : 1.0;
        let slider = createSlider(0, 100, initialProb * 100, 1);
        slider.parent(sliderRow);
        slider.style('flex-grow', '1');
        slider.style('width', 'auto');
        slider.style('margin', '0'); // Reset margins
        slider.style('margin-right', '10px'); // Space for value

        // Value display
        let display = createSpan(`${slider.value()}%`);
        display.parent(sliderRow);
        display.style('min-width', '35px'); // Fixed width for alignment
        display.style('text-align', 'right');

        // Slider event listener
        slider.input(() => {
            let newVal = parseInt(slider.value());

            // Calculate sum of OTHER tiles
            let otherSum = 0;
            for (let j = 0; j < tiles.length; j++) {
                if (i !== j) {
                    otherSum += tiles[j].probability;
                }
            }

            // If new value is 0 and others are 0, block it
            if (newVal === 0 && otherSum === 0) {
                // Force to 1 (minimum non-zero integer percent)
                slider.value(1);
                newVal = 1;
            }

            tiles[i].probability = newVal / 100.0;
            display.html(`${newVal}%`);
        });
    }
}


function onSelectAllTilesChanged() {
    let isChecked = selectAllTilesCheckbox.elt.checked;
    // Update all individual checkboxes
    for (let i = 0; i < tiles.length; i++) {
        let checkbox = document.getElementById(`tile-checkbox-${i}`);
        if (checkbox) {
            checkbox.checked = isChecked;
        }
    }
    // Update preview to show/hide changes on selected tiles
    updateTilesPreview();
}

function onTileCheckboxChanged() {
    // Check if all are selected to update "Select All" checkbox
    let allChecked = true;
    for (let i = 0; i < tiles.length; i++) {
        let checkbox = document.getElementById(`tile-checkbox-${i}`);
        if (checkbox && !checkbox.checked) {
            allChecked = false;
            break;
        }
    }
    selectAllTilesCheckbox.elt.checked = allChecked;

    // Update preview to show/hide changes on selected tiles
    updateTilesPreview();
}

function getSelectedTileIndices() {
    let selected = [];
    for (let i = 0; i < tiles.length; i++) {
        let checkbox = document.getElementById(`tile-checkbox-${i}`);
        if (checkbox && checkbox.checked) {
            selected.push(i);
        }
    }
    return selected;
}

function resetTilesStyleEditor() {
    tilesStrokeWeight.value(5);
    tilesSecondaryStrokeWidth.value(10);
    tilesPrimaryColor.value('#2E86C1');
    tilesSecondaryColor.value('#E74C3C');
    tilesBackgroundColor.value('#FFFFFF');
    tilesLayeredRendering.elt.checked = false;
}

function updateTilesPreview() {
    // Get selected tiles
    let selectedIndices = getSelectedTileIndices();

    // Get current style from editor
    let currentStyle = {
        primaryColor: tilesPrimaryColor.value(),
        secondaryColor: tilesSecondaryColor.value(),
        backgroundColor: tilesBackgroundColor.value(),
        strokeWeight: parseInt(tilesStrokeWeight.value()),
        secondaryStrokeWidth: parseInt(tilesSecondaryStrokeWidth.value()),
        layeredRendering: tilesLayeredRendering.elt.checked
    };

    // Update all tiles in preview state
    for (let i = 0; i < tilesPreviewState.length; i++) {
        if (selectedIndices.includes(i)) {
            // Apply current style to selected tiles
            tilesPreviewState[i].primaryColor = currentStyle.primaryColor;
            tilesPreviewState[i].secondaryColor = currentStyle.secondaryColor;
            tilesPreviewState[i].backgroundColor = currentStyle.backgroundColor;
            tilesPreviewState[i].strokeWeight = currentStyle.strokeWeight;
            tilesPreviewState[i].secondaryStrokeWidth = currentStyle.secondaryStrokeWidth;
            tilesPreviewState[i].layeredRendering = currentStyle.layeredRendering;
        } else {
            // Restore original values for deselected tiles
            tilesPreviewState[i].primaryColor = tilesOriginalState[i].primaryColor;
            tilesPreviewState[i].secondaryColor = tilesOriginalState[i].secondaryColor;
            tilesPreviewState[i].backgroundColor = tilesOriginalState[i].backgroundColor;
            tilesPreviewState[i].strokeWeight = tilesOriginalState[i].strokeWeight;
            tilesPreviewState[i].secondaryStrokeWidth = tilesOriginalState[i].secondaryStrokeWidth;
            tilesPreviewState[i].layeredRendering = tilesOriginalState[i].layeredRendering;
        }
    }

    // Invalidate PathTracer cache since tile styles changed
    if (pathTracer) {
        pathTracer.clearCache();
    }
}

function updateTilesStyleSelect() {
    tilesStyleSelect.html('<option value="">Select a style...</option>');
    for (let i = 0; i < savedStyles.length; i++) {
        tilesStyleSelect.option(savedStyles[i].name, i);
    }
}

function loadStyleIntoTilesEditor() {
    let styleIdx = tilesStyleSelect.value();
    if (styleIdx === "") {
        alert("Please select a style to load.");
        return;
    }

    let style = savedStyles[styleIdx];
    if (style) {
        tilesPrimaryColor.value(style.primaryColor);
        tilesSecondaryColor.value(style.secondaryColor);
        tilesBackgroundColor.value(style.backgroundColor);
        tilesStrokeWeight.value(style.strokeWeight);
        tilesSecondaryStrokeWidth.value(style.secondaryStrokeWidth);
        tilesLayeredRendering.elt.checked = style.layeredRendering;

        // Update preview with loaded style
        updateTilesPreview();
    }
}

function resetTilesPreview() {
    // Restore preview state from original state
    tilesPreviewState = tilesOriginalState.map(t => JSON.parse(JSON.stringify(t)));

    // Re-generate probability controls to show original values
    generateProbabilityControls();

    // Reset style editor
    resetTilesStyleEditor();

    // Uncheck all checkboxes
    selectAllTilesCheckbox.elt.checked = false;
    for (let i = 0; i < tiles.length; i++) {
        let checkbox = document.getElementById(`tile-checkbox-${i}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
}

function saveStyleFromTilesEditor() {
    let name = tilesStyleName.value().trim();
    if (!name) {
        alert("Please enter a name for the style.");
        return;
    }

    let style = {
        name: name,
        primaryColor: tilesPrimaryColor.value(),
        secondaryColor: tilesSecondaryColor.value(),
        backgroundColor: tilesBackgroundColor.value(),
        strokeWeight: parseInt(tilesStrokeWeight.value()),
        secondaryStrokeWidth: parseInt(tilesSecondaryStrokeWidth.value()),
        layeredRendering: tilesLayeredRendering.elt.checked
    };

    savedStyles.push(style);
    updateStyleSelect();
    updateTilesStyleSelect();
    tilesStyleName.value(''); // Clear input

    alert(`Style "${name}" saved successfully!`);
}

function applyStylesToSelectedTiles() {
    let selectedIndices = getSelectedTileIndices();

    if (selectedIndices.length === 0) {
        alert("Please select at least one tile to apply styles.");
        return;
    }

    // Apply preview state to actual tiles
    for (let idx of selectedIndices) {
        if (tiles[idx] && tilesPreviewState[idx]) {
            const previewData = tilesPreviewState[idx];
            tiles[idx].primaryColor = previewData.primaryColor;
            tiles[idx].secondaryColor = previewData.secondaryColor;
            tiles[idx].backgroundColor = previewData.backgroundColor;
            tiles[idx].strokeWeight = previewData.strokeWeight;
            tiles[idx].secondaryStrokeWidth = previewData.secondaryStrokeWidth;
            tiles[idx].layeredRendering = previewData.layeredRendering;
        }
    }

    // If the tile currently cached in the designer was one of the ones updated,
    // we must reload its state from the now-updated `tiles` array to ensure 
    // the designer's cache is not stale.
    if (selectedIndices.includes(currentTileIndex)) {
        tileDesigner.load(tiles[currentTileIndex]);
        updateUIForCurrentTile();
    }

    // Update original state to match new tiles state so "Reset" works correctly.
    tilesOriginalState = tiles.map(t => JSON.parse(JSON.stringify(t)));

    // Also reset the preview state to this new ground truth.
    tilesPreviewState = tiles.map(t => JSON.parse(JSON.stringify(t)));

    alert("Styles applied successfully.");
}

// Save/Load
// Save/Load
// Project Management
function resetApplicationState() {
    // 1. Reset Tiles
    tiles = [];
    currentTileIndex = 0;

    // 2. Reset Designer
    tileDesigner.reset();
    tileDesigner.resetHistory();
    tileDesigner.name = "Tile 1"; // Default name

    // 3. Reset Styles
    savedStyles = [];

    // 4. Reset UI
    projectTitleInput.value("Truchet Mosaic");
    seedDisplay.html('');

    // 5. Reset Preview State
    tilesOriginalState = [];
    tilesPreviewState = [];

    // 6. Reset Checkboxes/Controls
    tileCheckboxesContainer.html('');
    tileProbabilitiesContainer.html('');
    if (selectAllTilesCheckbox) selectAllTilesCheckbox.elt.checked = false;

    // 7. Reset Mosaic Generator
    if (mosaicGenerator) mosaicGenerator.reset();
}

function saveProject() {
    // Save current tile first
    tiles[currentTileIndex] = tileDesigner.serialize();

    let data = {
        projectTitle: projectTitleInput.value(),
        tiles: tiles,
        savedStyles: savedStyles,
        compositePathsEnabled: compositePathsCheckbox ? compositePathsCheckbox.checked() : false,
        pathTolerance: pathToleranceSlider ? parseInt(pathToleranceSlider.value()) : 5,
        timestamp: Date.now()
    };

    let filename = projectTitleInput.value() || 'truchet_project';
    // Sanitize filename
    filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveJSON(data, `${filename}.json`);
}

function newProject() {
    if (confirm("Create new project? Any unsaved changes to the current project will be lost.")) {
        // Full Reset
        resetApplicationState();

        // Initialize with default tiles
        tiles = [createClassicTile(), createCrossTile()];
        currentTileIndex = 0;

        // Load first tile
        tileDesigner.load(tiles[0]);
        tileDesigner.resetHistory(); // Ensure history is fresh for the new tile

        // Update UI
        updateTileSelect();
        updateUIForCurrentTile();
        updateStyleSelect();
    }
}

function loadProjectData(data) {
    if (data.tiles && Array.isArray(data.tiles)) {
        // Full Reset before loading
        resetApplicationState();

        // Ensure loaded tiles have the probability property
        tiles = data.tiles.map(t => ({ ...t, probability: t.probability !== undefined ? t.probability : 1.0 }));

        currentTileIndex = 0;
        tileDesigner.load(tiles[0]);
        tileDesigner.resetHistory(); // Ensure history is fresh for the loaded tile

        updateTileSelect();
        updateUIForCurrentTile();

        if (data.projectTitle) {
            projectTitleInput.value(data.projectTitle);
        }

        if (data.savedStyles && Array.isArray(data.savedStyles)) {
            savedStyles = data.savedStyles;
            updateStyleSelect();
        }

        if (data.compositePathsEnabled !== undefined && compositePathsCheckbox) {
            compositePathsCheckbox.checked(data.compositePathsEnabled);
            if (data.compositePathsEnabled) {
                pathToleranceContainer.removeClass('hidden');
            } else {
                pathToleranceContainer.addClass('hidden');
            }
        }

        if (data.pathTolerance !== undefined && pathToleranceSlider) {
            pathToleranceSlider.value(data.pathTolerance);
            pathToleranceDisplay.html(data.pathTolerance);
        }
    }
}



function loadProjectFile(input) {
    let file = input.files[0];
    if (file) {
        // Update title from filename if needed, but ideally we use metadata title
        // The user requested: "Cargar proyecto que me haga elegir algun proyecto en mi computadora. ... Quiero que cuando cargue un proyecto sea visible el nombre del proyecto, en este caso, el nombre del archivo json o el titulo en metadata que tenga asignado ese archivo json."
        // We'll prioritize metadata title in loadProjectData, but we can also default to filename here if we wanted.
        // Actually, loadProjectData handles the metadata title. 
        // If we want to use filename as fallback:
        let filename = file.name.replace('.json', '');
        // We will let loadProjectData handle it from the JSON content first.

        let reader = new FileReader();
        reader.onload = function (e) {
            let data = JSON.parse(e.target.result);
            loadProjectData(data);

            // If the JSON didn't have a title, maybe use filename?
            if (!data.projectTitle) {
                projectTitleInput.value(filename);
            }
        };
        reader.readAsText(file);
    }
}

function mousePressed() {
    if (mode === 'design' && tileDesigner) {
        // Adjust coordinates for design offset
        let mx = mouseX - DESIGN_OFFSET;
        let my = mouseY - DESIGN_OFFSET;
        tileDesigner.mousePressed(mx, my);
    }
}

function mouseDragged() {
    if (mode === 'design' && tileDesigner) {
        let snapGrid = isSnapEnabled;
        let designResolution = designGridResolution;
        // Adjust coordinates for design offset
        let mx = mouseX - DESIGN_OFFSET;
        let my = mouseY - DESIGN_OFFSET;
        tileDesigner.mouseDragged(snapGrid, designResolution, mx, my);
    }
}

function mouseReleased() {
    if (mode === 'design' && tileDesigner) {
        tileDesigner.mouseReleased();
    }
}

function keyPressed() {
    // Only in design mode and not typing in an input
    if (mode === 'design' && document.activeElement.tagName !== 'INPUT') {
        if (keyIsDown(CONTROL)) {
            if (keyCode === 90) { // Z
                if (keyIsDown(SHIFT)) {
                    tileDesigner.redo();
                } else {
                    tileDesigner.undo();
                }
            } else if (keyCode === 89) { // Y
                tileDesigner.redo();
            } else if (keyCode === 67) { // C
                tileDesigner.copySelection();
            } else if (keyCode === 86) { // V
                tileDesigner.pasteSelection();
            }
        } else {
            if (keyCode === DELETE) {
                tileDesigner.deleteSelection();
            }
        }
    }
}
