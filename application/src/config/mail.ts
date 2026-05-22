// Nodemailer client kept for compatibility but email is now sent via Resend (mailService.ts)
export class MailClient {
  async sendMail(_to: string, _subject: string, _template: string): Promise<void> {
    throw new Error("Use MailService (Resend) instead of MailClient");
  }
}
