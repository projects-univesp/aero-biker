import { Group } from "@models/group";
import { groupSchema, GroupDTO } from "@utils/groupSchema";

export class GroupService {
  // CREATE
  static async create(data: GroupDTO): Promise<Group> {
    const validated = groupSchema.parse(data);

    const group = await Group.create(validated);

    return group;
  }

  // GET ALL
  static async findAll(): Promise<Group[]> {
    return await Group.findAll();
  }

  // GET BY ID
  static async findById(id: string): Promise<Group> {
    const group = await Group.findByPk(id);

    if (!group) {
      throw new Error("Group not found");
    }

    return group;
  }

  // UPDATE
  static async update(id: string, data: Partial<GroupDTO>): Promise<Group> {
    const group = await Group.findByPk(id);

    if (!group) {
      throw new Error("Group not found");
    }

    const validated = groupSchema.partial().parse(data);

    await group.update(validated);

    return group;
  }

  // SOFT DELETE
  static async remove(id: string): Promise<{ message: string }> {
    const group = await Group.findByPk(id);

    if (!group) {
      throw new Error("Group not found");
    }

    await group.update({ isActive: false });

    return { message: "Group deactivated successfully" };
  }
}
