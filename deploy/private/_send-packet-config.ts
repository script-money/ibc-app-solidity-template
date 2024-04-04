import { exec } from 'child_process';
import { getConfig, getWhitelistedNetworks } from './_helpers';
import { setupIbcPacketEventListener } from './_events';
import { Config, Network } from './interfaces';

const source = process.argv[2] as Network;
if (!source) {
  console.error('Usage: bun run send-packet-config.ts <source_network>');
  process.exit(1);
}

function runSendPacketCommand(command: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      } else {
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

async function runSendPacket(config: Config) {
  // Check if the source chain from user input is whitelisted
  const allowedNetworks = getWhitelistedNetworks();
  if (!allowedNetworks.includes(source)) {
    console.error('❌ Please provide a valid source chain');
    process.exit(1);
  }

  const script = config.isUniversal ? 'send-universal-packet.ts' : 'send-packet.ts';
  const command = `bunx hardhat run deploy/${script} --network ${source}`;

  try {
    await setupIbcPacketEventListener();
    await runSendPacketCommand(command);
  } catch (error) {
    console.error('❌ Error sending packet: ', error);
    process.exit(1);
  }
}

async function main() {
  const config = getConfig();

  await runSendPacket(config);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
