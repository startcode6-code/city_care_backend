declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        sessionVersion: number;
      };
    }
  }
}

export {};