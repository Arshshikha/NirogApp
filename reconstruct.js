const fs = require('fs');
const path = require('path');

const opsPath = 'C:\\Users\\arshshikha yadav\\.gemini\\antigravity-ide\\brain\\42bf35dc-09bb-43fb-bd63-5b907ed155e3\\scratch\\operations.json';
const operations = JSON.parse(fs.readFileSync(opsPath, 'utf8'));

console.log(`Replaying ${operations.length} file operations...`);

for (const op of operations) {
  const { stepIndex, name, args } = op;
  let targetFile = args.TargetFile || args.targetFile;
  
  if (!targetFile) {
    console.error(`Step ${stepIndex}: Missing TargetFile for ${name}`);
    continue;
  }
  
  // Clean up path formatting (e.g. file:/// or extra quotes)
  targetFile = targetFile.replace(/^file:\/\/\//, '');
  targetFile = targetFile.replace(/"/g, ''); // Strip only double quotes
  targetFile = path.normalize(targetFile);

  // We should NOT modify files in the brain or artifact directory during this reconstruction
  if (targetFile.includes('.gemini') || targetFile.includes('antigravity-ide')) {
    console.log(`Step ${stepIndex}: Skipping artifact file ${path.basename(targetFile)}`);
    continue;
  }

  console.log(`Step ${stepIndex}: Applying ${name} to ${targetFile}`);

  if (name === 'write_to_file') {
    const content = args.CodeContent || args.codeContent || '';
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, content, 'utf8');
  } 
  else if (name === 'replace_file_content') {
    const targetContent = args.TargetContent || args.targetContent;
    const replacementContent = args.ReplacementContent || args.replacementContent;
    
    if (!fs.existsSync(targetFile)) {
      console.error(`Step ${stepIndex}: Target file does not exist: ${targetFile}`);
      continue;
    }
    
    const fileContent = fs.readFileSync(targetFile, 'utf8');
    if (!fileContent.includes(targetContent)) {
      console.error(`Step ${stepIndex}: Target content NOT found in ${targetFile}`);
      // Log snippet of targetContent for debugging
      console.error(`TargetContent: [${targetContent.substring(0, 100)}...]`);
      continue;
    }
    
    const newContent = fileContent.replace(targetContent, replacementContent);
    fs.writeFileSync(targetFile, newContent, 'utf8');
  } 
  else if (name === 'multi_replace_file_content') {
    const chunks = args.ReplacementChunks || args.replacementChunks || [];
    if (!fs.existsSync(targetFile)) {
      console.error(`Step ${stepIndex}: Target file does not exist: ${targetFile}`);
      continue;
    }
    
    let fileContent = fs.readFileSync(targetFile, 'utf8');
    let success = true;
    
    // Apply chunks. For simplicity, we apply them one by one.
    // In multi_replace, chunks are applied to the same file.
    for (const chunk of chunks) {
      const target = chunk.TargetContent || chunk.targetContent;
      const replacement = chunk.ReplacementContent || chunk.replacementContent;
      
      if (!fileContent.includes(target)) {
        console.error(`Step ${stepIndex}: Chunk target content NOT found in ${targetFile}`);
        success = false;
        break;
      }
      fileContent = fileContent.replace(target, replacement);
    }
    
    if (success) {
      fs.writeFileSync(targetFile, fileContent, 'utf8');
    }
  }
}

console.log('Replay completed.');
