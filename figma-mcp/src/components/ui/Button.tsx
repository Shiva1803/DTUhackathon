import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * 
 * Design System Implementation:
 * - Variants: Primary, Secondary, Ghost, Danger, Link
 * - States: Loading, Disabled, Focus-visible
 * - Motion: Subtle scale on active, smooth transitions
 */

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transition-all duration-200",
    {
        variants: {
            variant: {
                primary: "bg-white text-black hover:bg-neutral-200 shadow-glow hover:shadow-glow-lg font-semibold",
                secondary: "bg-surface-darker text-text-primary hover:bg-surface-dark border border-white/10 glass",
                ghost: "hover:bg-white/5 text-text-primary hover:text-white",
                danger: "bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 border border-accent-danger/20",
                link: "text-text-primary underline-offset-4 hover:underline",
                glass: "glass text-white hover:bg-white/10 shadow-glass backdrop-blur-md"
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
            fullWidth: {
                true: "w-full",
            }
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
            fullWidth: false,
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, fullWidth, className }))}
                ref={ref}
                disabled={props.disabled || loading}
                aria-busy={loading}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants }; // eslint-disable-line react-refresh/only-export-components
