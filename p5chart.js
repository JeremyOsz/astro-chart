// The astrological data as a multi-line string
const data = `Sun,Sagittarius,17°09'
Moon,Capricorn,26°20'
Mercury,Sagittarius,14°28',R
Venus,Scorpio,4°00'
Mars,Sagittarius,7°36'
Jupiter,Virgo,13°55',R
Saturn,Aquarius,3°32'
Uranus,Capricorn,12°23'
Neptune,Capricorn,15°24'
Pluto,Scorpio,21°20'
Node,Capricorn,10°59',R
Lilith,Capricorn,25°14'
Chiron,Leo,9°20',R
Fortune,Libra,22°29'
Vertex,Aries,29°44'
ASC,Sagittarius,1°40'
MC,Leo,10°14'`;

// --- Toggle State Variables ---
let showDegreeMarkers = true;
let showExtendedPlanets = true;
let showAspectLines = true;

// --- Data Structures ---
let chartData = [], houseCusps = [], aspects = [], buttons = [];

const zodiacSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
// Unicode zodiac symbols that render as proper symbols in most fonts
const zodiacSymbols = {
  "Aries": "♈", 
  "Taurus": "♉", 
  "Gemini": "♊", 
  "Cancer": "♋", 
  "Leo": "♌", 
  "Virgo": "♍", 
  "Libra": "♎", 
  "Scorpio": "♏", 
  "Sagittarius": "♐", 
  "Capricorn": "♑", 
  "Aquarius": "♒", 
  "Pisces": "♓"
};
// Thematic colors for each zodiac sign by element
const zodiacColors = {
  "Aries": "#e53935",      // Fire - Red
  "Leo": "#e53935",        // Fire - Red
  "Sagittarius": "#e53935",// Fire - Red
  "Taurus": "#43a047",     // Earth - Green
  "Virgo": "#43a047",      // Earth - Green
  "Capricorn": "#43a047",  // Earth - Green
  "Gemini": "#fbc02d",     // Air - Yellow
  "Libra": "#fbc02d",      // Air - Yellow
  "Aquarius": "#fbc02d",   // Air - Yellow
  "Cancer": "#039be5",     // Water - Blue
  "Scorpio": "#039be5",    // Water - Blue
  "Pisces": "#039be5"      // Water - Blue
};
const ZODIAC_GLYPH_COLOR = '#8A2BE2';
const planetSymbols = { "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇", "Node": "☊", "Lilith": "⚸", "Chiron": "⚷", "Fortune": "⊗", "Vertex": "Vx", "ASC": "Asc", "MC": "MC", "DSC": "Dsc", "IC": "IC"};
const extendedPlanetNames = ["Chiron", "Lilith", "Node", "Fortune", "Vertex"];
const aspectDefs = {
    'Conjunction':    { angle: 0,   orb: 8,  color: '#228B22', weight: 2.5, style: 'solid' }, // Green
    'Opposition':     { angle: 180, orb: 8,  color: '#FF0000', weight: 2.5, style: 'solid' },
    'Square':         { angle: 90,  orb: 8,  color: '#FF0000', weight: 2.5, style: 'solid' },
    'Trine':          { angle: 120, orb: 8,  color: '#0000FF', weight: 2,   style: 'solid' },
    'Sextile':        { angle: 60,  orb: 6,  color: '#0000FF', weight: 2,   style: 'dotted' },
    'Quincunx':       { angle: 150, orb: 3,  color: '#B8860B', weight: 1.5, style: 'dashed' }, // Dark goldenrod
    'Semi-sextile':   { angle: 30,  orb: 2,  color: '#888888', weight: 1,   style: 'dotted' },
    'Semi-square':    { angle: 45,  orb: 2,  color: '#888888', weight: 1,   style: 'dotted' },
    'Sesquiquadrate': { angle: 135, orb: 2,  color: '#888888', weight: 1,   style: 'dotted' },
    'Quintile':       { angle: 72,  orb: 1.5,color: '#8A2BE2', weight: 1,   style: 'dotted' }, // BlueViolet
    'Bi-quintile':    { angle: 144, orb: 1.5,color: '#8A2BE2', weight: 1,   style: 'dotted' }
};
const coreAspectBodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "ASC"];

