import hre, { ethers } from 'hardhat';

import { getConfig } from './private/_helpers';
import { getIbcApp } from './private/_vibc-helpers';
import { Network } from './private/interfaces';
import { XCounter } from '../typechain-types';

const main = async () => {
  const accounts = await ethers.getSigners();
  console.dir(accounts[0]);
  const config = getConfig();

  const sendConfig = config.sendPacket;

  const networkName = hre.network.name as Network;
  // Get the contract type from the config and get the contract
  const ibcApp = await getIbcApp(networkName);
  if (!ibcApp) {
    throw new Error('Error getting IBC App');
  }

  // Do logic to prepare the packet
  const channelId = sendConfig[`${networkName}`].channelId;
  const channelIdBytes = ethers.encodeBytes32String(channelId);
  const timeoutSeconds = sendConfig[`${networkName}`]['timeout'];

  // Send the packet
  await (ibcApp.connect(accounts[0]) as XCounter).sendPacket(
    channelIdBytes,
    timeoutSeconds,
    // Define and pass optionalArgs appropriately or remove if not needed
  );
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
