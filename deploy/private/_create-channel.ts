// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `bunx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
import { addressToPortId, getConfig } from './_helpers';
import { getIbcApp } from './_vibc-helpers';
import ibcConfig from '../../ibc.json';
import hre, { ethers } from 'hardhat';
import { Network } from './interfaces';
import { XCounter } from '../../typechain-types';

interface OpIcs23ProofPath {
  prefix: Uint8Array;
  suffix: Uint8Array;
}

interface OpIcs23Proof {
  path: OpIcs23ProofPath[];
  key: Uint8Array;
  value: Uint8Array;
  prefix: Uint8Array;
}

interface DummyProof {
  proof: OpIcs23Proof[];
  height: number;
}

function createDummyProof(): DummyProof {
  return {
    proof: [
      {
        path: [
          {
            prefix: ethers.toUtf8Bytes('prefixExample1'),
            suffix: ethers.toUtf8Bytes('suffixExample1'),
          },
          // Add more OpIcs23ProofPath objects as needed
        ],
        key: ethers.toUtf8Bytes('keyExample'),
        value: ethers.toUtf8Bytes('valueExample'),
        prefix: ethers.toUtf8Bytes('prefixExample'),
      },
      // Add more OpIcs23Proof objects as needed
    ],
    height: 123456, // example block height
  };
}

async function main() {
  const config = getConfig();
  const chanConfig = config.createChannel;
  const networkName = hre.network.name as Network;

  // Get the contract type from the config and get the contract
  const ibcApp = await getIbcApp(networkName);
  if (!ibcApp) {
    throw new Error('Error getting IBC App');
  }
  const connectedChannelsBefore = await (ibcApp as XCounter).getConnectedChannels();

  // Prepare the arguments to create the channel
  const connHop1 = ibcConfig[chanConfig.srcChain][`${config.proofsEnabled ? 'op-client' : 'sim-client'}`].canonConnFrom;
  const connHop2 = ibcConfig[chanConfig.dstChain][`${config.proofsEnabled ? 'op-client' : 'sim-client'}`].canonConnTo;
  const srcPortId = addressToPortId(`polyibc.${chanConfig.srcChain}`, chanConfig.srcAddr);
  const dstPortId = addressToPortId(`polyibc.${chanConfig.dstChain}`, chanConfig.dstAddr);

  const local = {
    portId: srcPortId,
    channelId: ethers.encodeBytes32String(''),
    version: chanConfig.version,
  };

  const cp = {
    portId: dstPortId,
    channelId: ethers.encodeBytes32String(''),
    version: '',
  };

  // Create the channel
  // Note: The proofHeight and proof are dummy values and will be dropped in the future
  await (ibcApp as XCounter).createChannel(local, chanConfig.ordering, chanConfig.fees, [connHop1, connHop2], cp, createDummyProof());

  if (!config.proofsEnabled) {
    // Wait for the channel handshake to complete
    await new Promise((r) => setTimeout(r, 90000));

    // Get the connected channels and print the new channel along with its counterparty
    const connectedChannelsAfter = await (ibcApp as XCounter).getConnectedChannels();

    if (connectedChannelsAfter !== undefined && connectedChannelsAfter.length > connectedChannelsBefore.length) {
      const newChannelBytes = connectedChannelsAfter[connectedChannelsAfter.length - 1].channelId;
      const newChannel = ethers.decodeBytes32String(newChannelBytes);

      const cpChannelBytes = connectedChannelsAfter[connectedChannelsAfter.length - 1].cpChannelId;
      const cpChannel = ethers.decodeBytes32String(cpChannelBytes);

      console.log(
        `✅ Channel created: ${newChannel} with portID ${srcPortId} on network ${networkName}, Counterparty: ${cpChannel} on network ${chanConfig.dstChain}`,
      );
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
