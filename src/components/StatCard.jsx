/**
 * كارت إحصائية قابل لإعادة الاستخدام
 */
export default function StatCard({
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  iconColor,
  title,
  value,
  unit,
  subtitle,
  footerLabel,
  footerValue,
  footerColor,
  footerIcon: FooterIcon,
  children,
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
      {/* Background Watermark Icon */}
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${iconColor}`}>
        <Icon size={64} />
      </div>

      {/* Title */}
      <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        {title}
      </p>

      {/* Main Value */}
      <div className="flex items-end gap-2 mb-1">
        <span className="text-4xl font-black text-slate-800">{value}</span>
        <span className="text-lg font-bold text-slate-500 mb-1">{unit}</span>
      </div>

      {/* Subtitle or custom children (e.g. trend indicators) */}
      {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
      {children}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
          {FooterIcon && <FooterIcon size={12} />}
          {footerLabel}
        </span>
        <span
          className={`text-sm font-bold px-2 py-1 rounded ${footerColor}`}
        >
          {footerValue}
        </span>
      </div>
    </div>
  );
}
