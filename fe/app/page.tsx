"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  referralSource: string;
  referralOther: string;
  currentLevel: string;
  targetAim: string;
  expectedExamTime: string;
  testMode: "Offline" | "Online" | "";
  testDays: string;
  testTimeSlot: string;
  speakingSchedule: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_FORM: FormData = {
  fullName: "",
  phone: "",
  email: "",
  referralSource: "",
  referralOther: "",
  currentLevel: "",
  targetAim: "",
  expectedExamTime: "",
  testMode: "",
  testDays: "",
  testTimeSlot: "",
  speakingSchedule: "",
};

const INITIAL_SLOTS = 86;
const FLOOR_SLOTS = 19;
const RESET_SLOTS = 25;

function resolveApiBaseUrl() {
  const envBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }

  return null;
}

function getCycleResetStart(cycle: number) {
  return RESET_SLOTS;
}

function getDisplaySlots(registeredCount: number) {
  let remainingSubmissions = Math.max(0, Math.floor(registeredCount));
  let cycle = 0;
  let cycleStart = INITIAL_SLOTS;

  while (true) {
    const stepsToFloor = cycleStart - FLOOR_SLOTS;
    if (remainingSubmissions <= stepsToFloor) {
      return cycleStart - remainingSubmissions;
    }
    remainingSubmissions -= stepsToFloor + 1;
    cycle += 1;
    cycleStart = getCycleResetStart(cycle);
  }
}

function logSlotsCheckpoint(source: "bootstrap" | "sync" | "submit", count: number, slots: number) {
  console.log(`[Slots] source=${source} count=${count} display=${slots} floor=${FLOOR_SLOTS} reset=${RESET_SLOTS}`);
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ & tên.";
  }

  if (!/^\d{10,11}$/.test(data.phone)) {
    errors.phone = "Số điện thoại phải gồm 10 hoặc 11 chữ số.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }
  if (!data.referralSource) {
    errors.referralSource = "Vui lòng chọn kênh bạn biết đến.";
  }
  if (data.referralSource === "Mục khác" && !data.referralOther.trim()) {
    errors.referralOther = "Vui lòng nhập mục khác.";
  }
  if (!data.currentLevel.trim()) {
    errors.currentLevel = "Vui lòng nhập trình độ hiện tại.";
  }
  if (!data.targetAim.trim()) {
    errors.targetAim = "Vui lòng nhập mục tiêu (Aim).";
  }
  if (!data.testMode) {
    errors.testMode = "Vui lòng chọn hình thức test.";
  }
  if (!data.testDays) {
    errors.testDays = "Vui lòng chọn ngày có thể làm bài test.";
  }
  if (!data.testTimeSlot) {
    errors.testTimeSlot = "Vui lòng chọn khung giờ thuận tiện.";
  }
  if (!data.speakingSchedule.trim()) {
    errors.speakingSchedule = "Vui lòng nhập thời gian bạn có thể test Speaking.";
  }

  return errors;
}

