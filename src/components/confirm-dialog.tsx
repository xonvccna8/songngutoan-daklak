"use client";

// Hộp xác nhận dùng kiểu "await confirm({...})" cho các thao tác khó hoàn tác
import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  danger?: boolean;
}

export function useConfirm() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (v: boolean) => {
    resolver.current(v);
    setOpts(null);
  };

  const element = (
    <AlertDialog open={!!opts} onOpenChange={(o) => !o && close(false)}>
      <AlertDialogContent className="rounded-3xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-extrabold">{opts?.title}</AlertDialogTitle>
          {opts?.description && <AlertDialogDescription className="text-ink-2">{opts.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
          <AlertDialogCancel variant="ghost">Huỷ</AlertDialogCancel>
          <Button variant={opts?.danger ? "coral" : "default"} onClick={() => close(true)}>
            {opts?.confirmText ?? "Đồng ý"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return [element, confirm] as const;
}
