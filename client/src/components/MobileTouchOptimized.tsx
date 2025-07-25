import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TouchOptimizedProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export function TouchOptimized({ 
  children, 
  className, 
  onTap, 
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  hapticFeedback = false
}: TouchOptimizedProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    setIsPressed(true);
    
    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPress(true);
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress();
      }, 500);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If it was a long press, don't trigger tap
    if (isLongPress) {
      setIsLongPress(false);
      return;
    }
    
    const touch = e.changedTouches[0];
    const touchStart = touchStartRef.current;
    
    if (!touchStart) return;
    
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;
    
    // Check for swipe gestures
    const swipeThreshold = 50;
    const maxSwipeTime = 300;
    
    if (deltaTime < maxSwipeTime && Math.abs(deltaY) < swipeThreshold) {
      if (deltaX > swipeThreshold && onSwipeRight) {
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(30);
        }
        onSwipeRight();
        return;
      }
      
      if (deltaX < -swipeThreshold && onSwipeLeft) {
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(30);
        }
        onSwipeLeft();
        return;
      }
    }
    
    // Check for tap (small movement, quick time)
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
      onTap?.();
    }
  };

  const handleTouchCancel = () => {
    setIsPressed(false);
    setIsLongPress(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "touch-manipulation select-none transition-all duration-150",
        isPressed && !disabled && "scale-95 opacity-80",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        KhtmlUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {children}
    </div>
  );
}

interface MobileAnswerOptionProps {
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  children: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

export function MobileAnswerOption({ 
  isSelected, 
  isCorrect, 
  isWrong, 
  children, 
  onSelect, 
  disabled 
}: MobileAnswerOptionProps) {
  return (
    <TouchOptimized
      onTap={onSelect}
      disabled={disabled}
      hapticFeedback={true}
      className={cn(
        "min-h-[56px] p-4 rounded-lg border-2 transition-all duration-200",
        "flex items-center justify-between cursor-pointer",
        "hover:shadow-md active:shadow-sm",
        isSelected && !isCorrect && !isWrong && "border-blue-500 bg-blue-50",
        isCorrect && "border-green-500 bg-green-50",
        isWrong && "border-red-500 bg-red-50",
        !isSelected && !isCorrect && !isWrong && "border-gray-200 bg-white hover:border-blue-300",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex-1 text-left">
        {children}
      </div>
      <div className="ml-3 flex-shrink-0">
        {isCorrect && (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {isWrong && (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {isSelected && !isCorrect && !isWrong && (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        )}
        {!isSelected && !isCorrect && !isWrong && (
          <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
        )}
      </div>
    </TouchOptimized>
  );
}