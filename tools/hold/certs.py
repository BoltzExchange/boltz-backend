import datetime
from dataclasses import dataclass
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ec import (
    SECP256R1,
)
from cryptography.x509.oid import NameOID
from utils import time_now


@dataclass
class Certificate:
    key: bytes
    cert: bytes


def load_certs(base_path: str) -> tuple[Certificate, Certificate]:
    Path(base_path).mkdir(exist_ok=True)

    ca_cert = get_cert(base_path, "ca")
    server_cert = get_cert(base_path, "server", ca_cert.key)
    get_cert(base_path, "client", ca_cert.key)

    return ca_cert, server_cert


def get_cert(base_path: str, name: str, ca_key: bytes | None = None) -> Certificate:
    def get_path(file_name: str) -> str:
        return str(Path(base_path).joinpath(Path(file_name)))

    cert_path = f"{get_path(name)}.pem"
    key_path = f"{get_path(name)}-key.pem"

    if all(Path.exists(Path(path)) for path in [cert_path, key_path]):
        return Certificate(
            key=Path.read_bytes(Path(key_path)),
            cert=Path.read_bytes(Path(cert_path)),
        )

    key = ec.generate_private_key(curve=SECP256R1())

    is_ca = ca_key is None

    subject_prefix = "HOLD"
    issuer_name = create_cert_name(f"{subject_prefix} Root CA")

    cert = (
        x509.CertificateBuilder()
        .subject_name(issuer_name if is_ca else create_cert_name(f"{subject_prefix} {name}"))
        .issuer_name(issuer_name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(time_now())
        .not_valid_after(time_now() + datetime.timedelta(weeks=52 * 10))
        .add_extension(
            x509.SubjectAlternativeName([x509.DNSName(name) for name in ["hold", "localhost"]]),
            critical=False,
        )
    )

    if is_ca:
        cert = cert.add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)

    cert = cert.sign(
        serialization.load_pem_private_key(ca_key, password=None) if not is_ca else key,
        hashes.SHA256(),
    )

    key_bytes = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
    cert_bytes = cert.public_bytes(serialization.Encoding.PEM)

    for file_path, content in [(cert_path, cert_bytes), (key_path, key_bytes)]:
        write_bytes(file_path, content)

    return Certificate(key=key_bytes, cert=cert_bytes)


def create_cert_name(common_name: str) -> x509.Name:
    return x509.Name(
        [
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ]
    )


def write_bytes(name: str, content: bytes) -> None:
    with Path.open(Path(name), "b+w") as f:
        f.write(content)
