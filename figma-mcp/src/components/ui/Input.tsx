import * as React from "react";
import { cn } from "@/utils/cn";
import { AlertCircle } from "lucide-react";

/**
 * Input Component
 * 
 * Design System Implementation:
 * - Variants: Default, Ghost (for minimal forms)
 * - States: Error, Focus, Disabled
 * - Features: Helper text, Error messages, calm interactions
 */

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-secondary",
                            error && "text-accent-danger"
                        )}
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        type={type}
                        className={cn(
                            "flex h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-bg-primary file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                            "hover:border-white/20",
                            leftIcon && "pl-10",
                            rightIcon && "pr-10",
                            error && "border-accent-danger focus-visible:ring-accent-danger",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />

                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error ? (
                    <div className="flex items-center gap-x-1 text-sm text-accent-danger animate-slide-up">
                        <AlertCircle size={14} />
                        <p>{error}</p>
                    </div>
                ) : helperText ? (
                    <p className="text-xs text-text-secondary">{helperText}</p>
                ) : null}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
