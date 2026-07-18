/** LNWMGA district offices and support contacts used across onboarding screens. */

export const LNWMGA_OFFICES = [
  {
    district: "Quthing",
    address: "Main Street, Quthing Town",
    phone: "+266 5888 1001",
    hours: "Mon–Fri 08:00–16:30",
    mapsQuery: "LNWMGA Quthing Lesotho",
  },
  {
    district: "Maseru",
    address: "Industrial Area, Maseru",
    phone: "+266 5888 1002",
    hours: "Mon–Fri 08:00–16:30",
    mapsQuery: "LNWMGA Maseru Lesotho",
  },
  {
    district: "Mohale's Hoek",
    address: "District Office Complex",
    phone: "+266 5888 1003",
    hours: "Mon–Fri 08:00–16:30",
    mapsQuery: "Mohale's Hoek Lesotho agriculture office",
  },
  {
    district: "Leribe",
    address: "Hlotse Main Road",
    phone: "+266 5888 1004",
    hours: "Mon–Fri 08:00–16:30",
    mapsQuery: "Leribe Lesotho wool mohair",
  },
];

export const SUPPORT = {
  email: "support@originshear.ls",
  adminEmail: "admin@originshear.ls",
  phone: "+266 5888 1099",
  disputesEmail: "disputes@originshear.ls",
};

export function officeMapsUrl(office) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapsQuery)}`;
}

export function mailtoAdmin(address) {
  const subject = encodeURIComponent("ORIGINSHEAR Government Access Request");
  const body = encodeURIComponent(
    `Please grant GOVERNMENT_ROLE to my wallet:\n\n${address}\n\nThank you.`
  );
  return `mailto:${SUPPORT.adminEmail}?subject=${subject}&body=${body}`;
}

export function mailtoValidator(address) {
  const subject = encodeURIComponent("ORIGINSHEAR Validator Access Request");
  const body = encodeURIComponent(
    `Please grant VALIDATOR_ROLE to my wallet:\n\n${address}\n\nThank you.`
  );
  return `mailto:${SUPPORT.adminEmail}?subject=${subject}&body=${body}`;
}
