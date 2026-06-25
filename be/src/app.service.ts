import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './lead.schema';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

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
  'Từ email',
  'Bạn bè giới thiệu',
  'Mục khác',
]);

const TEST_MODES = new Set(['Offline', 'Online']);

const TEST_DAYS = new Set(['Thứ 3', 'Thứ 5', 'Thứ 7']);

const TEST_TIME_SLOTS = new Set([
  'Ca sáng (9:00 - 12:00)',
  'Ca chiều (14:00 - 17:00)',
  'Ca tối (18:30 - 21:30)',
]);

const normalizeCredential = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectModel(Lead.name) private readonly leadModel: Model<LeadDocument>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    console.log('[AppService] Sheet sync module v2 (env + env_base64)');

    const sheetId = this.getEnv('GOOGLE_SHEET_ID');
    const sheetTab = this.getEnv('GOOGLE_SHEET_TAB') ?? 'Landing page';
    const jsonFromEnv = this.getEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
    const keyFile = path.join(process.cwd(), 'google-credentials.json');
    const hasKeyFile = fs.existsSync(keyFile);

    if (!sheetId) {
      console.warn('[AppService] Sheet sync disabled: GOOGLE_SHEET_ID is missing');
      return;
    }

    try {
      const { credentials, source } = this.loadServiceAccountCredentials();
      console.log(
        `[AppService] Sheet sync ready: sheetId=${sheetId} tab="${sheetTab}" auth=${source} client=${credentials.client_email}`,
      );
    } catch (error) {
      console.error('[AppService] Sheet sync config invalid:', error);
      if (!jsonFromEnv?.trim() && !hasKeyFile) {
        console.warn(
          '[AppService] On Render: set GOOGLE_SERVICE_ACCOUNT_JSON (or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64). File google-credentials.json is not deployed.',
        );
      }
    }
  }

  getHealth() {
    return { ok: true, service: 'xalo-landing-be' };
  }

  async getLeadCount() {
    const count = await this.leadModel.countDocuments();
    console.log(`[AppService] Public lead count requested. Current count: ${count}`);
    return { count };
  }

  async createLead(payload: CreateLeadDto) {
    console.log('[AppService] POST /leads received');
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

    console.log(
      `[AppService] Lead created id=${lead._id.toString()} email=${lead.email} phone=${lead.phone}`,
    );

    // Sync to Google Sheet asynchronously
    this.syncToGoogleSheet(lead).catch((err) =>
      console.error('[AppService] Google Sheet sync background error:', err),
    );

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

  private getEnv(key: string) {
    return this.configService.get<string>(key) ?? process.env[key];
  }

  private parseServiceAccountJson(raw: string) {
    const trimmed = raw.trim();
    try {
      return JSON.parse(trimmed);
    } catch (firstError) {
      // Render sometimes breaks multiline JSON; try minifying line breaks outside strings.
      const compact = trimmed.replace(/\r\n/g, '\n').replace(/\n/g, '');
      try {
        return JSON.parse(compact);
      } catch {
        throw firstError;
      }
    }
  }

  private loadServiceAccountCredentials(): {
    credentials: Record<string, string>;
    source: 'env' | 'env_base64' | 'file';
  } {
    const jsonFromEnv = this.getEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (jsonFromEnv?.trim()) {
      return {
        credentials: this.parseServiceAccountJson(jsonFromEnv),
        source: 'env',
      };
    }

    const jsonBase64 = this.getEnv('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64');
    if (jsonBase64?.trim()) {
      const decoded = Buffer.from(jsonBase64.trim(), 'base64').toString('utf8');
      return {
        credentials: this.parseServiceAccountJson(decoded),
        source: 'env_base64',
      };
    }

    const keyFile = path.join(process.cwd(), 'google-credentials.json');
    if (fs.existsSync(keyFile)) {
      return {
        credentials: JSON.parse(fs.readFileSync(keyFile, 'utf8')),
        source: 'file',
      };
    }

    throw new Error(
      'Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 on Render.',
    );
  }

  private getGoogleAuth() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    const { credentials } = this.loadServiceAccountCredentials();
    return new google.auth.GoogleAuth({ credentials, scopes });
  }

  private buildSheetRow(lead: any) {
    const referral =
      lead.referralSource + (lead.referralOther ? ` (${lead.referralOther})` : '');
    const timestamp = new Date(lead.createdAt || Date.now()).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    // Column order matches Google Sheet headers
    return [
      timestamp, // Timestamp
      lead.email, // Email Address
      lead.fullName, // Họ & tên
      `'${lead.phone}`, // Số điện thoại (Zalo)
      lead.email, // Email của bạn
      referral, // Bạn biết đến thông tin đăng ký qua đâu?
      lead.currentLevel, // Trình độ hiện tại
      lead.targetAim, // Mục tiêu (Aim)
      lead.expectedExamTime || '', // Bạn dự kiến thi vào thời gian nào?
      lead.testMode, // Hình thức test
      lead.testDays, // Ngày làm bài test R-L-W
      lead.testTimeSlot, // Khung giờ R-L-W
      lead.speakingSchedule, // Thời gian Test Speaking 1:1
    ];
  }

  private async syncToGoogleSheet(lead: any) {
    try {
      const sheetId = this.getEnv('GOOGLE_SHEET_ID');
      if (!sheetId) {
        console.warn('[AppService] GOOGLE_SHEET_ID not found in config, skipping sync');
        return;
      }

      const sheetTab = this.getEnv('GOOGLE_SHEET_TAB') ?? 'Landing page';
      const auth = this.getGoogleAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const row = this.buildSheetRow(lead);

      console.log(
        `[AppService] Google Sheet sync started lead=${lead._id?.toString?.() ?? 'unknown'} tab="${sheetTab}" cols=${row.length}`,
      );

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetTab}!A1`,
        insertDataOption: 'INSERT_ROWS',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });

      console.log(`[AppService] Lead ${lead.email} synced to Google Sheet successfully`);
    } catch (error) {
      console.error('[AppService] Failed to sync to Google Sheet:', error);
    }
  }
}
