let tokenInMemory: string | null = null;

export const setTokenInMemory = (token: string | null) => {
  tokenInMemory = token;
};

export const getTokenInMemory = (): string | null => {
  return tokenInMemory;
};
