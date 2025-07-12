// The astrological data as a multi-line string
let data = `Sun,Sagittarius,17°09'
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
let interpretations = {}; // Will be loaded from JSON file

// --- Responsive Variables ---
let canvasSize = 800;
let isMobile = false;
let isTablet = false;
let scaleFactor = 1;

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

// --- Layout Constants (will be scaled dynamically) ---
let ZODIAC_OUTER_RADIUS = 350;
let ZODIAC_INNER_RADIUS = 300;
let PLANET_RING_RADIUS = 270;
let LABEL_RADIUS = 230;
let HOUSE_LINE_INNER_RADIUS = 170;
let HOUSE_NUM_RADIUS = 180;
let ASPECT_HUB_RADIUS = 170;
const CLUSTER_THRESHOLD = 12;

function setup() {
  // Load interpretations data first
  loadInterpretations().then(() => {
    // Detect device type and set responsive parameters
    detectDeviceType();
    setResponsiveParameters();
    
    const canvas = createCanvas(canvasSize, canvasSize);
    const chartDiv = document.getElementById('chart-canvas');
    if (chartDiv) chartDiv.appendChild(canvas.elt);
    
    // Add touch support for mobile
    if (isMobile) {
      canvas.touchStarted(touchStarted);
      canvas.touchMoved(touchMoved);
      canvas.touchEnded(touchEnded);
    }
    
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
    
    // Add event listener for chart data update button
    document.getElementById('update-chart-btn').addEventListener('click', updateChartData);
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
  });
}

function updateChartData() {
  const textarea = document.getElementById('chart-data-input');
  const button = document.getElementById('update-chart-btn');
  
  if (!textarea || !button) return;
  
  // Get the new data from textarea
  const newData = textarea.value.trim();
  
  if (!newData) {
    alert('Please enter chart data in the textarea.');
    return;
  }
  
  // Validate the data format
  const lines = newData.split('\n').filter(line => line.trim() !== '');
  let isValid = true;
  let errorMessage = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 3) {
      isValid = false;
      errorMessage = `Line ${i + 1}: Invalid format. Expected: Planet,Sign,Degree°Minute'[,R]`;
      break;
    }
    
    // Check degree format
    const degreePart = parts[2].trim();
    const degreeMatch = degreePart.match(/^(\d+)°(\d+)'$/);
    if (!degreeMatch) {
      isValid = false;
      errorMessage = `Line ${i + 1}: Invalid degree format. Expected: Degree°Minute' (e.g., 17°09')`;
      break;
    }
    
    const degree = parseInt(degreeMatch[1]);
    const minute = parseInt(degreeMatch[2]);
    
    if (degree < 0 || degree > 29 || minute < 0 || minute > 59) {
      isValid = false;
      errorMessage = `Line ${i + 1}: Invalid degree values. Degree must be 0-29, minute must be 0-59`;
      break;
    }
    
    // Check if sign is valid
    const sign = parts[1].trim();
    if (!zodiacSigns.includes(sign)) {
      isValid = false;
      errorMessage = `Line ${i + 1}: Invalid zodiac sign "${sign}". Valid signs: ${zodiacSigns.join(', ')}`;
      break;
    }
  }
  
  if (!isValid) {
    alert('Data validation error:\n' + errorMessage);
    return;
  }
  
  // Disable button during processing
  button.disabled = true;
  button.textContent = 'Updating...';
  
  try {
    // Update the data
    data = newData;
    
    // Clear existing data
    chartData = [];
    houseCusps = [];
    aspects = [];
    
    // Re-parse and regenerate
    parseDataAndGenerateHouses();
    calculateAspects();
    
    // Redraw the chart
    redraw();
    
    // Show success message
    setTimeout(() => {
      alert('Chart updated successfully!');
    }, 100);
    
  } catch (error) {
    alert('Error updating chart: ' + error.message);
  } finally {
    // Re-enable button
    button.disabled = false;
    button.textContent = 'Update Chart';
  }
}

