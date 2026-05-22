import type { NextFunction, Request, Response } from "express";
import { env } from "@utils/env";

type RenderApiOptions = {
  emptyMessage?: string;
  category?: string;
  viewData?: Record<string, unknown>;
};

export const renderApi = (
  apiPath: string | ((req: Request) => string),
  viewPath: string,
  dataKey: string,
  options?: RenderApiOptions,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resolvedPath =
        typeof apiPath === "function" ? apiPath(req) : apiPath;

      const url = `http://localhost:${env.PORT}${resolvedPath}`;

      const apiResponse = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.cookie ?? "",
        },
      });

      if (!apiResponse.ok) {
        const err = new Error(
          `Erro na API (${apiResponse.status}) ao buscar ${resolvedPath}`,
        );
        (err as Error & { statusCode: number }).statusCode = apiResponse.status;
        throw err;
      }

      const result = await apiResponse.json();
      const data = result.data ?? [];

      const isEmpty = Array.isArray(data) ? data.length === 0 : !data;

      return res.render(viewPath, {
        [dataKey]: data,
        isEmpty,
        emptyMessage: options?.emptyMessage ?? "Nenhum dado encontrado.",
        category: options?.category ?? "Nenhuma categoria encontrada.",
        ...(options?.viewData ?? {}),
      });
    } catch (error) {
      return next(error);
    }
  };
};
