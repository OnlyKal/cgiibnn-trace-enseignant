const fs = require('fs');
const path = require('path');

// Générer un timestamp basé sur le build
const timestamp = new Date().toISOString();
const buildNumber = Math.floor(Date.now() / 1000); // Unix timestamp

// Lire la version depuis package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Créer l'objet de version
const versionObj = {
  version: version,
  build: buildNumber,
  timestamp: timestamp,
  buildDate: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Kinshasa' })
};

// Écrire dans le fichier version.json dans le dossier build
const buildVersionPath = path.join(__dirname, '../build/version.json');
fs.writeFileSync(buildVersionPath, JSON.stringify(versionObj, null, 2), 'utf8');

console.log('✅ version.json mis à jour avec succès!');
console.log('   Version:', versionObj.version);
console.log('   Build:', versionObj.build);
console.log('   Timestamp:', versionObj.timestamp);
