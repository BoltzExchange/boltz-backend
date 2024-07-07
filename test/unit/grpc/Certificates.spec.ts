import fs from 'fs';
import forge from 'node-forge';
import path from 'path';
import Logger from '../../../lib/Logger';
import {
  CertificatePrefix,
  getCertificate,
} from '../../../lib/grpc/Certificates';

describe('Certificates', () => {
  const certsDir = path.join(__dirname, 'certificates');

  const cleanup = () => {
    if (fs.existsSync(certsDir)) {
      fs.rmSync(certsDir, { recursive: true });
    }
  };

  beforeEach(() => {
    cleanup();
  });

  afterAll(() => {
    cleanup();
  });

  test('should create CA certificates', () => {
    const cert = getCertificate(
      Logger.disabledLogger,
      'boltz',
      certsDir,
      CertificatePrefix.CA,
    );

    expect(fs.existsSync(path.join(certsDir, 'ca.pem'))).toEqual(true);
    expect(fs.readFileSync(path.join(certsDir, 'ca.pem'))).toEqual(
      cert.cert_chain,
    );
    expect(fs.existsSync(path.join(certsDir, 'ca-key.pem'))).toEqual(true);
    expect(fs.readFileSync(path.join(certsDir, 'ca-key.pem'))).toEqual(
      cert.private_key,
    );

    const parsed = forge.pki.certificateFromPem(
      cert.cert_chain.toString('utf-8'),
    );
    expect((parsed.getExtension('basicConstraints')! as any).cA).toEqual(true);

    const validAfter = new Date();
    validAfter.setFullYear(validAfter.getFullYear() + 9);
    expect(parsed.validity.notAfter > validAfter).toEqual(true);
  });

  test('should sign certificates', () => {
    const caCert = getCertificate(
      Logger.disabledLogger,
      'boltz',
      certsDir,
      CertificatePrefix.CA,
    );
    const serverCert = getCertificate(
      Logger.disabledLogger,
      'boltz',
      certsDir,
      CertificatePrefix.Server,
      caCert,
    );

    expect(fs.existsSync(path.join(certsDir, 'server.pem'))).toEqual(true);
    expect(fs.readFileSync(path.join(certsDir, 'server.pem'))).toEqual(
      serverCert.cert_chain,
    );
    expect(fs.existsSync(path.join(certsDir, 'server-key.pem'))).toEqual(true);
    expect(fs.readFileSync(path.join(certsDir, 'server-key.pem'))).toEqual(
      serverCert.private_key,
    );

    const parsedServer = forge.pki.certificateFromPem(
      serverCert.cert_chain.toString('utf-8'),
    );
    expect(parsedServer.getExtension('basicConstraints')).toEqual(null);
    expect(
      forge.pki
        .certificateFromPem(caCert.cert_chain.toString('utf-8'))
        .verify(parsedServer),
    ).toEqual(true);
  });

  test('should read existing certificates', () => {
    const caCert = getCertificate(
      Logger.disabledLogger,
      'boltz',
      certsDir,
      CertificatePrefix.CA,
    );

    const secondCaCert = getCertificate(
      Logger.disabledLogger,
      'boltz',
      certsDir,
      CertificatePrefix.CA,
    );

    expect(caCert).toEqual(secondCaCert);
  });
});
