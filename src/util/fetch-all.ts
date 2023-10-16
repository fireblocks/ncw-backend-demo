import { Web3PagedResponse } from "fireblocks-sdk";

interface IPage {
  pageCursor?: string;
  pageSize?: number;
}

type TFetcher<T> = (page: IPage) => Promise<Web3PagedResponse<T>>;

export async function* fetchPaged<T>(fetcher: TFetcher<T>) {
  let cursor;
  do {
    const page = await fetcher({ pageCursor: cursor });
    if (page?.data) {
      yield* page.data;
    }
    cursor = page?.paging?.next;
  } while (cursor);
}

export async function fetchAll<T>(fetcher: TFetcher<T>): Promise<Array<T>> {
  const arr = [];
  for await (const assets of fetchPaged(fetcher)) {
    arr.push(assets);
  }
  return arr;
}
