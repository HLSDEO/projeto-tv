import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import mediaService from '../services/mediaService';
import settingsService from '../services/settingsService';
import newsService from '../services/newsService';

function VideoSlide({ src, isActive, duration, onEnded }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Autoplay prevented or failed:", err);
        });
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-cover"
      muted
      playsInline
      loop={duration > 0}
      onEnded={onEnded}
    />
  );
}

export default function TVDisplay() {
  const [media, setMedia] = useState([]);
  const [settings, setSettings] = useState({ news_enabled: false });
  const [news, setNews] = useState([]);
  const [weather, setWeather] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  const fetchAll = async () => {
    try {
      const [mediaData, settingsData, newsData] = await Promise.all([
        mediaService.getAllMedia(),
        settingsService.getSettings(),
        newsService.getNews()
      ]);
      
      const activeMedia = mediaData.filter(m => m.active);
      setMedia(activeMedia);
      setSettings(settingsData);
      setNews(newsData.news);

      if (settingsData.weather_enabled) {
        try {
          const weatherData = await settingsService.getWeather();
          if (weatherData.enabled) {
            setWeather(weatherData.weather);
          } else {
            setWeather('');
          }
        } catch (weatherErr) {
          console.error("Failed to fetch weather data", weatherErr);
          setWeather('');
        }
      } else {
        setWeather('');
      }
    } catch (err) {
      console.error("Failed to fetch TV data", err);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchAll();
  }, []);

  // Polling with dynamic interval based on sync_interval setting
  useEffect(() => {
    const intervalMinutes = settings.sync_interval || 15;
    const dataInterval = setInterval(fetchAll, intervalMinutes * 60 * 1000);
    return () => clearInterval(dataInterval);
  }, [settings.sync_interval]);

  // WebSocket for manual synchronization
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      ws = new WebSocket(getWebSocketUrl('/ws'));

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync') {
            fetchAll();
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carousel logic
  useEffect(() => {
    if (media.length === 0) return;

    const currentMedia = media[currentIndex];

    // If it's a video set to play complete (duration === 0), we transition via the video's onEnded event.
    // We add a safety fallback timeout of 5 minutes (300 seconds) in case of playback failure.
    if (currentMedia?.type === 'video' && currentMedia?.duration === 0) {
      const fallbackTimer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      }, 5 * 60 * 1000);
      return () => clearTimeout(fallbackTimer);
    }

    const durationMs = (currentMedia?.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentIndex, media]);

  const totalNewsLength = (news || []).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const tickerDuration = Math.max(45, Math.round(totalNewsLength * 0.25));

  if (media.length === 0) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold">Aguardando mídia...</h1>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      
      {/* Media Layer */}
      <div className="absolute inset-0 z-0">
        {media.map((m, idx) => (
          <div
            key={m.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {m.type === 'video' ? (
              <VideoSlide 
                src={api.defaults.baseURL + m.url}
                isActive={idx === currentIndex}
                duration={m.duration}
                onEnded={() => {
                  if (m.duration === 0) {
                    setCurrentIndex((prev) => (prev + 1) % media.length);
                  }
                }}
              />
            ) : (
              <img 
                src={getAssetUrl(m.url)}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>
        ))}
      </div>

      {/* Overlay Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between">
        
        {/* Top bar (Clock) */}
        <div className="p-8 flex justify-end">
          <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
            <span className="text-white text-5xl font-bold tracking-wider drop-shadow-lg">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Bottom area (Logo & News) */}
        <div>
          {/* Logo */}
          <div className="px-8 pb-8 flex justify-start">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
              {settings.logo_url ? (
                <img 
                  src={getAssetUrl(settings.logo_url)}
                  className="max-h-16 max-w-[220px] object-contain block" 
                  alt="Logo" 
                />
              ) : (
                <div className="text-white text-3xl font-black tracking-tighter flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded">TV</span>
                  <span>DLOG</span>
                </div>
              )}
            </div>
          </div>

          {/* News Ticker & Weather */}
          {((settings.news_enabled && news.length > 0) || (settings.weather_enabled && weather)) && (
            <div className="bg-blue-600/90 backdrop-blur-md text-white h-16 flex items-center shadow-2xl border-t border-blue-400/30 overflow-hidden">
              {settings.news_enabled && news.length > 0 && (
                <>
                  <div className="px-6 py-2 bg-blue-800 h-full flex items-center justify-center font-bold text-xl z-10 shadow-lg shrink-0">
                    ÚLTIMAS NOTÍCIAS
                  </div>
                  <div className="ticker-wrap flex-1 flex items-center h-full text-2xl font-medium tracking-wide">
                    <div 
                      className="ticker"
                      style={{ animationDuration: `${tickerDuration}s` }}
                    >
                      {news.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center shrink-0 mr-24">
                          <span className="w-3 h-3 rounded-full bg-blue-300 mr-4 animate-pulse shrink-0 shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {!settings.news_enabled && <div className="flex-1" />}

              {settings.weather_enabled && weather && (
                <div className="px-6 py-2 bg-blue-800/90 backdrop-blur-md h-full flex items-center justify-center font-semibold text-lg z-10 shadow-lg shrink-0 border-l border-blue-400/30">
                  {weather}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
