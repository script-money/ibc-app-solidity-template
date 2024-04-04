import { exec } from 'child_process';
import { getConfig } from './_helpers';
import { Network, NetworkValues } from './interfaces';

function runSanityCheck(network: Network) {
  const config = getConfig();
  const scriptSuffix = config.isUniversal ? 'universal' : 'custom';

  exec(`bunx hardhat run deploy/private/_sanity-check-${scriptSuffix}.ts --network ${network}`, (error, stdout) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(stdout);
  });
}

for (const network of NetworkValues) {
  runSanityCheck(network);
}
