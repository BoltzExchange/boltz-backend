import os
from pathlib import Path

from cryptography import x509

from plugins.hold.certs import get_cert
from plugins.hold.utils import time_now

CA_NAME = "ca"
CLIENT_NAME = "client"


class TestCerts:
    def test_create_cert(self) -> None:
        cert = get_cert("", CA_NAME)
        parsed = x509.load_pem_x509_certificate(cert.cert)
        assert parsed.not_valid_after.year == time_now().year + 10

        for path in [Path(f"{CA_NAME}.pem"), Path(f"{CA_NAME}-key.pem")]:
            assert Path.exists(path)

    def test_open_cert(self) -> None:
        ca_cert = get_cert("", CA_NAME)

        assert ca_cert.cert == Path.read_bytes(Path(f"{CA_NAME}.pem"))
        assert ca_cert.key == Path.read_bytes(Path(f"{CA_NAME}-key.pem"))

    def test_create_from_ca(self) -> None:
        cert = get_cert("", CA_NAME)
        get_cert("", CLIENT_NAME, cert.key)

        cert_verification = os.popen(
            f"openssl verify -verbose -CAfile {CA_NAME}.pem {CLIENT_NAME}.pem"
        ).read()
        assert cert_verification.strip() == f"{CLIENT_NAME}.pem: OK"

    def test_clean(self) -> None:
        for path in [
            f"{name}{suffix}" for name in [CA_NAME, CLIENT_NAME] for suffix in [".pem", "-key.pem"]
        ]:
            Path(path).unlink()
