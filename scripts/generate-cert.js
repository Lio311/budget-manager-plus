const forge = require('node-forge');
const fs = require('fs');

console.log('Generating key pair...');
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

const attrs = [
  { name: 'commonName', value: 'Budget Manager Plus System' },
  { name: 'countryName', value: 'IL' },
  { shortName: 'ST', value: 'Israel' },
  { name: 'localityName', value: 'Tel Aviv' },
  { name: 'organizationName', value: 'Budget Manager Plus' },
  { shortName: 'OU', value: 'IT' }
];

cert.setSubject(attrs);
cert.setIssuer(attrs);

console.log('Signing certificate...');
cert.sign(keys.privateKey, forge.md.sha256.create());

console.log('Creating PKCS#12 container...');
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
  keys.privateKey, [cert], 'password', {
    generateLocalKeyId: true,
    friendlyName: 'Budget Manager Plus System'
  }
);
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

fs.writeFileSync('system-cert.p12', p12Der, { encoding: 'binary' });

console.log('Certificate generated: system-cert.p12');
