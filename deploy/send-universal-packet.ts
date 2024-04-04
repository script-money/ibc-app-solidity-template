// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `bunx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre, { ethers } from 'hardhat';
import { getConfig } from './private/_helpers';
import { getIbcApp } from './private/_vibc-helpers';
import { Network } from './private/interfaces';
import { XCounterUC } from '../typechain-types';

async function main() {
  const accounts = await ethers.getSigners();
  const config = getConfig();
  const sendConfig = config.sendUniversalPacket;

  const networkName = hre.network.name as Network;
  // Get the contract type from the config and get the contract
  const ibcApp = await getIbcApp(networkName);

  // Do logic to prepare the packet

  // If the network we are sending on is optimism, we need to use the base port address and vice versa
  const destPortAddr = networkName === 'optimism' ? config.sendUniversalPacket.base.portAddr : config.sendUniversalPacket.optimism.portAddr;
  const channelId = sendConfig[`${networkName}`]!.channelId;
  const channelIdBytes = ethers.encodeBytes32String(channelId);
  const timeoutSeconds = sendConfig[`${networkName}`]!.timeout;

  // Send the packet
  await (ibcApp as XCounterUC).connect(accounts[0]).sendUniversalPacket(
    destPortAddr,
    channelIdBytes,
    timeoutSeconds,
    // Define and pass optionalArgs appropriately or remove if not needed
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
