import { exec } from 'child_process';
import { Config, Network } from './interfaces';
import { getConfig } from './_helpers';

function runSanityCheck(config: Config, network: Network) {
  const scriptSuffix = config.isUniversal ? 'universal' : 'custom';

  exec(`bunx hardhat run deploy/private/_sanity-check-${scriptSuffix}.ts --network ${network}`, (error, stdout) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(stdout);
  });
}

function main() {
  const config = getConfig();
  const configChains = config.isUniversal ? (Object.keys(config.sendUniversalPacket) as Network[]) : (Object.keys(config.sendPacket) as Network[]);

  configChains.forEach((network) => {
    runSanityCheck(config, network);
  });
}

main();
