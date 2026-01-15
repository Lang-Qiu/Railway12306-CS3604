
const fs = require('fs');
const path = require('path');

const backendTestDir = path.join(__dirname, 'backend/test');
const frontendTestDir = path.join(__dirname, 'frontend/test');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else {
            callback(filePath);
        }
    }
}

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [pattern, replacement] of replacements) {
        if (content.includes(pattern)) {
            content = content.split(pattern).join(replacement);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

const backendReplacements = [
    ['src/domain-providers', 'src/services'],
    ['src/infra-config', 'src/config'],
    ['src/request-handlers', 'src/controllers'],
    ['src/route-manifests', 'src/routes'],
    ['src/utils/crypto', 'src/utils/encryption'], // Hypothesis: crypto might be different
];

// Walk backend tests
walkDir(backendTestDir, (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        replaceInFile(filePath, backendReplacements);
    }
});

console.log('Backend test imports updated.');
