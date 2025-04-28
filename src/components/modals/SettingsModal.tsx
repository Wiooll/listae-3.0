
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppSettings, Currency, SortOption, ThemeMode } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useApp();
  const { theme, setTheme } = useTheme();
  
  const handleChangeSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    updateSettings({ [key]: value });
  };
  
  const handleChangeTheme = (value: ThemeMode) => {
    setTheme(value);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Theme Settings */}
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select
              value={theme}
              onValueChange={(value) => handleChangeTheme(value as ThemeMode)}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Escolha o tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Currency Settings */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => handleChangeSetting('currency', value as Currency)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Escolha a moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar (US$)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Default Sort Settings */}
          <div className="space-y-2">
            <Label htmlFor="defaultSort">Ordenação padrão</Label>
            <Select
              value={settings.defaultSort}
              onValueChange={(value) => handleChangeSetting('defaultSort', value as SortOption)}
            >
              <SelectTrigger id="defaultSort">
                <SelectValue placeholder="Escolha a ordenação padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="price">Preço</SelectItem>
                <SelectItem value="quantity">Quantidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort Direction Settings */}
          <div className="space-y-2">
            <Label htmlFor="defaultSortDirection">Direção da ordenação</Label>
            <Select
              value={settings.defaultSortDirection}
              onValueChange={(value) => 
                handleChangeSetting('defaultSortDirection', value as 'asc' | 'desc')
              }
            >
              <SelectTrigger id="defaultSortDirection">
                <SelectValue placeholder="Escolha a direção da ordenação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Crescente</SelectItem>
                <SelectItem value="desc">Decrescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
