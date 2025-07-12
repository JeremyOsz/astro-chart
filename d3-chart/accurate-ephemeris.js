// Accurate Ephemeris Calculator for Astrological Charts
// Based on astronomical algorithms and formulas

// Julian Day Number calculation
function julianDay(year, month, day, hour, minute, second = 0) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  const jd = Math.floor(365.25 * (year + 4716)) +
             Math.floor(30.6001 * (month + 1)) +
             day + b - 1524.5 +
             hour / 24 + minute / 1440 + second / 86400;
  
  return jd;
}

// Mean anomaly calculation
function meanAnomaly(jd, planet) {
  const T = (jd - 2451545.0) / 36525; // Julian centuries since J2000
  const T2 = T * T;
  const T3 = T2 * T;
  
  // Mean anomaly coefficients for each planet
  const coefficients = {
    Sun: { M0: 357.5291092, M1: 35999.0502909, M2: -0.0001536, M3: 1.0/24490000 },
    Moon: { M0: 134.9633964, M1: 477198.8675055, M2: 0.0087414, M3: 1.0/69699 },
    Mercury: { M0: 168.6562, M1: 4.0923344368, M2: 0, M3: 0 },
    Venus: { M0: 48.0052, M1: 1.6021302244, M2: 0, M3: 0 },
    Mars: { M0: 18.6021, M1: 0.5240207766, M2: 0, M3: 0 },
    Jupiter: { M0: 19.8950, M1: 0.0830853001, M2: 0, M3: 0 },
    Saturn: { M0: 316.9670, M1: 0.0334442282, M2: 0, M3: 0 },
    Uranus: { M0: 142.5905, M1: 0.011725806, M2: 0, M3: 0 },
    Neptune: { M0: 260.2471, M1: 0.005995147, M2: 0, M3: 0 },
    Pluto: { M0: 14.065, M1: 0.00396, M2: 0, M3: 0 }
  };
  
  const coef = coefficients[planet.name];
  if (!coef) return 0;
  
  const M = coef.M0 + coef.M1 * T + coef.M2 * T2 + coef.M3 * T3;
  return M % 360;
}

// Eccentricity calculation
function eccentricity(jd, planet) {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  
  const eccentricities = {
    Sun: 0.016708634 - 0.000042037 * T - 0.0000001267 * T2,
    Moon: 0.0549,
    Mercury: 0.20563069 + 0.000020406 * T - 0.0000000284 * T2,
    Venus: 0.00677323 - 0.000049607 * T + 0.0000001045 * T2,
    Mars: 0.0934052 + 0.000092683 * T - 0.000000077 * T2,
    Jupiter: 0.048498 + 0.000163244 * T - 0.0000004719 * T2,
    Saturn: 0.0555083 - 0.000346818 * T - 0.0000006456 * T2,
    Uranus: 0.047318 + 0.00000745 * T + 0.0000000018 * T2,
    Neptune: 0.008606 + 0.00000215 * T - 0.0000000002 * T2,
    Pluto: 0.2488 + 0.0004 * T
  };
  
  return eccentricities[planet.name] || 0;
}

// True anomaly from mean anomaly (Kepler's equation)
function trueAnomaly(M, e) {
  // Solve Kepler's equation: E = M + e * sin(E)
  let E = M; // Initial guess
  const tolerance = 1e-6;
  let delta;
  
  do {
    const sinE = Math.sin(E * Math.PI / 180);
    const newE = M + e * sinE;
    delta = Math.abs(newE - E);
    E = newE;
  } while (delta > tolerance);
  
  // Calculate true anomaly
  const cosE = Math.cos(E * Math.PI / 180);
  const cosv = (cosE - e) / (1 - e * cosE);
  const sinv = (Math.sqrt(1 - e * e) * Math.sin(E * Math.PI / 180)) / (1 - e * cosE);
  
  let v = Math.atan2(sinv, cosv) * 180 / Math.PI;
  if (v < 0) v += 360;
  
  return v;
}

// Calculate planet position using orbital elements
function calculatePlanetPositionAccurate(planet, jd) {
  const M = meanAnomaly(jd, planet);
  const e = eccentricity(jd, planet);
  const v = trueAnomaly(M, e);
  
  // Get orbital elements for the planet
  const elements = getOrbitalElements(planet.name, jd);
  
  // Calculate true longitude
  const longitude = (elements.w + v) % 360;
  
  return {
    longitude: longitude,
    meanAnomaly: M,
    eccentricity: e,
    trueAnomaly: v
  };
}

