import { Link, useLocation } from 'react-router-dom';
import { AppShell, Group, UnstyledButton, Tooltip, Notification } from '@mantine/core';
import { IconX, IconLogout } from '@tabler/icons-react';
import { useMemo, memo, useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { NavbarLinkProps, NavigationProps, NAV_LINKS } from './navigation/types';
import classes from './Navigation.module.css';

// Composant pour les liens de navigation
const NavbarLink = memo(function NavbarLink({ 
  icon: Icon, 
  label, 
  active, 
  to, 
  onClick 
}: NavbarLinkProps) {
  return (
    <Tooltip 
      label={label} 
      position="right" 
      transitionProps={{ duration: 0 }}
    >
      <UnstyledButton 
        component={Link} 
        to={to} 
        className={`${classes.link} ${active ? classes.active : ''}`}
        onClick={onClick}
        aria-label={label}
        role="navigation"
      >
        <Icon size="1.5rem" stroke={1.5} aria-hidden="true" />
      </UnstyledButton>
    </Tooltip>
  );
});

// Composant pour la gestion des erreurs
const ErrorNotification = memo(function ErrorNotification({ 
  error, 
  onClose 
}: { 
  error: string; 
  onClose: () => void; 
}) {
  return (
    <Notification
      icon={<IconX size={18} />}
      color="red"
      title="Erreur"
      mt="sm"
      withCloseButton
      onClose={onClose}
    >
      {error}
    </Notification>
  );
});

// Composant principal de navigation
const Navigation = memo(function Navigation({ isAuthenticated }: NavigationProps) {
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAppStore();
  const location = useLocation();

  // Filtrage des liens en fonction de l'authentification
  const filteredNavLinks = useMemo(() => {
    return NAV_LINKS.filter(link => 
      !link.requiresAuth || isAuthenticated
    );
  }, [isAuthenticated]);

  // Gestionnaire de déconnexion
  const handleLogout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  // Gestionnaire de fermeture des notifications
  const handleCloseError = useCallback(() => {
    setError(null);
  }, []);

  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return (
    <AppShell.Navbar className={classes.navbar}>
      <AppShell.Section grow className={classes.navbarMain}>
        <Group gap={0} justify="center">
          {filteredNavLinks.map((link) => (
            <NavbarLink
              key={link.to}
              icon={link.icon}
              label={link.label}
              to={link.to}
              active={isActive(link.to)}
            />
          ))}
        </Group>
      </AppShell.Section>

      {isAuthenticated && (
        <AppShell.Section className={classes.footer}>
          <Group gap={0} justify="center">
            <NavbarLink
              icon={IconLogout}
              label="Déconnexion"
              to="/"
              onClick={handleLogout}
            />
          </Group>
        </AppShell.Section>
      )}

      {error && (
        <ErrorNotification
          error={error}
          onClose={handleCloseError}
        />
      )}
    </AppShell.Navbar>
  );
});

export default Navigation;