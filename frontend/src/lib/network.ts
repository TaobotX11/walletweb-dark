import { networks } from 'bitcoinjs-lib';

// Nusacoin network parameters
// P2PKH: 0x35 (53) = addresses start with 'N'
// P2SH:  0x4b (75) = addresses start with 'X'
// WIF:   0x57 (87) = standard
// BIP44 coin_type: 5003 (custom, avoids Others collision)
export const nusacoin: networks.Network = {
  messagePrefix: '\x17Nusacoin Signed Message:\n',
  bech32: 'nu',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x35,
  scriptHash: 0x4b,
  wif: 0x57,
};

export const BIP44_COIN_TYPE = 662;
export const DERIVATION_PATH = `m/44'/${BIP44_COIN_TYPE}'/0'/0/0`;

// 1 NUX = 100,000,000 nusan
export const COIN = 100_000_000;

// Minimum fee rate (nusan per byte)
export const MIN_FEE_RATE = 1;
export const DEFAULT_FEE_RATE = 3;

export const API_BASE = '/api';
export const APINUSA_URL = 'https://apinusa.taobot.org';
