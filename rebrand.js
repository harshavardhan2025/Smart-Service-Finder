import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filesToProcess = [
  path.join(__dirname, 'backend', 'seed_relational.js'),
  path.join(__dirname, 'backend', 'seed.js'),
  path.join(__dirname, 'backend', 'config', 'db.js'),
  path.join(__dirname, 'src', 'components', 'AiChatBot.jsx'),
  path.join(__dirname, 'src', 'components', 'Sidebar.jsx'),
  path.join(__dirname, 'src', 'pages', 'Home.jsx'),
  path.join(__dirname, 'src', 'pages', 'Login.jsx'),
  path.join(__dirname, 'src', 'pages', 'Signup.jsx'),
  path.join(__dirname, 'README.md'),
  path.join(__dirname, 'public', 'index.html')
];

let totalMatches = 0;

filesToProcess.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Match and replace with capitalization sensitivity if possible!
  const before = content.length;
  
  let newContent = content.replace(/ServiceHub/g, 'Workzy');
  newContent = newContent.replace(/servicehub/g, 'workzy');
  
  if (newContent !== content) {
    console.log(`Updating brand name in: ${path.basename(filePath)}`);
    fs.writeFileSync(filePath, newContent, 'utf8');
    totalMatches++;
  }
});

console.log(`✅ Rebranding Complete! Updated ${totalMatches} files successfully.`);
