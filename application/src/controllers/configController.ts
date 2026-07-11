import { ConfigService } from "@services/configService";
import { VerifyData } from "@utils/zod";
import type { Request, Response } from "express";
import { Student } from "@models/student";
import { Group } from "@models/group";
import { Subscription } from "@models/subscription";
import { Plan } from "@models/plan";

export class ConfigController {
  private readonly data: VerifyData;
  private readonly configService: ConfigService;

  constructor() {
    this.data = new VerifyData();
    this.configService = new ConfigService();
  }

  getAcademy = async (_req: Request, res: Response) => {
    const academy = await this.configService.getAcademy();

    return res.status(200).json({
      message: "Academia encontrada com sucesso",
      data: academy,
    });
  };

  exportGeneralReport = async (req: Request, res: Response) => {
    // Busca os alunos incluindo as turmas, mensalidades e os planos de cada mensalidade
    const students = await Student.findAll({
      include: [
        { model: Group, as: "group" },
        {
          model: Subscription,
          as: "subscriptions",
          include: [{ model: Plan, as: "plan" }],
        },
      ],
      order: [["name", "ASC"]],
    });

    // Cabeçalho detalhado do CSV
    const header =
      "Nome do Aluno,Telefone,Status Aluno,Turma,Dias da Turma,Plano,Valor da Mensalidade,Vencimento,Status Pagamento,Metodo de Pagamento\n";
    const rows: string[] = [];

    // Formatação de data simples para o CSV
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
    };

    students.forEach((student: any) => {
      const name = student.name;
      const phone = student.phone;
      const status = student.isActive ? "Ativo" : "Inativo";
      const groupName = student.group ? student.group.name : "Sem turma";
      const groupDays = student.group ? student.group.daysOfWeek : "-";

      // Se o aluno tiver mensalidades, criamos uma linha para cada mensalidade dele
      if (student.subscriptions && student.subscriptions.length > 0) {
        student.subscriptions.forEach((sub: any) => {
          const planName = sub.plan ? sub.plan.name : "Plano Excluido";
          const value = `R$ ${sub.subscriptionValue.toFixed(2).replace(".", ",")}`;
          const dueDate = sub.renovationDate
            ? formatDate(sub.renovationDate)
            : "-";

          let subStatus = "Cancelado";
          if (sub.status === "PAID") subStatus = "Pago";
          if (sub.status === "PENDING") subStatus = "Pendente";

          let method = sub.paymentMethod;
          if (method === "CREDIT_CARD") method = "Cartao de Credito";

          rows.push(
            `"${name}","${phone}","${status}","${groupName}","${groupDays}","${planName}","${value}","${dueDate}","${subStatus}","${method}"`,
          );
        });
      } else {
        // Se o aluno não tiver mensalidade, exporta os dados dele com as colunas financeiras vazias
        rows.push(
          `"${name}","${phone}","${status}","${groupName}","${groupDays}","-","-","-","-","-"`,
        );
      }
    });

    const csvContent = header + rows.join("\n");

    // Prepara o header para forçar o download do arquivo CSV
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="relatorio_geral_aerobic_biker.csv"',
    );

    return res.status(200).send(csvContent);
  };

  updateAcademy = async (req: Request, res: Response) => {
    const parsed = this.data.verifyAcademy(req.body);
    const academy = await this.configService.updateAcademy(parsed);

    return res.status(200).json({
      message: "Academia atualizada com sucesso",
      data: academy,
    });
  };

  listAdmins = async (_req: Request, res: Response) => {
    const admins = await this.configService.listAdmins();

    return res.status(200).json({
      message: "Admins retrieved",
      data: admins,
    });
  };

  createAdmin = async (req: Request, res: Response) => {
    const parsed = this.data.verifyCreateAdmin(req.body);
    const admin = await this.configService.createAdmin(parsed);

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      data: admin,
    });
  };

  changePassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyChangePassword(req.body);

    const result = await this.configService.changePassword(
      req.user!.id,
      parsed.currentPassword,
      parsed.newPassword,
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Senha alterada com sucesso",
    });
  };

  deactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.deactivateAdmin(id, req.user!.id);

    return res.status(200).json({
      message: "Usuário desativado com sucesso",
    });
  };

  reactivateAdmin = async (req: Request, res: Response) => {
    const { id } = this.data.verifyId(req.params.id);
    const result = await this.configService.reactivateAdmin(id);

    return res.status(200).json({
      message: "Usuário reativado com sucesso",
    });
  };
}
