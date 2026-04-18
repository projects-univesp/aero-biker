import { AuthDTO } from "@dtos/auth";
import { Auth } from "@models/auth";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class AuthServices {
  login = async (authData: AuthDTO) => {
    const exsistAuth = await Auth.count({
      where: { name: authData.name },
    });
    
    return responseFormat({
      message: "Student created succesfully",
      statusCode: 201,
      data: createStudent,
    });
  };
}
