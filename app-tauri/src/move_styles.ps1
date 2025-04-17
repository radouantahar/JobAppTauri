# Script pour déplacer les fichiers CSS dans la nouvelle structure
$ErrorActionPreference = "Stop"

# Chemins
$componentsPath = "src/components"
$stylesPath = "src/styles"

# Fonction pour déplacer les fichiers
function Move-StyleFiles {
    param (
        [string]$sourcePattern,
        [string]$targetDir
    )
    
    Get-ChildItem -Path $componentsPath -Filter $sourcePattern -Recurse | ForEach-Object {
        $targetPath = Join-Path $stylesPath $targetDir
        $newName = $_.Name
        
        # Si le fichier existe déjà dans la destination, ajouter un suffixe
        if (Test-Path (Join-Path $targetPath $newName)) {
            $counter = 1
            while (Test-Path (Join-Path $targetPath "$($_.BaseName)_$counter$($_.Extension)")) {
                $counter++
            }
            $newName = "$($_.BaseName)_$counter$($_.Extension)"
        }
        
        # Créer le dossier de destination s'il n'existe pas
        if (-not (Test-Path $targetPath)) {
            New-Item -ItemType Directory -Force -Path $targetPath | Out-Null
        }
        
        # Déplacer le fichier
        Move-Item -Path $_.FullName -Destination (Join-Path $targetPath $newName) -Force
        Write-Host "Déplacé: $($_.Name) -> $targetDir/$newName"
    }
}

# Déplacer les fichiers CSS
try {
    Move-StyleFiles -sourcePattern "*.module.css" -targetDir "components"
    Write-Host "Déplacement des fichiers CSS terminé avec succès."
} catch {
    Write-Error "Erreur lors du déplacement des fichiers: $_"
} 