import { render } from '@testing-library/react';
import { DocumentModal } from '../DocumentModal';
import type { Document } from '../../types';

describe('DocumentModal Performance Tests', () => {
  const mockDocument: Document = {
    id: '1',
    title: 'Test Document',
    description: 'Test Description',
    type: 'cv',
  };

  const onClose = () => {};

  it('should render quickly with minimal props', () => {
    const startTime = performance.now();
    
    render(
      <DocumentModal
        documentId={mockDocument.id}
        onClose={onClose}
      />
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
  });

  it('should handle rapid state updates efficiently', () => {
    const { rerender } = render(
      <DocumentModal
        documentId={mockDocument.id}
        onClose={onClose}
      />
    );

    const startTime = performance.now();
    
    // Simulate 10 rapid rerenders
    for (let i = 0; i < 10; i++) {
      rerender(
        <DocumentModal
          documentId={mockDocument.id}
          onClose={onClose}
        />
      );
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500); // 10 rerenders should take less than 500ms
  });
}); 