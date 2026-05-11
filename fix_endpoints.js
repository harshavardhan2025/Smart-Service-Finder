import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

const getAllFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
};

const files = getAllFiles(srcDir);
let count = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5000/api')) {
    console.log(`Fixing endpoints in: ${path.basename(filePath)}`);
    // Safely replace the hardcoded root with relative '/api' globally to support Vercel proxying seamlessly!
    const fixedContent = content.replace(/https?:\/\/localhost:5000\/api/g, '/api');
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    count++;
  }
});

console.log(`🎉 DONE! Successfully transformed ${count} files to dynamic cloud-compatible endpoints!`);
