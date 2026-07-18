export const NAV_BY_ROLE = {
  PUBLIC: [
    { to: "/", label: "Home", st: "Lae", icon: "home" },
    { to: "/news", label: "News", st: "Litaba", icon: "gavel" },
    { to: "/connect", label: "Connect", st: "Hokela", icon: "account_balance_wallet" },
  ],
  FARMER: [
    { to: "/farmer", label: "Home", st: "Lae", icon: "home" },
    { to: "/farmer/register", label: "Register", st: "Ngolisa", icon: "edit_document" },
    { to: "/farmer/lots", label: "My Lots", st: "Loto", icon: "inventory_2" },
    { to: "/news", label: "News", st: "Litaba", icon: "gavel" },
    { to: "/farmer/market", label: "Market", st: "Mmaraka", icon: "trending_up" },
  ],
  VALIDATOR: [
    { to: "/validator", label: "Home", st: "Lae", icon: "home" },
    { to: "/validator/queue", label: "Queue", st: "Letlelo", icon: "pending_actions" },
    { to: "/validator/release", label: "Escrow", st: "Litefiso", icon: "payments" },
    { to: "/validator/audit", label: "Audit", st: "Tlaleho", icon: "history" },
  ],
  GOVERNMENT: [
    { to: "/government", label: "Home", st: "Lae", icon: "home" },
    { to: "/government/news", label: "News", st: "Litaba", icon: "newspaper" },
  ],
  BUYER: [
    { to: "/buyer", label: "Dashboard", st: "Lae", icon: "home" },
    { to: "/buyer/marketplace", label: "Marketplace", st: "Mmaraka", icon: "storefront" },
    { to: "/news", label: "News", st: "Litaba", icon: "gavel" },
    { to: "/buyer/purchases", label: "Purchases", st: "Nalane", icon: "receipt_long" },
    { to: "/buyer/verify", label: "Verify", st: "Netefatsa", icon: "qr_code_scanner" },
  ],
};

export const GLOBAL_MENU_LINKS = [
  { label: "Landing Page", to: "/", icon: "home" },
  { label: "Connect Wallet", to: "/connect", icon: "account_balance_wallet" },
  { label: "Choose Role", to: "/role-select", icon: "badge" },
  { label: "Marketplace", to: "/buyer/marketplace", icon: "storefront" },
  { label: "Verify a Lot", to: "/buyer/verify", icon: "qr_code_scanner" },
  { label: "Ministry News", to: "/news", icon: "newspaper" },
  { label: "Network Help", to: "/help/network", icon: "help" },
];
