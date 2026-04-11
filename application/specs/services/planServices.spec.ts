import { PlanService } from "../../src/services/planService";

describe("PlanService", () => {
  let service: PlanService;

  beforeEach(() => {
    service = new PlanService();
  });

  it("should create a new plan", async () => {
    const plan = await service.create({
      name: "Plano Básico",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    });

    expect(plan).toHaveProperty("id");
    expect(plan.name).toBe("Plano Básico");
  });

  it("should not allow duplicate plans", async () => {
    await service.create({
      name: "Plano Pro",
      description: "Teste",
      price: 200,
      durationMonths: 2,
    });

    await expect(
      service.create({
        name: "Plano Pro",
        description: "Outro",
        price: 300,
        durationMonths: 3,
      })
    ).rejects.toThrow();
  });

  it("should return all active plans", async () => {
    await service.create({
      name: "Plano A",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    });

    const plans = await service.getAll();

    expect(plans.length).toBeGreaterThan(0);
  });

  it("should find a plan by id", async () => {
    const created = await service.create({
      name: "Plano ID",
      description: "Teste",
      price: 150,
      durationMonths: 2,
    });

    const found = await service.getById(created.id);

    expect(found).not.toBeNull();
    expect(found && found.id).toBe(created.id);
  });

  it("should update a plan", async () => {
    const created = await service.create({
      name: "Plano Update",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    });

    const updated = await service.update(created.id, {
      name: "Plano Atualizado",
    });

    expect(updated?.name).toBe("Plano Atualizado");
  });

  it("should soft delete a plan", async () => {
    const created = await service.create({
      name: "Plano Delete",
      description: "Teste",
      price: 100,
      durationMonths: 1,
    });

    await service.remove(created.id);

    const found = await service.getById(created.id);

    expect(found).toBeNull();
  });
});