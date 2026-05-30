# Desktop Version Setup (Windows)

To install this application as a desktop version on Windows machines, follow these steps:

## Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation Steps

1. **Clone or Download the Source Code**
   Download the application files to your local machine.

2. **Install Dependencies**
   Open a terminal (PowerShell or Command Prompt) in the project root and run:
   ```bash
   npm install
   ```

3. **Build the Application**
   Run the build script to generate the production-ready files:
   ```bash
   npm run build
   ```

4. **Run in Development Mode (Optional)**
   To test the desktop app without building an installer:
   ```bash
   npm run electron:dev
   ```

5. **Build the Windows Installer (.exe)**
   To create a standalone installer for Windows:
   ```bash
   npm run build:win
   ```
   The installer will be generated in the `dist_electron` folder (or `dist` depending on configuration).

## Features
- **Offline Mode**: The application includes a local LLM fallback that activates automatically when no internet connection is detected.
- **Native Window**: Runs in a dedicated window with system-level integration.
- **Voice Navigation**: Full support for headless voice navigation.

## Troubleshooting
- Ensure your `process.env.API_KEY` is set if you want to use the cloud-based Gemini features.
- If the app fails to start, check the logs in the terminal for any missing dependencies.
