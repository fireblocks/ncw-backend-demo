import {
  AmlScreeningResult,
  AmountInfo,
  AuthorizationInfo,
  BlockInfo,
  FeeInfo,
  ISystemMessageInfo,
  TransactionOperation,
  TransactionStatus,
  TransferPeerPathResponse,
} from "fireblocks-sdk";

export declare enum RemoteType {
  exchange = "EXCHANGE",
  unmanagedWallet = "UNMANAGED_WALLET",
  vaultAccount = "VAULT_ACCOUNT",
  unknown = "UNKNOWN",
  staking = "STAKING",
  networkConnection = "NETWORK_CONNECTION",
  fiat = "FIAT_ACCOUNT",
  none = "NONE",
  compound = "COMPOUND",
  gasStation = "GAS_STATION",
  oneTimeAddress = "ONE_TIME_ADDRESS",
  oecPartner = "OEC_PARTNER",
}

export enum NetworkStatus {
  DROPPED = "DROPPED", // - Transaction that were dropped by the blockchain (for example wasn't accepted due to low fee)
  BROADCASTING = "BROADCASTING", // - Broadcasting to the blockchain
  CONFIRMING = "CONFIRMING", // - Pending confirmations
  FAILED = "FAILED", // - The transaction has failed at the blockchain
  CONFIRMED = "CONFIRMED", // - Confirmed on the blockchain
}

