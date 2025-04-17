import { ISODateString } from '../../types';

/**
 * Crée une chaîne de date ISO valide
 * @param date - Date à convertir
 * @returns Chaîne de date ISO valide
 */
export const createISODateString = (date: Date): ISODateString => {
  return date.toISOString() as ISODateString;
};

/**
 * Crée une date ISO pour aujourd'hui
 * @returns Date ISO d'aujourd'hui
 */
export const createTodayISODateString = (): ISODateString => {
  return createISODateString(new Date());
};

/**
 * Crée une date ISO pour demain
 * @returns Date ISO de demain
 */
export const createTomorrowISODateString = (): ISODateString => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return createISODateString(tomorrow);
}; 