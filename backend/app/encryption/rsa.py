"""
RSA Key Exchange Module
Digunakan untuk mengenkripsi AES key saat key exchange antar user.
"""
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding as rsa_padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.backends import default_backend


def generate_rsa_keypair() -> dict:
    """
    Generate pasangan kunci RSA 2048-bit.
    Returns dict berisi public_key dan private_key dalam format PEM (string).
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    return {"public_key": public_pem, "private_key": private_pem}


def encrypt_with_public_key(data: bytes, public_key_pem: str) -> str:
    """Enkripsi data menggunakan RSA public key. Returns base64 string."""
    public_key = serialization.load_pem_public_key(
        public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    encrypted = public_key.encrypt(
        data,
        rsa_padding.OAEP(
            mgf=rsa_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return base64.b64encode(encrypted).decode('utf-8')


def decrypt_with_private_key(encrypted_data: str, private_key_pem: str) -> bytes:
    """Dekripsi data menggunakan RSA private key."""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    encrypted_bytes = base64.b64decode(encrypted_data)
    return private_key.decrypt(
        encrypted_bytes,
        rsa_padding.OAEP(
            mgf=rsa_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
