const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js') || dirFile.endsWith('.css')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace colors
  content = content.replace(/#4CAF50/gi, 'var(--primary)');
  content = content.replace(/#2E7D32/gi, 'var(--primary-dark)');
  content = content.replace(/#e8f5e9/gi, 'var(--primary-light)');
  content = content.replace(/#6366f1/gi, 'var(--primary)'); // old indigo
  content = content.replace(/#38bdf8/gi, 'var(--secondary)'); // light blue to pink
  content = content.replace(/#10b981/gi, 'var(--success)'); // another green

  // Replace gradients if possible
  content = content.replace(/linear-gradient\(135deg, var\(--primary\) 0%, var\(--primary-dark\) 100%\)/g, 'var(--primary-grad)');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
}
console.log('Done replacing colors.');
