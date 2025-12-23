export interface ThemeDefinition {
    id: string;
    label: string;
    type: 'dark' | 'light';
    colors: {
        '--ide-bg': string;
        '--ide-sidebar': string;
        '--ide-activity': string;
        '--ide-panel': string;
        '--ide-accent': string;
        '--ide-secondary': string;
        '--ide-text': string;
        '--ide-muted': string;
        '--ide-border': string;
        '--ide-input': string;
        '--ide-hover': string; // For generic hover states
        '--ide-bg-image'?: string; // Optional gradient
    };
    monacoTheme: string;
}

export const themes: Record<string, ThemeDefinition> = {
    'midnight-pro': {
        id: 'midnight-pro',
        label: 'Midnight Pro',
        type: 'dark',
        colors: {
            '--ide-bg': '#000000',
            // Using RGBA to allow the radial gradient to show through (Glass effect)
            '--ide-sidebar': 'rgba(15, 15, 15, 0.7)', 
            '--ide-activity': 'rgba(10, 10, 10, 0.8)',
            '--ide-panel': 'rgba(15, 15, 15, 0.8)',
            
            // Requested Accent Colors
            '--ide-accent': '#3b82f6', // Apple System Blue
            '--ide-secondary': '#ef4444', // Apple System Red
            
            // Typography
            '--ide-text': '#F5F5F7', // Apple Off-White
            '--ide-muted': '#86868b', // SF Text Gray
            
            // Borders & Inputs
            '--ide-border': 'rgba(255, 255, 255, 0.1)', // Subtle glass border
            '--ide-input': 'rgba(255, 255, 255, 0.05)', // Glass input
            '--ide-hover': 'rgba(255, 255, 255, 0.1)',
            
            // The Requested Gradient
            '--ide-bg-image': 'radial-gradient(circle at 50% 0%, #1a1a1a 0%, #000000 100%)'
        },
        monacoTheme: 'midnight-pro'
    },
    'vscode-dark': {
        id: 'vscode-dark',
        label: 'Dark+ (Default)',
        type: 'dark',
        colors: {
            '--ide-bg': '#1e1e1e',
            '--ide-sidebar': '#252526',
            '--ide-activity': '#333333',
            '--ide-panel': '#1e1e1e',
            '--ide-accent': '#007acc',
            '--ide-secondary': '#4ec9b0',
            '--ide-text': '#cccccc',
            '--ide-muted': '#858585',
            '--ide-border': '#454545',
            '--ide-input': '#3c3c3c',
            '--ide-hover': 'rgba(255, 255, 255, 0.1)',
            '--ide-bg-image': 'none'
        },
        monacoTheme: 'vs-dark'
    },
    'capy-dark': {
        id: 'capy-dark',
        label: 'Capy Dark',
        type: 'dark',
        colors: {
            '--ide-bg': '#0F172A', // Slate 900
            '--ide-sidebar': '#1E293B', // Slate 800
            '--ide-activity': '#020617', // Slate 950
            '--ide-panel': '#0F172A',
            '--ide-accent': '#8B5CF6', // Violet 500
            '--ide-secondary': '#10B981', // Emerald 500
            '--ide-text': '#F8FAFC', // Slate 50
            '--ide-muted': '#94A3B8', // Slate 400
            '--ide-border': '#334155', // Slate 700
            '--ide-input': '#1E293B',
            '--ide-hover': 'rgba(255, 255, 255, 0.1)',
            '--ide-bg-image': 'none'
        },
        monacoTheme: 'capy-dark'
    },
    'github-light': {
        id: 'github-light',
        label: 'GitHub Light',
        type: 'light',
        colors: {
            '--ide-bg': '#ffffff',
            '--ide-sidebar': '#f6f8fa',
            '--ide-activity': '#f0f0f0', 
            '--ide-panel': '#f6f8fa',
            '--ide-accent': '#0969da',
            '--ide-secondary': '#1a7f37',
            '--ide-text': '#24292f',
            '--ide-muted': '#6e7781', 
            '--ide-border': '#d0d7de',
            '--ide-input': '#ffffff',
            '--ide-hover': 'rgba(0, 0, 0, 0.08)',
            '--ide-bg-image': 'none'
        },
        monacoTheme: 'vs'
    },
};

export const applyTheme = (themeId: string) => {
    const theme = themes[themeId] || themes['vscode-dark'];
    const root = document.documentElement;
    
    // Clear potentially old specific props
    root.style.removeProperty('--ide-bg-image');

    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
};