function detectDeviceType() {
  const width = window.innerWidth;
  isMobile = width < 768;
  isTablet = width >= 768 && width < 1024;
}

function setResponsiveParameters() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Set canvas size based on device
  if (isMobile) {
    // For mobile, use the smaller dimension to ensure it fits
    const maxSize = Math.min(width - 40, height - 200); // Account for padding and legend
    canvasSize = Math.max(300, Math.min(600, maxSize)); // Min 300, max 600
    scaleFactor = canvasSize / 800; // Base size is 800
  } else if (isTablet) {
    canvasSize = Math.min(700, width - 100);
    scaleFactor = canvasSize / 800;
  } else {
    canvasSize = 800;
    scaleFactor = 1;
  }
  
  // Scale all radius constants
  ZODIAC_OUTER_RADIUS = 350 * scaleFactor;
  ZODIAC_INNER_RADIUS = 300 * scaleFactor;
  PLANET_RING_RADIUS = 270 * scaleFactor;
  LABEL_RADIUS = 230 * scaleFactor;
  HOUSE_LINE_INNER_RADIUS = 170 * scaleFactor;
  HOUSE_NUM_RADIUS = 180 * scaleFactor;
  ASPECT_HUB_RADIUS = 170 * scaleFactor;
}

async function loadInterpretations() {
  try {
    // Load from embedded data (for GitHub Pages)
    if (window.interpretationsData) {
      interpretations = window.interpretationsData;
      return;
    }
    
    // Fallback to fetch if embedded data not available
    const response = await fetch('./static/interpretations.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    interpretations = await response.json();
  } catch (error) {
    console.error('Error loading interpretations:', error);
    // Fallback to empty object if loading fails
    interpretations = {};
  }
}

function handleResize() {
  detectDeviceType();
  setResponsiveParameters();
  
  // Resize canvas
  resizeCanvas(canvasSize, canvasSize);
  
  // Redraw
  redraw();
}

// Touch event handlers for mobile
function touchStarted() {
  // Convert touch to mouse position for existing logic
  if (touches.length > 0) {
    mouseX = touches[0].x;
    mouseY = touches[0].y;
  }
  return false; // Prevent default behavior
}

function touchMoved() {
  if (touches.length > 0) {
    mouseX = touches[0].x;
    mouseY = touches[0].y;
  }
  return false;
}

function touchEnded() {
  return false;
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
    const [deg, min] = parts[2].replace('' , '').split('°');
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

  // Assign houses to all chart bodies
  const ascSignIndex = zodiacSigns.indexOf(asc.sign);
  chartData.forEach(p => {
    // Ensure sign is present for house calculation (for DSC, IC)
    if (!p.sign) {
      const signIndex = Math.floor(p.absoluteDegree / 30);
      p.sign = zodiacSigns[signIndex];
    }
    const planetSignIndex = zodiacSigns.indexOf(p.sign);
    let house = (planetSignIndex - ascSignIndex + 1);
    if (house <= 0) house += 12;
    p.house = house;
  });
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
    if (i % 30 === 0) { strokeWeight(1.5 * scaleFactor); stroke(0); }
    else if (showDegreeMarkers) {
        strokeWeight(0.5 * scaleFactor); stroke(200);
        if (i % 10 === 0) { strokeWeight(1 * scaleFactor); stroke(100); startRadius = ZODIAC_INNER_RADIUS + 20 * scaleFactor; }
        else if (i % 5 === 0) { startRadius = ZODIAC_INNER_RADIUS + 30 * scaleFactor; }
        else { startRadius = ZODIAC_INNER_RADIUS + 40 * scaleFactor; }
    } else continue;
    line(cos(angle) * ZODIAC_INNER_RADIUS, sin(angle) * ZODIAC_INNER_RADIUS, cos(angle) * startRadius, sin(angle) * startRadius);
  }
  // Draw zodiac glyphs in natural order, rotated by ASC
  for (let i = 0; i < 12; i++) {
    const signMidpointDegree = (i * 30) + 15;
    const angle = 180 - (signMidpointDegree - ascDegree);
    fill(zodiacColors[zodiacSigns[i]]); noStroke(); textSize(24 * scaleFactor); textAlign(CENTER, CENTER);
    text(zodiacSymbols[zodiacSigns[i]], cos(angle) * (ZODIAC_INNER_RADIUS + 25 * scaleFactor), sin(angle) * (ZODIAC_INNER_RADIUS + 25 * scaleFactor));
  }
}

