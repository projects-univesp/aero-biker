import { NextFunction, Request, Response } from "express";

export const tryCatch =
  (controller: any) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await controller(request, response);
    } catch (err: any) {
      next(err);
    }
  };