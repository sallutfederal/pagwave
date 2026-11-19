"use client";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/locale-provider";

type SectionKey =
  | "wallet"
  | "cards"
  | "integrations"
  | "docs"
  | "adminOverview"
  | "adminUsers"
  | "adminTransactions"
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
    integrations: {
      title: messages.pages.integrationsTitle,
      description: messages.pages.integrationsDesc,
    },
    docs: { title: messages.pages.docsTitle, description: messages.pages.docsDesc },
    adminOverview: { title: messages.pages.adminTitle },
    adminUsers: { title: messages.pages.adminUsersTitle },
    adminTransactions: { title: messages.pages.adminTransactionsTitle },
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
