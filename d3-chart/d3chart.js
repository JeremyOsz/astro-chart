// D3.js Astrological Chart with Interpretations
// Based on the p5.js implementation but adapted for D3

// Global variables
let chartData = [];
let houseCusps = [];
let aspects = [];
let interpretations = {};
let showDegreeMarkers = true;
let showExtendedPlanets = true;
let showAspectLines = true;

// Chart dimensions
let chartSize = 800;
let isMobile = false;
let isTablet = false;

// Layout constants
let ZODIAC_OUTER_RADIUS = 350;
let ZODIAC_INNER_RADIUS = 300;
let PLANET_RING_RADIUS = 270;
let LABEL_RADIUS = 230;
let HOUSE_LINE_INNER_RADIUS = 170;
let HOUSE_NUM_RADIUS = 180;
let ASPECT_HUB_RADIUS = 170;
const CLUSTER_THRESHOLD = 12;

// Data structures
const zodiacSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const zodiacSymbols = {
  "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋", "Leo": "♌", "Virgo": "♍",
  "Libra": "♎", "Scorpio": "♏", "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
};
const zodiacColors = {
  "Aries": "#e53935", "Leo": "#e53935", "Sagittarius": "#e53935",
  "Taurus": "#43a047", "Virgo": "#43a047", "Capricorn": "#43a047",
  "Gemini": "#fbc02d", "Libra": "#fbc02d", "Aquarius": "#fbc02d",
  "Cancer": "#039be5", "Scorpio": "#039be5", "Pisces": "#039be5"
};
const planetSymbols = {
  "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂", "Jupiter": "♃",
  "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇", "Node": "☊",
  "Lilith": "⚸", "Chiron": "⚷", "Fortune": "⊗", "Vertex": "Vx", 
  "ASC": "Asc", "MC": "MC", "DSC": "Dsc", "IC": "IC"
};
const extendedPlanetNames = ["Chiron", "Lilith", "Node", "Fortune", "Vertex"];
const aspectDefs = {
  'Conjunction': { angle: 0, orb: 8, color: '#228B22', weight: 2.5, style: 'solid' },
  'Opposition': { angle: 180, orb: 8, color: '#FF0000', weight: 2.5, style: 'solid' },
  'Square': { angle: 90, orb: 8, color: '#FF0000', weight: 2.5, style: 'solid' },
  'Trine': { angle: 120, orb: 8, color: '#0000FF', weight: 2, style: 'solid' },
  'Sextile': { angle: 60, orb: 6, color: '#0000FF', weight: 2, style: 'dotted' },
  'Quincunx': { angle: 150, orb: 3, color: '#B8860B', weight: 1.5, style: 'dashed' }
};
const coreAspectBodies = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "ASC"];

// Initialize the chart
async function initChart() {
  // Load interpretations first
  await loadInterpretations();
  
  // Detect device type and set responsive parameters
  detectDeviceType();
  setResponsiveParameters();
  
  // Parse initial data
  parseDataAndGenerateHouses();
  calculateAspects();
  
  // Create the chart
  createChart();
  
  // Set up event listeners
  setupEventListeners();
}

// Load interpretations data
async function loadInterpretations() {
  // Use the global interpretations data loaded from the script tag
  if (window.interpretationsData) {
    interpretations = window.interpretationsData;
  } else {
    console.warn('Interpretations data not found');
    interpretations = {};
  }
}

// Device detection
function detectDeviceType() {
  const width = window.innerWidth;
  isMobile = width < 768;
  isTablet = width >= 768 && width < 1024;
}

