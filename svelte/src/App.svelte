<link rel="stylesheet" href="/styles.css" />

<script>
  import { onMount } from 'svelte';
  let chartDiv;

  // Sample chart data (same as original)
  const sampleData = `Sun,Sagittarius,17°09'
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

  onMount(() => {
    // Create necessary HTML elements that the D3 chart expects
    createRequiredElements();
    
    // Set the sample data
    const textarea = document.getElementById('chart-data-input');
    if (textarea) {
      textarea.value = sampleData;
    }

    // Load D3 first, then interpretations, then the chart
    loadD3().then(() => {
      return loadInterpretations();
    }).then(() => {
      // Dynamically load the D3 chart script and initialize it
      const script = document.createElement('script');
      script.src = '/d3chart.js';
      script.onload = () => {
        if (window.initChart) {
          window.initChart();
        }
      };
      document.body.appendChild(script);
    });
  });

  function createRequiredElements() {
    // The textarea and controls are now in the HTML, so we don't need to create them dynamically
  }

  async function loadD3() {
    // Load D3 from CDN
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v7.min.js';
    return new Promise((resolve) => {
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  async function loadInterpretations() {
    // Load the interpretations data
    const script = document.createElement('script');
    script.src = '/interpretations.js';
    return new Promise((resolve) => {
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }
</script>

<div class="container">
    <div class="data-input-section">
        <h2>Chart Data Input</h2>
        <p>Enter your chart data in the format: Planet,Sign,Degree°Minute'[,R] (one per line)</p>
        <p>You can copy data from astro-seek in this format</p>
        <textarea id="chart-data-input" placeholder="Example:
Sun,Sagittarius,17°09'
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
MC,Leo,10°14'"></textarea>
        <button id="update-chart-btn">Update Chart</button>
    </div>
    
    <div class="chart-section">
        <h1>Astrological Chart</h1>
        <div id="chart-container" bind:this={chartDiv}></div>
    </div>
    
    <div class="legend-section">
        <h2>Chart Controls</h2>
        <label><input type="checkbox" id="toggle-degree" checked> Show Degree Markers</label>
        <label><input type="checkbox" id="toggle-extended" checked> Show Extended Planets</label>
        <label><input type="checkbox" id="toggle-aspects" checked> Show Aspect Lines</label>
        <label><input type="checkbox" id="toggle-labels" checked> Show Planet Labels</label>
        
        <hr>
        
        <h2>Zoom Controls</h2>
        <div class="zoom-controls">
            <button id="zoom-in" class="zoom-btn">+</button>
            <button id="zoom-out" class="zoom-btn">−</button>
            <button id="zoom-reset" class="zoom-btn">Reset</button>
        </div>
        <div class="zoom-level">
            <span id="zoom-level-text">100%</span>
        </div>
        <p style="font-size: 12px; margin-top: 8px; color: #666;">
            <strong>Mobile:</strong> Pinch to zoom • <strong>Desktop:</strong> Mouse wheel • <strong>All:</strong> Double-click to reset
        </p>
        
        <hr>
        
        <h2>Zodiac Signs</h2>
        <ul>
            <li><span class="legend-color" style="background-color: #e53935;"></span><span class="legend-symbol">♈</span> Aries (Fire)</li>
            <li><span class="legend-color" style="background-color: #43a047;"></span><span class="legend-symbol">♉</span> Taurus (Earth)</li>
            <li><span class="legend-color" style="background-color: #fbc02d;"></span><span class="legend-symbol">♊</span> Gemini (Air)</li>
            <li><span class="legend-color" style="background-color: #039be5;"></span><span class="legend-symbol">♋</span> Cancer (Water)</li>
            <li><span class="legend-color" style="background-color: #e53935;"></span><span class="legend-symbol">♌</span> Leo (Fire)</li>
            <li><span class="legend-color" style="background-color: #43a047;"></span><span class="legend-symbol">♍</span> Virgo (Earth)</li>
            <li><span class="legend-color" style="background-color: #fbc02d;"></span><span class="legend-symbol">♎</span> Libra (Air)</li>
            <li><span class="legend-color" style="background-color: #039be5;"></span><span class="legend-symbol">♏</span> Scorpio (Water)</li>
            <li><span class="legend-color" style="background-color: #e53935;"></span><span class="legend-symbol">♐</span> Sagittarius (Fire)</li>
            <li><span class="legend-color" style="background-color: #43a047;"></span><span class="legend-symbol">♑</span> Capricorn (Earth)</li>
            <li><span class="legend-color" style="background-color: #fbc02d;"></span><span class="legend-symbol">♒</span> Aquarius (Air)</li>
            <li><span class="legend-color" style="background-color: #039be5;"></span><span class="legend-symbol">♓</span> Pisces (Water)</li>
        </ul>
        
        <hr>
        
        <h2>Planet Symbols</h2>
        <ul>
            <li><span class="legend-symbol">☉</span> Sun</li>
            <li><span class="legend-symbol">☽</span> Moon</li>
            <li><span class="legend-symbol">☿</span> Mercury</li>
            <li><span class="legend-symbol">♀</span> Venus</li>
            <li><span class="legend-symbol">♂</span> Mars</li>
            <li><span class="legend-symbol">♃</span> Jupiter</li>
            <li><span class="legend-symbol">♄</span> Saturn</li>
            <li><span class="legend-symbol">♅</span> Uranus</li>
            <li><span class="legend-symbol">♆</span> Neptune</li>
            <li><span class="legend-symbol">♇</span> Pluto</li>
            <li><span class="legend-symbol">☊</span> North Node</li>
            <li><span class="legend-symbol">⚸</span> Black Moon Lilith</li>
            <li><span class="legend-symbol">⚷</span> Chiron</li>
            <li><span class="legend-symbol">⊗</span> Part of Fortune</li>
            <li><span class="legend-symbol">Vx</span> Vertex</li>
            <li><span class="legend-symbol">Asc</span> Ascendant</li>
            <li><span class="legend-symbol">MC</span> Midheaven</li>
        </ul>
        
        <hr>
        
        <h2>Aspect Lines</h2>
        <ul>
            <li><span class="aspect-line" style="background-color: #228B22; border-radius: 2px;"></span> Conjunction (0°)</li>
            <li><span class="aspect-line" style="background-color: #FF0000; border-radius: 2px;"></span> Opposition (180°)</li>
            <li><span class="aspect-line" style="background-color: #FF0000; border-radius: 2px;"></span> Square (90°)</li>
            <li><span class="aspect-line" style="background-color: #0000FF; border-radius: 2px;"></span> Trine (120°)</li>
            <li><span class="aspect-line" style="background-color: #0000FF; border-radius: 2px; border-top: 2px dotted #0000FF; background: transparent;"></span> Sextile (60°)</li>
            <li><span class="aspect-line" style="background-color: #B8860B; border-radius: 2px; border-top: 2px dashed #B8860B; background: transparent;"></span> Quincunx (150°)</li>
        </ul>
        
        <hr>
        
        <h2>Instructions</h2>
        <p><b>Hover</b> over planets and aspects to see detailed interpretations.</p>
        <p><b>Click</b> the checkboxes to toggle different chart elements.</p>
        <p><b>Update</b> the chart data in the textarea above to see different charts.</p>
    </div>
</div> 