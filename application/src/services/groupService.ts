import { GroupDTO } from "@dtos/group";
import { Group } from "@models/group";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";

export class GroupServices {
  // CREATE
  create = async (groupData: Partial<GroupDTO>) => {
    const existingGroup = await Group.count({
      where: { name: groupData.name },
    });

    if (existingGroup > 0) throw logger.error("Group Already exists", 409);
    const createGroup = await Group.create(groupData);

    return responseFormat({
      message: "Group created succesfully",
      statusCode: 201,
      data: createGroup,
    });
  };

  // GET ALL
    getAll = async () => {
    const groups = await Group.findAll();

    if (groups.length === 0) throw logger.error("Groups not found", 404);

    return responseFormat({
      message: "Groups found successfully",
      statusCode: 200,
      data: groups,
    });
  }

  // GET BY ID
    get = async (id: string) => {
    const group = await Group.findByPk(id);

    if (!group) throw logger.error("Group not found", 404);

    return responseFormat({
      message: "Group found successfully",
      statusCode: 200,
      data: group,
    });
  }

  // UPDATE
    update = async (id: string, groupData: GroupDTO) => {
    const group = await Group.findByPk(id);

    if (!group) throw logger.error("Group not found", 404);
    if (groupData.name && groupData.name !== group.name) {
      const existingGroup = await Group.count({
        where: { name: groupData.name },
      });

      if (existingGroup > 0) throw logger.error("Group Already exists", 409);
    }

    const updatedGroup = await group.update(groupData);

    return responseFormat({
      message: "Group updated succesfully",
      statusCode: 200,
      data: updatedGroup,
    });
  }

  // SOFT DELETE
    delete = async (id: string) => {
    const group = await Group.findByPk(id);
    if (!group) throw new Error("Group not found");
    await group.update({ isActive: false });

    return responseFormat({
      message: "Group deactivated succesfully",
      statusCode: 200,
    });
  }
}
