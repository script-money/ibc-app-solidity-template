// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `bunx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import hre, { ethers } from 'hardhat';
import { getConfig } from './private/_helpers';
import { getDispatcherAddress, getUcHandlerAddress } from './private/_vibc-helpers';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime';
import { Network } from './private/interfaces';
import argsObject from '../contracts/arguments';

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const config = getConfig();
  const networkName = hre.network.name as Network;

  // The config should have a deploy object with the network name as the key and contract type as the value
  const contractType = config.deploy[`${networkName}`] as keyof typeof argsObject;
  const args = argsObject[`${contractType}`];
  if (!args) {
    console.warn(`No arguments found for contract type: ${contractType}`);
  }

  // TODO: update to switch statement when supporting more networks
  let constructorArgs: any[];
  if (config.isUniversal) {
    const ucHandlerAddr = getUcHandlerAddress(networkName);
    constructorArgs = [ucHandlerAddr, ...(args ?? [])];
  } else {
    const dispatcherAddr = getDispatcherAddress(networkName);
    constructorArgs = [dispatcherAddr, ...(args ?? [])];
  }

  // Deploy the contract
  // NOTE: when adding additional args to the constructor, add them to the array as well
  const factory = await ethers.getContractFactory(contractType);
  const myContract = await factory.deploy(...constructorArgs);

  // NOTE: Do not change the output string, its output is formatted to be used in the deploy-config.ts script
  // to update the config.json file
  console.log(`Contract ${contractType} deployed to ${myContract.target} on network ${networkName}`);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main(hre).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
