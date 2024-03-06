import { NFTOwnershipWalletType } from "fireblocks-sdk";
import { Clients } from "../interfaces/Clients";
import { fetchAll } from "../util/fetch-all";

export class NFTService {
  constructor(private readonly clients: Clients) {}

  async getNFT(tokenId: string) {
    return await this.clients.admin.getNFT(tokenId);
  }

  async getOwnedNFTs(ncwId: string, ncwAccountIds: string[]) {
    return await fetchAll((page) =>
      this.clients.admin.getOwnedNFTs({
        ncwAccountIds,
        ncwId,
        walletType: NFTOwnershipWalletType.END_USER_WALLET,
        ...page,
      }),
    );
  }

  async listOwnedCollections(ncwId: string) {
    return await fetchAll((page) =>
      this.clients.admin.listOwnedCollections({
        ncwId,
        walletType: NFTOwnershipWalletType.END_USER_WALLET,
        ...page,
      }),
    );
  }

  async listOwnedAssets(ncwId: string) {
    return await fetchAll((page) =>
      this.clients.admin.listOwnedAssets({
        ncwId,
        walletType: NFTOwnershipWalletType.END_USER_WALLET,
        ...page,
      }),
    );
  }
}
