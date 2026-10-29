import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  ChevronRight,
  Database,
  FileText,
  Lightbulb,
  PieChart,
  Sparkles,
  Languages,
  MonitorPlay,
  Shapes,
  Sigma,
  Smartphone,
  Triangle,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Tam } from "@/components/brand/tam";
import { FloatingShapes, SHAPE_COLORS, ShapeIcon, type ShapeKind } from "@/components/brand/shapes";
import { cn } from "cn";
import { APP_DESCRIPTION, SUBJECT } from "@/lib/subject";

const ANSWERS: { kind: ShapeKind; en: string }[] = [
  { kind: "triangle", en: "hypotenuse" },
  { kind: "diamond", en: "leg" },
  { kind: "circle", en: "altitude" },
  { kind: "square", en: "median" },
];

const FEATURES = [
  {
    icon: MonitorPlay,
    color: "bg-blue",
    title: "Một nút Tiếp cho cả tiết",
    en: "One button runs the lesson",
    text: "Hiện từng bước, mở câu hỏi, khoá, công bố đáp án — bằng phím Space hay bút trình chiếu.",
  },
  {
    icon: Smartphone,
    color: "bg-coral",
    title: "Tivi · Laptop · Điện thoại",
    en: "Three screens in sync",
    text: "Điện thoại học sinh hiện đúng nội dung trên tivi, tự chuyển sang chế độ trả lời khi câu hỏi mở.",
  },
  {
    icon: Languages,
    color: "bg-teal",
    title: "Song ngữ có phát âm",
    en: "Bilingual, with pronunciation",
    text: "Bảng thuật ngữ, câu mẫu kèm nút nghe; giáo viên Toán không cần giỏi tiếng Anh vẫn dạy tự tin.",
  },
  {
    icon: BarChart3,
    color: "bg-sun",
    title: "Theo dõi từng em",
    en: "Every student, in real time",
    text: "Ai đang học, ai rời trang, đúng sai phần Toán hay phần Ngôn ngữ — thấy ngay trên laptop.",
  },
];

/** 8 chức năng chính (khớp tấm áp phích dự án) — mỗi ô dẫn tới nơi dùng thật */
const MAIN_FEATURES = [
  {
    icon: BookOpen,
    from: "#7C3AED",
    to: "#4F46E5",
    vi: "Bài học song ngữ",
    en: "Bilingual lessons",
    text: "Bài giảng hai cột Việt – Anh, nút nghe phát âm, công tắc Anh / Song ngữ / Việt; dạy trên tivi, HS trả lời bằng điện thoại.",
  },
  {
    icon: Shapes,
    from: "#2563EB",
    to: "#0891B2",
    vi: "Hình học động · Mô phỏng",
    en: "Dynamic geometry & simulations",
    text: "GeoGebra và mô phỏng PhET cho Toán 6–9: kéo hình, vẽ đồ thị, thả xác suất; đổi giao diện Anh/Việt, có nhiệm vụ song ngữ.",
  },
  {
    icon: Sparkles,
    from: "#9333EA",
    to: "#C026D3",
    vi: "Bài tập AI tương tác",
    en: "AI-powered practice",
    text: "AI soạn câu hỏi song ngữ theo yêu cầu cần đạt; HS làm trên điện thoại, chấm ngay, gợi ý 3 tầng, AI chấm phát âm.",
  },
  {
    icon: Database,
    from: "#EA580C",
    to: "#F59E0B",
    vi: "Ngân hàng câu hỏi",
    en: "Question bank",
    text: "Câu hỏi gắn bài SGK, YCCĐ, mức Biết / Hiểu / Vận dụng (TT 22); giao bài 1 chạm, xuất đề Word kèm đáp án.",
  },
  {
    icon: Lightbulb,
    from: "#DC2626",
    to: "#F97316",
    vi: "Dự án STEM",
    en: "STEM projects",
    text: "Mỗi tổ một sản phẩm theo 6 bước thiết kế kĩ thuật, nhật kí song ngữ, nộp link sản phẩm, chấm rubric 4 tiêu chí.",
  },
  {
    icon: FileText,
    from: "#16A34A",
    to: "#0D9488",
    vi: "Tạo giáo án song ngữ",
    en: "Bilingual lesson plans",
    text: "Soạn theo CV 5512 + khung 4C, AI gợi ý phần tiếng Anh từ giáo án tiếng Việt, xuất Word, quy trình duyệt bài.",
  },
  {
    icon: BarChart3,
    from: "#F97316",
    to: "#EAB308",
    vi: "Đánh giá – Theo dõi tiến độ",
    en: "Assessment & progress",
    text: "Ai đang học, đúng sai phần Toán / Ngôn ngữ, Sao thành thạo theo YCCĐ, XP – cấp độ, bảng điểm xuất Excel.",
  },
  {
    icon: Users,
    from: "#2563EB",
    to: "#4F46E5",
    vi: "Cộng đồng học tập",
    en: "Learning community",
    text: "Góc hỏi – đáp của lớp có thầy cô kiểm duyệt, khung câu giúp hỏi bằng tiếng Anh, thưởng XP cho câu trả lời hay.",
  },
];

