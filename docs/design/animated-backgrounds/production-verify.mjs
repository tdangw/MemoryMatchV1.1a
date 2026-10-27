// Sequential on purpose: no benchmark competes with another browser runner.
const stages=process.argv.includes('--final')?['mounts','cold','trace','matrix']:['cold','trace','cycles','soak'];
for(const name of stages){
  console.log(`Starting production ${name}`);
  await import(`./production-${name}.mjs`);
  console.log(`Completed production ${name}`);
}
