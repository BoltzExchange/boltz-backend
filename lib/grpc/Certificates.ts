import { KeyCertPair } from '@grpc/grpc-js';
import { randomBytes } from 'crypto';
import fs from 'fs';
import forge from 'node-forge';
import path from 'path';
import Logger from '../Logger';

export enum CertificatePrefix {
  CA = 'ca',
  Server = 'server',
  Client = 'client',
}

export const getCertificate = (
  logger: Logger,
  subject: string,
  basePath: string,
  name: CertificatePrefix,
  caCert?: KeyCertPair,
): KeyCertPair => {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  const { certPath, keyPath } = getFilePaths(basePath, name);
  if ([certPath, keyPath].some((filePath) => !fs.existsSync(filePath))) {
    logger.debug(`Creating gRPC certificate for ${name}`);
    return generateCertificate(subject, certPath, keyPath, name, caCert);
  }

  const [cert, key] = [certPath, keyPath].map((filePath) =>
    fs.readFileSync(filePath),
  );

  return {
    cert_chain: cert,
    private_key: key,
  };
};

const generateCertificate = (
  subject: string,
  certPath: string,
  keyPath: string,
  name: string,
  caCert?: KeyCertPair,
): KeyCertPair => {
  const isCa = caCert === undefined;

  const key = forge.pki.rsa.generateKeyPair();
  const cert = forge.pki.createCertificate();

  const issuerAttrs = [
    {
      name: 'commonName',
      value: `${subject} Root CA`,
    },
  ];

  cert.setIssuer(issuerAttrs);
  cert.setSubject(
    isCa
      ? issuerAttrs
      : [
          {
            name: 'commonName',
            value: `${subject} ${name}`,
          },
        ],
  );
  cert.publicKey = key.publicKey;
  cert.serialNumber = `01${randomBytes(19).toString('hex')}`;

  const notAfter = new Date();
  notAfter.setFullYear(notAfter.getFullYear() + 10);
  cert.validity.notAfter = notAfter;
  cert.validity.notBefore = new Date();

  const extensions: any[] = [
    {
      name: 'subjectAltName',
      altNames: [
        { isIp: false, value: subject.toLowerCase() },
        { isIp: false, value: 'localhost' },
        { isIp: true, value: '127.0.0.1' },
      ].map(({ isIp, value }) => ({
        type: isIp ? 7 : 2,
        ip: isIp ? value : undefined,
        value: isIp ? undefined : value,
      })),
    },
  ];

  if (isCa) {
    extensions.push({
      name: 'basicConstraints',
      cA: true,
    });
  }

  cert.setExtensions(extensions);
  cert.sign(
    isCa
      ? key.privateKey
      : forge.pki.privateKeyFromAsn1(
          forge.asn1.fromDer(
            forge.pem.decode(caCert!.private_key.toString('utf-8'))[0].body,
          ),
        ),
    forge.md.sha256.create(),
  );

  const keyPem = forge.pki.privateKeyToPem(key.privateKey);
  const certPem = forge.pki.certificateToPem(cert);

  for (const [path, data] of [
    [keyPath, keyPem],
    [certPath, certPem],
  ]) {
    fs.writeFileSync(path, data, { encoding: 'utf-8' });
  }

  return {
    cert_chain: Buffer.from(certPem, 'utf-8'),
    private_key: Buffer.from(keyPem, 'utf-8'),
  };
};

const getFilePaths = (basePath: string, name: string) => ({
  certPath: `${path.join(basePath, name)}.pem`,
  keyPath: `${path.join(basePath, name)}-key.pem`,
});
