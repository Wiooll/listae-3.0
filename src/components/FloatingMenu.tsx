import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { List, Trash2, Settings, Share2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ListsModal from './modals/ListsModal';
import SettingsModal from './modals/SettingsModal';

const FloatingMenu: React.FC = () => {
  const { clearCheckedItems, clearAllItems, activeList } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isListsModalOpen, setIsListsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const handleShare = async () => {
    const { name, items } = activeList;
    
    const shareText = `Lista de Compras: ${name}\n\n${items.map(
      item => `${item.checked ? '✅' : '⬜'} ${item.quantity} ${item.name} - ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(item.price * item.quantity)}`
    ).join('\n')}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Lista de Compras: ${name}`,
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Lista copiada para a área de transferência!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };
  
  const handleClearItems = () => {
    if (confirm('Deseja remover todos os itens da lista?')) {
      clearAllItems();
    }
  };
  
  const handleClearChecked = () => {
    const hasCheckedItems = activeList.items.some(item => item.checked);
    
    if (!hasCheckedItems) {
      alert('Não há itens marcados como comprados para remover.');
      return;
    }
    
    if (confirm('Deseja remover todos os itens já comprados?')) {
      clearCheckedItems();
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar sair.",
      });
    }
  };
  
  return (
    <>
      <div className="floating-menu">
        <button
          onClick={() => setIsListsModalOpen(true)}
          className="menu-button"
          aria-label="Gerenciar listas"
        >
          <List className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleClearChecked}
          className="menu-button"
          aria-label="Limpar itens comprados"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleShare}
          className="menu-button"
          aria-label="Compartilhar lista"
        >
          <Share2 className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="menu-button"
          aria-label="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={handleLogout}
          className="menu-button"
          aria-label="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
      
      <ListsModal isOpen={isListsModalOpen} onClose={() => setIsListsModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  );
};

export default FloatingMenu;