export enum TransactionSubStatus {
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS", //  Not enough funds to fulfill the withdraw request
  AMOUNT_TOO_SMALL = "AMOUNT_TOO_SMALL", //  Attempt to withdraw an amount below the allowed minimum
  UNSUPPORTED_ASSET = "UNSUPPORTED_ASSET", //  Asset is not supported
  UNAUTHORISED__MISSING_PERMISSION = "UNAUTHORISED__MISSING_PERMISSION", //  Third party (e.g. exchange) API missing permission
  INVALID_SIGNATURE = "INVALID_SIGNATURE", //  Invalid transaction signature
  API_INVALID_SIGNATURE = "API_INVALID_SIGNATURE", //  Third party (e.g. exchange) API call invalid signature
  UNAUTHORISED__MISSING_CREDENTIALS = "UNAUTHORISED__MISSING_CREDENTIALS", //  Missing third party (e.g. exchange) credentials
  UNAUTHORISED__USER = "UNAUTHORISED__USER", //  Attempt to initiate or approve a transaction by an unauthorised user
  UNAUTHORISED__DEVICE = "UNAUTHORISED__DEVICE", //  Unauthorised user's device
  INVALID_UNMANAGED_WALLET = "INVALID_UNMANAGED_WALLET", //  Unmanaged wallet is disabled or does not exist
  INVALID_EXCHANGE_ACCOUNT = "INVALID_EXCHANGE_ACCOUNT", //  Exchange account is disabled or does not exist
  INSUFFICIENT_FUNDS_FOR_FEE = "INSUFFICIENT_FUNDS_FOR_FEE", //  Not enough balance to fund the requested transaction
  INVALID_ADDRESS = "INVALID_ADDRESS", //  Unsupported address format
  WITHDRAW_LIMIT = "WITHDRAW_LIMIT", //  Transaction exceeds the exchange's withdraw limit
  API_CALL_LIMIT = "API_CALL_LIMIT", //  Exceeded third party (e.g. exchange) API call limit
  ADDRESS_NOT_WHITELISTED = "ADDRESS_NOT_WHITELISTED", //  Attempt to withdraw from an exchange to a non-whitelisted address
  TIMEOUT = "TIMEOUT", //  The transaction request has timed out
  CONNECTIVITY_ERROR = "CONNECTIVITY_ERROR", //  Network error
  THIRD_PARTY_INTERNAL_ERROR = "THIRD_PARTY_INTERNAL_ERROR", //  Received an internal error response from a third party service
  CANCELLED_EXTERNALLY = "CANCELLED_EXTERNALLY", //  Transaction was canceled by a third party service
  INVALID_THIRD_PARTY_RESPONSE = "INVALID_THIRD_PARTY_RESPONSE", //  Unrecognized third party response
  VAULT_WALLET_NOT_READY = "VAULT_WALLET_NOT_READY", //  Vault wallet is not ready
  MISSING_DEPOSIT_ADDRESS = "MISSING_DEPOSIT_ADDRESS", //  Could not retrieve a deposit address from the exchange
  ONE_TIME_ADDRESS_DISABLED = "ONE_TIME_ADDRESS_DISABLED", //  Transferring to non-whitelisted addresses is disabled in your workspace.
  INTERNAL_ERROR = "INTERNAL_ERROR", //  Internal error while processing the transaction
  UNKNOWN_ERROR = "UNKNOWN_ERROR", //  Unexpected error
  AUTHORIZER_NOT_FOUND = "AUTHORIZER_NOT_FOUND", //  No authorizer found to approve the operation or the only authorizer found is the initiator
  INSUFFICIENT_RESERVED_FUNDING = "INSUFFICIENT_RESERVED_FUNDING", //  Some assets require a minimum of reserved funds being kept on the account
  MANUAL_DEPOSIT_ADDRESS_REQUIRED = "MANUAL_DEPOSIT_ADDRESS_REQUIRED", //  Error while retrieving a deposit address from an exchange. Please generate a deposit address for your exchange account
  INVALID_FEE = "INVALID_FEE", //  Transaction fee is not in the allowed range
  ERROR_UNSUPPORTED_TRANSACTION_TYPE = "ERROR_UNSUPPORTED_TRANSACTION_TYPE", //  Attempt to execute an unsupported transaction Type
  UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION", //  Unsupported operation
  THIRD_PARTY_PROCESSING = "3RD_PARTY_PROCESSING", //  The transaction is pending approval by the 3rd party service (e.g. exchange)
  PENDING_BLOCKCHAIN_CONFIRMATIONS = "PENDING_BLOCKCHAIN_CONFIRMATIONS", //  Pending Blockchain confirmations
  THIRD_PARTY_CONFIRMING = "3RD_PARTY_CONFIRMING", //  Pending confirmation on the exchange
  CONFIRMED = "CONFIRMED", //  Confirmed on the blockchain
  THIRD_PARTY_COMPLETED = "3RD_PARTY_COMPLETED", //  Completed on the 3rd party service (e.g. exchange)
  REJECTED_BY_USER = "REJECTED_BY_USER", //  The transaction was rejected by one of the signers
  CANCELLED_BY_USER = "CANCELLED_BY_USER", //  The transaction was canceled via the Console or the API
  THIRD_PARTY_CANCELLED = "3RD_PARTY_CANCELLED", //  Cancelled on the exchange
  THIRD_PARTY_REJECTED = "3RD_PARTY_REJECTED", //  Rejected or not approved in time by user
  REJECTED_AML_SCREENING = "REJECTED_AML_SCREENING", //  Rejected on AML Screening
  BLOCKED_BY_POLICY = "BLOCKED_BY_POLICY", //  Transaction is blocked due to a policy rule
  FAILED_AML_SCREENING = "FAILED_AML_SCREENING", //  AML screening failed
  PARTIALLY_FAILED = "PARTIALLY_FAILED", //  Only for Aggregated transactions. One or more of the associated transaction records failed
  THIRD_PARTY_FAILED = "3RD_PARTY_FAILED", //  Transaction failed at the exchange
  DROPPED_BY_BLOCKCHAIN = "DROPPED_BY_BLOCKCHAIN", //  The transaction was replaced by another transaction with higher fee
  REJECTED_BY_BLOCKCHAIN = "REJECTED_BY_BLOCKCHAIN", //  Transaction was rejected by the Blockchain due to too low fees, bad inputs or bad nonce
  INVALID_FEE_PARAMS = "INVALID_FEE_PARAMS", //  Fee parameters are inconsistent or unknown.
  MISSING_TAG_OR_MEMO = "MISSING_TAG_OR_MEMO", //  A tag or memo is required to send funds to a third party address, including all exchanges.
  SIGNING_ERROR = "SIGNING_ERROR", //  The transaction signing failed, resubmit the transaction to sign again.
  GAS_LIMIT_TOO_LOW = "GAS_LIMIT_TOO_LOW", //  The transaction was rejected because the gas limit was set too low
  TOO_MANY_INPUTS = "TOO_MANY_INPUTS", //  The transaction includes more inputs than the allowed limit (only for UTXO based blockchains)
  MAX_FEE_EXCEEDED = "MAX_FEE_EXCEEDED", //  Gas price is currently above selected max fee
  ACTUAL_FEE_TOO_HIGH = "ACTUAL_FEE_TOO_HIGH", //  Chosen fee is below current price
  INVALID_CONTRACT_CALL_DATA = "INVALID_CONTRACT_CALL_DATA", //  Transaction data was not encoded properly
  INVALID_NONCE_TOO_LOW = "INVALID_NONCE_TOO_LOW", //  Illegal nonce
  INVALID_NONCE_TOO_HIGH = "INVALID_NONCE_TOO_HIGH", //  Illegal nonce
  INVALID_NONCE_FOR_RBF = "INVALID_NONCE_FOR_RBF", //  No matching nonce
  FAIL_ON_LOW_FEE = "FAIL_ON_LOW_FEE", //  Current blockchain fee is higher than selected
  TOO_LONG_MEMPOOL_CHAIN = "TOO_LONG_MEMPOOL_CHAIN", //  Too many unconfirmed transactions from this address
  TX_OUTDATED = "TX_OUTDATED", //  Nonce already used
  INCOMPLETE_USER_SETUP = "INCOMPLETE_USER_SETUP", //  MPC setup was not completed
  SIGNER_NOT_FOUND = "SIGNER_NOT_FOUND", //  Signer not found
  INVALID_TAG_OR_MEMO = "INVALID_TAG_OR_MEMO", //  Invalid Tag or Memo
  ZERO_BALANCE_IN_PERMANENT_ADDRESS = "ZERO_BALANCE_IN_PERMANENT_ADDRESS", //  Not enough BTC on legacy permanent address
  NEED_MORE_TO_CREATE_DESTINATION = "NEED_MORE_TO_CREATE_DESTINATION", //  Insufficient funds for creating destination account
  NON_EXISTING_ACCOUNT_NAME = "NON_EXISTING_ACCOUNT_NAME", //  Account does not exist
  ENV_UNSUPPORTED_ASSET = "ENV_UNSUPPORTED_ASSET", //  Asset is not supported under this workspace settings
}

