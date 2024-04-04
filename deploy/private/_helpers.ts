import fs from 'fs';
import path from 'path';
import { ethers } from 'hardhat';
import ibcConfig from '../../ibc.json';
import { Channel, Config, Network } from './interfaces';
import { Address } from 'hardhat-deploy/types';

// Function to get the path to the configuration file
function getConfigPath(): string {
  const configRelativePath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : 'config.json';
  // console.log(`📔 Using config file at ${configRelativePath}`);
  const configPath = path.join(__dirname, '../..', configRelativePath);
  return configPath;
}

export function getConfig(configPath?: string): Config {
  return JSON.parse(fs.readFileSync(configPath ?? getConfigPath(), 'utf8')) as Config;
}

// Function to update config.json
function updateConfigDeploy(network: Network, address: string, isSource: boolean): void {
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
      const client = config.proofsEnabled ? 'op-client' : 'sim-client';
      config.sendUniversalPacket[`${network}`].portAddr = address;
      config.sendUniversalPacket[`${network}`].channelId = ibcConfig[`${network}`][`${client}`].universalChannel as Channel;
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

async function fetchABI(explorerUrl: string, contractAddress: Address): Promise<any | null> {
  try {
    const response = await fetch(`${explorerUrl}api/v2/smart-contracts/${contractAddress}`);
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
function addressToPortId(portPrefix: string, address: Address): string {
  const config = getConfig();
  const simAddOn = config.proofsEnabled ? '-proofs-1' : '-sim';
  const suffix = address.slice(2);
  return `${portPrefix}${simAddOn}.${suffix}`;
}

function getWhitelistedNetworks(): Network[] {
  return Object.keys(ibcConfig) as Network[];
}

export { getConfigPath, updateConfigDeploy, updateConfigCreateChannel, fetchABI, areAddressesEqual, addressToPortId, getWhitelistedNetworks };
