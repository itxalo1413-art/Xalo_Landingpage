import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('leads/count')
  getLeadCount() {
    return this.appService.getLeadCount();
  }

  @Post('leads')
  createLead(
    @Body()
    body: {
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
    },
  ) {
    return this.appService.createLead(body);
  }

  @Post('auth/login')
  login(@Body() body: { email: string; password: string }) {
    return this.appService.loginAdmin(body.email, body.password);
  }

  @Get('admin/leads')
  async listLeads(@Headers('authorization') authorization?: string) {
    this.appService.verifyAdminToken(authorization);
    return this.appService.listLeads();
  }
}
