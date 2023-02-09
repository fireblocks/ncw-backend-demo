import { ITransactionDetails } from "../interfaces/transaction";
import { CryptoClient } from "coinmarketcap-js";
import { getUsdRateForAsset } from "./getUsdRate";

export async function patchTransactionAmountUsd(
  data: ITransactionDetails,
  cmc: CryptoClient,
) {
  // for testing purposes
  if (!data.amountUSD && data.amount) {
    const rate = await getUsdRateForAsset(data.assetId, cmc);
    if (rate) {
      data.amountUSD = rate * data.amount;
    }
  }
}
