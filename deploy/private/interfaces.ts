import { Address } from 'hardhat-deploy/types';
import { IbcDispatcher, XCounter, XCounterUC } from '../../typechain-types';

export type ContractType = XCounter | XCounterUC | IbcDispatcher;

export const NetworkValues = ['optimism', 'base'] as const;
export type Network = (typeof NetworkValues)[number];

export type Connection = `connection-${number | string}`;
export type Channel = `channel-${number | string}`;

export type ClientType = {
  canonConnFrom: Connection;
  canonConnTo: Connection;
  universalChannel: Channel;
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
