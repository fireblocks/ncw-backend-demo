import crypto from "crypto";

const msg = `{"type":"VAULT_ACCOUNT_ADDED","tenantId":"b03cc88e-f4f3-5af4-8a3f-cdbeffd71db6","timestamp":1678979524804,"data":{"id":"1","name":"secondary","hiddenOnUI":false,"assets":[]}}`;
const sig = `fsTdduX/3kKL4WdFKrFE20k38EiPja23QhFOZcpVJczvoX//uTOXWEBDALv9tA6nBH7dXWbdaj/Kr2ktp0UyaPCh4JjjfBcYuZSp5t3lZJK8819bUKDUgXWg/So6HO2VUtbN9MFQ6Nkuss22Fsz5VJAPqWWEi9dMoPVgnpJqYIk4f6pAFWt+eBT2P0erndYBoOCx8Ao61SUlqZNXzigmksrJRtlf2pELC7PvPYwd9GBw71NtUfbeJoB0sCP8QXqSuB0cTXd3oHFgn86WMiOfvNcelMC1ZPwG7sSYdKBnTwpXpJ6xsZWUFQM6rPYEU/ZlvTLWYAg6wkbNutpJJkdfNw==`;

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw+fZuC+0vDYTf8fYnCN6
71iHg98lPHBmafmqZqb+TUexn9sH6qNIBZ5SgYFxFK6dYXIuJ5uoORzihREvZVZP
8DphdeKOMUrMr6b+Cchb2qS8qz8WS7xtyLU9GnBn6M5mWfjkjQr1jbilH15Zvcpz
ECC8aPUAy2EbHpnr10if2IHkIAWLYD+0khpCjpWtsfuX+LxqzlqQVW9xc6z7tshK
eCSEa6Oh8+ia7Zlu0b+2xmy2Arb6xGl+s+Rnof4lsq9tZS6f03huc+XVTmd6H2We
WxFMfGyDCX2akEg2aAvx7231/6S0vBFGiX0C+3GbXlieHDplLGoODHUt5hxbPJnK
IwIDAQAB
-----END PUBLIC KEY-----`;

describe("webhook", () => {
  it("should verify", () => {
    const verifier = crypto.createVerify("RSA-SHA512");
    verifier.write(msg);
    verifier.end();

    const isVerified = verifier.verify(publicKey, sig, "base64");
    expect(isVerified).toBeTruthy();
  });
});
