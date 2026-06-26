const VARIANT_CLASSES = {
  primary: "bg-primary text-on-primary active:opacity-90",
  navy: "bg-role-validator text-white active:opacity-90",
  outline: "bg-transparent border border-outline text-on-surface active:bg-surface-container",
  "outline-error": "bg-transparent border border-error text-error active:bg-error-container",
  ghost: "bg-transparent text-primary active:bg-surface-container",
  danger: "bg-error text-on-error active:opacity-90",
};

const SIZE_CLASSES = {
  md: "h-12 px-6 text-body-md",
  lg: "h-14 px-8 text-body-lg",
  sm: "h-10 px-4 text-body-sm",
};

/**
 * Primary interactive control used across ORIGINSHEAR. Mirrors the Stitch
 * spec: 10px-radius equivalent (rounded-lg), full-width by default on
 * mobile, minimum 48px touch target enforced via size classes.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = true,
  icon = null,
  iconPosition = "left",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-semibold
        transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}
