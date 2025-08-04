export type ThemeColor = 'default' | 'ocean' | 'forest' | 'sunset';
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  color: ThemeColor;
  mode: ThemeMode;
}

export class ThemeService {
  private currentTheme: Theme = {
    color: 'default',
    mode: 'light'
  };

  constructor() {
    this.loadTheme();
  }

  loadTheme() {
    const saved = localStorage.getItem('fan_connect_theme');
    if (saved) {
      try {
        this.currentTheme = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    }
    this.applyTheme();
  }

  setTheme(theme: Partial<Theme>) {
    this.currentTheme = { ...this.currentTheme, ...theme };
    this.saveTheme();
    this.applyTheme();
  }

  getTheme(): Theme {
    return { ...this.currentTheme };
  }

  private saveTheme() {
    localStorage.setItem('fan_connect_theme', JSON.stringify(this.currentTheme));
  }

  private applyTheme() {
    const { color, mode } = this.currentTheme;
    
    // Apply dark mode
    const html = document.documentElement;
    if (mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Apply color theme
    const themeClasses = ['theme-default', 'theme-ocean', 'theme-forest', 'theme-sunset'];
    themeClasses.forEach(cls => html.classList.remove(cls));
    html.classList.add(`theme-${color}`);

    // Update CSS custom properties
    this.updateThemeColors(color);
  }

  private updateThemeColors(color: ThemeColor) {
    const root = document.documentElement;
    
    switch (color) {
      case 'ocean':
        root.style.setProperty('--theme-primary', 'hsl(210, 100%, 56%)');
        root.style.setProperty('--theme-secondary', 'hsl(220, 100%, 60%)');
        root.style.setProperty('--theme-accent', 'hsl(200, 100%, 50%)');
        break;
      case 'forest':
        root.style.setProperty('--theme-primary', 'hsl(120, 61%, 50%)');
        root.style.setProperty('--theme-secondary', 'hsl(140, 84%, 44%)');
        root.style.setProperty('--theme-accent', 'hsl(160, 100%, 40%)');
        break;
      case 'sunset':
        root.style.setProperty('--theme-primary', 'hsl(15, 100%, 62%)');
        root.style.setProperty('--theme-secondary', 'hsl(0, 100%, 63%)');
        root.style.setProperty('--theme-accent', 'hsl(30, 100%, 50%)');
        break;
      default:
        root.style.setProperty('--theme-primary', 'hsl(330, 81%, 60%)');
        root.style.setProperty('--theme-secondary', 'hsl(280, 87%, 65%)');
        root.style.setProperty('--theme-accent', 'hsl(180, 100%, 50%)');
        break;
    }
  }

  toggleMode() {
    this.setTheme({ mode: this.currentTheme.mode === 'light' ? 'dark' : 'light' });
  }

  setColor(color: ThemeColor) {
    this.setTheme({ color });
  }
}

export const themeService = new ThemeService();
