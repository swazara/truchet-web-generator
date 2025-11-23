# truchet-web-generator

## 1. Overview
Interactive web-based Truchet mosaic designer and generator built with p5.js. Features modular JS architecture, state management (History Stack), clipboard manipulation, and a weighted probability system. Migrated from py5 with refactoring assisted by Gemini CLI / Antigravity.

## 2. Tech Stack & Conventions
* **Core Library:** p5.js (Rendering, Vector math, DOM manipulation).
* **DOM Handling:** Vanilla JS + p5 `select()`. No reactive frameworks.
* **Styling:** Plain CSS (`style.css`) using CSS variables.
* **Coordinate System:**
    * **Design Space:** Virtual space (-300 to +900). Center: (300, 300).
    * **Drag Detection:** 15px radius for points/handles.
* **Canvas Configuration:**
    * **Sizes:** 600px, 800px, 1000px, 1200px (default).
    * **Grid Size:** 2-20 tiles (default 5).
    * **Ratios:** 1:1, 16:9, 9:16.

## 3. File Structure & Responsibilities
* **`index.html`**: UI entry point (Sidebar controls, Canvas container).
* **`sketch.js`**: **God Object / Controller**.
    * Manages Global State (`tiles`, `mode`, `savedStyles`, `projectMetadata`).
    * Handles ALL DOM event listeners and p5 lifecycle.
    * **Preview Buffer:** Manages the `tilesPreviewState` for the "Tiles" tab to allow cancelable edits.
* **`TileDesigner.js`**: **Editor Logic**.
    * Handles geometric interactions (Click, Drag, Snap-to-grid).
    * Manages History Stack (Undo/Redo) and Clipboard.
    * Renders the editor grid (default resolution: 10px).
* **`MosaicGenerator.js`**: **Renderer Logic**.
    * Handles grid logic and weighted random selection.
    * **Tiles Mode:** Renders the preview grid with auto-scaling and an 80% margin.
* **`PathTracer.js`**: **SVG Optimization**.
    * Converts tile shapes into continuous SVG paths for plotter/cutting support.

## 4. Key Data Structures

### The Tile Object (Source of Truth)
```json
{
  "name": "Cross Tile",
  "shapes": {
    "points": [{ "x": 300, "y": 300 }],
    "quads": [[ { "x": 0, "y": 0 }, { "x": 50, "y": 50 }, { "x": 100, "y": 0 } ]],
    "beziers": [[ { "x": 0, "y": 0 }, { "x": 20, "y": 20 }, { "x": 80, "y": 20 }, { "x": 100, "y": 0 } ]]
  },
  "backgroundColor": "#FFFFFF",
  "primaryColor": "#2E86C1",
  "secondaryColor": "#E74C3C",
  "strokeWeight": 5,
  "secondaryStrokeWidth": 10,
  "layeredRendering": false,
  "probability": 1.0, // normalized internally
  "history": [], 
  "historyIndex": -1
}
```

### The Style Object
Shared between Design Mode and Tiles Mode repositories.
```json
{
  "name": "Style Name",
  "primaryColor": "#2E86C1",
  "secondaryColor": "#E74C3C",
  "backgroundColor": "#FFFFFF",
  "strokeWeight": 5,
  "secondaryStrokeWidth": 10,
  "layeredRendering": false
}
```

### The Project File (Save/Load)
```json
{
  "projectTitle": "My Mosaic",
  "tiles": [...],
  "savedStyles": [...],
  "compositePathsEnabled": true,
  "pathTolerance": 5,
  "timestamp": 1715420000
}
```

## 5. Interactions & Controls

### Keyboard Shortcuts (`sketch.js`)
* **Undo:** `Ctrl + Z`
* **Redo:** `Ctrl + Shift + Z` or `Ctrl + Y`
* **Copy:** `Ctrl + C` (Selected shapes)
* **Paste:** `Ctrl + V`
* **Delete:** `Delete` or `Supr`

### Mouse Logic (`TileDesigner.js`)
* **Selection:** Click on points/shapes. Highlighting uses visual accent color (#38bdf8).
* **Dragging:** Click + Drag within 15px radius.
* **Snap-to-Grid:** Active if toggled; snaps point coordinates to nearest grid interval.
* **Release:** Commits change to History Stack.

## 6. Critical Implementation Details

### State Management (The "Buffer" Pattern)
In **'Tiles' Mode**, we do NOT edit global `tiles` directly:
1.  **`tilesOriginalState`**: Deep copy backup.
2.  **`tilesPreviewState`**: Mutable copy for UI sliders/preview.
3.  **Commit**: "Apply" pushes `tilesPreviewState` to global `tiles`.

### Probability System
* **Validation:** Prevents all tiles from having 0 probability.
* **Logic:** If all weights are 0, it falls back to equiprobable selection.
* **UI:** Sliders show real-time percentage (0-100%).

### Rendering & Performance
* **Layered Rendering:** Interweaves shapes (Secondary A -> Primary A -> Secondary B -> Primary B) for a "woven" look.
* **Caching:** `PathTracer` caches segments. Cache invalidation triggers on: Tile style change, Size modification, or Mosaic regeneration.
* **Preview Buffer:** Prevents global state pollution during bulk edits.

### Export Pipeline
* **Image (PNG/JPG):** Uses hidden canvas. Dimensions = User Size * (DPI/72).
* **SVG (Tile-by-Tile):** Iterates grid, creating groups with transforms.
* **SVG (Composite):** Uses `PathTracer` to stitch paths across tiles (fixed 100px reference size).

## 7. Validations & Constraints
1.  **Tile Names:** Cannot be empty.
2.  **Styles:** Must have at least one tile selected to apply.
3.  **Probabilities:** At least one tile must be > 0.
4.  **History:** Only tracks changes in **Design Mode**. Tiles Mode changes are destructive unless "Cancel" is used.

## 8. Current Feature Status
* [x] Design Mode (Add/Move shapes, Snap to Grid).
* [x] **History System:** Undo/Redo stack (Limit: 10 actions).
* [x] **Clipboard:** Copy/Paste shapes within editor.
* [x] Mosaic Generation (Square/Horizontal/Vertical grids).
* [x] Project Persistence (Full JSON Save/Load with sanitization).
* [x] **PathTracer:** Continuous path generation with tolerance control.
* [x] **Grid Controls:** Custom resolution (2-50px) and visibility toggle.
