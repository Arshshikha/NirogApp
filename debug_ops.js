const fs = require('fs');

const logFilePath = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logFilePath, 'utf8');
const lines = fileContent.split('\n');

const operations = [];

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const step = JSON.parse(lines[i]);
    const stepIndex = step.step_index;
    
    // Filter to step 271
    if (stepIndex >= 272) continue;
    
    if (step.source === 'MODEL' && step.tool_calls) {
      for (const call of step.tool_calls) {
        if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(call.name)) {
          let succeeded = false;
          if (i + 1 < lines.length) {
            const nextStep = JSON.parse(lines[i + 1]);
            if (nextStep.status === 'DONE' && nextStep.type !== 'ERROR_MESSAGE' && !nextStep.error) {
              succeeded = true;
            }
          }
          if (succeeded) {
            let args = call.args;
            if (typeof args === 'string') {
              args = JSON.parse(args);
            }
            operations.push({
              stepIndex,
              name: call.name,
              target: args.TargetFile || args.targetFile
            });
          }
        }
      }
    }
  } catch (e) {}
}

// Sort by stepIndex ascending
operations.sort((a, b) => a.stepIndex - b.stepIndex);

console.log('Chronological file operations up to step 271:');
for (const op of operations) {
  console.log(`Step ${op.stepIndex}: ${op.name} -> ${op.target}`);
}
