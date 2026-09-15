// ── Derive AES Key dari dua User ID (deterministik) ───────────────────────
// Key selalu sama di kedua browser karena dibuat dari kombinasi user ID
// Tidak perlu bertukar key — keduanya derive key yang identik secara independen

export async function deriveConversationKey(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort()
  const keyMaterial = sortedIds.join('-secure-chat-')
  const encoded = new TextEncoder().encode(keyMaterial)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return await crypto.subtle.importKey(
    'raw', hashBuffer, { name: 'AES-CBC' }, false, ['encrypt', 'decrypt']
  )
}

// ── AES Encrypt / Decrypt ─────────────────────────────────────────────────

export async function encryptMessage(plaintext, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, aesKey, encoded)
  return {
    encrypted_content: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv))
  }
}

export async function decryptMessage(encryptedContent, ivBase64, aesKey) {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0))
  const ciphertext = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, aesKey, ciphertext)
  return new TextDecoder().decode(decrypted)
}

// ── Message Hash (SHA-256) ────────────────────────────────────────────────

export async function hashMessage(content) {
  const encoded = new TextEncoder().encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── RSA Key Pair ──────────────────────────────────────────────────────────

export async function generateRSAKeyPair() {
  return await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['encrypt', 'decrypt']
  )
}

export async function exportPublicKey(keyPair) {
  const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
  return `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`
}

export async function exportPrivateKey(keyPair) {
  const exported = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
  return `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`
}

// ── LocalStorage ──────────────────────────────────────────────────────────

export function savePrivateKey(pem) { localStorage.setItem('privateKey', pem) }
export function loadPrivateKey() { return localStorage.getItem('privateKey') }
export function saveAESKey(id, key) {
  const keys = JSON.parse(localStorage.getItem('aesKeys') || '{}')
  keys[id] = key
  localStorage.setItem('aesKeys', JSON.stringify(keys))
}
export function loadAESKey(id) {
  const keys = JSON.parse(localStorage.getItem('aesKeys') || '{}')
  return keys[id] || null
}
export async function generateAESKey() {
  return await crypto.subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, ['encrypt', 'decrypt'])
}
export async function exportAESKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}
export async function importAESKey(base64Key) {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))
  return await crypto.subtle.importKey('raw', raw, { name: 'AES-CBC' }, true, ['encrypt', 'decrypt'])
}