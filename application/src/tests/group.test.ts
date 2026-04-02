import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../app";

describe("Group API", () => {
  let createdGroupId: string;

  const mockGroup = {
    name: "Grupo Teste",
    description: "Descrição teste",
  };

  it("should create a group", async () => {
    const response = await request(app)
      .post("/api/groups")
      .send(mockGroup);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    createdGroupId = response.body.id;
  });

  it("should return all groups", async () => {
    const response = await request(app).get("/api/groups");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return a group by id", async () => {
    const response = await request(app).get(
      `/api/groups/${createdGroupId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdGroupId);
  });

  it("should update a group", async () => {
    const response = await request(app)
      .patch(`/api/groups/${createdGroupId}`)
      .send({ name: "Grupo Atualizado" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Grupo Atualizado");
  });

  it("should delete a group", async () => {
    const response = await request(app).delete(
      `/api/groups/${createdGroupId}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });
});