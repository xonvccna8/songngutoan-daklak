// Đọc tiết học phía máy chủ (có bộ nhớ đệm trong lúc hàm Vercel còn "ấm")
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";
import type { Slide, TeacherKey } from "@/lib/live/types";

const cache = new Map<string, { at: number; slides: Map<string, Slide>; keys: Map<string, TeacherKey> }>();
const TTL = 5 * 60_000;

export async function loadLessonForGrading(lessonId: string) {
  const hit = cache.get(lessonId);
  if (hit && Date.now() - hit.at < TTL) return hit;
  const ref = adminDb().collection(COL.lessons).doc(lessonId);
  const [slides, keys] = await Promise.all([ref.collection(COL.slides).get(), ref.collection(COL.teacherKeys).get()]);
  const entry = {
    at: Date.now(),
    slides: new Map(slides.docs.map((d) => [d.id, d.data() as Slide])),
    keys: new Map(keys.docs.map((d) => [d.id, d.data() as TeacherKey])),
  };
  cache.set(lessonId, entry);
  return entry;
}
