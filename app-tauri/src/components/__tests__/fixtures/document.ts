import { Document, DocumentType, ISODateString } from '../../../types';

const createISODateString = (date: Date): ISODateString => {
  return date.toISOString() as ISODateString;
};

export const createMockDocument = (overrides: Partial<Document> = {}): Document => ({
  id: '1',
  userId: '1',
  name: 'Test Document',
  type: 'CV' as DocumentType,
  description: 'Test Description',
  content: 'Test Content',
  size: 1024,
  url: 'blob:http://localhost:3000/test',
  filePath: '/path/to/document.pdf',
  createdAt: createISODateString(new Date()),
  updatedAt: createISODateString(new Date()),
  ...overrides
}); 