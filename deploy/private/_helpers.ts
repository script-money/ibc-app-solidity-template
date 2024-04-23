import fs from 'fs';
import path from 'path';
import { ethers } from 'hardhat';
import { Address } from 'hardhat-deploy/types';
import { Channel, Config, HreCustomChains, Network, NetworkData } from './interfaces';
import hhConfig from '../../hardhat.config';

const polyConfig = hhConfig.polymer;

// Function to get the path to the configuration file
function getConfigPath(): string {
  const configRelativePath = hhConfig.vibcConfigPath ? hhConfig.vibcConfigPath : 'config/config.json';
  // console.log(`📔 Using config file at ${configRelativePath}`);
  const configPath = path.join(__dirname, '../..', configRelativePath);
  return configPath;
}

// Function to convert network name to chain ID, as specified in hardhat config file
function convertNetworkToChainId(network: Network): number {
  const chainId = (hhConfig.networks as NetworkData)[`${network}`].chainId;
  if (!chainId) {
    throw new Error(`❌ Chain ID not found for network: ${network}`);
  }
  return chainId;
}

// Function that gets the explorer url and api url from HH config
function getNetworkDataFromConfig(network: Network) {
  const networks = hhConfig.networks;
  return networks[`${network}`];
}

// Function that gets the explorer url and api url from HH config
function getExplorerDataFromConfig(network: Network) {
  const customChains = hhConfig.etherscan.customChains as HreCustomChains[];
  const chainInfo = customChains.find((chain) => chain.network === network);
  if (!chainInfo) {
    throw new Error(`❌ Chain info not found for network: ${network}`);
  }
  return chainInfo.urls;
}

export function getConfig(configPath?: string): Config {
  return JSON.parse(fs.readFileSync(configPath ?? getConfigPath(), 'utf8')) as Config;
}

// Function to update config.json
function updateConfigDeploy(network: Network, address: string, isSource: boolean): void {
  const chainId = hhConfig.networks[`${network}`].chainId;
  try {
    const configPath = getConfigPath();
    const config = getConfig(configPath);
    // Update the config object
    if (!config.isUniversal) {
      if (isSource) {
        config.createChannel.srcChain = network;
        config.createChannel.srcAddr = address;
      } else {
        config.createChannel.dstChain = network;
        config.createChannel.dstAddr = address;
      }

      config.sendPacket[`${network}`].portAddr = address;
    } else if (config.isUniversal) {
      // When using the universal channel, we can skip channel creation and instead update the sendUniversalPacket field in the config
      //TODO: update for multi-client selection
      const client = config.proofsEnabled ? 'op-client' : 'sim-client';
      config.sendUniversalPacket[`${network}`].portAddr = address;
      config['sendUniversalPacket'][`${network}`]['channelId'] = polyConfig[`${chainId}`]['clients'][`${client}`]['universalChannelId'];
    }

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('❌ Error updating config:', error);
  }
}

// Function to update config.json
function updateConfigCreateChannel(network: Network, channel: Channel, cpNetwork: Network, cpChannel: Channel) {
  try {
    const configPath = getConfigPath();
    const upConfig = getConfig(configPath);

    // Update the config object
    upConfig.sendPacket[`${network}`].channelId = channel;
    upConfig.sendPacket[`${cpNetwork}`].channelId = cpChannel;

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(upConfig, null, 2));
  } catch (error) {
    console.error('❌ Error updating config:', error);
  }
}

async function fetchABI(explorerApiUrl: string, contractAddress: Address): Promise<any | null> {
  try {
    const response = await fetch(`${explorerApiUrl}/v2/smart-contracts/${contractAddress}`);
    const body = await response.json();
    if (response.status === 200) {
      const abi = body.abi;
      return abi;
    } else {
      console.error(`❌ Failed to fetch ABI, status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching ABI:', error);
    return null;
  }
}

function areAddressesEqual(address1: string, address2: string): boolean {
  // Validate input addresses
  if (!ethers.isAddress(address1) || !ethers.isAddress(address2)) {
    throw new Error('❌ One or both addresses are not valid Ethereum addresses');
  }
  // Normalize addresses to checksummed format
  const checksumAddress1 = ethers.getAddress(address1);
  const checksumAddress2 = ethers.getAddress(address2);

  // Compare addresses
  const areEqual = checksumAddress1 === checksumAddress2;
  return areEqual;
}

// Helper function to convert an address to a port ID
function addressToPortId(address: Address, network: Network): string {
  const config = getConfig();
  // TODO: implement dynamic suffix for selected client
  const chainId = hhConfig.networks[`${network}`].chainId;
  const client = config.proofsEnabled ? 'op-client' : 'sim-client';
  const portPrefix = 'polyibc.' + polyConfig[`${chainId}`]['clients'][`${client}`].clientSuffix;
  const suffix = address.slice(2);
  return `${portPrefix}.${suffix}`;
}

function getWhitelistedNetworks(): string[] {
  return Object.keys(polyConfig) as string[];
}

export {
  getConfigPath,
  convertNetworkToChainId,
  getNetworkDataFromConfig,
  getExplorerDataFromConfig,
  updateConfigDeploy,
  updateConfigCreateChannel,
  fetchABI,
  areAddressesEqual,
  addressToPortId,
  getWhitelistedNetworks,
};
