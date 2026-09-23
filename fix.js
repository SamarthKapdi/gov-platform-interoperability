const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) results = results.concat(walkDir(full));
    else if (entry.name === 'server.js') results.push(full);
  }
  return results;
}

const files = walkDir('backend');
let fixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;
  
  // If file defines const PORT = ..., replace ${PORT || port} with ${PORT}
  if (content.includes('const PORT =')) {
    content = content.split('${PORT || port}').join('${PORT}');
  }
  // If file defines const port = ... (without const PORT), replace with ${port}
  if (content.includes('const port =') && !content.includes('const PORT =')) {
    content = content.split('${PORT || port}').join('${port}');
  }
  
  if (content !== before) {
    fs.writeFileSync(f, content);
    fixed++;
    console.log('Fixed: ' + f);
  }
}
console.log('Total fixed: ' + fixed);
