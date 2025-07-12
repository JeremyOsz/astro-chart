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
    let hoveredOnAspect = false;
    
    // Check for planet hover
    activePlanets.forEach(p => {
        let radius = PLANET_RING_RADIUS;
        if (['ASC', 'MC', 'DSC', 'IC'].includes(p.name)) { radius = ZODIAC_INNER_RADIUS - 10; }
        const angle = 180 - (p.visualDegree - ascDegree);
        const x = cos(angle) * radius; const y = sin(angle) * radius;
        if (dist(mouseX - width / 2, mouseY - height / 2, x, y) < 15) {
            cursor('pointer'); hoveredOnPlanet = true;
            let info = `${p.name} at ${p.degree}° ${nf(p.minute, 2)}' ${p.sign}`;
            const boxX = mouseX - width / 2 + 15; const boxY = mouseY - height / 2;
            fill(255, 255, 240, 230); stroke(0); strokeWeight(1); rect(boxX, boxY, textWidth(info) + 20, 25, 5);
            fill(0); noStroke(); textAlign(LEFT, CENTER); textSize(12);
            text(info, boxX + 10, boxY + 12.5);
        }
    });
    
    // Check for aspect hover
    if (showAspectLines && !hoveredOnPlanet) {
        aspects.forEach(aspect => {
            const angle1 = 180 - (aspect.p1.visualDegree - ascDegree);
            const angle2 = 180 - (aspect.p2.visualDegree - ascDegree);
            const hubX1 = cos(angle1) * ASPECT_HUB_RADIUS;
            const hubY1 = sin(angle1) * ASPECT_HUB_RADIUS;
            const hubX2 = cos(angle2) * ASPECT_HUB_RADIUS;
            const hubY2 = sin(angle2) * ASPECT_HUB_RADIUS;
            
            // Check if mouse is near the aspect line
            const mouseXRel = mouseX - width / 2;
            const mouseYRel = mouseY - height / 2;
            
            // Calculate distance from mouse to line segment
            const A = mouseXRel - hubX1;
            const B = mouseYRel - hubY1;
            const C = hubX2 - hubX1;
            const D = hubY2 - hubY1;
            
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            
            if (lenSq !== 0) param = dot / lenSq;
            
            let xx, yy;
            if (param < 0) {
                xx = hubX1;
                yy = hubY1;
            } else if (param > 1) {
                xx = hubX2;
                yy = hubY2;
            } else {
                xx = hubX1 + param * C;
                yy = hubY1 + param * D;
            }
            
            const distance = dist(mouseXRel, mouseYRel, xx, yy);
            
            if (distance < 8) { // Hover threshold for aspect lines
                cursor('pointer');
                hoveredOnAspect = true;
                
                // Calculate orb
                let angleDiff = abs(aspect.p1.absoluteDegree - aspect.p2.absoluteDegree);
                if (angleDiff > 180) angleDiff = 360 - angleDiff;
                const orb = abs(angleDiff - aspect.angle);
                
                // Get interpretation
                let interpretation = "";
                const planetKey = `${aspect.p1.name}_${aspect.p2.name}`;
                const reverseKey = `${aspect.p2.name}_${aspect.p1.name}`;
                
                if (interpretations.aspects[aspect.type] && interpretations.aspects[aspect.type].planets) {
                    interpretation = interpretations.aspects[aspect.type].planets[planetKey] || 
                                   interpretations.aspects[aspect.type].planets[reverseKey] || 
                                   interpretations.aspects[aspect.type].general;
                }
                
                // Create tooltip content
                let info = `${aspect.p1.name} ${aspect.type} ${aspect.p2.name} (${orb.toFixed(1)}° orb)`;
                let tooltipText = info;
                
                if (interpretation) {
                    tooltipText += "\n" + interpretation;
                }
                
                const boxX = mouseX - width / 2 + 15;
                const boxY = mouseY - height / 2;
                const maxWidth = 400; // Maximum width for tooltip
                const lineHeight = 20;
                const padding = 10;
                
                textSize(12); // Ensure correct text size for width calculations
                // Word wrap function - less aggressive, with orphan control
                function wordWrap(text, maxWidth) {
                    textSize(12); // Ensure correct text size for textWidth
                    const words = text.split(' ');
                    const lines = [];
                    let currentLine = '';
                    
                    for (let word of words) {
                        const testLine = currentLine + (currentLine ? ' ' : '') + word;
                        if (textWidth(testLine) <= maxWidth) {
                            currentLine = testLine;
                        } else {
                            if (currentLine) {
                                lines.push(currentLine);
                                currentLine = word;
                            } else {
                                // Only split extremely long words (more than 20 characters)
                                if (word.length > 20) {
                                    const mid = Math.floor(word.length / 2);
                                    lines.push(word.substring(0, mid));
                                    currentLine = word.substring(mid);
                                } else {
                                    currentLine = word;
                                }
                            }
                        }
                    }
                    if (currentLine) {
                        lines.push(currentLine);
                    }

                    // Orphan control: try to avoid single short words on a line
                    const shortWords = ['and','or','but','the','a','an','of','in','on','to','for','by','at','as','with','is','it','be','if','not','are','was','so','do','can','all','any','out','up','off','nor'];
                    for (let i = 1; i < lines.length; i++) {
                        const prev = lines[i-1];
                        const curr = lines[i];
                        const currWords = curr.split(' ');
                        if (currWords.length === 1 && (currWords[0].length <= 3 || shortWords.includes(currWords[0].toLowerCase()))) {
                            // Try to pull orphan up if it fits
                            const testLine = prev + ' ' + currWords[0];
                            if (textWidth(testLine) <= maxWidth) {
                                lines[i-1] = testLine;
                                lines.splice(i,1);
                                i--;
                            }
                        }
                    }
                    return lines;
                }
                
                // Split into lines with word wrapping
                const allLines = [];
                tooltipText.split('\n').forEach(paragraph => {
                    allLines.push(...wordWrap(paragraph, maxWidth - 20));
                });
                
                const boxWidth = maxWidth;
                const boxHeight = allLines.length * lineHeight + padding;
                
                fill(255, 255, 240, 230);
                stroke(0);
                strokeWeight(1);
                rect(boxX, boxY, boxWidth, boxHeight, 5);
                fill(0);
                noStroke();
                textAlign(LEFT, TOP);
                textSize(12);
                
                allLines.forEach((line, index) => {
                    text(line, boxX + 10, boxY + 5 + index * lineHeight);
                });
            }
        });
    }
    
    if (!hoveredOnPlanet && !hoveredOnAspect) {
        cursor(ARROW);
    }
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

