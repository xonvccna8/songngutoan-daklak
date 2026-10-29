"use client";

// Tab Phân tích: tiến bộ theo tiết (Toán vs Ngôn ngữ), điểm TB mỗi tiết, câu sai nhiều, từ phát âm sai nhiều.
// Quy tắc biểu đồ: mỗi biểu đồ một trục; màu theo đối tượng (Toán = xanh dương, Ngôn ngữ = cam đỏ, đã kiểm tra mù màu);
// có chú giải + nhãn trực tiếp + bảng số liệu; chữ dùng màu chữ, không dùng màu của đường.
import { Bar as RBar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Volume2 } from "lucide-react";
import { EmptyState } from "@/components/common";
import { progress, topWrongQuestions, topWrongWords, type ProgressPoint } from "@/lib/analytics";
import { say } from "@/lib/live/speech";
import type { SessionDoc } from "@/lib/live/types";

export const SKILL_COLOR = { "Toán": "#2F5BEA", "Ngôn ngữ": "#E8492E" } as const;
const INK = "#14213D";
const INK2 = "#51607A";
const GRID = "#E1E8F5";

function Card({ title, sub, children, className }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card-lsn min-w-0 p-5 ${className ?? ""}`}>
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      {sub && <p className="text-xs text-ink-2">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProgressTip({ active, payload }: { active?: boolean; payload?: { payload: ProgressPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border-2 border-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-ink">
        {p.label} · {p.title}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-ink">
        <i className="size-2.5 rounded-full" style={{ background: SKILL_COLOR["Toán"] }} /> Toán: <b>{p.mathPct ?? "—"}%</b>
      </p>
      <p className="flex items-center gap-1.5 text-ink">
        <i className="size-2.5 rounded-full" style={{ background: SKILL_COLOR["Ngôn ngữ"] }} /> Ngôn ngữ: <b>{p.langPct ?? "—"}%</b>
      </p>
      <p className="text-ink-2">
        {p.participants} em · điểm TB {p.avgPoints}
      </p>
    </div>
  );
}

export function ClassAnalytics({ sessions }: { sessions: SessionDoc[] }) {
  const data = progress(sessions);
  const wrongQ = topWrongQuestions(sessions);
  const words = topWrongWords(sessions);
  if (data.length === 0) return <EmptyState title="Chưa đủ dữ liệu">Phân tích sẽ hiện sau khi lớp học xong ít nhất một tiết.</EmptyState>;
  const last = data[data.length - 1];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Tỉ lệ đúng theo tiết" sub="Tách phần Toán và phần Ngôn ngữ để biết em yếu kiến thức hay yếu tiếng Anh" className="xl:col-span-2">
        {/* Chú giải (luôn có khi ≥ 2 đường) */}
        <div className="mb-2 flex flex-wrap gap-4 text-xs font-semibold text-ink">
          {(["Toán", "Ngôn ngữ"] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <i className="h-0.5 w-5 rounded-full" style={{ background: SKILL_COLOR[k] }} />
              <i className="-ml-3.5 size-2 rounded-full" style={{ background: SKILL_COLOR[k] }} /> {k}
            </span>
          ))}
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 14, right: 108, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: INK2, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" tick={{ fill: INK2, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ProgressTip />} cursor={{ stroke: INK2, strokeDasharray: "4 4" }} />
              {(["Toán", "Ngôn ngữ"] as const).map((k) => (
                <Line
                  key={k}
                  dataKey={k === "Toán" ? "mathPct" : "langPct"}
                  name={k}
                  stroke={SKILL_COLOR[k]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: SKILL_COLOR[k], stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={false}
                >
                  {/* Nhãn trực tiếp ở điểm cuối, chữ màu mực */}
                  <LabelList
                    dataKey={k === "Toán" ? "mathPct" : "langPct"}
                    content={(props) => {
                      const { x, y, index, value } = props as { x?: number; y?: number; index?: number; value?: number };
                      if (index !== data.length - 1 || value == null || x == null || y == null) return null;
                      // Hai giá trị cuối gần nhau → tách nhãn (cao hơn lên trên, thấp hơn xuống dưới)
                      const other = k === "Toán" ? last.langPct : last.mathPct;
                      const close = other != null && Math.abs(other - value) < 8;
                      const dy = !close ? 4 : value > other! || (value === other && k === "Toán") ? -7 : 15;
                      return (
                        <text x={x + 10} y={y + dy} fontSize={12} fontWeight={700} fill={INK}>
                          {k} {value}%
                        </text>
                      );
                    }}
                  />
                </Line>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-blue">Xem dạng bảng</summary>
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="text-left text-ink-2">
                <th className="py-1">Ngày</th>
                <th>Tiết</th>
                <th className="text-right">Toán</th>
                <th className="text-right">Ngôn ngữ</th>
                <th className="text-right">Điểm TB</th>
                <th className="text-right">Số em</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-1">{p.label}</td>
                  <td>{p.title}</td>
                  <td className="text-right tabular-nums">{p.mathPct ?? "—"}%</td>
                  <td className="text-right tabular-nums">{p.langPct ?? "—"}%</td>
                  <td className="text-right tabular-nums">{p.avgPoints}</td>
                  <td className="text-right tabular-nums">{p.participants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <p className="mt-3 text-sm text-ink-2">
          Tiết gần nhất ({last.label}): Toán <b className="text-ink">{last.mathPct ?? "—"}%</b>, Ngôn ngữ <b className="text-ink">{last.langPct ?? "—"}%</b>.
        </p>
      </Card>

      <Card title="Điểm trung bình mỗi tiết" sub="Điểm trung bình của một em trong mỗi tiết">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: -18 }} barCategoryGap="25%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: INK2, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fill: INK2, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ProgressTip />} cursor={{ fill: "rgba(28,27,58,.05)" }} />
              <RBar dataKey="avgPoints" name="Điểm TB" fill={SKILL_COLOR["Toán"]} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                <LabelList dataKey="avgPoints" position="top" fill={INK} fontSize={11} fontWeight={700} />
              </RBar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Từ phát âm sai nhiều nhất" sub="Từ các lượt luyện nói — bấm loa để nghe mẫu">
        {words.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có dữ liệu luyện nói.</p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {words.map((w, i) => (
              <li key={w.word} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2">
                <span className="w-5 text-xs font-bold text-ink-2">{i + 1}</span>
                <span className="flex-1 font-semibold text-en">{w.word}</span>
                <span className="text-xs font-bold text-ink-2 tabular-nums">{w.count} lượt</span>
                <button onClick={() => say(w.word, 0.8)} className="grid size-8 place-items-center rounded-lg text-blue-dk hover:bg-blue-soft" aria-label={`Nghe ${w.word}`}>
                  <Volume2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Câu sai nhiều nhất" sub="Gộp mọi lần dạy — kèm đáp án sai hay gặp để biết lỗi nằm ở đâu" className="xl:col-span-2">
        <ul className="flex flex-col gap-3">
          {wrongQ.map((q) => (
            <li key={q.key} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{q.title}</p>
                <p className="text-xs text-ink-2">
                  <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-paper px-1.5 py-0.5 font-bold text-ink">
                    <i className="size-2 rounded-full" style={{ background: SKILL_COLOR[q.skill as keyof typeof SKILL_COLOR] ?? INK2 }} />
                    {q.skill}
                  </span>
                  {q.lesson} · {q.answered} lượt trả lời
                  {q.topWrong && (
                    <>
                      {" "}
                      · hay chọn sai: <b className="text-ink">{q.topWrong}</b>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-paper">
                  <i className="block h-full rounded-r-[4px]" style={{ width: `${q.wrongPct}%`, background: SKILL_COLOR[q.skill as keyof typeof SKILL_COLOR] ?? INK2 }} />
                </span>
                <b className="w-16 text-right text-sm tabular-nums">{q.wrongPct}% sai</b>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
