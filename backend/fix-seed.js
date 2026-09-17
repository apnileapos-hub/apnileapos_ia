const fs = require('fs');
let code = fs.readFileSync('seed.js', 'utf8');

// Remove Campus seeding block
code = code.replace(/\/\/ 1\.5 Seed Campuses[\s\S]*?console\.log\('o\. Campuses created'\);/, '');

// Fix User seeding (change campusId to spokeId)
code = code.replace(/campusId:/g, 'spokeId:');
code = code.replace(/status: 'APPROVED'/g, 'persona: "admin"');
code = code.replace(/status: "APPROVED"/g, 'persona: "admin"');

// Fix Project seeding (change prisma.project to prisma.corporateProject)
code = code.replace(/prisma\.project/g, 'prisma.corporateProject');

// Fix Project schema differences: map initialWorkstream to phases, map dateAdded string to string
code = code.replace(/initialWorkstream: (.*)/g, 'phases: [{ name: "Phase 1", description: $1 }]');

fs.writeFileSync('seed.js', code);