/** 3 mạch nội dung môn Toán THCS (CT GDPT 2018, sách Kết nối tri thức, lớp 6–9) */
const STRAND_CARDS = [
  { icon: Sigma, grade: "Lớp 6 → 9", vi: "Số và Đại số", en: "Numbers and Algebra", text: "Số tự nhiên, phân số, số thực → đa thức, hằng đẳng thức → phương trình, hàm số bậc nhất, bậc hai", color: "#2F5BEA", soft: "#E3EAFF" },
  { icon: Triangle, grade: "Lớp 6 → 9", vi: "Hình học và Đo lường", en: "Geometry and Measurement", text: "Hình phẳng, góc, tam giác → tứ giác, Thalès, Pythagore → tỉ số lượng giác, đường tròn, hình khối", color: "#0E9F8A", soft: "#DDF5F0" },
  { icon: PieChart, grade: "Lớp 6 → 9", vi: "Thống kê và Xác suất", en: "Statistics and Probability", text: "Thu thập dữ liệu, biểu đồ cột, quạt tròn, đoạn thẳng → tần số, xác suất của biến cố", color: "#E8492E", soft: "#FFE6E0" },
];

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      {/* Thanh trên */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
            Giáo viên
          </Link>
          <Link href="/s/login" className={buttonVariants({ variant: "ink", size: "sm" })}>
            Vào lớp <ArrowRight />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <FloatingShapes />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-6 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-white px-3 py-1.5 text-xs font-bold text-ink-2">
              <span className="size-2 rounded-full bg-teal" /> {SUBJECT.vi} THCS · Song ngữ Việt – Anh
            </span>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl lg:text-[4.2rem]">
              Mỗi tiết {SUBJECT.short},{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">thêm một</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-4 rounded-full bg-sun/70 sm:h-5" />
              </span>{" "}
              tiết tiếng Anh.
            </h1>
            <p className="text-en mt-4 font-display text-xl font-semibold sm:text-2xl">Learn maths. Speak English.</p>
            <p className="mt-4 max-w-xl text-base text-ink-2 sm:text-lg">
              Lớp Song Ngữ giúp thầy cô dạy trực tiếp trên tivi, học sinh trả lời bằng điện thoại, và mọi kết quả được lưu
              lại để theo dõi tiến bộ của từng em.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/s/login" className={buttonVariants({ variant: "sun", size: "xl" })}>
                Em là học sinh — Vào lớp <ArrowRight />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "xl" })}>
                Thầy cô đăng nhập
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-sm font-semibold text-ink-2">
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-teal" /> Không cần email cho học sinh
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <BellRing className="size-4 text-coral" /> Nhắc chú ý 1 chạm
              </span>
            </div>
          </div>

          {/* Mô phỏng tivi + điện thoại */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="rounded-[28px] bg-ink-tv p-3 shadow-[0_30px_60px_-20px_rgba(20,33,61,.55)] ring-1 ring-white/10">
              <div className="rounded-[20px] bg-gradient-to-b from-[#1d3168] to-ink-tv p-5 font-present sm:p-7">
                <div className="flex items-center justify-between text-white/70">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">Câu 3 / 8</span>
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <span className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className={cn("size-1.5 rounded-full", i < 7 ? "bg-sun" : "bg-white/20")} />
                      ))}
                    </span>
                    21/30
                  </span>
                </div>
                <p className="mt-5 text-xl leading-snug font-semibold text-white sm:text-2xl">
                  The longest side of a right triangle is the <span className="rounded-md bg-sun px-1.5 text-ink">____</span>.
                </p>
                <p className="mt-1.5 text-sm text-white/55 italic">Cạnh dài nhất của tam giác vuông là ____.</p>
                <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
                  {ANSWERS.map((a) => {
                    const c = SHAPE_COLORS[a.kind];
                    return (
                      <div
                        key={a.kind}
                        className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 font-semibold sm:py-4"
                        style={{ background: c.bg, color: c.text, boxShadow: `0 5px 0 ${c.dk}` }}
                      >
                        <ShapeIcon kind={a.kind} color={c.text} className="size-5 opacity-90" />
                        {a.en}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mx-auto h-4 w-28 rounded-b-xl bg-ink-tv/80" />

            {/* Điện thoại HS + thẻ laptop GV, nằm dưới tivi để không che nội dung */}
            <div className="relative z-10 -mt-10 flex items-end justify-between gap-4 px-2 sm:px-6">
              <div className="w-[160px] rotate-[-5deg] rounded-[30px] bg-ink p-2 shadow-2xl sm:w-[180px]">
                <div className="flex flex-col items-center rounded-[24px] bg-success-bg px-3 pt-4 pb-4 text-center">
                  <Tam mood="cheer" className="size-14" />
                  <p className="mt-1 font-display text-lg font-extrabold text-success-fg">Correct!</p>
                  <p className="text-vi text-xs">Chính xác!</p>
                  <p className="mt-2 rounded-full bg-white px-3 py-1 font-display text-sm font-extrabold text-ink shadow-[0_3px_0_#d3dcee]">
                    +142 XP
                  </p>
                </div>
              </div>

              <div className="hidden w-56 rotate-[3deg] rounded-2xl border-2 border-line bg-white p-3 shadow-xl sm:block">
                <p className="text-xs font-bold text-ink-2">Lớp 8A · đang học</p>
                <div className="mt-2 space-y-1.5 text-xs font-semibold">
                  <p className="flex items-center justify-between rounded-lg bg-teal-soft px-2 py-1 text-[#0A6F5F]">
                    Đang theo dõi <b>24</b>
                  </p>
                  <p className="flex items-center justify-between rounded-lg bg-blue-soft px-2 py-1 text-blue-dk">
                    Đã trả lời <b>21</b>
                  </p>
                  <p className="flex items-center justify-between rounded-lg bg-coral-soft px-2 py-1 text-[#A3301B]">
                    Rời trang <b>2</b>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tính năng */}
      <section className="relative border-t-2 border-line bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Dạy song ngữ, nhẹ như một cú bấm</h2>
            <p className="text-en mt-2 font-display text-lg font-semibold">Built for real classrooms — TV, laptop and phones.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-lsn hover-glow group p-5">
                <span className={cn("hover-wiggle inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-[inset_0_-4px_0_rgba(0,0,0,.18)]", f.color)}>
                  <f.icon className={cn("size-6", f.color === "bg-sun" && "text-ink")} />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="text-en text-sm font-semibold">{f.en}</p>
                <p className="mt-2 text-sm text-ink-2">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Các chức năng chính */}
      <section className="relative border-t-2 border-line">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Các chức năng chính</h2>
            <p className="text-en mt-2 font-display text-lg font-semibold">Everything a bilingual maths class needs.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {MAIN_FEATURES.map((f) => (
              <div
                key={f.vi}
                className="hover-glow group flex flex-col rounded-[22px] p-4 text-white shadow-[0_6px_0_rgba(0,0,0,.15)] sm:p-5"
                style={{ background: `linear-gradient(140deg, ${f.from}, ${f.to})` }}
              >
                <f.icon className="hover-wiggle size-9 sm:size-11" strokeWidth={1.8} />
                <h3 className="mt-3 text-base leading-snug font-extrabold sm:text-lg">{f.vi}</h3>
                <p className="text-sm font-semibold text-white/80">{f.en}</p>
                <p className="mt-2 hidden text-sm text-white/90 sm:block">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 mạch nội dung Toán */}
      <section className="relative overflow-hidden border-t-2 border-line">
        <div className="bg-grid absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-soft px-3 py-1 text-xs font-bold text-blue-dk">
                <Sigma className="size-3.5" /> 3 mạch nội dung · Toán 6–9
              </span>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Học Toán bằng hai ngôn ngữ</h2>
              <p className="text-en mt-2 font-display text-lg font-semibold">From fractions to quadratic equations — think, reason and explain in English.</p>
            </div>
            <Tam mood="cheer" className="hidden size-28 shrink-0 md:block" />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STRAND_CARDS.map((t) => (
              <div key={t.vi} className="card-lsn hover-glow group flex items-start gap-4 p-5">
                <span className="hover-wiggle grid size-14 shrink-0 place-items-center rounded-2xl" style={{ background: t.soft, color: t.color }}>
                  <t.icon className="size-7" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-wide uppercase" style={{ color: t.color }}>
                    {t.grade}
                  </p>
                  <h3 className="mt-0.5 text-lg leading-snug font-bold">{t.vi}</h3>
                  <p className="text-en text-sm font-semibold">{t.en}</p>
                  <p className="mt-2 text-sm text-ink-2">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kêu gọi */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-6 py-10 text-white sm:px-12">
          <FloatingShapes tone="dark" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <Tam mood="happy" className="hidden size-24 shrink-0 sm:block" />
              <div>
                <h2 className="text-2xl font-extrabold sm:text-3xl">Sẵn sàng cho tiết học đầu tiên?</h2>
                <p className="mt-1 text-white/70">Tạo lớp, dán danh sách từ Excel, in phiếu PIN — chưa tới 5 phút.</p>
              </div>
            </div>
            <Link href="/login" className={buttonVariants({ variant: "sun", size: "lg" })}>
              Bắt đầu ngay <ChevronRight />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-line py-6 text-center text-sm text-ink-2">
        © {new Date().getFullYear()} Lớp Song Ngữ · {APP_DESCRIPTION}
      </footer>
    </main>
  );
}
