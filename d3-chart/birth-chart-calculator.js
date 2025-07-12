// Birth Chart Calculator for Browser
// Simplified ephemeris calculations for astrological charts

// Zodiac signs data
const ZODIAC_SIGNS = [
  { name: 'Aries', startDegree: 0, element: 'Fire', symbol: '♈' },
  { name: 'Taurus', startDegree: 30, element: 'Earth', symbol: '♉' },
  { name: 'Gemini', startDegree: 60, element: 'Air', symbol: '♊' },
  { name: 'Cancer', startDegree: 90, element: 'Water', symbol: '♋' },
  { name: 'Leo', startDegree: 120, element: 'Fire', symbol: '♌' },
  { name: 'Virgo', startDegree: 150, element: 'Earth', symbol: '♍' },
  { name: 'Libra', startDegree: 180, element: 'Air', symbol: '♎' },
  { name: 'Scorpio', startDegree: 210, element: 'Water', symbol: '♏' },
  { name: 'Sagittarius', startDegree: 240, element: 'Fire', symbol: '♐' },
  { name: 'Capricorn', startDegree: 270, element: 'Earth', symbol: '♑' },
  { name: 'Aquarius', startDegree: 300, element: 'Air', symbol: '♒' },
  { name: 'Pisces', startDegree: 330, element: 'Water', symbol: '♓' }
];

// Planet data with approximate orbital periods and starting positions
const PLANETS = [
  { name: 'Sun', symbol: '☉', orbitalPeriod: 365.25, startYear: 2000, startLongitude: 280.0 },
  { name: 'Moon', symbol: '☽', orbitalPeriod: 27.32, startYear: 2000, startLongitude: 280.0 },
  { name: 'Mercury', symbol: '☿', orbitalPeriod: 88.0, startYear: 2000, startLongitude: 280.0 },
  { name: 'Venus', symbol: '♀', orbitalPeriod: 224.7, startYear: 2000, startLongitude: 280.0 },
  { name: 'Mars', symbol: '♂', orbitalPeriod: 687.0, startYear: 2000, startLongitude: 280.0 },
  { name: 'Jupiter', symbol: '♃', orbitalPeriod: 4333.0, startYear: 2000, startLongitude: 280.0 },
  { name: 'Saturn', symbol: '♄', orbitalPeriod: 10759.0, startYear: 2000, startLongitude: 280.0 },
  { name: 'Uranus', symbol: '♅', orbitalPeriod: 30685.0, startYear: 2000, startLongitude: 280.0 },
  { name: 'Neptune', symbol: '♆', orbitalPeriod: 60189.0, startYear: 2000, startLongitude: 280.0 },
  { name: 'Pluto', symbol: '♇', orbitalPeriod: 90520.0, startYear: 2000, startLongitude: 280.0 }
];

// Helper function to get zodiac sign from degree
function getZodiacSign(degree) {
  const normalizedDegree = degree % 360;
  for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
    const nextSign = ZODIAC_SIGNS[(i + 1) % ZODIAC_SIGNS.length];
    const startDegree = ZODIAC_SIGNS[i].startDegree;
    const endDegree = nextSign.startDegree;
    
    if (normalizedDegree >= startDegree && normalizedDegree < endDegree) {
      return ZODIAC_SIGNS[i];
    }
  }
  return ZODIAC_SIGNS[0]; // Fallback to Aries
}

// Helper function to convert degree to degrees and minutes
function degreeToDegreesMinutes(degree) {
  const degrees = Math.floor(degree);
  const minutes = Math.floor((degree - degrees) * 60);
  return { degrees, minutes };
}

// Simplified planet position calculation
function calculatePlanetPosition(planet, date, time) {
  // This is a simplified calculation - for accurate positions, you'd need proper ephemeris data
  const birthDate = new Date(`${date}T${time}`);
  const startDate = new Date(`${planet.startYear}-01-01T00:00:00`);
  
  const daysDiff = (birthDate - startDate) / (1000 * 60 * 60 * 24);
  const revolutions = daysDiff / planet.orbitalPeriod;
  const longitude = (planet.startLongitude + (revolutions * 360)) % 360;
  
  const sign = getZodiacSign(longitude);
  const { degrees, minutes } = degreeToDegreesMinutes(longitude - sign.startDegree);
  
  return {
    planet: planet.name,
    sign: sign.name,
    degree: degrees,
    minute: minutes,
    angle: longitude,
    isRetrograde: false // Simplified - would need speed calculation for accuracy
  };
}

