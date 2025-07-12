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
  "Lilith": "⚸", "Chiron": "⚷", "Fortune": "⊗", "Vertex": "Vx", "ASC": "Asc", "MC": "MC"
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
  const data = textarea ? textarea.value : '';
  
  chartData = [];
  houseCusps = [];
  
  const lines = data.split('\n').filter(line => line.trim() !== '');
  
  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 3) {
      const planet = parts[0].trim();
      const sign = parts[1].trim();
      const degreePart = parts[2].trim();
      const isRetrograde = parts.length > 3 && parts[3].trim() === 'R';
      
      const degreeMatch = degreePart.match(/^(\d+)°(\d+)'$/);
      if (degreeMatch && zodiacSigns.includes(sign)) {
        const degree = parseInt(degreeMatch[1]);
        const minute = parseInt(degreeMatch[2]);
        const totalDegrees = degree + minute / 60;
        
        chartData.push({
          planet: planet,
          sign: sign,
          degree: degree,
          minute: minute,
          totalDegrees: totalDegrees,
          isRetrograde: isRetrograde,
          angle: (zodiacSigns.indexOf(sign) * 30) + totalDegrees
        });
        
        // Generate house cusps if we have ASC and MC
        if (planet === 'ASC' || planet === 'MC') {
          houseCusps.push({
            house: planet === 'ASC' ? 1 : 10,
            angle: (zodiacSigns.indexOf(sign) * 30) + totalDegrees,
            sign: sign
          });
        }
      }
    }
  });
  
  // Generate remaining house cusps (simplified - in real astrology this would be more complex)
  if (houseCusps.length >= 2) {
    const ascAngle = houseCusps.find(h => h.house === 1).angle;
    const mcAngle = houseCusps.find(h => h.house === 10).angle;
    
    for (let i = 2; i <= 12; i++) {
      if (i !== 10) {
        const angle = (ascAngle + (i - 1) * 30) % 360;
        const signIndex = Math.floor(angle / 30);
        const sign = zodiacSigns[signIndex];
        houseCusps.push({
          house: i,
          angle: angle,
          sign: sign
        });
      }
    }
  }
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
  
  // Draw zodiac wheel
  drawZodiacWheel(g);
  
  // Draw house lines and numbers
  drawHouseLinesAndNumbers(g);
  
  // Draw aspects
  if (showAspectLines) {
    drawAspects(g);
  }
  
  // Draw planets
  drawPlanets(g);
  
  // Add interactivity
  addInteractivity(g);
}

// Draw zodiac wheel
function drawZodiacWheel(g) {
  // Outer circle
  g.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', ZODIAC_OUTER_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', '#333')
    .attr('stroke-width', 2);
  
  // Inner circle
  g.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', ZODIAC_INNER_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', '#333')
    .attr('stroke-width', 1);
  
  // Zodiac signs
  zodiacSigns.forEach((sign, index) => {
    const angle = index * 30;
    const startAngle = angle - 15;
    const endAngle = angle + 15;
    
    // Sign background
    const arc = d3.arc()
      .innerRadius(ZODIAC_INNER_RADIUS)
      .outerRadius(ZODIAC_OUTER_RADIUS)
      .startAngle(d3.radians(startAngle))
      .endAngle(d3.radians(endAngle));
    
    g.append('path')
      .attr('d', arc)
      .attr('fill', zodiacColors[sign])
      .attr('opacity', 0.3);
    
    // Sign symbol
    const symbolAngle = d3.radians(angle);
    const symbolRadius = (ZODIAC_INNER_RADIUS + ZODIAC_OUTER_RADIUS) / 2;
    const x = Math.cos(symbolAngle) * symbolRadius;
    const y = Math.sin(symbolAngle) * symbolRadius;
    
    g.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
      .attr('font-size', isMobile ? 16 : 24)
      .attr('fill', '#333')
      .text(zodiacSymbols[sign]);
    
    // Degree markers
    if (showDegreeMarkers) {
      for (let deg = 0; deg < 30; deg += 5) {
        const markerAngle = d3.radians(angle + deg);
        const outerRadius = ZODIAC_OUTER_RADIUS + 5;
        const innerRadius = ZODIAC_OUTER_RADIUS;
        
        const x1 = Math.cos(markerAngle) * innerRadius;
        const y1 = Math.sin(markerAngle) * innerRadius;
        const x2 = Math.cos(markerAngle) * outerRadius;
        const y2 = Math.sin(markerAngle) * outerRadius;
        
        g.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', '#333')
          .attr('stroke-width', deg === 0 ? 2 : 1);
      }
    }
  });
}

