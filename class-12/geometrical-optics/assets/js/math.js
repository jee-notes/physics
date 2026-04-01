// math.js
const mjScript = document.createElement("script");
mjScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
mjScript.async = true;
document.head.appendChild(mjScript);

const paperScript = document.createElement("script");
paperScript.src = "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js";
document.head.appendChild(paperScript);

paperScript.onload = function() {
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
window.addExtendedObject = function(p1_raw, height, color = 'black') {
    const base = new paper.Point(p1_raw);
    
    // 1. Calculate the Tip point
    // A positive height moves Y *up* (subtract height), negative moves Y *down* (add height).
    const tip = base.add([0, -height]);

    // 2. Draw the main Object Arrow (bold)
    const objectBody = new paper.Path.Line(base, tip);
    objectBody.set({
        strokeColor: color,
        strokeWidth: 4 // Set bold as requested
    });

    // 3. Draw the Arrow Head on the Tip
    // Vector direction from base to tip (points in 'up' if height > 0)
    const direction = tip.subtract(base).normalize();
    
    // Create wings
    const arrowLen = 10;
    const wing1 = direction.rotate(150).multiply(arrowLen);
    const wing2 = direction.rotate(-150).multiply(arrowLen);

    const head = new paper.Path();
    head.add(tip.add(wing1));
    head.add(tip);
    head.add(tip.add(wing2));
    
    head.set({
        strokeColor: color,
        strokeWidth: 3 // Match the bold weight
    });

    // head.fillColor = color; // Optional: fill the head for solid look

    // 4. Return the calculated Tip for easy ray targeting
    return { base: base, tip: tip };
};	
    
window.drawConvexMirror = function(p1_raw, p2_raw, radius, isClockwise) {
    const p1 = new paper.Point(p1_raw);
    const p2 = new paper.Point(p2_raw);
    let r = radius;
    
    const dist = p1.getDistance(p2);
    if (dist > 2 * r) r = dist / 2; 

    const midpoint = p1.add(p2).divide(2);
    const chordVector = p2.subtract(p1);
    const h = Math.sqrt(Math.pow(r, 2) - Math.pow(dist / 2, 2));
    
    let perpDir = chordVector.rotate(90).normalize();
    if (!isClockwise) perpDir = perpDir.multiply(-1);

    const centerC = midpoint.add(perpDir.multiply(h));
    const poleP = centerC.add(perpDir.multiply(-r));

    const mirrorPath = new paper.Path.Arc(p1, poleP, p2);
    mirrorPath.set({
        strokeColor: 'black',
        strokeWidth: 2.5
    });

    // --- HATCHING LOGIC START ---
    const startAngle = p1.subtract(centerC).angle;
    const endAngle = p2.subtract(centerC).angle;
    
    // Determine the total angular spread
    let sweep = endAngle - startAngle;
    if (isClockwise && sweep < 0) sweep += 360;
    if (!isClockwise && sweep > 0) sweep -= 360;

    // We want 9 total points (4 top + 1 center/pole + 4 bottom = 9)
    // --- HATCHING LOGIC (FIXED FOR CONVEX) ---
const numHatches = 9; 
for (let i = 0; i < numHatches; i++) {
    const fraction = i / (numHatches - 1);
    const currentAngle = startAngle + (sweep * fraction);
    
    // Position on the mirror surface
    const pos = centerC.add(new paper.Point({ angle: currentAngle, length: r }));
    
    // FIX: To make it CONVEX, the hatch must point TOWARD the center C.
    // We create a vector pointing toward C by using a negative length 
    // relative to the angle from the center.
    const hVec = new paper.Point({ 
        angle: currentAngle, 
        length: 15 // Negative length pulls the line INWARD toward Center C
    }).rotate(150); // Add a slight slant for that textbook look

    const hatch = new paper.Path.Line(pos, pos.add(hVec));
    hatch.strokeColor = '#888';
    hatch.strokeWidth = 1;
}
    // --- HATCHING LOGIC END ---

    // Return both so you can use them in HTML
    return { pole: poleP, center: centerC }; 
};
window.drawConcaveMirror = function(p1_raw, p2_raw, radius, isClockwise) {
    const p1 = new paper.Point(p1_raw);
    const p2 = new paper.Point(p2_raw);
    let r = radius;
    
    const dist = p1.getDistance(p2);
    if (dist > 2 * r) r = dist / 2; 

    const midpoint = p1.add(p2).divide(2);
    const chordVector = p2.subtract(p1);
    const h = Math.sqrt(Math.pow(r, 2) - Math.pow(dist / 2, 2));
    
    let perpDir = chordVector.rotate(90).normalize();
    if (!isClockwise) perpDir = perpDir.multiply(-1);

    const centerC = midpoint.add(perpDir.multiply(h));
    const poleP = centerC.add(perpDir.multiply(-r));

    const mirrorPath = new paper.Path.Arc(p1, poleP, p2);
    mirrorPath.set({
        strokeColor: 'black',
        strokeWidth: 2.5
    });

    // --- HATCHING LOGIC START ---
    const startAngle = p1.subtract(centerC).angle;
    const endAngle = p2.subtract(centerC).angle;
    
    // Determine the total angular spread
    let sweep = endAngle - startAngle;
    if (isClockwise && sweep < 0) sweep += 360;
    if (!isClockwise && sweep > 0) sweep -= 360;

    // We want 9 total points (4 top + 1 center/pole + 4 bottom = 9)
    const numHatches = 9; 
    for (let i = 0; i < numHatches; i++) {
        // Calculate the angle for this specific hatch
        const fraction = i / (numHatches - 1);
        const currentAngle = startAngle + (sweep * fraction);
        
        // Find the point on the arc
        const pos = centerC.add(new paper.Point({ angle: currentAngle, length: r }));
        
        // Create the hatch vector (pointing away/towards center)
        // Adjust 'length: -12' to '12' if you want to swap between Convex/Concave
        const hVec = new paper.Point({ angle: currentAngle, length: -15 }).rotate(30);
        
        const hatch = new paper.Path.Line(pos, pos.add(hVec));
        hatch.strokeColor = '#888';
        hatch.strokeWidth = 1;
    }
    // --- HATCHING LOGIC END ---

    // Return both so you can use them in HTML
    return { pole: poleP, center: centerC }; 
};

window.addRay = function(start_point, end_point, color = 'black', isDashed = false) {
    const start = new paper.Point(start_point);
    const end = new paper.Point(end_point);

    // 1. Draw the main Ray (the stem)
    const ray = new paper.Path.Line(start, end);
    ray.strokeColor = color;
    ray.strokeWidth = 1.5;
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
    head.strokeWidth = 2;
    // head.fillColor = color; // Uncomment if you want a solid triangle head

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