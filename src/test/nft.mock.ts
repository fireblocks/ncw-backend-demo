import {
  CollectionOwnership,
  NFTOwnershipStatus,
  Token,
  TokenWithBalance,
} from "fireblocks-sdk";

const ownedNftsMock: TokenWithBalance[] = [
  {
    id: "NFT-88e2f5679b8a4d8c04ef5353beb08856bb323a4a",
    tokenId: "33402",
    standard: "ERC721",
    blockchainDescriptor: "ETH_TEST3",
    media: [],
    collection: {
      id: "0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043",
      name: "Goerli_NFTS",
      symbol: "G_NFTS",
    },
    balance: "1",
    ownershipStartTime: 1709475840,
    ownershipLastUpdateTime: 1709475840,
    ncwId: "b53d5f62-b722-46d6-85f7-db6c3f37db53",
    ncwAccountId: 0,
    status: NFTOwnershipStatus.LISTED,
  },
  {
    id: "NFT-c950363ce0f4dcc763e78be5f50b427cd2429185",
    tokenId: "33403",
    standard: "ERC721",
    blockchainDescriptor: "ETH_TEST3",
    media: [],
    collection: {
      id: "0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043",
      name: "Goerli_NFTS",
      symbol: "G_NFTS",
    },
    balance: "1",
    ownershipStartTime: 1709475864,
    ownershipLastUpdateTime: 1709475864,
    ncwId: "b53d5f62-b722-46d6-85f7-db6c3f37db53",
    ncwAccountId: 0,
    status: NFTOwnershipStatus.LISTED,
  },
];

const ownedCollectionsMock: CollectionOwnership[] = [
  {
    id: "ba8ac39cd31913fbed230fff485a090211743c0c",
    name: "Goerli_NFTS",
    symbol: "G_NFTS",
    standard: "ERC721",
    blockchainDescriptor: "ETH_TEST3",
    contractAddress: "0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043",
  },
];

const ownedAssetsMock: Token[] = [
  {
    id: "NFT-88e2f5679b8a4d8c04ef5353beb08856bb323a4a",
    tokenId: "33402",
    standard: "ERC721",
    blockchainDescriptor: "ETH_TEST3",
    media: [],
    collection: {
      id: "0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043",
      name: "Goerli_NFTS",
      symbol: "G_NFTS",
    },
  },
  {
    id: "NFT-c950363ce0f4dcc763e78be5f50b427cd2429185",
    tokenId: "33403",
    standard: "ERC721",
    blockchainDescriptor: "ETH_TEST3",
    media: [],
    collection: {
      id: "0x932Ca55B9Ef0b3094E8Fa82435b3b4c50d713043",
      name: "Goerli_NFTS",
      symbol: "G_NFTS",
    },
  },
];

export { ownedNftsMock, ownedCollectionsMock, ownedAssetsMock };
