import { exec } from 'child_process';
import { updateConfigCreateChannel, getWhitelistedNetworks, getConfig } from './_helpers';
import { setupIbcChannelEventListener } from './_events';
import { Channel, Network } from './interfaces';

// Function to run the deploy script and capture output
function createChannelAndCapture() {
  const config = getConfig();
  const srcChain = config.createChannel.srcChain;

  // Check if the source chain from user input is whitelisted
  const allowedNetworks = getWhitelistedNetworks();
  if (!allowedNetworks.includes(srcChain)) {
    console.error('❌ Invalid network name');
    return;
  }

  exec(`bunx hardhat run deploy/private/_create-channel.ts --network ${srcChain}`, (error, stdout) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    // Process stdout to find the contract address and network
    const output = stdout.trim();
    const match = output.match(/Channel created: (\S+) with portID (\S+) on network (\S+), Counterparty: (\S+) on network (\S+)/);

    if (match) {
      const channel = match[1] as Channel;
      const portId = match[2];
      const network = match[3] as Network;
      const cpChannel = match[4] as Channel;
      const cpNetwork = match[5] as Network;

      console.log(`
          🎊   Created Channel   🎊
          -----------------------------------------
          🛣️  Channel ID: ${channel}
          🔗 Port ID: ${portId}
          🌍 Network: ${network}
          -----------------------------------------
          🛣️  Counterparty Channel ID: ${cpChannel}
          🪐 Counterparty Network: ${cpNetwork}
          -----------------------------------------\n`);

      // Update the config.json file
      updateConfigCreateChannel(network, channel, cpNetwork, cpChannel);
      console.log(`🆗 Updated config.json with ${channel} on network ${network} and ${cpChannel} on network ${cpNetwork}`);
    } else {
      console.error('❌ Could not find required parameters in output');
    }
  });
}

async function main() {
  await setupIbcChannelEventListener();
  createChannelAndCapture();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
