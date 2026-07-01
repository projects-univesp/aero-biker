
# Caminho: ./config/database.ts

```
import { env } from "@utils/env";
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  host: env.DB_HOST,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  dialect: "postgres",
  port: env.DB_PORT,
});

```

# Caminho: ./config/mail.ts

```
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { env } from "@utils/env";

export class MailClient {
  private readonly client: Mail;

  constructor() {
    this.client = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      requireTLS: true,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false
      },
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS,
      },
      logger: true,
      debug: true,
    });
  }

  async sendMail(to: string, subject: string, template: string) {
    await this.client.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html: template,
    });
  }
}
```

# Caminho: ./app.ts

```
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { appRouter } from "@routes/index";
import { env } from "@utils/env";
import { engine } from "express-handlebars";
import { errorHandler } from "@middlewares/error";
import path from "path";
import { logger } from "@utils/logger";
import { sequelize } from "@config/database";
import "@models/associations";
import { handlebarsHelpers, ifCond } from "@utils/handlebarsHelpers";
import { notFound } from "@middlewares/notFound";

const app = express();

// Helmet config
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         // Por padrão, só confia no próprio servidor
//         defaultSrc: ["'self'"],
        
//         // Permite os estilos gerados localmente e os injetados dinamicamente pelo Tailwind v4
//         styleSrc: ["'self'", "'unsafe-inline'"],
        
//         // Permite scripts do seu próprio servidor e os scripts oficiais vindos da CDN jsdelivr
//         scriptSrc: [
//           "'self'", 
//           "https://cdn.jsdelivr.net",
//           "'unsafe-eval'", 
//           "'unsafe-inline'"
//         ],
        
//         // Bloqueia qualquer tentativa de colocar o seu sistema dentro de um iframe (Proteção total anti-Clickjacking)
//         upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null, 
//         frameAncestors: ["'none'"], 
//       },
//     },
//     // Aplica a recomendação exata para ocultar dados de navegação ao sair do site
//     referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
//   })
// );

// Trust a single proxy (nginx/caddy). Must come BEFORE rate limiters so req.ip is correct.
app.set("trust proxy", 1);

// HandleBars Config
app.engine(
  ".hbs",
  engine({
    defaultLayout: "main",
    extname: ".hbs",
    partialsDir: path.join(process.cwd(), env.VIEWS_PATH, "partials"),
    helpers: {
      ...handlebarsHelpers,
      ifCond,
      roleLabel: (role: string) => {
        const labels: Record<string, string> = { OWNER: "Proprietário", ADMIN: "Administrador", USER: "Usuário" };
        return labels[role] ?? role;
      },
    },
  }),
);

app.set("view engine", ".hbs");
app.set("views", path.join(process.cwd(), env.VIEWS_PATH));
app.use(express.static(path.join(process.cwd(), "public")));

// Middlewares
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(appRouter);
app.use(errorHandler);
app.use(notFound);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection stablished successfully");

    await sequelize.sync({ alter: true });
    logger.info("Database synced successfully");

    app.listen(env.PORT, () => {
      logger.info(`Server running at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error("Fatal error unable to connect with database", error);
    process.exit(1);
  }
};

startServer();

```

# Caminho: ./middlewares/renderPage.ts

```
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

```

# Caminho: ./middlewares/tryCatch.ts

```
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

```

# Caminho: ./middlewares/requireAuth.ts

```
import type { IToken } from "@dtos/auth";
import { Admin } from "@models/admin";
import { COOKIE_NAME } from "@utils/cookies";
import { env } from "@utils/env";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

let _setupComplete: boolean | null = null;

export function resetSetupCache(): void {
  _setupComplete = null;
}

async function isSetupComplete(): Promise<boolean> {
  if (_setupComplete === true) return true;
  const count = await Admin.count();
  if (count > 0) _setupComplete = true;
  return count > 0;
}

function getSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.trim().substring(`${COOKIE_NAME}=`.length));
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupDone = await isSetupComplete();
    if (!setupDone) {
      res.redirect("/setup");
      return;
    }

    const token = getSessionToken(req);
    if (!token) {
      res.redirect("/login");
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET as string) as IToken;
      req.user = decoded;
      res.locals.currentUser = { id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role };
      next();
    } catch {
      res.clearCookie(COOKIE_NAME);
      res.redirect("/login");
    }
  } catch {
    res.redirect("/login");
  }
};

export const requireSetupIncomplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupDone = await isSetupComplete();
    if (setupDone) {
      res.redirect("/login");
      return;
    }
    next();
  } catch {
    next();
  }
};

export const requireSetupComplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupDone = await isSetupComplete();
    if (!setupDone) {
      res.redirect("/setup");
      return;
    }
    next();
  } catch {
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role ?? "")) {
      res.status(403).json({ statusCode: 403, message: "Acesso não autorizado" });
      return;
    }
    next();
  };
};

```

# Caminho: ./middlewares/rateLimit.ts

```
import { AppError } from "@utils/appError";
import type { NextFunction, Request, Response } from "express";

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function makeRateLimiter(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        statusCode: 429,
        message:
          "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
      });
      return;
    }

    entry.count++;
    next();
  };
}

// 5 attempts / 15 min — general auth endpoints (login, register, reset)
export const rateLimitAuth = makeRateLimiter(5, 15 * 60 * 1000);

// 3 attempts / 60 min — recovery endpoint (highest risk)
export const rateLimitRecovery = makeRateLimiter(3, 60 * 60 * 1000);

export const clearRateLimit = (req: Request) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  store.delete(`${ip}:${req.path}`);
};

```

# Caminho: ./middlewares/notFound.ts

```
import type { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    statusCode: 404,
    error: 'Not Found',
    message: `The route ${req.method} ${req.originalUrl} doesn't exists.`,
  });
};
```

# Caminho: ./middlewares/error.ts

```
import { NextFunction, Request, Response } from "express";
import { AppError } from "@utils/appError";
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
    response
      .status(400)
      .json({ statusCode: 400, message: zodMessage, data: null });
    return;
  }

  const status = error.statusCode || 500;

  logger.error(`ERROR: ${error.statusCode} - ${error.message}`, error);

  if (error instanceof Error) {
    response.status(status).json({
      statusCode: status,
      message: error.message,
      data: null,
    });
    return;
  }

  response.status(500).json({
    message: error?.message || "Internal Server Error",
    statusCode: 500,
    data: null,
  });
};

```

# Caminho: ./middlewares/renderApi.ts

```
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
```

# Caminho: ./middlewares/auth.ts

```
import { IToken } from "@dtos/auth";
import { env } from "@utils/env";
import { AppError } from "@utils/appError";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "@utils/cookies";

declare global {
  namespace Express {
    interface Request {
      user?: IToken;
    }
  }
}

function extractToken(request: Request): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
    if (match) {
      return decodeURIComponent(match.trim().substring(`${COOKIE_NAME}=`.length));
    }
  }

  return undefined;
}

export const auth = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const token = extractToken(request);

  if (!token) {
    response
      .status(401)
      .json({ message: "Token not provided", statusCode: 401 });
    return;
  }

  jwt.verify(token, env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      response
        .status(401)
        .json({ message: "Invalid token", statusCode: 401 });
      return;
    }
    request.user = decoded as IToken;
    next();
  });
};

```

# Caminho: ./utils/currency.ts

```
export const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
```

# Caminho: ./utils/appError.ts

```
// src/utils/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    
    Error.captureStackTrace(this, this.constructor);
  }
}
```

# Caminho: ./utils/logger.ts

```
import { Logger as TsLogger } from "tslog";
import { env } from "@utils/env";

const logType = env.NODE_ENV === "production" ? "json" : "pretty";

const tsLogInstance = new TsLogger({
  type: logType,
  parentNames: ["api"],
  name: "stack",
  hideLogPositionForProduction: true,
  prettyLogTemplate:
    "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}} {{logLevelName}} [{{filePathWithLine}}{{name}}]: ",
  prettyLogStyles: {
    logLevelName: {
      "*": ["bold", "black", "bgWhiteBright", "dim"],
      SILLY: ["bold", "white"],
      TRACE: ["bold", "whiteBright"],
      DEBUG: ["bold", "green"],
      INFO: ["bold", "blue"],
      WARN: ["bold", "yellow"],
      ERROR: ["bold", "red"],
      FATAL: ["bold", "redBright"],
    },
    dateIsoStr: "white",
    filePathWithLine: "white",
    name: ["white", "bold"],
    nameWithDelimiterPrefix: ["white", "bold"],
    nameWithDelimiterSuffix: ["white", "bold"],
    errorName: ["bold", "bgRedBright", "whiteBright"],
    fileName: ["yellow"],
  },
});

export const logger = {
  silly: tsLogInstance.silly.bind(tsLogInstance),
  trace: tsLogInstance.trace.bind(tsLogInstance),
  debug: tsLogInstance.debug.bind(tsLogInstance),
  info: tsLogInstance.info.bind(tsLogInstance),
  warn: tsLogInstance.warn.bind(tsLogInstance),
  fatal: tsLogInstance.fatal.bind(tsLogInstance),

  error: (message: string, error?: unknown) => {
    if (env.NODE_ENV === "production") {
      tsLogInstance.error(message, { err: error });
    } else {
      tsLogInstance.error(message, error);
    }
  },

  native: tsLogInstance,
};

```

# Caminho: ./utils/handlebarsHelpers.ts

```
import Handlebars from "handlebars";

export const handlebarsHelpers = {
  eq: (a: unknown, b: unknown) => a === b,

  toJSON: (obj: unknown) => JSON.stringify(obj ?? []),

  dayName: (day: number) => {
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return days[day] ?? String(day);
  },

  formatDateShort: (date: string | Date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  },

  formatCurrency: (value: number | string) => {
    if (value === null || value === undefined || value === "") {
      return "R$ 0,00";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  },

  substring: (str: string, start: number, end: number) => {
    if (!str) return "";
    return str.substring(start, end);
  },

  formatDate: () => {
    const date = new Date();
    const formmatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      weekday: "long",
      year: "numeric",
    });
    return formmatter.format(date);
  },
};

export const ifCond = function (
  this: any,
  v1: any,
  operator: string,
  v2: any,
  options: Handlebars.HelperOptions,
) {

  switch (operator) {
    case "===":
      return v1 === v2
        ? options.fn(this)
        : options.inverse(this);

    default:
      return options.inverse(this);
  }
};
```

# Caminho: ./utils/mappers/admin.ts

```
import { Admin } from "@models/admin";

export const AdminMapper = {
  toSafeObject: (admin: Admin) => {
    const plain = admin.get({ plain: true }) as Record<string, unknown>;
    const { password, ...rest } = plain;
    return rest;
  }
};
```

# Caminho: ./utils/env.ts

```
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().default(""),
  DB_HOST: z.string().default(""),
  DB_NAME: z.string().default(""),
  DB_USER: z.string().default(""),
  DB_PASSWORD: z.string().default(""),
  DB_PORT: z.coerce.number().default(5432),
  JWT_SECRET: z.string().default(""),
  JWT_EXPIRES_IN: z.coerce.number().default(604800),
  SALT_RESULT: z.coerce.number().default(10),
  CORS_ORIGIN: z.string().default("http://localhost:5500"),
  VIEWS_PATH: z.enum(["views", "src/views"]).default("src/views"),
  APP_URL: z.url().default("http://localhost:3333"),
  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),
  MAIL_FROM: z.string().default("Noreply <noreply@athena-devs.dev>"),
  MAIL_SECURE: z.string().transform((val) => val === 'true').default(false)
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variable", z.treeifyError(_env.error));
  throw new Error("❌ Invalid environment variables");
}

export const env = _env.data;

const isProd = env.NODE_ENV === "production";

if (!env.JWT_SECRET) {
  if (isProd) throw new Error("❌ JWT_SECRET must be set in production");
  console.warn("⚠️  JWT_SECRET is empty — using insecure default (dev only)");
}

```

# Caminho: ./utils/zod.ts

```
import { AdminDTO } from "@dtos/admin";
import { GroupDTO } from "@dtos/group";
import { PlanDTO, PLANS } from "@dtos/plan";
import { ScheduleDTO } from "@dtos/schedule";
import { StudentDTO } from "@dtos/student";
import { SubscriptionDTO } from "@dtos/subscription";
import { z } from "zod";

z.setErrorMap((issue) => {
  if (issue.code === "invalid_type" && issue.input === undefined) {
    return { message: "Este campo é obrigatório." };
  }
  if (issue.code === "invalid_format" && issue.format === "email") {
    return { message: "Digite um e-mail válido." };
  }
  if (issue.code === "too_small" && issue.origin === "string") {
    const min = Number(issue.minimum);
    return {
      message: `Deve conter pelo menos ${min} caractere${min !== 1 ? "s" : ""}.`,
    };
  }
  if (issue.code === "too_big" && issue.origin === "string") {
    const max = Number(issue.maximum);
    return {
      message: `Deve conter no máximo ${max} caractere${max !== 1 ? "s" : ""}.`,
    };
  }
  return null;
});

export class VerifyData {
  verifyStudent(student: StudentDTO) {
    return z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15),
        isActive: z.boolean(),
        enrollment: z.enum(["ACTIVE", "INACTIVE"]),
        groupId: z.uuidv4(),
      })
      .parse(student);
  }

  verifyStudentPartial(student: StudentDTO) {
    return z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15),
        isActive: z.boolean(),
        enrollment: z.enum(["ACTIVE", "INACTIVE"]),
        groupId: z.uuidv4(),
      })
      .partial()
      .parse(student);
  }

  verifyGroup(group: GroupDTO) {
    return z
      .object({
        name: z.string().min(3).max(50),
        maxCapacity: z.number().int().positive(),
        daysOfWeek: z.string().min(3).max(50),
        isActive: z.boolean(),
      })
      .parse(group);
  }

  verifyGroupPartial(group: GroupDTO) {
    return z
      .object({
        name: z.string().min(3).max(50),
        maxCapacity: z.number().int().positive(),
        daysOfWeek: z.string().min(3).max(50),
        isActive: z.boolean(),
      })
      .partial()
      .parse(group);
  }

  verifySchedule(schedule: ScheduleDTO) {
    return z
      .object({
        dayOfWeek: z.string().min(3).max(3),
        startTime: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid start time format (HH:MM)",
          ),
        endTime: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid end time format (HH:MM)",
          ),
        groupId: z.uuid(),
      })
      .parse(schedule);
  }

  verifySchedulePartial(schedule: Partial<ScheduleDTO>) {
    return z
      .object({
        dayOfWeek: z.string().min(3).max(3),
        startTime: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid start time format (HH:MM)",
          ),
        endTime: z
          .string()
          .regex(
            /^([01]\d|2[0-3]):([0-5]\d)$/,
            "Invalid end time format (HH:MM)",
          ),
        groupId: z.uuid(),
      })
      .partial()
      .parse(schedule);
  }

  verifyPlan(plan: PlanDTO) {
    return z
      .object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().positive(),
        durationMonths: z.enum(PLANS),
        isActive: z.boolean(),
      })
      .parse(plan);
  }

  verifyPlanPartial(plan: PlanDTO) {
    return z
      .object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().positive(),
        durationMonths: z.enum(PLANS),
        isActive: z.boolean(),
      })
      .partial()
      .parse(plan);
  }

  verifySubscription(subscription: SubscriptionDTO) {
    return z
      .object({
        studentId: z.uuid(),
        planId: z.uuid(),
        subscriptionValue: z.number().positive(),
        startDate: z.coerce.date(),
        renovationDate: z.coerce.date(),
        status: z.enum(["PAID", "PENDING", "CANCELLED"]),
        paymentMethod: z.string().min(1),
      })
      .parse(subscription);
  }

  verifySubscriptionPartial(subscription: SubscriptionDTO) {
    return z
      .object({
        studentId: z.uuid(),
        planId: z.uuid(),
        subscriptionValue: z.number().positive(),
        startDate: z.coerce.date(),
        renovationDate: z.coerce.date(),
        status: z.enum(["PAID", "PENDING", "CANCELLED"]),
        paymentMethod: z.string().min(1),
      })
      .partial()
      .parse(subscription);
  }

  verifyAdmin(admin: AdminDTO) {
    return z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15).optional(),
        email: z.email().max(100),
        password: z.string().min(6).max(72),
      })
      .parse(admin);
  }

  verifyAdminPartial(admin: AdminDTO) {
    return z
      .object({
        name: z.string().max(50),
        phone: z.string().min(10).max(15),
        email: z.email().max(100),
        password: z.string().min(6).max(72),
      })
      .partial()
      .parse(admin);
  }

  verifyId(id: string | string[]) {
    return z.object({ id: z.uuid() }).parse({ id });
  }

  verifyAuthRequest(user: { email: string; password: string }) {
    return z
      .object({
        email: z.email().max(100),
        password: z.string().min(1).max(72),
      })
      .parse(user);
  }

  verifyEmail(body: { email: string }) {
    return z.object({ email: z.email().max(100) }).parse(body);
  }

  verifySetup(data: {
    academyName: string;
    name: string;
    email: string;
    password: string;
  }) {
    return z
      .object({
        academyName: z.string().min(2).max(100),
        name: z.string().min(2).max(50),
        email: z.email().max(100),
        password: z.string().min(8).max(72),
      })
      .parse(data);
  }

  verifyResetPassword(data: { token: string; password: string }) {
    return z
      .object({
        token: z.string().length(64),
        password: z.string().min(8).max(72),
      })
      .parse(data);
  }

  verifyAcademy(data: {
    name?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
  }) {
    return z
      .object({
        name: z.string().min(2).max(100),
        cnpj: z.string().max(18).optional(),
        phone: z.string().min(10).max(25).optional(),
        address: z.string().max(200).optional(),
      })
      .partial()
      .parse(data);
  }

  verifyCreateAdmin(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    return z
      .object({
        name: z.string().min(2).max(50),
        email: z.email().max(100),
        password: z.string().min(8).max(72),
        role: z.enum(["ADMIN", "USER"]).default("USER"),
      })
      .parse(data);
  }

  verifyChangePassword(data: { currentPassword: string; newPassword: string }) {
    return z
      .object({
        currentPassword: z.string().min(1).max(72),
        newPassword: z.string().min(8).max(72),
      })
      .parse(data);
  }
}