function drawHouseLinesAndNumbers() {
    const asc = chartData.find(p => p.name === 'ASC');
    if (!asc) return;
    const ascDegree = asc.absoluteDegree;
    const mc = chartData.find(p => p.name === 'MC');
    const axes = [asc, mc, chartData.find(p=>p.name==='DSC'), chartData.find(p=>p.name==='IC')];
    const HOUSE_LINE_CENTER_GAP = 170 * scaleFactor; // px, gap at center
    // Draw all 12 house cusps as spokes (with thick outer segment only on rim)
    houseCusps.forEach(cusp => {
        const angle = 180 - (cusp.absoluteDegree - ascDegree);
        const isAxisCusp = axes.some(ax => ax.absoluteDegree % 360 === cusp.absoluteDegree % 360);
        // Thin segment: from small radius to just before outer rim
        stroke(isAxisCusp ? 150 : 220);
        strokeWeight(1 * scaleFactor);
        const thinStartRadius = HOUSE_LINE_CENTER_GAP;
        const thinEndRadius = ZODIAC_INNER_RADIUS;
        const thinStartX = cos(angle) * thinStartRadius;
        const thinStartY = sin(angle) * thinStartRadius;
        const thinEndX = cos(angle) * thinEndRadius;
        const thinEndY = sin(angle) * thinEndRadius;
        line(thinStartX, thinStartY, thinEndX, thinEndY);
        // Thick segment: only on outermost 10%
        stroke(isAxisCusp ? 80 : 120);
        strokeWeight(isAxisCusp ? 4 * scaleFactor : 2.5 * scaleFactor);
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
            stroke(0); strokeWeight(2.5 * scaleFactor);
            const startX = cos(angle) * HOUSE_LINE_INNER_RADIUS;
            const startY = sin(angle) * HOUSE_LINE_INNER_RADIUS;
            const endX = cos(angle) * ZODIAC_INNER_RADIUS;
            const endY = sin(angle) * ZODIAC_INNER_RADIUS;
            line(startX, startY, endX, endY);
            fill(0); noStroke(); textSize(12 * scaleFactor);
            text(planetSymbols[point.name], cos(angle) * (ZODIAC_INNER_RADIUS - 10 * scaleFactor), sin(angle) * (ZODIAC_INNER_RADIUS - 10 * scaleFactor));
        }
    });
    
    // Draw house numbers
    houseCusps.forEach(cusp => {
        const midpointAngle = 180 - ((cusp.absoluteDegree + 15) - ascDegree);
        const x = cos(midpointAngle) * HOUSE_NUM_RADIUS;
        const y = sin(midpointAngle) * HOUSE_NUM_RADIUS;
        fill(200); noStroke(); textSize(14 * scaleFactor);
        text(cusp.house, x, y);
    });
}

