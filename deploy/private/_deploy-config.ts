import { exec } from 'child_process';
import { updateConfigDeploy, getWhitelistedNetworks } from './_helpers';
import { Network } from './interfaces';

// Run script with source and destination networks as arguments
// Example:
// $ bun run deploy-config.ts optimism base
const source = process.argv[2] as Network;
const destination = process.argv[3] as Network;

if (!source || !destination) {
  console.error('Usage: bun run deploy-config.ts <source_network> <destination_network>');
  process.exit(1);
}

// Function to run the deploy script and capture output
function deployAndCapture(network: Network, isSource: boolean): void {
  const allowedNetworks = getWhitelistedNetworks();
  if (!allowedNetworks.includes(network)) {
    console.error('Invalid network. Please provide a valid network as an argument.');
    return;
  }
  exec(`bunx hardhat run deploy/deploy.ts --network ${network}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    } else if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    } else {
      console.log(stdout);
    }

    // Process stdout to find the contract address and network
    const output = stdout.trim();
    const match = output.match(/Contract (\S+) deployed to (\S+) on network (\S+)/);

    if (match) {
      const contractType = match[1];
      const address = match[2];
      const network = match[3] as Network;

      console.log(`
          ✅   Deployment Successful   ✅
          -------------------------------
          📄 Contract Type: ${contractType}
          📍 Address: ${address}
          🌍 Network: ${network}
          -------------------------------\n
      `);

      // Update the config.json file
      updateConfigDeploy(network, address, isSource);
      console.log(`🆗 Updated ${process.env.CONFIG_PATH || 'config.json'} with address ${address} on network ${network}`);
    } else {
      console.error('❌ Could not find contract address and network in output');
    }
  });
}

function main() {
  deployAndCapture(source, true);
  deployAndCapture(destination, false);
}

main();
