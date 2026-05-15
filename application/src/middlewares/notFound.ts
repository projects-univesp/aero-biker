import type { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    statusCode: 404,
    error: 'Not Found',
    message: `The route ${req.method} ${req.originalUrl} doesn't exists.`,
  });
};