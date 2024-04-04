// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `bunx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre from 'hardhat';
import { areAddressesEqual, getConfig } from './_helpers';
import { getIbcApp, getUcHandler } from './_vibc-helpers';
import { Network } from './interfaces';
import { XCounterUC } from '../../typechain-types';

async function main() {
  const config = getConfig();
  const networkName = hre.network.name as Network;

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

  if (!process.env.OP_UC_MW || !process.env.OP_UC_MW_SIM || !process.env.BASE_UC_MW || !process.env.BASE_UC_MW_SIM) {
    throw new Error('❌ Missing midware address in .env file');
  }

  // 3. Compare with the value expected in the .env config file
  let sanityCheck = false;
  let envUcHandlerAddr: string | undefined;
  try {
    if (networkName === 'optimism') {
      envUcHandlerAddr = config.proofsEnabled === true ? process.env.OP_UC_MW : process.env.OP_UC_MW_SIM;
      sanityCheck = areAddressesEqual(ucHandlerAddr, envUcHandlerAddr);
    } else if (networkName === 'base') {
      envUcHandlerAddr = config.proofsEnabled === true ? process.env.BASE_UC_MW : process.env.BASE_UC_MW_SIM;
      sanityCheck = areAddressesEqual(ucHandlerAddr, envUcHandlerAddr);
    }
  } catch (error) {
    console.log(`❌ Error comparing Universal Channel Mw addresses in .env file and IBC app: ${error}`);
    return;
  }

  // 4. If true, we continue to check the dispatcher stored in the Universal Channel Mw
  let envDispatcherAddr: string | undefined;
  let dispatcherAddr: string;
  let ucHandler;

  if (!process.env.OP_DISPATCHER || !process.env.OP_DISPATCHER_SIM || !process.env.BASE_DISPATCHER || !process.env.BASE_DISPATCHER_SIM) {
    throw new Error('❌ Missing dispatcher address in .env file');
  }

  if (sanityCheck) {
    try {
      ucHandler = await getUcHandler(networkName);
      dispatcherAddr = await ucHandler!.dispatcher();
      if (networkName === 'optimism') {
        envDispatcherAddr = config.proofsEnabled === true ? process.env.OP_DISPATCHER : process.env.OP_DISPATCHER_SIM;
        sanityCheck = areAddressesEqual(dispatcherAddr, envDispatcherAddr);
      } else if (networkName === 'base') {
        envDispatcherAddr = config.proofsEnabled === true ? process.env.BASE_DISPATCHER : process.env.BASE_DISPATCHER_SIM;
        sanityCheck = areAddressesEqual(dispatcherAddr, envDispatcherAddr);
      } else {
        sanityCheck = false;
      }
    } catch (error) {
      console.log(`❌ Error getting dispatcher address from Universal Channel Mw or from config: ${error}`);
      return;
    }
  } else {
    console.log(`
⛔ Sanity check failed for network ${networkName}, 
check if the values provided in the .env file for the Universal Channel Mw and the dispatcher are correct.
--------------------------------------------------
🔮 Expected Universal Channel Handler (in IBC contract): ${ucHandlerAddr}...
🗃️  Found Universal Channel Handler (in .env file): ${envUcHandlerAddr}...
--------------------------------------------------
        `);
    return;
  }

  if (sanityCheck) {
    const channelBytes = await ucHandler!.connectedChannels(0);
    const channelId = hre.ethers.decodeBytes32String(channelBytes);
    const envChannelId = config['sendUniversalPacket'][networkName]['channelId'];

    if (channelId !== envChannelId) {
      sanityCheck = false;
      console.log(`
⛔ Sanity check failed for network ${networkName}, 
check if the channel id value for the Universal channel in the config is correct.
--------------------------------------------------
🔮 Expected Channel ID (in Universal Channel Handler contract): ${channelId}...
🗃️  Found Dispatcher (in .env file): ${envChannelId}...
--------------------------------------------------
`);
      return;
    }
  }

  // 5. Print the result of the sanity check
  // If true, it means all values in the contracts check out with those in the .env file and we can continue with the script.
  if (sanityCheck) {
    console.log(`✅ Sanity check passed for network ${networkName}`);
  } else {
    console.log(`
⛔ Sanity check failed for network ${networkName}, 
check if the values provided in the .env file for the Universal Channel Mw and the dispatcher are correct.
--------------------------------------------------
🔮 Expected Dispatcher (in Universal Channel Handler contract): ${dispatcherAddr}...
🗃️  Found Dispatcher (in .env file): ${envDispatcherAddr}...
--------------------------------------------------
`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error: any) => {
  console.error(error);
  process.exitCode = 1;
});