export interface ISourceDest {
  id?: string;
  name?: string;
  type?: string;
  subType?: string;
  address?: string;
  virtualId?: string;
  virtualType?: string;
}

export interface NetworkRecord {
  source: TransferPeerPathResponse; //	Source of the transaction.
  destination: TransferPeerPathResponse; //	Destination of the transaction.
  txHash: string; //	Blockchain hash of the transaction.
  networkFee: number; //	The fee paid to the network.
  assetId: string; //	Transaction asset.
  netAmount: number; //	The net amount of the transaction, after fee deduction.
  status: NetworkStatus; //	Status of the blockchain transaction.
  type: string; //	Type of the blockchain network operation.
  destinationAddress: string; //Destination address.
  sourceAddress: string; //	For account based assets only, the source address of the transaction.
}

export interface DestinationsResponse {
  amount: string; //	The amount to be sent to this destination.
  destination: TransferPeerPathResponse; //	Destination of the transaction.
  amountUSD: number; //	The USD value of the requested amount.
  destinationAddress: string; //	Address where the asset were transferred.
  destinationAddressDescription: string; //	Description of the address.
  amlScreeningResult: AmlScreeningResult; //	The result of the AML screening.
  customerRefId: string; // The ID for AML providers to associate the owner of funds with transactions.
}

export interface RewardsInfo {
  srcRewards: string; //	The ALGO rewards acknowledged by the source account of the transaction.
  destRewards: string; //	The ALGO rewards acknowledged by the destination account of the transaction.
}

export interface SignedMessage {
  content: string; //	The message for signing (hex-formatted).
  algorithm: string; //	The algorithm that was used for signing, one of the SigningAlgorithms.
  derivationPath: number[]; //	BIP32 derivation path of the signing key. E.g. [44,0,46,0,0].
  signature: object; //	The message signature.
  publicKey: string; //	Signature's public key that can be used for verification.
}

