import * as bip39 from 'bip39';
import BIP32Factory, { type BIP32API } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { payments } from 'bitcoinjs-lib';
import { Buffer } from 'buffer';
import { nusacoin, DERIVATION_PATH } from './network';

let _bip32: BIP32API | null = null;
function getBip32(): BIP32API {
  if (!_bip32) _bip32 = BIP32Factory(ecc);
  return _bip32;
}

export interface WalletData {
  address: string;
  encryptedMnemonic: string;
  encryptedPrivKey: string;
}

// Generate a new 12-word mnemonic
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128); // 128 bits = 12 words
}

// Derive address and private key from mnemonic
export function deriveFromMnemonic(mnemonic: string): {
  address: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
} {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = getBip32().fromSeed(Buffer.from(seed), nusacoin);
  const child = root.derivePath(DERIVATION_PATH);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  const { address } = payments.p2pkh({
    pubkey: Buffer.from(child.publicKey),
    network: nusacoin,
  });

  if (!address) {
    throw new Error('Failed to derive address');
  }

  return {
    address,
    privateKey: child.privateKey,
    publicKey: child.publicKey,
  };
}

// Validate a mnemonic phrase
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
}

// Encrypt data with password using Web Crypto API (AES-GCM)
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 600_000, // Strong iteration count
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine salt + iv + ciphertext into a single base64 string
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Create and encrypt a new wallet
export async function createWallet(password: string): Promise<{
  walletData: WalletData;
  mnemonic: string;
}> {
  const mnemonic = generateMnemonic();
  const { address, privateKey } = deriveFromMnemonic(mnemonic);

  const encryptedMnemonic = await encrypt(mnemonic, password);
  const encryptedPrivKey = await encrypt(
    Buffer.from(privateKey).toString('hex'),
    password
  );

  return {
    walletData: { address, encryptedMnemonic, encryptedPrivKey },
    mnemonic,
  };
}

// Import wallet from mnemonic
export async function importWallet(
  mnemonic: string,
  password: string
): Promise<WalletData> {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }

  const { address, privateKey } = deriveFromMnemonic(mnemonic.trim().toLowerCase());

  const encryptedMnemonic = await encrypt(mnemonic.trim().toLowerCase(), password);
  const encryptedPrivKey = await encrypt(
    Buffer.from(privateKey).toString('hex'),
    password
  );

  return { address, encryptedMnemonic, encryptedPrivKey };
}

// Unlock wallet (decrypt private key)
export async function unlockWallet(
  walletData: WalletData,
  password: string
): Promise<{ privateKey: Uint8Array; mnemonic: string }> {
  const mnemonic = await decrypt(walletData.encryptedMnemonic, password);
  const privKeyHex = await decrypt(walletData.encryptedPrivKey, password);

  return {
    privateKey: Uint8Array.from(Buffer.from(privKeyHex, 'hex')),
    mnemonic,
  };
}

// Save wallet to localStorage
export function saveWallet(walletData: WalletData): void {
  localStorage.setItem('nux_wallet', JSON.stringify(walletData));
}

// Load wallet from localStorage
export function loadWallet(): WalletData | null {
  const raw = localStorage.getItem('nux_wallet');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WalletData;
  } catch {
    return null;
  }
}

// Delete wallet from localStorage
export function deleteWallet(): void {
  localStorage.removeItem('nux_wallet');
}