// Set responsive parameters
function setResponsiveParameters() {
  if (isMobile) {
    chartSize = 350;
    ZODIAC_OUTER_RADIUS = 150;
    ZODIAC_INNER_RADIUS = 130;
    PLANET_RING_RADIUS = 115;
    LABEL_RADIUS = 100;
    HOUSE_LINE_INNER_RADIUS = 75;
    HOUSE_NUM_RADIUS = 80;
    ASPECT_HUB_RADIUS = 75;
  } else if (isTablet) {
    chartSize = 600;
    ZODIAC_OUTER_RADIUS = 250;
    ZODIAC_INNER_RADIUS = 220;
    PLANET_RING_RADIUS = 200;
    LABEL_RADIUS = 170;
    HOUSE_LINE_INNER_RADIUS = 120;
    HOUSE_NUM_RADIUS = 130;
    ASPECT_HUB_RADIUS = 120;
  } else {
    chartSize = 800;
    ZODIAC_OUTER_RADIUS = 350;
    ZODIAC_INNER_RADIUS = 300;
    PLANET_RING_RADIUS = 270;
    LABEL_RADIUS = 230;
    HOUSE_LINE_INNER_RADIUS = 170;
    HOUSE_NUM_RADIUS = 180;
    ASPECT_HUB_RADIUS = 170;
  }
}

