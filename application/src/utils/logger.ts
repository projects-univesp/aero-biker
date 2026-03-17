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