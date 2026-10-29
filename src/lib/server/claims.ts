// Gán/thu hồi quyền Lớp Song Ngữ: chỉ sửa các claims "lsn*", GIỮ NGUYÊN claims của app khác
import { adminAuth } from "@/lib/firebase/admin";
import { CLAIM, toClaims } from "@/lib/namespace";
import type { Claims } from "@/lib/types";

export async function setLsnClaims(uid: string, c: Claims | null) {
  const user = await adminAuth().getUser(uid);
  const merged: Record<string, unknown> = { ...(user.customClaims ?? {}) };
  for (const k of Object.values(CLAIM)) delete merged[k];
  if (c) Object.assign(merged, toClaims(c));
  await adminAuth().setCustomUserClaims(uid, merged);
}
