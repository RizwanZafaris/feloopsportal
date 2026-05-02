import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Goals Admin | FELO Ops',
  description: 'Manage user savings goals',
};

export default function GoalsOpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
