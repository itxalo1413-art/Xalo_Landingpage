import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './lead.schema';

type CreateLeadDto = {
  fullName: string;
  phone: string;
  email: string;
  motivation: string;
  otherReason?: string;
};

const MOTIVATIONS = new Set([
  'Đi du học',
  'Định cư nước ngoài',
  'Đầu vào/ đầu ra đại học',
  'Thăng tiến trong công việc',
  'Rất yêu thích tiếng Anh',
  'Lí do khác',
]);

const normalizeCredential = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    private readonly configService: ConfigService,
  ) {}

  getHealth() {
    return { ok: true, service: 'xalo-landing-be' };
  }

  async createLead(payload: CreateLeadDto) {
    const fullName = payload.fullName?.trim();
    const phone = payload.phone?.trim();
    const email = payload.email?.trim().toLowerCase();
    const motivation = payload.motivation?.trim();
    const otherReason = payload.otherReason?.trim() ?? '';

    if (!fullName) {
      throw new BadRequestException('Họ và tên là bắt buộc.');
    }
    if (!/^\d{9,11}$/.test(phone)) {
      throw new BadRequestException('Số điện thoại phải gồm 9-11 chữ số.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Email không hợp lệ.');
    }
    if (!motivation || !MOTIVATIONS.has(motivation)) {
      throw new BadRequestException('Vui lòng chọn mục đích học tiếng Anh/IELTS.');
    }
    if (motivation === 'Lí do khác' && !otherReason) {
      throw new BadRequestException('Vui lòng nhập lí do khác.');
    }

    const lead = await this.leadModel.create({
      fullName,
      phone,
      email,
      motivation,
      otherReason,
    });
    return {
      id: lead._id.toString(),
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      motivation: (lead as any).motivation,
      otherReason: (lead as any).otherReason ?? '',
      createdAt: (lead as any).createdAt,
    };
  }

  loginAdmin(email: string, password: string) {
    const adminEmail = normalizeCredential(
      this.configService.get<string>('ADMIN_EMAIL') ?? 'admin@landing.com',
    ).toLowerCase();
    const adminPassword = normalizeCredential(
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'XaloEnglish#14141313',
    );
    const normalizedEmail = normalizeCredential(email).toLowerCase();
    const normalizedPassword = normalizeCredential(password);

    if (normalizedEmail !== adminEmail || normalizedPassword !== adminPassword) {
      throw new UnauthorizedException('Sai email hoặc mật khẩu.');
    }

    const token =
      this.configService.get<string>('ADMIN_TOKEN') ?? 'xalo-admin-token-landing-page';
    return { token };
  }

  verifyAdminToken(authorizationHeader?: string) {
    const token =
      this.configService.get<string>('ADMIN_TOKEN') ?? 'xalo-admin-token-landing-page';
    const bearer = `Bearer ${token}`;
    if (authorizationHeader !== bearer) {
      throw new UnauthorizedException('Bạn chưa đăng nhập.');
    }
  }

  async listLeads() {
    const leads = await this.leadModel.find().sort({ createdAt: -1 }).lean();
    return leads.map((lead) => ({
      id: lead._id.toString(),
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      motivation: (lead as any).motivation,
      otherReason: (lead as any).otherReason ?? '',
      createdAt: (lead as any).createdAt,
    }));
  }
}
