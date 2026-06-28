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
