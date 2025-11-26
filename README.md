# NPM Version Stats Extension

A browser extension that displays npm package version usage statistics in an organized, easy-to-read format.

## Features

- **Version Statistics**: Scrapes and displays usage percentages for all versions of an npm package
- **Smart Filtering**: Automatically ignores versions with 0.0% usage
- **Categorized Views**: Switch between Major, Minor, and Patch version groupings
- **Clean Integration**: Seamlessly integrates into npmjs.com pages above the "Current Tags" section
- **Responsive Design**: Works on different screen sizes

## How It Works

1. **Target Pages**: Only activates on npm package pages with the versions tab (`https://www.npmjs.com/package/*?activeTab=versions`)
2. **Data Scraping**: Extracts version numbers and usage percentages from the versions table
3. **Smart Grouping**: Categorizes versions by major, minor, and patch releases
4. **Interactive UI**: Provides tabbed interface to switch between different grouping views

## Installation

### Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3-dev` folder

### Production Build

1. Build the extension:
   ```bash
   npm run build
   ```
2. Load the `.output/chrome-mv3` folder in your browser

## Usage

1. Navigate to any npm package page (e.g., `https://www.npmjs.com/package/vue`)
2. Click on the "Versions" tab
3. The extension will automatically display version statistics above the "Current Tags" section
4. Use the tabs to switch between:
   - **Major Versions**: Groups like `3.x.x`, `2.x.x`
   - **Minor Versions**: Groups like `3.4.x`, `3.3.x`
   - **Patch Versions**: Individual version releases

## Development

### Project Structure

```
entrypoints/
├── content.tsx          # Main content script
├── components/          # React components
│   ├── VersionStatsApp.tsx
│   ├── StatsTabs.tsx
│   └── LoadingSpinner.tsx
├── utils/
│   └── versionUtils.ts   # Version parsing and grouping logic
├── types/
│   └── version.ts        # TypeScript type definitions
└── styles/
    └── content.css       # Extension styles
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run compile` - Type check without building
- `npm run zip` - Create distributable zip file

## Technologies

- **WXT**: Web Extension Toolkit for building browser extensions
- **React**: UI framework for the extension interface
- **TypeScript**: Type-safe development
- **CSS**: Styled to match npmjs.com design

## License

MIT
