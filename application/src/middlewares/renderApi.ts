import { Request, Response, NextFunction } from "express";
import { env } from "@utils/env";

type RenderApiOptions = {
  emptyMessage?: string;
  category?: string;
  viewData?: Record<string, any>;
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
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          ...(req.headers as any),
        },
      });

      if (!apiResponse.ok) {
        throw new Error(
          `Erro na API (${apiResponse.status}) ao buscar ${resolvedPath}`,
        );
      }

      const result = await apiResponse.json();

      const data = result.data ?? [];

      const isEmpty = Array.isArray(data)
        ? data.length === 0
        : !data;

      return res.render(viewPath, {
        [dataKey]: data,
        isEmpty,
        emptyMessage:
          options?.emptyMessage ?? "Nenhum dado encontrado.",
        category: 
          options?.category ?? "Nenhuma categoria encontrada.",
        ...(options?.viewData ?? {}),
      });
    } catch (error) {
      console.error(
        `[Render Error] Falha ao carregar a view '${viewPath}':`,
        error,
      );

      return res.status(500).render("error", {
        message:
          "Não foi possível carregar as informações no momento. Tente novamente mais tarde.",
      });
    }
  };
};