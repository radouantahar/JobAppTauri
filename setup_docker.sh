#!/bin/bash

# Script de configuration Docker pour l'application d'automatisation de recherche d'emploi
# Ce script installe Docker si nécessaire et configure les conteneurs pour NocoDB et Ollama

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Installation en cours..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker a été installé. Veuillez vous déconnecter et vous reconnecter pour appliquer les changements de groupe."
    echo "Après reconnexion, exécutez à nouveau ce script."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Installation en cours..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose a été installé."
fi

# Créer les répertoires nécessaires
mkdir -p ./docker/nocodb/data
mkdir -p ./docker/ollama/models

# Créer le fichier docker-compose.yml s'il n'existe pas déjà
if [ ! -f "docker-compose.yml" ]; then
    echo "Création du fichier docker-compose.yml..."
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  nocodb:
    image: nocodb/nocodb:latest
    container_name: job_search_nocodb
    ports:
      - "8080:8080"
    environment:
      - NC_DB=sqlite3
      - NC_DB_URL=/usr/app/data/noco.db
    volumes:
      - ./docker/nocodb/data:/usr/app/data
    restart: unless-stopped
    networks:
      - job_search_network

  ollama:
    image: ollama/ollama:latest
    container_name: job_search_ollama
    ports:
      - "11434:11434"
    volumes:
      - ./docker/ollama/models:/root/.ollama
    restart: unless-stopped
    networks:
      - job_search_network

networks:
  job_search_network:
    driver: bridge
EOL
    echo "Fichier docker-compose.yml créé."
fi

# Démarrer les conteneurs
echo "Démarrage des conteneurs Docker..."
docker-compose up -d

# Vérifier si les conteneurs sont en cours d'exécution
echo "Vérification des conteneurs..."
sleep 5
if docker ps | grep -q "job_search_nocodb" && docker ps | grep -q "job_search_ollama"; then
    echo "Les conteneurs NocoDB et Ollama sont en cours d'exécution."
    echo "NocoDB est accessible à l'adresse: http://localhost:8080"
    echo "Ollama est accessible à l'adresse: http://localhost:11434"
else
    echo "Erreur: Les conteneurs ne sont pas en cours d'exécution. Vérifiez les logs avec 'docker-compose logs'."
    exit 1
fi

# Télécharger les modèles Ollama de base
echo "Téléchargement des modèles Ollama de base..."
echo "Cela peut prendre plusieurs minutes selon votre connexion internet."
docker exec job_search_ollama ollama pull llama3:8b
docker exec job_search_ollama ollama pull mistral:7b

echo "Configuration Docker terminée avec succès!"
echo "Étapes suivantes:"
echo "1. Accédez à NocoDB via http://localhost:8080"
echo "2. Créez un compte administrateur"
echo "3. Créez un nouveau projet"
echo "4. Générez un token d'API dans les paramètres"
echo "5. Ajoutez ce token dans votre fichier .env"
