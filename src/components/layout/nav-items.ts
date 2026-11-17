import {
  Activity,
  ArrowLeftRight,
  CreditCard,
  KeyRound,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plug,
  Shield,
  Sliders,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

export const secondaryNav: NavItem[] = [
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/messages", label: "Suporte", icon: MessageSquare },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin · Visão Geral", icon: Shield },
  { href: "/admin/users", label: "Admin · Usuários & KYC", icon: UserCog },
  { href: "/admin/transactions", label: "Admin · Transações & MED", icon: Activity },
  { href: "/admin/integrations", label: "Admin · API Keys & Webhooks", icon: KeyRound },
  { href: "/admin/settings", label: "Admin · Configurações & Moedas", icon: Sliders },
];

export const logoutItem: NavItem = { href: "#", label: "Log out", icon: LogOut };