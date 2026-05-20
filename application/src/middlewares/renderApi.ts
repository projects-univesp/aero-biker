import { Request, Response, NextFunction } from "express";
import { env } from "@utils/env";
import jwt from "jsonwebtoken";

export const renderApi = (
  apiPath: string | ((req: Request) => string),
  viewPath: string,
  dataKey: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resolvedPath =
        typeof apiPath === "function" ? apiPath(req) : apiPath;
      const url = `http://localhost:${env.PORT}${resolvedPath}`;

      const internalToken = jwt.sign(
        { id: "ssr-internal", name: "ssr", password: "" },
        env.JWT_SECRET as string,
        { expiresIn: 10 },
      );

      const apiResponse = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${internalToken}`,
        },
      });

      if (!apiResponse.ok) {
        throw new Error(
          `Erro na API (${apiResponse.status}) ao buscar ${apiPath}`,
        );
      }

      const result = await apiResponse.json();

      return res.render(viewPath, { [dataKey]: result.data });
    } catch (error) {
      console.error(
        `[Render Error] Falha ao carregar a view '${viewPath}':`,
        error,
      );

      return res.render("error", {
        message:
          "Não foi possível carregar as informações no momento. Tente novamente mais tarde.",
      });
    }
  };
};
