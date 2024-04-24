// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `bunx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre, { ethers } from 'hardhat';
import { Contract } from 'ethers';
import { areAddressesEqual, getConfig } from './_helpers';
import { getIbcApp, getUcHandler } from './_vibc-helpers';
import { Network } from './interfaces';
import { XCounterUC } from '../../typechain-types';
import hhConfig from '../../hardhat.config';

const polyConfig = hhConfig.polymer;

async function main() {
  const config = getConfig();
  const networkName = hre.network.name as Network;
  const chainId = hre.config.networks[`${networkName}`].chainId;

  // Get the Universal Channel Mw from your IBC enabled contract and compare it with the values in the .env file

  // 1. Get the contract type from the config and get the contract
  const ibcApp = await getIbcApp(networkName);

  // 2. Query your app for the Universal Channel Mw address stored
  let ucHandlerAddr: string;
  try {
    ucHandlerAddr = await (ibcApp as XCounterUC).mw();
  } catch (error) {
    console.log(
      `❌ Error getting Universal Channel Mw address from IBC app. Check if the configuration file has the correct isUniversal flag set...`,
    );
    return;
  }

  // 3. Compare with the value expected in the .env config file
  let sanityCheck = false;
  let envUcHandlerAddr: string | undefined;
  try {
    // TODO: update for multi-client selection
    envUcHandlerAddr =
      config.proofsEnabled === true
        ? polyConfig[`${chainId}`]['clients']['op-client'].universalChannelAddr
        : polyConfig[`${chainId}`]['clients']['sim-client'].universalChannelAddr;
    sanityCheck = areAddressesEqual(ucHandlerAddr, envUcHandlerAddr);
  } catch (error) {
    console.log(`❌ Error comparing Universal Channel Mw addresses in .env file and IBC app: ${error}`);
    return;
  }

  // 4. If true, we continue to check the dispatcher stored in the Universal Channel Mw
  let envDispatcherAddr: string | undefined;
  let dispatcherAddr: string;
  let ucHandler: Contract | undefined;

  // If the sanity check fails, we don't need to continue with the rest of the checks
  if (!sanityCheck) {
    console.log(`
⛔ Sanity check failed for network ${networkName}, 
check if the values provided in the .env file for the Universal Channel Mw and the dispatcher are correct.
--------------------------------------------------
🔮 Expected Universal Channel Handler (in IBC contract): ${ucHandlerAddr}...
🗃️  Found Universal Channel Handler (in .env file): ${envUcHandlerAddr}...
--------------------------------------------------
        `);
    return;
  } else {
    try {
      ucHandler = await getUcHandler(networkName);
      if (!ucHandler) {
        throw new Error('❌ Error getting Universal Channel Handler contract');
      }
      dispatcherAddr = await ucHandler.dispatcher();
      envDispatcherAddr =
        config.proofsEnabled === true
          ? polyConfig[`${chainId}`]['clients']['op-client'].dispatcherAddr
          : polyConfig[`${chainId}`]['clients']['sim-client'].dispatcherAddr;
      sanityCheck = areAddressesEqual(dispatcherAddr, envDispatcherAddr);
    } catch (error) {
      console.log(`❌ Error getting dispatcher address from Universal Channel Mw or from config: ${error}`);
      return;
    }
  }

  // If sanity check is false, log an error and return
  if (!sanityCheck) {
    console.log(`
⛔ Sanity check failed for network ${networkName}, 
check if the values provided in the .env file for the Universal Channel Mw and the dispatcher are correct.
--------------------------------------------------
🔮 Expected Dispatcher (in Universal Channel Handler contract): ${dispatcherAddr}...
🗃️  Found Dispatcher (in .env file): ${envDispatcherAddr}...
--------------------------------------------------
    `);
    return;
  } else {
    // If the sanity check passes, we can continue to check the channel ID stored in the Universal Channel Mw
    let counter = 0;
    let channelBytes;
    let foundChannel = true;
    // We don't know how many channels are connected to the Universal Channel Mw, so we loop until we get an error
    do {
      // Try to get the channel ID at the index
      try {
        channelBytes = await ucHandler.connectedChannels(counter);
      } catch (error) {
        // If we get an error, it means we reached the end of the list, do not return, just log the error and set foundChannel to false
        // console.log(`❌ No channel ID at index: ${counter}`);
        foundChannel = false;
      }
      counter++;
    } while (foundChannel);

    // channelBytes should be the last (populated) index in the connectedChannels array
    const channelId = ethers.decodeBytes32String(channelBytes);
    console.log(`Channel ID in UCH contract: ${channelId}`);
    const envChannelId = config['sendUniversalPacket'][networkName]['channelId'];

    // Compare the channel ID with the one in the .env file and log an error if they don't match
    // Run only after we've encountered an error fetching a channel ID at a new index
    if (channelId === undefined && channelId !== envChannelId) {
      sanityCheck = false;
      console.log(`
⛔ Sanity check failed for network ${networkName}, 
check if the channel id value for the Universal channel in the config is correct.
--------------------------------------------------
🔮 Expected Channel ID (in Universal Channel Handler contract): ${channelId}...
🗃️  Found Channel ID (in config file): ${envChannelId}...
--------------------------------------------------
`);
      return;
    }
  }

  // 5. Print the result of the sanity check
  // If true, it means all values in the contracts check out with those in the .env file and we can continue with the script.
  console.log(`✅ Sanity check passed for network ${networkName}`);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