// Parse chart data and generate houses
function parseDataAndGenerateHouses() {
  const textarea = document.getElementById('chart-data-input');
  const data = textarea ? textarea.value.trim() : '';

  chartData = data.split('\n').filter(line => line.trim() !== '').map(line => {
    const parts = line.split(',');
    const name = parts[0].trim();
    const sign = parts[1].trim();
    const degreePart = parts[2].trim();
    const isRetrograde = parts.length > 3 && parts[3].trim() === 'R';
    
    const degreeMatch = degreePart.match(/^(\d+)°(\d+)'$/);
    if (!degreeMatch || !zodiacSigns.includes(sign)) {
      return null;
    }
    
    const degree = parseInt(degreeMatch[1]);
    const minute = parseInt(degreeMatch[2]);
    const signIndex = zodiacSigns.indexOf(sign);
    const absoluteDegree = signIndex * 30 + degree + minute / 60;

    return {
      planet: name,
      sign: sign,
      degree: degree,
      minute: minute,
      isRetrograde: isRetrograde,
      angle: absoluteDegree, // This is the absolute degree
      visualDegree: absoluteDegree // Will be adjusted for clusters
    };
  }).filter(p => p !== null);

  const asc = chartData.find(p => p.planet === 'ASC');
  if (!asc) return; // Can't proceed without ASC

  houseCusps = [];
  for (let i = 0; i < 12; i++) {
    houseCusps.push({ house: i + 1, angle: (asc.angle + i * 30) % 360 });
  }

  const mc = chartData.find(p => p.planet === 'MC');
  if (mc) {
    if (!chartData.find(p => p.planet === 'IC')) {
      chartData.push({ planet: 'IC', angle: (mc.angle + 180) % 360, sign: zodiacSigns[Math.floor(((mc.angle + 180) % 360) / 30)], degree:0, minute:0 });
    }
  }
   if (!chartData.find(p => p.planet === 'DSC')) {
      chartData.push({ planet: 'DSC', angle: (asc.angle + 180) % 360, sign: zodiacSigns[Math.floor(((asc.angle + 180) % 360) / 30)], degree:0, minute:0 });
    }

  // Assign houses to all chart bodies
  const ascSignIndex = Math.floor(asc.angle / 30);
  chartData.forEach(p => {
    const planetSignIndex = Math.floor(p.angle / 30);
    let house = (planetSignIndex - ascSignIndex + 1);
    if (house <= 0) house += 12;
    p.house = house;
  });
}

// Calculate aspects between planets
function calculateAspects() {
  aspects = [];
  
  for (let i = 0; i < chartData.length; i++) {
    for (let j = i + 1; j < chartData.length; j++) {
      const planet1 = chartData[i];
      const planet2 = chartData[j];
      
      // Only calculate aspects for core bodies
      if (!coreAspectBodies.includes(planet1.planet) || !coreAspectBodies.includes(planet2.planet)) {
        continue;
      }
      
      let angleDiff = Math.abs(planet1.angle - planet2.angle);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      
      // Check each aspect type
      for (const [aspectName, aspectDef] of Object.entries(aspectDefs)) {
        const aspectAngle = aspectDef.angle;
        const orb = aspectDef.orb;
        
        if (Math.abs(angleDiff - aspectAngle) <= orb) {
          aspects.push({
            planet1: planet1,
            planet2: planet2,
            aspect: aspectName,
            angle: angleDiff,
            orb: Math.abs(angleDiff - aspectAngle),
            color: aspectDef.color,
            weight: aspectDef.weight,
            style: aspectDef.style
          });
          break; // Only take the closest aspect
        }
      }
    }
  }
}

// Create the D3 chart
function createChart() {
  const container = d3.select('#chart-container');
  container.html(''); // Clear existing content
  
  const svg = container.append('svg')
    .attr('width', chartSize)
    .attr('height', chartSize)
    .attr('viewBox', `0 0 ${chartSize} ${chartSize}`);
  
  const g = svg.append('g')
    .attr('transform', `translate(${chartSize/2}, ${chartSize/2})`);
  
  const asc = chartData.find(p => p.planet === 'ASC');
  const ascAngle = asc ? asc.angle : 0;

  // Draw zodiac wheel
  drawZodiacWheel(g, ascAngle);
  
  // Draw house lines and numbers
  drawHouseLinesAndNumbers(g, ascAngle);
  
  // Draw aspects
  if (showAspectLines) {
    drawAspects(g, ascAngle);
  }
  
  // Draw planets
  drawPlanets(g, ascAngle);
  
  // Add interactivity
  addInteractivity(g, ascAngle);
}

// Draw zodiac wheel
function drawZodiacWheel(g, ascAngle) {
  // Outer circle
  g.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', ZODIAC_OUTER_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1);

  // Inner circle
  g.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', ZODIAC_INNER_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1);

  // Zodiac sign backgrounds
  zodiacSigns.forEach((sign, index) => {
    // Center each sign region based on the ASC
    // The region for each sign starts at (signStart) and ends at (signEnd)
    const signStart = (180 - ((index * 30) - ascAngle)) * Math.PI / 180;
    const signEnd = (180 - (((index + 1) * 30) - ascAngle)) * Math.PI / 180;
    const arc = d3.arc()
      .innerRadius(ZODIAC_INNER_RADIUS)
      .outerRadius(ZODIAC_OUTER_RADIUS)
      .startAngle(signStart)
      .endAngle(signEnd);
    g.append('path')
      .attr('d', arc)
      .attr('fill', zodiacColors[sign])
      .attr('opacity', 0.1);
  });

  // Degree tick marks
  for (let i = 0; i < 360; i++) {
    const angle = (180 - (i - ascAngle)) * Math.PI / 180;
    let tickLength = 4;
    let stroke = '#ddd';
    let strokeWidth = 1;

    if (i % 30 === 0) {
      tickLength = 20; stroke = '#aaa'; strokeWidth = 1.5;
    } else if (i % 10 === 0) {
      tickLength = 10; stroke = '#ccc'; strokeWidth = 1;
    } else if (i % 5 === 0) {
      tickLength = 5; stroke = '#ddd'; strokeWidth = 1;
    } else if (!showDegreeMarkers) {
      continue;
    }

    const x1 = Math.cos(angle) * (ZODIAC_INNER_RADIUS);
    const y1 = Math.sin(angle) * (ZODIAC_INNER_RADIUS);
    const x2 = Math.cos(angle) * (ZODIAC_INNER_RADIUS + tickLength);
    const y2 = Math.sin(angle) * (ZODIAC_INNER_RADIUS + tickLength);
    g.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', stroke)
      .attr('stroke-width', strokeWidth);
  }

  // Zodiac sign glyphs
  zodiacSigns.forEach((sign, index) => {
    const signMidpointDegree = (index * 30) + 15;
    const angle = (180 - (signMidpointDegree - ascAngle)) * Math.PI / 180;
    const symbolRadius = ZODIAC_INNER_RADIUS + 25;
    const x = Math.cos(angle) * symbolRadius;
    const y = Math.sin(angle) * symbolRadius;
    g.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
      .attr('font-size', isMobile ? 20 : 24)
      .attr('fill', zodiacColors[sign])
      .text(zodiacSymbols[sign]);
  });
}

// Draw house lines and numbers
function drawHouseLinesAndNumbers(g, ascAngle) {
  const axes = chartData.filter(p => ['ASC', 'MC', 'DSC', 'IC'].includes(p.planet));

  houseCusps.forEach(cusp => {
    const angle = (180 - (cusp.angle - ascAngle)) * Math.PI / 180;
    const isAxis = axes.some(ax => Math.abs(ax.angle - cusp.angle) < 0.1 || Math.abs(ax.angle - cusp.angle - 360) < 0.1 || Math.abs(ax.angle - cusp.angle + 360) < 0.1);
    
    g.append('line')
      .attr('x1', Math.cos(angle) * HOUSE_LINE_INNER_RADIUS)
      .attr('y1', Math.sin(angle) * HOUSE_LINE_INNER_RADIUS)
      .attr('x2', Math.cos(angle) * ZODIAC_INNER_RADIUS)
      .attr('y2', Math.sin(angle) * ZODIAC_INNER_RADIUS)
      .attr('stroke', isAxis ? '#777' : '#ddd')
      .attr('stroke-width', isAxis ? 2 : 1);
  });
  
  axes.forEach(point => {
    const angle = (180 - (point.angle - ascAngle)) * Math.PI / 180;
    g.append('text')
      .attr('x', Math.cos(angle) * (ZODIAC_INNER_RADIUS - 15))
      .attr('y', Math.sin(angle) * (ZODIAC_INNER_RADIUS - 15))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', isMobile ? 12: 14)
      .attr('fill', '#555')
      .text(planetSymbols[point.planet]);
  });

  // House numbers
  houseCusps.forEach(cusp => {
    const midpointAngle = (180 - ((cusp.angle + 15) - ascAngle)) * Math.PI / 180;
    const x = Math.cos(midpointAngle) * HOUSE_NUM_RADIUS;
    const y = Math.sin(midpointAngle) * HOUSE_NUM_RADIUS;
    g.append('text')
      .attr('x', x).attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', isMobile ? 12 : 14)
      .attr('fill', '#ccc')
      .text(cusp.house);
  });
}

// Draw aspects
function drawAspects(g, ascAngle) {
  // Faint aspect hub circle
  g.append('circle')
    .attr('cx', 0).attr('cy', 0)
    .attr('r', ASPECT_HUB_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', '#eee');

  aspects.forEach(aspect => {
    const p1 = chartData.find(p => p.planet === aspect.planet1.planet);
    const p2 = chartData.find(p => p.planet === aspect.planet2.planet);

    if (!p1 || !p2) return;

    const angle1 = (180 - (p1.visualDegree - ascAngle)) * Math.PI / 180;
    const angle2 = (180 - (p2.visualDegree - ascAngle)) * Math.PI / 180;
    
    const x1 = Math.cos(angle1) * ASPECT_HUB_RADIUS;
    const y1 = Math.sin(angle1) * ASPECT_HUB_RADIUS;
    const x2 = Math.cos(angle2) * ASPECT_HUB_RADIUS;
    const y2 = Math.sin(angle2) * ASPECT_HUB_RADIUS;
    
    const line = g.append('line')
      .attr('x1', x1).attr('y1', y1)
      .attr('x2', x2).attr('y2', y2)
      .attr('stroke', aspect.color)
      .attr('stroke-width', aspect.weight)
      .attr('stroke-dasharray', aspect.style === 'dotted' ? '1,3' : aspect.style === 'dashed' ? '4,4' : 'none');
    
    line.datum(aspect);
  });
}

// Draw planets
function drawPlanets(g, ascAngle) {
  let planetsToDraw = chartData.filter(p => planetSymbols[p.planet] && !['ASC', 'MC', 'DSC', 'IC'].includes(p.planet));
  if (!showExtendedPlanets) {
    planetsToDraw = planetsToDraw.filter(p => !extendedPlanetNames.includes(p.planet));
  }

  // Use p5's clustering logic
  let clusters = findClusters(planetsToDraw);
  clusters.forEach(cluster => {
    const clusterSize = cluster.length;
    if (clusterSize > 1) {
      let totalArc = (clusterSize - 1) * 9;
      let avgAngle = cluster.reduce((sum, p) => sum + p.angle, 0) / clusterSize;
      let startAngle = avgAngle - totalArc / 2;
      cluster.forEach((p, i) => {
        const originalPlanet = chartData.find(cp => cp.planet === p.planet);
        if(originalPlanet) {
          originalPlanet.visualDegree = startAngle + i * (totalArc / (clusterSize - 1));
        }
      });
    }
  });

  planetsToDraw.forEach(p => {
    const displayAngle = (180 - (p.visualDegree - ascAngle));
    const angleRad = displayAngle * Math.PI / 180;

    const iconX = Math.cos(angleRad) * PLANET_RING_RADIUS;
    const iconY = Math.sin(angleRad) * PLANET_RING_RADIUS;
    
    // Use a separate radius for the labels to prevent overlap
    const labelX = Math.cos(angleRad) * LABEL_RADIUS;
    const labelY = Math.sin(angleRad) * LABEL_RADIUS;
    
    // Draw notch from inner zodiac to planet icon
    const notchStartX = Math.cos(angleRad) * ZODIAC_INNER_RADIUS;
    const notchStartY = Math.sin(angleRad) * ZODIAC_INNER_RADIUS;
    g.append('line')
      .attr('x1', notchStartX).attr('y1', notchStartY)
      .attr('x2', iconX).attr('y2', iconY)
      .attr('stroke', '#bbb').attr('stroke-width', 1);

    // Draw planet glyph
    const symbol = g.append('text')
      .attr('x', iconX).attr('y', iconY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
      .attr('font-size', isMobile ? 22 : 28)
      .attr('fill', p.isRetrograde ? '#e53935' : '#000')
      .text(planetSymbols[p.planet] || p.planet);
    
    symbol.datum(p);
    
    // Draw radial label block at its own radius
    const labelGroup = g.append('g')
      .attr('transform', `translate(${labelX}, ${labelY}) rotate(${displayAngle + 90})`);

    // Replicating p5's label layout
    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -10) // Degree
      .attr('font-size', isMobile ? 11 : 12)
      .attr('fill', '#444')
      .text(p.degree);
      
    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 4) // Sign Glyph
      .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
      .attr('font-size', isMobile ? 11 : 12)
      .attr('fill', zodiacColors[p.sign])
      .text(zodiacSymbols[p.sign]);

    labelGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 18) // Minute
      .attr('font-size', isMobile ? 10 : 11)
      .attr('fill', '#777')
      .text(p.minute.toString().padStart(2, '0'));

    if (p.isRetrograde) {
      labelGroup.append('text')
        .attr('text-anchor', 'start')
        .attr('x', 12) // Positioned to the right of the minute
        .attr('y', 18)
        .attr('font-size', isMobile ? 9 : 10)
        .attr('fill', '#e53935')
        .text('Rx');
    }
  });
}