// --- Layout Constants ---
const ZODIAC_OUTER_RADIUS = 350;
const ZODIAC_INNER_RADIUS = 300;
const PLANET_RING_RADIUS = 270;
const LABEL_RADIUS = 230;
const HOUSE_LINE_INNER_RADIUS = 170;
const HOUSE_NUM_RADIUS = 180;
const ASPECT_HUB_RADIUS = 170;
const CLUSTER_THRESHOLD = 12;

function setup() {
  const canvas = createCanvas(800, 800);
  const chartDiv = document.getElementById('chart-canvas');
  if (chartDiv) chartDiv.appendChild(canvas.elt);
  angleMode(DEGREES);
  textFont('Noto Sans Symbols');
  parseDataAndGenerateHouses();
  calculateAspects();

  // Initialize state from HTML checkboxes
  showDegreeMarkers = document.getElementById('toggle-degree').checked;
  showExtendedPlanets = document.getElementById('toggle-extended').checked;
  showAspectLines = document.getElementById('toggle-aspects').checked;

  // Listen to HTML toggles
  document.getElementById('toggle-degree').addEventListener('change', e => {
    showDegreeMarkers = e.target.checked;
    redraw();
  });
  document.getElementById('toggle-extended').addEventListener('change', e => {
    showExtendedPlanets = e.target.checked;
    redraw();
  });
  document.getElementById('toggle-aspects').addEventListener('change', e => {
    showAspectLines = e.target.checked;
    redraw();
  });
}

function draw() {
  background(255);
  translate(width / 2, height / 2);
  drawZodiacWheel();
  drawHouseLinesAndNumbers();
  if (showAspectLines) drawAspects();
  drawPlanets();
  
  handleInteractivity();
}

function mousePressed() {
    buttons.forEach(btn => {
        if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) btn.action();
    });
}

function parseDataAndGenerateHouses() {
  chartData = data.split('\n').filter(line => line.trim() !== '').map(line => {
    const parts = line.split(',');
    const [deg, min] = parts[2].replace('’', '').split('°');
    const signIndex = zodiacSigns.indexOf(parts[1]);
    return {
      name: parts[0], sign: parts[1],
      degree: parseInt(deg), minute: parseInt(min),
      absoluteDegree: signIndex * 30 + parseInt(deg) + parseInt(min) / 60,
      isRetrograde: parts.length > 3 && parts[3] === 'R',
      visualDegree: 0
    };
  });
  const asc = chartData.find(p => p.name === 'ASC');
  for (let i = 0; i < 12; i++) {
    // Correctly calculate house cusps counter-clockwise for a Whole Sign system
    houseCusps.push({ house: i + 1, absoluteDegree: (asc.absoluteDegree + i * 30) % 360 });
  }
  const dsc = { name: 'DSC', absoluteDegree: (asc.absoluteDegree + 180) % 360 };
  const mc = chartData.find(p => p.name === 'MC');
  const ic = { name: 'IC', absoluteDegree: (mc.absoluteDegree + 180) % 360 };
  chartData.push(dsc, ic);
}

function calculateAspects() {
    aspects = [];
    const planets = chartData.filter(p => coreAspectBodies.includes(p.name));
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            let angleDiff = abs(p1.absoluteDegree - p2.absoluteDegree);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;
            for (const aspectName in aspectDefs) {
                const aspect = aspectDefs[aspectName];
                if (abs(angleDiff - aspect.angle) <= aspect.orb) {
                    aspects.push({p1, p2, type: aspectName, ...aspect});
                    break;
                }
            }
        }
    }
}

// --- Drawing Functions ---

