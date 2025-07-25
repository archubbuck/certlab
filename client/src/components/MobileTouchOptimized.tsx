import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileTouchOptimizedProps {
  children: React.ReactNode;
  className?: string;
  enableHaptic?: boolean;
  touchTargetSize?: "sm" | "md" | "lg";
}

export default function MobileTouchOptimized({
  children,
  className = "",
  enableHaptic = true,
  touchTargetSize = "md"
}: MobileTouchOptimizedProps) {
  const isMobile = useIsMobile();
  const [isPressed, setIsPressed] = useState(false);

  // Touch target size classes
  const sizeClasses = {
    sm: "min-h-[44px] min-w-[44px]", // iOS minimum
    md: "min-h-[48px] min-w-[48px]", // Android minimum
    lg: "min-h-[56px] min-w-[56px]"  // Comfortable touch
  };

  // Simulated haptic feedback through visual cues (since web doesn't support real haptic)
  const simulateHaptic = () => {
    if (!enableHaptic || !isMobile) return;
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    // Add subtle shake animation for feedback
    const element = document.activeElement as HTMLElement;
    if (element) {
      element.style.transform = 'scale(0.98)';
      setTimeout(() => {
        element.style.transform = '';
      }, 100);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    simulateHaptic();
    // Prevent double-tap zoom on mobile
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`
        ${className} 
        ${sizeClasses[touchTargetSize]}
        touch-manipulation 
        select-none 
        transition-transform 
        duration-100 
        ease-out
        ${isPressed ? 'scale-98 opacity-90' : 'scale-100 opacity-100'}
        ${enableHaptic ? 'active:scale-95' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        // Prevent text selection on mobile
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        // Prevent zoom on double tap
        touchAction: 'manipulation'
      }}
    >
      {children}
    </div>
  );
}