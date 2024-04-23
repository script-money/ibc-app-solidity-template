import fs from 'fs';
import { getConfig, getConfigPath, convertNetworkToChainId, getWhitelistedNetworks } from './_helpers';
import { Network } from './interfaces';

if (process.argv.length < 5) {
  console.error('❌ Incorrect number of args. Usage: bun run set-contracts-config.ts <chain> <contractType> <isUniversal>');
  process.exit(1);
}

const chain = process.argv[2] as Network;
const contractType = process.argv[3];
const universalBoolean = process.argv[4].trim().toLowerCase();

try {
  const allowedNetworks = getWhitelistedNetworks();
  const chainId = convertNetworkToChainId(chain);
  if (!allowedNetworks.includes(`${chainId}`)) {
    throw new Error('Invalid network. Please provide a valid network as an argument.');
  }
} catch (error) {
  console.error('❌ Incorrect chain value. Usage: bun run set-contracts-config.ts <chain> <contractType> <isUniversal>');
  process.exit(1);
}

let isUniversal: boolean;
if (universalBoolean === 'true') {
  isUniversal = true;
} else if (universalBoolean === 'false') {
  isUniversal = false;
} else {
  console.error('❌ Incorrect boolean value. Usage: bun run set-contracts-config.ts <chain> <contractType> <isUniversal>');
  process.exit(1);
}

// Function to update config.json
function updateConfig(network: Network, contractType: string) {
  try {
    const configPath = getConfigPath();
    const config = getConfig(configPath);

    // Update the config object
    config.deploy[network] = contractType;
    config.isUniversal = isUniversal;

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`🆗 Updated config with ${contractType} for ${network}. Set isUniversal to ${isUniversal}.`);
  } catch (error) {
    console.error(`❌ Failed to update config: ${(error as Error).message}`);
    process.exit(1);
  }
}

updateConfig(chain, contractType);
