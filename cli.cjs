#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

function printHelp() {
  console.log(`Usage: desktop-ai [electron-args]\n\nStarts the Desktop AI app using Electron.\n`);
}

let electron;
try {
  electron = require("electron");
} catch (err) {
  console.error('Electron is not installed. Please run "npm install" first.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help")) {
  printHelp();
  process.exit(0);
}

const appDir = path.resolve(__dirname, ".");
const child = spawn(electron, [appDir, ...args], {
  stdio: "inherit",
  shell: true,
});

child.on("close", (code) => {
  process.exit(code);
});
