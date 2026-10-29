import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Nút "phím bấm": bo 14px, bóng đổ đặc 4px phía dưới, nhấn xuống thì lún
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] border-2 border-transparent font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-100 outline-none select-none focus-visible:ring-4 focus-visible:ring-blue/30 active:translate-y-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-blue text-white shadow-[0_4px_0_var(--color-blue-dk)] hover:bg-[#1f9e55] active:shadow-[0_1px_0_var(--color-blue-dk)]",
        sun: "bg-sun text-ink shadow-[0_4px_0_var(--color-sun-dk)] hover:bg-[#ffd36b] active:shadow-[0_1px_0_var(--color-sun-dk)]",
        coral:
          "bg-coral text-white shadow-[0_4px_0_var(--color-coral-dk)] hover:bg-[#e5507f] active:shadow-[0_1px_0_var(--color-coral-dk)]",
        teal: "bg-teal text-white shadow-[0_4px_0_var(--color-teal-dk)] hover:bg-[#12a0b2] active:shadow-[0_1px_0_var(--color-teal-dk)]",
        ink: "bg-ink text-white shadow-[0_4px_0_#000] hover:bg-[#1a4a3d] active:shadow-[0_1px_0_#000]",
        outline:
          "border-line-2 bg-white text-ink shadow-[0_3px_0_var(--color-line-2)] hover:bg-paper active:shadow-[0_0_0_var(--color-line-2)]",
        secondary:
          "bg-secondary text-ink hover:bg-[#e1e8f5] active:translate-y-0",
        ghost: "text-ink hover:bg-ink/5 active:translate-y-0",
        destructive:
          "bg-coral-soft text-coral-dk hover:bg-[#ffcfdd] active:translate-y-0",
        link: "text-blue underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-11 px-5 text-[15px]",
        sm: "h-9 rounded-xl px-3.5 text-sm",
        lg: "h-14 rounded-2xl px-7 text-base",
        xl: "h-16 rounded-[18px] px-8 text-lg",
        icon: "size-11",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-14 rounded-2xl",
        // Giữ để tương thích với các thành phần shadcn khác
        xs: "h-7 rounded-lg px-2 text-xs",
        "icon-xs": "size-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
