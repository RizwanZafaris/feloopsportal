import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budgets Admin | FELO Ops',
  description: 'Manage user budgets and cash envelopes',
};

export default function BudgetsOpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
