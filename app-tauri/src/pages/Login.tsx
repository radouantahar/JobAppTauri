import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  TextInput, 
  PasswordInput, 
  Button, 
  Stack, 
  Title, 
  Text, 
  Paper, 
  Center,
  Box,
  Transition,
  Alert
} from '@mantine/core';
import { IconAt, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="gray.1">
      <Container size="xs" w={420}>
        <Paper radius="md" p="xl" withBorder>
          <Title order={2} ta="center" mt="md" mb={50}>
            Bienvenue sur MyJobApplication
          </Title>

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                required
                label="Email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftSection={<IconAt size={16} />}
                error={error}
              />

              <PasswordInput
                required
                label="Mot de passe"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftSection={<IconLock size={16} />}
              />

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Erreur"
                  color="red"
                  variant="filled"
                >
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={isLoading}>
                Se connecter
              </Button>

              <Text ta="center" size="sm">
                Pas encore de compte ?{' '}
                <Link to="/register">Créer un compte</Link>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
};

export default Login; 