// Orbital elements for planets
function getOrbitalElements(planetName, jd) {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  
  const elements = {
    Sun: {
      L0: 280.46645 + 36000.76983 * T + 0.0003032 * T2,
      w: 282.93735 + 1.71946 * T + 0.00046 * T2,
      i: 0,
      N: 0
    },
    Moon: {
      L0: 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T2 * T2 / 65194000,
      w: 83.3532465 + 4069.0137287 * T - 0.0103200 * T2 - T3 / 80053 + T2 * T2 / 18999000,
      i: 5.1453964 - 0.0009289 * T + 0.0000877 * T2,
      N: 125.04452 - 1934.136261 * T + 0.0020708 * T2 + T3 / 450000
    },
    Mercury: {
      L0: 252.250906 + 149472.6746358 * T - 0.00063535 * T2 + 0.00000011 * T3,
      w: 77.456119 + 1.5564776 * T + 0.00029544 * T2,
      i: 7.004986 - 0.0059516 * T + 0.00000081 * T2,
      N: 48.330893 - 0.1254229 * T - 0.00008833 * T2
    },
    Venus: {
      L0: 181.979801 + 58517.8156760 * T + 0.00000165 * T2 - 0.000000002 * T3,
      w: 131.563707 + 1.4022288 * T - 0.00107618 * T2,
      i: 3.394662 - 0.0008568 * T - 0.00003244 * T2,
      N: 76.679920 - 0.2780080 * T - 0.00014256 * T2
    },
    Mars: {
      L0: 355.433275 + 19140.2993313 * T + 0.00000261 * T2 - 0.000000003 * T3,
      w: 336.041049 + 1.8407588 * T + 0.00013512 * T2,
      i: 1.849726 - 0.0006011 * T + 0.00001276 * T2,
      N: 49.558093 - 0.2950250 * T - 0.00064048 * T2
    },
    Jupiter: {
      L0: 34.351484 + 3034.9056746 * T - 0.00008501 * T2 + 0.000000016 * T3,
      w: 14.7284799 + 0.21252668 * T - 0.00009911 * T2,
      i: 1.30530 - 0.00015542 * T + 0.00000031 * T2,
      N: 100.55615 + 0.32328664 * T - 0.00017926 * T2
    },
    Saturn: {
      L0: 49.944532 + 1222.1137943 * T + 0.00021004 * T2 - 0.000000019 * T3,
      w: 92.4319193 + 0.7941043 * T - 0.00009262 * T2,
      i: 2.485991 - 0.00044085 * T + 0.00000020 * T2,
      N: 113.71504 - 0.3346915 * T - 0.00000464 * T2
    },
    Uranus: {
      L0: 313.23218 + 428.49511 * T + 0.00070469 * T2,
      w: 172.434044 + 0.0924047 * T + 0.00007833 * T2,
      i: 0.774637 - 0.00000639 * T + 0.000000037 * T2,
      N: 74.22988 + 0.4734500 * T - 0.00021301 * T2
    },
    Neptune: {
      L0: 304.88003 + 218.45922 * T - 0.00032076 * T2,
      w: 46.681587 + 0.01009938 * T + 0.00000931 * T2,
      i: 1.77004 - 0.00022455 * T + 0.000000286 * T2,
      N: 131.72169 - 0.0350174 * T + 0.00000043 * T2
    },
    Pluto: {
      L0: 238.92903833 + 145.20780515 * T + 0.00000067 * T2,
      w: 224.61475833 + 0.69905722 * T + 0.00001088 * T2,
      i: 17.14001222 + 0.00000518 * T,
      N: 110.30393667 - 0.01183482 * T - 0.00000804 * T2
    }
  };
  
  return elements[planetName] || { L0: 0, w: 0, i: 0, N: 0 };
}

// Calculate ascendant using proper astronomical formula
function calculateAscendantAccurate(jd, latitude, longitude) {
  // Convert Julian Day to Local Sidereal Time
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  
  // Mean Sidereal Time at Greenwich
  const GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T2 - T3 / 38710000;
  
  // Local Sidereal Time
  const LST = (GMST + longitude) % 360;
  
  // Obliquity of the ecliptic
  const epsilon = 23.439 - 0.0000004 * T;
  
  // Calculate ascendant
  const tanAsc = (Math.cos(epsilon * Math.PI / 180) * Math.sin(LST * Math.PI / 180)) / 
                 (Math.cos(LST * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) - 
                  Math.sin(epsilon * Math.PI / 180) * Math.sin(latitude * Math.PI / 180));
  
  let ascendant = Math.atan(tanAsc) * 180 / Math.PI;
  
  // Adjust quadrant
  const cosLST = Math.cos(LST * Math.PI / 180);
  if (cosLST < 0) ascendant += 180;
  if (ascendant < 0) ascendant += 360;
  
  return ascendant;
}

