const fs = require('fs');
const path = require('path');

const logFilePath = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logFilePath, 'utf8');
const lines = fileContent.split('\n');

const dumpDir = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\scratch\\views';
if (!fs.existsSync(dumpDir)) {
  fs.mkdirSync(dumpDir, { recursive: true });
}

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.type === 'VIEW_FILE') {
      const content = step.content || '';
      const linesOfContent = content.split('\n');
      const filePathLine = linesOfContent.find(l => l.includes('File Path:'));
      if (filePathLine) {
        const filePathMatch = filePathLine.match(/File Path: `file:\/\/\/(.*)`/);
        if (filePathMatch) {
          const rawPath = filePathMatch[1];
          const decodedPath = decodeURIComponent(rawPath).replace(/"/g, '');
          const baseName = path.basename(decodedPath);
          const dirName = path.basename(path.dirname(decodedPath));
          
          const dumpPath = path.join(dumpDir, `${step.step_index}_${dirName}_${baseName}.txt`);
          fs.writeFileSync(dumpPath, content, 'utf8');
          console.log(`Saved step ${step.step_index} view to ${dumpPath}`);
        }
      }
    }
  } catch (e) {}
}