const interpretations = {
  "aspects": {
    "Conjunction": {
      "general": "Planets in conjunction blend their energies together, creating a powerful fusion of their qualities. This aspect represents unity, focus, and intensity. The planets work as one, amplifying each other's characteristics.",
      "orb": "0-8°",
      "nature": "Harmonious when planets are compatible, challenging when planets have conflicting energies",
      "planets": {
        "Sun_Moon": "A powerful aspect indicating strong will and emotional drive. The ego and emotions work together harmoniously, creating a person with clear self-expression and emotional authenticity.",
        "Sun_Mercury": "Sharp intellect and clear communication. The mind and ego are aligned, leading to confident self-expression and strong mental focus.",
        "Sun_Venus": "Charm, creativity, and artistic talent. The ego is expressed through beauty, love, and artistic pursuits. Natural charisma and social grace.",
        "Sun_Mars": "Dynamic energy, courage, and leadership. Strong willpower and drive to achieve goals. Can be impulsive or aggressive if not channeled properly.",
        "Sun_Jupiter": "Optimism, generosity, and philosophical thinking. Natural leadership with a broad perspective and desire to inspire others.",
        "Sun_Saturn": "Discipline, responsibility, and ambition. Serious approach to life with strong work ethic. Can indicate self-doubt or authority issues.",
        "Sun_Uranus": "Innovation, independence, and originality. Unique personality with revolutionary ideas. Can be rebellious or unpredictable.",
        "Sun_Neptune": "Intuition, spirituality, and artistic inspiration. Idealistic and compassionate, but may struggle with boundaries.",
        "Sun_Pluto": "Transformative power and intense focus. Deep psychological insight and ability to influence others. Can be obsessive or controlling.",
        "Moon_Mercury": "Emotional intelligence and intuitive communication. Thoughts are influenced by feelings, leading to empathetic understanding.",
        "Moon_Venus": "Emotional harmony and artistic sensitivity. Strong need for beauty and emotional connection in relationships.",
        "Moon_Mars": "Emotional intensity and passionate responses. Quick emotional reactions and strong protective instincts.",
        "Moon_Jupiter": "Emotional optimism and generosity. Natural nurturing qualities and desire to help others grow.",
        "Moon_Saturn": "Emotional discipline and responsibility. May suppress emotions or have difficulty expressing feelings.",
        "Moon_Uranus": "Emotional independence and unpredictability. Unconventional emotional responses and need for freedom.",
        "Moon_Neptune": "Emotional sensitivity and spiritual intuition. Deep empathy but may be prone to emotional confusion.",
        "Moon_Pluto": "Emotional intensity and psychological depth. Powerful emotional transformation and deep understanding of others.",
        "Mercury_Venus": "Artistic communication and social charm. Natural ability to express beauty and harmony through words.",
        "Mercury_Mars": "Quick thinking and assertive communication. Sharp intellect with direct, sometimes aggressive expression.",
        "Mercury_Jupiter": "Philosophical thinking and optimistic communication. Broad perspective and desire to share knowledge.",
        "Mercury_Saturn": "Practical thinking and careful communication. Methodical approach to learning and expressing ideas.",
        "Mercury_Uranus": "Innovative thinking and original ideas. Sudden insights and unconventional communication style.",
        "Mercury_Neptune": "Intuitive thinking and artistic communication. Creative imagination but may struggle with practical details.",
        "Mercury_Pluto": "Penetrating intellect and psychological insight. Deep analysis and ability to uncover hidden truths.",
        "Venus_Mars": "Passionate love and artistic drive. Strong romantic and creative energy, but may indicate relationship conflicts.",
        "Venus_Jupiter": "Generous love and artistic abundance. Natural charm and desire to create beauty and harmony.",
        "Venus_Saturn": "Serious approach to love and beauty. May have difficulty expressing affection or finding satisfaction in relationships.",
        "Venus_Uranus": "Unconventional love and artistic innovation. Attracted to unique beauty and freedom in relationships.",
        "Venus_Neptune": "Romantic idealism and artistic inspiration. Spiritual approach to love and beauty, but may be unrealistic.",
        "Venus_Pluto": "Intense love and artistic transformation. Deep emotional connections and powerful creative expression.",
        "Mars_Jupiter": "Optimistic action and generous energy. Natural leadership with broad vision and enthusiasm.",
        "Mars_Saturn": "Disciplined action and patient energy. Methodical approach to achieving goals with persistence.",
        "Mars_Uranus": "Revolutionary action and innovative energy. Sudden bursts of energy and unconventional approaches.",
        "Mars_Neptune": "Inspired action and spiritual energy. Creative drive but may lack practical direction.",
        "Mars_Pluto": "Intense action and transformative energy. Powerful drive for change and deep psychological motivation.",
        "Jupiter_Saturn": "Balanced optimism and discipline. Practical wisdom and ability to achieve long-term goals.",
        "Jupiter_Uranus": "Revolutionary wisdom and innovative philosophy. Progressive thinking and desire for social change.",
        "Jupiter_Neptune": "Spiritual wisdom and idealistic vision. Compassionate leadership and desire to help humanity.",
        "Jupiter_Pluto": "Transformative wisdom and psychological insight. Deep understanding of human nature and power dynamics.",
        "Saturn_Uranus": "Disciplined innovation and structured change. Practical approach to revolutionary ideas.",
        "Saturn_Neptune": "Disciplined spirituality and practical idealism. Ability to manifest spiritual ideals in the material world.",
        "Saturn_Pluto": "Disciplined transformation and structured power. Patient approach to deep psychological change.",
        "Uranus_Neptune": "Revolutionary spirituality and innovative ideals. Visionary thinking and desire for spiritual progress.",
        "Uranus_Pluto": "Revolutionary transformation and innovative power. Sudden and powerful social or personal change.",
        "Neptune_Pluto": "Spiritual transformation and idealistic power. Deep spiritual evolution and collective consciousness."
      }
    },
    "Opposition": {
      "general": "Planets in opposition create tension and awareness through contrast. This aspect represents relationships, balance, and the need to integrate opposing forces. It often manifests in relationships with others or internal conflicts.",
      "orb": "180° ±8°",
      "nature": "Challenging but can be harmonized through awareness and integration",
      "planets": {
        "Sun_Moon": "Tension between ego and emotions. May struggle with self-expression vs. emotional needs. Important to balance personal identity with emotional security.",
        "Sun_Mercury": "Conflict between ego and intellect. May have difficulty expressing thoughts clearly or feel misunderstood.",
        "Sun_Venus": "Tension between ego and love nature. May struggle with self-worth in relationships or artistic expression.",
        "Sun_Mars": "Conflict between ego and action. May be aggressive or have difficulty asserting oneself appropriately.",
        "Sun_Jupiter": "Tension between ego and beliefs. May overestimate abilities or struggle with philosophical conflicts.",
        "Sun_Saturn": "Conflict between ego and responsibility. May feel limited by authority or struggle with self-discipline.",
        "Sun_Uranus": "Tension between ego and independence. May rebel against authority or struggle with personal freedom.",
        "Sun_Neptune": "Conflict between ego and spirituality. May lose sense of self in idealism or spiritual pursuits.",
        "Sun_Pluto": "Tension between ego and transformation. May resist change or struggle with power dynamics.",
        "Moon_Mercury": "Conflict between emotions and intellect. May have difficulty thinking clearly when emotional.",
        "Moon_Venus": "Tension between emotional and romantic needs. May have difficulty finding emotional satisfaction in relationships.",
        "Moon_Mars": "Conflict between emotions and action. May have volatile emotional responses or difficulty controlling anger.",
        "Moon_Jupiter": "Tension between emotional and philosophical needs. May be overly optimistic or have unrealistic expectations.",
        "Moon_Saturn": "Conflict between emotions and responsibility. May suppress emotions or feel emotionally restricted.",
        "Moon_Uranus": "Tension between emotions and independence. May have unpredictable emotional responses or need emotional freedom.",
        "Moon_Neptune": "Conflict between emotions and spirituality. May be emotionally confused or overly idealistic.",
        "Moon_Pluto": "Tension between emotions and transformation. May have intense emotional experiences or psychological conflicts.",
        "Mercury_Venus": "Conflict between intellect and love. May have difficulty expressing feelings or be overly analytical in relationships.",
        "Mercury_Mars": "Tension between intellect and action. May have difficulty making decisions or be overly aggressive in communication.",
        "Mercury_Jupiter": "Conflict between intellect and beliefs. May be overly optimistic or have difficulty with practical thinking.",
        "Mercury_Saturn": "Tension between intellect and responsibility. May be overly cautious or have difficulty expressing ideas.",
        "Mercury_Uranus": "Conflict between intellect and innovation. May have difficulty with conventional thinking or be overly rebellious.",
        "Mercury_Neptune": "Tension between intellect and intuition. May have difficulty with practical details or be overly idealistic.",
        "Mercury_Pluto": "Conflict between intellect and transformation. May have difficulty with psychological insights or be overly suspicious.",
        "Venus_Mars": "Tension between love and action. May have difficulty balancing relationships with personal goals.",
        "Venus_Jupiter": "Conflict between love and expansion. May be overly generous or have unrealistic expectations in relationships.",
        "Venus_Saturn": "Tension between love and responsibility. May have difficulty expressing affection or feel restricted in relationships.",
        "Venus_Uranus": "Conflict between love and independence. May have unconventional relationships or difficulty with commitment.",
        "Venus_Neptune": "Tension between love and idealism. May have unrealistic expectations or difficulty with boundaries in relationships.",
        "Venus_Pluto": "Conflict between love and transformation. May have intense relationships or difficulty with trust.",
        "Mars_Jupiter": "Tension between action and expansion. May be overly optimistic or have difficulty with practical action.",
        "Mars_Saturn": "Conflict between action and responsibility. May have difficulty taking action or feel restricted by limitations.",
        "Mars_Uranus": "Tension between action and innovation. May have difficulty with conventional approaches or be overly rebellious.",
        "Mars_Neptune": "Conflict between action and idealism. May have difficulty with practical action or be overly idealistic.",
        "Mars_Pluto": "Tension between action and transformation. May have difficulty with power dynamics or be overly aggressive.",
        "Jupiter_Saturn": "Conflict between expansion and limitation. May have difficulty balancing optimism with practicality.",
        "Jupiter_Uranus": "Tension between expansion and innovation. May have difficulty with conventional beliefs or be overly rebellious.",
        "Jupiter_Neptune": "Conflict between expansion and idealism. May have unrealistic expectations or difficulty with practical matters.",
        "Jupiter_Pluto": "Tension between expansion and transformation. May have difficulty with power dynamics or be overly optimistic.",
        "Saturn_Uranus": "Conflict between structure and innovation. May have difficulty with change or be overly rigid.",
        "Saturn_Neptune": "Tension between structure and idealism. May have difficulty with practical matters or be overly idealistic.",
        "Saturn_Pluto": "Conflict between structure and transformation. May have difficulty with change or be overly controlling.",
        "Uranus_Neptune": "Conflict between innovation and idealism. May have difficulty with practical matters or be overly visionary.",
        "Uranus_Pluto": "Conflict between innovation and transformation. May have difficulty with power dynamics or be overly rebellious.",
        "Neptune_Pluto": "Conflict between idealism and transformation. May have difficulty with practical matters or be overly spiritual."
      }
    },
    "Square": {
      "general": "Planets in square create tension and conflict that requires action to resolve. This aspect represents challenges, obstacles, and the need for growth through struggle. It often manifests as internal conflicts or external challenges.",
      "orb": "90° ±8°",
      "nature": "Challenging, requires effort and growth to harmonize",
      "planets": {
        "Sun_Moon": "Internal conflict between ego and emotions. May struggle with self-expression and emotional needs. Important to develop emotional intelligence.",
        "Sun_Mercury": "Conflict between ego and communication. May have difficulty expressing thoughts clearly or feel misunderstood.",
        "Sun_Venus": "Tension between ego and relationships. May struggle with self-worth or have difficulty in romantic relationships.",
        "Sun_Mars": "Conflict between ego and action. May be aggressive or have difficulty asserting oneself appropriately.",
        "Sun_Jupiter": "Tension between ego and expansion. May overestimate abilities or have unrealistic expectations.",
        "Sun_Saturn": "Conflict between ego and limitations. May feel restricted or have difficulty with authority figures.",
        "Sun_Uranus": "Tension between ego and independence. May rebel against authority or struggle with personal freedom.",
        "Sun_Neptune": "Conflict between ego and spirituality. May lose sense of self in idealism or have difficulty with boundaries.",
        "Sun_Pluto": "Tension between ego and transformation. May resist change or struggle with power dynamics.",
        "Moon_Mercury": "Conflict between emotions and intellect. May have difficulty thinking clearly when emotional or suppress emotions.",
        "Moon_Venus": "Tension between emotions and love. May have difficulty finding emotional satisfaction in relationships.",
        "Moon_Mars": "Conflict between emotions and action. May have volatile emotional responses or difficulty controlling anger.",
        "Moon_Jupiter": "Tension between emotions and expansion. May be overly optimistic or have unrealistic emotional expectations.",
        "Moon_Saturn": "Conflict between emotions and responsibility. May suppress emotions or feel emotionally restricted.",
        "Moon_Uranus": "Tension between emotions and independence. May have unpredictable emotional responses or need emotional freedom.",
        "Moon_Neptune": "Conflict between emotions and spirituality. May be emotionally confused or overly idealistic.",
        "Moon_Pluto": "Conflict between emotions and transformation. May have intense emotional experiences or psychological conflicts.",
        "Mercury_Venus": "Conflict between intellect and love. May have difficulty expressing feelings or be overly analytical in relationships.",
        "Mercury_Mars": "Tension between intellect and action. May have difficulty making decisions or be overly aggressive in communication.",
        "Mercury_Jupiter": "Conflict between intellect and expansion. May be overly optimistic or have difficulty with practical thinking.",
        "Mercury_Saturn": "Tension between intellect and limitations. May be overly cautious or have difficulty expressing ideas.",
        "Mercury_Uranus": "Conflict between intellect and innovation. May have difficulty with conventional thinking or be overly rebellious.",
        "Mercury_Neptune": "Tension between intellect and spirituality. May have difficulty with practical details or be overly idealistic.",
        "Mercury_Pluto": "Conflict between intellect and transformation. May have difficulty with psychological insights or be overly suspicious.",
        "Venus_Mars": "Tension between love and action. May have difficulty balancing relationships with personal goals.",
        "Venus_Jupiter": "Conflict between love and expansion. May be overly generous or have unrealistic expectations in relationships.",
        "Venus_Saturn": "Tension between love and limitations. May have difficulty expressing affection or feel restricted in relationships.",
        "Venus_Uranus": "Conflict between love and independence. May have unconventional relationships or difficulty with commitment.",
        "Venus_Neptune": "Tension between love and idealism. May have unrealistic expectations or difficulty with boundaries in relationships.",
        "Venus_Pluto": "Conflict between love and transformation. May have intense relationships or difficulty with trust.",
        "Mars_Jupiter": "Tension between action and expansion. May be overly optimistic or have difficulty with practical action.",
        "Mars_Saturn": "Conflict between action and limitations. May have difficulty taking action or feel restricted by limitations.",
        "Mars_Uranus": "Tension between action and innovation. May have difficulty with conventional approaches or be overly rebellious.",
        "Mars_Neptune": "Conflict between action and idealism. May have difficulty with practical action or be overly idealistic.",
        "Mars_Pluto": "Tension between action and transformation. May have difficulty with power dynamics or be overly aggressive.",
        "Jupiter_Saturn": "Conflict between expansion and limitations. May have difficulty balancing optimism with practicality.",
        "Jupiter_Uranus": "Tension between expansion and innovation. May have difficulty with conventional beliefs or be overly rebellious.",
        "Jupiter_Neptune": "Conflict between expansion and idealism. May have unrealistic expectations or difficulty with practical matters.",
        "Jupiter_Pluto": "Tension between expansion and transformation. May have difficulty with power dynamics or be overly optimistic.",
        "Saturn_Uranus": "Conflict between structure and innovation. May have difficulty with change or be overly rigid.",
        "Saturn_Neptune": "Tension between structure and idealism. May have difficulty with practical matters or be overly idealistic.",
        "Saturn_Pluto": "Conflict between structure and transformation. May have difficulty with change or be overly controlling.",
        "Uranus_Neptune": "Conflict between innovation and idealism. May have difficulty with practical matters or be overly visionary.",
        "Uranus_Pluto": "Conflict between innovation and transformation. May have difficulty with power dynamics or be overly rebellious.",
        "Neptune_Pluto": "Conflict between idealism and transformation. May have difficulty with practical matters or be overly spiritual."
      }
    },
    "Trine": {
      "general": "Planets in trine create harmonious flow and natural talent. This aspect represents ease, talent, and natural abilities. The planets work together effortlessly, creating positive opportunities and natural gifts.",
      "orb": "120° ±8°",
      "nature": "Harmonious, represents natural talents and ease",
      "planets": {
        "Sun_Moon": "Natural harmony between ego and emotions. Strong sense of self with emotional intelligence and authentic expression.",
        "Sun_Mercury": "Natural communication skills and clear thinking. Confident self-expression with sharp intellect.",
        "Sun_Venus": "Natural charm and artistic talent. Easy expression of love and beauty with strong self-worth.",
        "Sun_Mars": "Natural leadership and dynamic energy. Confident action with strong willpower and courage.",
        "Sun_Jupiter": "Natural optimism and generosity. Inspiring leadership with broad vision and philosophical thinking.",
        "Sun_Saturn": "Natural discipline and responsibility. Strong work ethic with practical wisdom and ambition.",
        "Sun_Uranus": "Natural innovation and independence. Original thinking with revolutionary ideas and personal freedom.",
        "Sun_Neptune": "Natural intuition and artistic inspiration. Spiritual awareness with creative imagination and compassion.",
        "Sun_Pluto": "Natural power and psychological insight. Transformative leadership with deep understanding and influence.",
        "Moon_Mercury": "Natural emotional intelligence and intuitive communication. Empathetic understanding with clear emotional expression.",
        "Moon_Venus": "Natural emotional harmony and artistic sensitivity. Beautiful emotional expression with strong nurturing qualities.",
        "Moon_Mars": "Natural emotional courage and protective instincts. Strong emotional responses with passionate action.",
        "Moon_Jupiter": "Natural emotional optimism and generosity. Nurturing wisdom with emotional abundance and growth.",
        "Moon_Saturn": "Natural emotional discipline and responsibility. Stable emotions with practical nurturing and wisdom.",
        "Moon_Uranus": "Natural emotional independence and intuition. Innovative emotional responses with freedom and insight.",
        "Moon_Neptune": "Natural emotional sensitivity and spiritual intuition. Compassionate emotions with artistic and spiritual awareness.",
        "Moon_Pluto": "Natural emotional depth and psychological insight. Powerful emotional transformation with deep understanding.",
        "Mercury_Venus": "Natural artistic communication and social charm. Beautiful expression with harmonious thinking and relationships.",
        "Mercury_Mars": "Natural quick thinking and assertive communication. Sharp intellect with confident and direct expression.",
        "Mercury_Jupiter": "Natural philosophical thinking and optimistic communication. Broad perspective with inspiring and generous expression.",
        "Mercury_Saturn": "Natural practical thinking and careful communication. Methodical approach with reliable and responsible expression.",
        "Mercury_Uranus": "Natural innovative thinking and original communication. Creative ideas with unique and inspiring expression.",
        "Mercury_Neptune": "Natural intuitive thinking and artistic communication. Creative imagination with spiritual and compassionate expression.",
        "Mercury_Pluto": "Natural penetrating intellect and psychological insight. Deep analysis with powerful and transformative expression.",
        "Venus_Mars": "Natural passionate love and artistic drive. Harmonious relationships with creative and dynamic energy.",
        "Venus_Jupiter": "Natural generous love and artistic abundance. Beautiful relationships with optimistic and expansive energy.",
        "Venus_Saturn": "Natural serious approach to love and beauty. Stable relationships with practical and responsible energy.",
        "Venus_Uranus": "Natural unconventional love and artistic innovation. Unique relationships with creative and independent energy.",
        "Venus_Neptune": "Natural romantic idealism and artistic inspiration. Spiritual relationships with compassionate and idealistic energy.",
        "Venus_Pluto": "Natural intense love and artistic transformation. Powerful relationships with deep and transformative energy.",
        "Mars_Jupiter": "Natural optimistic action and generous energy. Dynamic leadership with enthusiastic and expansive energy.",
        "Mars_Saturn": "Natural disciplined action and patient energy. Practical action with persistent and responsible energy.",
        "Mars_Uranus": "Natural revolutionary action and innovative energy. Dynamic innovation with independent and creative energy.",
        "Mars_Neptune": "Natural inspired action and spiritual energy. Creative action with compassionate and idealistic energy.",
        "Mars_Pluto": "Natural intense action and transformative energy. Powerful action with deep and influential energy.",
        "Jupiter_Saturn": "Natural balanced optimism and discipline. Practical wisdom with responsible and expansive energy.",
        "Jupiter_Uranus": "Natural revolutionary wisdom and innovative philosophy. Progressive thinking with independent and inspiring energy.",
        "Jupiter_Neptune": "Natural spiritual wisdom and idealistic vision. Compassionate leadership with spiritual and generous energy.",
        "Jupiter_Pluto": "Natural transformative wisdom and psychological insight. Deep understanding with powerful and influential energy.",
        "Saturn_Uranus": "Natural disciplined innovation and structured change. Practical innovation with responsible and independent energy.",
        "Saturn_Neptune": "Natural disciplined spirituality and practical idealism. Spiritual wisdom with practical and compassionate energy.",
        "Saturn_Pluto": "Natural disciplined transformation and structured power. Practical transformation with responsible and influential energy.",
        "Uranus_Neptune": "Natural revolutionary spirituality and innovative ideals. Visionary thinking with independent and spiritual energy.",
        "Uranus_Pluto": "Natural revolutionary transformation and innovative power. Dynamic transformation with independent and influential energy.",
        "Neptune_Pluto": "Natural spiritual transformation and idealistic power. Deep spiritual evolution with compassionate and influential energy."
      }
    },
    "Sextile": {
      "general": "Planets in sextile create opportunities and harmonious connections. This aspect represents potential, cooperation, and positive relationships. The planets work well together, creating favorable circumstances and natural talents.",
      "orb": "60° ±6°",
      "nature": "Harmonious, represents opportunities and cooperation",
      "planets": {
        "Sun_Moon": "Opportunities for emotional self-expression. Natural ability to balance ego and emotions with authentic communication.",
        "Sun_Mercury": "Opportunities for clear communication and self-expression. Natural talent for expressing thoughts and ideas confidently.",
        "Sun_Venus": "Opportunities for artistic expression and relationships. Natural charm and ability to create beauty and harmony.",
        "Sun_Mars": "Opportunities for confident action and leadership. Natural energy and ability to take initiative and lead others.",
        "Sun_Jupiter": "Opportunities for growth and expansion. Natural optimism and ability to inspire and motivate others.",
        "Sun_Saturn": "Opportunities for achievement and responsibility. Natural discipline and ability to work hard and succeed.",
        "Sun_Uranus": "Opportunities for innovation and independence. Natural originality and ability to think outside the box.",
        "Sun_Neptune": "Opportunities for spiritual growth and creativity. Natural intuition and ability to connect with higher consciousness.",
        "Sun_Pluto": "Opportunities for transformation and power. Natural ability to influence others and create meaningful change.",
        "Moon_Mercury": "Opportunities for emotional communication and understanding. Natural empathy and ability to connect with others emotionally.",
        "Moon_Venus": "Opportunities for emotional harmony and artistic expression. Natural nurturing abilities and appreciation for beauty.",
        "Moon_Mars": "Opportunities for emotional courage and protection. Natural instincts and ability to defend and care for others.",
        "Moon_Jupiter": "Opportunities for emotional growth and wisdom. Natural nurturing wisdom and ability to help others grow.",
        "Moon_Saturn": "Opportunities for emotional stability and responsibility. Natural emotional maturity and ability to provide security.",
        "Moon_Uranus": "Opportunities for emotional independence and intuition. Natural emotional insight and ability to break free from limitations.",
        "Moon_Neptune": "Opportunities for spiritual connection and compassion. Natural emotional sensitivity and ability to heal others.",
        "Moon_Pluto": "Opportunities for emotional transformation and depth. Natural psychological insight and ability to understand others deeply.",
        "Mercury_Venus": "Opportunities for artistic communication and social skills. Natural charm and ability to express beauty through words.",
        "Mercury_Mars": "Opportunities for assertive communication and quick thinking. Natural wit and ability to think and speak quickly.",
        "Mercury_Jupiter": "Opportunities for philosophical communication and teaching. Natural wisdom and ability to share knowledge effectively.",
        "Mercury_Saturn": "Opportunities for practical communication and learning. Natural discipline and ability to master skills through study.",
        "Mercury_Uranus": "Opportunities for innovative communication and original ideas. Natural creativity and ability to think unconventionally.",
        "Mercury_Neptune": "Opportunities for intuitive communication and artistic expression. Natural imagination and ability to express spiritual ideas.",
        "Mercury_Pluto": "Opportunities for deep communication and psychological insight. Natural ability to uncover hidden truths and influence others.",
        "Venus_Mars": "Opportunities for passionate relationships and creative expression. Natural charm and ability to attract and inspire others.",
        "Venus_Jupiter": "Opportunities for generous relationships and artistic success. Natural abundance and ability to create beauty and harmony.",
        "Venus_Saturn": "Opportunities for stable relationships and artistic discipline. Natural patience and ability to build lasting relationships.",
        "Venus_Uranus": "Opportunities for unique relationships and artistic innovation. Natural originality and ability to create unconventional beauty.",
        "Venus_Neptune": "Opportunities for spiritual relationships and artistic inspiration. Natural idealism and ability to create transcendent beauty.",
        "Venus_Pluto": "Opportunities for intense relationships and artistic transformation. Natural power and ability to create deeply meaningful art.",
        "Mars_Jupiter": "Opportunities for enthusiastic action and leadership. Natural energy and ability to inspire others to take action.",
        "Mars_Saturn": "Opportunities for disciplined action and achievement. Natural persistence and ability to work hard and succeed.",
        "Mars_Uranus": "Opportunities for innovative action and independence. Natural drive and ability to break new ground and lead change.",
        "Mars_Neptune": "Opportunities for inspired action and spiritual service. Natural compassion and ability to help others through action.",
        "Mars_Pluto": "Opportunities for powerful action and transformation. Natural intensity and ability to create meaningful change.",
        "Jupiter_Saturn": "Opportunities for balanced growth and achievement. Natural wisdom and ability to combine optimism with practicality.",
        "Jupiter_Uranus": "Opportunities for progressive growth and innovation. Natural vision and ability to create positive social change.",
        "Jupiter_Neptune": "Opportunities for spiritual growth and compassion. Natural idealism and ability to help humanity through wisdom.",
        "Jupiter_Pluto": "Opportunities for transformative growth and influence. Natural power and ability to create meaningful social change.",
        "Saturn_Uranus": "Opportunities for structured innovation and change. Natural ability to create practical solutions to complex problems.",
        "Saturn_Neptune": "Opportunities for practical spirituality and service. Natural ability to manifest spiritual ideals in the material world.",
        "Saturn_Pluto": "Opportunities for structured transformation and power. Natural ability to create lasting change through discipline.",
        "Uranus_Neptune": "Opportunities for visionary innovation and spiritual progress. Natural ability to create revolutionary spiritual change.",
        "Uranus_Pluto": "Opportunities for revolutionary transformation and power. Natural ability to create powerful social and personal change.",
        "Neptune_Pluto": "Opportunities for spiritual transformation and collective evolution. Natural ability to create deep spiritual and social change."
      }
    },
    "Quincunx": {
      "general": "Planets in quincunx create tension that requires adjustment and adaptation. This aspect represents health issues, work challenges, and the need to integrate seemingly incompatible energies. It often manifests as health concerns or work-life balance issues.",
      "orb": "150° ±3°",
      "nature": "Challenging, requires adjustment and adaptation",
      "planets": {
        "Sun_Moon": "Tension between ego and emotional needs affecting health. May struggle with work-life balance or emotional well-being.",
        "Sun_Mercury": "Communication challenges affecting self-expression. May have difficulty expressing thoughts clearly or feel misunderstood.",
        "Sun_Venus": "Relationship challenges affecting self-worth. May struggle with love and beauty or have difficulty in romantic relationships.",
        "Sun_Mars": "Action challenges affecting confidence. May have difficulty asserting oneself or taking appropriate action.",
        "Sun_Jupiter": "Growth challenges affecting optimism. May struggle with expansion or have unrealistic expectations.",
        "Sun_Saturn": "Responsibility challenges affecting ego. May feel restricted or have difficulty with authority figures.",
        "Sun_Uranus": "Independence challenges affecting self-expression. May rebel against authority or struggle with personal freedom.",
        "Sun_Neptune": "Spiritual challenges affecting ego. May lose sense of self in idealism or have difficulty with boundaries.",
        "Sun_Pluto": "Transformation challenges affecting ego. May resist change or struggle with power dynamics.",
        "Moon_Mercury": "Emotional communication challenges. May have difficulty thinking clearly when emotional or suppress emotions.",
        "Moon_Venus": "Emotional relationship challenges. May have difficulty finding emotional satisfaction in relationships.",
        "Moon_Mars": "Emotional action challenges. May have volatile emotional responses or difficulty controlling anger.",
        "Moon_Jupiter": "Emotional growth challenges. May be overly optimistic or have unrealistic emotional expectations.",
        "Moon_Saturn": "Emotional responsibility challenges. May suppress emotions or feel emotionally restricted.",
        "Moon_Uranus": "Emotional independence challenges. May have unpredictable emotional responses or need emotional freedom.",
        "Moon_Neptune": "Emotional spiritual challenges. May be emotionally confused or overly idealistic.",
        "Moon_Pluto": "Emotional transformation challenges. May have intense emotional experiences or psychological conflicts.",
        "Mercury_Venus": "Intellectual relationship challenges. May have difficulty expressing feelings or be overly analytical in relationships.",
        "Mercury_Mars": "Intellectual action challenges. May have difficulty making decisions or be overly aggressive in communication.",
        "Mercury_Jupiter": "Intellectual growth challenges. May be overly optimistic or have difficulty with practical thinking.",
        "Mercury_Saturn": "Intellectual responsibility challenges. May be overly cautious or have difficulty expressing ideas.",
        "Mercury_Uranus": "Intellectual independence challenges. May have difficulty with conventional thinking or be overly rebellious.",
        "Mercury_Neptune": "Intellectual spiritual challenges. May have difficulty with practical details or be overly idealistic.",
        "Mercury_Pluto": "Intellectual transformation challenges. May have difficulty with psychological insights or be overly suspicious.",
        "Venus_Mars": "Relationship action challenges. May have difficulty balancing relationships with personal goals.",
        "Venus_Jupiter": "Relationship growth challenges. May be overly generous or have unrealistic expectations in relationships.",
        "Venus_Saturn": "Relationship responsibility challenges. May have difficulty expressing affection or feel restricted in relationships.",
        "Venus_Uranus": "Relationship independence challenges. May have unconventional relationships or difficulty with commitment.",
        "Venus_Neptune": "Relationship spiritual challenges. May have unrealistic expectations or difficulty with boundaries in relationships.",
        "Venus_Pluto": "Relationship transformation challenges. May have intense relationships or difficulty with trust.",
        "Mars_Jupiter": "Action growth challenges. May be overly optimistic or have difficulty with practical action.",
        "Mars_Saturn": "Action responsibility challenges. May have difficulty taking action or feel restricted by limitations.",
        "Mars_Uranus": "Action independence challenges. May have difficulty with conventional approaches or be overly rebellious.",
        "Mars_Neptune": "Action spiritual challenges. May have difficulty with practical action or be overly idealistic.",
        "Mars_Pluto": "Action transformation challenges. May have difficulty with power dynamics or be overly aggressive.",
        "Jupiter_Saturn": "Growth responsibility challenges. May have difficulty balancing optimism with practicality.",
        "Jupiter_Uranus": "Growth independence challenges. May have difficulty with conventional beliefs or be overly rebellious.",
        "Jupiter_Neptune": "Growth spiritual challenges. May have unrealistic expectations or difficulty with practical matters.",
        "Jupiter_Pluto": "Growth transformation challenges. May have difficulty with power dynamics or be overly optimistic.",
        "Saturn_Uranus": "Responsibility independence challenges. May have difficulty with change or be overly rigid.",
        "Saturn_Neptune": "Responsibility spiritual challenges. May have difficulty with practical matters or be overly idealistic.",
        "Saturn_Pluto": "Responsibility transformation challenges. May have difficulty with change or be overly controlling.",
        "Uranus_Neptune": "Independence spiritual challenges. May have difficulty with practical matters or be overly visionary.",
        "Uranus_Pluto": "Independence transformation challenges. May have difficulty with power dynamics or be overly rebellious.",
        "Neptune_Pluto": "Spiritual transformation challenges. May have difficulty with practical matters or be overly spiritual."
      }
    }
  },
  "elements": {
    "Fire": {
      "description": "Fire signs (Aries, Leo, Sagittarius) represent energy, passion, creativity, and inspiration. They are dynamic, enthusiastic, and natural leaders.",
      "qualities": ["Energetic", "Passionate", "Creative", "Inspiring", "Dynamic", "Enthusiastic", "Courageous", "Optimistic"]
    },
    "Earth": {
      "description": "Earth signs (Taurus, Virgo, Capricorn) represent stability, practicality, material concerns, and reliability. They are grounded, patient, and hardworking.",
      "qualities": ["Stable", "Practical", "Reliable", "Patient", "Hardworking", "Grounded", "Materialistic", "Persistent"]
    },
    "Air": {
      "description": "Air signs (Gemini, Libra, Aquarius) represent intellect, communication, social interaction, and ideas. They are mental, analytical, and sociable.",
      "qualities": ["Intellectual", "Communicative", "Social", "Analytical", "Idealistic", "Detached", "Curious", "Innovative"]
    },
    "Water": {
      "description": "Water signs (Cancer, Scorpio, Pisces) represent emotions, intuition, sensitivity, and spirituality. They are emotional, intuitive, and deeply feeling.",
      "qualities": ["Emotional", "Intuitive", "Sensitive", "Spiritual", "Compassionate", "Mysterious", "Imaginative", "Empathetic"]
    }
  },
  "houses": {
    "1st": "Self, personality, appearance, first impressions, how you present yourself to the world",
    "2nd": "Money, possessions, values, self-worth, material security, what you value",
    "3rd": "Communication, siblings, short trips, learning, local environment, early education",
    "4th": "Home, family, roots, mother, emotional foundation, private life",
    "5th": "Creativity, romance, children, fun, self-expression, hobbies, entertainment",
    "6th": "Work, health, daily routines, service to others, pets, employees",
    "7th": "Partnerships, marriage, close relationships, open enemies, contracts",
    "8th": "Shared resources, transformation, death, rebirth, other people's money, sexuality",
    "9th": "Higher education, philosophy, religion, long-distance travel, publishing, legal matters",
    "10th": "Career, public image, reputation, authority figures, father, life goals",
    "11th": "Friends, groups, social causes, hopes and dreams, humanitarian interests",
    "12th": "Spirituality, subconscious, hidden things, karma, isolation, service to others"
  },
  "planets": {
    "Sun": {
      "description": "Core identity, ego, life purpose, father, authority figures, creative expression",
      "keywords": ["Identity", "Ego", "Purpose", "Father", "Authority", "Creativity", "Leadership", "Vitality"]
    },
    "Moon": {
      "description": "Emotions, intuition, mother, home, family, subconscious, nurturing, emotional needs",
      "keywords": ["Emotions", "Intuition", "Mother", "Home", "Family", "Subconscious", "Nurturing", "Security"]
    },
    "Mercury": {
      "description": "Communication, thinking, learning, siblings, short trips, technology, nervous system",
      "keywords": ["Communication", "Thinking", "Learning", "Siblings", "Travel", "Technology", "Intellect", "Curiosity"]
    },
    "Venus": {
      "description": "Love, beauty, relationships, art, values, harmony, pleasure, social grace",
      "keywords": ["Love", "Beauty", "Relationships", "Art", "Values", "Harmony", "Pleasure", "Grace"]
    },
    "Mars": {
      "description": "Action, energy, aggression, courage, sexuality, competition, drive, physical energy",
      "keywords": ["Action", "Energy", "Aggression", "Courage", "Sexuality", "Competition", "Drive", "Strength"]
    },
    "Jupiter": {
      "description": "Expansion, wisdom, philosophy, religion, higher education, travel, optimism, generosity",
      "keywords": ["Expansion", "Wisdom", "Philosophy", "Religion", "Education", "Travel", "Optimism", "Generosity"]
    },
    "Saturn": {
      "description": "Discipline, responsibility, limitations, structure, authority, time, karma, lessons",
      "keywords": ["Discipline", "Responsibility", "Limitations", "Structure", "Authority", "Time", "Karma", "Lessons"]
    },
    "Uranus": {
      "description": "Innovation, rebellion, independence, sudden change, technology, originality, freedom",
      "keywords": ["Innovation", "Rebellion", "Independence", "Change", "Technology", "Originality", "Freedom", "Revolution"]
    },
    "Neptune": {
      "description": "Spirituality, dreams, illusions, compassion, idealism, confusion, inspiration, mysticism",
      "keywords": ["Spirituality", "Dreams", "Illusions", "Compassion", "Idealism", "Confusion", "Inspiration", "Mysticism"]
    },
    "Pluto": {
      "description": "Transformation, power, death, rebirth, psychology, control, intensity, regeneration",
      "keywords": ["Transformation", "Power", "Death", "Rebirth", "Psychology", "Control", "Intensity", "Regeneration"]
    }
  }
} 