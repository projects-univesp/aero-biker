import { GroupService } from "@services/groupService";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class GroupController {
  private readonly verifyData: VerifyData;

  constructor() {
    this.verifyData = new VerifyData();
  }

  createGroup = async (request: Request, response: Response) => {
    const group = await GroupService.create(request.body);
    return response.status(201).send(group);
  };

  getGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await GroupService.findById(id);
    return response.status(200).send(group);
  };

  getAllGroups = async (request: Request, response: Response) => {
    const groups = await GroupService.findAll();
    return response.status(200).send(groups);
  };

  updateGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const group = await GroupService.update(id, request.body);
    return response.status(200).send(group);
  };

  deleteGroup = async (request: Request, response: Response) => {
    const { id } = this.verifyData.verifyId(request.params.id);
    const result = await GroupService.remove(id);
    return response.status(200).send(result);
  };
}
