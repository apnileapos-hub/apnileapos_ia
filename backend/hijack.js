const fs = require('fs');

// Replace in models
const models = ['ChatMessage.js', 'CorporateProject.js', 'Meeting.js', 'MockTask.js', 'Submission.js', 'Team.js', 'User.js'];
for (const model of models) {
   let path = `models/${model}`;
   let code = fs.readFileSync(path, 'utf8');
   code = code.replace(/require\(['"]mongoose['"]\)/g, "require('./mongoose-adapter')");
   fs.writeFileSync(path, code);
}

// Replace in server.js
let serverCode = fs.readFileSync('server.js', 'utf8');
serverCode = serverCode.replace(/require\(['"]mongoose['"]\)/g, "require('./models/mongoose-adapter')");
fs.writeFileSync('server.js', serverCode);

console.log("Hijacked mongoose successfully!");
