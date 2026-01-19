/**
 * vkTUNEos KILLER UI - SESSION 2: UI COMPONENTS
 * ==============================================
 * Form, Display, and Feedback components
 */

// ============================================================================
// FORM COMPONENTS
// ============================================================================

/**
 * Input Component - Text, Number, Password variants
 */
const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label,
  error,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          >
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
            icon ? 'pl-10' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${error ? 'var(--error-500)' : focused ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
            color: 'var(--text-primary)'
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--error-500)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Textarea Component - Auto-resize
 */
const Textarea = ({
  value,
  onChange,
  placeholder = '',
  label,
  error,
  disabled = false,
  rows = 3,
  maxRows = 10,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = React.useState(false);
  const textareaRef = React.useRef(null);

  // Auto-resize logic
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const lineHeight = 24;
      const minHeight = rows * lineHeight;
      const maxHeight = maxRows * lineHeight;
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value, rows, maxRows]);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--error-500)' : focused ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
          color: 'var(--text-primary)',
          minHeight: `${rows * 24}px`
        }}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--error-500)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Select Component - Single & Multi select
 */
const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  multi = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option) => {
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];
      const exists = currentValues.some((v) => v.value === option.value);
      if (exists) {
        onChange(currentValues.filter((v) => v.value !== option.value));
      } else {
        onChange([...currentValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }
    setSearch('');
  };

  const removeValue = (optionToRemove, e) => {
    e.stopPropagation();
    if (multi && Array.isArray(value)) {
      onChange(value.filter((v) => v.value !== optionToRemove.value));
    }
  };

  const displayValue = () => {
    if (multi && Array.isArray(value) && value.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span
              key={v.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ background: 'var(--primary-500)', color: 'white' }}
            >
              {v.label}
              <button onClick={(e) => removeValue(v, e)} className="hover:opacity-70">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      );
    }
    if (!multi && value) {
      return <span style={{ color: 'var(--text-primary)' }}>{value.label}</span>;
    }
    return <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>;
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl text-sm text-left flex items-center justify-between transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--error-500)' : isOpen ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
          minHeight: '42px'
        }}
      >
        <div className="flex-1 overflow-hidden">{displayValue()}</div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = multi
                  ? Array.isArray(value) && value.some((v) => v.value === option.value)
                  : value?.value === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors"
                    style={{
                      color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)',
                      background: isSelected ? 'rgba(6,182,212,0.1)' : 'transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={(e) => e.currentTarget.style.background = isSelected ? 'rgba(6,182,212,0.1)' : 'transparent'}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--error-500)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Slider Component - With marks
 */
const Slider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  marks = [],
  showValue = true,
  disabled = false,
  className = ''
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-3">
          {label && (
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-mono" style={{ color: 'var(--primary-400)' }}>
              {value}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`w-full h-2 rounded-full appearance-none cursor-pointer ${disabled ? 'opacity-50' : ''}`}
          style={{
            background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${percentage}%, var(--bg-elevated) ${percentage}%, var(--bg-elevated) 100%)`
          }}
        />
        {marks.length > 0 && (
          <div className="relative mt-2">
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div
                  key={mark.value}
                  className="absolute text-xs transform -translate-x-1/2"
                  style={{ left: `${markPercentage}%`, color: 'var(--text-muted)' }}
                >
                  {mark.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary-500);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6,182,212,0.4);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--primary-500);
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

/**
 * Toggle Component
 */
const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' }
  };

  const currentSize = sizes[size];

  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex items-center rounded-full transition-colors ${currentSize.track}`}
        style={{
          background: checked ? 'var(--primary-500)' : 'var(--bg-elevated)'
        }}
      >
        <span
          className={`inline-block rounded-full transition-transform ${currentSize.thumb} ${checked ? currentSize.translate : 'translate-x-0.5'}`}
          style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        />
      </button>
      {label && (
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}
    </label>
  );
};

/**
 * FileUpload Component - Drag & Drop
 */
const FileUpload = ({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  label,
  disabled = false,
  className = ''
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [error, setError] = React.useState(null);
  const inputRef = React.useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const processFiles = (fileList) => {
    setError(null);
    const validFiles = [];

    for (const file of fileList) {
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onFilesSelected(newFiles);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          borderColor: isDragging ? 'var(--primary-500)' : 'var(--border-subtle)',
          background: isDragging ? 'rgba(6,182,212,0.05)' : 'var(--bg-card)'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto mb-4"
          style={{ color: isDragging ? 'var(--primary-400)' : 'var(--text-muted)' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Max file size: {(maxSize / 1024 / 1024).toFixed(0)}MB
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: 'var(--error-500)' }}>
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary-400)' }}>
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                className="p-1 rounded hover:bg-red-500/20 transition-colors"
                style={{ color: 'var(--error-500)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DISPLAY COMPONENTS
// ============================================================================

/**
 * Card Component - Multiple variants
 */
const Card = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  hoverable = false,
  padding = 'md'
}) => {
  const variants = {
    default: { background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' },
    elevated: { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' },
    glass: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-subtle)' },
    gradient: { background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(6,182,212,0.2)' },
    outline: { background: 'transparent', border: '1px solid var(--border-default)' }
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={`rounded-xl transition-all duration-200 ${paddings[padding]} ${
        hoverable ? 'hover:scale-[1.02] hover:shadow-lg' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={variants[variant]}
      onClick={onClick}
      onMouseOver={(e) => hoverable && (e.currentTarget.style.borderColor = 'var(--primary-500)')}
      onMouseOut={(e) => hoverable && (e.currentTarget.style.borderColor = variants[variant].border.split('solid ')[1])}
    >
      {children}
    </div>
  );
};

/**
 * Badge Component - Multiple colors
 */
const Badge = ({
  children,
  color = 'default',
  size = 'md',
  variant = 'filled',
  className = ''
}) => {
  const colors = {
    default: { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)', border: 'var(--border-subtle)' },
    primary: { bg: 'rgba(6,182,212,0.15)', text: 'var(--primary-400)', border: 'rgba(6,182,212,0.3)' },
    accent: { bg: 'rgba(236,72,153,0.15)', text: 'var(--accent-400)', border: 'rgba(236,72,153,0.3)' },
    success: { bg: 'rgba(34,197,94,0.15)', text: 'var(--success-500)', border: 'rgba(34,197,94,0.3)' },
    warning: { bg: 'rgba(234,179,8,0.15)', text: 'var(--warning-500)', border: 'rgba(234,179,8,0.3)' },
    error: { bg: 'rgba(239,68,68,0.15)', text: 'var(--error-500)', border: 'rgba(239,68,68,0.3)' }
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const currentColor = colors[color];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizes[size]} ${className}`}
      style={{
        background: variant === 'outline' ? 'transparent' : currentColor.bg,
        color: currentColor.text,
        border: `1px solid ${currentColor.border}`
      }}
    >
      {children}
    </span>
  );
};

/**
 * Progress Component - Bar & Circular
 */
const Progress = ({
  value,
  max = 100,
  variant = 'bar',
  size = 'md',
  showLabel = true,
  color = 'primary',
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    primary: 'var(--primary-500)',
    accent: 'var(--accent-500)',
    success: 'var(--success-500)',
    warning: 'var(--warning-500)',
    error: 'var(--error-500)'
  };

  if (variant === 'circular') {
    const sizes = { sm: 48, md: 64, lg: 80 };
    const strokeWidth = { sm: 4, md: 5, lg: 6 };
    const currentSize = sizes[size];
    const currentStroke = strokeWidth[size];
    const radius = (currentSize - currentStroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <svg width={currentSize} height={currentSize} className="-rotate-90">
          <circle
            cx={currentSize / 2}
            cy={currentSize / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={currentStroke}
          />
          <circle
            cx={currentSize / 2}
            cy={currentSize / 2}
            r={radius}
            fill="none"
            stroke={colors[color]}
            strokeWidth={currentStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {showLabel && (
          <span
            className="absolute font-medium text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  // Bar variant
  const barSizes = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Progress</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={`w-full rounded-full overflow-hidden ${barSizes[size]}`}
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${colors[color]}, ${color === 'primary' ? 'var(--accent-500)' : colors[color]})`
          }}
        />
      </div>
    </div>
  );
};

/**
 * Table Component - Sortable & Paginated
 */
const Table = ({
  columns = [],
  data = [],
  sortable = true,
  paginated = true,
  pageSize = 10,
  className = ''
}) => {
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = React.useState(1);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = React.useMemo(() => {
    if (!paginated) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(data.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-subtle)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-opacity-80' : ''
                  }`}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && sortConfig.key === column.key && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : '' }}
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 rounded-lg text-sm transition-colors"
                  style={{
                    background: currentPage === pageNum ? 'var(--primary-500)' : 'var(--bg-card)',
                    color: currentPage === pageNum ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Avatar Component
 */
const Avatar = ({
  src,
  name,
  size = 'md',
  shape = 'circle',
  status,
  className = ''
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const statusColors = {
    online: 'var(--success-500)',
    offline: 'var(--text-muted)',
    busy: 'var(--error-500)',
    away: 'var(--warning-500)'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`flex items-center justify-center font-semibold overflow-hidden ${sizes[size]} ${
          shape === 'circle' ? 'rounded-full' : 'rounded-lg'
        }`}
        style={{
          background: src ? 'transparent' : 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
          color: 'white'
        }}
      >
        {src ? (
          <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      {status && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{
            background: statusColors[status],
            borderColor: 'var(--bg-void)'
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

/**
 * Toast Component - With auto-dismiss
 */
const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const Toast = ({
  id,
  type = 'info',
  title,
  message,
  onClose
}) => {
  const icons = {
    success: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
    error: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  };

  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', icon: 'var(--success-500)' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: 'var(--error-500)' },
    warning: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', icon: 'var(--warning-500)' },
    info: { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', icon: 'var(--primary-400)' }
  };

  return (
    <div
      className="flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-xl shadow-lg animate-slide-in"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${colors[type].border}`
      }}
    >
      <span style={{ color: colors[type].icon }}>{icons[type]}</span>
      <div className="flex-1">
        {title && (
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
        )}
        {message && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

/**
 * Alert Component
 */
const Alert = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const icons = {
    success: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
    error: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  };

  const colors = {
    success: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', text: 'var(--success-500)' },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: 'var(--error-500)' },
    warning: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)', text: 'var(--warning-500)' },
    info: { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', text: 'var(--primary-400)' }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl ${className}`}
      style={{ background: colors[type].bg, border: `1px solid ${colors[type].border}` }}
    >
      <span style={{ color: colors[type].text }}>{icons[type]}</span>
      <div className="flex-1">
        {title && (
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
        )}
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Spinner Component
 */
const Spinner = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizes = {
    xs: 'w-4 h-4 border',
    sm: 'w-5 h-5 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-3'
  };

  const colors = {
    primary: 'var(--primary-500)',
    accent: 'var(--accent-500)',
    white: 'white'
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizes[size]} ${className}`}
      style={{
        borderColor: 'var(--bg-elevated)',
        borderTopColor: colors[color]
      }}
    />
  );
};

/**
 * EmptyState Component
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
        >
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

/**
 * Skeleton Component
 */
const Skeleton = ({
  variant = 'rect',
  width,
  height,
  className = ''
}) => {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4'
  };

  return (
    <div
      className={`animate-pulse ${variants[variant]} ${className}`}
      style={{
        width: width || (variant === 'circle' ? '40px' : '100%'),
        height: height || (variant === 'circle' ? '40px' : variant === 'text' ? '16px' : '100px'),
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
};

// Add shimmer animation
const skeletonStyles = `
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
`;

// ============================================================================
// EXPORTS
// ============================================================================
// All components available globally:
// Form: Input, Textarea, Select, Slider, Toggle, FileUpload
// Display: Card, Badge, Progress, Table, Avatar
// Feedback: ToastProvider, useToast, Toast, Alert, Spinner, EmptyState, Skeleton

console.log('vkTUNEos UI Components loaded successfully!');
console.log('Components: Input, Textarea, Select, Slider, Toggle, FileUpload, Card, Badge, Progress, Table, Avatar, Toast, Alert, Spinner, EmptyState, Skeleton');

window.vkTUNEosComponents = {
  // Form
  Input,
  Textarea,
  Select,
  Slider,
  Toggle,
  FileUpload,
  // Display
  Card,
  Badge,
  Progress,
  Table,
  Avatar,
  // Feedback
  ToastProvider,
  useToast,
  Toast,
  Alert,
  Spinner,
  EmptyState,
  Skeleton,
  // Styles
  skeletonStyles
};
