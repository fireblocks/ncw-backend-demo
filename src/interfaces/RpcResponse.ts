export type RpcResponse =
  | {
      response: unknown;
    }
  | {
      error: {
        message: string;
        code?: number;
      };
    };
