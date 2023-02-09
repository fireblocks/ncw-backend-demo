import { Device } from "../model/device";
import { User } from "../model/user";
import { Wallet } from "../model/wallet";
import { Clients } from "../interfaces/Clients";

export class DeviceService {
  constructor(private readonly clients: Clients) {}

  async findOne(deviceId: string) {
    return await Device.findOne({
      where: { id: deviceId },
      relations: { user: true },
    });
  }

  async assign(deviceId: string, sub: string) {
    const user = await User.findOneByOrFail({ sub });
    const { walletId } = await this.clients.admin.NCW.createWallet();

    // note: creating a default first account
    const account = await this.clients.admin.NCW.createWalletAccount(walletId);

    const wallet = new Wallet();
    wallet.id = walletId;

    const device = new Device();
    device.id = deviceId;
    device.wallet = wallet;
    device.user = user;

    await device.save();

    return { walletId };
  }

  async rpc(walletId: string, deviceId: string, message: string) {
    const response = await this.clients.signer.NCW.invokeWalletRpc(
      walletId,
      deviceId,
      message,
    );
    return response;
  }
}
