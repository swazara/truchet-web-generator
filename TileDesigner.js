class TileDesigner {
    constructor() {
        this.reset();
        this.dragRadius = 15;
        this.selectedPoint = null;
        this.selectedShape = null; // { type: 'point'|'quad'|'bezier', index: number, data: object }
        this.clipboard = null;
        this.wasDragged = false;
    }

    reset() {
        this.shapes = {
            points: [],
            quads: [],
            beziers: []
        };
        this.backgroundColor = '#FFFFFF';
        this.primaryColor = '#2E86C1';
        this.secondaryColor = '#E74C3C';
        this.strokeWeight = 5;
        this.secondaryStrokeWidth = 10;
        this.layeredRendering = false;
        this.name = "Tile";
        this.probability = 1.0;

        // History
        this.resetHistory();
    }

    resetHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.pushToHistory();
    }

    pushToHistory() {
        // Remove future history if we are in the middle
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(this.serialize());
        this.historyIndex++;

        // Limit to 10
        if (this.history.length > 10) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.load(this.history[this.historyIndex]);
            this.selectedShape = null;
            this.selectedPoint = null;
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.load(this.history[this.historyIndex]);
            this.selectedShape = null;
            this.selectedPoint = null;
        }
    }

    addPoint() {
        this.shapes.points.push(createVector(width / 2, height / 2));
        this.pushToHistory();
    }

    addQuad() {
        // Add a quadratic bezier curve (start, control, end)
        this.shapes.quads.push([
            createVector(100, 100),
            createVector(150, 150),
            createVector(200, 200)
        ]);
        this.pushToHistory();
    }

    addBezier() {
        // Add a cubic bezier curve (start, control1, control2, end)
        this.shapes.beziers.push([
            createVector(100, 100),
            createVector(130, 130),
            createVector(160, 160),
            createVector(200, 200)
        ]);
        this.pushToHistory();
    }

    clear() {
        this.shapes = { points: [], quads: [], beziers: [] };
        this.pushToHistory();
    }

    // Serialize current state to a simple object
    serialize() {
        const serializeVector = (v) => ({ x: v.x, y: v.y });
        return {
            shapes: {
                points: this.shapes.points.map(serializeVector),
                quads: this.shapes.quads.map(q => q.map(serializeVector)),
                beziers: this.shapes.beziers.map(b => b.map(serializeVector))
            },
            backgroundColor: this.backgroundColor,
            primaryColor: this.primaryColor,
            secondaryColor: this.secondaryColor,
            strokeWeight: this.strokeWeight,
            secondaryStrokeWidth: this.secondaryStrokeWidth,
            layeredRendering: this.layeredRendering,
            name: this.name,
            probability: this.probability
        };
    }

    // Load state from object
    load(data) {
        const deserializeVector = (v) => createVector(v.x, v.y);
        this.shapes = {
            points: data.shapes.points.map(deserializeVector),
            quads: data.shapes.quads.map(q => q.map(deserializeVector)),
            beziers: data.shapes.beziers.map(b => b.map(deserializeVector))
        };
        this.backgroundColor = data.backgroundColor || '#FFFFFF';
        this.primaryColor = data.primaryColor || '#2E86C1';
        this.secondaryColor = data.secondaryColor || '#E74C3C';
        this.strokeWeight = data.strokeWeight !== undefined ? data.strokeWeight : 5;
        this.secondaryStrokeWidth = data.secondaryStrokeWidth !== undefined ? data.secondaryStrokeWidth : 10;
        this.layeredRendering = data.layeredRendering || false;
        this.name = data.name || "Tile";
        this.probability = data.probability !== undefined ? data.probability : 1.0;
    }

    drawBackground(target) {
        target.fill(this.backgroundColor);
        target.noStroke();
        target.rect(0, 0, 600, 600);
    }

    draw(pg, showGrid, resolution, showAxes = false) {
        const target = pg || window;

        this.drawBackground(target);

        if (showGrid) {
            this.drawGrid(target, resolution);
        }

        let pColor = this.primaryColor;
        let sColor = this.secondaryColor;
        let weight = this.strokeWeight;
        let secWidth = this.secondaryStrokeWidth;

        target.strokeCap(SQUARE);
        target.strokeJoin(ROUND);
        target.noFill();

        if (this.layeredRendering) {
            this.drawAllShapesLayered(target, pColor, sColor, weight, secWidth);
        } else {
            target.stroke(sColor);
            target.strokeWeight(weight + secWidth);
            this.drawAllShapes(target);

            target.stroke(pColor);
            target.strokeWeight(weight);
            this.drawAllShapes(target);
        }

        if (showGrid) {
            this.drawControlPoints(target);
        }

        if (showAxes) {
            this.drawCenterAxes(target);
        }
    }

    drawAllShapesLayered(target, primaryColor, secondaryColor, weight, secWidth) {
        const drawShape = (type, data) => {
            target.stroke(secondaryColor);
            target.strokeWeight(weight + secWidth);

            if (type === 'point') target.point(data.x, data.y);
            else if (type === 'quad') {
                target.beginShape();
                target.vertex(data[0].x, data[0].y);
                target.quadraticVertex(data[1].x, data[1].y, data[2].x, data[2].y);
                target.endShape();
            } else if (type === 'bezier') {
                target.beginShape();
                target.vertex(data[0].x, data[0].y);
                target.bezierVertex(data[1].x, data[1].y, data[2].x, data[2].y, data[3].x, data[3].y);
                target.endShape();
            }

            target.stroke(primaryColor);
            target.strokeWeight(weight);

            if (type === 'point') target.point(data.x, data.y);
            else if (type === 'quad') {
                target.beginShape();
                target.vertex(data[0].x, data[0].y);
                target.quadraticVertex(data[1].x, data[1].y, data[2].x, data[2].y);
                target.endShape();
            } else if (type === 'bezier') {
                target.beginShape();
                target.vertex(data[0].x, data[0].y);
                target.bezierVertex(data[1].x, data[1].y, data[2].x, data[2].y, data[3].x, data[3].y);
                target.endShape();
            }
        };

        for (let p of this.shapes.points) drawShape('point', p);
        for (let q of this.shapes.quads) drawShape('quad', q);
        for (let b of this.shapes.beziers) drawShape('bezier', b);
    }

    drawAllShapes(target) {
        for (let p of this.shapes.points) {
            target.point(p.x, p.y);
        }

        for (let q of this.shapes.quads) {
            target.beginShape();
            target.vertex(q[0].x, q[0].y);
            target.quadraticVertex(q[1].x, q[1].y, q[2].x, q[2].y);
            target.endShape();
        }

        for (let b of this.shapes.beziers) {
            target.beginShape();
            target.vertex(b[0].x, b[0].y);
            target.bezierVertex(b[1].x, b[1].y, b[2].x, b[2].y, b[3].x, b[3].y);
            target.endShape();
        }
    }

    drawControlPoints(target) {
        target.strokeWeight(1);
        target.stroke(0, 100);
        target.fill(255, 200);

        const drawHandle = (v, isSelected) => {
            if (isSelected) {
                target.fill('#3498DB'); // Highlight color (Blue-ish)
                target.stroke('#2980B9');
            } else {
                target.fill(255, 200);
                target.stroke(0, 100);
            }
            target.circle(v.x, v.y, this.dragRadius);
        };

        target.stroke(200);
        for (let q of this.shapes.quads) {
            target.line(q[0].x, q[0].y, q[1].x, q[1].y);
            target.line(q[1].x, q[1].y, q[2].x, q[2].y);
        }
        for (let b of this.shapes.beziers) {
            target.line(b[0].x, b[0].y, b[1].x, b[1].y);
            target.line(b[2].x, b[2].y, b[3].x, b[3].y);
        }

        target.stroke(0);

        // Draw points with highlight if part of selected shape
        for (let i = 0; i < this.shapes.points.length; i++) {
            let p = this.shapes.points[i];
            let isSelected = this.selectedShape && this.selectedShape.type === 'point' && this.selectedShape.index === i;
            drawHandle(p, isSelected);
        }

        for (let i = 0; i < this.shapes.quads.length; i++) {
            let q = this.shapes.quads[i];
            let isSelected = this.selectedShape && this.selectedShape.type === 'quad' && this.selectedShape.index === i;
            q.forEach(p => drawHandle(p, isSelected));
        }

        for (let i = 0; i < this.shapes.beziers.length; i++) {
            let b = this.shapes.beziers[i];
            let isSelected = this.selectedShape && this.selectedShape.type === 'bezier' && this.selectedShape.index === i;
            b.forEach(p => drawHandle(p, isSelected));
        }
    }

    drawGrid(target, resolution) {
        target.stroke(220);
        target.strokeWeight(1);
        target.noFill();

        let size = 600;
        let margin = 300;
        let start = -margin;
        let end = size + margin;

        let step = size / resolution;

        let firstX = Math.ceil(start / step) * step;
        for (let x = firstX; x <= end; x += step) {
            target.line(x, start, x, end);
        }

        let firstY = Math.ceil(start / step) * step;
        for (let y = firstY; y <= end; y += step) {
            target.line(start, y, end, y);
        }
    }

    drawCenterAxes(target) {
        target.stroke(255, 30, 30);
        target.strokeWeight(2);
        let center = 300;
        let size = 600;
        target.line(center, 0, center, size);
        target.line(0, center, size, center);
    }

    mousePressed(mx, my) {
        let m = createVector(mx, my);
        this.selectedPoint = null;
        this.selectedShape = null;
        this.wasDragged = false;

        // Check Points
        for (let i = 0; i < this.shapes.points.length; i++) {
            let p = this.shapes.points[i];
            if (p.dist(m) < this.dragRadius) {
                this.selectedPoint = p;
                this.selectedShape = { type: 'point', index: i, data: p };
                return true;
            }
        }

        // Check Quads
        for (let i = 0; i < this.shapes.quads.length; i++) {
            let q = this.shapes.quads[i];
            for (let p of q) {
                if (p.dist(m) < this.dragRadius) {
                    this.selectedPoint = p;
                    this.selectedShape = { type: 'quad', index: i, data: q };
                    return true;
                }
            }
        }

        // Check Beziers
        for (let i = 0; i < this.shapes.beziers.length; i++) {
            let b = this.shapes.beziers[i];
            for (let p of b) {
                if (p.dist(m) < this.dragRadius) {
                    this.selectedPoint = p;
                    this.selectedShape = { type: 'bezier', index: i, data: b };
                    return true;
                }
            }
        }

        return false;
    }

    mouseDragged(snapToGrid, resolution, mx, my) {
        if (this.selectedPoint) {
            this.wasDragged = true;
            let x = mx;
            let y = my;

            if (snapToGrid) {
                let step = 600 / resolution;
                x = Math.round(x / step) * step;
                y = Math.round(y / step) * step;
            }

            let margin = 300;
            let size = 600;
            x = Math.max(-margin, Math.min(x, size + margin));
            y = Math.max(-margin, Math.min(y, size + margin));

            this.selectedPoint.x = x;
            this.selectedPoint.y = y;
        }
    }

    mouseReleased() {
        if (this.selectedPoint && this.wasDragged) {
            this.pushToHistory();
        }
        this.selectedPoint = null;
        this.wasDragged = false;
    }

    // Clipboard Operations
    copySelection() {
        if (this.selectedShape) {
            const serializeVector = (v) => ({ x: v.x, y: v.y });
            let data;

            if (this.selectedShape.type === 'point') {
                data = serializeVector(this.selectedShape.data);
            } else {
                data = this.selectedShape.data.map(serializeVector);
            }

            this.clipboard = {
                type: this.selectedShape.type,
                data: data
            };
            console.log("Copied to clipboard:", this.clipboard);
        }
    }

    pasteSelection() {
        if (this.clipboard) {
            const deserializeVector = (v) => createVector(v.x + 20, v.y + 20); // Offset slightly

            if (this.clipboard.type === 'point') {
                this.shapes.points.push(deserializeVector(this.clipboard.data));
            } else if (this.clipboard.type === 'quad') {
                this.shapes.quads.push(this.clipboard.data.map(deserializeVector));
            } else if (this.clipboard.type === 'bezier') {
                this.shapes.beziers.push(this.clipboard.data.map(deserializeVector));
            }

            this.pushToHistory();
        }
    }

    deleteSelection() {
        if (this.selectedShape) {
            if (this.selectedShape.type === 'point') {
                this.shapes.points.splice(this.selectedShape.index, 1);
            } else if (this.selectedShape.type === 'quad') {
                this.shapes.quads.splice(this.selectedShape.index, 1);
            } else if (this.selectedShape.type === 'bezier') {
                this.shapes.beziers.splice(this.selectedShape.index, 1);
            }

            this.selectedShape = null;
            this.selectedPoint = null;
            this.pushToHistory();
        }
    }
}