function drawAspects() {
    const asc = chartData.find(p => p.name === 'ASC');
    if (!asc) return;
    const ascDegree = asc.absoluteDegree;
    // Draw faint aspect hub circle
    stroke(200, 80); // light gray, semi-transparent
    strokeWeight(1 * scaleFactor);
    noFill();
    ellipse(0, 0, ASPECT_HUB_RADIUS * 2);
    // Draw aspect lines
    aspects.forEach(aspect => {
        const angle1 = 180 - (aspect.p1.visualDegree - ascDegree);
        const angle2 = 180 - (aspect.p2.visualDegree - ascDegree);
        const hubX1 = cos(angle1) * ASPECT_HUB_RADIUS; const hubY1 = sin(angle1) * ASPECT_HUB_RADIUS;
        const hubX2 = cos(angle2) * ASPECT_HUB_RADIUS; const hubY2 = sin(angle2) * ASPECT_HUB_RADIUS;
        stroke(aspect.color); strokeWeight(aspect.weight * scaleFactor);
        if (aspect.style === 'dotted') drawDottedLine(hubX1, hubY1, hubX2, hubY2, 3 * scaleFactor, 3 * scaleFactor);
        else line(hubX1, hubY1, hubX2, hubY2);
        noStroke(); fill(aspect.color);
        rectMode(CENTER); rect(hubX1, hubY1, 6 * scaleFactor, 6 * scaleFactor); rect(hubX2, hubY2, 6 * scaleFactor, 6 * scaleFactor); rectMode(CORNER);
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
    stroke(100); strokeWeight(2 * scaleFactor);
    const notchStartX = cos(angle) * ZODIAC_INNER_RADIUS;
    const notchStartY = sin(angle) * ZODIAC_INNER_RADIUS;
    const notchEndX = cos(angle) * (ZODIAC_INNER_RADIUS + (PLANET_RING_RADIUS - ZODIAC_INNER_RADIUS) / 2);
    const notchEndY = sin(angle) * (ZODIAC_INNER_RADIUS + (PLANET_RING_RADIUS - ZODIAC_INNER_RADIUS) / 2);
    line(notchStartX, notchStartY, notchEndX, notchEndY);

    fill(p.isRetrograde ? '#FF0000' : '#000'); noStroke(); textSize(28 * scaleFactor); text(planetSymbols[p.name], iconX, iconY);
    
    // Draw label block aligned along the radial line (outward-in)
    push();
    translate(labelX, labelY);
    rotate(angle + 90); // Rotate to align with radial direction
    textAlign(CENTER, CENTER);
    fill(0); textSize(12 * scaleFactor); text(p.degree, 0, -10 * scaleFactor);
    fill(zodiacColors[p.sign]); textSize(12 * scaleFactor); text(zodiacSymbols[p.sign], 0, 4 * scaleFactor);
    fill(100); textSize(11 * scaleFactor); text(nf(p.minute, 2), 0, 18 * scaleFactor);
    if (p.isRetrograde) { fill('#FF0000'); textSize(10 * scaleFactor); text('Rx', 20 * scaleFactor, 18 * scaleFactor); }
    pop();
  });
}

// --- UI, Interactivity, and Helpers ---

function getOrdinalSuffix(i) {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) { return i + "st"; }
    if (j === 2 && k !== 12) { return i + "nd"; }
    if (j === 3 && k !== 13) { return i + "rd"; }
    return i + "th";
}

