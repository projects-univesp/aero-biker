import { Request, Response, NextFunction } from "express";
import { env } from "@utils/env";

type RenderApiOptions = {
  emptyMessage?: string;
  category?: string;
  viewData?: Record<string, any>;
};

export const renderApi = (
  apiPaths: string | string[] | ((req: Request) => string | string[]),
  viewPath: string,
  dataKeys: string | string[],
  options?: RenderApiOptions,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Resolve se as rotas passadas são uma função ou os dados diretos
      const resolvedPaths = typeof apiPaths === "function" ? apiPaths(req) : apiPaths;
      
      // 2. Transforma em array para podermos trabalhar padronizado
      const pathsArray = Array.isArray(resolvedPaths) ? resolvedPaths : [resolvedPaths];
      const keysArray = Array.isArray(dataKeys) ? dataKeys : [dataKeys];

      // Garante que o número de requisições bata com as chaves injetadas na view
      if (pathsArray.length !== keysArray.length) {
        throw new Error(
          `[Render API] O número de rotas (${pathsArray.length}) é diferente do número de chaves de dados (${keysArray.length}).`
        );
      }

      // 3. Faz todas as requisições à API ao mesmo tempo (Paralelo)
      const fetchPromises = pathsArray.map(async (path) => {
        const url = `http://localhost:${env.PORT}${path}`;
        const apiResponse = await fetch(url, {
          method: req.method,
          headers: {
            "Content-Type": "application/json",
            ...(req.headers as any),
          },
        });

        if (!apiResponse.ok) {
          throw new Error(`Erro na API (${apiResponse.status}) ao buscar ${path}`);
        }

        const result = await apiResponse.json();
        return result.data ?? [];
      });

      // Aguarda todas as requisições terminarem
      const results = await Promise.all(fetchPromises);

      // 4. Monta os dados mesclando as respostas com as respectivas chaves (dataKeys)
      const renderData: Record<string, any> = {};
      let primaryIsEmpty = false;

      results.forEach((data, index) => {
        const key = keysArray[index];
        renderData[key] = data;

        // O isEmpty e a listagem principal na tela devem ser sempre baseados no 1º item do array (Ex: students)
        if (index === 0) {
          primaryIsEmpty = Array.isArray(data) ? data.length === 0 : !data;
        }
      });

      // 5. Renderiza a view com tudo injetado
      return res.render(viewPath, {
        ...renderData, // Despeja { students: [...], groups: [...] } 
        isEmpty: primaryIsEmpty,
        emptyMessage: options?.emptyMessage ?? "Nenhum dado encontrado.",
        category: options?.category ?? "Nenhuma categoria encontrada.",
        ...(options?.viewData ?? {}),
      });

    } catch (error) {
      console.error(`[Render Error] Falha ao carregar a view '${viewPath}':`, error);

      return res.status(500).render("error", {
        message: "Não foi possível carregar as informações no momento. Tente novamente mais tarde.",
      });
    }
  };
};