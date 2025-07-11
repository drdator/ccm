# CCM Web Interface

A modern web interface for browsing and discovering Claude Code command packages in the CCM registry.

## Features

- **Browse Commands**: View all available command packages
- **Search**: Find packages by name or description
- **Package Details**: View detailed information about each package
- **Installation Instructions**: Copy-paste install commands
- **Responsive Design**: Works on desktop and mobile
- **Real-time Data**: Fetches live data from the CCM API

## Quick Start

### Prerequisites

- CCM API server running (see `../api/` directory)
- Modern web browser

### Running Locally

```bash
# Option 1: Using Python (simple)
cd web
python -m http.server 8080
# or python3 -m http.server 8080

# Option 2: Using Node.js serve
npm install
npm run serve

# Option 3: From project root
npm run dev:web
```

Then open http://localhost:8080 in your browser.

### With API Server

The web interface needs the CCM API server running to display commands:

```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start web interface  
npm run dev:web
```

## Configuration

The API base URL is configured in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

For production deployment, update this to your deployed API URL.

## Project Structure

```
web/
├── index.html          # Main HTML page
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Features Overview

### Hero Section
- Introduction to CCM
- Quick start example commands
- Call-to-action buttons

### Command Browser
- Grid layout of available packages
- Search functionality with real-time results
- Package cards showing key information

### Package Details Modal
- Detailed package information
- Installation instructions with copy-to-clipboard
- List of commands in the package
- Usage examples

### Getting Started Guide
- Step-by-step installation instructions
- Publishing guide for developers
- Code examples

## API Integration

The web interface consumes these CCM API endpoints:

- `GET /api/commands` - List all packages
- `GET /api/commands/search?q=query` - Search packages
- `GET /api/commands/:name` - Get package details
- `GET /api/commands/:name/download` - Get package files

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

Uses modern web features:
- CSS Grid and Flexbox
- Fetch API
- ES6+ JavaScript
- CSS Custom Properties

## Development

The website is a static single-page application using vanilla HTML, CSS, and JavaScript. No build step required for development.

### Local Development

1. Start the API server: `npm run dev:api`
2. Start the web server: `npm run dev:web`
3. Open http://localhost:8080
4. Make changes to HTML/CSS/JS files
5. Refresh browser to see changes

### Deployment

For production deployment:

1. Update `API_BASE_URL` in `script.js` to your production API
2. Deploy static files to any web server or CDN
3. Ensure CORS is configured on your API server

## Contributing

This web interface is part of the CCM monorepo. See the main project README for contribution guidelines.