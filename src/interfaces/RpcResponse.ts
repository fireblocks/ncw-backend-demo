export type RpcResponse =
  | {
      result: string;
    }
  | {
      error: {
        message: string;
        code?: number;
      };
    };
