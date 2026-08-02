const fs = require('fs');

const logFilePath = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logFilePath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.type === 'VIEW_FILE') {
      const isTruncated = step.content && step.content.includes('truncated');
      const linesCount = step.content ? (step.content.match(/\n/g) || []).length : 0;
      console.log(`Step ${step.step_index}: file = ${step.content ? step.content.split('\n')[2] : 'unknown'}, lines = ${linesCount}, truncated = ${isTruncated}`);
    }
  } catch (e) {}
}
