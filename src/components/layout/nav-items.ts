import {
  Activity,
  ArrowLeftRight,
  KeyRound,
  LayoutGrid,
  LogOut,
  Percent,
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
  { href: "/dashboard", label: "Painel", icon: LayoutGrid },
  { href: "/wallet", label: "Carteira", icon: Wallet },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/fees", label: "Taxas", icon: Percent },
];

export const secondaryNav: NavItem[] = [
  { href: "/integrations", label: "Integrações", icon: Plug },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin · Visão Geral", icon: Shield },
  { href: "/admin/users", label: "Admin · Usuários & KYC", icon: UserCog },
  { href: "/admin/transactions", label: "Admin · Transações & MED", icon: Activity },
  { href: "/admin/fees", label: "Admin · Taxas & Saques", icon: Percent },
  { href: "/admin/integrations", label: "Admin · API Keys & Webhooks", icon: KeyRound },
  { href: "/admin/settings", label: "Admin · Configurações & Moedas", icon: Sliders },
];

export const logoutItem: NavItem = { href: "#", label: "Sair", icon: LogOut };
