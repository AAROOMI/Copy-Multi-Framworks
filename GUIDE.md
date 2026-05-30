# User Guide: Cybersecurity Controls Navigator

Welcome to your Cybersecurity Controls Navigator. This application helps you manage compliance with frameworks like NCA ECC, PDPL, SAMA CSF, and CMA.

## 1. Getting Started
- **Login:** Use your credentials to access the dashboard.
- **Dashboard:** View your overall compliance status, pending tasks, and recent audit logs.

## 2. NCA ECC Assessment
- **Navigate:** Click on "NCA ECC Assessment" in the sidebar.
- **Select Domain:** Click on a domain in the compliance chart or use the sidebar to jump to specific controls.
- **Update Controls:** For each control, you can:
    - Set the **Control Status** (Implemented, Partially Implemented, etc.).
    - Add a **Current Status Description**.
    - Upload **Evidence** (PDFs, images, etc.).
    - View AI-generated **Recommendations**.

## 3. Policy Management
- **Navigator:** Use the "Navigator" view to explore subdomains.
- **Generate Policies:** Click "Generate Policy with AI" to create draft policies based on the control requirements.
- **Approval:** Policies can be sent for approval to relevant roles (CISO, CTO, etc.).

## 4. Risk Assessment
- **Identify Risks:** Go to the "Risk Assessment" page to log and analyze organizational risks.
- **Mitigation:** Define treatment options and track progress.

## 5. Desktop Version (Windows)
To use the application as a standalone Windows desktop app:
1. Ensure you have Node.js installed.
2. Run `npm install` in the project root.
3. Run `npm run build:win` to generate the `.exe` installer.
4. Once built, find the installer in the `dist_electron` folder.

## 6. Docker Deployment
To run the application using Docker:
1. Build the image: `docker build -t cyber-navigator .`
2. Run the container: `docker run -p 8080:80 cyber-navigator`
3. Access the app at `http://localhost:8080`.

## 7. Local LLM Support
The application is designed to automatically switch to a local LLM (if configured) when no internet connectivity is detected, ensuring your data remains private and accessible even offline.

---
*Note: Always ensure your Firebase configuration is correctly set in `firebase-applet-config.json` for full-stack functionality.*
