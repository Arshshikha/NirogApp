const fs = require('fs');
const path = require('path');

const documentsDir = 'C:\\Users\\arshshikha yadav\\Documents';
const searchResults = [];

function scan(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.expo' || file === 'node_modules_old') {
      continue;
    }
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file === 'index.tsx' || file === 'explore.tsx' || file === 'patient.tsx') {
        // Read file snippet to check if it's NirogApp
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('NIROG') || content.includes('mockDoctors') || content.includes('brandBlue')) {
          searchResults.push({
            path: fullPath,
            size: stat.size,
            mtime: stat.mtime
          });
        }
      }
    } catch (e) {
      // Ignore
    }
  }
}

console.log('Scanning Documents for backups...');
scan(documentsDir);
console.log(`Found ${searchResults.length} matching backup files.`);
for (const res of searchResults) {
  console.log(`- Path: ${res.path}, Size: ${res.size}, Modified: ${res.mtime}`);
}

fs.writeFileSync('C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\scratch\\backup_results.json', JSON.stringify(searchResults, null, 2));
