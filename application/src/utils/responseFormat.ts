export interface IResponseFmt {
  statusCode: number;
  message: string;
  data?: null | any;
}

export class responseFormat {
  static send(params: IResponseFmt): IResponseFmt; // object-like
  static send(message: string, statusCode: number, data?: any): IResponseFmt; // positional-like

  static send(arg1: IResponseFmt | string, arg2?: number, arg3?: any): IResponseFmt {
    if (typeof arg1 === "string") {
      return {
        message: arg1,
        statusCode: arg2 ?? 200,
        data: arg3 !== undefined ? arg3 : null,
      };
    }

    return {
      statusCode: arg1.statusCode,
      message: arg1.message,
      data: arg1.data !== undefined ? arg1.data : null,
    };
  }

  static error(message: string, statusCode: number = 500): never {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    throw error;
  }
}