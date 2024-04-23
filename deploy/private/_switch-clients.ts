// DEPRECATED: This script is no longer used in the current version of the SDK
import fs from 'fs';
import { getConfig, getConfigPath } from './_helpers';
import hhConfig from '../../hardhat.config.ts';

const polyConfig = hhConfig.polymer;

// Function to update config.json
function flipConfig() {
  try {
    const configPath = getConfigPath();
    const config = getConfig(configPath);
    // Create a temporary copy of the config object to store a backup of the current values
    // The backup is used when switching back to between clients
    const tempConfig = { ...config };
    const source = tempConfig.createChannel.srcChain;
    const destination = tempConfig.createChannel.dstChain;
    const srcChainId = hhConfig.networks[`${source}`].chainId;
    const dstChainId = hhConfig.networks[`${destination}`].chainId;

    // Below, we'll update the config object
    if (config.backup !== undefined && typeof config.backup === 'object' && Object.keys(config.backup).length > 0) {
      // Update the createChannel object with backup values
      config.createChannel.srcAddr = config.backup.sendPacket[source].portAddr;
      config.createChannel.dstAddr = config.backup.sendPacket[destination].portAddr;

      // Update the sendPacket and sendUniversalPacket object with backup values
      config.sendPacket = config.backup.sendPacket;
      config.sendUniversalPacket = config.backup.sendUniversalPacket;
    } else {
      // If no backup object is provided, use the default values
      config.createChannel = {
        srcChain: source,
        srcAddr: '0x1234567890AbCdEf1234567890aBcDeF12345678',
        dstChain: destination,
        dstAddr: '0x1234567890AbCdEf1234567890aBcDeF12345678',
        version: '1.0',
        ordering: 0,
        fees: false,
      };
      config.sendPacket = {
        optimism: {
          portAddr: '0x1234567890abcdef1234567890abcdef12345678',
          channelId: 'channel-n',
          timeout: 36000,
        },
        base: {
          portAddr: '0x1234567890abcdef1234567890abcdef12345678',
          channelId: 'channel-n',
          timeout: 36000,
        },
      };
      config.sendUniversalPacket = {
        optimism: {
          portAddr: '0x1234567890abcdef1234567890abcdef12345678',
          channelId: 'channel-x',
          timeout: 36000,
        },
        base: {
          portAddr: '0x1234567890abcdef1234567890abcdef12345678',
          channelId: 'channel-y',
          timeout: 36000,
        },
      };
    }

    // Update the universal channel values for new client
    config['sendUniversalPacket'][`${source}`]['channelId'] = tempConfig.proofsEnabled
      ? polyConfig[`${srcChainId}`]['clients']['op-client'].universalChannelId
      : polyConfig[`${srcChainId}`]['clients']['sim-client'].universalChannelId;
    config['sendUniversalPacket'][`${destination}`]['channelId'] = tempConfig.proofsEnabled
      ? polyConfig[`${dstChainId}`]['clients']['op-client'].universalChannelId
      : polyConfig[`${dstChainId}`]['clients']['sim-client'].universalChannelId;

    // Write a new backup object to the config
    config.backup = {
      sendPacket: tempConfig.sendPacket,
      sendUniversalPacket: tempConfig.sendUniversalPacket,
    };

    // Flip the proofsEnabled flag
    config.proofsEnabled = !config.proofsEnabled;

    // Write the updated config back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('🆗 Config updated');
  } catch (error) {
    console.error(`❌ Failed to update config: ${(error as Error).message}`);
    process.exit(1);
  }
}

flipConfig();