import { Tam } from "@/components/brand/tam";

/** Hiện khi chưa điền cấu hình Firebase trong .env.local */
export function SetupNotice() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-paper p-6">
      <div className="card-lsn max-w-lg p-8 text-center">
        <Tam mood="alert" className="mx-auto size-20" />
        <h1 className="mt-3 text-2xl font-extrabold">Chưa kết nối Firebase</h1>
        <p className="mt-2 text-ink-2">
          Hãy sao chép <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-sm">.env.example</code> thành{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-sm">.env.local</code>, điền cấu hình Web app của
          Firebase rồi khởi động lại <code className="font-mono text-sm">npm run dev</code>.
        </p>
      </div>
    </div>
  );
}
