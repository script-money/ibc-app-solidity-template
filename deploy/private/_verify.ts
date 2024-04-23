// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

import { exec } from 'child_process';
import { getConfig, getWhitelistedNetworks } from './_helpers.js';
import { getDispatcherAddress, getUcHandlerAddress } from './_vibc-helpers.js';
import argsObject from '../../contracts/arguments';
import { Network } from './interfaces.js';

const network = process.argv[2] as Network;
const address = process.argv[3];
if (!network || !address) {
  console.error('Usage: node _verify.js <network> <address>');
  process.exit(1);
}

function runVerifyContractCommand(command: string): Promise<boolean> {
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

async function runVerifyContract(constructorArgs: string[]) {
  // Check if the chain from user input is whitelisted
  const allowedNetworks = getWhitelistedNetworks();
  if (!allowedNetworks.includes(network)) {
    console.error('❌ Invalid network specified. Please provide one of the following whitelisted networks: ' + allowedNetworks.join(', '));
    process.exit(1);
  }

  const command = `npx hardhat verify --network ${network} ${address} ${constructorArgs.join(' ')}`;
  try {
    await runVerifyContractCommand(command);
  } catch (error) {
    console.error('❌ Error verifying contract: ', error);
    process.exit(1);
  }
}

async function main() {
  const config = getConfig();

  // The config should have a deploy object with the network name as the key and contract type as the value
  const contractType = config['deploy'][network];
  const args = argsObject[contractType as keyof typeof argsObject];
  if (!args) {
    console.warn(`No arguments found for contract type: ${contractType}`);
  }
  let constructorArgs;
  if (config.isUniversal) {
    const ucHandlerAddr = getUcHandlerAddress(network);
    constructorArgs = [ucHandlerAddr, ...(args ?? [])];
  } else if (!config.isUniversal) {
    const dispatcherAddr = getDispatcherAddress(network);
    constructorArgs = [dispatcherAddr, ...(args ?? [])];
  }

  if (!constructorArgs) {
    console.error('❌ Error getting constructor arguments');
    process.exit(1);
  }

  await runVerifyContract(constructorArgs);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
