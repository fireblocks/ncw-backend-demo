import { Wallet } from "../model/wallet";
import { Clients } from "../interfaces/Clients";
import { Passphrase } from "../model/passphrase";

export class WalletService {
  constructor(private readonly clients: Clients) {}

  async findOne(walletId: string) {
    return await Wallet.findOne({
      where: { id: walletId },
    });
  }

  async findAll(sub: string) {
    return await Wallet.find({
      where: { devices: { user: { sub } } },
    });
  }

  async getLatestBackup(walletId: string) {
    const { passphraseId, createdAt, keys } =
      await this.clients.signer.NCW.getLatestBackup(walletId);

    const passphrase = await Passphrase.findOneByOrFail({ id: passphraseId });

    return {
      passphraseId,
      location: passphrase.location,
      createdAt,
      deviceId: keys[0].deviceId,
    };
  }
}
