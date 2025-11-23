// PathTracer.js
// Re‑implemented PathTracer tool for generating continuous SVG paths across mosaic tiles.
// Based on PathTracer_doc.md specifications.

/**
 * PathTracer class extracts geometric segments from the mosaic grid,
 * stitches them based on a tolerance, and generates optimized SVG markup.
 */
class PathTracer {
    /**
     * @param {MosaicGenerator} mosaicGenerator - Instance providing the grid data.
     * @param {Array} tiles - Array of tile data objects.
     * @param {number} tileSize - Pixel size of each tile in the final SVG.
     */
    constructor(mosaicGenerator, tiles, tileSize = 100) {
        this.mosaicGenerator = mosaicGenerator;
        this.tiles = tiles;
        this.tileSize = tileSize;
        // Internal high‑resolution canvas size per tile (as used elsewhere)
        this.internalSize = 600; // matches design space
        this.segments = []; // will hold raw segment objects
        this.stitchedCache = null; // Cache for stitched paths
        this.prevTolerance = null; // Tolerance used for cached paths
    }

    /**
     * Clear all internal caches. Call this when grid or tiles change.
     */
    clearCache() {
        this.segments = [];
        this.stitchedCache = null;
        this.prevTolerance = null;
    }

    /**
     * Extract all line/curve segments from every tile in the mosaic.
     * Returns an array of segment objects:
     *   { type: 'quad'|'bezier'|'point', points: [{x,y}, ...], style: {color, weight, secondary} }
     */
    extractSegments() {
        const cols = this.mosaicGenerator.cols;
        const rows = this.mosaicGenerator.rows;
        const grid = this.mosaicGenerator.grid;
        const segs = [];

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (!grid[i] || !grid[i][j]) continue;
                const cell = grid[i][j];
                if (!this.tiles[cell.tileIndex]) continue;
                const tile = this.tiles[cell.tileIndex];
                const rotation = cell.rotation; // degrees
                const offsetX = i * this.internalSize;
                const offsetY = j * this.internalSize;

                const transform = (pt) => {
                    // Apply rotation around tile centre (300,300) then translate to global position
                    const cx = 300;
                    const cy = 300;
                    const rad = (rotation * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const x = pt.x - cx;
                    const y = pt.y - cy;
                    const xr = x * cos - y * sin + cx + offsetX;
                    const yr = x * sin + y * cos + cy + offsetY;
                    return { x: xr, y: yr };
                };

                // Helper to push a segment with style grouping
                const pushSegment = (type, points, primary, secondary, weight, secWidth) => {
                    if (!points || points.length === 0) return;
                    segs.push({
                        type,
                        points: points.map(transform),
                        style: {
                            primaryColor: primary,
                            primaryWeight: weight,
                            secondaryColor: secondary,
                            secondaryWidth: secWidth,
                            secondaryTotalWeight: weight + secWidth
                        },
                        origin: { col: i, row: j }
                    });
                };

                // Points (drawn as circles)
                tile.shapes.points.forEach((pt) => {
                    pushSegment('point', [pt], tile.primaryColor, tile.secondaryColor, tile.strokeWeight, tile.secondaryStrokeWidth);
                });

                // Quads (convert to cubic Bézier for compatibility)
                tile.shapes.quads.forEach((quad) => {
                    // Quad: p0, p1 (control), p2
                    const p0 = quad[0];
                    const p1 = quad[1];
                    const p2 = quad[2];

                    // Convert to Cubic: start, c1, c2, end
                    // c1 = p0 + 2/3 * (p1 - p0)
                    // c2 = p2 + 2/3 * (p1 - p2)
                    const c1 = {
                        x: p0.x + (2 / 3) * (p1.x - p0.x),
                        y: p0.y + (2 / 3) * (p1.y - p0.y)
                    };
                    const c2 = {
                        x: p2.x + (2 / 3) * (p1.x - p2.x),
                        y: p2.y + (2 / 3) * (p1.y - p2.y)
                    };
                    const cubic = [p0, c1, c2, p2];

                    pushSegment('bezier', cubic, tile.primaryColor, tile.secondaryColor, tile.strokeWeight, tile.secondaryStrokeWidth);
                });

                // Beziers (cubic – four points)
                tile.shapes.beziers.forEach((bez) => {
                    pushSegment('bezier', bez, tile.primaryColor, tile.secondaryColor, tile.strokeWeight, tile.secondaryStrokeWidth);
                });
            }
        }
        this.segments = segs;
        return segs;
    }

    /**
     * Stitch segments that have endpoints within the given tolerance.
     * Returns an array of stitched paths, each path is an ordered list of points
     * and carries the original style information.
     * @param {number} tolerance - Pixel tolerance for connecting endpoints.
     */
    stitchSegments(tolerance = 5) {
        // Return cached result if available and tolerance hasn't changed
        if (this.stitchedCache && this.prevTolerance === tolerance) {
            return this.stitchedCache;
        }

        // Group by style to keep colors/weights consistent
        const groups = {};
        this.segments.forEach((seg) => {
            const key = `${seg.style.primaryColor}|${seg.style.primaryWeight}|${seg.style.secondaryColor}|${seg.style.secondaryWidth}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(seg);
        });

        const stitched = [];
        const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        const tol2 = tolerance * tolerance;

        Object.values(groups).forEach((group) => {
            const used = new Set();
            group.forEach((seg, idx) => {
                if (used.has(idx)) return;

                // Initialize path with origin tracking
                const path = {
                    type: seg.type,
                    points: [...seg.points],
                    style: seg.style,
                    firstOrigin: seg.origin,
                    lastOrigin: seg.origin
                };
                used.add(idx);

                let extended = true;
                while (extended) {
                    extended = false;
                    let bestMatch = null;
                    // Score = (isDifferentOrigin ? 1000000 : 0) - distanceSquared
                    // Higher score is better.
                    let bestScore = -Infinity;

                    for (let i = 0; i < group.length; i++) {
                        if (used.has(i)) continue;
                        const cand = group[i];

                        // Check endpoints
                        const endPt = path.points[path.points.length - 1];
                        const startPt = path.points[0];

                        const candStart = cand.points[0];
                        const candEnd = cand.points[cand.points.length - 1];

                        // Helper to calculate score
                        const calcScore = (d2, origin, pathOrigin) => {
                            const isDiff = origin.col !== pathOrigin.col || origin.row !== pathOrigin.row;
                            return (isDiff ? 1000000 : 0) - d2;
                        };

                        // Check connections
                        // 1. Path End -> Cand Start
                        let d = dist2(endPt, candStart);
                        if (d <= tol2) {
                            const score = calcScore(d, cand.origin, path.lastOrigin);
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = { index: i, action: 'append', cand };
                            }
                        }

                        // 2. Path End -> Cand End (Reverse Cand)
                        d = dist2(endPt, candEnd);
                        if (d <= tol2) {
                            const score = calcScore(d, cand.origin, path.lastOrigin);
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = { index: i, action: 'appendRev', cand };
                            }
                        }

                        // 3. Path Start -> Cand End (Prepend Cand)
                        d = dist2(startPt, candEnd);
                        if (d <= tol2) {
                            const score = calcScore(d, cand.origin, path.firstOrigin);
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = { index: i, action: 'prepend', cand };
                            }
                        }

                        // 4. Path Start -> Cand Start (Prepend Rev Cand)
                        d = dist2(startPt, candStart);
                        if (d <= tol2) {
                            const score = calcScore(d, cand.origin, path.firstOrigin);
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = { index: i, action: 'prependRev', cand };
                            }
                        }
                    }

                    if (bestMatch) {
                        const { index, action, cand } = bestMatch;
                        used.add(index);
                        extended = true;

                        // --- FIX START: Ascenso de jerarquía de tipos ---
                        // Si el path actual es un simple punto, pero le estamos pegando
                        // una estructura compleja (bezier, quad, etc), el path debe
                        // adoptar ese tipo complejo para poder renderizarse bien.
                        if (path.type === 'point' && cand.type !== 'point') {
                            path.type = cand.type;
                        }
                        // --- FIX END ---

                        if (action === 'append') {
                            path.points.push(...cand.points.slice(1));
                            path.lastOrigin = cand.origin;
                        } else if (action === 'appendRev') {
                            const rev = [...cand.points].reverse();
                            path.points.push(...rev.slice(1));
                            path.lastOrigin = cand.origin;
                        } else if (action === 'prepend') {
                            const newPts = [...cand.points];
                            newPts.pop();
                            path.points = newPts.concat(path.points);
                            path.firstOrigin = cand.origin;
                        } else if (action === 'prependRev') {
                            const rev = [...cand.points].reverse();
                            rev.pop();
                            path.points = rev.concat(path.points);
                            path.firstOrigin = cand.origin;
                        }
                    }
                }
                stitched.push(path);
            });
        });

        // Sort by stroke weight descending (thicker lines first) to ensure proper layering
        // This sorting is now less critical as we render in two passes (secondary then primary)
        // but can still be useful for consistent rendering within each pass if multiple secondary/primary weights exist.
        stitched.sort((a, b) => b.style.secondaryTotalWeight - a.style.secondaryTotalWeight);


        // Update cache
        this.stitchedCache = stitched;
        this.prevTolerance = tolerance;

        return stitched;
    }

    /**
     * Generate SVG markup for the stitched paths and isolated points.
     * @param {number} tolerance - Tolerance passed to stitching.
     * @returns {string} SVG string (inner content, without outer <svg> wrapper).
     */
    generateSVG(tolerance = 5) {
        if (!this.segments.length) this.extractSegments();
        const stitched = this.stitchSegments(tolerance);
        const scale = this.tileSize / this.internalSize;
        let svgContent = '';

        // Helper to generate path data
        const getPathData = (path) => {
            const pts = path.points;
            if (!pts || pts.length === 0) return '';

            let d = '';

            if (path.type === 'bezier') {
                // Bezier curves: need at least 4 points (start, cp1, cp2, end)
                if (pts.length < 4) {
                    // Fallback to polyline if not enough points for bezier
                    d = `M ${pts[0].x * scale} ${pts[0].y * scale}`;
                    for (let i = 1; i < pts.length; i++) {
                        d += ` L ${pts[i].x * scale} ${pts[i].y * scale}`;
                    }
                } else {
                    // First bezier segment
                    d = `M ${pts[0].x * scale} ${pts[0].y * scale} C ${pts[1].x * scale} ${pts[1].y * scale} ${pts[2].x * scale} ${pts[2].y * scale} ${pts[3].x * scale} ${pts[3].y * scale}`;

                    // Continue with additional bezier segments (each needs 3 more points: cp1, cp2, end)
                    for (let i = 4; i + 2 < pts.length; i += 3) {
                        d += ` C ${pts[i].x * scale} ${pts[i].y * scale} ${pts[i + 1].x * scale} ${pts[i + 1].y * scale} ${pts[i + 2].x * scale} ${pts[i + 2].y * scale}`;
                    }
                }
            } else if (pts.length === 2) {
                // Simple line segment
                d = `M ${pts[0].x * scale} ${pts[0].y * scale} L ${pts[1].x * scale} ${pts[1].y * scale}`;
            } else if (pts.length > 2) {
                // Polyline for other cases
                d = `M ${pts[0].x * scale} ${pts[0].y * scale}`;
                for (let i = 1; i < pts.length; i++) {
                    d += ` L ${pts[i].x * scale} ${pts[i].y * scale}`;
                }
            } else if (pts.length === 1) {
                // Single point - should be handled as 'point' type, but provide fallback
                // This shouldn't normally happen as single points should have type='point'
                return '';
            }

            return d;
        };

        // Pass 1: Secondary Strokes (Background)
        stitched.forEach((path) => {
            if (path.style.secondaryWidth > 0) {
                if (path.type === 'point') {
                    const pt = path.points[0];
                    const r = (path.style.secondaryTotalWeight * scale) / 2;
                    svgContent += `    <circle cx="${pt.x * scale}" cy="${pt.y * scale}" r="${r}" fill="${path.style.secondaryColor}"/>\n`;
                } else {
                    const d = getPathData(path);
                    const stroke = path.style.secondaryColor;
                    const sw = path.style.secondaryTotalWeight * scale;
                    svgContent += `    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
                }
            }
        });

        // Pass 2: Primary Strokes (Foreground)
        stitched.forEach((path) => {
            if (path.type === 'point') {
                const pt = path.points[0];
                const r = (path.style.primaryWeight * scale) / 2;
                svgContent += `    <circle cx="${pt.x * scale}" cy="${pt.y * scale}" r="${r}" fill="${path.style.primaryColor}"/>\n`;
            } else {
                const d = getPathData(path);
                const stroke = path.style.primaryColor;
                const sw = path.style.primaryWeight * scale;
                svgContent += `    <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
            }
        });

        return svgContent;
    }

    /**
     * Draw the stitched paths to a p5.js canvas.
     * @param {Object} p5 - The p5.js instance (or window).
     * @param {number} tolerance - Stitching tolerance.
     */
    drawToCanvas(p5, tolerance = 5) {
        if (!this.segments.length) this.extractSegments();
        const stitched = this.stitchSegments(tolerance);
        const scaleFactor = this.tileSize / this.internalSize;

        p5.push();

        // Pass 1: Secondary Strokes (Background)
        stitched.forEach((path) => {
            if (path.style.secondaryWidth > 0) {
                if (path.type === 'point') {
                    const pt = path.points[0];
                    p5.fill(path.style.secondaryColor);
                    p5.noStroke();
                    p5.circle(pt.x * scaleFactor, pt.y * scaleFactor, path.style.secondaryTotalWeight * scaleFactor);
                } else {
                    p5.noFill();
                    p5.stroke(path.style.secondaryColor);
                    p5.strokeWeight(path.style.secondaryTotalWeight * scaleFactor);
                    p5.strokeCap(p5.ROUND);
                    p5.strokeJoin(p5.ROUND);

                    p5.beginShape();
                    const pts = path.points;
                    p5.vertex(pts[0].x * scaleFactor, pts[0].y * scaleFactor);
                    if (path.type === 'bezier') {
                        for (let i = 1; i + 2 < pts.length; i += 3) {
                            p5.bezierVertex(
                                pts[i].x * scaleFactor, pts[i].y * scaleFactor,
                                pts[i + 1].x * scaleFactor, pts[i + 1].y * scaleFactor,
                                pts[i + 2].x * scaleFactor, pts[i + 2].y * scaleFactor
                            );
                        }
                    }
                    p5.endShape();
                }
            }
        });

        // Pass 2: Primary Strokes (Foreground)
        stitched.forEach((path) => {
            if (path.type === 'point') {
                const pt = path.points[0];
                p5.fill(path.style.primaryColor);
                p5.noStroke();
                p5.circle(pt.x * scaleFactor, pt.y * scaleFactor, path.style.primaryWeight * scaleFactor);
            } else {
                p5.noFill();
                p5.stroke(path.style.primaryColor);
                p5.strokeWeight(path.style.primaryWeight * scaleFactor);
                p5.strokeCap(p5.ROUND);
                p5.strokeJoin(p5.ROUND);

                p5.beginShape();
                const pts = path.points;
                p5.vertex(pts[0].x * scaleFactor, pts[0].y * scaleFactor);
                if (path.type === 'bezier') {
                    for (let i = 1; i + 2 < pts.length; i += 3) {
                        p5.bezierVertex(
                            pts[i].x * scaleFactor, pts[i].y * scaleFactor,
                            pts[i + 1].x * scaleFactor, pts[i + 1].y * scaleFactor,
                            pts[i + 2].x * scaleFactor, pts[i + 2].y * scaleFactor
                        );
                    }
                }
                p5.endShape();
            }
        });

        p5.pop();
    }
}

// Export for use in other modules (if using module system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathTracer;
}
