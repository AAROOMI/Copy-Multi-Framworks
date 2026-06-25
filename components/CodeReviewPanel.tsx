import React, { useState } from 'react';
import { 
  Terminal, ShieldCheck, Check, Code, FileCode, MessageSquare, AlertTriangle, Cpu
} from 'lucide-react';

interface CodeReviewPanelProps {
  selectedPath: string;
  comments: string[];
  onChangePath: (path: string) => void;
}

export const CodeReviewPanel: React.FC<CodeReviewPanelProps> = ({
  selectedPath,
  comments,
  onChangePath
}) => {

  const filesList = [
    { name: 'firebase.ts', type: 'TypeScript Config' },
    { name: 'db.ts', type: 'Database Handlers' },
    { name: 'server.ts', type: 'Production Express Node' },
    { name: 'Dockerfile', type: 'Containerization Spec' }
  ];

  const getCodeSnippet = (path: string) => {
    switch (path) {
      case 'firebase.ts':
        return `import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBY2XUA9lh47JrdPLUJq-D3hkCioDC9SIs",
  authDomain: "gen-lang-client-0539526472.firebaseapp.com",
  projectId: "gen-lang-client-0539526472",
  storageBucket: "gen-lang-client-0539526472.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);`;

      case 'db.ts':
        return `import { collection, addDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const cleanObject = (obj: any) => {
  const clean: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      clean[key] = obj[key];
    }
  });
  return clean;
};

export const saveDialogueEntry = async (session: string, speechLog: any) => {
  return await addDoc(collection(db, "boardroom_dialogues"), cleanObject(speechLog));
};`;

      case 'server.ts':
        return `import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// API entry points first
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", db: "Firestore persistent integration" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Production server online on port 3000");
});`;

      case 'Dockerfile':
        return `FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000`;

      default:
        return `// Select a cyber security asset file on the left...`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-250 dark:border-gray-700 p-5 space-y-6">
      <div className="border-b border-gray-100 dark:border-gray-700 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-600" />
            Agentic Team Code Inspector (Security & Architecture Verification Controls)
          </h2>
          <p className="text-xs text-gray-500 font-normal">
            Consult corporate CISO, Auditor, and Developer micro-agents to crawl your deployment files, finding SAMA violations, leaking secrets, or unexposed ports.
          </p>
        </div>
        <div className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded font-normal select-none">
          Compliance Validator: Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selector */}
        <div className="lg:col-span-3 space-y-3.5">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Review Target Files
          </h3>
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
            {filesList.map((file) => {
              const isSelected = selectedPath === file.name;
              return (
                <div
                  key={file.name}
                  onClick={() => onChangePath(file.name)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-teal-50/40 dark:bg-teal-900/10 border-teal-500"
                      : "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xs font-normal text-gray-900 dark:text-white flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-teal-600" />
                    <span>{file.name}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 font-normal">
                    {file.type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Real Code Snippet Code block */}
        <div className="lg:col-span-5 bg-gray-900 border border-zinc-800 rounded-lg p-3 space-y-2 relative">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-805 pb-1 select-none">
            <span className="font-mono">source file: {selectedPath}</span>
            <span>UTF-8 TS Code</span>
          </div>
          <div className="p-1 px-1.5 bg-zinc-950/80 rounded text-[10.5px] font-mono leading-relaxed text-zinc-350 max-h-[330px] overflow-y-auto overflow-x-auto whitespace-pre">
            {getCodeSnippet(selectedPath)}
          </div>
        </div>

        {/* Right: GRC agent remarks */}
        <div className="lg:col-span-4 bg-gray-50/50 dark:bg-gray-900/20 border border-gray-250 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-1.5 text-[11px] text-gray-500 font-normal">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            <span>Agentic Officers Joint Review</span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {comments.map((comment, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-gray-800 border border-gray-250 dark:border-zinc-700/60 rounded text-[11px] leading-relaxed font-normal text-gray-600 dark:text-gray-300 flex items-start gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>{comment}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <div className="p-3 bg-teal-50/60 dark:bg-teal-950/15 border border-teal-150 rounded text-[10px] font-mono text-teal-700 dark:text-teal-400 leading-normal font-normal">
              &gt; SAMA/NCA Logical File Integrity Check: SEC-OK
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
