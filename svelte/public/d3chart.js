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
let showPlanetLabels = true;

// Chart dimensions
let chartSize = 800;
let isMobile = false;
let isTablet = false;

// Zoom variables
let currentZoom = 1;
let minZoom = 0.5;
let maxZoom = 3;

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
  "Aries": "#e53935",      // Fire - Red
  "Taurus": "#43a047",     // Earth - Green
  "Gemini": "#fbc02d",     // Air - Yellow
  "Cancer": "#039be5",     // Water - Blue
  "Leo": "#e53935",        // Fire - Red
  "Virgo": "#43a047",      // Earth - Green
  "Libra": "#fbc02d",      // Air - Yellow
  "Scorpio": "#039be5",    // Water - Blue
  "Sagittarius": "#e53935",// Fire - Red
  "Capricorn": "#43a047",  // Earth - Green
  "Aquarius": "#fbc02d",   // Air - Yellow
  "Pisces": "#039be5"      // Water - Blue
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
    console.log('Interpretations loaded:', window.interpretationsData);
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
    chartSize = 300;
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
    const signIndex = zodiacSigns.indexOf(p.sign);
    let house = signIndex - ascSignIndex + 1;
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

// Adjusts planet degrees visually to avoid overlaps
function calculateVisualDegrees(planetsToDraw) {
  // Use clustering logic to find groups of planets that are close together
  let clusters = findClusters(planetsToDraw);
  clusters.forEach(cluster => {
    const clusterSize = cluster.length;
    if (clusterSize === 1) {
      // If a planet is not in a cluster, its visual position is its true position
      const p = cluster[0];
      const originalPlanet = chartData.find(cp => cp.planet === p.planet);
      if (originalPlanet) {
        originalPlanet.visualDegree = originalPlanet.angle;
      }
    } else if (clusterSize > 1) {
      // If planets are clustered, spread them out visually around their average position
      const totalArc = (clusterSize - 1) * 9; // Visual separation arc
      const avgAngle = cluster.reduce((sum, p) => sum + p.angle, 0) / clusterSize;
      const startAngle = avgAngle - totalArc / 2;
      cluster.forEach((p, i) => {
        const originalPlanet = chartData.find(cp => cp.planet === p.planet);
        if (originalPlanet) {
          originalPlanet.visualDegree = startAngle + i * (totalArc / (clusterSize - 1));
        }
      });
    }
  });
}


