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


## 4. Interactions & Controls

### Keyboard Shortcuts (`sketch.js`)
* **Undo:** `Ctrl + Z`
* **Redo:** `Ctrl + Shift + Z` or `Ctrl + Y`
* **Copy:** `Ctrl + C` (Selected shapes)
* **Paste:** `Ctrl + V`
* **Delete:** `Delete` or `Supr`


## 5. Current Feature Status
* [x] Design Mode (Add/Move shapes, Snap to Grid).
* [x] **History System:** Undo/Redo stack (Limit: 10 actions).
* [x] **Clipboard:** Copy/Paste shapes within editor.
* [x] Mosaic Generation (Square/Horizontal/Vertical grids).
* [x] Project Persistence (Full JSON Save/Load with sanitization).
* [x] **PathTracer:** Continuous path generation with tolerance control.
* [x] **Grid Controls:** Custom resolution (2-50px) and visibility toggle.
