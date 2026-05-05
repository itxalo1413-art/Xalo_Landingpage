"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  motivation: string;
  otherReason: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INITIAL_FORM: FormData = {
  fullName: "",
  phone: "",
  email: "",
  motivation: "",
  otherReason: "",
};

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ và tên.";
  }

  if (!/^\d{9,11}$/.test(data.phone)) {
    errors.phone = "Số điện thoại phải gồm 9-11 chữ số.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }
  if (!data.motivation) {
    errors.motivation = "Vui lòng chọn mục đích học.";
  }
  if (data.motivation === "Lí do khác" && !data.otherReason.trim()) {
    errors.otherReason = "Vui lòng nhập lí do khác.";
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
    motivation: false,
    otherReason: false,
  });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ fullName: true, phone: true, email: true, motivation: true, otherReason: true });
    setSubmitError("");

    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
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
        motivation: false,
        otherReason: false,
      });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể gửi đăng ký.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => firstInputRef.current?.focus(), 500);
  };

  return (
    <main className="relative min-h-screen">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50 w-full px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/Logo_XLE.svg" 
              alt="Xalo Logo" 
              width={48} 
              height={48} 
              className="h-10 w-10 object-contain"
              priority
            />
      <img src="/XALO.ENGLISH.svg" alt="Xalo Logo" width={120} height={80} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={scrollToForm} className="button-primary text-sm">
              Đăng ký ngay
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-24 md:pt-12 md:pb-32">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 rounded-full bg-xle-secondary opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-xle-accent opacity-5 blur-3xl" />
        
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-16">
          {/* Left Content */}
          <div className="md:col-span-7 flex flex-col justify-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-xle-muted px-4 py-1.5 text-sm font-semibold text-xle-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-xle-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-xle-primary"></span>
              </span>
              IELTS Diagnostic Test 2026
            </div>
            
            <h1 className="text-3xl font-extrabold leading-[1.3] md:text-5xl text-foreground">
              Kiểm tra IELTS 4 kỹ năng – <br />
              <span className="text-xle-primary">nhận Bảng Chẩn Bệnh  <br />  miễn phí </span>
            </h1>
            
            
            
            <p className="text-md leading-relaxed text-xle-text-secondary md:max-w-xl">
              Giáo viên 8.0+ trực tiếp chấm và phân tích chi tiết, <span className="font-semibold text-foreground underline decoration-xle-accent/30 decoration-4 underline-offset-4">không sử dụng AI <br/></span> mang lại kết quả sát với thực tế nhất.
            </p>

            <div className="flex items-center gap-4 py-2">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-xle-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                  </div>
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-xle-primary text-xs font-bold text-white">
                  +2k
                </div>
              </div>
              <p className="text-sm font-medium text-xle-text-secondary">
                <span className="font-bold text-foreground">Hơn 2,000 học viên</span> đã kiểm tra trình độ miễn phí và nhận lộ trình học phù hợp
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "Full test 4 kỹ năng",
                "Phân tích lỗi cụ thể",
                "Hình thức linh hoạt: online & offline",
                "Nhận kết quả thật"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xle-text-secondary">
                  <svg className="h-5 w-5 text-xle-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Form Card */}
          <div className="md:col-span-5">
            <section
              ref={formSectionRef}
              className="stripe-card relative overflow-hidden p-8 md:p-10 border border-black/[0.03]"
            >
              {!isSubmitted ? (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-foreground">Nhận bảng chẩn bệnh miễn phí</h2>
                    <p className="text-sm text-xle-text-secondary">Cung cấp thông tin để Xa Lộ liên hệ sắp xếp lịch kiểm tra cho bạn nhé.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-xle-text-secondary" htmlFor="fullName">
                        Họ và tên
                      </label>
                      <input
                        ref={firstInputRef}
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                        onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                        className="h-12 w-full rounded-lg bg-xle-muted/30 border border-black/[0.08] px-4 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-xle-primary/20 focus:border-xle-primary outline-none"
                        placeholder="Nguyễn Văn A"
                      />
                      {touched.fullName && errors.fullName && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-xle-text-secondary" htmlFor="phone">
                        Số điện thoại
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="h-12 w-full rounded-lg bg-xle-muted/30 border border-black/[0.08] px-4 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-xle-primary/20 focus:border-xle-primary outline-none"
                        placeholder="0912 345 678"
                      />
                      {touched.phone && errors.phone && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-xle-text-secondary" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-12 w-full rounded-lg bg-xle-muted/30 border border-black/[0.08] px-4 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-xle-primary/20 focus:border-xle-primary outline-none"
                        placeholder="name@example.com"
                      />
                      {touched.email && errors.email && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        className="text-xs font-bold uppercase tracking-wider text-xle-text-secondary"
                        htmlFor="motivation"
                      >
                        Mục đích học tiếng Anh/ IELTS của bạn
                      </label>
                      <select
                        id="motivation"
                        value={form.motivation}
                        onBlur={() => setTouched((prev) => ({ ...prev, motivation: true }))}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            motivation: e.target.value,
                            otherReason: e.target.value === "Lí do khác" ? prev.otherReason : "",
                          }))
                        }
                        className="h-12 w-full appearance-none rounded-lg bg-xle-muted/30 border border-black/[0.08] px-4 pr-10 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-xle-primary/20 focus:border-xle-primary outline-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                      >
                        <option value="">Chọn mục đích</option>
                        <option value="Đi du học">Đi du học</option>
                        <option value="Định cư nước ngoài">Định cư nước ngoài</option>
                        <option value="Đầu vào/ đầu ra đại học">Đầu vào/ đầu ra đại học</option>
                        <option value="Thăng tiến trong công việc">Thăng tiến trong công việc</option>
                        <option value="Rất yêu thích tiếng Anh">Rất yêu thích tiếng Anh</option>
                        <option value="Lí do khác">Lí do khác</option>
                      </select>
                      {touched.motivation && errors.motivation && (
                        <p className="text-xs font-medium text-red-500 mt-1">{errors.motivation}</p>
                      )}
                    </div>

                    {form.motivation === "Lí do khác" && (
                      <div className="space-y-1.5">
                        <label
                          className="text-xs font-bold uppercase tracking-wider text-xle-text-secondary"
                          htmlFor="otherReason"
                        >
                          Lí do khác
                        </label>
                        <input
                          id="otherReason"
                          type="text"
                          value={form.otherReason}
                          onBlur={() => setTouched((prev) => ({ ...prev, otherReason: true }))}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, otherReason: e.target.value }))
                          }
                          className="h-12 w-full rounded-lg bg-xle-muted/30 border border-black/[0.08] px-4 font-medium transition-all focus:bg-white focus:ring-2 focus:ring-xle-primary/20 focus:border-xle-primary outline-none"
                          placeholder="Nhập lí do của bạn"
                        />
                        {touched.otherReason && errors.otherReason && (
                          <p className="text-xs font-medium text-red-500 mt-1">{errors.otherReason}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button-primary h-14 w-full text-base flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      "Nhận bảng chẩn bệnh miễn phí"
                    )}
                  </button>
                  
                  <p className="text-center text-[10px] text-xle-text-secondary uppercase tracking-widest font-bold">
                    Thông tin của bạn được bảo mật tuyệt đối
                  </p>
                  {submitError && (
                    <p className="text-center text-sm font-semibold text-red-500">{submitError}</p>
                  )}
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center animate-in fade-in zoom-in duration-500">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Cảm ơn bạn!</h2>
                    <p className="text-xle-text-secondary max-w-xs mx-auto leading-relaxed">
                      Xa Lộ đã nhận được thông tin. Đội ngũ tư vấn sẽ liên hệ với bạn trong vòng 24h để sắp xếp lịch kiểm tra phù hợp nhất nhé.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-extrabold md:text-4xl text-foreground">Tại sao chọn Xa Lộ</h2>
            <p className="mt-4 text-xle-text-secondary max-w-2xl mx-auto text-lg">Hệ thống đánh giá chuyên sâu giúp bạn tiết kiệm thời gian và tối ưu hóa lộ trình đạt band điểm mong muốn.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                title: "Giáo viên 8.0+ IELTS",
                content: "Đội ngũ chuyên gia có từ 5-10 năm kinh nghiệm giảng dạy và am hiểu sâu sắc tiêu chí chấm thi quốc tế.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                color: "text-blue-600 bg-blue-50"
              },
              {
                title: "Chấm bài thủ công 100%",
                content: "Cam kết không sử dụng AI. Mỗi bài làm đều được chuyên gia trực tiếp đọc, nghe và phân tích từng lỗi nhỏ.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
                color: "text-xle-primary bg-xle-muted"
              },
              {
                title: "Bảng chẩn bệnh độc quyền",
                content: "Hệ thống phân tích chuyên sâu điểm mạnh, điểm yếu và gợi ý cải thiện cụ thể cho từng kỹ năng.",
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
                className="stripe-card relative group p-8 border border-black/[0.03] hover:border-xle-primary/20 transition-all duration-300"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <svg className="w-24 h-24 rotate-12" fill="currentColor" viewBox="0 0 100 100">
                    <path d="M0 100 L50 0 L100 100 Z" />
                  </svg>
                </div>
                
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} group-hover:scale-110 transition-transform duration-500`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-extrabold mb-3 text-foreground tracking-tight">{item.title}</h3>
                <p className="text-xle-text-secondary leading-relaxed text-[15px]">{item.content}</p>
                
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-xle-primary opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Tìm hiểu thêm
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Proof Section */}
      <section className="bg-white pb-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <span className="text-xle-primary font-bold tracking-widest uppercase text-sm">Kết quả mẫu</span>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl text-foreground">Bảng chẩn bệnh thực tế</h2>
            <p className="mt-4 text-xle-text-secondary max-w-2xl mx-auto">
              Xem trước định dạng bảng chẩn bệnh chi tiết mà bạn sẽ nhận được sau khi hoàn thành bài test.
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
                    alt={`Bảng chẩn bệnh ${item.name}`} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {idx === 8 ? (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 z-10">
                      <p className="text-white font-extrabold text-sm md:text-lg leading-tight uppercase tracking-wider">
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

      {/* Web_1 Image Section */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative w-full overflow-hidden rounded-2xl border border-black/[0.05] shadow-sm">
            <Image 
              src="/Web_1.jpg" 
              alt="Xa Lộ English Feature" 
              width={1920} 
              height={1080} 
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-xle-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6 space-y-12">
          {/* Main Info Area */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <h2 className="text-4xl font-extrabold md:text-5xl tracking-tight">Xa Lộ English</h2>
                <p className="text-xl font-bold text-xle-primary">Học đúng cách khi hiểu đúng mình.</p>
              </div>
              <div className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
                {[
                  "Chấm bài 100% thủ công",
                  "Phân tích chuyên sâu 4 kỹ năng",
                  "Lịch test linh hoạt",
                  "Hỗ trợ Online & Offline"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-xle-accent" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden border border-black/[0.05]">
              <Image 
                src="/Facebook Cover.jpg" 
                alt="Xa Lộ English Facebook Cover" 
                fill 
                className="object-cover"
              />
            </div>
          </div>

          {/* Horizontal Contact Bar */}
          <div className="stripe-card p-8 md:p-10 bg-white border border-black/[0.03]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-xle-muted text-2xl shadow-inner">📍</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-xle-primary mb-1">Địa chỉ</p>
                  <p className="text-sm font-bold text-foreground leading-tight">250 Nguyễn Đình Chính, P.11, Phú Nhuận, HCM</p>
                </div>
              </div>
              <div className="flex items-center gap-5 md:border-x border-black/[0.05] md:px-10">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-xle-muted text-2xl shadow-inner">📞</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-xle-primary mb-1">Hotline</p>
                  <p className="text-sm font-bold text-foreground">078 6688 149</p>
                </div>
              </div>
              <div className="flex items-center gap-5 md:pl-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-xle-muted text-2xl shadow-inner">✉️</div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-xle-primary mb-1">Email</p>
                  <p className="text-sm font-bold text-foreground break-all">xalo.english.bddept@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="stripe-gradient py-16 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 L50 0 L100 100 Z" fill="white" />
          </svg>
        </div>
        <div className="mx-auto relative z-10 flex max-w-4xl flex-col items-center text-center px-6">
          <h2 className="text-3xl font-extrabold md:text-5xl leading-tight">
            Bắt đầu kiểm tra trình độ <br /> IELTS của bạn ngay hôm nay
          </h2>
          <p className="mt-6 text-lg text-white/80 font-medium max-w-xl">
            Đừng để band điểm mơ hồ cản trở giấc mơ của bạn. Nhận đánh giá chính xác từ chuyên gia ngay.
          </p>
          <button
            type="button"
            onClick={scrollToForm}
            className="button-accent mt-10 h-16 px-12 text-lg shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Đăng kí test miễn phí ngay
          </button>
          
          <div className="mt-16 pt-8 border-t border-white/20 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
            <p>© 2026 Xalo Academy. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
        <a
          href="https://zalo.me/0354943544"
          target="_blank"
          rel="noreferrer"
          aria-label="Liên hệ Zalo"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0068ff] text-[11px] font-bold text-white shadow-lg transition hover:scale-105"
        >
          Zalo
        </a>
        <a
          href="https://www.facebook.com/xalo.english"
          target="_blank"
          rel="noreferrer"
          aria-label="Liên hệ Facebook"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-lg transition hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
            <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.5V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
          </svg>
        </a>
      </div>
    </main>
  );
}
