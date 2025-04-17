# Script pour déplacer les fichiers de test dans les bons dossiers
$basePath = "."

# Déplacer les tests de performance
Move-Item -Path "*.performance.test.tsx" -Destination "performance/" -Force

# Déplacer les tests d'accessibilité
Move-Item -Path "*.accessibility.test.tsx" -Destination "unit/" -Force

# Déplacer les tests unitaires
Move-Item -Path "*.test.tsx" -Destination "unit/" -Force

# Déplacer les tests d'intégration
Move-Item -Path "*.integration.test.tsx" -Destination "integration/" -Force 