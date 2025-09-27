'use client';

import { ReactNode } from 'react';
import { useToast } from './Toast';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { ToastContainer } = useToast();
  
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}