```

# Caminho: ./utils/auth.ts

```
import { Admin } from "@models/admin";
import jwt from "jsonwebtoken";
import { env } from "./env";

export const signToken = (admin: Admin): string => {
  return jwt.sign(
    { sub: admin.id, id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" },
  );
}
```

# Caminho: ./utils/cookies.ts

```
import { env } from "./env";

export const COOKIE_NAME = "aero_session";

export const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    secure: isProduction,
    maxAge: env.JWT_EXPIRES_IN * 1000,
    path: "/",
  };
};

export const getBaseUrl = (): string => {
  return env.APP_URL;
};

```

# Caminho: ./utils/encrypt.ts

```
import bcrypt from "bcrypt";
import { env } from "@utils/env";

export async function generateHashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, env.SALT_RESULT);
  return hash;
}

export async function compareHashPasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

# Caminho: ./utils/mail.ts

```
export function template(safeName: string, safeUrl: string) {
  return `
  <!DOCTYPE html>
        <html lang="pt-BR">
        <body style="font-family: sans-serif; background: #f9f9f9; padding: 40px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111; margin-top: 0;">Redefinição de senha</h2>
            <p style="color: #374151;">Olá, <strong>${safeName}</strong>.</p>
            <p style="color: #374151;">Você solicitou a redefinição de sua senha no sistema <strong>AEROBIC BIKER</strong>.</p>
            <p style="color: #374151;">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
            <a href="${safeUrl}"
              style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #22c55e; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Redefinir senha
            </a>
            <p style="color: #6b7280; font-size: 13px;">Se você não solicitou isso, ignore este email. Sua senha não será alterada.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">AEROBIC BIKER — Sistema de Gestão</p>
          </div>
        </body>
        </html>`;
}

```

# Caminho: ./models/schedules.ts

```
import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Schedule extends Model {
  declare id: UUID;
  declare dayOfWeek: string;
  declare startTime: string;
  declare endTime: string;
  declare groupId: UUID;
}

Schedule.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    groupId: {
      type: DataTypes.UUID,
      references: {
        model: "Groups",
        key: "id",
      },
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Schedules",
  },
);

```

# Caminho: ./models/student.ts

```
import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";
import { Group } from "./group";

export class Student extends Model {
  declare id: UUID;
  declare name: string;
  declare phone: string;
  declare isActive: boolean;
  declare enrollment: string;
  declare groupId: UUID;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    enrollment: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    groupId: {
      type: DataTypes.UUID,
      references: {
        model: "Groups",
        key: "id",
      },
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Students",
  },
);

```

# Caminho: ./models/group.ts

```
import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Group extends Model {
  declare id: UUID;
  declare name: string;
  declare maxCapacity: number;
  declare daysOfWeek: string;
  declare isActive: boolean;
}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    daysOfWeek: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Groups",
  },
);
```

# Caminho: ./models/admin.ts

```
import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Admin extends Model {
  declare id: UUID;
  declare isActive: boolean;
  declare name: string;
  declare phone: string | null;
  declare email: string;
  declare password: string;
  declare role: "OWNER" | "ADMIN" | "USER";
}

Admin.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("OWNER", "ADMIN", "USER"),
      allowNull: false,
      defaultValue: "USER",
    },
  },
  {
    sequelize,
    tableName: "Admin",
  },
);

```

# Caminho: ./models/associations.ts

```
import { Admin } from "./admin";
import { Group } from "./group";
import { Plan } from "./plan";
import { Schedule } from "./schedules";
import { Student } from "./student";
import { Subscription } from "./subscription";
import { PasswordReset } from "./passwordReset";
import "./academy";

// Student <-> Group
Student.belongsTo(Group, { foreignKey: "groupId", as: "group" });
Group.hasMany(Student, { foreignKey: "groupId", as: "students" });

// Group <-> Schedule
Group.hasMany(Schedule, { foreignKey: "groupId", as: "schedules" });
Schedule.belongsTo(Group, { foreignKey: "groupId", as: "group" });

// Subscription <-> Student / Plan
Subscription.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Student.hasMany(Subscription, { foreignKey: "studentId", as: "subscriptions" });
Subscription.belongsTo(Plan, { foreignKey: "planId", as: "plan" });
Plan.hasMany(Subscription, { foreignKey: "planId", as: "subscriptions" });

// Admin <-> PasswordReset
Admin.hasMany(PasswordReset, { foreignKey: "adminId", as: "passwordResets" });
PasswordReset.belongsTo(Admin, { foreignKey: "adminId", as: "admin" });
```

# Caminho: ./models/systemConfig.ts

```
import { sequelize } from "@config/database";
import type { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class SystemConfig extends Model {
  declare id: UUID;
  declare masterPasswordHash: string;
  declare setupCompleted: boolean;
  declare createdBy: UUID | null;
}

SystemConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    masterPasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    setupCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "SystemConfig",
  },
);

```

# Caminho: ./models/academy.ts

```
import { sequelize } from "@config/database";
import type { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Academy extends Model {
  declare id: UUID;
  declare name: string;
  declare cnpj: string | null;
  declare phone: string | null;
  declare address: string | null;
}

Academy.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cnpj: {
      type: DataTypes.STRING(18),
      allowNull: true,
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "Academy",
  },
);

```

# Caminho: ./models/subscription.ts

```
import { sequelize } from "@config/database";
import { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class Subscription extends Model {
  declare id: UUID;
  declare studentId: UUID;
  declare planId: UUID;
  declare subscriptionValue: number;
  declare startDate: Date;
  declare renovationDate: Date;
  declare status: string;
  declare paymentMethod: string;
}

Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    planId: {
      type: DataTypes.UUID, 
      allowNull: false,
    },
    subscriptionValue: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    renovationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Subscriptions",
  }
);

```

# Caminho: ./models/passwordReset.ts

```
import { sequelize } from "@config/database";
import type { UUID } from "crypto";
import { DataTypes, Model } from "sequelize";

export class PasswordReset extends Model {
  declare id: UUID;
  declare tokenHash: string;
  declare adminId: UUID;
  declare expiresAt: Date;
  declare usedAt: Date | null;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "Admin", key: "id" },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "PasswordResets",
  },
);

```

# Caminho: ./models/plan.ts

```
import { DataTypes, Model } from "sequelize";
import { sequelize } from "@config/database";

export class Plan extends Model {
  declare id: string;
  declare name: string;
  declare description: string;
  declare price: number;
  declare durationMonths: string;
  declare isActive: boolean;
}

Plan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    durationMonths: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Plan",
    tableName: "plans",
    timestamps: true,
  }
);
```

# Caminho: ./dtos/student.ts

```
export interface StudentDTO {
  name: string;
  phone: string;
  isActive: boolean;
  enrollment: string;
  groupId: string;
}

```

# Caminho: ./dtos/schedule.ts

```
export interface ScheduleDTO {
  id: string;
  dayOfWeek: string; 
  startTime: string;
  endTime: string;  
  groupId: string;
}
```

# Caminho: ./dtos/group.ts

```
export interface GroupDTO {
  name: string;
  maxCapacity: number;
  daysOfWeek: string;
}
```

# Caminho: ./dtos/admin.ts

```
export interface AdminDTO {
  name: string;
  phone?: string;
  email: string;
  password: string;
  oldPassword?: string;
  role?: "OWNER" | "ADMIN" | "USER";
}

```

# Caminho: ./dtos/subscription.ts

```
export interface SubscriptionDTO {
  studentId: string;
  planId: string;
  subscriptionValue: number;
  startDate: Date;
  renovationDate: Date;
  status: string;
  paymentMethod: string;
}

```

# Caminho: ./dtos/plan.ts

```
export const PLANS = ["Mensal", "Trimestral", "Semestral", "Anual"] as const;

export type PlanDuration = typeof PLANS[number];

export interface PlanDTO {
  name: string;
  description: string;
  price: number;
  durationMonths: PlanDuration; 
  isActive: boolean;
}
```

# Caminho: ./dtos/auth.ts

```
import { JwtPayload } from "jsonwebtoken";

export interface IToken extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role?: string;
}
```

# Caminho: ./controllers/groupController.ts

```
import { GroupServices } from "@services/groupService";
import { AppError } from "@utils/appError";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class GroupController {
  private readonly verifyData: VerifyData;
  private readonly groupServices: GroupServices;

  constructor() {
    this.verifyData = new VerifyData();
    this.groupServices = new GroupServices();
  }

  createGroup = async (request: Request, response: Response) => {
    const parsedGroup = this.verifyData.verifyGroup(request.body);
    const group = await this.groupServices.create(parsedGroup);

    return response.status(201).send({
      message: "Group created succesfully",
      data: group,
    });
  };

  getGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await this.groupServices.get(id);

    return response.status(200).send({
      message: "Group found successfully",
      data: group,
    });
  };

  getAllGroups = async (request: Request, response: Response) => {
    const groups = await this.groupServices.getAll();

    return response.status(200).send({
      message: "Groups found successfully",
      statusCode: 200,
      data: groups,
    });
  };

  updateGroup = async (request: Request, response: Response) => {
    const parsedGroup = this.verifyData.verifyGroupPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await this.groupServices.update(id, parsedGroup);

    return response.status(200).send({
      message: "Group updated succesfully",
      data: group,
    });
  };

  deleteGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.groupServices.delete(id);

    return response.status(200).send("Group deactivated succesfully");
  };
}

```

# Caminho: ./controllers/adminController.ts

```
import { AdminServices } from "@services/adminServices";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class AdminController {
  private readonly verifyData: VerifyData;
  private readonly adminServices: AdminServices;

  constructor() {
    this.verifyData = new VerifyData();
    this.adminServices = new AdminServices();
  }

  getAdmin = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const admin = await this.adminServices.get(id);

    return response
      .status(200)
      .send({ message: "Admin found successfully", data: admin });
  };

  updateAdmin = async (request: Request, response: Response) => {
    const parsedAdmin = this.verifyData.verifyAdminPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const admin = await this.adminServices.update(id, parsedAdmin);

    return response
      .status(200)
      .send({ message: "Admin updated successfully", data: admin });
  };

  deleteAdmin = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const admin = await this.adminServices.delete(id);

    return response
      .status(200)
      .send({ message: "Admin deactivated successfully" });
  };
}

```

# Caminho: ./controllers/planController.ts

```
import { Request, Response } from "express";
import { PlanService } from "@services/planService";
import { VerifyData } from "@utils/zod";

export class PlanController {
  private readonly planService: PlanService;
  private readonly verifyData: VerifyData;

  constructor() {
    this.planService = new PlanService();
    this.verifyData = new VerifyData();
  }

  createPlan = async (request: Request, response: Response) => {
    const parsedPlan = this.verifyData.verifyPlan(request.body);
    const plan = await this.planService.create(parsedPlan);

    return response
      .status(201)
      .json({ message: "Plan created successfully", data: plan });
  };

  getPlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.get(id);

    return response
      .status(200)
      .json({ message: "Plan found successfully", data: plan });
  };

  getAllPlans = async (request: Request, response: Response) => {
    const plans = await this.planService.getAll();

    return response
      .status(200)
      .json({ message: "Plans found successfully", data: plans });
  };

  updatePlan = async (request: Request, response: Response) => {
    const parsedPlan = this.verifyData.verifyPlanPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const plan = await this.planService.update(id, parsedPlan);

    return response
      .status(200)
      .json({ message: "Plan updated successfully", data: plan});
  };

  deletePlan = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.planService.delete(id);

    return response
      .status(200)
      .json({ message: "Plan deactivated successfully" });
  };
}

```

# Caminho: ./controllers/scheduleController.ts

```
import { ScheduleService } from "@services/scheduleService";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class ScheduleController {
  private scheduleService = new ScheduleService();
  private verifyData = new VerifyData();

  createSchedule = async (request: Request, response: Response) => {
    const validSchedule = this.verifyData.verifySchedule(request.body);
    const parsedSchedule = await this.scheduleService.create(validSchedule);

    return response
      .status(201)
      .json({ message: "Schedule created successfully", data: parsedSchedule });
  };

  getAllSchedules = async (request: Request, response: Response) => {
    const parsedSchedule = await this.scheduleService.getAll();

    return response
      .status(200)
      .json({ message: "Schedules found successfully", data: parsedSchedule });
  };

  getSchedule = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const parsedSchedule = await this.scheduleService.get(id);

    return response
      .status(200)
      .json({ message: "Schedule found successfully", data: parsedSchedule });
  };

  updateSchedule = async (request: Request, response: Response) => {
    const validSchedule = this.verifyData.verifySchedulePartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const parsedSchedule = await this.scheduleService.update(id, validSchedule);

    return response
      .status(200)
      .json({ message: "Schedule updated successfully", data: parsedSchedule });
  };

  deleteSchedule = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const parsedSchedule = await this.scheduleService.delete(id);

    return response
      .status(200)
      .json({ message: "Schedule deactivated successfully" });
  };
}

```

# Caminho: ./controllers/authController.ts

```
import { clearRateLimit } from "@middlewares/rateLimit";
import { AuthServices } from "@services/authServices";
import { env } from "@utils/env";
import { VerifyData } from "@utils/zod";
import type { Request, Response } from "express";
import { COOKIE_NAME, getBaseUrl, getCookieOptions } from "@utils/cookies";

export class AuthController {
  private readonly data: VerifyData;
  private readonly authServices: AuthServices;

  constructor() {
    this.data = new VerifyData();
    this.authServices = new AuthServices();
  }

  setup = async (req: Request, res: Response) => {
    const parsed = this.data.verifySetup(req.body);
    const result = await this.authServices.setup(parsed);
    res.cookie(COOKIE_NAME, result.data.token, getCookieOptions());

    return res
      .status(201)
      .json({
        ...result,
        data: { message: "Sistema configurado com sucesso" },
      });
  };

  login = async (req: Request, res: Response) => {
    const credentials = this.data.verifyAuthRequest(req.body);
    const result = await this.authServices.login(credentials);
    clearRateLimit(req);
    res.cookie(COOKIE_NAME, result.data.token, getCookieOptions());

    return res
      .status(200)
      .json({ ...result, data: { admin: result.data.admin } });
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = this.data.verifyEmail(req.body);
    const result = await this.authServices.forgotPassword(email, getBaseUrl());

    return res
      .status(200)
      .json({
        message: "Se o email existir, você receberá um link de recuperação",
      });
  };

  resetPassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyResetPassword(req.body);
    const result = await this.authServices.resetPassword(
      parsed.token,
      parsed.password,
    );

    return res.status(200).json({ message: "Senha redefinida com sucesso" });
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    return res.redirect("/login");
  };
}

```

