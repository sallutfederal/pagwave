"use client";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/locale-provider";

type SectionKey =
  | "wallet"
  | "cards"
  | "fees"
  | "integrations"
  | "docs"
  | "adminOverview"
  | "adminUsers"
  | "adminTransactions"
  | "adminFees"
  | "adminIntegrations"
  | "adminSettings";

export function LocalizedPageHeader({
  section,
  actions,
  className,
}: {
  section: SectionKey;
  actions?: ReactNode;
  className?: string;
}) {
  const { messages } = useI18n();

  const content: Record<SectionKey, { title: string; description?: string }> = {
    wallet: { title: messages.wallet.title, description: messages.wallet.description },
    cards: { title: messages.pages.cardsTitle, description: messages.pages.cardsDesc },
    fees: { title: messages.pages.feesTitle, description: messages.pages.feesDesc },
    integrations: {
      title: messages.pages.integrationsTitle,
      description: messages.pages.integrationsDesc,
    },
    docs: { title: messages.pages.docsTitle, description: messages.pages.docsDesc },
    adminOverview: { title: messages.pages.adminTitle },
    adminUsers: { title: messages.pages.adminUsersTitle },
    adminTransactions: { title: messages.pages.adminTransactionsTitle },
    adminFees: { title: messages.pages.adminFeesTitle },
    adminIntegrations: { title: messages.pages.adminIntegrationsTitle },
    adminSettings: { title: messages.pages.adminSettingsTitle },
  };

  const entry = content[section];
  return (
    <PageHeader
      title={entry.title}
      description={entry.description}
      actions={actions}
      className={className}
    />
  );
}
