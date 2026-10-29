"use client";

// HS: các dự án STEM của lớp em
import Link from "next/link";
import { ChevronRight, Lightbulb } from "lucide-react";
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { useProjects } from "@/lib/stem/hooks";
import { fmtDue } from "@/lib/format";

export default function StudentStemPage() {
  return (
    <StudentShell>
      <List />
    </StudentShell>
  );
}

function List() {
  const { classId, me } = useStudent();
  const { data, loading } = useProjects(classId ? [classId] : []);
  return (
    <>
      <StudentHeader vi="Dự án STEM" en="STEM projects" />
      <div className="px-5 pt-5">
        {loading ? null : data.length === 0 ? (
          <p className="card-lsn p-4 text-sm text-ink-2">Lớp em chưa có dự án nào. Khi thầy cô giao dự án, tổ em sẽ cùng làm ở đây.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.map((p) => (
              <li key={p.id}>
                <Link href={`/s/stem/${p.id}`} className="card-lsn flex items-center gap-3 p-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sun-soft text-[#8A5A00]">
                    <Lightbulb className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{p.title.vi}</b>
                    <span className="text-en block truncate text-sm">{p.title.en}</span>
                    <span className="text-xs text-ink-2">
                      Tổ {me?.team ?? "…"} · hạn {fmtDue(p.dueAt)}
                      {p.status === "closed" && " · đã đóng"}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-ink-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
