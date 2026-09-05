export default function EmptyState({ icon: Icon, title, description, className = "" }) {
  return (
    <div className={`flex flex-col items-center gap-2 py-8 text-center ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      {title && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>}
      {description && (
        <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}
