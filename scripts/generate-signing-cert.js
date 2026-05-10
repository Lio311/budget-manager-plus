#!/usr/bin/env node
/**
 * Generate a self-signed P12 certificate for PDF digital signing.
 * 
 * Usage:
 *   node scripts/generate-signing-cert.js
 * 
 * This will output environment variables to add to your .env or Vercel config.
 */

const forge = require('node-forge');
const crypto = require('crypto');

function generateSelfSignedP12() {
    console.log('🔐 Generating self-signed P12 certificate for PDF signing...\n');

    // Generate RSA key pair (2048 bits)
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Create a self-signed certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + crypto.randomBytes(8).toString('hex');
    
    // Valid for 10 years
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

    const attrs = [
        { name: 'commonName', value: 'Kesefly PDF Signing' },
        { name: 'organizationName', value: 'Kesefly' },
        { name: 'countryName', value: 'IL' },
        { name: 'localityName', value: 'Israel' },
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs); // Self-signed

    // Add extensions
    cert.setExtensions([
        { name: 'basicConstraints', cA: false },
        { name: 'keyUsage', digitalSignature: true, nonRepudiation: true },
        {
            name: 'extKeyUsage',
            emailProtection: true,
        },
        {
            name: 'subjectKeyIdentifier',
        },
    ]);

    // Sign the certificate with the private key
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Generate a random password
    const password = crypto.randomBytes(16).toString('hex');

    // Create PKCS#12 (P12) bundle
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        keys.privateKey,
        [cert],
        password,
        {
            algorithm: '3des', // Compatible with most libraries
            friendlyName: 'Kesefly PDF Signing Certificate',
        }
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Base64 = forge.util.encode64(p12Der);

    console.log('✅ Certificate generated successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Add these to your .env file or Vercel Environment Variables:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`PDF_SIGNING_P12_BASE64=${p12Base64}\n`);
    console.log(`PDF_SIGNING_P12_PASSWORD=${password}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Certificate Details:');
    console.log(`   Subject: ${cert.subject.getField('CN').value}`);
    console.log(`   Organization: ${cert.subject.getField('O').value}`);
    console.log(`   Valid From: ${cert.validity.notBefore.toISOString()}`);
    console.log(`   Valid Until: ${cert.validity.notAfter.toISOString()}`);
    console.log(`   Serial: ${cert.serialNumber}`);
    console.log(`   Type: Self-Signed (SHA-256 with RSA)`);
    console.log('\n⚠️  Note: This is a self-signed certificate.');
    console.log('   Adobe Reader will show "At least one signature has problems"');
    console.log('   but the signature IS technically valid and protects document integrity.');
}

generateSelfSignedP12();
