export interface IResponseFmt {
  statusCode: number;
  message: string;
  data?: null | any;
}

export const responseFormat = ({ message, statusCode, data }: IResponseFmt) => {
  return {
    statusCode: statusCode,
    message,
    data,
  };
};
