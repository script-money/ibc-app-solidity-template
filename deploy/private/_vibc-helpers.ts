import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { fetchABI, getConfig } from './_helpers';
import { Config, ContractType, Network } from './interfaces';
import argsObject from '../../contracts/arguments';

const explorerOpUrl = 'https://optimism-sepolia.blockscout.com/';
const explorerBaseUrl = 'https://base-sepolia.blockscout.com/';

const rpcOptimism = `https://opt-sepolia.g.alchemy.com/v2/${process.env.OP_ALCHEMY_API_KEY}`;
const rpcBase = `https://base-sepolia.g.alchemy.com/v2/${process.env.BASE_ALCHEMY_API_KEY}`;

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
  let dispatcherAddr: string;
  if (network === 'optimism') {
    dispatcherAddr = config.proofsEnabled ? process.env.OP_DISPATCHER! : process.env.OP_DISPATCHER_SIM!;
  } else if (network === 'base') {
    dispatcherAddr = config.proofsEnabled ? process.env.BASE_DISPATCHER! : process.env.BASE_DISPATCHER_SIM!;
  } else {
    throw new Error('❌ Invalid network');
  }
  return dispatcherAddr;
}

async function getDispatcher(network: Network): Promise<Contract | undefined> {
  const config: Config = getConfig();
  const providerOptimism = new ethers.JsonRpcProvider(rpcOptimism);
  const providerBase = new ethers.JsonRpcProvider(rpcBase);

  let explorerUrl: string;
  let dispatcher: Contract | undefined;
  let dispatcherAddress: string;

  try {
    if (network === 'optimism') {
      explorerUrl = explorerOpUrl;
      dispatcherAddress = config.proofsEnabled ? process.env.OP_DISPATCHER! : process.env.OP_DISPATCHER_SIM!;

      const opDispatcherAbi = await fetchABI(explorerUrl, dispatcherAddress);
      dispatcher = new ethers.Contract(dispatcherAddress, opDispatcherAbi, providerOptimism);
    } else if (network === 'base') {
      explorerUrl = explorerBaseUrl;
      dispatcherAddress = config.proofsEnabled ? process.env.BASE_DISPATCHER! : process.env.BASE_DISPATCHER_SIM!;

      const baseDispatcherAbi = await fetchABI(explorerUrl, dispatcherAddress);
      dispatcher = new ethers.Contract(dispatcherAddress, baseDispatcherAbi, providerBase);
    } else {
      throw new Error(`❌ Invalid network: ${network}`);
    }
    return dispatcher;
  } catch (error) {
    console.log(`❌ Error getting dispatcher: ${error}`);
    return undefined;
  }
}

function getUcHandlerAddress(network: Network): string {
  const config: Config = getConfig();
  let ucHandlerAddr: string;
  if (network === 'optimism') {
    ucHandlerAddr = config.proofsEnabled ? process.env.OP_UC_MW! : process.env.OP_UC_MW_SIM!;
  } else if (network === 'base') {
    ucHandlerAddr = config.proofsEnabled ? process.env.BASE_UC_MW! : process.env.BASE_UC_MW_SIM!;
  } else {
    throw new Error('❌ Invalid network');
  }
  return ucHandlerAddr;
}

async function getUcHandler(network: Network): Promise<Contract | undefined> {
  const config: Config = getConfig();
  const providerOptimism = new ethers.JsonRpcProvider(rpcOptimism);
  const providerBase = new ethers.JsonRpcProvider(rpcBase);

  let explorerUrl: string;
  let ucHandler: Contract | undefined;
  let ucHandlerAddress: string;

  try {
    if (network === 'optimism') {
      explorerUrl = explorerOpUrl;
      ucHandlerAddress = config.proofsEnabled ? process.env.OP_UC_MW! : process.env.OP_UC_MW_SIM!;

      const opUcHandlerAbi = await fetchABI(explorerUrl, ucHandlerAddress);
      ucHandler = new ethers.Contract(ucHandlerAddress, opUcHandlerAbi, providerOptimism);
    } else if (network === 'base') {
      explorerUrl = explorerBaseUrl;
      ucHandlerAddress = config.proofsEnabled ? process.env.BASE_UC_MW! : process.env.BASE_UC_MW_SIM!;

      const baseUcHandlerAbi = await fetchABI(explorerUrl, ucHandlerAddress);
      ucHandler = new ethers.Contract(ucHandlerAddress, baseUcHandlerAbi, providerBase);
    } else {
      throw new Error(`❌ Invalid network: ${network}`);
    }

    return ucHandler;
  } catch (error) {
    console.log(`❌ Error getting ucHandler: ${error}`);
    return undefined;
  }
}

export { getIbcApp, getDispatcherAddress, getDispatcher, getUcHandlerAddress, getUcHandler };