export interface ITransactionDetails {
  id: string; //	ID of the transaction.
  assetId: string; //	Transaction asset.
  source: TransferPeerPathResponse; //	Source of the transaction.
  destination: TransferPeerPathResponse; //	Fireblocks supports multiple destinations for UTXO-based blockchains. For other blockchains, this array will always be composed of one element.
  requestedAmount: number; //	The amount requested by the user.
  amountInfo: AmountInfo; //	Details of the transaction's amount in string format.
  feeInfo: FeeInfo; //	Details of the transaction's fee in string format.
  amount: number; //	If the transfer is a withdrawal from an exchange, the actual amount that was requested to be transferred. Otherwise, the requested amount.
  netAmount: number; //	The net amount of the transaction, after fee deduction.
  amountUSD: number; //	The USD value of the requested amount.
  serviceFee: number; //	The total fee deducted by the exchange from the actual requested amount (serviceFee = amount - netAmount).
  treatAsGrossAmount: boolean; //	For outgoing transactions, if true, the network fee is deducted from the requested amount.
  networkFee: number; //	The fee paid to the network.
  createdAt: number; //	Unix timestamp.
  lastUpdated: number; //	Unix timestamp.
  status: TransactionStatus; //		The current status of the transaction.
  txHash: string; //	Blockchain hash of the transaction.
  index: number; //[optional] For UTXO based assets this is the vOut, for Ethereum based, this is the index of the event of the contract call.
  subStatus: TransactionSubStatus; //		More detailed status of the transaction.
  sourceAddress: string; //For account based assets only, the source address of the transaction. (Note: This parameter will be empty for transactions that are not: CONFIRMING, COMPLETED, or REJECTED/FAILED after passing CONFIRMING status.)
  destinationAddress: string; //Address where the asset were transferred.
  destinationAddressDescription: string; //Description of the address.
  destinationTag: string; //Destination tag for XRP, used as memo for EOS/XLM, or Bank Transfer Description for the fiat providers: Signet (by Signature), SEN (by Silvergate), or BLINC (by BCB Group).
  signedBy: string[]; // Signers of the transaction.
  createdBy: string; //Initiator of the transaction.
  rejectedBy: string; //User ID of the user that rejected the transaction (in case it was rejected).
  addressType: string; //[ ONE_TIME, WHITELISTED ].
  note: string; //Custom note of the transaction.
  exchangeTxId: string; //If the transaction originated from an exchange, this is the exchange tx ID.
  feeCurrency: string; //The asset which was taken to pay the fee (ETH for ERC-20 tokens, BTC for Tether Omni).
  operation: TransactionOperation; //	Default operation is "TRANSFER".
  amlScreeningResult: AmlScreeningResult; //		The result of the AML screening.
  customerRefId: string; //The ID for AML providers to associate the owner of funds with transactions.
  numOfConfirmations: number; //The number of confirmations of the transaction. The number will increase until the transaction will be considered completed according to the confirmation policy.
  networkRecords: NetworkRecord[]; // Transaction on the Fireblocks platform can aggregate several blockchain transactions, in such a case these records specify all the transactions that took place on the blockchain.
  replacedTxHash: string; //In case of an RBF transaction, the hash of the dropped transaction.
  externalTxId: string; //Unique transaction ID provided by the user.
  destinations: DestinationsResponse[]; //	For UTXO based assets, all outputs specified here.
  blockInfo: BlockInfo; //		The information of the block that this transaction was mined in, the blocks's hash and height.
  rewardsInfo: RewardsInfo; //	This field is relevant only for ALGO transactions.Both srcRewrds and destRewards will appear only for Vault to Vault transactions, otherwise you will receive only the Fireblocks' side of the transaction.
  authorizationInfo: AuthorizationInfo; //	The information about your Transaction Authorization Policy(TAP).For more information about the TAP, refer to this section in the Help Center.
  signedMessages: SignedMessage[]; //	A list of signed messages returned for raw signing.
  extraParameters: any; // JSON object	Protocol / operation specific parameters.
  systemMessages: ISystemMessageInfo[]; // objects	A response from Fireblocks that communicates a message about the health of the process being performed. If this object is returned with data, you should expect potential delays or incomplete transaction statuses.
}

export interface ITransactionCreatedMessagePayload {
  tenantId: string;
  data: ITransactionDetails;
}

export interface ITransactionAuthorizationUpdateMessagePayload {
  tenantId: string;
  transaction: ITransactionDetails;
  timestamp: number;
}
