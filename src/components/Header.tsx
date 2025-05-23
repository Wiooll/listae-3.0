import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Sun, Moon, ShoppingCart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { activeList } = useApp();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border py-4 px-4">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">ListaÊ</h1>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="Alternar tema"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto mt-2">
        <h2 className="text-sm text-muted-foreground truncate">
          {activeList ? (
            `${activeList.name.replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}\s*$/, '')} • ${new Date(activeList.updatedAt).toLocaleDateString('pt-BR')}`
          ) : (
            'Nenhuma lista selecionada'
          )}
        </h2>
      </div>
    </header>
  );
};

export default Header;
