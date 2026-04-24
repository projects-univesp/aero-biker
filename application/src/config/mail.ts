import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { env } from "@utils/env";

export class MailClient {
  private readonly client: Mail;

  constructor() {
    this.client = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      requireTLS: true,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false
      },
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS,
      },
      logger: true,
      debug: true,
    });
  }

  async sendMail(to: string, subject: string, template: string) {
    await this.client.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html: template,
    });
  }
}