function drawZodiacWheel() {
  const asc = chartData.find(p => p.name === 'ASC');
  if (!asc) return;
  const ascDegree = asc.absoluteDegree;

  stroke(180); noFill();
  ellipse(0, 0, ZODIAC_OUTER_RADIUS * 2);
  ellipse(0, 0, ZODIAC_INNER_RADIUS * 2);
  for (let i = 0; i < 360; i++) {
    const angle = 180 - (i - ascDegree); let startRadius = ZODIAC_INNER_RADIUS;
    if (i % 30 === 0) { strokeWeight(1.5); stroke(0); }
    else if (showDegreeMarkers) {
        strokeWeight(0.5); stroke(200);
        if (i % 10 === 0) { strokeWeight(1); stroke(100); startRadius = ZODIAC_INNER_RADIUS + 20; }
        else if (i % 5 === 0) { startRadius = ZODIAC_INNER_RADIUS + 30; }
        else { startRadius = ZODIAC_INNER_RADIUS + 40; }
    } else continue;
    line(cos(angle) * ZODIAC_INNER_RADIUS, sin(angle) * ZODIAC_INNER_RADIUS, cos(angle) * startRadius, sin(angle) * startRadius);
  }
  // Draw zodiac glyphs in natural order, rotated by ASC
  for (let i = 0; i < 12; i++) {
    const signMidpointDegree = (i * 30) + 15;
    const angle = 180 - (signMidpointDegree - ascDegree);
    fill(zodiacColors[zodiacSigns[i]]); noStroke(); textSize(24); textAlign(CENTER, CENTER);
    text(zodiacSymbols[zodiacSigns[i]], cos(angle) * (ZODIAC_INNER_RADIUS + 25), sin(angle) * (ZODIAC_INNER_RADIUS + 25));
  }
}

function drawHouseLinesAndNumbers() {
    const asc = chartData.find(p => p.name === 'ASC');
    if (!asc) return;
    const ascDegree = asc.absoluteDegree;
    const mc = chartData.find(p => p.name === 'MC');
    const axes = [asc, mc, chartData.find(p=>p.name==='DSC'), chartData.find(p=>p.name==='IC')];
    const HOUSE_LINE_CENTER_GAP = 170; // px, gap at center
    // Draw all 12 house cusps as spokes (with thick outer segment only on rim)
    houseCusps.forEach(cusp => {
        const angle = 180 - (cusp.absoluteDegree - ascDegree);
        const isAxisCusp = axes.some(ax => ax.absoluteDegree % 360 === cusp.absoluteDegree % 360);
        // Thin segment: from small radius to just before outer rim
        stroke(isAxisCusp ? 150 : 220);
        strokeWeight(1);
        const thinStartRadius = HOUSE_LINE_CENTER_GAP;
        const thinEndRadius = ZODIAC_INNER_RADIUS;
        const thinStartX = cos(angle) * thinStartRadius;
        const thinStartY = sin(angle) * thinStartRadius;
        const thinEndX = cos(angle) * thinEndRadius;
        const thinEndY = sin(angle) * thinEndRadius;
        line(thinStartX, thinStartY, thinEndX, thinEndY);
        // Thick segment: only on outermost 10%
        stroke(isAxisCusp ? 80 : 120);
        strokeWeight(isAxisCusp ? 4 : 2.5);
        const thickStartX = cos(angle) * thinEndRadius;
        const thickStartY = sin(angle) * thinEndRadius;
        const thickEndX = cos(angle) * ZODIAC_OUTER_RADIUS;
        const thickEndY = sin(angle) * ZODIAC_OUTER_RADIUS;
        line(thickStartX, thickStartY, thickEndX, thickEndY);
    });
    
    // Draw the main axes on top, thicker, and label them
    axes.forEach(point => {
        if(point) {
            const angle = 180 - (point.absoluteDegree - ascDegree);
            stroke(0); strokeWeight(2.5);
            const startX = cos(angle) * HOUSE_LINE_INNER_RADIUS;
            const startY = sin(angle) * HOUSE_LINE_INNER_RADIUS;
            const endX = cos(angle) * ZODIAC_INNER_RADIUS;
            const endY = sin(angle) * ZODIAC_INNER_RADIUS;
            line(startX, startY, endX, endY);
            fill(0); noStroke(); textSize(12);
            text(planetSymbols[point.name], cos(angle) * (ZODIAC_INNER_RADIUS - 10), sin(angle) * (ZODIAC_INNER_RADIUS - 10));
        }
    });
    
    // Draw house numbers
    houseCusps.forEach(cusp => {
        const midpointAngle = 180 - ((cusp.absoluteDegree + 15) - ascDegree);
        const x = cos(midpointAngle) * HOUSE_NUM_RADIUS;
        const y = sin(midpointAngle) * HOUSE_NUM_RADIUS;
        fill(200); noStroke(); textSize(14);
        text(cusp.house, x, y);
    });
}

