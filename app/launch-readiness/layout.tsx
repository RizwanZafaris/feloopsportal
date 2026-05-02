import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Launch readiness · Felo Ops',
  description: 'Provisioning checklist for Felo soft-launch.',
};

export default function LaunchReadinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="px-6 py-6">{children}</div>;
}
