"""
AES-256-CBC Encryption Module
Digunakan untuk mengenkripsi/mendekripsi isi pesan chat.
"""
import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding


def generate_aes_key() -> bytes:
    """Generate random 256-bit AES key."""
    return os.urandom(32)


def encrypt_message(plaintext: str, key: bytes) -> dict:
    """
    Enkripsi pesan menggunakan AES-256-CBC.
    Returns dict berisi encrypted_content (base64) dan iv (base64).
    """
    iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(plaintext.encode('utf-8')) + padder.finalize()
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()
    
    return {
        "encrypted_content": base64.b64encode(ciphertext).decode('utf-8'),
        "iv": base64.b64encode(iv).decode('utf-8')
    }


def decrypt_message(encrypted_content: str, iv: str, key: bytes) -> str:
    """
    Dekripsi pesan yang terenkripsi AES-256-CBC.
    """
    ciphertext = base64.b64decode(encrypted_content)
    iv_bytes = base64.b64decode(iv)
    
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv_bytes), backend=default_backend())
    decryptor = cipher.decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()
    
    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded) + unpadder.finalize()
    return plaintext.decode('utf-8')


def hash_message(content: str) -> str:
    """SHA-256 hash untuk verifikasi integritas pesan."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def verify_message_hash(content: str, expected_hash: str) -> bool:
    """Verifikasi integritas pesan."""
    return hash_message(content) == expected_hash
