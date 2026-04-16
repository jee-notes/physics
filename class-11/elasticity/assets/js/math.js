// math.js
const mjScript = document.createElement("script");
mjScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
mjScript.async = true;
document.head.appendChild(mjScript);

const paperScript = document.createElement("script");
paperScript.src = "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js";
document.head.appendChild(paperScript);

paperScript.onload = function() {
window.addAngleArc = function(vertex_raw, p1_raw, p2_raw, radius, label, isClockwise = true) {
    const vertex = new paper.Point(vertex_raw);
    const p1 = new paper.Point(p1_raw);
    const p2 = new paper.Point(p2_raw);

    // 1. Get the angles of the lines relative to the vertex
    let a1 = p1.subtract(vertex).angle;
    let a2 = p2.subtract(vertex).angle;

    // 2. Calculate the sweep
    let sweep = a2 - a1;
    
    // Adjust sweep based on the desired direction
    if (isClockwise && sweep < 0) sweep += 360;
    if (!isClockwise && sweep > 0) sweep -= 360;

    // 3. Define the three points of the Arc
    const arcP1 = vertex.add(new paper.Point({ angle: a1, length: radius }));
    const arcP2 = vertex.add(new paper.Point({ angle: a2, length: radius }));
    
    // The 'through' point is exactly in the middle of the sweep
    const midAngle = a1 + (sweep / 2);
    const through = vertex.add(new paper.Point({ angle: midAngle, length: radius }));

    // 4. Draw the Arc
    const arc = new paper.Path.Arc(arcP1, through, arcP2);
    arc.set({
        strokeColor: 'black',
        strokeWidth: 1
    });

    // 5. Place the Label
    const labelPos = vertex.add(new paper.Point({ angle: midAngle, length: radius + 15 }));
    new paper.PointText({
        point: labelPos.add([-5, 5]),
        content: label,
        fontSize: 14,
        fontWeight: 'bold'
    });

    return arc;
};
window.drawPlaneMirror = function(p1_raw, p2_raw, isClockwise) {
    const p1 = new paper.Point(p1_raw);
    const p2 = new paper.Point(p2_raw);

    // 1. Draw the Mirror Surface
    const mirrorPath = new paper.Path.Line(p1, p2);
    mirrorPath.set({
        strokeColor: 'black',
        strokeWidth: 2.5
    });

    // 2. Calculate the Normal Vector for hatching
    const vector = p2.subtract(p1);
    // Rotate 90 degrees to get the perpendicular direction
    let normal = vector.rotate(90).normalize();
    
    // If isClockwise is true, hatching goes to the "right" of the vector p1->p2
    // If false, we flip it to the other side
    if (!isClockwise) normal = normal.multiply(-1);

    // 3. Draw Hatching (9 lines distributed along the length)
    const numHatches = 9;
    for (let i = 0; i < numHatches; i++) {
        const fraction = i / (numHatches - 1);
        // Find point on the line
        const pos = p1.add(vector.multiply(fraction));
        
        // Create slanted hatch: pointing in 'normal' direction but rotated 30 deg
        const hVec = normal.multiply(15).rotate(30);
        
        const hatch = new paper.Path.Line(pos, pos.add(hVec));
        hatch.strokeColor = '#888';
        hatch.strokeWidth = 1;
    }

    // 4. Return the midpoint as the "Pole" for easy ray targeting
    return { pole: p1.add(p2).divide(2), normal: normal };
};

window.addRay = function(start_point, end_point, isDashed = false, color = 'black', sw = 2 ) {
    const start = new paper.Point(start_point);
    const end = new paper.Point(end_point);

    // 1. Draw the main Ray (the stem)
    const ray = new paper.Path.Line(start, end);
    ray.strokeColor = color;
    ray.strokeWidth = sw;
    if (isDashed) ray.dashArray = [6, 4];

    // 2. Calculate the Arrow Head
    // Get the vector of the line and normalize it (make length 1)
    const vector = end.subtract(start).normalize();
    
    // Create the two "wings" of the arrow head
    // Rotate the vector by 150 degrees (to point back-ish)
    const arrowLen = 12;
    const leftWing = vector.rotate(150).multiply(arrowLen);
    const rightWing = vector.rotate(-150).multiply(arrowLen);

    // 3. Draw the Head
    const head = new paper.Path();
    head.add(end.add(leftWing));
    head.add(end);
    head.add(end.add(rightWing));
    
    head.strokeColor = color;
    head.strokeWidth = sw;
    head.fillColor = color;

    return { ray: ray, head: head };
};

    // Global Helper: Add a Label Point
    window.addPoint = function(pos, label, offset) {
        new paper.Path.Circle(pos, 4).fillColor = 'red';
        new paper.PointText({
            point: pos.add(offset),
            content: label,
            fontSize: 16,
            fontWeight: 'bold'
        });
    };

    window.paperIsReady = true;
    window.dispatchEvent(new Event('PaperReady'));
};