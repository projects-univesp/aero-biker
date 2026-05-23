import { sequelize } from "@config/database";
import { Group } from "@models/group";
import { Plan } from "@models/plan";
import { Schedule } from "@models/schedules";
import { Student } from "@models/student";
import { Subscription } from "@models/subscription";
import { responseFormat } from "@utils/responseFormat";

export class DashboardService {
  getDashboard = async () => {
    const totalStudents = (await Student.count()) ?? 0;

    const totalGroups = (await Group.count()) ?? 0;

    const totalPlans = (await Plan.count()) ?? 0;

    const totalLessons = (await Schedule.count()) ?? 0;

    const totalSubscriptions = (await Subscription.count()) ?? 0;

    const activeGroups =
      (await Group.count({ where: { isActive: true } })) ?? 0;

    const activePlans = (await Plan.count({ where: { isActive: true } })) ?? 0;

    const activeStudents =
      (await Student.count({ where: { isActive: true } })) ?? 0;

    const activeSubscriptions =
      (await Subscription.count({ where: { status: "ACTIVE" } })) ?? 0;

    const [studentsPerGroupData] = await sequelize.query(`
      SELECT "Groups".name, COUNT("Students".id) as count 
      FROM "Groups" 
      LEFT JOIN "Students" ON "Groups".id = "Students"."groupId" AND "Students"."isActive" = true
      GROUP BY "Groups".name
    `);

    const [rawPlanDistribution] = await sequelize.query(`
      SELECT 
        "PlanModality"."durationMonths" as name,
        COUNT("Subscriptions".id) as count
      FROM "Subscriptions"
      JOIN "Plans" ON "Subscriptions"."planId" = "Plans".id
      JOIN "PlanModality" ON "Plans".id = "PlanModality"."planId"
      WHERE "Subscriptions".status = 'ACTIVE' AND "PlanModality"."isActive" = true
      GROUP BY "PlanModality"."durationMonths"
    `);

    const distributionMap: Record<string, number> = {
      Mensal: 0,
      Trimestral: 0,
      Semestral: 0,
      Anual: 0,
    };

    (rawPlanDistribution as any[]).forEach((row) => {
      if (row.name in distributionMap) {
        distributionMap[row.name] += Number(row.count);
      }
    });

    const planDistributionData = Object.entries(distributionMap).map(
      ([name, count]) => ({ name, count }),
    );

    const [rawRenewals] = await sequelize.query(`
      SELECT 
        "Students".name as student, 
        "Plans".name as plan, 
        "Subscriptions"."renovationDate" as "expiresAt"
      FROM "Subscriptions"
      JOIN "Students" ON "Subscriptions"."studentId" = "Students".id
      JOIN "Plans" ON "Subscriptions"."planId" = "Plans".id
      WHERE "Subscriptions".status = 'ACTIVE'
      ORDER BY "Subscriptions"."renovationDate" ASC
      LIMIT 5
    `);

    const upcomingRenewals = (rawRenewals as any[]).map((r) => ({
      ...r,
      expiresAt: new Date(r.expiresAt).toLocaleDateString("pt-BR"),
    }));

    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const [rawClasses] = await sequelize.query(`
      SELECT 
        "Schedules".id as id,
        "Schedules".title as title, 
        "Groups".name as name, 
        "Schedules".level as level,
        "Schedules"."dayAndMonth" as date
      FROM "Schedules"
      JOIN "Groups" ON "Schedules"."groupId" = "Groups".id
      ORDER BY "Schedules"."dayAndMonth" DESC
      LIMIT 5
    `);

    const recentClasses = (rawClasses as any[]).map((c) => {
      const d = new Date(c.date);
      return {
        number: c.title?.substring(0, 6) || String(c.id).substring(0, 6),
        name: c.name,
        day: String(d.getDate()).padStart(2, "0"),
        month: months[d.getMonth()],
        level: c.level || "Intermediário",
      };
    });

    const [revenueResult] = (await sequelize.query(`
      SELECT 
        COALESCE(SUM("subscriptionValue"), 0) as total,
        COUNT(*)::int as count
      FROM "Subscriptions"
      WHERE status = 'ACTIVE'
    `)) as any[];

    const [pendingResult] = (await sequelize.query(`
      SELECT COUNT(*)::int as count
      FROM "Subscriptions"
      WHERE status = 'ACTIVE' AND "renovationDate" < NOW()
    `)) as any[];

    const revenue = {
      month: months[new Date().getMonth()],
      amount: Number(revenueResult[0]?.total || 0)
        .toFixed(2)
        .replace(".", ","),
      paid: Number(revenueResult[0]?.count || 0),
      pending: Number(pendingResult[0]?.count || 0),
    };

    const estimate = revenue.amount;

    return responseFormat.send({
      message: "Dashboard found successfully",
      statusCode: 200,
      data: {
        totalStudents,
        activeStudents,
        totalGroups,
        totalPlans,
        totalLessons,
        totalSubscriptions,
        activeGroups,
        activePlans,
        activeSubscriptions,
        studentsPerGroup: studentsPerGroupData,
        planDistribution: planDistributionData,
        upcomingRenewals,
        recentClasses,
        revenue,
        estimate,
      },
    });
  };
}
