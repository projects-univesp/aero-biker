import { GroupServices } from "@services/groupService";
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
    const student = await this.groupServices.create(parsedGroup);
    return response.status(201).send(student);
  };

  getGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await this.groupServices.get(id);
    return response.status(200).send(group);
  };

  getAllGroups = async (request: Request, response: Response) => {
    const groups = await this.groupServices.getAll();
    return response.status(200).send(groups);
  };

  updateGroup = async (request: Request, response: Response) => {
    const parsedGroup = this.verifyData.verifyGroup(request.body)
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await this.groupServices.update(id, parsedGroup);
    return response.status(200).send(group);
  };

  deleteGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await this.groupServices.delete(id);
    return response.status(200).send(group);
  };
}
