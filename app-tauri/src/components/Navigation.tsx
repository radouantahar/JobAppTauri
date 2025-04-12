import { Link, useLocation } from 'react-router-dom';
import { AppShell, Group, UnstyledButton, Tooltip } from '@mantine/core';
import { 
  IconDashboard, 
  IconSearch, 
  IconLayoutKanban, 
  IconUser, 
  IconFileText, 
  IconMap, 
  IconSettings 
} from '@tabler/icons-react';
// import { useAppStore } from '../store';
import classes from './Navigation.module.css'; // Create this CSS module file

interface NavbarLinkProps {
  icon: React.FC<any>;
  label: string;
  active?: boolean;
  to: string;
}

function NavbarLink({ icon: Icon, label, active, to }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton 
        component={Link} 
        to={to} 
        className={`${classes.link} ${active ? classes.active : ''}`}
      >
        <Icon size="1.5rem" stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const navLinks = [
  { icon: IconDashboard, label: 'Tableau de bord', to: '/' },
  { icon: IconSearch, label: 'Recherche', to: '/search' },
  { icon: IconLayoutKanban, label: 'Kanban', to: '/kanban' },
  { icon: IconUser, label: 'Profil', to: '/profile' },
  { icon: IconFileText, label: 'Documents', to: '/documents' },
  { icon: IconMap, label: 'Trajets', to: '/commute' },
  { icon: IconSettings, label: 'Paramètres', to: '/settings' },
];

export function Navigation() {
  const location = useLocation();

  return (
    <AppShell.Navbar className={classes.navbar}>
      <AppShell.Section grow className={classes.navbarMain}>
        <Group gap={0} justify="center">
          {navLinks.map((link) => (
            <NavbarLink
              key={link.label}
              icon={link.icon}
              label={link.label}
              to={link.to}
              active={location.pathname === link.to}
            />
          ))}
        </Group>
      </AppShell.Section>
    </AppShell.Navbar>
  );
}