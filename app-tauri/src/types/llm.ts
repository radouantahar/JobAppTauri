/**
 * Types pour les fournisseurs de LLM (Large Language Models)
 */

export type LLMProviderType = 'openai' | 'anthropic' | 'google' | 'local';

export interface LLMProvider {
  /** Identifiant unique du fournisseur */
  id: string;
  /** Nom du fournisseur */
  name: string;
  /** Type de fournisseur */
  type: LLMProviderType;
  /** Clé API */
  apiKey?: string;
  /** URL de base de l'API */
  baseUrl?: string;
  /** Modèle par défaut */
  defaultModel: string;
  /** Liste des modèles disponibles */
  availableModels: string[];
  /** Paramètres de configuration */
  config?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  /** Date de création */
  createdAt: string;
  /** Date de dernière mise à jour */
  updatedAt: string;
  /** Statut d'activation */
  isActive: boolean;
} 