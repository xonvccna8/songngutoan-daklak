"use client";

// HS: Cộng đồng học tập — hỏi đáp, chia sẻ với cả lớp (thầy cô duyệt trước khi hiện)
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { CommunityFeed } from "@/components/community/feed";

export default function StudentCommunityPage() {
  return (
    <StudentShell>
      <Community />
    </StudentShell>
  );
}

function Community() {
  const { uid, classId } = useStudent();
  return (
    <>
      <StudentHeader vi="Hỏi đáp lớp" en="Class Q&A" />
      <div className="px-5 pt-5">{uid && classId ? <CommunityFeed classId={classId} uid={uid} staff={false} compact /> : null}</div>
    </>
  );
}
