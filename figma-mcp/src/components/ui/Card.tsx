import * as React from "react";
import { cn } from "@/utils/cn";

/**
 * Card Component
 * 
 * Design System Implementation:
 * - Base: Clean, minimal container
 * - Glass: Glassmorphism effect for overlay cards
 * - Interactive: Hover states for actionable cards
 */

// Root Card
const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'glass' | 'interactive' | 'flat' }
>(({ className, variant = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-bg-secondary border border-white/5 shadow-sm",
        glass: "glass-card",
        interactive: "bg-bg-secondary border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        flat: "bg-surface-darker/50 border border-white/5"
    };

    return (
        <div
            ref={ref}
            className={cn(
                "rounded-xl text-text-primary overflow-hidden",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});
Card.displayName = "Card";

// Card Header
const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

// Card Title
const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-xl font-display font-semibold leading-none tracking-tight text-text-primary",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-text-secondary", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
