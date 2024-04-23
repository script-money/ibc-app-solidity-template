import fs from 'fs';
import { getConfigPath, getWhitelistedNetworks, convertNetworkToChainId } from '../deploy/private/_helpers';
import { Channel, Config, Network } from '../deploy/private/interfaces';

const sendPacketInfo = {
  portAddr: '0x1234567890abcdef1234567890abcdef12345678',
  channelId: 'channel-n' as Channel,
  timeout: 36000,
};

const createChannelInfo = {
  srcChain: '',
  srcAddr: '0x1234567890AbCdEf1234567890aBcDeF12345678',
  dstChain: '',
  dstAddr: '0x1234567890AbCdEf1234567890aBcDeF12345678',
  version: '1.0',
  ordering: 0,
  fees: false,
};

const chainName1 = process.argv[2] as Network;
const chainName2 = process.argv[3] as Network;
if (!chainName1 || !chainName2) {
  console.error('Usage: node buildConfig.js <chainName1> <chainName2>');
  process.exit(1);
}
const allowedNetworks = getWhitelistedNetworks();
const chainId1 = convertNetworkToChainId(chainName1);
const chainId2 = convertNetworkToChainId(chainName2);
console.log(`Chain ID 1: ${chainId1}`);
console.log(`Chain ID 2: ${chainId2}`);
if (!allowedNetworks.includes(`${chainId1}`) || !allowedNetworks.includes(`${chainId2}`)) {
  console.error('Invalid network name. Please use one of the following:', allowedNetworks);
  process.exit(1);
}

function main() {
  try {
    const configPath = getConfigPath();
    const config = {
      proofsEnabled: false,
      isUniversal: true,
      deploy: {},
      createChannel: createChannelInfo,
      sendPacket: {},
      sendUniversalPacket: {},
    } as Config;

    config.sendUniversalPacket[`${chainName1}`] = sendPacketInfo;
    config.sendUniversalPacket[`${chainName2}`] = sendPacketInfo;
    config.sendPacket[`${chainName1}`] = sendPacketInfo;
    config.sendPacket[`${chainName2}`] = sendPacketInfo;
    config.deploy[`${chainName1}`] = '';
    config.deploy[`${chainName2}`] = '';

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('❌ Error building config:', error);
  }
}

main();
