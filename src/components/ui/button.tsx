import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Nút phẳng, bo 12px, bóng mềm; nhấn xuống lún nhẹ 1px
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-150 outline-none select-none focus-visible:ring-4 focus-visible:ring-blue/25 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-blue text-white shadow-[0_1px_2px_rgba(20,33,61,.12),0_4px_12px_-4px_rgba(47,91,234,.45)] hover:bg-blue-dk",
        sun: "bg-sun text-ink shadow-[0_1px_2px_rgba(20,33,61,.1),0_4px_12px_-4px_rgba(224,168,0,.5)] hover:bg-[#f5bd27]",
        coral:
          "bg-coral text-white shadow-[0_1px_2px_rgba(20,33,61,.12),0_4px_12px_-4px_rgba(232,73,46,.45)] hover:bg-coral-dk",
        teal: "bg-teal text-white shadow-[0_1px_2px_rgba(20,33,61,.12),0_4px_12px_-4px_rgba(14,159,138,.45)] hover:bg-teal-dk",
        ink: "bg-ink text-white shadow-[0_1px_2px_rgba(20,33,61,.2)] hover:bg-[#22325a]",
        outline:
          "border-line-2 bg-white text-ink shadow-[0_1px_2px_rgba(20,33,61,.06)] hover:border-blue/40 hover:bg-blue-soft/40 hover:text-blue-dk",
        secondary:
          "bg-secondary text-ink hover:bg-[#e1e8f5]",
        ghost: "text-ink hover:bg-ink/5",
        destructive:
          "bg-coral-soft text-coral-dk hover:bg-[#ffd6cc]",
        link: "text-blue underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 text-[15px]",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-2xl px-8 text-lg",
        icon: "size-10",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
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