// Draw house lines and numbers
function drawHouseLinesAndNumbers(g) {
  houseCusps.forEach(cusp => {
    const angle = d3.radians(cusp.angle);
    const x1 = Math.cos(angle) * HOUSE_LINE_INNER_RADIUS;
    const y1 = Math.sin(angle) * HOUSE_LINE_INNER_RADIUS;
    const x2 = Math.cos(angle) * ZODIAC_INNER_RADIUS;
    const y2 = Math.sin(angle) * ZODIAC_INNER_RADIUS;
    
    // House line
    g.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', '#666')
      .attr('stroke-width', 1);
    
    // House number
    const labelAngle = d3.radians(cusp.angle);
    const labelRadius = HOUSE_NUM_RADIUS;
    const x = Math.cos(labelAngle) * labelRadius;
    const y = Math.sin(labelAngle) * labelRadius;
    
    g.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', isMobile ? 10 : 12)
      .attr('fill', '#333')
      .text(cusp.house);
  });
}

// Draw aspects
function drawAspects(g) {
  aspects.forEach(aspect => {
    const angle1 = d3.radians(aspect.planet1.angle);
    const angle2 = d3.radians(aspect.planet2.angle);
    const radius = ASPECT_HUB_RADIUS;
    
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;
    
    const line = g.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', aspect.color)
      .attr('stroke-width', aspect.weight)
      .attr('stroke-dasharray', aspect.style === 'dotted' ? '2,2' : 
                               aspect.style === 'dashed' ? '5,5' : 'none');
    
    // Add aspect data for tooltips
    line.datum(aspect);
  });
}

// Draw planets
function drawPlanets(g) {
  const filteredPlanets = chartData.filter(planet => {
    if (!showExtendedPlanets && extendedPlanetNames.includes(planet.planet)) {
      return false;
    }
    return true;
  });
  
  // Find clusters
  const clusters = findClusters(filteredPlanets);
  
  clusters.forEach((cluster, clusterIndex) => {
    const clusterRadius = cluster.length > 1 ? 15 : 0;
    
    cluster.forEach((planet, planetIndex) => {
      const angle = d3.radians(planet.angle);
      let radius = PLANET_RING_RADIUS;
      
      if (cluster.length > 1) {
        const clusterAngle = (planetIndex / cluster.length) * 2 * Math.PI;
        const x = Math.cos(angle) * radius + Math.cos(clusterAngle) * clusterRadius;
        const y = Math.sin(angle) * radius + Math.sin(clusterAngle) * clusterRadius;
        radius = Math.sqrt(x * x + y * y);
      }
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Planet symbol
      const symbol = g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'Noto Sans Symbols, Arial, sans-serif')
        .attr('font-size', isMobile ? 14 : 18)
        .attr('fill', '#333')
        .text(planetSymbols[planet.planet] || planet.planet);
      
      // Retrograde indicator
      if (planet.isRetrograde) {
        symbol.append('tspan')
          .attr('dx', 2)
          .attr('font-size', isMobile ? 8 : 10)
          .text('R');
      }
      
      // Planet label
      const labelAngle = angle + d3.radians(90);
      const labelRadius = LABEL_RADIUS;
      const labelX = Math.cos(labelAngle) * labelRadius;
      const labelY = Math.sin(labelAngle) * labelRadius;
      
      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', isMobile ? 8 : 10)
        .attr('fill', '#666')
        .text(`${planet.planet} ${planet.degree}°${planet.minute}'`);
      
      // Add planet data for tooltips
      symbol.datum(planet);
    });
  });
}

// Find planet clusters
function findClusters(planets) {
  const clusters = [];
  const used = new Set();
  
  planets.forEach((planet, i) => {
    if (used.has(i)) return;
    
    const cluster = [planet];
    used.add(i);
    
    planets.forEach((otherPlanet, j) => {
      if (i === j || used.has(j)) return;
      
      const angleDiff = Math.abs(planet.angle - otherPlanet.angle);
      if (angleDiff <= CLUSTER_THRESHOLD || angleDiff >= (360 - CLUSTER_THRESHOLD)) {
        cluster.push(otherPlanet);
        used.add(j);
      }
    });
    
    clusters.push(cluster);
  });
  
  return clusters;
}

// Add interactivity
function addInteractivity(g) {
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
  const minute = planet.minute;
  
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