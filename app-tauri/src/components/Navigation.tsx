import { Link, useLocation } from 'react-router-dom';
import { AppShell, Group, UnstyledButton, Tooltip, Notification, Burger, Text } from '@mantine/core';
import { IconX, IconLogout } from '@tabler/icons-react';
import { useMemo, memo, useState, useCallback } from 'react';
import { useAppStore } from '../store';
import { NavbarLinkProps, NavigationProps, NAV_LINKS } from './navigation/types';
import classes from '../styles/components/Navigation.module.css';

// Composant pour les liens de navigation
const NavbarLink = memo(({ icon: Icon, label, to, active, onClick }: NavbarLinkProps) => (
  <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
    <UnstyledButton
      component={Link}
      to={to}
      className={`${classes.link} ${active ? classes.active : ''}`}
      onClick={onClick}
    >
      <Icon className={classes.linkIcon} stroke={1.5} />
      <Text className={classes.linkText}>{label}</Text>
    </UnstyledButton>
  </Tooltip>
));

// Composant principal de navigation
const Navigation = ({ isAuthenticated }: NavigationProps) => {
  const { setUser } = useAppStore();
  const location = useLocation();

  // Filtrage des liens en fonction de l'authentification
  const filteredLinks = useMemo(() => {
    return NAV_LINKS.filter(link => {
      if (link.requiresAuth) {
        return isAuthenticated;
      }
      return true;
    });
  }, [isAuthenticated]);

  const [showLogoutNotification, setShowLogoutNotification] = useState(false);

  const handleLogout = useCallback(() => {
    setUser(null);
    setShowLogoutNotification(true);
  }, [setUser]);

  return (
    <>
      <AppShell.Navbar className={classes.navbar}>
        <div className={classes.navbarMain}>
          <Group className={classes.header} justify="space-between">
            <Burger opened={false} hidden />
          </Group>
          {filteredLinks.map((link) => (
            <NavbarLink
              {...link}
              key={link.label}
              active={location.pathname === link.to}
            />
          ))}
        </div>

        <div className={classes.footer}>
          {isAuthenticated && (
            <UnstyledButton className={classes.link} onClick={handleLogout}>
              <IconLogout className={classes.linkIcon} stroke={1.5} />
              <Text className={classes.linkText}>Déconnexion</Text>
            </UnstyledButton>
          )}
        </div>
      </AppShell.Navbar>

      {showLogoutNotification && (
        <Notification
          icon={<IconX size="1.1rem" />}
          color="red"
          title="Déconnexion"
          onClose={() => setShowLogoutNotification(false)}
          className={classes.notification}
        >
          Vous avez été déconnecté avec succès
        </Notification>
      )}
    </>
  );
};

export default Navigation;