import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
