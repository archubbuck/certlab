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
      className={`px-6 py-6 text-base font-normal transition-all ${
        isSelected
          ? 'bg-foreground text-background hover:bg-foreground/90'
          : 'bg-background text-foreground border-2 border-foreground hover:bg-muted'
      }`}
    >
      {label}
    </Button>
  );
}
