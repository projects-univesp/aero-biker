import type { NextFunction, Request, Response } from "express";

type AsyncController = (req: Request, res: Response) => Promise<unknown>;

export const tryCatch =
  (controller: AsyncController) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await controller(request, response);
    } catch (err) {
      next(err);
    }
  };
