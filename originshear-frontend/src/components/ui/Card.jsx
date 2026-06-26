const ROLE_BORDER_CLASSES = {
  none: "border border-outline-variant",
  farmer: "border border-outline-variant border-l-4 border-l-role-farmer",
  validator: "border border-outline-variant border-l-4 border-l-role-validator",
  government: "border border-outline-variant border-l-4 border-l-role-government",
  buyer: "border border-outline-variant border-l-4 border-l-role-buyer",
};

/**
 * Primary data container across the app. 16px internal padding per spec,
 * 12px-equivalent radius (rounded-xl), subtle shadow, optional role-coded
 * left border (per agrarian_trust_2 "Role-Based Cards" spec).
 */
export default function Card({ children, role = "none", className = "", padded = true, ...props }) {
  return (
    <div
      className={`
        bg-surface-container-lowest rounded-xl shadow-sm
        ${ROLE_BORDER_CLASSES[role]}
        ${padded ? "p-4" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
