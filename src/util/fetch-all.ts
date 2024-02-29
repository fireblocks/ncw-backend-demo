import { Web3PagedResponse } from "fireblocks-sdk";

interface IPage {
  pageCursor?: string;
  pageSize?: number;
}

type TFetcher<T> = (page: IPage) => Promise<Web3PagedResponse<T>>;

export async function* fetchPaged<T>(fetcher: TFetcher<T>, pageSize?: number) {
  let cursor;
  do {
    const page = await fetcher({ pageCursor: cursor, pageSize });
    if (page?.data) {
      yield* page.data;
    }
    cursor = page?.paging?.next;
  } while (cursor);
}

export async function fetchAll<T>(
  fetcher: TFetcher<T>,
  pageSize?: number,
): Promise<Array<T>> {
  const arr = [];
  for await (const assets of fetchPaged(fetcher, pageSize)) {
    arr.push(assets);
  }
  return arr;
}
