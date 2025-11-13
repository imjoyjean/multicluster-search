# 🔍 Multicluster Search - Joy's Prototype

Search Experience Prototype showcasing **Nodes** and **Virtual Machines** pages with advanced search capabilities.

## Features

### Nodes Page
- Real-time filtering with autocomplete
- Multi-select filters for Cluster, Namespace, Status, and Role
- Label:value syntax support (`status:Ready`, `cluster:production-east`)
- Interactive search bar with chips
- Comprehensive node information table

### Virtual Machines Page
- Hybrid search with autocomplete
- Filter by Status, OS, Cluster, and Namespace
- Label:value filtering (`status:Running`, `os:Ubuntu`, `cluster:hub`)
- Full-featured VM table with pagination
- Action buttons and saved searches

## Quick Start

### Development
```bash
npm install
npm start
```

Then open http://localhost:3000

### Production Build
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Live Demo

🌐 **[https://imjoyjean.github.io/multicluster-search](https://imjoyjean.github.io/multicluster-search)**

## Technologies

- React 18
- TypeScript
- PatternFly 5
- React Router DOM
- Webpack 5

## Author

**Joy Jean**  
Email: joy@redhat.com  
Slack: @Joy Jean  