export default function Home() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    fullName: false,
    phone: false,
    email: false,
    referralSource: false,
    referralOther: false,
    currentLevel: false,
    targetAim: false,
    expectedExamTime: false,
    testMode: false,
    testDays: false,
    testTimeSlot: false,
    speakingSchedule: false,
  });

  const [slotsRemaining, setSlotsRemaining] = useState<number>(INITIAL_SLOTS);
  const [registeredCount, setRegisteredCount] = useState<number>(0);

  // Load initial slots from localStorage to avoid flicker
  useEffect(() => {
    const cachedCount = localStorage.getItem('xle_registered_count');
    if (cachedCount) {
      const parsedCount = Number.parseInt(cachedCount, 10);
      if (Number.isFinite(parsedCount) && parsedCount >= 0) {
        const slots = getDisplaySlots(parsedCount);
        setRegisteredCount(parsedCount);
        setSlotsRemaining(slots);
        logSlotsCheckpoint("bootstrap", parsedCount, slots);
        return;
      }
    }

    const cached = localStorage.getItem('xle_slots_remaining');
    if (cached) {
      const parsed = Number.parseInt(cached, 10);
      if (Number.isFinite(parsed)) {
        setSlotsRemaining(parsed);
        console.log(`[Slots] source=bootstrap_legacy_cache display=${parsed}`);
      }
    }
  }, []);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      fullName: true,
      phone: true,
      email: true,
      referralSource: true,
      referralOther: true,
      currentLevel: true,
      targetAim: true,
      expectedExamTime: true,
      testMode: true,
      testDays: true,
      testTimeSlot: true,
      speakingSchedule: true,
    });
    setSubmitError("");

    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      const baseUrl = resolveApiBaseUrl();
      if (!baseUrl) {
        throw new Error("Chưa cấu hình API backend. Vui lòng thiết lập NEXT_PUBLIC_API_BASE_URL.");
      }
      const response = await fetch(`${baseUrl}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { message?: string };
        throw new Error(errorBody?.message || "Không thể gửi đăng ký. Vui lòng thử lại.");
      }

      setForm(INITIAL_FORM);
      setTouched({
        fullName: false,
        phone: false,
        email: false,
        referralSource: false,
        referralOther: false,
        currentLevel: false,
        targetAim: false,
        expectedExamTime: false,
        testMode: false,
        testDays: false,
        testTimeSlot: false,
        speakingSchedule: false,
      });
      setRegisteredCount((prev) => {
        const nextCount = prev + 1;
        const nextSlots = getDisplaySlots(nextCount);
        setSlotsRemaining(nextSlots);
        localStorage.setItem('xle_registered_count', nextCount.toString());
        localStorage.setItem('xle_slots_remaining', nextSlots.toString());
        logSlotsCheckpoint("submit", nextCount, nextSlots);
        return nextCount;
      });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể gửi đăng ký.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Sync display slots with real lead count from backend
    const fetchCount = async () => {
      try {
        const baseUrl = resolveApiBaseUrl();
        if (!baseUrl) {
          console.warn("[Slots] Skip sync: NEXT_PUBLIC_API_BASE_URL is not configured");
          return;
        }
        const response = await fetch(`${baseUrl}/leads/count?t=${Date.now()}`);
        if (!response.ok) return;

        const data = (await response.json()) as { count?: number };
        const count = typeof data.count === "number" && data.count >= 0 ? Math.floor(data.count) : 0;
        const slots = getDisplaySlots(count);

        setRegisteredCount(count);
        setSlotsRemaining(slots);
        localStorage.setItem("xle_registered_count", count.toString());
        localStorage.setItem("xle_slots_remaining", slots.toString());
        logSlotsCheckpoint("sync", count, slots);
      } catch (error) {
        console.warn("[Slots] Failed to sync registration count:", error);
      }
    };

    fetchCount();
  }, []);

  useEffect(() => {
    if (isSubmitted && formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isSubmitted]);

  useEffect(() => {
    // Set a relative target date for demo purposes (e.g., 2 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(targetDate.getHours() + 5);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => firstInputRef.current?.focus(), 500);
  };

  return (
    <main className="relative min-h-screen">
      {/* Top FOMO Slots Banner */}
      <div className="bg-[#9494ff] text-white py-2.5 px-6 sticky top-0 z-[60] shadow-xl border-b border-white/10">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-3 md:gap-5">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
            </span>
            
            <h2 className="text-[11px] md:text-sm font-black uppercase tracking-tight flex items-center gap-2">
              Cơ hội cuối: Chỉ còn 
              <span className="inline-flex items-center justify-center bg-white text-xle-accent px-3 py-1 rounded-lg text-lg md:text-2xl font-black shadow-inner animate-pulse scale-110 mx-1">
                {slotsRemaining}
              </span> 
              suất kiểm tra miễn phí
            </h2>
          </div>
          
          {/* <button 
            onClick={scrollToForm}
            className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full border border-white/30 text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ml-4"
          >
            Đăng ký ngay
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button> */}
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white sticky top-[48px] md:top-[56px] z-50 w-full px-6 py-4 shadow-sm border-b border-black/[0.02]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Image 
              src="/Logo_XLE.svg" 
              alt="Xalo Logo" 
              width={40} 
              height={40} 
              className="h-8 w-8 md:h-10 md:w-10 object-contain"
              priority
            />
            <img src="/XALO.ENGLISH.svg" alt="Xalo Logo" width={100} height={30} className="hidden sm:block h-6 w-auto" />
          </div>

          {/* Center: Contact Info (Visible on Desktop) */}
          <div className="hidden lg:flex items-center gap-x-8 text-[11px] font-bold text-xle-text-secondary tracking-tight font-roboto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <svg className="w-4 h-4 text-xle-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>250 Nguyễn Đình Chính, Phú Nhuận, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <svg className="w-4 h-4 text-xle-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>078 6688 149</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <svg className="w-4 h-4 text-xle-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span className="lowercase tracking-normal">xalo.english.bddept@gmail.com</span>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={scrollToForm} className="button-primary text-xs md:text-sm px-4 md:px-6 py-2 md:py-2.5">
              Đăng ký ngay
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-slate-50/30">
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 rounded-full bg-xle-secondary opacity-10 blur-3xl" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-xle-accent px-6 py-2.5 text-base md:text-lg font-black text-xle-primary border border-xle-primary/20 shadow-sm mx-auto">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-xle-white/10 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white shadow-sm"></span>
              </span>
              <span className="uppercase font-bold text-white tracking-wider">IELTS Diagnostic Test 2026</span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight md:text-6xl text-foreground max-w-4xl mx-auto tracking-tight">
              Kiểm tra IELTS 4 kỹ năng – <br />
              <span className="text-xle-primary">nhận Bảng Chẩn Bệnh miễn phí</span>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-xle-text-secondary max-w-2xl mx-auto font-medium">
              Đánh giá chuyên sâu trực tiếp bởi giáo viên, giúp bạn tối ưu lộ trình <br/> và sớm đạt band điểm mục tiêu.
            </p>
          </div>

          <div className="max-w-5xl mx-auto relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-xle-primary/10 via-xle-accent/5 to-xle-primary/10 rounded-[3rem] opacity-70 blur-3xl" />
              <section
                ref={formSectionRef}
                className="relative overflow-hidden rounded-[2.5rem] border border-black/[0.05] shadow-[0_40px_120px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-2xl"
              >
                {!isSubmitted ? (
                  <form className="p-8 md:p-12 space-y-10" onSubmit={handleSubmit}>
                    <div className="text-center space-y-3">
                      <div className="inline-block px-4 py-1.5 text-xle-primary text-[14px] font-bold uppercase tracking-tight mb-1">
                        Đăng ký ngay tại đây
                      </div>
                      <h2 className="text-2xl md:text-5xl font-black text-foreground leading-tight tracking-tight">
                        Nhận Bảng Chẩn Bệnh
                      </h2>
                      <p className="text-base text-xle-text-secondary font-medium">Hoàn tất các bước dưới đây để bắt đầu</p>
                    </div>

                    <div className="space-y-12">
                      {/* Section 1 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-xle-primary text-white text-lg font-black shadow-lg">1</span>
                          <p className="text-md font-black">Thông tin cá nhân</p>
                          <div className="h-px flex-1 bg-black/[0.05]" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 flex flex-col gap-2">
                            <label className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Họ &amp; tên *</label>
                            <input
                              ref={firstInputRef} type="text" value={form.fullName}
                              onBlur={() => setTouched(p => ({...p, fullName: true}))}
                              onChange={(e) => setForm(p => ({...p, fullName: e.target.value}))}
                              className="h-14 w-full rounded-2xl bg-slate-50 border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all"
                              placeholder="Nguyễn Văn A"
                            />
                            {touched.fullName && errors.fullName && <p className="text-[14px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.fullName}</p>}
                          </div>
                          <div className="space-y-2 flex flex-col gap-2">
                            <label className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Số điện thoại *</label>
                            <input
                              type="tel" value={form.phone}
                              onBlur={() => setTouched(p => ({...p, phone: true}))}
                              onChange={(e) => setForm(p => ({...p, phone: e.target.value.replace(/\D/g, "")}))}
                              className="h-14 w-full rounded-2xl bg-slate-50 border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all"
                              placeholder="0912345678"
                            />
                            {touched.phone && errors.phone && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.phone}</p>}
                          </div>
                        </div>
                        <div className="space-y-2 flex flex-col gap-2">
                          <label className="text-[14px] font-black text-xle-text-secondary/80 ml-1">Email *</label>
                          <input
                            type="email" value={form.email}
                            onBlur={() => setTouched(p => ({...p, email: true}))}
                            onChange={(e) => setForm(p => ({...p, email: e.target.value}))}
                            className="h-14 w-full rounded-2xl bg-slate-50 border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all"
                            placeholder="example@gmail.com"
                          />
                          {touched.email && errors.email && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.email}</p>}
                        </div>
                        {/* Referral Source - Separated Full Width */}
                          <div className="space-y-3 flex flex-col">
                            <label className="text-[14px] font-bold text-foreground/90 ml-1">Bạn biết đến thông tin đăng ký qua đâu? *</label>
                            <div className="flex flex-col gap-3">
                              {[
                                "Từ Fanpage Xa Lộ English",
                                "Từ Threads Xa Lộ English",
                                "Từ TikTok Xa Lộ English",
                                "Từ Instagram Xa Lộ English",
                                "Từ email",
                                "Bạn bè giới thiệu",
                                "Mục khác"
                              ].map((source) => (
                                <div key={source} className="space-y-3">
                                  <button
                                    type="button"
                                    onClick={() => setForm(p => ({...p, referralSource: source}))}
                                    className={`h-12 w-full flex items-center px-6 rounded-xl border font-medium transition-all ${form.referralSource === source ? 'bg-xle-primary/10 border-xle-primary text-xle-primary shadow-sm' : 'bg-slate-50 border-black/[0.03] text-xle-text-secondary hover:border-black/10'}`}
                                  >
                                    <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${form.referralSource === source ? 'border-xle-primary' : 'border-black/20'}`}>
                                      {form.referralSource === source && <div className="w-2 h-2 rounded-full bg-xle-primary" />}
                                    </div>
                                    <span className="text-[13px]">{source === "Mục khác" ? "Other:" : source}</span>
                                  </button>
                                  {source === "Mục khác" && form.referralSource === "Mục khác" && (
                                    <input
                                      type="text"
                                      value={form.referralOther}
                                      onChange={(e) => setForm(p => ({...p, referralOther: e.target.value}))}
                                      placeholder="Vui lòng nhập kênh khác"
                                      className="h-12 w-full rounded-xl bg-white border border-xle-primary/30 px-6 text-[13px] font-medium outline-none focus:ring-2 focus:ring-xle-primary/10 animate-in fade-in slide-in-from-top-2 duration-300"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            {touched.referralSource && errors.referralSource && <p className="text-[12px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.referralSource}</p>}
                          </div>
                      </div>

                      {/* Section 2 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-xle-primary text-white text-lg font-black shadow-lg">2</span>
                          <p className="text-md font-bold">Mục tiêu & Dự kiến</p>
                          <div className="h-px flex-1 bg-black/[0.05]" />
                        </div>
                        <div className="space-y-8">
                          

                          {/* Level - Separated Full Width */}
                          <div className="space-y-3 flex flex-col">
                            <label className="text-[14px] font-bold text-foreground/90 ml-1">Trình độ hiện tại của bạn đang ở mức nào? *</label>
                            <div className="flex flex-col gap-3">
                              {["0 - 4.5", "4.5 - 5.5", "5.5 - 6.5", "7.0+", "Mình chưa kiểm tra bao giờ"].map((level) => (
                                <button
                                  key={level} type="button"
                                  onClick={() => setForm(p => ({...p, currentLevel: level}))}
                                  className={`h-12 w-full flex items-center px-6 rounded-xl border font-medium transition-all ${form.currentLevel === level ? 'bg-xle-primary/10 border-xle-primary text-xle-primary shadow-sm' : 'bg-slate-50 border-black/[0.03] text-xle-text-secondary hover:border-black/10'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center transition-all ${form.currentLevel === level ? 'border-xle-primary' : 'border-black/20'}`}>
                                    {form.currentLevel === level && <div className="w-2 h-2 rounded-full bg-xle-primary" />}
                                  </div>
                                  <span className="text-[13px]">{level}</span>
                                </button>
                              ))}
                            </div>
                            {touched.currentLevel && errors.currentLevel && <p className="text-[12px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.currentLevel}</p>}
                          </div>

                          {/* Aim & Exam Time Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 flex flex-col gap-2">
                              <label className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Mục tiêu *</label>
                              <input
                                type="text" value={form.targetAim}
                                onBlur={() => setTouched(p => ({...p, targetAim: true}))}
                                onChange={(e) => setForm(p => ({...p, targetAim: e.target.value}))}
                                className="h-14 w-full rounded-2xl bg-slate-50 border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all"
                                placeholder="Ví dụ: 7.0+"
                              />
                              {touched.targetAim && errors.targetAim && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.targetAim}</p>}
                            </div>
                            <div className="space-y-2 flex flex-col gap-2">
                              <label className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Dự kiến thi</label>
                              <input
                                type="text" value={form.expectedExamTime}
                                onChange={(e) => setForm(p => ({...p, expectedExamTime: e.target.value}))}
                                className="h-14 w-full rounded-2xl bg-slate-50 border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all"
                                placeholder="Tháng 12/2026"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                        {/* Section 3: Lịch kiểm tra */}
                        <div className="space-y-10">
                          <div className="flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-xle-primary text-white text-lg font-black shadow-lg">3</span>
                            <p className="text-md font-bold text-foreground">Lịch kiểm tra</p>
                            <div className="h-px flex-1 bg-black/[0.05]" />
                          </div>

                          {/* Common: Test Mode Selection */}
                          <div className="space-y-4 flex flex-col gap-2">
                            <p className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Hình thức kiểm tra (Áp dụng cho toàn bộ buổi test) *</p>
                            <div className="grid grid-cols-2 gap-4">
                              {["Online", "Offline"].map(mode => (
                                <button
                                  key={mode} type="button"
                                  onClick={() => setForm(p => ({...p, testMode: mode as any}))}
                                  className={`h-14 rounded-2xl text-[12px] font-bold border transition-all ${form.testMode === mode ? 'bg-xle-primary text-white border-xle-primary shadow-xl shadow-xle-primary/20' : 'bg-slate-50 text-foreground/40 border-black/[0.05]'}`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                            {touched.testMode && errors.testMode && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.testMode}</p>}
                          </div>

                          {/* Part 1: 3-Skill Test */}
                          <div className="space-y-8 bg-slate-50/30 rounded-[2rem] p-6 border border-black/[0.02]">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-xle-primary" />
                               <p className="text-sm font-bold text-foreground uppercase tracking-tight">Phần 1: Bài Test 3 kỹ năng (Listening/Reading/Writing)</p>
                            </div>
                            
                            <div className="space-y-4 flex flex-col gap-2">
                              <p className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Ngày làm bài*</p>
                              <div className="grid grid-cols-3 gap-3">
                                {["Thứ 3", "Thứ 5", "Thứ 7"].map(day => (
                                  <button
                                    key={day} type="button"
                                    onClick={() => setForm(p => ({...p, testDays: day}))}
                                    className={`h-12 rounded-xl text-[12px] font-bold border transition-all ${form.testDays === day ? 'bg-xle-primary/10 text-xle-primary border-xle-primary shadow-sm' : 'bg-white text-foreground/40 border-black/[0.05]'}`}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                              {touched.testDays && errors.testDays && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.testDays}</p>}
                            </div>

                            <div className="space-y-2 flex flex-col gap-2">
                              <label className="text-[14px] font-bold text-xle-text-secondary/80 ml-1">Khung thời gian test mong muốn *</label>
                              <select
                                value={form.testTimeSlot}
                                onBlur={() => setTouched(p => ({...p, testTimeSlot: true}))}
                                onChange={(e) => setForm(p => ({...p, testTimeSlot: e.target.value}))}
                                className="h-14 w-full rounded-2xl bg-white border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Chọn khung giờ</option>
                                <option value="Ca sáng (9:00 - 12:00)">Ca sáng (9:00 - 12:00)</option>
                                <option value="Ca chiều (14:00 - 17:00)">Ca chiều (14:00 - 17:00)</option>
                                <option value="Ca tối (18:30 - 21:30)">Ca tối (18:30 - 21:30)</option>
                              </select>
                              {touched.testTimeSlot && errors.testTimeSlot && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.testTimeSlot}</p>}
                            </div>
                          </div>

                        {/* Part 2: Speaking Test */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-2 mb-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-xle-accent" />
                             <p className="text-sm font-bold text-foreground uppercase tracking-tight">Phần 2: Bài Test Speaking 1:1 (Test Riêng)</p>
                          </div>
                          
                          <div className="space-y-4 flex flex-col gap-2">
                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-black/[0.03] space-y-4 mb-2">
                              <p className="text-[13px] text-xle-text-secondary leading-relaxed">
                                Bạn vui lòng điền cụ thể ngày và giờ bạn có thể tham gia test Speaking. <br />
                                <span className="font-bold text-foreground">• Khung giờ ưu tiên:</span> Từ 09:00 đến trước 18:30 hàng ngày <br />
                                <span className="font-bold text-foreground">• Thời lượng:</span> Khoảng 30 - 45 phút/ca <br />
                                <span className="italic opacity-80">Ví dụ: 9:30 sáng Thứ 5 (ngày 7/5)</span>
                              </p>
                            </div>
                            <input
                              type="text" value={form.speakingSchedule}
                              onBlur={() => setTouched(p => ({...p, speakingSchedule: true}))}
                              onChange={(e) => setForm(p => ({...p, speakingSchedule: e.target.value}))}
                              className="h-14 w-full rounded-2xl bg-slate-50 border border-black/[0.05] px-6 font-bold focus:bg-white focus:ring-4 focus:ring-xle-primary/10 outline-none transition-all"
                              placeholder="Nhập ngày & giờ bạn rảnh..."
                            />
                            {touched.speakingSchedule && errors.speakingSchedule && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase ml-1">{errors.speakingSchedule}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8">
                      <button
                        type="submit" disabled={isSubmitting}
                        className="w-full h-16 rounded-3xl bg-xle-primary text-white font-bold uppercase tracking-tight text-sm shadow-2xl shadow-xle-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? "Đang xử lý..." : "Hoàn tất đăng ký ngay"}
                      </button>
                      {submitError && <p className="text-center text-xs font-bold text-red-500 mt-6 uppercase tracking-widest">{submitError}</p>}
                    </div>
                  </form>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="max-w-2xl mx-auto px-4 w-full">
                      {/* Header Group */}
                      <div className="flex flex-col items-center gap-4 mb-10">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm">
                          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-xle-secondary tracking-tight">Đăng ký thành công rồi nè!</p>
                          <p className="text-xle-text-secondary text-sm leading-relaxed font-medium">
                            Cảm ơn bạn đã tin tưởng lựa chọn Xa Lộ English.
                          </p>
                        </div>
                      </div>

                      {/* Main Info Group */}
                      <div className="space-y-10">
                        {/* Next Steps Section */}
                        <div className="space-y-4">
                          <div className="flex justify-center items-center gap-3 text-foreground/80">
                            <div className="h-px w-8 bg-black/[0.05]" />
                            <span className="text-sm font-bold uppercase tracking-tight">Bước tiếp theo</span>
                            <div className="h-px w-8 bg-black/[0.05]" />
                          </div>
                          <p className="text-sm leading-relaxed font-normal text-xle-text-secondary">
                            Đội ngũ Xa Lộ English sẽ <span className="text-foreground font-bold">"ting ting"</span> qua Zalo hoặc gọi điện cho bạn trong vòng <span className="text-xle-primary font-bold">24 giờ tới</span> <br/> để xác nhận lịch Test cụ thể. Bạn nhớ chú ý điện thoại nha!
                          </p>
                        </div>

                        {/* Scholarship Section */}
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-xle-primary/20 to-xle-accent/20 rounded-[2rem] blur opacity-25 transition duration-1000"></div>
                          <div className="relative bg-[#9494ff] border border-xle-primary/10 rounded-[1.5rem] p-8 space-y-4 shadow-xl shadow-xle-primary/5">
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-white text-lg font-bold uppercase tracking-tight">Cơ hội học bổng 100%</p>
                            </div>
                            <p className="text-md text-white leading-relaxed font-normal">
                              Xa Lộ English đang có chương trình Học bổng lên tới <span className="text-white font-bold">100%</span> <br/> dành cho các bạn có tinh thần quyết tâm bứt phá IELTS sớm.<br/> Đừng ngại nhắn tin cho Xa Lộ English để được tư vấn chi tiết cách săn học bổng ngay nhé!
                            </p>
                          </div>
                        </div>

                        {/* Footer sign-off */}
                        <p className="text-sm font-bold text-foreground pt-4">Hẹn sớm gặp lại bạn tại buổi kiểm tra!</p>
                      </div>
                    </div>
                </div>
                )}
              </section>
            </div>
          </div>
        </section>

      {/* Proof Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 md:mb-16 text-center">
            <h2 className="text-xl md:text-3xl font-extrabold text-foreground leading-tight">TẠI SAO NÊN CHỌN TEST TRÌNH ĐỘ TẠI XA LỘ ENGLISH?</h2>
            <p className="mt-4 text-xle-text-secondary max-w-4xl mx-auto text-base md:text-lg">Giáo viên trực tiếp đánh giá chi tiết trình độ, giúp bạn xây dựng lộ trình học hiệu quả <br/> và nhanh chóng chạm band điểm mong muốn.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2">
            {[
              {
                title: "Chấm trực tiếp bởi Giáo viên 8.0+ IELTS",
                content: "Đội ngũ chuyên gia có từ 5-10 năm kinh nghiệm giảng dạy và am hiểu sâu sắc tiêu chí chấm thi quốc tế.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                color: "text-blue-600 bg-blue-50"
              },

              {
                title: "Bảng Chẩn Bệnh độc quyền",
                content: "Giáo viên đánh giá 1:1 chuyên sâu, giúp bạn nhận diện điểm mạnh – điểm yếu và cải thiện đúng trọng tâm.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                color: "text-xle-accent bg-red-50"
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-row items-start gap-5 p-2 md:p-10 md:stripe-card md:border md:border-black/[0.03] md:text-center md:flex-col md:items-center group transition-all duration-300 md:bg-white md:shadow-sm"
              >        
                <div className={`flex-shrink-0 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl ${item.color} group-hover:scale-110 transition-transform duration-500 shadow-sm md:mb-6`}>
                  {item.icon}
                </div>
                <div className="flex flex-col md:items-center">
                  <h3 className="text-lg md:text-xl font-extrabold mb-2 md:mb-3 text-foreground tracking-tight">{item.title}</h3>
                  <p className="text-xle-text-secondary leading-relaxed text-sm md:text-[15px]">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment Banner */}
      <section className="relative py-20 bg-[#9494ff] overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 relative z-10">
          <div className="stripe-card p-10 md:p-16 text-center space-y-10 shadow-2xl bg-white border border-black/[0.03]">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-xle-accent text-white text-xs font-bold uppercase tracking-tight">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Chấm bài trực tiếp bởi giáo viên
            </div>
            
            <div className="space-y-4">
              <h2 className="text-6xl md:text-8xl font-black text-xle-primary leading-none tracking-tighter">
                100%
              </h2>
              <h3 className="text-xl md:text-4xl font-extrabold text-foreground uppercase tracking-tight">
                Cam kết không sử dụng AI
              </h3>
              <div className="h-1 w-20 bg-xle-accent mx-auto rounded-full"></div>
              <p className="text-md md:text-xl font-medium text-xle-text-secondary max-w-3xl mx-auto leading-relaxed italic">
                "Mỗi bài làm đều được chuyên gia <br/> trực tiếp đọc, nghe và phân tích chi tiết từng lỗi nhỏ nhất của bạn."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-8 rounded-3xl bg-xle-muted/50 border border-xle-primary/5 text-left space-y-4 hover:shadow-xl transition-all duration-300 group/item">
                <div>
                  <p className="text-xle-text-secondary font-bold text-lg mb-2">Sát thực tế nhất</p>
                  <p className="text-xle-text-secondary text-sm leading-relaxed">Kết quả phản ánh chính xác năng lực hiện tại, không bị rập khuôn bởi các thuật toán tự động.</p>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-xle-muted/50 border border-xle-primary/5 text-left space-y-4 hover:shadow-xl transition-all duration-300 group/item">
                <div>
                  <p className="text-xle-text-secondary font-bold text-lg mb-2">Phân tích chuyên sâu</p>
                  <p className="text-xle-text-secondary text-sm leading-relaxed">Giáo viên trực tiếp nhận xét từng lỗi phát âm, ngữ pháp và gợi ý cách sửa lỗi chi tiết.</p>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-xle-muted/50 border border-xle-primary/5 text-left space-y-4 hover:shadow-xl transition-all duration-300 group/item">
                <div>
                  <p className="text-xle-text-secondary font-bold text-lg mb-2">Lộ trình cá nhân</p>
                  <p className="text-xle-text-secondary text-sm leading-relaxed">Dựa trên kết quả thực tế để xây dựng phương pháp học tập tối ưu dành riêng cho bạn.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* Web_1 Image Section */}
            <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative w-full overflow-hidden rounded-2xl border border-black/[0.05] shadow-sm">
            <Image
              src="/Web_mobile.png"
              alt="Xa Lộ English Feature Mobile"
              width={1080}
              height={1920}
              className="h-auto w-full object-contain md:hidden"
            />
            <Image
              src="/Web_1.png"
              alt="Xa Lộ English Feature"
              width={1920}
              height={1080}
              className="hidden h-auto w-full object-contain md:block"
            />
          </div>
        </div>
      </section>

      {/* Visual Proof Section */}
      <section className="bg-white pb-12 md:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 md:mb-12 text-center">
            <span className="text-xle-primary font-black tracking-tight uppercase text-lg md:text-xl">KẾT QUẢ MẪU</span>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl text-foreground">Bảng Chẩn Bệnh thực tế</h2>
            <p className="mt-4 text-xle-text-secondary max-w-2xl mx-auto">
              Khám phá Bảng Chẩn Bệnh: Không chỉ trả điểm,<br/> Xa Lộ English chỉ rõ lỗ hổng của bạn.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-6">
            {[
              { src: "/Frame 124.jpg", name: "Nguyễn Minh Anh", class: "PRE - IELTS" },
              { src: "/Frame 125.jpg", name: "Trần Bảo Nam", class: "PRE - CORE" },
              { src: "/Frame 126.jpg", name: "Lê Thu Thảo", class: "CORE" },
              { src: "/Frame 127.jpg", name: "Phạm Gia Huy", class: "UPSTREAM" },
              { src: "/Frame 129.jpg", name: "Đặng Hoàng Yến", class: "SOAR" },
              { src: "/Frame 130.jpg", name: "Bùi Minh Đức", class: "FOUNDATION" },
              { src: "/Frame 131.jpg", name: "Vũ Hải Đăng", class: "MOMENTUM" },
              { src: "/Frame 132.jpg", name: "Đỗ Mỹ Linh", class: "ADVANCED" },
              { src: "/Frame 124.jpg", name: "Ngô Gia Bảo", class: "IELTS INTENSIVE" },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="group relative"
              >
                <div className="relative stripe-card overflow-hidden border border-black/[0.05] aspect-video shadow-sm group-hover:shadow-md transition-all duration-300">
                  <Image 
                    src={item.src} 
                    alt={`Bảng Chẩn Bệnh ${item.name}`} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {idx === 8 ? (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 z-10">
                      <p className="text-white font-extrabold text-sm md:text-lg leading-tight uppercase tracking-tight">
                        Và hàng ngàn <br/> kết quả khác...
                      </p>
                      <div className="mt-3 h-0.5 w-8 bg-xle-accent"></div>
                      <p className="text-white/80 text-[10px] mt-3 font-medium">Đăng ký để nhận kết quả của bạn</p>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 left-3 right-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-white text-[10px] md:text-xs font-bold leading-tight">{item.name}</p>
                        <p className="text-white/80 text-[8px] md:text-[10px] font-medium leading-tight">Lớp: {item.class}</p>
                      </div>
                    </>
                  )}
                </div>
                {idx !== 8 && (
                  <div className="mt-3 text-center md:hidden">
                    <p className="font-bold text-foreground text-xs leading-tight">{item.name}</p>
                    <p className="text-[9px] text-xle-primary font-bold uppercase tracking-tight mt-0.5">Lớp {item.class}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Info Section */}
      <section className="bg-[#f6f6f9] py-8 md:py-16">
        <div className="mx-auto max-w-full space-y-6 md:space-y-12">
          {/* Main Info Area */}
          <div className="space-y-4 md:space-y-8">
            <div className="px-6 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
              </div>
            </div>
            
            <div className="relative w-full">
              <Image 
                src="/Web_2.png" 
                alt="Xa Lộ English Facebook Cover" 
                width={1920}
                height={640}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-[#9494ff] py-16 text-white overflow-hidden relative">

        <div className="mx-auto relative z-10 flex max-w-4xl flex-col items-center text-center px-6">
          <h2 className="text-2xl md:text-5xl font-extrabold leading-tight">
            Bắt đầu kiểm tra trình độ IELTS <br /> của bạn ngay hôm nay
          </h2>
          <p className="mt-4 text-base md:text-lg text-white/80 font-medium max-w-xl">
            Đừng để band điểm mơ hồ cản trở giấc mơ của bạn. <br/> Nhận đánh giá chính xác từ chuyên gia ngay.
          </p>
          <button
            type="button"
            onClick={scrollToForm}
            className="button-accent mt-8 h-14 md:h-16 px-8 md:px-12 text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Đăng ký nhận Bảng Chẩn Bệnh miễn phí ngay
          </button>
          
          <div className="mt-16 pt-8 border-t border-white/20 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
            <p>© 2026 Xalo Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-center gap-2.5 md:gap-3 group">
        <div className="relative">
          {/* Decorative glow behind the label */}
          <div className="absolute -inset-1 bg-gradient-to-r from-xle-primary to-xle-accent rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
          
          <span className="relative hidden md:flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[9px] md:text-[10px] font-bold uppercase tracking-tight text-xle-primary shadow-xl border border-xle-primary/10">
            {/* Pulsing indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Liên hệ để được tư vấn:
          </span>
        </div>
        <a
          href="https://zalo.me/0354943544"
          target="_blank"
          rel="noreferrer"
          aria-label="Liên hệ Zalo"
          className="relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1f82ff] to-[#0057ff] text-[13px] md:text-[15px] font-black text-white shadow-[0_12px_28px_rgba(0,104,255,0.42)] ring-2 ring-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_16px_34px_rgba(0,104,255,0.52)] active:scale-95"
        >
          <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 transition-opacity duration-300 hover:opacity-100" />
          <span className="relative tracking-tight">Zalo</span>
        </a>
        <a
          href="https://www.facebook.com/xalo.english"
          target="_blank"
          rel="noreferrer"
          aria-label="Liên hệ Facebook"
          className="relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2a8cff] to-[#0e56e9] text-white shadow-[0_12px_28px_rgba(24,119,242,0.45)] ring-2 ring-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_16px_34px_rgba(24,119,242,0.55)] active:scale-95"
        >
          <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 transition-opacity duration-300 hover:opacity-100" />
          <svg viewBox="0 0 24 24" className="relative h-7 w-7 md:h-8 md:w-8 fill-current drop-shadow-sm" aria-hidden="true">
            <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.5V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
          </svg>
        </a>
      </div>
    </main>
  );
}