function handleInteractivity() {
    const asc = chartData.find(p => p.name === 'ASC');
    if (!asc) return;
    const ascDegree = asc.absoluteDegree;
    let activePlanets = chartData.filter(p => planetSymbols[p.name]);
    if (!showExtendedPlanets) activePlanets = activePlanets.filter(p => !extendedPlanetNames.includes(p.name));
    let hoveredOnPlanet = false;
    let hoveredOnAspect = false;
    
    // Adjust hover threshold based on device
    const hoverThreshold = isMobile ? 20 * scaleFactor : 15 * scaleFactor;
    
    // Check for planet hover
    activePlanets.forEach(p => {
        let radius = PLANET_RING_RADIUS;
        if (['ASC', 'MC', 'DSC', 'IC'].includes(p.name)) { radius = ZODIAC_INNER_RADIUS - 10 * scaleFactor; }
        const angle = 180 - (p.visualDegree - ascDegree);
        const x = cos(angle) * radius; const y = sin(angle) * radius;
        if (dist(mouseX - width / 2, mouseY - height / 2, x, y) < hoverThreshold) {
            cursor('pointer'); hoveredOnPlanet = true;
            let info = `${p.name} at ${p.degree}° ${nf(p.minute, 2)}' ${p.sign}`;
            let interpretation = '';
            if (interpretations.planets[p.name]) {
                interpretation = interpretations.planets[p.name].description;
            }
            if (p.house && p.house !== -1) {
                const houseKey = getOrdinalSuffix(p.house);
                if (interpretations.houses[houseKey]) {
                    interpretation += `\nIn the ${houseKey} House: ${interpretations.houses[houseKey]}`;
                }
            }
            if (interpretations.planetInSign && interpretations.planetInSign[p.name] && interpretations.planetInSign[p.name][p.sign]) {
                interpretation += `\nIn ${p.sign}: ${interpretations.planetInSign[p.name][p.sign]}`;
            }
            let tooltipText = info;
            if (interpretation) {
                tooltipText += '\n' + interpretation;
            }
            const boxX = mouseX - width / 2 + 15; const boxY = mouseY - height / 2;
            const maxWidth = isMobile ? 300 : 400;
            const lineHeight = 20 * scaleFactor;
            const padding = 10 * scaleFactor;
            textSize(12 * scaleFactor);
            // Use the same wordWrap as for aspects
            function wordWrap(text, maxWidth) {
                textSize(12 * scaleFactor);
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
                // Orphan control
                const shortWords = ['and','or','but','the','a','an','of','in','on','to','for','by','at','as','with','is','it','be','if','not','are','was','so','do','can','all','any','out','up','off','nor'];
                for (let i = 1; i < lines.length; i++) {
                    const prev = lines[i-1];
                    const curr = lines[i];
                    const currWords = curr.split(' ');
                    if (currWords.length === 1 && (currWords[0].length <= 3 || shortWords.includes(currWords[0].toLowerCase()))) {
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
            const allLines = [];
            tooltipText.split('\n').forEach(paragraph => {
                allLines.push(...wordWrap(paragraph, maxWidth - 20 * scaleFactor));
            });
            const boxWidth = maxWidth;
            const boxHeight = allLines.length * lineHeight + padding;
            fill(255, 255, 240, 230); stroke(0); strokeWeight(1 * scaleFactor);
            rect(boxX, boxY, boxWidth, boxHeight, 5 * scaleFactor);
            fill(0); noStroke(); textAlign(LEFT, TOP); textSize(12 * scaleFactor);
            allLines.forEach((line, index) => {
                text(line, boxX + 10 * scaleFactor, boxY + 5 * scaleFactor + index * lineHeight);
            });
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
            
            if (distance < 8 * scaleFactor) { // Hover threshold for aspect lines
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
                const maxWidth = isMobile ? 300 : 400; // Maximum width for tooltip
                const lineHeight = 20 * scaleFactor;
                const padding = 10 * scaleFactor;
                
                textSize(12 * scaleFactor); // Ensure correct text size for width calculations
                // Word wrap function - less aggressive, with orphan control
                function wordWrap(text, maxWidth) {
                    textSize(12 * scaleFactor); // Ensure correct text size for textWidth
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
                    allLines.push(...wordWrap(paragraph, maxWidth - 20 * scaleFactor));
                });
                
                const boxWidth = maxWidth;
                const boxHeight = allLines.length * lineHeight + padding;
                
                fill(255, 255, 240, 230);
                stroke(0);
                strokeWeight(1 * scaleFactor);
                rect(boxX, boxY, boxWidth, boxHeight, 5 * scaleFactor);
                fill(0);
                noStroke();
                textAlign(LEFT, TOP);
                textSize(12 * scaleFactor);
                
                allLines.forEach((line, index) => {
                    text(line, boxX + 10 * scaleFactor, boxY + 5 * scaleFactor + index * lineHeight);
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

 