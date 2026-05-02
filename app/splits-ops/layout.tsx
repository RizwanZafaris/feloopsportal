import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Splits Admin | FELO Ops',
  description: 'Manage group payments and bill splits',
};

export default function SplitsOpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
