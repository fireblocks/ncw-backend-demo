import { ITransactionDetails } from "../interfaces/transaction";
import { CryptoClient } from "coinmarketcap-js";
import { getUsdRateForAsset } from "./getUsdRate";

export async function patchTransactionAmountUsd(
  data: ITransactionDetails,
  cmc: CryptoClient,
) {
  // transactions of testnet assets don't have USD rates, so we patch the amount with real asset USD rates for mock
  if (!data.amountUSD && data.amount) {
    const rate = await getUsdRateForAsset(data.assetId, cmc);
    if (rate) {
      data.amountUSD = rate * data.amount;
    }
  }
}
