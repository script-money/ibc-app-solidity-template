import { Address } from 'hardhat-deploy/types';
import { IbcDispatcher, XCounter, XCounterUC } from '../../typechain-types';

export type ContractType = XCounter | XCounterUC | IbcDispatcher;

export const NetworkValues = ['optimism', 'base'] as const;
export type Network = (typeof NetworkValues)[number];

export type Connection = `connection-${number | string}`;
export type Channel = `channel-${number | string}`;
type ClientSuffix = `${Network}-sim` | `${Network}-proofs-2`;

export type ClientType = {
  clientSuffix: ClientSuffix;
  canonConnFrom: Connection | '';
  canonConnTo: Connection | '';
  universalChannelId: Channel;
  universalChannelAddr: Address;
  dispatcherAddr: Address;
};

export type Config = {
  proofsEnabled: boolean;
  deploy: {
    optimism: string;
    base: string;
  };
  isUniversal: boolean;
  createChannel: {
    srcChain: Network;
    srcAddr: Address;
    dstChain: Network;
    dstAddr: Address;
    version: string;
    ordering: number;
    fees: boolean;
  };
  sendPacket: {
    optimism: {
      portAddr: Address;
      channelId: Channel;
      timeout: number;
    };
    base: {
      portAddr: Address;
      channelId: Channel;
      timeout: number;
    };
  };
  sendUniversalPacket: {
    optimism: {
      portAddr: Address;
      channelId: Channel;
      timeout: number;
    };
    base: {
      portAddr: Address;
      channelId: Channel;
      timeout: number;
    };
  };
  backup: {
    sendPacket: {
      optimism: {
        portAddr: Address;
        channelId: Channel;
        timeout: number;
      };
      base: {
        portAddr: Address;
        channelId: Channel;
        timeout: number;
      };
    };
    sendUniversalPacket: {
      optimism: {
        portAddr: Address;
        channelId: Channel;
        timeout: number;
      };
      base: {
        portAddr: Address;
        channelId: Channel;
        timeout: number;
      };
    };
  };
};

export interface HreCustomChains {
  network: Network;
  chainId: number;
  urls: {
    apiURL: string;
    apiKey: string;
    browserURL: string;
  };
}

export interface NetworkData {
  [network: string]: {
    url: string;
    alchemyRPC?: string;
    accounts: string[];
    chainId: number;
  };
}

export interface PolymerRegistry {
  [chainId: string]: {
    clients: {
      'op-client': ClientType;
      'sim-client': ClientType;
    };
  };
}
