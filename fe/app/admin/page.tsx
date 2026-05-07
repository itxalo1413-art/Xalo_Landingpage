"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
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
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeads = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
        const response = await fetch(`${baseUrl}/admin/leads`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu lead.");
        }

        const data = (await response.json()) as Lead[];
        setLeads(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLeads();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/login");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Leads đăng ký</h1>
          <p className="text-sm text-xle-text-secondary">Tổng số: {leads.length}</p>
        </div>
        <button className="button-accent" onClick={logout} type="button">
          Đăng xuất
        </button>
      </div>

      <div className="stripe-card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-xle-text-secondary">Đang tải dữ liệu...</p>
        ) : error ? (
          <p className="p-6 text-sm font-semibold text-red-500">{error}</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-sm text-xle-text-secondary">Chưa có dữ liệu đăng ký.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-xle-muted/50 text-xle-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-bold">Họ tên</th>
                  <th className="px-4 py-3 font-bold">Số điện thoại</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Nguồn</th>
                  <th className="px-4 py-3 font-bold">Trình độ</th>
                  <th className="px-4 py-3 font-bold">Aim</th>
                  <th className="px-4 py-3 font-bold">Hình thức</th>
                  <th className="px-4 py-3 font-bold">Ngày + giờ</th>
                  <th className="px-4 py-3 font-bold">Speaking 1:1</th>
                  <th className="px-4 py-3 font-bold">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-black/[0.06]">
                    <td className="px-4 py-3 font-semibold">{lead.fullName}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.email}</td>
                    <td className="px-4 py-3">
                      {lead.referralSource}
                      {lead.referralSource === "Mục khác" && lead.referralOther
                        ? `: ${lead.referralOther}`
                        : ""}
                    </td>
                    <td className="px-4 py-3">{lead.currentLevel}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{lead.targetAim}</div>
                      {lead.expectedExamTime ? (
                        <div className="text-xs text-xle-text-secondary mt-1">
                          Thi: {lead.expectedExamTime}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold">{lead.testMode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{lead.testTimeSlot}</div>
                      <div className="text-xs text-xle-text-secondary mt-1">{lead.testDays}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[320px] whitespace-pre-wrap">
                      {lead.speakingSchedule}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(lead.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
