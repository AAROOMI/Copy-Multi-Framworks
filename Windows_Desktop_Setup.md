# Windows Desktop Installation Guide

This application is built with Electron support, allowing it to run as a native Windows desktop application.

## Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

## Steps to Build for Windows

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Desktop Application**
   Run the following command to package the application for Windows:
   ```bash
   npm run build:win
   ```

3. **Install the Application**
   - After the build completes, navigate to the `dist` folder.
   - You will find a `.exe` installer (e.g., `CybersecurityControlsNavigator Setup.exe`).
   - Run this installer on any Windows machine to install the application.

## Development Mode
To run the desktop application in development mode:
```bash
npm run electron:dev
```
