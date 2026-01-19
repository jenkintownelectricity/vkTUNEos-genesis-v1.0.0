/**
 * vkTUNEos KILLER UI - SESSION 3: MEDIA + SPECIAL COMPONENTS
 * ===========================================================
 * AudioPlayer, Waveform, VideoPlayer, CoordinateTree, MoodPad, ChatInterface, NodeEditor
 */

// ============================================================================
// MEDIA COMPONENTS
// ============================================================================

/**
 * AudioPlayer Component - Full featured player with controls
 */
const AudioPlayer = ({
  src,
  title = 'Unknown Track',
  artist = 'Unknown Artist',
  coverArt,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
  className = ''
}) => {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onEnded]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume) => {
    const audio = audioRef.current;
    if (!audio) return;

    setVolume(newVolume);
    audio.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <audio ref={audioRef} src={src} autoPlay={autoPlay} />

      <div className="p-4">
        {/* Track Info */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
          >
            {coverArt ? (
              <img src={coverArt} alt={title} className="w-full h-full object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h4>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              {artist}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 rounded-full cursor-pointer mb-3 relative"
          style={{ background: 'var(--bg-elevated)' }}
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${progressPercentage}%`,
              background: 'linear-gradient(90deg, var(--primary-500), var(--accent-500))'
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg transition-all"
            style={{
              left: `${progressPercentage}%`,
              transform: `translateX(-50%) translateY(-50%)`,
              background: 'white'
            }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                boxShadow: '0 4px 15px rgba(6,182,212,0.4)'
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
              </svg>
            </button>
          </div>

          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${(isMuted ? 0 : volume) * 100}%, var(--bg-elevated) ${(isMuted ? 0 : volume) * 100}%, var(--bg-elevated) 100%)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Waveform Component - Canvas-based audio visualization
 */
const Waveform = ({
  data = [],
  currentTime = 0,
  duration = 100,
  onSeek,
  color = 'var(--primary-500)',
  height = 80,
  barWidth = 3,
  barGap = 2,
  className = ''
}) => {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [isHovering, setIsHovering] = React.useState(false);
  const [hoverPosition, setHoverPosition] = React.useState(0);

  // Generate random waveform data if none provided
  const waveformData = React.useMemo(() => {
    if (data.length > 0) return data;
    const bars = 100;
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
  }, [data]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, height);

    const progressPercent = duration ? currentTime / duration : 0;
    const totalBars = waveformData.length;
    const totalWidth = totalBars * (barWidth + barGap);
    const startX = (rect.width - totalWidth) / 2;

    waveformData.forEach((value, index) => {
      const x = startX + index * (barWidth + barGap);
      const barHeight = value * (height - 10);
      const y = (height - barHeight) / 2;
      const isPlayed = (index / totalBars) <= progressPercent;

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      if (isPlayed) {
        gradient.addColorStop(0, '#22d3ee');
        gradient.addColorStop(1, '#ec4899');
      } else {
        gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.1)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });

    // Hover indicator
    if (isHovering) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(hoverPosition, 0, 2, height);
    }
  }, [waveformData, currentTime, duration, height, barWidth, barGap, isHovering, hoverPosition]);

  const handleClick = (e) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition(e.clientX - rect.left);
  };

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      style={{ height }}
    >
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
};

/**
 * VideoPlayer Component - HTML5 video with custom controls
 */
const VideoPlayer = ({
  src,
  poster,
  title,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
  className = ''
}) => {
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const controlsTimeout = React.useRef(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', () => setIsLoading(true));
    video.addEventListener('canplay', () => setIsLoading(false));

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    video.currentTime = percentage * duration;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{ background: 'black' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play Overlay */}
      {!isPlaying && !isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlayPause}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
      >
        {/* Progress Bar */}
        <div
          className="h-1.5 rounded-full cursor-pointer mb-3 relative"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              background: 'linear-gradient(90deg, var(--primary-500), var(--accent-500))'
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-lg transition-colors hover:bg-white/20"
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg transition-colors hover:bg-white/20"
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>

            <span className="text-sm text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm text-white/60 mr-4">{title}</span>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg transition-colors hover:bg-white/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SPECIAL COMPONENTS
// ============================================================================

/**
 * CoordinateTree Component - Expandable tree view for coordinates
 */
const CoordinateTree = ({
  data = [],
  selectedId,
  onSelect,
  onExpand,
  className = ''
}) => {
  const [expanded, setExpanded] = React.useState(new Set());

  const toggleExpand = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
    onExpand?.(id, newExpanded.has(id));
  };

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all`}
          style={{
            marginLeft: `${level * 16}px`,
            background: isSelected ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(236,72,153,0.1))' : 'transparent',
            borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent'
          }}
          onClick={() => onSelect?.(node)}
          onMouseOver={(e) => !isSelected && (e.currentTarget.style.background = 'var(--bg-elevated)')}
          onMouseOut={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              className="p-1 rounded transition-colors hover:bg-white/10"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  color: 'var(--text-muted)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <span className="w-6" />
          )}

          <span
            className={`w-2 h-2 rounded-full`}
            style={{
              background: node.type === 'category' ? 'var(--primary-500)' :
                         node.type === 'domain' ? 'var(--accent-500)' :
                         'var(--text-muted)'
            }}
          />

          <span
            className="flex-1 text-sm truncate"
            style={{ color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)' }}
          >
            {node.name}
          </span>

          {node.count !== undefined && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              {node.count}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="p-4">
        {data.length === 0 ? (
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No coordinates found
          </p>
        ) : (
          data.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
};

/**
 * MoodPad Component - 2D clickable grid for mood selection
 */
const MoodPad = ({
  onSelect,
  value,
  width = 300,
  height = 300,
  className = ''
}) => {
  const canvasRef = React.useRef(null);
  const [position, setPosition] = React.useState(value || { x: 0.5, y: 0.5 });
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(6,182,212,0.3)');
    gradient.addColorStop(0.5, 'rgba(139,92,246,0.3)');
    gradient.addColorStop(1, 'rgba(236,72,153,0.3)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      const y = (height / 10) * i;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw labels
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Happy', width - 45, 20);
    ctx.fillText('Sad', 10, height - 10);
    ctx.fillText('Energetic', width - 65, height - 10);
    ctx.fillText('Calm', 10, 20);

    // Draw position indicator
    const posX = position.x * width;
    const posY = (1 - position.y) * height;

    // Outer glow
    const glowGradient = ctx.createRadialGradient(posX, posY, 0, posX, posY, 30);
    glowGradient.addColorStop(0, 'rgba(6,182,212,0.4)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(posX, posY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(posX, posY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'var(--primary-500)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(posX, posY, 10, 0, Math.PI * 2);
    ctx.stroke();
  }, [position, width, height]);

  const handleInteraction = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));

    setPosition({ x, y });
    onSelect?.({ x, y, energy: x, valence: y });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) handleInteraction(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className={`inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-xl cursor-crosshair"
        style={{ border: '1px solid var(--border-subtle)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="mt-3 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Energy: {(position.x * 100).toFixed(0)}%</span>
        <span>Valence: {(position.y * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

/**
 * ChatInterface Component - Message list with input
 */
const ChatInterface = ({
  messages = [],
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  className = ''
}) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend?.(input.trim());
    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden ${className}`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '300px', maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4" style={{ color: 'var(--text-muted)' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Start a conversation
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
                    : 'var(--bg-elevated)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)'
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.timestamp && (
                  <p
                    className="text-xs mt-1"
                    style={{ opacity: 0.7 }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 flex items-end gap-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            maxHeight: '120px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="p-3 rounded-xl transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            color: 'white'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * NodeEditor Component - Simplified node-based workflow editor
 */
const NodeEditor = ({
  nodes = [],
  connections = [],
  onNodeSelect,
  onNodeMove,
  onConnect,
  className = ''
}) => {
  const containerRef = React.useRef(null);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [draggingNode, setDraggingNode] = React.useState(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const nodeTypes = {
    input: { color: 'var(--success-500)', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12' },
    process: { color: 'var(--primary-500)', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
    output: { color: 'var(--accent-500)', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
    ai: { color: 'var(--warning-500)', icon: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' }
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingNode(node.id);
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectedNode(node.id);
    onNodeSelect?.(node);
  };

  const handleMouseMove = (e) => {
    if (!draggingNode || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - offset.x;
    const y = e.clientY - containerRect.top - offset.y;

    onNodeMove?.(draggingNode, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const renderConnection = (conn, index) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);

    if (!fromNode || !toNode) return null;

    const fromX = fromNode.x + 120;
    const fromY = fromNode.y + 40;
    const toX = toNode.x;
    const toY = toNode.y + 40;

    const midX = (fromX + toX) / 2;

    return (
      <path
        key={index}
        d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
        fill="none"
        stroke="url(#connectionGradient)"
        strokeWidth="2"
        strokeDasharray={conn.active ? "none" : "5,5"}
        className="transition-all"
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        minHeight: '400px'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--text-muted)" />
          </pattern>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-500)" />
            <stop offset="100%" stopColor="var(--accent-500)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Connections */}
        {connections.map(renderConnection)}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const type = nodeTypes[node.type] || nodeTypes.process;
        const isSelected = selectedNode === node.id;

        return (
          <div
            key={node.id}
            className={`absolute rounded-xl p-4 cursor-move transition-shadow ${
              isSelected ? 'ring-2 ring-offset-2' : ''
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: '120px',
              background: 'var(--bg-card)',
              border: `2px solid ${isSelected ? type.color : 'var(--border-subtle)'}`,
              boxShadow: isSelected ? `0 0 20px ${type.color}40` : 'none',
              ringColor: type.color,
              ringOffsetColor: 'var(--bg-surface)'
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
          >
            {/* Node Header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${type.color}20` }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={type.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={type.icon} />
                </svg>
              </div>
            </div>

            {/* Node Label */}
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {node.label}
            </p>

            {/* Connection Points */}
            <div
              className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
              style={{ background: 'var(--bg-card)', borderColor: type.color }}
            />
            <div
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
              style={{ background: 'var(--bg-card)', borderColor: type.color }}
            />
          </div>
        );
      })}

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
              <rect width="8" height="4" x="3" y="3" rx="1"/><rect width="8" height="4" x="13" y="17" rx="1"/><path d="M7 7v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7"/>
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Drag nodes from the palette
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================
console.log('vkTUNEos Media + Special Components loaded successfully!');
console.log('Components: AudioPlayer, Waveform, VideoPlayer, CoordinateTree, MoodPad, ChatInterface, NodeEditor');

window.vkTUNEosMedia = {
  AudioPlayer,
  Waveform,
  VideoPlayer,
  CoordinateTree,
  MoodPad,
  ChatInterface,
  NodeEditor
};
