import {
  IconHome,
  IconBriefcase,
  IconFileText,
  IconUser,
  IconSettings,
  IconLayoutKanban,
  IconMap,
  IconChartBar
} from '@tabler/icons-react';
import { ComponentType } from 'react';

export interface NavLink {
  to: string;
  label: string;
  icon: ComponentType<any>;
  requiresAuth?: boolean;
}

export interface NavbarLinkProps {
  icon: ComponentType<any>;
  label: string;
  active?: boolean;
  to: string;
  onClick?: () => void;
}

export interface NavigationProps {
  isAuthenticated: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { to: '/', label: 'Accueil', icon: IconHome },
  { to: '/jobs', label: 'Offres', icon: IconBriefcase },
  { to: '/kanban', label: 'Kanban', icon: IconLayoutKanban },
  { to: '/documents', label: 'Documents', icon: IconFileText, requiresAuth: true },
  { to: '/commute', label: 'Trajets', icon: IconMap },
  { to: '/profile', label: 'Profil', icon: IconUser, requiresAuth: true },
  { to: '/settings', label: 'Paramètres', icon: IconSettings, requiresAuth: true },
  { to: '/stats', label: 'Statistiques', icon: IconChartBar }
]; 