import { v4 as uuidv4 } from 'uuid';

export const generateShortUUID = (): string => {
    return uuidv4().slice(0, 6);
  };
  