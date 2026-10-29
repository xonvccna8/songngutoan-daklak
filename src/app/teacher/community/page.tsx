"use client";

// GV: Cộng đồng học tập của từng lớp — duyệt bài / trả lời của học sinh, chọn trả lời hay nhất, đăng thông báo, câu hỏi gợi mở
import { useState } from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/common";
import { Chip } from "@/components/messages/compose-dialog";
import { CommunityFeed } from "@/components/community/feed";
import { useAuth } from "@/lib/auth/auth-context";
import { useMyClasses } from "@/lib/hooks/use-firestore";

export default function TeacherCommunityPage() {
  const { user } = useAuth();
  const { data: classes, loading } = useMyClasses();
  const [classId, setClassId] = useState<string | null>(null);
  const cls = classes.find((c) => c.id === classId) ?? classes[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
        <Users className="size-8 text-teal" /> Cộng đồng học tập
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        Góc hỏi – đáp của lớp. Bài và câu trả lời của học sinh chỉ hiện sau khi thầy cô duyệt; không có nhắn tin riêng giữa học sinh, không đăng link. Chọn “Hay nhất” để thưởng XP và khuyến khích các em trả lời bằng tiếng Anh.
      </p>
      {!loading && !classes.length ? (
        <EmptyState className="mt-6" title="Chưa có lớp nào" />
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {classes.map((c) => (
              <Chip key={c.id} on={c.id === cls?.id} onClick={() => setClassId(c.id)}>
                Lớp {c.name}
              </Chip>
            ))}
          </div>
          <div className="mt-4">{cls && user && <CommunityFeed key={cls.id} classId={cls.id} uid={user.uid} staff />}</div>
        </>
      )}
    </div>
  );
}