# Caminho: ./controllers/studentController.ts

```
import { StudentServices } from "@services/studentServices";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class StudentController {
  private readonly verifyData: VerifyData;
  private readonly studentServices: StudentServices;
  constructor() {
    this.verifyData = new VerifyData();
    this.studentServices = new StudentServices();
  }

  createStudent = async (request: Request, response: Response) => {
    const parsedStudent = this.verifyData.verifyStudent(request.body);
    const student = await this.studentServices.create(parsedStudent);

    return response.status(201).send({
      message: "Student created succesfully",
      data: student,
    });
  };

  getStudent = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.get(id);

    return response.status(200).send({
      message: "Student found successfully",
      data: student,
    });
  };

  getAllStudents = async (request: Request, response: Response) => {
    const students = await this.studentServices.getAll();

    return response.status(200).send({
      message: "Students found successfully",
      data: students,
    });
  };

  updateStudent = async (request: Request, response: Response) => {
    const parsedStudent = this.verifyData.verifyStudentPartial(request.body);
    const { id } = this.verifyData.verifyId(request.params.id);
    const student = await this.studentServices.update(id, parsedStudent);

    return response.status(200).send({
      message: "Student updated succesfully",
      data: student,
    });
  };

  deleteStudent = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.studentServices.delete(id);

    return response
      .status(200)
      .send({ message: "Student deactivated succesfully" });
  };
}

```

# Caminho: ./controllers/subscriptionController.ts

```
import { Request, Response } from "express";
import { SubscriptionService } from "@services/subscriptionService";
import { VerifyData } from "@utils/zod";

export class SubscriptionController {
  private readonly subscriptionService: SubscriptionService;
  private readonly verifyData: VerifyData;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.verifyData = new VerifyData();
  }

  createSubscription = async (request: Request, response: Response) => {
    const parsedSubscription = this.verifyData.verifySubscription(request.body);
    const subscription =
      await this.subscriptionService.create(parsedSubscription);

    return response.status(201).send({
      message: "Subscription created succesfully",
      data: subscription,
    });
  };

  getSubscription = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.get(id);

    return response.status(200).send({
      message: "Subscription found succesfully",
      data: subscription,
    });
  };

  getAllSubscriptions = async (request: Request, response: Response) => {
    const subscriptions = await this.subscriptionService.getAll();

    return response.status(200).send({
      message: "Subscriptions found succesfully",
      data: subscriptions,
    });
  };

  updateSubscription = async (request: Request, response: Response) => {
    const parsedSubscription = this.verifyData.verifySubscriptionPartial(
      request.body,
    );
    const { id } = this.verifyData.verifyId(request.params.id);
    const subscription = await this.subscriptionService.update(
      id,
      parsedSubscription,
    );

    return response.status(200).send({
      message: "Subscription updated succesfully",
      data: subscription,
    });
  };

  deleteSubscription = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    await this.subscriptionService.delete(id);

    return response.status(200).send({
      message: "Subscription deactivated succesfully",
    });
  };
}

```

# Caminho: ./controllers/configController.ts

```
import { ConfigService } from "@services/configService";
import { VerifyData } from "@utils/zod";
import type { Request, Response } from "express";

export class ConfigController {
  private readonly data: VerifyData;
  private readonly configService: ConfigService;

  constructor() {
    this.data = new VerifyData();
    this.configService = new ConfigService();
  }

  getAcademy = async (_req: Request, res: Response) => {
    const academy = await this.configService.getAcademy();

    return res.status(200).json({
      message: "Academia encontrada com sucesso",
      data: academy,
    });
  };

  updateAcademy = async (req: Request, res: Response) => {
    const parsed = this.data.verifyAcademy(req.body);
    const academy = await this.configService.updateAcademy(parsed);

    return res.status(200).json({
      message: "Academia atualizada com sucesso",
      data: academy,
    });
  };

  listAdmins = async (_req: Request, res: Response) => {
    const admins = await this.configService.listAdmins();

    return res.status(200).json({
      message: "Admins retrieved",
      data: admins,
    });
  };

  createAdmin = async (req: Request, res: Response) => {
    const parsed = this.data.verifyCreateAdmin(req.body);
    const admin = await this.configService.createAdmin(parsed);

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      data: admin,
    });
  };

  changePassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyChangePassword(req.body);

    const result = await this.configService.changePassword(
      req.user!.id,
      parsed.currentPassword,
      parsed.newPassword,
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Senha alterada com sucesso",
    });
  };

  deactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.deactivateAdmin(id, req.user!.id);

    return res.status(200).json({
      message: "Usuário desativado com sucesso",
    });
  };

  reactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.reactivateAdmin(id);

    return res.status(200).json({
      message: "Usuário reativado com sucesso",
    });
  };
}

```

# Caminho: ./controllers/dashboardController.ts

```
import { Request, Response } from "express";
import { DashboardService } from "@services/dashboardService";
import { AppError } from "@utils/appError";

export class DashboardController {
  private readonly dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboard = async (request: Request, response: Response) => {
    const dashboard = await this.dashboardService.getDashboard();

    return response
      .status(200)
      .send({ message: "Dashboard found successfully", data: dashboard });
  };
}

```

# Caminho: ./views/error.hbs

```
<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
  <section class="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
    <h1 class="text-2xl font-semibold text-gray-900">
      Ops, algo deu errado
    </h1>

    <p class="mt-3 text-sm text-gray-600">
      {{message}}
    </p>

    <a
      href="/"
      class="mt-6 inline-flex rounded-xl bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-600"
    >
      Voltar para o início
    </a>
  </section>
</div>
```

# Caminho: ./views/layouts/auth.hbs

```
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link rel="icon" type="image/png" href="/img/favicon/favicon.ico">
  <title>AEROBIC BIKER</title>
</head>
<body class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
  {{{body}}}
  <script type="module" src="/js/auth.js"></script>
</body>
</html>

```

# Caminho: ./views/layouts/main.hbs

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <link rel="icon" type="image/png" href="/img/favicon/favicon.ico">
  <title>AEROBIC BIKER</title>
</head>
<body class="h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased">
  <section class="flex flex-1 overflow-hidden">
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>
        {{> aside }}
        <section class="flex flex-col flex-1">
        {{> header }}
        <main class="flex-1 overflow-y-auto">
        {{{body}}}
        </main>
    </section>
  </section>

  <script type="module" src="/js/modal.js"></script>
  <script type="module" src="/js/handleData.js"></script>
  <script type="module" src="/js/config.js"></script>
</body>
</html>
```

# Caminho: ./views/pages/settings/index.hbs

```
<main class="flex-1 overflow-y-auto p-4 lg:p-6">

<div class="space-y-6 max-w-2xl">
<div>
<h1 class="text-2xl font-bold text-gray-900">Configurações
<p class="text-gray-500 text-sm mt-1">Gerencie valores e acesso ao sistema
</p>
</h1>
</p>
</div>
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
<div class="flex items-center gap-3 mb-5">
<div class="w-9 h-9 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-dollar-sign"><line x1="12" x2="12" y1="2" y2="22">            
</line>
<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6">            
</path>
</svg>
</div>
<div>
<h2 class="font-bold text-gray-900">Valores Base dos Planos</h2>
<p class="text-xs text-gray-400">Estes valores são sugeridos ao criar um novo plano
</p>
</div>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
<div class="border rounded-xl p-4 bg-green-50 border-green-200">
<label class="text-sm font-semibold block mb-2 text-green-700">Mensal
</label>
<div class="relative">
<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$
</span>
<input type="number" min="0" step="0.01" class="w-full border border-white/80 rounded-lg pl-9 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300 bg-white/80" value="130">
</div>
</div>
<div class="border rounded-xl p-4 bg-blue-50 border-blue-200">
<label class="text-sm font-semibold block mb-2 text-blue-700">Trimestral
</label>
<div class="relative">
<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$
</span>
<input type="number" min="0" step="0.01" class="w-full border border-white/80 rounded-lg pl-9 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300 bg-white/80" value="170">            
</div>
<p class="text-xs text-gray-400 mt-1.5">≈ R$ 56,67/mês
</p>
</div>
<div class="border rounded-xl p-4 bg-purple-50 border-purple-200">
<label class="text-sm font-semibold block mb-2 text-purple-700">Semestral
</label>
<div class="relative">
<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$
</span>
<input type="number" min="0" step="0.01" class="w-full border border-white/80 rounded-lg pl-9 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300 bg-white/80" value="150">
</div>
<p class="text-xs text-gray-400 mt-1.5">≈ R$ 25,00/mês
</p>
</div>
<div class="border rounded-xl p-4 bg-orange-50 border-orange-200">
<label class="text-sm font-semibold block mb-2 text-orange-700">Anual
    </label>
    <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$
        </span>
        <input type="number" min="0" step="0.01" class="w-full border border-white/80 rounded-lg pl-9 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300 bg-white/80" value="130">
        </div>
        <p class="text-xs text-gray-400 mt-1.5">≈ R$ 10,83/mês
        </p>
    </div>
</div>
<button class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-green-500 hover:bg-green-600 text-white">
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save">
    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z">
    </path>
    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7">
    </path>
    <path d="M7 3v4a1 1 0 0 0 1 1h7">
    </path>
</svg> Salvar Valores
</button>
</div>
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
<div class="flex items-center gap-3 mb-5"><div class="w-9 h-9 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock">
<rect width="18" height="11" x="3" y="11" rx="2" ry="2">
</rect>
<path d="M7 11V7a5 5 0 0 1 10 0v4">
</path>
</svg>
</div>
<div>
<h2 class="font-bold text-gray-900">Credenciais de Acesso
</h2>
<p class="text-xs text-gray-400">Altere usuário e senha do sistema
</p>
</div>
</div>
<div class="space-y-4">
<div>
    <label class="text-sm font-medium text-gray-700 block mb-1.5">Usuário
    </label>
    <input class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value="admin">
    </div>
    <div>
        <label class="text-sm font-medium text-gray-700 block mb-1.5">Nova Senha 
            <span class="text-gray-400 font-normal">(deixe em branco para manter)
            </span>
        </label>
        <div class="relative">
            <input type="password" placeholder="Nova senha (mínimo 6 caracteres)" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value="">
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0">
                        </path>
                        <circle cx="12" cy="12" r="3">
                        </circle>
                    </svg>
                </button>
            </div>
        </div>
        <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all bg-gray-800 hover:bg-gray-900 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save">
                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z">
                </path>
                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7">
                </path>
                <path d="M7 3v4a1 1 0 0 0 1 1h7">
                    
                </path>
            </svg> Salvar Credenciais
        </button>
    </div>
</div>
```

# Caminho: ./views/pages/plans/index.hbs

```
<script src="/js/plan.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
  <div class="space-y-6">
  {{> top tagName="Planos" tagButton="Novo Plano" tagId="plan-counters" action="handleOpen(null, APP_CONFIG.PLANS)"}}
  
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {{> planCard }}
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
        {{> search tagId="search-input" tagPlaceholder="Buscar plano..."}}
        <div class="flex gap-2 overflow-x-auto">
            <button id="btn-all" data-filter="all" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-green-500 text-white border border-green-500">todos</button>
            <button id="btn-active" data-filter="active" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800">ativos</button>
            <button id="btn-inactive" data-filter="inactive" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800">inativos</button>
        </div>
    </div>

    {{> planList}}
  </div>
</div>

