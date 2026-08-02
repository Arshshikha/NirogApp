const fs = require('fs');

const logFilePath = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logFilePath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  try {
    const step = JSON.parse(lines[i]);
    if (step.source === 'MODEL' && step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'run_command' && call.args && (call.args.CommandLine || call.args.commandLine || '').includes('git status')) {
          console.log(`\n--- Git Status call at Step ${step.step_index} ---`);
          // Look at the next step for command output
          if (i + 1 < lines.length) {
            const nextStep = JSON.parse(lines[i + 1]);
            console.log(nextStep.content || nextStep.error || 'No output');
          }
        }
      }
    }
  } catch (e) {}
}
