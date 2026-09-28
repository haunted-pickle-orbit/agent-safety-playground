const [major, minor] = process.versions.node.split('.').map(Number);
if (!((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 23)) {
  console.error('Unsupported Node.js ' + process.versions.node + '. Use Node.js 20.19.x+, 22.12.x+, or a newer major version.');
  process.exit(1);
}
