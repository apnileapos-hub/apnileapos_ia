const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// replace: dbTask = new MockTask({ ... }) with await prisma.mockTask.create(...) 
// wait, we can't because it's in an if block and the save is at the end.
// we should just change it to dbTask = await prisma.mockTask.create({ data: ... })
