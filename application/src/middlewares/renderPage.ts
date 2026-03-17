import { Request, Response } from "express";

/**
 * Middleware para renderizar views estáticas sem precisar buscar dados na API.
 * Elimina a necessidade de escrever (req, res) => res.render(...) nas rotas.
 */

export const renderPage = (
  viewPath: string,
  defaultData: Record<string, any> = {},
) => {
  return (req: Request, res: Response) => {
    res.render(viewPath, defaultData);
  };
};
