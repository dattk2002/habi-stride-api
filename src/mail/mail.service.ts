import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  async sendVerificationCode(email: string, code: string) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) throw new ServiceUnavailableException('Email service is not configured');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.MAIL_FROM || 'HabiStride <onboarding@resend.dev>',
      to: email,
      subject: 'Mã xác minh HabiStride',
      html: `<div style="font-family:Arial,sans-serif;color:#30382a"><h2>Xác minh email</h2><p>Mã xác minh HabiStride của bạn là:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với người khác.</p></div>`,
    });
    if (error) throw new ServiceUnavailableException('Unable to send verification email');
  }
}