function drawAspects() {
    const asc = chartData.find(p => p.name === 'ASC');
    if (!asc) return;
    const ascDegree = asc.absoluteDegree;
    // Draw faint aspect hub circle
    stroke(200, 80); // light gray, semi-transparent
    strokeWeight(1);
    noFill();
    ellipse(0, 0, ASPECT_HUB_RADIUS * 2);
    // Draw aspect lines
    aspects.forEach(aspect => {
        const angle1 = 180 - (aspect.p1.visualDegree - ascDegree);
        const angle2 = 180 - (aspect.p2.visualDegree - ascDegree);
        const hubX1 = cos(angle1) * ASPECT_HUB_RADIUS; const hubY1 = sin(angle1) * ASPECT_HUB_RADIUS;
        const hubX2 = cos(angle2) * ASPECT_HUB_RADIUS; const hubY2 = sin(angle2) * ASPECT_HUB_RADIUS;
        stroke(aspect.color); strokeWeight(aspect.weight);
        if (aspect.style === 'dotted') drawDottedLine(hubX1, hubY1, hubX2, hubY2, 3, 3);
        else line(hubX1, hubY1, hubX2, hubY2);
        noStroke(); fill(aspect.color);
        rectMode(CENTER); rect(hubX1, hubY1, 6, 6); rect(hubX2, hubY2, 6, 6); rectMode(CORNER);
    });
}

function findClusters(planets) {
    if(planets.length === 0) return [];
    let sorted = [...planets].sort((a,b) => a.absoluteDegree - b.absoluteDegree);
    let clusters = [[sorted[0]]];
    for(let i = 1; i < sorted.length; i++) {
        if(abs(sorted[i].absoluteDegree - sorted[i-1].absoluteDegree) < CLUSTER_THRESHOLD) {
            clusters[clusters.length - 1].push(sorted[i]);
        } else {
            clusters.push([sorted[i]]);
        }
    }
    return clusters;
}