// Calculate ascendant (simplified)
function calculateAscendant(date, time, latitude, longitude) {
  // This is a very simplified calculation
  // Real ascendant calculation requires proper astronomical formulas
  const birthDate = new Date(`${date}T${time}`);
  const hour = birthDate.getHours();
  const minute = birthDate.getMinutes();
  
  // Simplified: use time of day to estimate ascendant
  // This is not accurate but provides a reasonable starting point
  const timeOfDay = hour + minute / 60;
  const baseLongitude = (timeOfDay / 24) * 360;
  const adjustedLongitude = (baseLongitude + longitude) % 360;
  
  const sign = getZodiacSign(adjustedLongitude);
  const { degrees, minutes } = degreeToDegreesMinutes(adjustedLongitude - sign.startDegree);
  
  return {
    planet: 'ASC',
    sign: sign.name,
    degree: degrees,
    minute: minutes,
    angle: adjustedLongitude
  };
}

// Calculate Midheaven (simplified)
function calculateMidheaven(ascendantAngle) {
  const mcAngle = (ascendantAngle + 90) % 360;
  const sign = getZodiacSign(mcAngle);
  const { degrees, minutes } = degreeToDegreesMinutes(mcAngle - sign.startDegree);
  
  return {
    planet: 'MC',
    sign: sign.name,
    degree: degrees,
    minute: minutes,
    angle: mcAngle
  };
}

// Main birth chart calculation function
function calculateBirthChart(birthData) {
  const { date, time, latitude, longitude } = birthData;
  
  // Validate input
  if (!date || !time || latitude === undefined || longitude === undefined) {
    throw new Error('Missing required birth data fields');
  }
  
  // Calculate planet positions
  const planetPositions = PLANETS.map(planet => 
    calculatePlanetPosition(planet, date, time)
  );
  
  // Calculate ascendant
  const ascendant = calculateAscendant(date, time, latitude, longitude);
  
  // Calculate midheaven
  const midheaven = calculateMidheaven(ascendant.angle);
  
  // Add additional points
  const additionalPoints = [
    { name: 'Node', symbol: '☊', orbitalPeriod: 6798.0, startYear: 2000, startLongitude: 280.0 },
    { name: 'Lilith', symbol: '⚸', orbitalPeriod: 3232.0, startYear: 2000, startLongitude: 280.0 },
    { name: 'Chiron', symbol: '⚷', orbitalPeriod: 5080.0, startYear: 2000, startLongitude: 280.0 }
  ];
  
  const additionalPositions = additionalPoints.map(point => 
    calculatePlanetPosition(point, date, time)
  );
  
  // Combine all positions
  const allPositions = [
    ...planetPositions,
    ...additionalPositions,
    ascendant,
    midheaven
  ];
  
  // Generate house cusps (simplified - using whole sign houses)
  const houseCusps = [];
  for (let i = 0; i < 12; i++) {
    const houseAngle = (ascendant.angle + i * 30) % 360;
    const sign = getZodiacSign(houseAngle);
    const { degrees, minutes } = degreeToDegreesMinutes(houseAngle - sign.startDegree);
    
    houseCusps.push({
      house: i + 1,
      sign: sign.name,
      degree: degrees,
      minute: minutes,
      angle: houseAngle
    });
  }
  
  return {
    positions: allPositions,
    houseCusps: houseCusps,
    ascendant: ascendant,
    midheaven: midheaven,
    latitude: latitude,
    longitude: longitude
  };
}

// Convert birth chart to the format expected by the D3 chart
function convertToChartFormat(birthChart) {
  const chartData = birthChart.positions.map(pos => {
    const retrograde = pos.isRetrograde ? ',R' : '';
    return `${pos.planet},${pos.sign},${pos.degree}°${pos.minute.toString().padStart(2, '0')}'${retrograde}`;
  }).join('\n');
  
  return chartData;
}

// Export functions for use in the main chart
window.BirthChartCalculator = {
  calculateBirthChart,
  convertToChartFormat,
  ZODIAC_SIGNS,
  PLANETS
}; 