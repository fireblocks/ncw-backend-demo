import {
  FireblocksSDK,
  Web3ConnectionFeeLevel,
  Web3ConnectionType,
} from "fireblocks-sdk";

export class Web3Service {
  constructor(private readonly signer: FireblocksSDK) {}

  async find(walletId: string) {
    const connections = await this.signer.getWeb3Connections({
      filter: { walletId },
    });
    return connections.data;
  }

  async create(
    walletId: string,
    accountId: number,
    uri: string,
    feeLevel: Web3ConnectionFeeLevel = Web3ConnectionFeeLevel.MEDIUM,
  ) {
    const connection = await this.signer.createWeb3Connection(
      Web3ConnectionType.WALLET_CONNECT,
      { uri, ncwId: walletId, ncwAccountId: accountId, feeLevel },
    );
    return connection;
  }

  async approve(walletId: string, sessionId: string) {
    return await this.signer.submitWeb3Connection(
      Web3ConnectionType.WALLET_CONNECT,
      sessionId,
      true,
    );
  }

  async deny(walletId: string, sessionId: string) {
    return await this.signer.submitWeb3Connection(
      Web3ConnectionType.WALLET_CONNECT,
      sessionId,
      false,
    );
  }

  async remove(walletId: string, sessionId: string) {
    return await this.signer.removeWeb3Connection(
      Web3ConnectionType.WALLET_CONNECT,
      sessionId,
    );
  }
}