function drawPlanets() {
  let planetsToDraw = chartData.filter(p => planetSymbols[p.name] && !['ASC', 'MC', 'DSC', 'IC'].includes(p.name));
  if (!showExtendedPlanets) {
    planetsToDraw = planetsToDraw.filter(p => !extendedPlanetNames.includes(p.name));
  }
  
  let clusters = findClusters(planetsToDraw);
  clusters.forEach(cluster => {
      const clusterSize = cluster.length;
      if(clusterSize === 1) {
          cluster[0].visualDegree = cluster[0].absoluteDegree;
      } else {
          let totalArc = (clusterSize - 1) * 9;
          let avgAngle = cluster.reduce((sum, p) => sum + p.absoluteDegree, 0) / clusterSize;
          let startAngle = avgAngle - totalArc / 2;
          cluster.forEach((p, i) => {
              p.visualDegree = startAngle + i * (totalArc / (clusterSize - 1));
          });
      }
  });

  const asc = chartData.find(p => p.name === 'ASC');
  if (!asc) return;
  const ascDegree = asc.absoluteDegree;

  planetsToDraw.forEach(p => {
    const angle = 180 - (p.visualDegree - ascDegree);
    const iconX = cos(angle) * PLANET_RING_RADIUS; const iconY = sin(angle) * PLANET_RING_RADIUS;
    const labelX = cos(angle) * LABEL_RADIUS; const labelY = sin(angle) * LABEL_RADIUS;

    // Draw notch before planet symbol
    stroke(100); strokeWeight(2);
    const notchStartX = cos(angle) * ZODIAC_INNER_RADIUS;
    const notchStartY = sin(angle) * ZODIAC_INNER_RADIUS;
    const notchEndX = cos(angle) * (ZODIAC_INNER_RADIUS + (PLANET_RING_RADIUS - ZODIAC_INNER_RADIUS) / 2);
    const notchEndY = sin(angle) * (ZODIAC_INNER_RADIUS + (PLANET_RING_RADIUS - ZODIAC_INNER_RADIUS) / 2);
    line(notchStartX, notchStartY, notchEndX, notchEndY);

    fill(p.isRetrograde ? '#FF0000' : '#000'); noStroke(); textSize(28); text(planetSymbols[p.name], iconX, iconY);
    
    // Draw label block aligned along the radial line (outward-in)
    push();
    translate(labelX, labelY);
    rotate(angle + 90); // Rotate to align with radial direction
    textAlign(CENTER, CENTER);
    fill(0); textSize(12); text(p.degree, 0, -10);
    fill(zodiacColors[p.sign]); textSize(12); text(zodiacSymbols[p.sign], 0, 4);
    fill(100); textSize(11); text(nf(p.minute, 2), 0, 18);
    if (p.isRetrograde) { fill('#FF0000'); textSize(10); text('Rx', 20, 18); }
    pop();
  });
}

// --- UI, Interactivity, and Helpers ---

function handleInteractivity() {
    const asc = chartData.find(p => p.name === 'ASC');
    if (!asc) return;
    const ascDegree = asc.absoluteDegree;
    let activePlanets = chartData.filter(p => planetSymbols[p.name]);
    if (!showExtendedPlanets) activePlanets = activePlanets.filter(p => !extendedPlanetNames.includes(p.name));
    let hoveredOnPlanet = false;
    activePlanets.forEach(p => {
        let radius = PLANET_RING_RADIUS;
        if (['ASC', 'MC', 'DSC', 'IC'].includes(p.name)) { radius = ZODIAC_INNER_RADIUS - 10; }
        const angle = 180 - (p.visualDegree - ascDegree);
        const x = cos(angle) * radius; const y = sin(angle) * radius;
        if (dist(mouseX - width / 2, mouseY - height / 2, x, y) < 15) {
            cursor('pointer'); hoveredOnPlanet = true;
            let info = `${p.name} at ${p.degree}° ${nf(p.minute, 2)}’ ${p.sign}`;
            const boxX = mouseX - width / 2 + 15; const boxY = mouseY - height / 2;
            fill(255, 255, 240, 230); stroke(0); strokeWeight(1); rect(boxX, boxY, textWidth(info) + 20, 25, 5);
            fill(0); noStroke(); textAlign(LEFT, CENTER); textSize(12);
            text(info, boxX + 10, boxY + 12.5);
        }
    });
}

function drawDottedLine(x1, y1, x2, y2, dashLength, gapLength) {
    const d = dist(x1, y1, x2, y2);
    const dashCount = floor(d / (dashLength + gapLength));
    const newX = (x2 - x1) / d; const newY = (y2 - y1) / d;
    for (let i = 0; i < dashCount; i++) {
        const startX = x1 + newX * (dashLength + gapLength) * i; const startY = y1 + newY * (dashLength + gapLength) * i;
        const endX = startX + newX * dashLength; const endY = startY + newY * dashLength;
        line(startX, startY, endX, endY);
    }
}