import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet Admin | FELO Ops',
  description: 'Monitor user balances and transactions',
};

export default function WalletOpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
