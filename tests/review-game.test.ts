// Trò chơi ôn tập + bài giảng PowerPoint: đủ 18 bài (30–47), câu hỏi hợp lệ, tạo được file .pptx
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { metaOf } from "@/lib/lessons/editor";
import { buildEditorPptx } from "@/lib/lessons/pptx";
import { KEYS, LESSON, SLIDES, TERMS } from "@/lib/lessons/pythagore";
import { NOTE_LESSONS, vocabOf } from "@/lib/notebook";
import { buildRound, matchRounds, quizPoints, scienceQuestions, starsOf, vocabQuestions } from "@/lib/review/game";
import { buildLessonPptx } from "@/lib/notebook/pptx";
import { detectEnv } from "@/components/pwa/install-card";

// Số ngẫu nhiên cố định để kết quả lặp lại được
function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe("trò chơi ôn tập", () => {
  it("bài nào cũng có câu từ vựng, câu kiến thức và cặp để ghép", () => {
    NOTE_LESSONS.forEach((l) => {
      const vocab = vocabOf(l.id, []);
      expect(vocabQuestions(l.id, vocab, seeded()).length, `Bài ${l.no}`).toBeGreaterThanOrEqual(5);
      expect(scienceQuestions(l.id, seeded()).length, `Bài ${l.no}`).toBeGreaterThanOrEqual(4);
      expect(matchRounds(vocab, seeded()).flat().length, `Bài ${l.no}`).toBeGreaterThanOrEqual(3);
    });
  });

  it("mỗi câu có đáp án nằm trong các lựa chọn, không trùng lựa chọn", () => {
    NOTE_LESSONS.forEach((l) => {
      const vocab = vocabOf(l.id, []);
      (["vocab", "science", "final"] as const).forEach((mode) => {
        buildRound(mode, l.id, vocab, seeded()).forEach((q) => {
          expect(q.answer, q.prompt).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
          expect(new Set(q.options.map((o) => o.toLowerCase())).size, q.prompt).toBe(q.options.length);
          if (q.tag.startsWith("Điền từ")) expect(q.prompt).toContain("___");
        });
      });
    });
  });

  it("lượt ghép cặp 3–7 cặp, không lặp từ", () => {
    const vocab = vocabOf(NOTE_LESSONS[0].id, []);
    const rounds = matchRounds(vocab, seeded());
    rounds.forEach((r) => expect(r.length).toBeGreaterThanOrEqual(3));
    const ids = rounds.flat().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("điểm: nhanh và chuỗi đúng được thưởng; sao theo tỉ lệ đúng", () => {
    expect(quizPoints(20, 0)).toBe(200);
    expect(quizPoints(0, 0)).toBe(100);
    expect(quizPoints(10, 5)).toBe(225);
    expect(quizPoints(10, 9)).toBe(225); // tối đa ×1.5
    expect([starsOf(10, 10), starsOf(7, 10), starsOf(4, 10), starsOf(1, 10)]).toEqual([3, 2, 1, 0]);
  });
});

describe("bài giảng PowerPoint song ngữ", () => {
  it("tạo được file .pptx cho cả 18 bài", async () => {
    for (const l of NOTE_LESSONS) {
      const pptx = await buildLessonPptx(l.id, vocabOf(l.id, []));
      const buf = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
      expect(buf.length, `Bài ${l.no}`).toBeGreaterThan(20_000);
      expect(buf.subarray(0, 2).toString()).toBe("PK"); // tệp zip hợp lệ
    }
  }, 60_000);
});

describe("PowerPoint của bài giảng tự soạn", () => {
  it("xuất được bài mẫu Định lí Pythagore (đủ các dạng trang)", async () => {
    const meta = metaOf({ ...LESSON, terms: TERMS });
    const slides = SLIDES.map((s) => ({ ...s, key: KEYS[s.id] }));
    const c = await buildEditorPptx(meta, slides, "GV mẫu");
    const buf = (await c.pptx.write({ outputType: "nodebuffer" })) as Buffer;
    expect(buf.subarray(0, 2).toString()).toBe("PK");
    if (process.env.OUT) writeFileSync(`${process.env.OUT}/pythagore.pptx`, buf);
  });
});

describe("nhận diện trình duyệt để hướng dẫn cài app", () => {
  it.each([
    ["Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0 Mobile Safari/537.36", "samsung"],
    ["Mozilla/5.0 (Linux; Android 12; Redmi Note 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36", "android"],
    ["Mozilla/5.0 (Linux; Android 12; V2111; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 Zalo android/12110", "inapp"],
    ["Mozilla/5.0 (Linux; Android 11; wv) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0;]", "inapp"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", "ios"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1", "ios-other"],
    ["Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0", "firefox"],
  ])("%s → %s", (ua, env) => expect(detectEnv(ua)).toBe(env));
});
