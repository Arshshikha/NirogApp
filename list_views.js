const fs = require('fs');

const logFilePath = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logFilePath, 'utf8');
const lines = fileContent.split('\n');

console.log('List of viewed files in transcript:');
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.source === 'MODEL' && step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'view_file') {
          let args = call.args;
          if (typeof args === 'string') {
            args = JSON.parse(args);
          }
          console.log(`Step ${step.step_index}: view_file -> ${args.AbsolutePath || args.absolutePath}`);
        }
      }
    }
  } catch (e) {}
}
