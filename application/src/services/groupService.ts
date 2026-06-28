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
