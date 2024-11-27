import crypto from 'crypto';

// Encryption and decryption functions
export function encrypt(value: string): string {
  console.log('Encrypting value:', value);
  if (isEncrypted(value)) {
    console.log(
      'Value is already encrypted. Returning the original encrypted value.',
    );
    return value;
  }
  const engine = getEncryptionEngine();
  const encryptedValue = engine.encryptValue(value);
  console.log('Encrypted value:', encryptedValue);
  return encryptedValue;
}

export function decrypt(value: string): string {
  console.log('Decrypting value:', value);
  if (!isEncrypted(value)) {
    console.log('Value is not encrypted. Returning the original value.');
    return value;
  }
  const engine = getEncryptionEngine();
  const decryptedValue = engine.decryptValue(value);
  // console.log('Decrypted value:', decryptedValue);
  return decryptedValue;
}

function getEncryptionEngine(): EncryptionEngine {
  return new AESEncryptionEngine();
}

interface EncryptionEngine {
  encryptValue(value: string): string;
  decryptValue(value: string): string;
}

class AESEncryptionEngine implements EncryptionEngine {
  encryptValue(value: string): string {
    const key = process.env.NODEJS_ENCRYPTION_KEY;
    if (key == null) throw new Error('NODEJS_ENCRYPTION_KEY not set');

    const iv = crypto.randomBytes(16);

    const safeKey = crypto
      .createHash('sha256')
      .update(String(key))
      .digest('base64')
      .slice(0, 32);

    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(safeKey),
      iv,
    );
    let encrypted = cipher.update(value, 'utf-8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const jsonValue = {
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex'),
    };
    return JSON.stringify(jsonValue);
  }

  decryptValue(value: string): string {
    const key = process.env.NODEJS_ENCRYPTION_KEY;
    if (key == null) throw new Error('NODEJS_ENCRYPTION_KEY not set');

    const jsonValue = JSON.parse(value);

    const safeKey = crypto
      .createHash('sha256')
      .update(String(key))
      .digest('base64')
      .slice(0, 32);

    const iv = Buffer.from(jsonValue.iv, 'hex');
    const encryptedText = Buffer.from(jsonValue.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(safeKey),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

function isEncrypted(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return (
      parsed &&
      typeof parsed === 'object' &&
      'iv' in parsed &&
      'encryptedData' in parsed
    );
  } catch (e) {
    return false;
  }
}
