import { Op } from "sequelize";
import { Student } from "@models/student";
import { Group } from "@models/group";
import { Plan } from "@models/plan";
import { Schedule } from "@models/schedules";
import { Subscription } from "@models/subscription";
import { formatBRL } from "@utils/currency";

export class DashboardService {
  getDashboard = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const startOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );

    const [
      totalStudents,          // contagem de alunos ativos
      totalLessons,           // contagem total de aulas
      totalPlans,             // contagem de planos ativos
      pendingCount,           // contagem de mensalidades pendentes
      totalActiveSubscriptions, // contagem de mensalidades ativas
      estimatedRaw,           // soma dos valores de todas mensalidades ativas (receita estimada)
      receivedRaw,            // soma dos valores recebidos no mês atual
      groupsWithStudents,     // turmas ativas com seus alunos (para o gráfico)
      activePlansData,        // planos ativos com suas mensalidades (para o gráfico)
      renewalSubs,            // próximas renovações
    ] = await Promise.all([
      Student.count({ where: { isActive: true } }),
      
      Schedule.count(),
      
      Plan.count({ where: { isActive: true } }),
      
      Subscription.count({ where: { status: "PENDING" } }),
      
      Subscription.count({ where: { status: "ACTIVE" } }),
      
      // Soma o valor de todas as mensalidades ativas — receita estimada mensal
      Subscription.sum("subscriptionValue", { where: { status: "ACTIVE" } }),
      
      // Soma o valor das mensalidades pagas no mês atual
      Subscription.sum("subscriptionValue", {
        where: {
          status: "PAID",
          renovationDate: { [Op.between]: [startOfMonth, endOfMonth] },
        },
      }),
      
      Group.findAll({
        where: { isActive: true },
        include: [
          { model: Student, as: "students", attributes: ["id"] },
        ],
        attributes: ["id", "name", "daysOfWeek", "time"],
      }),
      
      Plan.findAll({
        where: { isActive: true },
        include: [
          {
            model: Subscription,
            as: "subscriptions",
            where: { status: "ACTIVE" },
            required: false,
            attributes: ["id"],
          },
        ],
        attributes: ["id", "name"],
      }),
      
      Subscription.findAll({
        where: {
          renovationDate: { [Op.between]: [startOfToday, endOfMonth] },
          status: "PAID",
        },
        include: [
          { model: Student, as: "student", attributes: ["name"] },
          { model: Plan, as: "plan", attributes: ["name"] },
        ],
        limit: 5,
        order: [["renovationDate", "ASC"]],
      }),
    ]);

    // Formatação dos dados para os gráficos
    const totalClasses = groupsWithStudents.length;
    
    const studentsPerGroup = groupsWithStudents.map((g: any) => ({
      label: `${g.daysOfWeek} ${g.time}`,
      count: g.students?.length ?? 0,
    }));

    const planDistribution = activePlansData
      .filter((p: any) => (p.subscriptions?.length ?? 0) > 0)
      .map((p: any) => ({
        label: p.name,
        count: p.subscriptions.length,
      }));

    const upcomingRenewals = renewalSubs.map((s: any) => ({
      student: s.student?.name ?? "—",
      plan: s.plan?.name ?? "—",
      expiresAt: new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
        new Date(s.renovationDate),
      ),
    }));

    const monthRaw = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
    }).format(now);

    return {
      totalStudents,
      totalClasses,
      totalLessons,
      totalPlans,
      totalGroups: totalClasses,
      activeGroups: totalClasses,
      activePlans: totalPlans,
      totalSubscriptions: totalActiveSubscriptions,
      activeSubscriptions: totalActiveSubscriptions,
      studentsPerGroup,
      planDistribution,
      receivedAmount: formatBRL(receivedRaw || 0),
      paidCount: pendingCount,
      pendingCount,
      estimatedRevenue: formatBRL(estimatedRaw || 0),
      currentMonth:
        monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1),
      upcomingRenewals,
      recentClasses: [],
    };
  };
}