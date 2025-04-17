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
  Alert
} from '@mantine/core';
import { IconAt, IconLock, IconAlertCircle, IconUser } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="gray.1">
      <Container size="xs" w={420}>
        <Paper radius="md" p="xl" withBorder>
          <Title order={2} ta="center" mt="md" mb={50}>
            Créer un compte
          </Title>

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                required
                label="Nom"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftSection={<IconUser size={16} />}
              />

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

              <PasswordInput
                required
                label="Confirmer le mot de passe"
                placeholder="Confirmer votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                Créer un compte
              </Button>

              <Text ta="center" size="sm">
                Déjà un compte ?{' '}
                <Link to="/login">Se connecter</Link>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
};

export default Register; 