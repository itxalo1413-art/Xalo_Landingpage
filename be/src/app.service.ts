import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './lead.schema';

type CreateLeadDto = {
  fullName: string;
  phone: string;
  email: string;
  referralSource: string;
  referralOther?: string;
  currentLevel: string;
  targetAim: string;
  expectedExamTime?: string;
  testMode: string;
  testDays: string;
  testTimeSlot: string;
  speakingSchedule: string;
};

const REFERRAL_SOURCES = new Set([
  'Từ Fanpage Xa Lộ English',
  'Từ Threads Xa Lộ English',
  'Từ TikTok Xa Lộ English',
  'Từ Instagram Xa Lộ English',
  'Bạn bè giới thiệu',
  'Mục khác',
]);

const TEST_MODES = new Set(['Offline', 'Online']);

const TEST_DAYS = new Set(['Thứ 3', 'Thứ 5', 'Thứ 7']);

const TEST_TIME_SLOTS = new Set(['9:00 - 12:00', '14:00 - 17:00', '19:00 - 22:00']);

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
    const referralSource = payload.referralSource?.trim();
    const referralOther = payload.referralOther?.trim() ?? '';
    const currentLevel = payload.currentLevel?.trim();
    const targetAim = payload.targetAim?.trim();
    const expectedExamTime = payload.expectedExamTime?.trim() ?? '';
    const testMode = payload.testMode?.trim();
    const testDays = payload.testDays?.trim();
    const testTimeSlot = payload.testTimeSlot?.trim();
    const speakingSchedule = payload.speakingSchedule?.trim();

    if (!fullName) {
      throw new BadRequestException('Họ và tên là bắt buộc.');
    }
    if (!/^\d{10,11}$/.test(phone)) {
      throw new BadRequestException('Số điện thoại phải gồm 10 hoặc 11 chữ số.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Email không hợp lệ.');
    }
    if (!referralSource || !REFERRAL_SOURCES.has(referralSource)) {
      throw new BadRequestException('Vui lòng chọn kênh bạn biết đến thông tin đăng ký.');
    }
    if (referralSource === 'Mục khác' && !referralOther) {
      throw new BadRequestException('Vui lòng nhập mục khác.');
    }
    if (!currentLevel) {
      throw new BadRequestException('Vui lòng nhập trình độ hiện tại.');
    }
    if (!targetAim) {
      throw new BadRequestException('Vui lòng nhập mục tiêu (Aim).');
    }
    if (!testMode || !TEST_MODES.has(testMode)) {
      throw new BadRequestException('Vui lòng chọn hình thức test Online/Offline.');
    }
    if (!testDays || !TEST_DAYS.has(testDays)) {
      throw new BadRequestException('Vui lòng chọn ngày bạn có thể làm bài test.');
    }
    if (!testTimeSlot || !TEST_TIME_SLOTS.has(testTimeSlot)) {
      throw new BadRequestException('Vui lòng chọn khung giờ làm bài test.');
    }
    if (!speakingSchedule) {
      throw new BadRequestException('Vui lòng nhập thời gian bạn có thể test Speaking 1:1.');
    }

    // Check for existing lead with same email or phone
    const existingLead = await this.leadModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingLead) {
      if (existingLead.email === email) {
        throw new BadRequestException(
          'Email này đã được đăng ký. Xa Lộ English sẽ sớm liên hệ với bạn nhé!',
        );
      }
      throw new BadRequestException(
        'Số điện thoại này đã được đăng ký. Xa Lộ English sẽ sớm liên hệ với bạn nhé!',
      );
    }

    const lead = await this.leadModel.create({
      fullName,
      phone,
      email,
      referralSource,
      referralOther,
      currentLevel,
      targetAim,
      expectedExamTime,
      testMode,
      testDays,
      testTimeSlot,
      speakingSchedule,
    });
    return {
      id: lead._id.toString(),
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      referralSource: (lead as any).referralSource,
      referralOther: (lead as any).referralOther ?? '',
      currentLevel: (lead as any).currentLevel,
      targetAim: (lead as any).targetAim,
      expectedExamTime: (lead as any).expectedExamTime ?? '',
      testMode: (lead as any).testMode,
      testDays: (lead as any).testDays,
      testTimeSlot: (lead as any).testTimeSlot,
      speakingSchedule: (lead as any).speakingSchedule,
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
      referralSource: (lead as any).referralSource,
      referralOther: (lead as any).referralOther ?? '',
      currentLevel: (lead as any).currentLevel,
      targetAim: (lead as any).targetAim,
      expectedExamTime: (lead as any).expectedExamTime ?? '',
      testMode: (lead as any).testMode,
      testDays: (lead as any).testDays,
      testTimeSlot: (lead as any).testTimeSlot,
      speakingSchedule: (lead as any).speakingSchedule,
      createdAt: (lead as any).createdAt,
    }));
  }
}
