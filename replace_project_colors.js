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
      if ((dirFile.endsWith('.jsx') || dirFile.endsWith('.js') || dirFile.endsWith('.css')) && !dirFile.includes('ReviewsRewards.jsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  const files = walkSync(srcPath);

  files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Replace old theme colors
    content = content.replace(/#31525[bB]/g, 'var(--primary)');
    content = content.replace(/#[bB]3[dD][eE][eE]5/g, 'var(--secondary)');
    content = content.replace(/#[fF][fF][aA]101/g, 'var(--accent)');
    
    // Replace typical default tailwind/bootstrap blues and slates with theme elements
    content = content.replace(/#1[eE]3[aA]8[aA]/g, 'var(--primary)');
    content = content.replace(/#3[bB]82[fF]6/g, 'var(--secondary)');
    content = content.replace(/#172554/g, 'var(--primary-dark)');
    content = content.replace(/#0284[cC]7/g, 'var(--secondary)');

    // Replace light mode slate borders / panels with CSS variables
    content = content.replace(/#f8fafc/gi, 'var(--bg-card)');
    content = content.replace(/#e2e8f0/gi, 'var(--border)');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated colors in: ${path.basename(file)}`);
    }
  });
} else {
  console.log('src directory not found');
}
