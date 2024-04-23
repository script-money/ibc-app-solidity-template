import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { convertNetworkToChainId, getNetworkDataFromConfig, getConfig } from './_helpers';
import { Config, ContractType, Network } from './interfaces';
import argsObject from '../../contracts/arguments';
import hhConfig from '../../hardhat.config.ts';
import dispatcher from '../../vibcArtifacts/Dispatcher.sol/Dispatcher.json';
import universalChannelHandler from '../../vibcArtifacts/UniversalChannelHandler.sol/UniversalChannelHandler.json';

const polyConfig = hhConfig.polymer;

async function getIbcApp(network: Network): Promise<ContractType | undefined> {
  try {
    const config: Config = getConfig();
    const ibcAppAddr = config.isUniversal ? config.sendUniversalPacket[network].portAddr : config.sendPacket[network].portAddr;
    console.log(`🗄️  Fetching IBC app on ${network} at address: ${ibcAppAddr}`);
    const contractType = config.deploy[network] as keyof typeof argsObject;
    const ibcApp = (await ethers.getContractAt(contractType, ibcAppAddr)) as unknown as ContractType;
    return ibcApp;
  } catch (error) {
    console.log(`❌ Error getting IBC app: ${error}`);
    return undefined;
  }
}

function getDispatcherAddress(network: Network): string {
  const config: Config = getConfig();

  const chainId = convertNetworkToChainId(network);

  const dispatcherAddr = config.proofsEnabled
    ? polyConfig[`${chainId}`]['clients']['op-client'].dispatcherAddr
    : polyConfig[`${chainId}`]['clients']['sim-client'].dispatcherAddr;

  return dispatcherAddr;
}

async function getDispatcher(network: Network): Promise<Contract | undefined> {
  const dispatcherAbi = dispatcher.abi;
  const rpc = getNetworkDataFromConfig(network).alchemyRPC;
  const provider = new ethers.JsonRpcProvider(rpc);
  try {
    const dispatcherAddress = getDispatcherAddress(network);
    const dispatcher = new ethers.Contract(dispatcherAddress, dispatcherAbi, provider);
    return dispatcher;
  } catch (error) {
    console.log(`❌ Error getting dispatcher: ${error}`);
    return undefined;
  }
}

function getUcHandlerAddress(network: Network): string {
  const config: Config = getConfig();
  const chainId = convertNetworkToChainId(network);
  const ucHandlerAddr = config.proofsEnabled
    ? polyConfig[`${chainId}`]['clients']['op-client'].universalChannelAddr
    : polyConfig[`${chainId}`]['clients']['sim-client'].universalChannelAddr;
  return ucHandlerAddr;
}

async function getUcHandler(network: Network): Promise<Contract | undefined> {
  const ucHandlerAbi = universalChannelHandler.abi;
  const rpc = getNetworkDataFromConfig(network).alchemyRPC;
  const provider = new ethers.JsonRpcProvider(rpc);
  try {
    const ucHandlerAddress = getUcHandlerAddress(network);
    const ucHandler = new ethers.Contract(ucHandlerAddress, ucHandlerAbi, provider);
    return ucHandler;
  } catch (error) {
    console.log(`❌ Error getting ucHandler: ${error}`);
    return undefined;
  }
}

export { getIbcApp, getDispatcherAddress, getDispatcher, getUcHandlerAddress, getUcHandler };
