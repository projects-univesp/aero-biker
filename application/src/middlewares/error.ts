import { NextFunction, Request, Response } from "express";
import { responseFormat } from "@utils/responseFormat";
import { logger } from "@utils/logger";

declare global {
  interface Error {
    statusCode?: number;
  }
}

function extractZodMessage(error: any): string | null {
  // Duck-type ZodError: has an `issues` array with `message` strings
  if (Array.isArray(error?.issues) && error.issues.length > 0) {
    return error.issues[0].message as string;
  }
  return null;
}

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  const zodMessage = extractZodMessage(error);
  if (zodMessage) {
    response.status(400).json(
      responseFormat({ statusCode: 400, message: zodMessage, data: null }),
    );
    return;
  }

  const status = error.statusCode || 500;

  logger.error(`ERROR: ${error.statusCode} - ${error.message}`, error);

  if (error instanceof Error) {
    response.status(status).json(
      responseFormat({
        statusCode: status,
        message: error.message,
        data: null,
      }),
    );
    return;
  }

  response.status(500).json(
    responseFormat({
      message: error?.message || "Internal Server Error",
      statusCode: 500,
      data: null,
    }),
  );
};