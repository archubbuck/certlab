import { Button } from '@/components/ui/button';

interface ActivityButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ActivityButton({ label, isSelected, onClick, disabled }: ActivityButtonProps) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      className={`px-6 py-6 text-base font-normal transition-all rounded-xl ${
        isSelected
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
          : 'hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md'
      }`}
    >
      {label}
    </Button>
  );
}
