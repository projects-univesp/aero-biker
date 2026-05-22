import { env } from "@utils/env";
import { logger } from "@utils/logger";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class MailService {
  async sendPasswordReset(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const safeName = escapeHtml(name);
    const safeUrl = escapeHtml(resetUrl);

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <body style="font-family: sans-serif; background: #f9f9f9; padding: 40px;">
        <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111; margin-top: 0;">Redefinição de senha</h2>
          <p style="color: #374151;">Olá, <strong>${safeName}</strong>.</p>
          <p style="color: #374151;">Você solicitou a redefinição de sua senha no sistema <strong>AEROBIC BIKER</strong>.</p>
          <p style="color: #374151;">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
          <a href="${safeUrl}"
            style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #22c55e; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Redefinir senha
          </a>
          <p style="color: #6b7280; font-size: 13px;">Se você não solicitou isso, ignore este email. Sua senha não será alterada.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">AEROBIC BIKER — Sistema de Gestão</p>
        </div>
      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: env.RESEND_FROM,
      to,
      subject: "Redefinição de senha — AEROBIC BIKER",
      html,
    });

    if (error) {
      logger.error("MailService: failed to send password reset email", error);
      throw new Error("Falha ao enviar email de recuperação");
    }
  }
}
