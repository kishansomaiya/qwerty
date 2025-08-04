import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColor, ThemeMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { theme, setThemeColor, setThemeMode } = useTheme();
  const [selectedColor, setSelectedColor] = useState<ThemeColor>(theme.color);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(theme.mode);

  if (!isOpen) return null;

  const colorOptions: { value: ThemeColor; label: string; gradient: string }[] = [
    { value: 'default', label: 'Default', gradient: 'from-pink-500 to-purple-600' },
    { value: 'ocean', label: 'Ocean', gradient: 'from-blue-500 to-indigo-600' },
    { value: 'forest', label: 'Forest', gradient: 'from-green-500 to-teal-600' },
    { value: 'sunset', label: 'Sunset', gradient: 'from-orange-500 to-red-600' },
  ];

  const modeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5 text-yellow-500" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5 text-blue-300" /> },
  ];

  const handleApplyTheme = () => {
    setThemeColor(selectedColor);
    setThemeMode(selectedMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" data-testid="theme-selector">
      <Card className="w-full max-w-lg animate-slide-up">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle data-testid="theme-selector-title">Customize Theme</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-theme-selector"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Color Theme */}
          <div>
            <label className="block text-sm font-medium mb-3">Color Theme</label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedColor(option.value)}
                  className={cn(
                    "relative h-16 rounded-xl bg-gradient-to-br transition-all transform hover:scale-105",
                    option.gradient,
                    selectedColor === option.value 
                      ? "ring-2 ring-offset-2 ring-primary" 
                      : "hover:ring-2 hover:ring-offset-2 hover:ring-primary/50"
                  )}
                  data-testid={`color-option-${option.value}`}
                >
                  {selectedColor === option.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-gray-900" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium mb-3">Mode</label>
            <div className="flex space-x-3">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedMode(option.value)}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 text-center transition-colors",
                    option.value === 'dark' 
                      ? "bg-gray-900 text-white border-gray-700" 
                      : "bg-white text-gray-900 border-gray-200",
                    selectedMode === option.value 
                      ? "border-primary" 
                      : "hover:border-primary/50"
                  )}
                  data-testid={`mode-option-${option.value}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={handleApplyTheme}
            className="w-full theme-gradient text-white font-semibold py-3"
            data-testid="apply-theme"
          >
            Apply Theme
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