// Create the D3 chart
function createChart() {
  const container = d3.select('#chart-container');
  container.html(''); // Clear existing content
  
  const svg = container.append('svg')
    .attr('width', chartSize)
    .attr('height', chartSize)
    .attr('viewBox', `0 0 ${chartSize} ${chartSize}`)
    .style('cursor', 'grab')
    .style('touch-action', 'none'); // Prevent default touch behaviors
  
  const g = svg.append('g')
    .attr('transform', `translate(${chartSize/2}, ${chartSize/2})`);
  
  // Create zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([minZoom, maxZoom])
    .on('zoom', function(event) {
      const { transform } = event;
      currentZoom = transform.k;
      
      // Apply zoom transform to the main group
      g.attr('transform', `translate(${chartSize/2}, ${chartSize/2}) scale(${transform.k}) translate(${transform.x / transform.k}, ${transform.y / transform.k})`);
      
      // Update zoom level display
      const zoomLevelText = document.getElementById('zoom-level-text');
      if (zoomLevelText) {
        zoomLevelText.textContent = Math.round(transform.k * 100) + '%';
      }
      
      // Update cursor style
      svg.style('cursor', event.sourceEvent && event.sourceEvent.type === 'mousedown' ? 'grabbing' : 'grab');
    })
    .on('end', function() {
      // Reset cursor when zoom ends
      svg.style('cursor', 'grab');
    });
  
  // Apply zoom to SVG
  svg.call(zoom);
  
  // Add double-click to reset zoom
  svg.on('dblclick', function() {
    svg.transition().duration(300).call(
      zoom.transform,
      d3.zoomIdentity
    );
  });
  
  const asc = chartData.find(p => p.planet === 'ASC');
  const ascAngle = asc ? asc.angle : 0;

  // Determine which planets to draw based on user settings
  let planetsToDraw = chartData.filter(p => planetSymbols[p.planet] && !['ASC', 'MC', 'DSC', 'IC'].includes(p.planet));
  if (!showExtendedPlanets) {
    planetsToDraw = planetsToDraw.filter(p => !extendedPlanetNames.includes(p.planet));
  }
  
  // Calculate visual degrees for clustering BEFORE drawing anything
  calculateVisualDegrees(planetsToDraw);

  // Draw zodiac wheel
  drawZodiacWheel(g, ascAngle);
  
  // Draw house lines and numbers
  drawHouseLinesAndNumbers(g, ascAngle);
  
  // Draw aspects (now using the final visual degrees)
  if (showAspectLines) {
    drawAspects(g, ascAngle);
  }
  
  // Draw planets (now using the final visual degrees)
  drawPlanets(g, ascAngle, planetsToDraw);
  
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
    .attr('stroke-width', isMobile ? 1 : 2);

  // Inner circle
  g.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', ZODIAC_INNER_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', isMobile ? 1 : 2);

  // Zodiac sign backgrounds
  zodiacSigns.forEach((sign, index) => {
    // Center each sign region based on the ASC
    // The region for each sign starts at (signStart) and ends at (signEnd)
    const signStartDeg = (180 - ((index * 30) - ascAngle));
    const signEndDeg = (180 - (((index + 1) * 30) - ascAngle));
    const signStart = signStartDeg * Math.PI / 180;
    const signEnd = signEndDeg * Math.PI / 180;
    const arc = d3.arc()
      .innerRadius(ZODIAC_INNER_RADIUS)
      .outerRadius(ZODIAC_OUTER_RADIUS)
      .startAngle(signStart)
      .endAngle(signEnd);
    g.append('path')
      .attr('d', arc)
      .attr('fill', 'none')
      .attr('stroke-width', isMobile ? 1 : 2)
      .attr('opacity', 0.6);
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
    // Center glyph at the middle of the sign's region
    const signStart = (180 - ((index * 30) - ascAngle));
    const signEnd = (180 - (((index + 1) * 30) - ascAngle));
    const signMid = (signStart + signEnd) / 2;
    const angle = signMid * Math.PI / 180;
    const symbolRadius = isMobile ? ZODIAC_INNER_RADIUS + 13 : ZODIAC_INNER_RADIUS + 25;
    const x = Math.cos(angle) * symbolRadius;
    const y = Math.sin(angle) * symbolRadius;
    
    // Create a group for the sign symbol and its hit area
    const signGroup = g.append('g')
      .attr('class', 'zodiac-sign-group')
      .datum({ sign: sign, index: index });
    
    // Add invisible hit area (restore to transparent)
    signGroup.append('circle')
      .attr('class', 'zodiac-sign-hit')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 30)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer');
    
    // Add the visible symbol
    signGroup.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
      .attr('font-size', isMobile ? 10 : 24)
      .attr('fill', zodiacColors[sign])
      .style('pointer-events', 'none') // <-- This line is key!
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
      .attr('stroke-width', isAxis ? (isMobile ? 1.2 : 2) : (isMobile ? 0.7 : 1));
  });
  
  axes.forEach(point => {
    const angle = (180 - (point.angle - ascAngle)) * Math.PI / 180;
    g.append('text')
      .attr('x', Math.cos(angle) * (ZODIAC_INNER_RADIUS - 15))
      .attr('y', Math.sin(angle) * (ZODIAC_INNER_RADIUS - 15))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', isMobile ? 9 : 14)
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
      .attr('font-size', isMobile ? 9 : 14)
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

  const aspectGroups = g.selectAll('.aspect-group')
    .data(aspects, d => `${d.planet1.planet}-${d.aspect}-${d.planet2.planet}`);

  const aspectGroupsEnter = aspectGroups.enter()
    .append('g')
    .attr('class', 'aspect-group');

  // Visible line
  aspectGroupsEnter.append('line')
    .style('pointer-events', 'none')
    .attr('x1', d => Math.cos((180 - (d.planet1.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('y1', d => Math.sin((180 - (d.planet1.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('x2', d => Math.cos((180 - (d.planet2.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('y2', d => Math.sin((180 - (d.planet2.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('stroke', d => d.color)
    .attr('stroke-width', d => isMobile ? d.weight * 0.7 : d.weight)
    .attr('stroke-dasharray', d => d.style === 'dotted' ? '1,3' : d.style === 'dashed' ? '4,4' : 'none');

  // Invisible wide line for hover/click
  aspectGroupsEnter.append('line')
    .attr('class', 'aspect-line') // Keep original class for interactivity selector
    .attr('x1', d => Math.cos((180 - (d.planet1.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('y1', d => Math.sin((180 - (d.planet1.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('x2', d => Math.cos((180 - (d.planet2.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('y2', d => Math.sin((180 - (d.planet2.visualDegree - ascAngle)) * Math.PI / 180) * ASPECT_HUB_RADIUS)
    .attr('stroke', 'transparent')
    .attr('stroke-width', 15); // Wider hit area

  aspectGroups.exit().remove();
}

// Draw planets
function drawPlanets(g, ascAngle, planetsToDraw) {
  // DATA JOIN for planet groups
  const planetGroups = g.selectAll('.planet-group')
    .data(planetsToDraw, d => d.planet);

  // EXIT old planets
  planetGroups.exit().remove();

  // ENTER new planet groups
  const planetGroupsEnter = planetGroups.enter()
    .append('g')
    .attr('class', 'planet-group');

  // Add visible glyph to new groups
  planetGroupsEnter.append('text')
    .attr('class', 'planet-glyph-visible')
    .style('pointer-events', 'none')
    .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');

  // Add invisible hit area to new groups
  planetGroupsEnter.append('circle')
    .attr('class', 'planet-glyph')
    .attr('r', 20)
    .attr('fill', 'transparent');
  
  // MERGE enter and update selections
  const allPlanetGroups = planetGroupsEnter.merge(planetGroups);

  // UPDATE all planet glyphs (position, content)
  allPlanetGroups.select('.planet-glyph-visible')
    .attr('x', d => Math.cos((180 - (d.visualDegree - ascAngle)) * Math.PI / 180) * PLANET_RING_RADIUS)
    .attr('y', d => Math.sin((180 - (d.visualDegree - ascAngle)) * Math.PI / 180) * PLANET_RING_RADIUS)
    .attr('font-size', isMobile ? 16 : 28)
    .attr('fill', d => d.isRetrograde ? '#e53935' : '#000')
    .text(d => planetSymbols[d.planet] || d.planet);
  
  // UPDATE all hit areas (position)
  allPlanetGroups.select('.planet-glyph')
    .attr('cx', d => Math.cos((180 - (d.visualDegree - ascAngle)) * Math.PI / 180) * PLANET_RING_RADIUS)
    .attr('cy', d => Math.sin((180 - (d.visualDegree - ascAngle)) * Math.PI / 180) * PLANET_RING_RADIUS);

  // UPDATE labels and notches for all groups
  allPlanetGroups.each(function(p) {
    const group = d3.select(this);
    
    // Remove existing labels/notches before redrawing
    group.selectAll('.planet-notch, .planet-label-group').remove();
    
    // Only draw if toggled on
    if (showPlanetLabels) {
      const displayAngle = (180 - (p.visualDegree - ascAngle));
      const angleRad = displayAngle * Math.PI / 180;
      
      const labelX = Math.cos(angleRad) * LABEL_RADIUS;
      const labelY = Math.sin(angleRad) * LABEL_RADIUS;

      // Draw notch from outer zodiac to just before planet icon
      group.append('line')
        .attr('class', 'planet-notch')
        .style('pointer-events', 'none')
        .attr('x1', Math.cos(angleRad) * (ZODIAC_INNER_RADIUS))
        .attr('y1', Math.sin(angleRad) * (ZODIAC_INNER_RADIUS))
        .attr('x2', Math.cos(angleRad) * (PLANET_RING_RADIUS + 20))
        .attr('y2', Math.sin(angleRad) * (PLANET_RING_RADIUS + 20))
        .attr('stroke', '#000').attr('stroke-width', isMobile ? 1 : 2);

      // Draw radial label block at its own radius
      const labelGroup = group.append('g')
        .attr('class', 'planet-label-group')
        .style('pointer-events', 'none')
        .attr('transform', `translate(${labelX}, ${labelY}) rotate(${displayAngle + 90})`);

      if (isMobile) {
        // Only show sign symbol and Rx
        labelGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
          .attr('font-size', 9)
          .attr('fill', zodiacColors[p.sign])
          .text(zodiacSymbols[p.sign]);
        if (p.isRetrograde) {
          labelGroup.append('text')
            .attr('text-anchor', 'start')
            .attr('x', 12)
            .attr('y', 18)
            .attr('font-size', 8)
            .attr('fill', '#e53935')
            .text('Rx');
        }
      } else {
        // Desktop/tablet: show degree, sign, minute, Rx
        labelGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .attr('font-size', 12)
          .attr('fill', '#444')
          .text(p.degree);
        labelGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
          .attr('font-size', 12)
          .attr('fill', zodiacColors[p.sign])
          .text(zodiacSymbols[p.sign]);
        labelGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 18)
          .attr('font-size', 11)
          .attr('fill', '#777')
          .text(p.minute.toString().padStart(2, '0'));
        if (p.isRetrograde) {
          labelGroup.append('text')
            .attr('text-anchor', 'start')
            .attr('x', 12)
            .attr('y', 18)
            .attr('font-size', 10)
            .attr('fill', '#e53935')
            .text('Rx');
        }
      }
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
  // Ensure tooltip style is present
  if (!document.getElementById('astro-tooltip-style')) {
    const style = document.createElement('style');
    style.id = 'astro-tooltip-style';
    style.innerHTML = `
      .tooltip {
        background: #fffbe8;
        color: #222;
        border: 1px solid #aaa;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        padding: 12px 16px;
        font-size: 15px;
        font-family: 'Segoe UI', Arial, sans-serif;
        pointer-events: none;
        max-width: 340px;
        line-height: 1.5;
        transition: opacity 0.15s;
      }
    `;
    document.head.appendChild(style);
  }

  // Create tooltip if it doesn't exist
  let tooltip = d3.select('.tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('z-index', '1000');
  }

  // Helper for positioning tooltip within viewport
  function positionTooltip(event, tooltip) {
    const padding = 12;
    const tooltipNode = tooltip.node();
    if (!tooltipNode) return;
    const { innerWidth, innerHeight } = window;
    const rect = tooltipNode.getBoundingClientRect();

    // Handle both mouse and touch events for correct coordinates
    const pos = event.touches ? event.touches[0] : event;
    if (!pos || typeof pos.pageX !== 'number') { return; } // Exit if no position data

    let left = pos.pageX + 16;
    let top = pos.pageY - 10;
    if (left + rect.width + padding > innerWidth) {
      left = innerWidth - rect.width - padding;
    }
    if (top + rect.height + padding > innerHeight) {
      top = innerHeight - rect.height - padding;
    }
    if (top < padding) top = padding;
    tooltip.style('left', left + 'px').style('top', top + 'px');
  }

  // --- Combined hover and click/pin logic ---
  let tooltipPinned = false;
  let pinnedData = null; // Store the data of the pinned element

  function handleMouseOver(event, d) {
    if (tooltipPinned) return; // Don't show hover tooltip if one is pinned
    const interpretation = d.planet ? getPlanetInterpretation(d) : getAspectInterpretation(d);
    showTooltip(event, interpretation, tooltip, positionTooltip);
  }

  function handleMouseOut() {
    if (tooltipPinned) return; // Don't hide if pinned
    hideTooltip(tooltip);
  }

  function handleClick(event, d) {
    event.stopPropagation();
    const isSameElement = (pinnedData === d);

    if (tooltipPinned && isSameElement) {
      // Unpin if clicking the same element again
      tooltipPinned = false;
      pinnedData = null;
      hideTooltip(tooltip);
    } else {
      // Pin the tooltip for this element
      tooltipPinned = true;
      pinnedData = d;
      const interpretation = d.planet ? getPlanetInterpretation(d) : getAspectInterpretation(d);
      showTooltip(event, interpretation, tooltip, positionTooltip);
    }
  }

  // Planet tooltips
  g.selectAll('.planet-glyph')
    .style('cursor', 'pointer')
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('click', handleClick);

  // Aspect tooltips
  g.selectAll('.aspect-line')
    .style('cursor', 'pointer')
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('click', handleClick);

  // Zodiac sign tooltips
  g.selectAll('.zodiac-sign-hit')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      if (tooltipPinned) return;
      // Get the symbol's coordinates for centering (SVG to page coordinates)
      const symbol = d3.select(this.parentNode).select('text');
      const svg = d3.select(this.ownerSVGElement);
      const svgRect = svg.node().getBoundingClientRect();
      const pt = svg.node().createSVGPoint();
      pt.x = +symbol.attr('x');
      pt.y = +symbol.attr('y');
      const ctm = symbol.node().getCTM();
      const transformed = pt.matrixTransform(ctm);
      const coords = {
        x: svgRect.left + transformed.x,
        y: svgRect.top + transformed.y
      };
      const interpretation = getZodiacSignInterpretation(d.sign, coords);
      showTooltip(event, interpretation, tooltip, (evt, tip) => {
        // Place tooltip just above the symbol
        const tipNode = tip.node();
        if (!tipNode) return;
        const tipRect = tipNode.getBoundingClientRect();
        let left = coords.x - tipRect.width / 2;
        let top = coords.y - tipRect.height - 8;
        if (left < 0) left = 8;
        if (top < 0) top = 8;
        tip.style('left', left + 'px').style('top', top + 'px');
      });
    })
    .on('mouseout', function() {
      if (tooltipPinned) return;
      hideTooltip(tooltip);
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      const isSameElement = (pinnedData === d);
      const symbol = d3.select(this.parentNode).select('text');
      const svg = d3.select(this.ownerSVGElement);
      const svgRect = svg.node().getBoundingClientRect();
      const pt = svg.node().createSVGPoint();
      pt.x = +symbol.attr('x');
      pt.y = +symbol.attr('y');
      const ctm = symbol.node().getCTM();
      const transformed = pt.matrixTransform(ctm);
      const coords = {
        x: svgRect.left + transformed.x,
        y: svgRect.top + transformed.y
      };
      if (tooltipPinned && isSameElement) {
        tooltipPinned = false;
        pinnedData = null;
        hideTooltip(tooltip);
      } else {
        tooltipPinned = true;
        pinnedData = d;
        const interpretation = getZodiacSignInterpretation(d.sign, coords);
        showTooltip(event, interpretation, tooltip, (evt, tip) => {
          const tipNode = tip.node();
          if (!tipNode) return;
          const tipRect = tipNode.getBoundingClientRect();
          let left = coords.x - tipRect.width / 2;
          let top = coords.y - tipRect.height - 8;
          if (left < 0) left = 8;
          if (top < 0) top = 8;
          tip.style('left', left + 'px').style('top', top + 'px');
        });
      }
    });

  // Hide pinned tooltip when clicking the chart background
  d3.select('#chart-container svg').on('click', function() {
    if (tooltipPinned) {
      tooltipPinned = false;
      pinnedData = null;
      hideTooltip(tooltip);
    }
  });
}

// Get planet interpretation
function getPlanetInterpretation(planet) {
  const sign = planet.sign;
  const degree = planet.degree;
  const minute = planet.minute.toString().padStart(2, '0');
  let interpretation = `<strong>${planet.planet} in ${sign}</strong><br>`;
  interpretation += `Degree: ${degree}°${minute}'<br><br>`;

  // Use planetInSign interpretation if available
  if (
    interpretations.planetInSign &&
    interpretations.planetInSign[planet.planet] &&
    interpretations.planetInSign[planet.planet][sign]
  ) {
    interpretation += interpretations.planetInSign[planet.planet][sign];
  } else if (interpretations.planets && interpretations.planets[planet.planet]) {
    interpretation += interpretations.planets[planet.planet].description;
  } else {
    interpretation += `${planet.planet} in ${sign}.`;
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

// Get zodiac sign interpretation
function getZodiacSignInterpretation(sign, symbolCoords) {
  const element = getZodiacElement(sign);
  const quality = getZodiacQuality(sign);
  const ruler = getZodiacRuler(sign);

  // Correct house calculation: House 1 is the sign containing the ASC
  const asc = chartData.find(p => p.planet === 'ASC');
  let house = 1;
  if (asc) {
    const ascSignIndex = Math.floor(asc.angle / 30);
    const signIndex = zodiacSigns.indexOf(sign);
    house = signIndex - ascSignIndex + 1;
    if (house <= 0) house += 12;
  }

  let interpretation = `<strong>${sign} ${zodiacSymbols[sign]}</strong><br>`;
  interpretation += `<strong>Element:</strong> ${element}<br>`;
  interpretation += `<strong>Quality:</strong> ${quality}<br>`;
  interpretation += `<strong>Ruler:</strong> ${ruler}<br>`;
  interpretation += `<strong>House:</strong> ${house}<br><br>`;

  interpretation += getZodiacSignDescription(sign);

  // Add sign-in-house interpretation
  if (
    interpretations.signInHouse &&
    interpretations.signInHouse[sign] &&
    interpretations.signInHouse[sign][String(house)]
  ) {
    interpretation += `<br><strong>${sign} in House ${house}:</strong> ${interpretations.signInHouse[sign][String(house)]}`;
  }

  return interpretation;
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}

// Helper functions for zodiac sign information
function getZodiacElement(sign) {
  const elements = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water"
  };
  return elements[sign] || "Unknown";
}

function getZodiacQuality(sign) {
  const qualities = {
    "Aries": "Cardinal", "Cancer": "Cardinal", "Libra": "Cardinal", "Capricorn": "Cardinal",
    "Taurus": "Fixed", "Leo": "Fixed", "Scorpio": "Fixed", "Aquarius": "Fixed",
    "Gemini": "Mutable", "Virgo": "Mutable", "Sagittarius": "Mutable", "Pisces": "Mutable"
  };
  return qualities[sign] || "Unknown";
}

function getZodiacRuler(sign) {
  const rulers = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Pluto",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Uranus", "Pisces": "Neptune"
  };
  return rulers[sign] || "Unknown";
}

function getZodiacSignDescription(sign) {
  const descriptions = {
    "Aries": "The first sign of the zodiac, Aries represents new beginnings, courage, and pioneering spirit. Aries energy is bold, direct, and action-oriented. You are a natural leader who initiates projects and inspires others with your enthusiasm and determination.",
    "Taurus": "The second sign of the zodiac, Taurus represents stability, patience, and material security. Taurus energy is grounded, sensual, and persistent. You are reliable and practical, with a deep appreciation for beauty and the physical world.",
    "Gemini": "The third sign of the zodiac, Gemini represents communication, curiosity, and adaptability. Gemini energy is versatile, intellectual, and social. You are a natural communicator who loves to learn and share information with others.",
    "Cancer": "The fourth sign of the zodiac, Cancer represents home, family, and emotional security. Cancer energy is nurturing, protective, and intuitive. You are deeply connected to your emotions and have strong protective instincts for those you care about.",
    "Leo": "The fifth sign of the zodiac, Leo represents creativity, self-expression, and leadership. Leo energy is confident, generous, and dramatic. You are a natural performer who loves to shine and inspire others with your warmth and creativity.",
    "Virgo": "The sixth sign of the zodiac, Virgo represents service, perfection, and practical skills. Virgo energy is analytical, helpful, and detail-oriented. You are dedicated to helping others and have a keen eye for improving systems and processes.",
    "Libra": "The seventh sign of the zodiac, Libra represents relationships, harmony, and justice. Libra energy is diplomatic, fair, and sociable. You are a natural peacemaker who seeks balance and beauty in all areas of life.",
    "Scorpio": "The eighth sign of the zodiac, Scorpio represents transformation, intensity, and psychological depth. Scorpio energy is passionate, perceptive, and powerful. You are drawn to the mysteries of life and have the ability to transform yourself and others.",
    "Sagittarius": "The ninth sign of the zodiac, Sagittarius represents expansion, philosophy, and adventure. Sagittarius energy is optimistic, freedom-loving, and truth-seeking. You are a natural explorer who seeks to understand the bigger picture and inspire others with your wisdom.",
    "Capricorn": "The tenth sign of the zodiac, Capricorn represents ambition, discipline, and achievement. Capricorn energy is responsible, practical, and determined. You are a natural strategist who builds lasting structures and achieves long-term goals.",
    "Aquarius": "The eleventh sign of the zodiac, Aquarius represents innovation, independence, and humanitarian ideals. Aquarius energy is original, progressive, and group-oriented. You are a visionary who seeks to contribute to social progress and collective consciousness.",
    "Pisces": "The twelfth sign of the zodiac, Pisces represents compassion, spirituality, and universal love. Pisces energy is intuitive, artistic, and empathetic. You are deeply connected to the spiritual realm and have the ability to transcend boundaries through compassion and imagination."
  };
  return descriptions[sign] || `${sign} is a zodiac sign with unique characteristics and qualities.`;
}

// Show tooltip
function showTooltip(event, content, tooltip, positionFn) {
  tooltip.style('opacity', 1)
    .html(content);
  if (positionFn) positionFn(event, tooltip);
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
  
  document.getElementById('toggle-labels').addEventListener('change', function(e) {
    showPlanetLabels = e.target.checked;
    createChart();
  });
  
  // Zoom controls
  document.getElementById('zoom-in').addEventListener('click', function() {
    const svg = d3.select('#chart-container svg');
    const zoom = d3.zoomTransform(svg.node());
    const newScale = Math.min(maxZoom, zoom.k * 1.2);
    svg.transition().duration(300).call(
      d3.zoom().transform,
      d3.zoomIdentity.scale(newScale).translate(zoom.x, zoom.y)
    );
    
    // Update zoom level display
    const zoomLevelText = document.getElementById('zoom-level-text');
    if (zoomLevelText) {
      zoomLevelText.textContent = Math.round(newScale * 100) + '%';
    }
  });
  
  document.getElementById('zoom-out').addEventListener('click', function() {
    const svg = d3.select('#chart-container svg');
    const zoom = d3.zoomTransform(svg.node());
    const newScale = Math.max(minZoom, zoom.k / 1.2);
    svg.transition().duration(300).call(
      d3.zoom().transform,
      d3.zoomIdentity.scale(newScale).translate(zoom.x, zoom.y)
    );
    
    // Update zoom level display
    const zoomLevelText = document.getElementById('zoom-level-text');
    if (zoomLevelText) {
      zoomLevelText.textContent = Math.round(newScale * 100) + '%';
    }
  });
  
  document.getElementById('zoom-reset').addEventListener('click', function() {
    const svg = d3.select('#chart-container svg');
    svg.transition().duration(300).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
    
    // Update zoom level display
    const zoomLevelText = document.getElementById('zoom-level-text');
    if (zoomLevelText) {
      zoomLevelText.textContent = '100%';
    }
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