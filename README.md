# Astrological Chart Generator

An interactive astrological birth chart generator built with p5.js. This tool creates beautiful, customizable natal charts with support for planets, aspects, houses, and zodiac symbols.

## Features

- **Interactive Chart Display**: Circular natal chart with proper astrological formatting
- **Planet Positions**: Shows all major planets, asteroids, and points (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Lilith, North Node, Part of Fortune, Vertex, ASC, MC)
- **Aspect Lines**: Visual representation of planetary aspects with color-coded lines
- **House System**: Whole Sign house system with house cusps and numbers
- **Zodiac Wheel**: Complete zodiac circle with degree markers and symbols
- **Interactive Controls**: Toggle switches for degree markers, extended planets, and aspect lines
- **Retrograde Indicators**: Visual indication of retrograde planets
- **Responsive Design**: Hover effects and tooltips for planet information

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/astro-chart.git
   cd astro-chart
   ```

2. Open `index.html` in your web browser

### Usage

1. **View the Chart**: The chart will load automatically with the sample data
2. **Toggle Features**: Use the control buttons in the top-left corner:
   - **Degree Markers**: Show/hide degree markers on the zodiac wheel
   - **Extended Planets**: Show/hide extended planets (Chiron, Lilith, Node, Fortune, Vertex)
   - **Aspect Lines**: Show/hide aspect lines between planets
3. **Interact**: Hover over planets to see detailed information

### Customizing Chart Data

To create a chart for a different birth time, edit the `data` variable in `p5chart.js`:

```javascript
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
```

**Format**: `PlanetName,Sign,Degree°Minutes',R` (R indicates retrograde)

## Technical Details

### Built With

- **p5.js**: JavaScript library for creative coding and graphics
- **HTML5 Canvas**: For rendering the chart
- **Vanilla JavaScript**: For interactivity and data processing

### Chart Components

- **Zodiac Wheel**: Outer ring with zodiac symbols and degree markers
- **House Lines**: Spokes from center showing house divisions
- **Planet Ring**: Middle ring showing planet positions
- **Label Ring**: Inner ring with degree and sign information
- **Aspect Hub**: Central area showing aspect connections

### Aspect Types

The chart calculates and displays these aspects:
- **Conjunction** (0°): Green solid line
- **Opposition** (180°): Red solid line
- **Square** (90°): Red solid line
- **Trine** (120°): Blue solid line
- **Sextile** (60°): Blue dotted line
- **Quincunx** (150°): Dark goldenrod dashed line
- **Minor Aspects**: Semi-sextile, semi-square, sesquiquadrate, quintile, bi-quintile

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Astrological symbols and calculations based on traditional astrological principles
- p5.js community for the excellent graphics library
- Inspired by traditional astrological chart designs

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 