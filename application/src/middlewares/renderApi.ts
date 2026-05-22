import type { NextFunction, Request, Response } from "express";
import { env } from "@utils/env";

type RenderApiOptions = {
  emptyMessage?: string;
  category?: string;
  viewData?: Record<string, unknown>;
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
      
      // 2. Transforma em array para padronizar
      const pathsArray = Array.isArray(resolvedPaths) ? resolvedPaths : [resolvedPaths];
      const keysArray = Array.isArray(dataKeys) ? dataKeys : [dataKeys];

      // Validação de integridade: número de rotas deve bater com número de chaves
      if (pathsArray.length !== keysArray.length) {
        throw new Error(
          `[Render API] Mismatch: O número de rotas (${pathsArray.length}) é diferente do número de chaves de dados (${keysArray.length}).`
        );
      }

      // Prepara headers seguros para comunicação interna (Server-to-Server)
      // NÃO espalhe todos os headers do req para evitar conflitos de Host/Encoding
      const internalHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Propaga cookies para manter sessão do usuário na API
      if (req.headers.cookie) {
        internalHeaders["Cookie"] = req.headers.cookie;
      }
      
      // Opcional: Propaga Authorization se sua API validar Bearer Token no header em vez de Cookie
      // if (req.headers.authorization) {
      //   internalHeaders["Authorization"] = req.headers.authorization;
      // }

      // 3. Faz todas as requisições à API ao mesmo tempo (Paralelo)
      const fetchPromises = pathsArray.map(async (path) => {
        // Garante que o path comece com / se necessário, ou usa como vindo
        const url = `http://localhost:${env.PORT}${path}`;
        
        const apiResponse = await fetch(url, {
          method: "GET", // Renderização de view deve ser idempotente (GET)
          headers: internalHeaders,
        });

        if (!apiResponse.ok) {
          // Cria um erro com status code para que o handler global possa usar se quiser
          const err = new Error(`Erro na API (${apiResponse.status}) ao buscar ${path}`);
          (err as any).statusCode = apiResponse.status;
          throw err;
        }

        const result = await apiResponse.json();
        // Assume que a API retorna { data: ... } ou similar. Ajuste conforme seu contrato de API.
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

        // O isEmpty e a listagem principal na tela devem ser sempre baseados no 1º item do array
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
      // Log detalhado para debugging no servidor
      console.error(`[Render Error] Falha ao carregar a view '${viewPath}':`, error);

      // Delega para o middleware de erro global do Express.
      // Isso é melhor que res.render("error") aqui porque:
      // 1. Mantém o controle de erro centralizado.
      // 2. Permite retornar JSON se for uma requisição AJAX inesperada.
      // 3. Permite que middlewares de monitoramento (Sentry/etc) capturem o erro corretamente.
      return next(error);
    }
  };
};