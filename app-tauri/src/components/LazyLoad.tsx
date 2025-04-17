import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader } from '@mantine/core';

interface LazyLoadProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({ component, fallback }) => {
  const LazyComponent = lazy(component);

  return (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <Loader size="lg" />
          </div>
        )
      }
    >
      <LazyComponent />
    </Suspense>
  );
};

// Exemple d'utilisation :
// const LazyDashboard = () => (
//   <LazyLoad
//     component={() => import('@/pages/Dashboard')}
//     fallback={<div>Chargement...</div>}
//   />
// ); 