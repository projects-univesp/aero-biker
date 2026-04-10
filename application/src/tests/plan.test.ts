import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../app";

describe("Plan API", () => {
  let createdPlanId: string;

  const mockPlan = {
    name: "Plano Teste",
    description: "Descrição teste",
    price: 100,
    durationMonths: 1,
  };

  it("should create a plan", async () => {
    const response = await request(app)
      .post("/api/plans")
      .send(mockPlan);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    createdPlanId = response.body.id;
  });

  it("should return all plans", async () => {
    const response = await request(app).get("/api/plans");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return a plan by id", async () => {
    const response = await request(app).get(
      `/api/plans/${createdPlanId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdPlanId);
  });

  it("should update a plan", async () => {
    const response = await request(app)
      .patch(`/api/plans/${createdPlanId}`)
      .send({ price: 150 });

    expect(response.status).toBe(200);
    expect(response.body.price).toBe(150);
  });

  it("should delete a plan", async () => {
    const response = await request(app).delete(
      `/api/plans/${createdPlanId}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });
});