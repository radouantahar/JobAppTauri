import { Id } from '../core/id';
import { ISODateString } from '../core/date';
import { Result } from '../core/error';

/**
 * Type représentant un utilisateur
 */
export interface User {
  id: Id;
  email: string;
  name: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Type représentant une requête de création d'utilisateur
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

/**
 * Type représentant une requête de mise à jour d'utilisateur
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Type représentant le résultat d'une opération sur un utilisateur
 */
export type UserResult = Result<User>;

/**
 * Type représentant le résultat d'une liste d'utilisateurs
 */
export type UserListResult = Result<User[]>; 