{{> planModal}}
```

# Caminho: ./views/pages/config/users.hbs

```
<script src="/js/settings.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
  <div class="max-w-3xl space-y-6">

    <div class="flex items-center gap-3">
      <a href="/config" class="text-zinc-500 hover:text-zinc-300 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </a>
      <div>
        <h1 class="text-xl font-semibold text-zinc-100">Usuários</h1>
        <p class="text-sm text-zinc-500">Gerencie as contas de acesso ao sistema.</p>
      </div>
    </div>

    {{!-- Adicionar usuário --}}
    <div class="bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl p-6">
      <h2 class="text-base font-semibold text-zinc-100 mb-4">Novo usuário</h2>

      <div id="create-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
      <div id="create-success" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"></div>

      <form id="create-user-form" class="space-y-4" novalidate>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">Nome completo</label>
            <input id="user-name" type="text" placeholder="Nome do usuário" class="w-full px-4 py-2.5 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 transition-colors">
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
            <input id="user-email" type="email" placeholder="usuario@email.com" class="w-full px-4 py-2.5 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 transition-colors">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">Senha temporária</label>
            <input id="user-password" type="password" placeholder="Mínimo 8 caracteres" class="w-full px-4 py-2.5 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 transition-colors">
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">Perfil</label>
            <select id="user-role" class="w-full px-4 py-2.5 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors">
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end">
          <button id="create-user-btn" type="submit" data-label="Criar usuário" class="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50">
            Criar usuário
          </button>
        </div>
      </form>
    </div>

    {{!-- Lista de usuários --}}
    <div class="bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-zinc-800">
        <h2 class="text-base font-semibold text-zinc-100">Contas de acesso</h2>
      </div>

      <div id="users-list">
        {{#if users}}
          {{#each users}}
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors" id="user-row-{{id}}">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-200
                {{#if isActive}}bg-green-500/20 border-green-500/30 text-green-400{{else}}bg-zinc-800{{/if}}">
                {{substring name 0 1}}
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-200">{{name}}</p>
                <p class="text-xs text-zinc-500">{{email}} · {{role}}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              {{#if isActive}}
                {{#unless (eq role "OWNER")}}
                <button onclick="handleDeactivate('{{id}}')" class="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors">
                  Desativar
                </button>
                {{/unless}}
                {{#if (eq role "OWNER")}}
                <span class="px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">Proprietário</span>
                {{/if}}
              {{else}}
                <span class="px-3 py-1.5 text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 rounded-lg">Inativo</span>
                <button onclick="handleReactivate('{{id}}')" class="px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/10 border border-green-500/20 rounded-lg transition-colors">
                  Reativar
                </button>
              {{/if}}
            </div>
          </div>
          {{/each}}
        {{else}}
          <div class="px-6 py-8 text-center text-zinc-500 text-sm">Nenhum usuário encontrado.</div>
        {{/if}}
      </div>
    </div>
  </div>
</div>
```

# Caminho: ./views/pages/config/index.hbs

```
<script src="/js/settings.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
  <div class="max-w-2xl space-y-6">

    <div>
      <h1 class="text-xl font-semibold text-zinc-100">Configurações</h1>
      <p class="text-sm text-zinc-500 mt-1">Gerencie os dados da academia e sua senha de acesso.</p>
    </div>

    {{!-- Academia --}}
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6">
      <h2 class="text-base font-semibold text-zinc-100 mb-4">Dados da Academia</h2>

      <div id="academy-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
      <div id="academy-success" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"></div>

      <form id="academy-form" class="space-y-4" novalidate>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Nome da academia</label>
          <input
            id="academy-name"
            type="text"
            value="{{academy.name}}"
            placeholder="Nome da academia"
            class="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">CNPJ</label>
            <input
              id="academy-cnpj"
              type="text"
              value="{{academy.cnpj}}"
              placeholder="00.000.000/0000-00"
              class="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-1.5">Telefone</label>
            <input
              id="academy-phone"
              type="text"
              value="{{academy.phone}}"
              placeholder="(00) 00000-0000"
              class="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Endereço</label>
          <input
            id="academy-address"
            type="text"
            value="{{academy.address}}"
            placeholder="Rua, número, bairro, cidade"
            class="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
        </div>

        <div class="flex justify-end">
          <button
            id="academy-btn"
            type="submit"
            data-label="Salvar alterações"
            class="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>

    {{!-- Alterar senha --}}
    <div id="change-password" class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6">
      <h2 class="text-base font-semibold text-zinc-100 mb-4">Alterar senha</h2>

      <div id="password-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
      <div id="password-success" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"></div>

      <form id="password-form" class="space-y-4" novalidate>
        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Senha atual</label>
          <input
            id="current-password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-400 mb-1.5">Nova senha</label>
          <input
            id="new-password"
            type="password"
            autocomplete="new-password"
            placeholder="Mínimo 8 caracteres"
            class="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
          >
        </div>

        <div class="flex justify-end">
          <button
            id="password-btn"
            type="submit"
            data-label="Alterar senha"
            class="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
          >
            Alterar senha
          </button>
        </div>
      </form>
    </div>

    {{!-- Link para gerenciar usuários --}}
    {{#if (eq currentUser.role "OWNER")}}
    <a href="/config/users" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-5 hover:border-green-500/50 transition-colors group">
      <div>
        <p class="font-medium text-zinc-100 text-sm">Gerenciar usuários</p>
        <p class="text-xs text-zinc-500 mt-0.5">Adicionar ou desativar contas de acesso ao sistema</p>
      </div>
      <svg class="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </a>
    {{/if}}
    {{#if (eq currentUser.role "ADMIN")}}
    <a href="/config/users" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-5 hover:border-green-500/50 transition-colors group">
      <div>
        <p class="font-medium text-zinc-100 text-sm">Gerenciar usuários</p>
        <p class="text-xs text-zinc-500 mt-0.5">Adicionar ou desativar contas de acesso ao sistema</p>
      </div>
      <svg class="w-5 h-5 text-zinc-500 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </a>
    {{/if}}

  </div>
</div>

```

# Caminho: ./views/pages/auth/setup.hbs

```
<div class="w-full max-w-lg">
  <div class="text-center mb-8">
    <div class="w-16 h-16 bg-gray-900 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
      <img src="/img/aero-biker.png.avif" alt="Logo" class="w-full h-full object-cover">
    </div>
    <h1 class="text-2xl font-bold text-white tracking-tight">AEROBIC BIKER</h1>
    <p class="text-gray-500 text-sm mt-1">Configuração inicial do sistema</p>
  </div>

  <div class="bg-gray-900 border border-white/10 rounded-2xl p-8">
    <h2 class="text-lg font-semibold text-white mb-1">Bem-vindo</h2>
    <p class="text-gray-500 text-sm mb-6">Configure sua academia e crie a conta de administrador principal.</p>

    <div id="setup-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>

    <form id="setup-form" class="space-y-5" novalidate>

      <div>
        <p class="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Dados da Academia</p>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1.5">Nome da academia</label>
          <input
            id="setup-academy"
            type="text"
            required
            autocomplete="organization"
            placeholder="Ex: Studio Aerobic Biker"
            class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
          >
        </div>
      </div>

      <div class="border-t border-white/10 pt-5">
        <p class="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Conta de Administrador</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Nome completo</label>
            <input
              id="setup-name"
              type="text"
              required
              autocomplete="name"
              placeholder="Seu nome"
              class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <input
              id="setup-email"
              type="email"
              required
              autocomplete="email"
              placeholder="seu@email.com"
              class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
            >
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-400 mb-1.5">Senha de acesso</label>
          <input
            id="setup-password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="Mínimo 8 caracteres"
            class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
          >
        </div>
      </div>

      <button
        id="setup-btn"
        type="submit"
        data-label="Configurar Sistema"
        class="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        Configurar Sistema
      </button>
    </form>
  </div>
</div>

```

# Caminho: ./views/pages/auth/reset-password.hbs

```
<div class="w-full max-w-md">
  <div class="text-center mb-8">
    <div class="w-16 h-16 bg-gray-900 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
      <img src="/img/aero-biker.png.avif" alt="Logo" class="w-full h-full object-cover">
    </div>
    <h1 class="text-2xl font-bold text-white tracking-tight">AEROBIC BIKER</h1>
    <p class="text-gray-500 text-sm mt-1">Redefinição de senha</p>
  </div>

  <div class="bg-gray-900 border border-white/10 rounded-2xl p-8">
    <h2 class="text-lg font-semibold text-white mb-1">Nova senha</h2>
    <p class="text-gray-500 text-sm mb-6">Escolha uma senha segura para sua conta.</p>

    <div id="reset-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
    <div id="reset-success" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"></div>

    <form id="reset-form" class="space-y-4" novalidate>
      <input type="hidden" id="reset-token" value="{{token}}">

      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Nova senha</label>
        <input
          id="reset-password"
          type="password"
          required
          autocomplete="new-password"
          placeholder="Mínimo 8 caracteres"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Confirmar nova senha</label>
        <input
          id="reset-confirm"
          type="password"
          required
          autocomplete="new-password"
          placeholder="Repita a nova senha"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
        <p id="confirm-match" class="text-xs mt-1 hidden"></p>
      </div>

      <button
        id="reset-btn"
        type="submit"
        data-label="Redefinir senha"
        class="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Redefinir senha
      </button>
    </form>

    <div class="mt-6 pt-6 border-t border-white/10">
      <a href="/login" class="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Voltar ao login
      </a>
    </div>
  </div>
</div>

```

# Caminho: ./views/pages/auth/forgot-password.hbs

```
<div class="w-full max-w-md">
  <div class="text-center mb-8">
    <div class="w-16 h-16 bg-gray-900 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
      <img src="/img/aero-biker.png.avif" alt="Logo" class="w-full h-full object-cover">
    </div>
    <h1 class="text-2xl font-bold text-white tracking-tight">AEROBIC BIKER</h1>
    <p class="text-gray-500 text-sm mt-1">Recuperação de senha</p>
  </div>

  <div class="bg-gray-900 border border-white/10 rounded-2xl p-8">
    <h2 class="text-lg font-semibold text-white mb-1">Esqueceu sua senha?</h2>
    <p class="text-gray-500 text-sm mb-6">Informe seu email e enviaremos um link para redefinir sua senha.</p>

    <div id="forgot-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
    <div id="forgot-success" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"></div>

    <form id="forgot-form" class="space-y-4" novalidate>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
        <input
          id="forgot-email"
          type="email"
          required
          autocomplete="email"
          placeholder="seu@email.com"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
      </div>

      <button
        id="forgot-btn"
        type="submit"
        data-label="Enviar link"
        class="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enviar link
      </button>
    </form>

    <div class="mt-6 pt-6 border-t border-white/10">
      <a href="/login" class="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Voltar ao login
      </a>
    </div>
  </div>
</div>

```

# Caminho: ./views/pages/auth/login.hbs

```
<div class="w-full max-w-md">
  <div class="text-center mb-8">
    <div class="w-16 h-16 bg-gray-900 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
      <img src="/img/aero-biker.png.avif" alt="Logo" class="w-full h-full object-cover">
    </div>
    <h1 class="text-2xl font-bold text-white tracking-tight">AEROBIC BIKER</h1>
    <p class="text-gray-500 text-sm mt-1">Sistema de Gestão</p>
  </div>

  <div class="bg-gray-900 border border-white/10 rounded-2xl p-8">
    <h2 class="text-lg font-semibold text-white mb-6">Entrar no sistema</h2>

    <div id="login-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>

    <form id="login-form" class="space-y-4" novalidate>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
        <input
          id="login-email"
          type="email"
          autocomplete="email"
          required
          placeholder="seu@email.com"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Senha</label>
        <div class="relative">
          <input
            id="login-password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors pr-10"
          >
          <button type="button" id="toggle-password" class="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors">
            <svg id="eye-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <button
        id="login-btn"
        type="submit"
        class="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        Entrar
      </button>
    </form>

    <div class="mt-6 pt-6 border-t border-white/10">
      <a href="/forgot-password" class="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Esqueceu sua senha?
      </a>
    </div>
  </div>
</div>

```

# Caminho: ./views/pages/auth/register.hbs

```
<div class="w-full max-w-md">
  <div class="text-center mb-8">
    <div class="w-16 h-16 bg-gray-900 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
      <img src="/img/aero-biker.png.avif" alt="Logo" class="w-full h-full object-cover">
    </div>
    <h1 class="text-2xl font-bold text-white tracking-tight">AEROBIC BIKER</h1>
    <p class="text-gray-500 text-sm mt-1">Criar novo acesso</p>
  </div>

  <div class="bg-gray-900 border border-white/10 rounded-2xl p-8">
    <h2 class="text-lg font-semibold text-white mb-1">Novo usuário</h2>
    <p class="text-gray-500 text-sm mb-6">A senha mestre institucional é necessária para criar um acesso.</p>

    <div id="register-error" class="hidden mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
    <div id="register-success" class="hidden mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm"></div>

    <form id="register-form" class="space-y-4" novalidate>
      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Nome completo</label>
        <input
          id="register-name"
          type="text"
          required
          autocomplete="name"
          placeholder="Nome do usuário"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
        <input
          id="register-email"
          type="email"
          required
          autocomplete="email"
          placeholder="usuario@email.com"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-400 mb-1.5">Senha de acesso</label>
        <input
          id="register-password"
          type="password"
          required
          autocomplete="new-password"
          placeholder="Mínimo 8 caracteres"
          class="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
        >
      </div>

      <div class="border-t border-white/10 pt-4">
        <label class="block text-sm font-medium text-amber-400 mb-1.5">Senha Mestre Institucional</label>
        <p class="text-gray-600 text-xs mb-2">Necessária para autorizar a criação de novos acessos.</p>
        <input
          id="register-master"
          type="password"
          required
          autocomplete="off"
          placeholder="Senha mestre do sistema"
          class="w-full px-4 py-2.5 bg-gray-800 border border-amber-500/30 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
        >
      </div>

      <button
        id="register-btn"
        type="submit"
        class="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        Criar Acesso
      </button>
    </form>

    <div class="mt-6 pt-6 border-t border-white/10">
      <a href="/login" class="block text-center text-sm text-gray-500 hover:text-gray-300 transition-colors">
        Já possui acesso? Entrar
      </a>
    </div>
  </div>
</div>

```

# Caminho: ./views/pages/groups/index.hbs

```
<script src="/js/group.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
    <div class="space-y-6">
        {{> top tagName="Turmas" tagButton="Nova Turma" tagId="group-counters" action="handleOpen(null, APP_CONFIG.GROUPS)"}}
        {{> groupList}}
    </div>
</div>

{{> groupModal}}

```

# Caminho: ./views/pages/schedules/index.hbs

```
<script>
  window.APP_GROUPS = {{{toJSON groups}}};
</script>
<script src="/js/schedule.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
    <div class="space-y-6">
        {{> top tagName="Agenda de Aulas" tagButton="Nova Aula" tagId="schedule-counters" action="handleOpen(null, APP_CONFIG.SCHEDULES)"}}
    </div>

    {{#if isEmpty}}
        <div class="mt-6">
            {{> emptyState}}
        </div>
    {{else}}
        {{> scheduleList}}
    {{/if}}
</div>

{{> scheduleModal}}

```

# Caminho: ./views/pages/subscriptions/index.hbs

```
<script src="/js/subscription.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
    <div class="space-y-6">
        {{> top tagName="Mensalidades" tagButton="Nova Mensalidade" tagId="subscription-counters" action="handleOpen(null, APP_CONFIG.SUBSCRIPTIONS)"}}
        
        <div class="flex flex-col sm:flex-row gap-3">
            {{> search tagId="search-input" tagPlaceholder="Buscar por aluno ou plano..."}}
            
            <!-- Filtro de Mês com Ícone -->
            <div class="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 shrink-0">
              <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <!-- [color-scheme:dark] forçará o ícone de calendário nativo a ficar branco -->
              <input type="month" id="month-filter" class="text-sm font-medium text-zinc-200 bg-transparent focus:outline-none cursor-pointer [color-scheme:dark]">
            </div>
        
            <!-- Botões com Contadores -->
            <div class="flex gap-2 overflow-x-auto">
                <button id="btn-all" data-filter="all" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-green-500 text-white border border-green-500 shrink-0">
                  Todos <span id="count-all" class="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">0</span>
                </button>
                
                <button id="btn-paid" data-filter="PAID" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 shrink-0">
                  Pagos <span id="count-paid" class="ml-1 bg-blue-600 text-white py-0.5 px-2 rounded-full text-xs shadow-sm shadow-blue-900/40">0</span>
                </button>
                
                <button id="btn-pending" data-filter="PENDING" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 shrink-0">
                  Pendentes <span id="count-pending" class="ml-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2 rounded-full text-xs">0</span>
                </button>
                
                <button id="btn-cancelled" data-filter="CANCELLED" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 shrink-0">
                  Cancelados <span id="count-cancelled" class="ml-1 bg-red-500/10 text-red-400 border border-red-500/20 py-0.5 px-2 rounded-full text-xs">0</span>
                </button>
            </div>
        </div>
        {{> subscriptionList}}
    </div>
</div>

{{> subscriptionModal}}
```

# Caminho: ./views/pages/dashboard/index.hbs

```
<script src="/js/dashboard.js"></script>

<div class="flex-1 overflow-y-auto p-4">
    <div class="space-y-6">
        {{> top tagName="Dashboard" tagId="dashboard-subtitle" }}
    </div>

    {{! Stat cards }}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
      {{> dashCard
        title="Alunos Ativos"
        value=dashboard.totalStudents
        icon="icons/users"
        color="bg-blue-500/10 text-blue-400 border border-blue-500/20"
      }}

      {{> dashCard
        title="Turmas"
        value=dashboard.totalClasses
        icon="icons/bike"
        color="bg-green-500/10 text-green-400 border border-green-500/20"
      }}

      {{> dashCard
        title="Aulas Cadastradas"
        value=dashboard.totalLessons
        icon="icons/calendar"
        color="bg-purple-500/10 text-purple-400 border border-purple-500/20"
      }}

      {{> dashCard
        title="Planos Ativos"
        value=dashboard.totalPlans
        icon="icons/cred-card"
        color="bg-orange-500/10 text-orange-400 border border-orange-500/20"
      }}
    </div>

    {{! Revenue row }}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
      {{> revenueCard
        month=dashboard.currentMonth
        amount=dashboard.receivedAmount
        paid=dashboard.paidCount
        pending=dashboard.pendingCount
      }}

      {{> estimateCard
        estimate=dashboard.estimatedRevenue
      }}
    </div>

    {{! Charts row }}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">

      <div class="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
        <h2 class="text-base font-semibold text-zinc-100 mb-4">Alunos por Turma</h2>
        <div class="relative h-52" id="studentsPerGroupWrap">
          <canvas id="studentsPerGroupChart"></canvas>
        </div>
      </div>

      <div class="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
        <h2 class="text-base font-semibold text-zinc-100 mb-4">Distribuição de Planos</h2>
        <div class="relative h-52" id="planDistributionWrap">
          <canvas id="planDistributionChart"></canvas>
        </div>
      </div>

    </div>

    {{! Recent activity row }}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
      {{> recentClassesCard
        recentClasses=dashboard.recentClasses
      }}

      {{> renewalsCard
        upcomingRenewals=dashboard.upcomingRenewals
      }}
    </div>

</div>

<script>
(function () {
  var studentsData = {{{toJSON dashboard.studentsPerGroup}}};
  var plansData    = {{{toJSON dashboard.planDistribution}}};

  Chart.defaults.color = '#a1a1aa'; // Define a cor padrão dos textos do gráfico para zinc-400

  // Bar chart — Alunos por Turma
  var barCanvas = document.getElementById('studentsPerGroupChart');
  var barWrap   = document.getElementById('studentsPerGroupWrap');
  if (barCanvas && studentsData.length > 0) {
    new Chart(barCanvas, {
      type: 'bar',
      data: {
        labels: studentsData.map(function(d){ return d.label; }),
        datasets: [{
          data: studentsData.map(function(d){ return d.count; }),
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, color: '#a1a1aa' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' } // Linhas de grade mais claras
          },
          x: {
            ticks: { maxRotation: 45, font: { size: 9 }, color: '#a1a1aa' },
            grid: { display: false }
          }
        }
      }
    });
  } else if (barWrap) {
    barWrap.innerHTML = '<p class="text-sm text-zinc-500 text-center pt-10">Nenhuma turma ativa encontrada.</p>';
  }

  // Pie chart — Distribuição de Planos
  var pieCanvas = document.getElementById('planDistributionChart');
  var pieWrap   = document.getElementById('planDistributionWrap');
  if (pieCanvas && plansData.length > 0) {
    new Chart(pieCanvas, {
      type: 'doughnut',
      data: {
        labels: plansData.map(function(d){ return d.label; }),
        datasets: [{
          data: plansData.map(function(d){ return d.count; }),
          backgroundColor: ['#3b82f6', '#f97316', '#f59e0b', '#8b5cf6', '#22c55e', '#ec4899'],
          borderWidth: 2,
          borderColor: '#18181b', // Mesma cor do bg-zinc-900 para o vão entre as fatias
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, padding: 12, color: '#a1a1aa' }
          }
        }
      }
    });
  } else if (pieWrap) {
    pieWrap.innerHTML = '<p class="text-sm text-zinc-500 text-center pt-10">Nenhum plano com assinatura ativa.</p>';
  }
})();
</script>
```

# Caminho: ./views/pages/students/index.hbs

```
<script src="/js/student.js"></script>

<div class="flex-1 overflow-y-auto p-4 lg:p-6">
    <div class="space-y-6">
        {{> top tagName="Alunos" tagButton="Novo Aluno" tagId="student-counters" action="handleOpen(null, APP_CONFIG.STUDENTS)" }}

        <div class="flex flex-col sm:flex-row gap-3">
            {{> search tagId="search-input" tagPlaceholder="Buscar aluno..."}}
            <div class="flex gap-2">
                <button id="btn-all" data-filter="all" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-green-500 text-white border border-green-500">todos</button>
                <button id="btn-active" data-filter="active" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800">ativos</button>
                <button id="btn-inactive" data-filter="inactive" class="filter-btn px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800">inativos</button>
            </div>
        </div>
        {{#if isEmpty}}
            {{> emptyState }}
        {{else}}
            {{> studentList }}
        {{/if}}
    </div>
</div>

{{> studentModal }}
```

# Caminho: ./views/partials/groupList.hbs

```
<div class="bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Capacidade</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Dias</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
                {{#each groups}}
                <tr class="group-row hover:bg-zinc-800/40 transition-colors" data-status="{{#if this.isActive}}active{{else}}inactive{{/if}}">
                    <td class="px-5 py-3.5">
                        <p class="font-mediumtext-zinc-200 text-sm">{{this.name}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{this.maxCapacity}} alunos</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{this.daysOfWeek}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        {{#if this.isActive}}
                            <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>
                        {{else}}
                            <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">Inativo</span>
                        {{/if}}
                    </td>
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-1.5">
                            <button onclick="handleOpen('{{this.id}}', APP_CONFIG.GROUPS)" class="p-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                            </button>
                            <button onclick="handleDelete('{{this.id}}', 'groups')" class="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Desativar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {{else}}
                <tr>
                    <td colspan="6" class="p-6 text-center text-gray-500">Nenhuma turma encontrada.</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
</div>

```

# Caminho: ./views/partials/subscriptionList.hbs

```
<div class="bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aluno</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Plano</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Valor</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Método</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 tracking-wider hidden md:table-cell">Vencimento</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 tracking-wider hidden md:table-cell">Pagamento</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 tracking-wider hidden md:table-cell">Status</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800" id="subscriptions-table-body">
                {{#each subscriptions}}
                <tr class="subscription-row hover:bg-zinc-800/40 transition-colors" data-status="{{this.status}}" data-date="{{this.renovationDate}}">
                    <td class="px-5 py-3.5">
                        <span class="student-name font-medium text-sm text-zinc-200" data-student-id="{{this.studentId}}">—</span>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <span class="plan-name text-sm text-zinc-400" data-plan-id="{{this.planId}}">—</span>
                    </td>
                    <td class="px-5 py-3.5 hidden sm:table-cell">
                        <p class="font-medium text-sm text-zinc-200">{{formatCurrency this.subscriptionValue}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{this.paymentMethod}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{formatDateShort this.startDate}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{formatDateShort this.renovationDate}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        {{#if (eq this.status "PAID")}}
                            <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-600 text-white shadow-md shadow-blue-900/40">Pago</span>
                        {{else}}
                            {{#if (eq this.status "PENDING")}}
                                <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Pendente</span>
                            {{else}}
                                <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">Cancelado</span>
                            {{/if}}
                        {{/if}}
                    </td>
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-1.5">
                            <button onclick="handleOpen('{{this.id}}', APP_CONFIG.SUBSCRIPTIONS)" class="p-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                            </button>
                            <button onclick="handleDelete('{{this.id}}', 'subscriptions')" class="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cancelar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {{else}}
                <tr>
                    <td colspan="8" class="p-6 text-center text-zinc-500">Nenhuma assinatura encontrada.</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
</div>
```

# Caminho: ./views/partials/estimateCard.hbs

```
<div class="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-zinc-400 text-sm">Receita Mensal Estimada</p>
      <p class="text-4xl font-bold text-zinc-100 mt-1">R$ {{estimate}}</p>
      <p class="text-sm text-zinc-500 mt-2">Baseado nos planos cadastrados</p>
    </div>
    <div class="text-zinc-700">
      {{> icons/trending-up}}
    </div>
  </div>
</div>
```

# Caminho: ./views/partials/recentClassesCard.hbs

```
<div class="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
  <h2 class="text-2xl font-bold text-zinc-100 flex items-center gap-2">
    <span class="text-green-500">{{> icons/clock}}</span>
    Aulas Recentes
  </h2>
  <div class="space-y-3 mt-6">
    {{#if recentClasses.length}}
      {{#each recentClasses}}
        {{> recentClassItem}}
      {{/each}}
    {{else}}
      <p class="text-sm text-zinc-500">Nenhuma aula recente encontrada.</p>
    {{/if}}
  </div>
</div>
```

# Caminho: ./views/partials/aside.hbs

```
<script src="/js/aside.js"></script>

<aside id="sidebar" class="w-64 flex flex-col bg-gray-900 text-white fixed inset-y-0 left-0 z-50 transform -translate-x-full transition-transform duration-300 md:relative md:translate-x-0">
  <div class="flex items-center gap-3 p-4 border-b border-gray-700">
    <div class="w-10 h-10 bg-black rounded-lg overflow-hidden shrink-0">
      <img src="/img/aero-biker.png.avif" alt="Logo" class="w-full h-full object-cover">
    </div>
    <div>
      <p class="font-bold text-sm leading-none">AEROBIC BIKER</p>
      <span class="text-xs text-gray-400">Spinning Bike</span>
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto p-4">
    <ul class="flex flex-col gap-2">
      {{> asideLinks link="/dashboard" label="Dashboard" iconPartial="icons/home" }}
      {{> asideLinks link="/students" label="Alunos" iconPartial="icons/users" }}
      {{> asideLinks link="/groups" label="Turmas" iconPartial="icons/bike" }}
      {{> asideLinks link="/schedules" label="Agenda de Aulas" iconPartial="icons/calendar" }}
      {{> asideLinks link="/plans" label="Planos" iconPartial="icons/tag" }}
      {{> asideLinks link="/subscriptions" label="Mensalidades" iconPartial="icons/cred-card" }}
    </ul>
  </nav>

  <div class="relative px-3 pb-4 border-t border-white/10 pt-3">
    {{!-- Dropdown — opens upward --}}
    <div
      id="user-menu-dropdown"
      class="absolute bottom-full left-3 right-3 mb-2 bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl opacity-0 pointer-events-none translate-y-2 transition-all duration-200 ease-out"
    >
      <a href="/config" class="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Configurações
      </a>
      <div class="border-t border-white/10">
        <form method="POST" action="/api/auth/logout">
          <button type="submit" class="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sair
          </button>
        </form>
      </div>
    </div>

    {{!-- User trigger --}}
    <button id="user-menu-btn" type="button" class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer">
      <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0">
        {{#if currentUser.name}}{{substring currentUser.name 0 1}}{{else}}A{{/if}}
      </div>
      <div class="flex-1 min-w-0 text-left">
        <p class="text-xs font-semibold text-white truncate">{{#if currentUser.name}}{{currentUser.name}}{{else}}Administrador{{/if}}</p>
        <p class="text-xs text-gray-500 truncate">{{roleLabel currentUser.role}}</p>
      </div>
      <svg id="user-menu-chevron" class="w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
      </svg>
    </button>
  </div>
</aside>

```

# Caminho: ./views/partials/dropdown.hbs

```
<div>
    <label class="text-sm font-medium text-gray-700 block mb-1.5">{{label}}</label>
    <select id="{{id}}" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 disabled:bg-gray-50">
        <option value="">Selecione um {{tagCategory}}</option>
        {{#each tagData}}
            <option value="{{this}}">
                {{this}}
            </option>
        {{/each}}
    </select>
</div>
```

# Caminho: ./views/partials/top.hbs

```
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
      <h1 class="text-2xl font-bold text-zinc-100">{{tagName}}</h1>
      <p id="{{tagId}}" class="text-zinc-400 text-sm mt-1"></p>
  </div>

    {{#if tagButton}}
    
    <button
    onclick="{{action}}"
    class="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-green-900/20"
    >
    <svg xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        class="w-5 h-5"
    >
        <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
        />
    </svg>
    
    {{tagButton}}
    </button>
    
    {{/if}}
</div>
```

# Caminho: ./views/partials/studentList.hbs

```
<div class="bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Turmas</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Telefone</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800" id="students-table-body">
                {{#each students}}
                <tr class="student-row hover:bg-zinc-800/40 transition-colors" data-name="{{this.name}}" data-status="{{#if this.isActive}}active{{else}}inactive{{/if}}">
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                            <div class="relative shrink-0">
                                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs uppercase overflow-hidden">
                                  {{this.name.[0]}}
                                </div>
                                {{#if this.isActive}}
                                    <span class="md:hidden absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
                                {{else}}
                                    <span class="md:hidden absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-zinc-900 rounded-full"></span>
                                {{/if}}
                            </div>
                            <p class="font-medium text-zinc-200 text-sm">{{this.name}}</p>
                        </div>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <div class="flex flex-wrap gap-1">
                            <span class="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                              {{#if this.group}}
                                  {{this.group.name}}
                                {{else}}
                                  —
                                {{/if}}
                            </span>
                        </div>
                    </td>
                    <td class="px-5 py-3.5 hidden sm:table-cell">
                        <div class="flex items-center gap-3">
                            <p class="font-medium text-sm text-zinc-200">{{this.phone}}</p>
                        </div>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        {{#if this.isActive}}
                            <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>
                        {{else}}
                            <span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">Inativo</span>
                        {{/if}}
                    </td>
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-1.5">
                            <button onclick="handleOpen('{{this.id}}', APP_CONFIG.STUDENTS)" class="p-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                            </button>
                            <button onclick="handleDelete('{{this.id}}','students')" class="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {{else}}
                <tr>
                    <td colspan="5" class="p-6 text-center text-zinc-500">Nenhum aluno encontrado.</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
</div>
```

# Caminho: ./views/partials/planModal.hbs

```
{{#> modal
    modalId="modal-plan"
    titleId="plan-modal-title"
    formId="plan-form"
    hiddenId="plan-id"
    configName="APP_CONFIG.PLANS"
    title="Novo Plano"
}}
    {{> input id="plan-name" label="Nome*" placeholder="Ex: Plano Mensal" required=true}}
    {{> input id="plan-description" label="Descrição*" placeholder="Breve descrição do plano" required=true}}
    {{> input id="plan-price" type="number" step="0.01" label="Preço (R$)*" placeholder="Ex: 99.90" required=true}}

    {{> dropdown 
        id="plan-duration" 
        label="Modalidade*" 
        tagData=durationMonths
        tagCategory="Plano"
    }}
    <label class="flex items-center gap-3 cursor-pointer mt-2">
      <input type="checkbox" id="plan-active" class="w-4 h-4 accent-green-500" checked>
      <span class="text-sm font-medium text-gray-700">Plano ativo</span>
    </label>
{{/modal}}
```

# Caminho: ./views/partials/dashCard.hbs

```
<div class="bg-zinc-900 rounded-2xl p-5 shadow-xl border border-zinc-800">
  <div class="w-10 h-10 rounded-xl {{#if color}}{{color}}{{else}}bg-zinc-800 text-zinc-400{{/if}} flex items-center justify-center mb-3">
      {{> (lookup . "icon") }}
  </div>
  <p class="text-2xl font-bold text-zinc-100">
    {{#if value}}{{value}}{{else}}0{{/if}}
  </p>
  <p class="text-sm text-zinc-400 mt-1">
    {{title}}
  </p>
</div>
```

# Caminho: ./views/partials/header.hbs

```
<div class="flex justify-between items-center bg-zinc-900 border-b border-zinc-800 px-6 py-3">
  <div class="flex items-center gap-2">
    <button id="mobile-menu-btn" class="md:hidden text-gray-600 hover:bg-gray-200 rounded-lg">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>
    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    <p class="text-sm text-gray-500 font-medium">Sistema Ativo</p>
    </div>
    <div class="flex">
      <p class="text-sm text-gray-400 hidden sm:block">{{formatDate}}</p>
    </div>
</div>
```

# Caminho: ./views/partials/asideLinks.hbs

```
<li>
  <a href="{{link}}"
  class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
  {{#if active}} bg-green-500 text-white {{else}} text-gray-400 hover:bg-gray-800 hover:text-white {{/if}}">
    {{#if iconPartial}}
    <span class="w-4 h-4 shrink-0 flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4">
      {{> (lookup . "iconPartial")}}
    </span>
    {{/if}}
    <span>{{label}}</span>
  </a>
</li>
```

# Caminho: ./views/partials/modal.hbs

```
<div id="{{modalId}}" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-opacity">
  <div class="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">    
    
    <div class="flex items-center justify-between p-6 border-b border-zinc-800">
      <h2 class="font-bold text-zinc-100" id="{{titleId}}">{{title}}</h2>
      <button type="button" onclick="closeModal('{{modalId}}')">
        <svg class="w-5 h-5 text-zinc-500 hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div> 

    <form id="{{formId}}" onsubmit="handleSubmit(event, {{configName}})">
      <input type="hidden" id="{{hiddenId}}">

      <div class="p-6 space-y-4">
        {{> @partial-block }}
      </div>

      <div class="p-6 pt-0 flex gap-3">
        <!-- Botão Cancelar -->
        <button type="button" onclick="closeModal('{{modalId}}')" class="flex-1 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-colors px-4 py-2.5 rounded-xl text-sm font-medium">Cancelar</button>
        <!-- Botão Salvar -->
        <button type="submit" class="flex-1 bg-green-500 hover:bg-green-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-colors">Salvar</button>
      </div>
    </form>
  </div>
</div>
```

# Caminho: ./views/partials/emptyState.hbs

```
{{#if isEmpty}}
  <section class="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center">
    <h2 class="text-lg font-semibold text-zinc-200">
      {{emptyMessage}}
    </h2>
    {{#if category}}
      <p class="mt-2 text-sm text-zinc-500">Categoria: {{category}}</p>
    {{/if}}
  </section>
{{/if}}
```

# Caminho: ./views/partials/studentModal.hbs

```
{{#> modal
    modalId="modal-student"
    titleId="student-modal-title"
    formId="student-form"
    hiddenId="student-id"
    configName="APP_CONFIG.STUDENTS"
    title="Novo Aluno"
}}
    {{> input id="student-name" label="Nome*" placeholder="Nome completo" required=true}}
    {{> input id="student-phone" label="Telefone / WhatsApp" placeholder="(00) 00000-0000" required=true}}

    <div>
        <label class="text-sm font-medium text-zinc-400 block mb-1.5">Turma*</label>
        <select id="student-group" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]" required>
            <option value="" disabled selected>Selecione uma turma</option>
            {{#each groups}}
                <option value="{{this.id}}">{{this.name}}</option>
            {{/each}}
        </select>
        {{^groups}}
            <span class="text-xs text-red-500 mt-1 block">Nenhuma turma encontrada no sistema! Crie uma turma primeiro.</span>
        {{/groups}}
    </div>
  
    <div>
        <label class="text-sm font-medium text-zinc-400 block mb-1.5">Status da Matrícula*</label>
        <select id="student-enrollment" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]" required>
            <option value="ACTIVE" selected>Ativo</option>
            <option value="INACTIVE">Inativo</option>
        </select>
    </div>

    <label class="flex items-center gap-3 cursor-pointer mt-2">
      <input type="checkbox" id="student-active" class="w-4 h-4 accent-green-500" checked>
      <span class="text-sm font-medium text-zinc-400">Aluno Ativo</span>
    </label>
{{/modal}}
```

# Caminho: ./views/partials/input.hbs

```
<div>
  <label class="text-sm font-medium text-zinc-400 block mb-1.5">{{label}}</label>
  <input type="text" placeholder="{{placeholder}}" id="{{id}}" {{#if required}}required{{/if}} class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 transition-colors">
</div>
```

# Caminho: ./views/partials/renewalsItem.hbs

```
<a href="/subscriptions" class="flex items-center justify-between rounded-xl bg-zinc-800/40 border border-zinc-800/50 px-4 py-3 hover:bg-zinc-800 hover:shadow-md transition-all cursor-pointer block">
  <div>
    <p class="font-medium text-zinc-100">{{student}}</p>
    <p class="text-sm text-zinc-400 mt-0.5">
      Plano {{plan}} <span class="text-zinc-600 mx-1">•</span> <span class="font-semibold text-green-400">R$ {{value}}</span>
    </p>
  </div>
  <span class="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-md">
    {{expiresAt}}
  </span>
</a>
```

# Caminho: ./views/partials/scheduleList.hbs

```
<div class="bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 overflow-hidden mt-6">    
  <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Turma</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Dia</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Horário</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
                {{#each schedules}}
                <tr class="schedule-row hover:bg-zinc-800/40 transition-colors">
                    <td class="px-5 py-3.5">
                        <p class="font-medium text-zinc-200 text-sm">{{this.group.name}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{dayName this.dayOfWeek}}</p>
                    </td>
                    <td class="px-5 py-3.5">
                        <p class="text-sm text-zinc-200">{{substring this.startTime 0 5}} — {{substring this.endTime 0 5}}</p>
                    </td>
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-1.5">
                            <button onclick="handleOpen('{{this.id}}', APP_CONFIG.SCHEDULES)" class="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                            </button>
                            <button onclick="handleDelete('{{this.id}}', 'schedules')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {{else}}
                <tr>
                    <td colspan="4" class="p-8 text-center text-gray-400 text-sm">Nenhuma aula cadastrada ainda.</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
</div>

```

# Caminho: ./views/partials/recentClassItem.hbs

```
<div class="flex items-center justify-between rounded-xl bg-zinc-800/40 px-4 py-3 border border-zinc-800/50">
  <div class="flex items-center gap-4">
    <div class="w-10 h-10 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center text-sm font-bold">
      {{day}}
    </div>
    <div>
      <p class="font-medium text-zinc-100">#{{number}} {{name}}</p>
      <p class="text-sm text-zinc-400">{{month}} • {{level}}</p>
    </div>
  </div>
  <span class="px-3 py-1 rounded-full text-xs font-medium {{#ifCond level '===' 'Avançado'}} bg-red-500/10 text-red-400 border border-red-500/20 {{else}} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 {{/ifCond}}">
    {{level}}
  </span>
</div>
```

# Caminho: ./views/partials/planCard.hbs

```
{{#each durationMonths}}
  <div class="bg-zinc-900 rounded-2xl p-5 shadow-xl border border-zinc-800 flex flex-col justify-between plan-summary-card hover:border-zinc-700 transition-colors" data-modality="{{this}}">
    <div>
      {{#if (eq this "Mensal")}}
        <span class="text-xs px-2.5 py-1 rounded-full font-medium modality-badge bg-green-500/10 text-green-400 border border-green-500/20">{{this}}</span>
      {{else if (eq this "Trimestral")}}
        <span class="text-xs px-2.5 py-1 rounded-full font-medium modality-badge bg-blue-500/10 text-blue-400 border border-blue-500/20">{{this}}</span>
      {{else if (eq this "Semestral")}}
        <span class="text-xs px-2.5 py-1 rounded-full font-medium modality-badge bg-purple-500/10 text-purple-400 border border-purple-500/20">{{this}}</span>
      {{else if (eq this "Anual")}}
        <span class="text-xs px-2.5 py-1 rounded-full font-medium modality-badge bg-orange-500/10 text-orange-400 border border-orange-500/20">{{this}}</span>
      {{else}}
        <span class="text-xs px-2.5 py-1 rounded-full font-medium modality-badge bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">{{this}}</span>
      {{/if}}
      <p class="text-2xl font-bold text-zinc-100 mt-3" id="value-{{this}}">R$ 0,00</p>
    </div>
    <p class="text-xs text-zinc-500 mt-2 font-medium" id="count-{{this}}">0 ativos</p>
  </div>
{{/each}}
```

# Caminho: ./views/partials/icons/calendar.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
  <line x1="16" y1="2" x2="16" y2="6"/>
  <line x1="8" y1="2" x2="8" y2="6"/>
  <line x1="3" y1="10" x2="21" y2="10"/>
  <circle cx="8" cy="14" r="1"/>
  <circle cx="12" cy="14" r="1"/>
  <circle cx="16" cy="14" r="1"/>
  <circle cx="8" cy="18" r="1"/>
  <circle cx="12" cy="18" r="1"/>
  <circle cx="16" cy="18" r="1"/>
</svg>
```

# Caminho: ./views/partials/icons/clock.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="14"
  height="14"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
```

# Caminho: ./views/partials/icons/users.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</svg>
```

# Caminho: ./views/partials/icons/trending-up.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="44"
  height="44"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
  <polyline points="16 7 22 7 22 13"/>
</svg>
```

# Caminho: ./views/partials/icons/dollar-sign.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="44"
  height="44"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <line x1="12" y1="1" x2="12" y2="23"/>
  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
</svg>
```

# Caminho: ./views/partials/icons/cred-card.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="2" y="5" width="20" height="14" rx="3" ry="3"/>
  <line x1="2" y1="10" x2="22" y2="10"/>
  <line x1="6" y1="15" x2="10" y2="15"/>
</svg>
```

# Caminho: ./views/partials/icons/check.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="14"
  height="14"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M20 6 9 17l-5-5"/>
</svg>
```

# Caminho: ./views/partials/icons/home.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="3" width="7" height="7" rx="1"/>
  <rect x="14" y="3" width="7" height="7" rx="1"/>
  <rect x="3" y="14" width="7" height="7" rx="1"/>
  <rect x="14" y="14" width="7" height="7" rx="1"/>
</svg>

```

# Caminho: ./views/partials/icons/bike.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="5.5" cy="17.5" r="3.5"/>
  <circle cx="18.5" cy="17.5" r="3.5"/>
  <path d="M15 6h-3l-2 6"/>
  <path d="M6 12h6l3-6h3"/>
</svg>
```

# Caminho: ./views/partials/icons/tag.hbs

```
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="18"
  height="18"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
  <line x1="7" y1="7" x2="7.01" y2="7"/>
</svg>

```

# Caminho: ./views/partials/scheduleModal.hbs

```
{{#> modal
    modalId="modal-schedule"
    titleId="schedule-modal-title"
    formId="schedule-form"
    hiddenId="schedule-id"
    configName="APP_CONFIG.SCHEDULES"
    title="Nova Aula"
}}
    <div>
        <label class="text-sm font-medium text-zinc-400 block mb-1.5">Turma*</label>
        <select id="schedule-group" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]">
            <option value="">Selecione uma turma</option>
        </select>
    </div>
    <div>
        <label class="text-sm font-medium text-zinc-400 block mb-1.5">Dia da semana*</label>
        <select id="schedule-day" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]">
          <option value="">Selecione o dia</option>
          <option value="Dom">Domingo</option>
          <option value="Seg">Segunda-feira</option>
          <option value="Ter">Terça-feira</option>
          <option value="Qua">Quarta-feira</option>
          <option value="Qui">Quinta-feira</option>
          <option value="Sex">Sexta-feira</option>
          <option value="Sab">Sábado</option>
        </select>
    </div>

    {{> timePicker name="Horário das aulas" id-start="schedule-start" id-end="schedule-end"}}
{{/modal}}
```

# Caminho: ./views/partials/subscriptionModal.hbs

```
{{#> modal
    modalId="modal-subscription"
    titleId="subscription-modal-title"
    formId="subscription-form"
    hiddenId="subscription-id"
    configName="APP_CONFIG.SUBSCRIPTIONS"
    title="Lançar Mensalidade"
}}
    <div class="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Aluno*</label>
            <select id="subscription-student" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]">
                <option value="">Selecione um aluno</option>
            </select>
        </div>
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Plano*</label>
            <select id="subscription-plan" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]">
                <option value="">Selecione um plano</option>
            </select>
        </div>
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Valor (R$)*</label>
            <input type="number" step="0.01" min="0" id="subscription-value" placeholder="Ex: 150.00" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 transition-colors">
        </div>
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Data de vencimento*</label>
            <input type="date" id="subscription-start-date" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 transition-colors [color-scheme:dark]">
        </div>
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Data de pagamento*</label>
            <input type="date" id="subscription-renovation-date" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 transition-colors [color-scheme:dark]">
        </div>
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Status*</label>
            <select id="subscription-status" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]">
                <option value="PAID">Pago</option>
                <option value="PENDING">Pendente</option>
                <option value="CANCELLED">Cancelado</option>
            </select>
        </div>
        <div>
            <label class="text-sm font-medium text-zinc-400 block mb-1.5">Método de pagamento*</label>
            <select id="subscription-payment-method" class="w-full border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 [&>option]:bg-zinc-900 transition-colors [color-scheme:dark]">
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto</option>
                <option value="CREDIT_CARD">Cartão de Crédito</option>
            </select>
        </div>
    </div>
{{/modal}}
```

# Caminho: ./views/partials/groupModal.hbs

```
{{#> modal
    modalId="modal-group"
    titleId="group-modal-title"
    formId="group-form"
    hiddenId="group-id"
    configName="APP_CONFIG.GROUPS"
    title="Nova Turma"
}}
    {{> input id="group-name" label="Nome*" placeholder="Ex: Turma A"}}
    {{> weekPicker }}
    {{> input id="group-capacity" label="Capacidade máxima*" placeholder="Ex: 15"}}
    <label class="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" id="group-active" class="w-4 h-4 accent-green-500" checked>
      <span class="text-sm font-medium text-gray-700">Turma ativa</span>
    </label>
{{/modal}}

```

# Caminho: ./views/partials/revenueCard.hbs

```
<div class="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-900/20">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-green-100 text-sm">Recebido em {{month}}</p>
      <p class="text-4xl font-bold mt-1">R$ {{amount}}</p>
      <div class="flex gap-3 mt-3 text-xs">
          <span class="text-green-100 flex items-center gap-1">
            {{> icons/check}} {{paid}} pagos
          </span>
        <span class="text-green-200 flex items-center gap-1">
          {{> icons/clock}} {{pending}} pendentes
        </span>
      </div>
    </div>
  </div>
</div>
```

# Caminho: ./views/partials/renewalsCard.hbs

```
<div class="bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
  <h2 class="text-2xl font-bold text-zinc-100 flex items-center gap-2">
    <span class="text-green-500">{{> icons/clock}}</span>
    Próximas Renovações
  </h2>
  <div class="space-y-3 mt-6">
    {{#if upcomingRenewals.length}}
      {{#each upcomingRenewals}}
        {{> renewalsItem}}
      {{/each}}
    {{else}}
      <p class="text-sm text-zinc-500">Nenhuma renovação pendente</p>
    {{/if}}
  </div>
</div>
```

# Caminho: ./views/partials/search.hbs

```
<div class="relative flex-1">
    <input id="{{tagId}}" placeholder="{{tagPlaceholder}}" class="w-full pl-9 pr-4 py-2.5 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 transition-colors" value="">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 absolute left-3 top-2.5 text-zinc-500">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
</div>
```

# Caminho: ./views/partials/planList.hbs

```
<div class="bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
            <thead class="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Descrição</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preço</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Duração</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th class="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800">
                {{#each plans}}
                <tr class="plan-row hover:bg-zinc-800/40 transition-colors"  
                    data-name="{{this.name}}" 
                    data-status="{{#if this.isActive}}active{{else}}inactive{{/if}}"
                    data-duration="{{this.durationMonths}}"
                    data-price="{{this.price}}">
                    
                    <td class="px-5 py-3.5">
                        <p class="font-medium text-zinc-200 text-sm">{{this.name}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400 max-w-xs truncate">{{this.description}}</p>
                    </td>
                    <td class="px-5 py-3.5">
                        <p class="font-medium text-sm text-zinc-200">{{formatCurrency this.price}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        <p class="text-sm text-zinc-400">{{this.durationMonths}}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                        {{#if this.isActive}}
                            <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>
                        {{else}}
                            <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20">Inativo</span>
                        {{/if}}
                    </td>
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-1.5">
                            <button onclick="handleOpen('{{this.id}}', APP_CONFIG.PLANS)" class="p-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                            </button>
                            <button onclick="handleDelete('{{this.id}}', 'plans')" class="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Desativar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                    </td>
                </tr>
                {{else}}
                <tr>
                    <td colspan="6" class="p-6 text-center text-gray-500">Nenhum plano encontrado.</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
</div>
```

# Caminho: ./views/partials/weekPicker.hbs

```
<div>
  <label class="text-sm font-medium text-gray-700 block mb-1.5">Dias da semana*</label>
  <div class="flex flex-wrap gap-2" id="group-days-container">

    <label class="cursor-pointer">
      <input type="checkbox" value="Dom" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Dom</div>
    </label>    
    <label class="cursor-pointer">
      <input type="checkbox" value="Seg" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Seg</div>
    </label>

    <label class="cursor-pointer">
      <input type="checkbox" value="Ter" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Ter</div>
    </label>

    <label class="cursor-pointer">
      <input type="checkbox" value="Qua" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Qua</div>
    </label>

    <label class="cursor-pointer">
      <input type="checkbox" value="Qui" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Qui</div>
    </label>

    <label class="cursor-pointer">
      <input type="checkbox" value="Sex" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Sex</div>
    </label>

    <label class="cursor-pointer">
      <input type="checkbox" value="Sab" class="peer sr-only" name="daysOfWeek">
      <div class="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition-colors">Sáb</div>
    </label>
  </div>
</div>

```

# Caminho: ./views/partials/timePicker.hbs

```
<div>
  <label class="text-sm font-medium text-zinc-400 block mb-1.5">*{{name}}</label>
  <div class="flex items-center gap-3">
    <input type="time" id="{{id-start}}" class="flex-1 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 transition-colors [color-scheme:dark]">
    <span class="text-zinc-500">até</span>
    <input type="time" id="{{id-end}}" class="flex-1 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-zinc-900/50 text-zinc-100 transition-colors [color-scheme:dark]">
  </div>
</div>
```

# Caminho: ./routes/adminRoutes.ts

```
import { AdminController } from "@controllers/adminController";
import { auth } from "@middlewares/auth";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const admin = new AdminController();

export const apiAdminRoutes = Router()
  .use(auth)
  .get("/:id", tryCatch(admin.getAdmin))
  .patch("/:id", tryCatch(admin.updateAdmin))
  .delete("/:id", tryCatch(admin.deleteAdmin));

```

# Caminho: ./routes/configRoutes.ts

```
import { ConfigController } from "@controllers/configController";
import { auth } from "@middlewares/auth";
import { requireRole } from "@middlewares/requireAuth";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const config = new ConfigController();

// API routes (JSON)
export const apiConfigRoutes = Router()
  .use(auth)
  .get("/academy", tryCatch(config.getAcademy))
  .patch("/academy", requireRole("OWNER", "ADMIN"), tryCatch(config.updateAcademy))
  .get("/users", requireRole("OWNER", "ADMIN"), tryCatch(config.listAdmins))
  .post("/users", requireRole("OWNER", "ADMIN"), tryCatch(config.createAdmin))
  .patch("/users/:id/deactivate", requireRole("OWNER", "ADMIN"), tryCatch(config.deactivateAdmin))
  .patch("/users/:id/reactivate", requireRole("OWNER", "ADMIN"), tryCatch(config.reactivateAdmin))
  .post("/change-password", tryCatch(config.changePassword));

```

# Caminho: ./routes/studentRoutes.ts

```
import { StudentController } from "@controllers/studentController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { renderPage } from "@middlewares/renderPage";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const student = new StudentController();

export const apiStudentRoutes = Router()
  .use(auth)
  .post("/", tryCatch(student.createStudent))
  .get("/", tryCatch(student.getAllStudents))
  .get("/:id", tryCatch(student.getStudent))
  .patch("/:id", tryCatch(student.updateStudent))
  .delete("/:id", tryCatch(student.deleteStudent));

export const studentRoutes = Router().get(
  "/",
  renderApi(
    ["/api/students", "/api/groups"],
    "pages/students/index",
    ["students", "groups"],
    {
      emptyMessage: "Nenhum estudante cadastrado até o momento.",
      category: "Students.",
    },
  ),
);

```

# Caminho: ./routes/dashboardRoutes.ts

```
import { Router } from "express";
import { DashboardController } from "@controllers/dashboardController";
import { tryCatch } from "@middlewares/tryCatch";
import { renderApi } from "@middlewares/renderApi";
import { auth } from "@middlewares/auth";

const dashboard = new DashboardController();

export const apiDashboardRoutes = Router()
  .use(auth)
  .get("/", tryCatch(dashboard.getDashboard));

export const dashboardRoutes = Router()
  .get(
    "/",
    renderApi("/api/dashboard", "pages/dashboard/index", "dashboard", {
      emptyMessage: "Nenhuma informação encontrada para o dashboard.",
      category: "Dashboard.",
    })
  )
```

# Caminho: ./routes/configPageRoutes.ts

```
import { renderApi } from "@middlewares/renderApi";
import { requireRole } from "@middlewares/requireAuth";
import { Router } from "express";

export const configPageRoutes = Router()
  .get(
    "/",
    renderApi("/api/config/academy", "pages/config/index", "academy"),
  )
  .get(
    "/users",
    requireRole("OWNER", "ADMIN"),
    renderApi("/api/config/users", "pages/config/users", "users"),
  );

```

# Caminho: ./routes/planRoutes.ts

```
import { Router } from "express";
import { PlanController } from "@controllers/planController";
import { tryCatch } from "@middlewares/tryCatch";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";

const plan = new PlanController();

export const apiPlanRoutes = Router()
  .use(auth)
  .post("/", tryCatch(plan.createPlan))
  .get("/", tryCatch(plan.getAllPlans))
  .get("/:id", tryCatch(plan.getPlan))
  .patch("/:id", tryCatch(plan.updatePlan))
  .delete("/:id", tryCatch(plan.deletePlan));

export const planRoutes = Router()
  .get(
    "/",
    renderApi("/api/plans", "pages/plans/index", "plans", {
      emptyMessage: "Nenhum plano cadastrado até o momento.",
      category: "Plans",
      viewData: {
        durationMonths: [
          "Mensal",
          "Trimestral",
          "Semestral",
          "Anual"
        ],
      },
    }),
  );

```

# Caminho: ./routes/authRoutes.ts

```
import { AuthController } from "@controllers/authController";
import { rateLimitAuth } from "@middlewares/rateLimit";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const auth = new AuthController();

export const apiAuthRoutes = Router()
  .post("/setup", rateLimitAuth, tryCatch(auth.setup))
  .post("/login", rateLimitAuth, tryCatch(auth.login))
  .post("/forgot-password", rateLimitAuth, tryCatch(auth.forgotPassword))
  .post("/reset-password", rateLimitAuth, tryCatch(auth.resetPassword))
  .post("/logout", tryCatch(auth.logout));

```

# Caminho: ./routes/index.ts

```
import {
  requireAuth,
  requireSetupComplete,
  requireSetupIncomplete,
} from "@middlewares/requireAuth";
import { Router } from "express";
import { apiAdminRoutes } from "./adminRoutes";
import { apiAuthRoutes } from "./authRoutes";
import { apiConfigRoutes } from "./configRoutes";
import { apiDashboardRoutes, dashboardRoutes } from "./dashboardRoutes";
import { apiGroupRoutes, groupRoutes } from "./groupRoutes";
import { apiPlanRoutes, planRoutes } from "./planRoutes";
import { apiScheduleRoutes, scheduleRoutes } from "./scheduleRoutes";
import { apiStudentRoutes, studentRoutes } from "./studentRoutes";
import { apiSubscriptionRoutes, subscriptionRoutes } from "./subscriptionRoutes";
import { configPageRoutes } from "./configPageRoutes";

export const appRouter = Router();

// API
appRouter.use("/api/auth", apiAuthRoutes);
appRouter.use("/api/admins", apiAdminRoutes);
appRouter.use("/api/config", apiConfigRoutes);
appRouter.use("/api/dashboard", apiDashboardRoutes);
appRouter.use("/api/students", apiStudentRoutes);
appRouter.use("/api/groups", apiGroupRoutes);
appRouter.use("/api/schedules", apiScheduleRoutes);
appRouter.use("/api/plans", apiPlanRoutes);
appRouter.use("/api/subscriptions", apiSubscriptionRoutes);

// AUTH PAGES (public)
appRouter.get("/setup", requireSetupIncomplete, (req, res) =>
  res.render("pages/auth/setup", { layout: "auth" }),
);
appRouter.get("/login", requireSetupComplete, (req, res) =>
  res.render("pages/auth/login", { layout: "auth" }),
);
appRouter.get("/forgot-password", requireSetupComplete, (req, res) =>
  res.render("pages/auth/forgot-password", { layout: "auth" }),
);
appRouter.get("/reset-password", requireSetupComplete, (req, res) => {
  const token = req.query.token as string | undefined;
  res.render("pages/auth/reset-password", { layout: "auth", token: token ?? "" });
});

// ROOT
appRouter.get("/", requireAuth, (req, res) => res.redirect("/dashboard"));

// FRONT (protected)
appRouter.use("/dashboard", requireAuth, dashboardRoutes);
appRouter.use("/students", requireAuth, studentRoutes);
appRouter.use("/groups", requireAuth, groupRoutes);
appRouter.use("/plans", requireAuth, planRoutes);
appRouter.use("/subscriptions", requireAuth, subscriptionRoutes);
appRouter.use("/schedules", requireAuth, scheduleRoutes);
appRouter.use("/config", requireAuth, configPageRoutes);

```

# Caminho: ./routes/groupRoutes.ts

```
import { GroupController } from "@controllers/groupController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const group = new GroupController();

// API ROUTES
export const apiGroupRoutes = Router()
  .use(auth)
  .post("/", tryCatch(group.createGroup))
  .get("/", tryCatch(group.getAllGroups))
  .get("/:id", tryCatch(group.getGroup))
  .patch("/:id", tryCatch(group.updateGroup))
  .delete("/:id", tryCatch(group.deleteGroup));

// SSR ROUTES
export const groupRoutes = Router()
  .get(
    "/",
    renderApi("/api/groups", "pages/groups/index", "groups", {
      emptyMessage: "Nenhum grupo cadastrado até o momento.",
      category: "Groups.",
    }),
  );

```

# Caminho: ./routes/subscriptionRoutes.ts

```
import { Router } from "express";
import { SubscriptionController } from "@controllers/subscriptionController";
import { tryCatch } from "@middlewares/tryCatch";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";

const subscription = new SubscriptionController();

export const apiSubscriptionRoutes = Router()
  .use(auth)
  .post("/", tryCatch(subscription.createSubscription))
  .get("/", tryCatch(subscription.getAllSubscriptions))
  .get("/:id", tryCatch(subscription.getSubscription))
  .patch("/:id", tryCatch(subscription.updateSubscription))
  .delete("/:id", tryCatch(subscription.deleteSubscription));

export const subscriptionRoutes = Router()
  .get(
    "/",
    renderApi("/api/subscriptions", "pages/subscriptions/index", "subscriptions", {
      emptyMessage: "Nenhum grupo cadastrado até o momento.",
      category: "Subscriptions.",
    }),
  );

```

# Caminho: ./routes/scheduleRoutes.ts

```
import { ScheduleController } from "@controllers/scheduleController";
import { auth } from "@middlewares/auth";
import { renderApi } from "@middlewares/renderApi";
import { tryCatch } from "@middlewares/tryCatch";
import { Router } from "express";

const schedule = new ScheduleController();

export const apiScheduleRoutes = Router()
  .use(auth)
  .post("/", tryCatch(schedule.createSchedule))
  .get("/", tryCatch(schedule.getAllSchedules))
  .get("/:id", tryCatch(schedule.getSchedule))
  .patch("/:id", tryCatch(schedule.updateSchedule))
  .delete("/:id", tryCatch(schedule.deleteSchedule));

// SSR ROUTES
export const scheduleRoutes = Router().get(
  "/",
  renderApi(["/api/schedules", "/api/groups"], "pages/schedules/index", ["schedules", "groups"], {
    emptyMessage: "Nenhuma aula cadastrada até o momento.",
    category: "Agenda de Aulas.",
  }),
);

```

# Caminho: ./services/groupService.ts

```
import { GroupDTO } from "@dtos/group";
import { Group } from "@models/group";
import { Student } from "@models/student";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";

export class GroupServices {
  // CREATE
  create = async (groupData: Partial<GroupDTO>) => {
    const existingGroup = await Group.count({
      where: { name: groupData.name },
    });

    if (existingGroup > 0) throw new AppError("Group Already exists", 409);
    const createGroup = await Group.create(groupData);

    return createGroup;
  };

  // GET ALL
  getAll = async () => {
    const groups = await Group.findAll();

    return groups;
  };

  // GET BY ID
  get = async (id: string) => {
    const group = await Group.findByPk(id);

    if (!group) throw new AppError("Group not found", 404);

    return group;
  };

  // UPDATE
  update = async (id: string, groupData: Partial<GroupDTO>) => {
    const group = await Group.findByPk(id);
    if (!group) throw new AppError("Group not found", 404);
    if (groupData.name && groupData.name !== group.name) {
      const existingGroup = await Group.count({
        where: { name: groupData.name },
      });

      if (existingGroup > 0) throw new AppError("Group Already exists", 409);
    }

    if (groupData.maxCapacity) {
      const activeStudents = await Student.count({
        where: { groupId: id, enrollment: "ACTIVE" },
      });

      if (groupData.maxCapacity < activeStudents) {
        throw new AppError(
          `Cannot reduce capacity below current active students (${activeStudents})`,
          400,
        );
      }
    }

    const updatedGroup = await group.update(groupData);

    return updatedGroup;
  };

  // SOFT DELETE
  delete = async (id: string) => {
    const group = await Group.findByPk(id);
    if (!group) throw new Error("Group not found");

    const activeStudents = await Student.count({
      where: { groupId: id, enrollment: "ACTIVE" },
    });

    if (activeStudents > 0) {
      throw new AppError(
        "Cannot deactivate a group that has active students",
        400,
      );
    }

    await group.update({ isActive: false });
  };
}

```

# Caminho: ./services/planService.ts

```
import { Plan } from "@models/plan";
import { Subscription } from "@models/subscription";
import { PlanDTO } from "@dtos/plan";
import { AppError } from "@utils/appError";

export class PlanService {
  create = async (planData: Partial<PlanDTO>) => {
    const existingPlan = await Plan.count({
      where: { name: planData.name },
    });

    if (existingPlan > 0) throw new AppError("Plan Already exists", 409);

    const createdPlan = await Plan.create({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      durationMonths: planData.durationMonths,
      isActive: planData.isActive ?? true,
    });

    return createdPlan;
  };

  getAll = async () => {
    const plans = await Plan.findAll();
    return plans;
  };

  get = async (id: string) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) throw new AppError("Plan not found", 404);
    
    return plan;
  };

  update = async (id: string, planData: Partial<PlanDTO>) => {
    const plan = await Plan.findByPk(id);

    if (plan === null) throw new AppError("Plan not found", 404);

    if (planData.name && planData.name !== plan.name) {
      const existingPlan = await Plan.count({
        where: { name: planData.name },
      });

      if (existingPlan > 0) throw new AppError("Plan Already exists", 409);
    }

    await plan.update({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      durationMonths: planData.durationMonths,
      isActive: planData.isActive,
    });

    return plan;
  };

  delete = async (id: string) => {
    const plan = await Plan.findByPk(id);
    if (plan === null) throw new AppError("Plan not found", 404);

    const activeSubscriptions = await Subscription.count({
      where: { planId: id, status: "ACTIVE" },
    });

    if (activeSubscriptions > 0) throw new AppError("Cannot deactivate a plan with active subscriptions", 400);

    await plan.update({ isActive: false });
  };
}
```

# Caminho: ./services/tokenService.ts

```
import { sequelize } from "@config/database";
import { PasswordReset } from "@models/passwordReset";
import type { UUID } from "crypto";
import { createHash, randomBytes } from "crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export class TokenService {
  generate(): string {
    return randomBytes(32).toString("hex");
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async create(adminId: UUID): Promise<string> {
    const token = this.generate();
    const tokenHash = this.hash(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await sequelize.transaction(async (t) => {
      await PasswordReset.destroy({ where: { adminId }, transaction: t });
      await PasswordReset.create({ adminId, tokenHash, expiresAt }, { transaction: t });
    });

    return token;
  }

  async consume(
    token: string,
  ): Promise<{ adminId: UUID } | null> {
    const tokenHash = this.hash(token);
    const record = await PasswordReset.findOne({ where: { tokenHash } });

    if (!record) return null;
    if (record.usedAt) return null;
    if (new Date() > record.expiresAt) return null;

    await record.update({ usedAt: new Date() });

    return { adminId: record.adminId };
  }
}

```

# Caminho: ./services/adminServices.ts

```
import { AdminDTO } from "@dtos/admin";
import { AdminMapper } from "@utils/mappers/admin";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { Op } from "sequelize";

export class AdminServices {
  private safeAdmin = AdminMapper.toSafeObject
  
  get = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw new AppError("Admin not found", 404);

    return this.safeAdmin(admin);
  };

  update = async (id: string, adminData: Partial<AdminDTO>) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw new AppError("Admin not found", 404);

    const phoneChanged = adminData.phone && adminData.phone !== admin.phone;
    const emailChanged = adminData.email && adminData.email !== admin.email;

    if (phoneChanged || emailChanged) {
      const orConditions = [];
      if (phoneChanged) orConditions.push({ phone: adminData.phone });
      if (emailChanged) orConditions.push({ email: adminData.email });

      const existing = await Admin.findOne({ where: { [Op.or]: orConditions } });
      if (existing) throw new AppError("Phone or email already in use", 409);
    }

    const dataToUpdate = { ...adminData };

    if (adminData.password) {
      if (!adminData.oldPassword) throw new AppError("Old password is required to change password", 400);

      const isPasswordValid = await compareHashPasswords(adminData.oldPassword!, admin.password);
      if (!isPasswordValid) throw new AppError("Old password is incorrect", 401);

      dataToUpdate.password = await generateHashPassword(adminData.password);
    }

    delete dataToUpdate.oldPassword;

    const updatedAdmin = await admin.update(dataToUpdate);

    return this.safeAdmin(updatedAdmin);
  };

  delete = async (id: string) => {
    const admin = await Admin.findByPk(id);
    if (!admin) throw new AppError("Admin not found", 404);
    await admin.update({ isActive: false });
  };
}

```

# Caminho: ./services/subscriptionService.ts

```
import { Subscription } from "@models/subscription";
import { SubscriptionDTO } from "@dtos/subscription";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { Student } from "@models/student";
import { Plan } from "@models/plan";
import { Op } from "sequelize";

export class SubscriptionService {
  create = async (subscriptionData: Partial<SubscriptionDTO>) => {
    const existingSubscription = await Subscription.count({
      where: { studentId: subscriptionData.studentId, status: { [Op.ne]: "CANCELLED" } },
    });

    if (existingSubscription > 0)
      throw new AppError("Subscription already active", 409);

    const student = await Student.findByPk(subscriptionData.studentId);
    if (!student || !student.isActive) throw new AppError("Student not found", 404);

    const plan = await Plan.findByPk(subscriptionData.planId);
    if (!plan  || !plan.isActive) throw new AppError("Plan not found", 404);

    const createdSubscription = await Subscription.create(subscriptionData);

    return createdSubscription;
  };

  getAll = async () => {
    const subscriptions = await Subscription.findAll();

    return subscriptions;
  };

  get = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw new AppError("Subscription not found", 404);

    return subscription;
  };

  update = async (id: string, subscriptionData: Partial<SubscriptionDTO>) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw new AppError("Subscription not found", 404);

    if (subscriptionData.studentId) {
      const student = await Student.findByPk(subscriptionData.studentId);
      if (!student || !student.isActive) throw new AppError("Student not found", 404);
    }

    if (subscriptionData.planId) {
      const plan = await Plan.findByPk(subscriptionData.planId);
      if (!plan) throw new AppError("Plan not found", 404);
    }

    const updatedSubscription = await subscription.update(subscriptionData);

    return updatedSubscription;
  };

  delete = async (id: string) => {
    const subscription = await Subscription.findByPk(id);

    if (subscription === null)
      throw new AppError("Subscription not found", 404);

    await subscription.update({ status: "CANCELLED" });
  };
}

```

# Caminho: ./services/studentServices.ts

```
import { StudentDTO } from "@dtos/student";
import { Group } from "@models/group";
import { Student } from "@models/student";
import { Subscription } from "@models/subscription";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { Op } from "sequelize";

export class StudentServices {
  create = async (studentData: Partial<StudentDTO>) => {
    const existingStudent = await Student.count({
      where: { phone: studentData.phone },
    });

    if (existingStudent > 0) throw new AppError("Student Already exists", 409);

    const group = await Group.findByPk(studentData.groupId);
    if (!group) throw new AppError("Group not found", 404);

    const activeStudentsInGroup = await Student.count({
      where: { groupId: studentData.groupId, enrollment: "ACTIVE" },
    });

    if (activeStudentsInGroup >= group.maxCapacity) {
      throw new AppError("Group has reached maximum capacity", 400);
    }

    const createStudent = await Student.create(studentData);

    return createStudent;
  };

  get = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) throw new AppError("Student not found", 404);

    return student;
  };

  getAll = async () => {
    const students = await Student.findAll({
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["name"],
        },
      ],
    });
    return students;
  };

  update = async (id: string, studentData: Partial<StudentDTO>) => {
    const student = await Student.findByPk(id);
    if (student === null) throw new AppError("Student not found", 404);
    if (studentData.phone && studentData.phone !== student.phone) {
      const existingStudent = await Student.findOne({
        where: { phone: studentData.phone },
      });

      if (existingStudent) throw new AppError("Phone already in use", 409);
    }

    const changingGroup =
      studentData.groupId && studentData.groupId !== student.groupId;
    const activatingStudent =
      studentData.enrollment === "ACTIVE" && student.enrollment !== "ACTIVE";

    if (changingGroup || activatingStudent) {
      const targetGroupId = studentData.groupId || student.groupId;

      const group = await Group.findByPk(targetGroupId);
      if (!group) throw new AppError("Group not found", 404);

      const activeStudentsInGroup = await Student.count({
        where: { groupId: targetGroupId, enrollment: "ACTIVE" },
      });

      if (activeStudentsInGroup >= group.maxCapacity) {
        throw new AppError("Group has reached maximum capacity", 400);
      }
    }

    const updatedStudent = await student.update(studentData);

    return updatedStudent;
  };

  delete = async (id: string) => {
    const student = await Student.findByPk(id);
    if (student === null) throw new AppError("Student not found", 404);
    await student.update({ isActive: false, enrollment: "INACTIVE" });

    await Subscription.update(
      { status: "CANCELLED" },
      { where: { studentId: id, status: { [Op.ne]: "CANCELLED" } } },
    );
  };
}

```

# Caminho: ./services/configService.ts

```
import { Academy } from "@models/academy";
import { Admin } from "@models/admin";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import { AdminMapper } from "@mappers/admin";

export class ConfigService {
  private safeAdmin = AdminMapper.toSafeObject;

  getAcademy = async () => {
    const academy = await Academy.findOne();
    return academy;
  };

  updateAcademy = async (data: {
    name?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
  }) => {
    const academy = await Academy.findOne();
    if (!academy) throw new AppError("Academia não encontrada", 404);

    await academy.update(data);

    return academy;
  };

  listAdmins = async () => {
    const admins = await Admin.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "isActive",
        "phone",
        "createdAt",
      ],
      order: [["createdAt", "ASC"]],
    });
    return admins;
  };

  createAdmin = async (data: {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
  }) => {
    const existing = await Admin.findOne({ where: { email: data.email } });
    if (existing) throw new AppError("Email já cadastrado", 409);

    const passwordHash = await generateHashPassword(data.password);
    const admin = await Admin.create({
      name: data.name,
      email: data.email,
      password: passwordHash,
      isActive: true,
      role: data.role ?? "USER",
    });

    logger.info(`ConfigService: admin ${admin.id} created`);

    return this.safeAdmin(admin)
  };

  changePassword = async (
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ) => {
    const admin = await Admin.findByPk(adminId);
    if (!admin) throw new AppError("Usuário não encontrado", 404);

    const valid = await compareHashPasswords(currentPassword, admin.password);
    if (!valid) throw new AppError("Senha atual incorreta", 401);

    const passwordHash = await generateHashPassword(newPassword);
    await admin.update({ password: passwordHash });

    logger.info(`ConfigService: password changed for admin ${admin.id}`);
  };

  deactivateAdmin = async (targetId: string, requesterId: string) => {
    if (targetId === requesterId)
      throw new AppError(
        "Você não pode desativar sua própria conta",
        400,
      );

    const admin = await Admin.findByPk(targetId);
    if (!admin) throw new AppError("Usuário não encontrado", 404);
    if (admin.role === "OWNER")
      throw new AppError(
        "Não é possível desativar o proprietário",
        403,
      );

    await admin.update({ isActive: false });

    logger.info(
      `ConfigService: admin ${targetId} deactivated by ${requesterId}`,
    );
  };

  reactivateAdmin = async (targetId: string) => {
    const admin = await Admin.findByPk(targetId);
    if (!admin) throw new AppError("Usuário não encontrado", 404);

    await admin.update({ isActive: true });
  };
}

```

# Caminho: ./services/scheduleService.ts

```
import { ScheduleDTO } from "@dtos/schedule";
import { Schedule } from "@models/schedules";
import { Group } from "@models/group";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";

export class ScheduleService {
  create = async (scheduleData: Partial<ScheduleDTO>) => {
    const group = await Group.findByPk(scheduleData.groupId);
    if (!group) throw new AppError("Group not found", 404);

    const createdSchedule = await Schedule.create(scheduleData);

    return createdSchedule;
  };

  getAll = async () => { 
    const schedules = await Schedule.findAll({
      include: [{ model: Group, as: "group", attributes: ["name", "maxCapacity"] }],
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return schedules;
  };

  get = async (id: string) => {
    const schedule = await Schedule.findByPk(id, {
      include: [{ model: Group, as: "group" }],
    });

    if (schedule === null) throw new AppError("Schedule not found", 404);

    return schedule;
  };

  update = async (id: string, scheduleData: Partial<ScheduleDTO>) => {
    const schedule = await Schedule.findByPk(id);
    if (schedule === null) throw new AppError("Schedule not found", 404);

    if (scheduleData.groupId) {
      const group = await Group.findByPk(scheduleData.groupId);
      if (!group) throw new AppError("Group not found", 404);
    }

    const updatedSchedule = await schedule.update(scheduleData);

    return updatedSchedule;
  };

  delete = async (id: string) => {
    const schedule = await Schedule.findByPk(id);
    if (schedule === null) throw new AppError("Schedule not found", 404);

    await schedule.destroy();
  };
}
```

# Caminho: ./services/dashboardService.ts

```
import { Op } from "sequelize";
import { Student } from "@models/student";
import { Group } from "@models/group";
import { Plan } from "@models/plan";
import { Schedule } from "@models/schedules";
import { Subscription } from "@models/subscription";
import { formatBRL } from "@utils/currency";

export class DashboardService {
  getDashboard = async () => {
    const now = new Date();

    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
    );

    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    const startOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
      ),
    );

    const [
      totalStudents, // contagem de alunos ativos
      totalLessons, // contagem total de aulas
      totalPlans, // contagem de planos ativos
      pendingCount, // contagem de mensalidades pendentes
      paidCount, // contagem de mensalidades pagas
      totalActiveSubscriptions, // contagem de mensalidades ativas
      estimatedRaw, // soma dos valores de todas mensalidades ativas (receita estimada)
      receivedRaw, // soma dos valores recebidos no mês atual
      groupsWithStudents, // turmas ativas com seus alunos (para o gráfico)
      activePlansData, // planos ativos com suas mensalidades (para o gráfico)
      renewalSubs, // próximas renovações
      upcomingClassesData, // próximas aulas
    ] = await Promise.all([
      Student.count({ where: { isActive: true } }),

      Schedule.count(),

      Plan.count({ where: { isActive: true } }),

      Subscription.count({ where: { status: "PENDING" } }),

      Subscription.count({
        where: {
          status: "PAID",
          renovationDate: { [Op.between]: [startOfMonth, endOfMonth] },
        },
      }),

      Subscription.count({ where: { status: { [Op.ne]: "CANCELLED" } } }),

      // Soma o valor de todas as mensalidades ativas — receita estimada mensal
      Subscription.sum("subscriptionValue", {
        where: { status: { [Op.ne]: "CANCELLED" } },
      }),

      // Soma o valor das mensalidades pagas no mês atual
      Subscription.sum("subscriptionValue", {
        where: {
          status: "PAID",
          renovationDate: { [Op.between]: [startOfMonth, endOfMonth] },
        },
      }),

      Group.findAll({
        where: { isActive: true },
        include: [{ model: Student, as: "students", attributes: ["id"] }],
        attributes: ["id", "name", "daysOfWeek"],
      }),

      Plan.findAll({
        where: { isActive: true },
        include: [
          {
            model: Subscription,
            as: "subscriptions",
            where: { status: { [Op.ne]: "CANCELLED" } },
            required: false,
            attributes: ["id"],
          },
        ],
        attributes: ["id", "name"],
      }),

      Subscription.findAll({
        where: {
          renovationDate: { [Op.between]: [startOfToday, endOfMonth] },
          status: { [Op.or]: ["PENDING", "PAID"] },
        },
        include: [
          { model: Student, as: "student", attributes: ["name"] },
          { model: Plan, as: "plan", attributes: ["name"] },
        ],
        limit: 5,
        order: [["renovationDate", "ASC"]],
      }),

      Schedule.findAll({
        include: [{ model: Group, as: "group", attributes: ["name"] }],
        limit: 5,
        order: [
          ["dayOfWeek", "ASC"],
          ["startTime", "ASC"],
        ],
      }),
    ]);

    // Formatação dos dados para os gráficos
    const totalClasses = groupsWithStudents.length;

    const studentsPerGroup = groupsWithStudents.map((g: any) => ({
      label: `${g.daysOfWeek}`,
      count: g.students?.length ?? 0,
    }));

    const planDistribution = activePlansData
      .filter((p: any) => (p.subscriptions?.length ?? 0) > 0)
      .map((p: any) => ({
        label: p.name,
        count: p.subscriptions.length,
      }));

    const upcomingRenewals = renewalSubs.map((s: any) => ({
      student: s.student?.name ?? "—",
      plan: s.plan?.name ?? "—",
      value: formatBRL(s.subscriptionValue), // Pegando o valor da assinatura
      expiresAt: new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(s.renovationDate),
      ),
    }));

    const recentClasses = upcomingClassesData.map((s: any, index: number) => ({
      day: s.dayOfWeek,
      number: String(index + 1).padStart(2, "0"),
      name: s.group?.name ?? "—",
      month: s.startTime.substring(0, 5), // Usando o slot de 'mês' do template para o Horário
    }));

    const monthRaw = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
    }).format(now);

    return {
      totalStudents,
      totalClasses,
      totalLessons,
      totalPlans,
      totalGroups: totalClasses,
      activeGroups: totalClasses,
      activePlans: totalPlans,
      totalSubscriptions: totalActiveSubscriptions,
      activeSubscriptions: totalActiveSubscriptions,
      studentsPerGroup,
      planDistribution,
      receivedAmount: formatBRL(receivedRaw || 0),
      paidCount: paidCount,
      pendingCount,
      estimatedRevenue: formatBRL(estimatedRaw || 0),
      currentMonth: monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1),
      upcomingRenewals,
      recentClasses: recentClasses,
    };
  };
}

```

# Caminho: ./services/authServices.ts

```
import { Academy } from "@models/academy";
import { Admin } from "@models/admin";
import { env } from "@utils/env";
import { compareHashPasswords, generateHashPassword } from "@utils/encrypt";
import { logger } from "@utils/logger";
import { AppError } from "@utils/appError";
import jwt from "jsonwebtoken";
import { MailClient } from "@config/mail";
import { TokenService } from "./tokenService";
import { signToken } from "@utils/auth";
import { template } from "@utils/mail";

export class AuthServices {
  constructor(
    private readonly tokenService = new TokenService(),
    private readonly mailClient = new MailClient(),
  ) {}

  setup = async (data: {
    academyName: string;
    name: string;
    email: string;
    password: string;
  }) => {
    let setupDone = false;
    const count = await Admin.count();
    (count > 0) ? setupDone = true : setupDone = false;
    
    if (setupDone) throw new AppError("Sistema já configurado", 409);

    const passwordHash = await generateHashPassword(data.password);

    const [admin] = await Promise.all([
      Admin.create({ name: data.name, email: data.email, password: passwordHash, isActive: true, role: "OWNER" }),
      Academy.create({ name: data.academyName }),
    ]);

    logger.info(`Setup: owner ${admin.id} created`);

    const token = signToken(admin);

    return { data: {token}};
  };

  login = async (credentials: { email: string; password: string }) => {
    const GENERIC_ERROR = "Email ou senha incorretos";

    const admin = await Admin.findOne({ where: { email: credentials.email, isActive: true } });

    if (!admin) {
      await generateHashPassword("dummy_bcrypt_delay_constant");
      logger.warn(`Login failed: email not found [${credentials.email}]`);
      throw new AppError(GENERIC_ERROR, 401);
    }

    const passwordMatch = await compareHashPasswords(credentials.password, admin.password);
    if (!passwordMatch) {
      logger.warn(`Login failed: wrong password for admin ${admin.id}`);
      throw new AppError(GENERIC_ERROR, 401);
    }

    const token = signToken(admin);
    logger.info(`Login: admin ${admin.id} authenticated`);

    return {
      data: { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } },
    };
  };

  forgotPassword = async (email: string, baseUrl: string) => {
    const admin = await Admin.findOne({ where: { email, isActive: true } });

    // Always return 200 to prevent user enumeration
    if (!admin) {
      throw new AppError("Admin Required", 200);
    }

    const token = await this.tokenService.create(admin.id);
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = template(admin.name, resetUrl);

    await this.mailClient.sendMail(admin.email, admin.name, html);

    logger.info(`ForgotPassword: reset link sent to admin ${admin.id}`);
  };

  resetPassword = async (token: string, newPassword: string) => {
    const result = await this.tokenService.consume(token as `${string}`);

    if (!result) throw new AppError("Token inválido ou expirado", 400);

    const admin = await Admin.findByPk(result.adminId);
    if (!admin || !admin.isActive) throw new AppError("Usuário não encontrado", 404);

    const passwordHash = await generateHashPassword(newPassword);
    await admin.update({ password: passwordHash });

    logger.info(`ResetPassword: password updated for admin ${admin.id}`);
  };
}

```

# Caminho: ./llm.sh

```
#!/bin/bash

# Define o nome do arquivo de saída
OUTPUT="claude.md"

# Limpa o arquivo de saída e garante codificação UTF-8
> "$OUTPUT"

# Encontra todos os arquivos e processa com iconv para garantir limpeza de codificação
find . -type f ! -name "$OUTPUT" -not -path '*/.*' -not -path '*/node_modules/*' -not -path '*/specs/*' -not -path '*/llm.sh/*' | while read -r file; do
    echo "Processando: $file"
    
    # Adiciona o caminho como título no Markdown
    echo -e "\n# Caminho: $file\n" >> "$OUTPUT"
    
    # Adiciona o conteúdo do arquivo
    echo '```' >> "$OUTPUT"
    
    # O comando iconv -c converte o arquivo para UTF-8 e descarta caracteres inválidos
    # Isso elimina os caracteres estranhos (â€") que você viu
    cat "$file" | iconv -c -t UTF-8 >> "$OUTPUT" 2>/dev/null
    
    echo -e '\n```' >> "$OUTPUT"
done

echo "Concluído! Arquivo gerado: $OUTPUT"
```