// Find planet clusters (from p5 version)
function findClusters(planets) {
  if (planets.length === 0) return [];
  let sorted = [...planets].sort((a, b) => a.angle - b.angle);
  let clusters = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].angle - sorted[i - 1].angle) < CLUSTER_THRESHOLD) {
      clusters[clusters.length - 1].push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  return clusters;
}

// Add interactivity
function addInteractivity(g, ascAngle) {
  // Create tooltip if it doesn't exist
  let tooltip = d3.select('.tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('z-index', '1000');
  }
  
  // Planet tooltips
  g.selectAll('text').filter(d => d && d.planet).on('mouseover', function(event, d) {
    const interpretation = getPlanetInterpretation(d);
    showTooltip(event, interpretation, tooltip);
  }).on('mouseout', function() {
    hideTooltip(tooltip);
  });
  
  // Aspect tooltips
  g.selectAll('line').filter(d => d && d.aspect).on('mouseover', function(event, d) {
    const interpretation = getAspectInterpretation(d);
    showTooltip(event, interpretation, tooltip);
  }).on('mouseout', function() {
    hideTooltip(tooltip);
  });
}

// Get planet interpretation
function getPlanetInterpretation(planet) {
  const sign = planet.sign;
  const degree = planet.degree;
  const minute = planet.minute.toString().padStart(2, '0');
  
  let interpretation = `<strong>${planet.planet} in ${sign}</strong><br>`;
  interpretation += `Degree: ${degree}°${minute}'<br><br>`;
  
  // Add basic planet interpretation if available
  if (interpretations.planets && interpretations.planets[planet.planet]) {
    interpretation += interpretations.planets[planet.planet];
  } else {
    interpretation += `${planet.planet} represents core energies and themes in your chart.`;
  }
  
  if (planet.isRetrograde) {
    interpretation += `<br><br><em>Retrograde: This planet's energy is internalized and may manifest differently than usual.</em>`;
  }
  
  return interpretation;
}

