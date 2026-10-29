// Gửi thông báo đẩy (Firebase Cloud Messaging) tới điện thoại học sinh khi web đã đóng / tắt màn hình
import { getMessaging } from "firebase-admin/messaging";
import { getApps } from "firebase-admin/app";
import { adminDb } from "@/lib/firebase/admin";
import { COL } from "@/lib/namespace";

export interface PushPayload {
  mid: string;
  kind: string;
  title: string;
  body: string;
  silent: boolean;
  /** Trang mở ra khi bấm thông báo (mặc định /s) */
  url?: string;
}

/** Trả về số thiết bị gửi thành công; tự xoá mã thiết bị đã hết hạn */
export async function sendPush(uids: string[], p: PushPayload): Promise<number> {
  const db = adminDb(); // bảo đảm app đã khởi tạo
  const snaps = await Promise.all(uids.map((u) => db.collection(COL.fcmTokens).doc(u).collection(COL.tokens).get()));
  const entries = snaps.flatMap((s) => s.docs.map((d) => ({ ref: d.ref, token: d.get("token") as string }))).filter((e) => e.token);
  if (!entries.length) return 0;

  const messaging = getMessaging(getApps()[0]);
  let ok = 0;
  for (let i = 0; i < entries.length; i += 500) {
    const part = entries.slice(i, i + 500);
    const res = await messaging.sendEachForMulticast({
      tokens: part.map((e) => e.token),
      // Chỉ gửi "data": service worker /lsn-sw.js tự hiện thông báo (chuông, rung, giữ trên màn hình)
      data: { mid: p.mid, kind: p.kind, title: p.title, body: p.body, silent: p.silent ? "1" : "0", url: p.url ?? "/s" },
      webpush: { headers: { Urgency: p.kind === "attention" ? "high" : "normal", TTL: "3600" } },
    });
    ok += res.successCount;
    await Promise.all(
      res.responses.map((r, k) => {
        const code = r.error?.code ?? "";
        if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token") || code.includes("invalid-argument")) {
          return part[k].ref.delete().catch(() => undefined);
        }
      })
    );
  }
  return ok;
}
