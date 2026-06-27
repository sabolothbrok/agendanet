import { Sparkles } from "lucide-react";

/**
 * Distintivo compacto para servicios premium.
 * En móvil muestra solo el icono; en pantallas medianas+ muestra "Premium".
 */
export default function PremiumBadge({ compact = false, className = "" }) {
  return (
    <span
      className={`premium-mark ${compact ? "premium-mark--compact" : ""} ${className}`}
      aria-label="Servicio premium"
      title="Servicio premium"
    >
      <Sparkles className="premium-mark-icon" aria-hidden />
      <span className="premium-mark-label">Premium</span>
    </span>
  );
}