// Get aspect interpretation
function getAspectInterpretation(aspect) {
  const planet1 = aspect.planet1.planet;
  const planet2 = aspect.planet2.planet;
  const aspectType = aspect.aspect;
  const orb = aspect.orb.toFixed(1);
  
  let interpretation = `<strong>${planet1} ${aspectType} ${planet2}</strong><br>`;
  interpretation += `Orb: ${orb}°<br><br>`;
  
  if (interpretations.aspects && interpretations.aspects[aspectType]) {
    const aspectData = interpretations.aspects[aspectType];
    interpretation += `<strong>General:</strong> ${aspectData.general}<br><br>`;
    
    const planetKey = `${planet1}_${planet2}`;
    const reverseKey = `${planet2}_${planet1}`;
    
    if (aspectData.planets && (aspectData.planets[planetKey] || aspectData.planets[reverseKey])) {
      interpretation += `<strong>Specific:</strong> ${aspectData.planets[planetKey] || aspectData.planets[reverseKey]}`;
    }
  } else {
    interpretation += `This ${aspectType.toLowerCase()} aspect creates a connection between ${planet1} and ${planet2}.`;
  }
  
  return interpretation;
}

// Show tooltip
function showTooltip(event, content, tooltip) {
  tooltip.style('opacity', 1)
    .html(content)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px');
}

// Hide tooltip
function hideTooltip(tooltip) {
  tooltip.style('opacity', 0);
}

// Setup event listeners
function setupEventListeners() {
  // Toggle controls
  document.getElementById('toggle-degree').addEventListener('change', function(e) {
    showDegreeMarkers = e.target.checked;
    createChart();
  });
  
  document.getElementById('toggle-extended').addEventListener('change', function(e) {
    showExtendedPlanets = e.target.checked;
    createChart();
  });
  
  document.getElementById('toggle-aspects').addEventListener('change', function(e) {
    showAspectLines = e.target.checked;
    createChart();
  });
  
  // Update chart button
  document.getElementById('update-chart-btn').addEventListener('click', function() {
    parseDataAndGenerateHouses();
    calculateAspects();
    createChart();
  });
  
  // Window resize
  window.addEventListener('resize', function() {
    detectDeviceType();
    setResponsiveParameters();
    createChart();
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChart); 