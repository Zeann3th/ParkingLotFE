export interface MemoryStorage {
  setToken(token: string): void;
  getToken(): string | null;
  hasToken(): boolean;
  clearToken(): void;
}

export const createMemoryStorage = (): MemoryStorage => {
  let token: string | null = null;

  return {
    setToken(newToken: string): void {
      token = newToken;
    },
    getToken(): string | null {
      return token;
    },
    hasToken(): boolean {
      return token !== null;
    },
    clearToken(): void {
      token = null;
    },
  };
}

export const memoryStorage = createMemoryStorage();