// Main accurate birth chart calculation
function calculateAccurateBirthChart(birthData) {
  const { date, time, latitude, longitude } = birthData;
  
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Calculate Julian Day
  const jd = julianDay(year, month, day, hour, minute);
  
  // Planet definitions
  const planets = [
    { name: 'Sun', symbol: '☉' },
    { name: 'Moon', symbol: '☽' },
    { name: 'Mercury', symbol: '☿' },
    { name: 'Venus', symbol: '♀' },
    { name: 'Mars', symbol: '♂' },
    { name: 'Jupiter', symbol: '♃' },
    { name: 'Saturn', symbol: '♄' },
    { name: 'Uranus', symbol: '♅' },
    { name: 'Neptune', symbol: '♆' },
    { name: 'Pluto', symbol: '♇' }
  ];
  
  // Calculate planet positions
  const planetPositions = planets.map(planet => {
    const position = calculatePlanetPositionAccurate(planet, jd);
    const sign = getZodiacSign(position.longitude);
    const { degrees, minutes } = degreeToDegreesMinutes(position.longitude - sign.startDegree);
    
    return {
      planet: planet.name,
      sign: sign.name,
      degree: degrees,
      minute: minutes,
      angle: position.longitude,
      isRetrograde: false // Would need speed calculation for accuracy
    };
  });
  
  // Calculate ascendant
  const ascendantAngle = calculateAscendantAccurate(jd, latitude, longitude);
  const ascSign = getZodiacSign(ascendantAngle);
  const ascDegMin = degreeToDegreesMinutes(ascendantAngle - ascSign.startDegree);
  
  const ascendant = {
    planet: 'ASC',
    sign: ascSign.name,
    degree: ascDegMin.degrees,
    minute: ascDegMin.minutes,
    angle: ascendantAngle
  };
  
  // Calculate midheaven
  const mcAngle = (ascendantAngle + 90) % 360;
  const mcSign = getZodiacSign(mcAngle);
  const mcDegMin = degreeToDegreesMinutes(mcAngle - mcSign.startDegree);
  
  const midheaven = {
    planet: 'MC',
    sign: mcSign.name,
    degree: mcDegMin.degrees,
    minute: mcDegMin.minutes,
    angle: mcAngle
  };
  
  // Add additional points (simplified calculations)
  const additionalPoints = [
    { name: 'Node', symbol: '☊' },
    { name: 'Lilith', symbol: '⚸' },
    { name: 'Chiron', symbol: '⚷' }
  ];
  
  const additionalPositions = additionalPoints.map(point => {
    // Simplified calculation for these points
    const baseAngle = (jd - 2451545.0) * 0.9856; // Approximate daily motion
    const longitude = (point.name === 'Node' ? 125 : point.name === 'Lilith' ? 150 : 200) + baseAngle;
    const sign = getZodiacSign(longitude);
    const { degrees, minutes } = degreeToDegreesMinutes(longitude - sign.startDegree);
    
    return {
      planet: point.name,
      sign: sign.name,
      degree: degrees,
      minute: minutes,
      angle: longitude,
      isRetrograde: false
    };
  });
  
  // Combine all positions
  const allPositions = [
    ...planetPositions,
    ...additionalPositions,
    ascendant,
    midheaven
  ];
  
  return {
    positions: allPositions,
    ascendant: ascendant,
    midheaven: midheaven,
    latitude: latitude,
    longitude: longitude,
    julianDay: jd
  };
}

// Helper functions (same as in birth-chart-calculator.js)
function getZodiacSign(degree) {
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
  
  const normalizedDegree = degree % 360;
  for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
    const nextSign = ZODIAC_SIGNS[(i + 1) % ZODIAC_SIGNS.length];
    const startDegree = ZODIAC_SIGNS[i].startDegree;
    const endDegree = nextSign.startDegree;
    
    if (normalizedDegree >= startDegree && normalizedDegree < endDegree) {
      return ZODIAC_SIGNS[i];
    }
  }
  return ZODIAC_SIGNS[0];
}

function degreeToDegreesMinutes(degree) {
  const degrees = Math.floor(degree);
  const minutes = Math.floor((degree - degrees) * 60);
  return { degrees, minutes };
}

// Convert to chart format
function convertAccurateToChartFormat(birthChart) {
  const chartData = birthChart.positions.map(pos => {
    const retrograde = pos.isRetrograde ? ',R' : '';
    return `${pos.planet},${pos.sign},${pos.degree}°${pos.minute.toString().padStart(2, '0')}'${retrograde}`;
  }).join('\n');
  
  return chartData;
}

// Export functions
window.AccurateEphemeris = {
  calculateAccurateBirthChart,
  convertAccurateToChartFormat,
  julianDay,
  meanAnomaly,
  eccentricity,
  trueAnomaly
}; 