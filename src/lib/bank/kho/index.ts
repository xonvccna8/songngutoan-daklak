// Ngân hàng câu hỏi dựng sẵn (kho) — Toán 6–9, các bài trọng tâm. Nạp vào Firestore: npm run seed:bank
import { KHO_TOAN_67 } from "@/lib/bank/kho/toan-67";
import { KHO_TOAN_8 } from "@/lib/bank/kho/toan-8";
import { KHO_TOAN_9 } from "@/lib/bank/kho/toan-9";
import type { KhoQuestion } from "@/lib/bank/kho/helpers";

export const BANK_SEED = "kho-bank-toan-v1";
export const KHO_BANK: KhoQuestion[] = [...KHO_TOAN_67, ...KHO_TOAN_8, ...KHO_TOAN_9];

/** Mã tài liệu cố định: khot-<bài>-<số> (vd khot-k8-35-07) — khác tiền tố "kho8-" của kho KHTN nên không ghi đè */
export const bankDocId = (q: Pick<KhoQuestion, "curLessonId" | "key">) => `khot-${q.curLessonId}-${q.key}`;
