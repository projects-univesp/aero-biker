import { describe, it, expect, vi, beforeEach } from "vitest";

import { GroupServices } from "@services/groupService";
import { Group } from "@models/group";

vi.mock("@models/group");

describe("Group Services - Create", () => {
  let groupServices: GroupServices;

  beforeEach(() => {
    vi.clearAllMocks();
    groupServices = new GroupServices();
  });

  it("Must create a group sucessfully", async () => {
    const groupData = {
      name: "Turma de Ciclismo 01",
      maxCapacity: 20,
      daysOfWeek: "Segunda e Quarta",
      time: "08:00",
      isActive: true,
    };

    vi.mocked(Group.count).mockResolvedValue(0);

    vi.mocked(Group.create).mockResolvedValue({
      id: "mock-uuid-123",
      ...groupData,
    } as any);

    const response = await groupServices.create(groupData);

    expect(response.statusCode).toBe(201);
    expect(response.message).toBe("Group created succesfully");
    expect(response.data.id).toBe("mock-uuid-123");
  });

  it("Must give a conflict error due same group registered", async () => {
    const groupData = {
      name: "Turma de Ciclismo 01",
      maxCapacity: 20,
      daysOfWeek: "Segunda e Quarta",
      time: "08:00",
      isActive: true,
    };

    vi.mocked(Group.count).mockResolvedValue(1);

    await expect(groupServices.create(groupData)).rejects.toThrow();

    expect(Group.create).not.toHaveBeenCalled();
  });
});

describe("Group Services - Get", () => {
  let groupServices: GroupServices;

  beforeEach(() => {
    vi.clearAllMocks();
    groupServices = new GroupServices();
  });

  it("Must get group information sucessfully", async () => {
    const fakeId = "mock-uuid-123";
    const fakeGroup = {
      id: fakeId,
      name: "Turma de Ciclismo Avançado",
      maxCapacity: 15,
      daysOfWeek: "Terça e Quinta",
      time: "18:00",
      isActive: true
    };

    vi.mocked(Group.findByPk).mockResolvedValue(fakeGroup as any);

    const response = await groupServices.get(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Group found successfully");
    expect(response.data.name).toBe("Turma de Ciclismo Avançado");
  });

  it("Must throw a 404 error if group is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Group.findByPk).mockResolvedValue(null);

    await expect(groupServices.get(fakeId)).rejects.toThrow();

    expect(Group.findByPk).toHaveBeenCalledWith(fakeId);
  });
});

describe("Group Services - GetAll", () => {
  let groupServices: GroupServices;

  beforeEach(() => {
    vi.clearAllMocks();
    groupServices = new GroupServices();
  });

  const mockGroups = [
    { id: "123", name: "Turma de Ciclismo 01", maxCapacity: 20, daysOfWeek: "Segunda e Quarta", time: "08:00" },
  ];

  it("Must get groups information sucessfully", async () => {
    vi.mocked(Group.findAll).mockResolvedValue(mockGroups as any);

    const response = await groupServices.getAll();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Groups found successfully");
  });

  it("Must throw a 404 error if groups are not found", async () => {
    vi.mocked(Group.findAll).mockResolvedValue([] as any);

    await expect(groupServices.getAll()).rejects.toThrow();
  });
});

describe("Group Services - Update", () => {
  let groupServices: GroupServices;

  beforeEach(() => {
    vi.clearAllMocks();
    groupServices = new GroupServices();
  });

  it("Must update a group sucessfully", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      name: "Turma de Ciclismo Modificada",
      time: "09:00",
    };

    const fakeGroupInstance = {
      id: fakeId,
      name: "Turma de Ciclismo 01",
      maxCapacity: 20,
      daysOfWeek: "Segunda e Quarta",
      time: "08:00",
      isActive: true,
      update: vi.fn().mockResolvedValue({
        id: fakeId,
        name: updateData.name,
        maxCapacity: 20,
        daysOfWeek: "Segunda e Quarta",
        time: updateData.time,
      }),
    };

    vi.mocked(Group.findByPk).mockResolvedValue(fakeGroupInstance as any);
    vi.mocked(Group.count).mockResolvedValue(0);

    const response = await groupServices.update(fakeId, updateData);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Group updated succesfully");
    expect(fakeGroupInstance.update).toHaveBeenCalledWith(updateData);
  });

  it("Must throw a 409 error if group name already exists", async () => {
    const fakeId = "mock-uuid-123";
    const updateData = {
      name: "Turma Concorrente",
    };

    const fakeGroupInstance = {
      id: fakeId,
      name: "Turma de Ciclismo 01",
    };

    vi.mocked(Group.findByPk).mockResolvedValue(fakeGroupInstance as any);
    vi.mocked(Group.count).mockResolvedValue(1); 

    await expect(groupServices.update(fakeId, updateData)).rejects.toThrow();
  });

  it("Must throw a 404 error if group is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Group.findByPk).mockResolvedValue(null);

    await expect(
      groupServices.update(fakeId, { name: "Teste" })
    ).rejects.toThrow();
  });
});

describe("Group Services - Delete", () => {
  let groupServices: GroupServices;

  beforeEach(() => {
    vi.clearAllMocks();
    groupServices = new GroupServices();
  });

  it("Must fake delete group information sucessfully", async () => {
    const fakeId = "mock-uuid-123";

    const fakeGroupInstance = {
      id: fakeId,
      update: vi.fn().mockResolvedValue(true),
    };

    vi.mocked(Group.findByPk).mockResolvedValue(fakeGroupInstance as any);

    const response = await groupServices.delete(fakeId);

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Group deactivated succesfully");
    expect(fakeGroupInstance.update).toHaveBeenCalledWith({
      isActive: false,
    });
  });

  it("Must throw a 404 error if group is not found", async () => {
    const fakeId = "non-existent-id";

    vi.mocked(Group.findByPk).mockResolvedValue(null);

    await expect(groupServices.delete(fakeId)).rejects.toThrow();
  });
});