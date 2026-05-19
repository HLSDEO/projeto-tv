import { useState, useEffect } from 'react';
import api from '../services/api';

export default function TVDisplay() {
  const [media, setMedia] = useState([]);
  const [settings, setSettings] = useState({ news_enabled: false });
  const [news, setNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  // Fetch initial data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mediaRes, settingsRes, newsRes] = await Promise.all([
          api.get('/api/media'),
          api.get('/api/settings'),
          api.get('/api/news')
        ]);
        
        const activeMedia = mediaRes.data.filter(m => m.active);
        setMedia(activeMedia);
        setSettings(settingsRes.data);
        setNews(newsRes.data.news);
      } catch (err) {
        console.error("Failed to fetch TV data", err);
      }
    };

    fetchAll();
    
    // Refresh data every 5 minutes
    const dataInterval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(dataInterval);
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
    // Video elements handle their own end event if duration is not strictly enforced, 
    // but here we enforce the configured duration or wait for video to end?
    // User requested "tempo de cada imagem/vídeo", so we use the configured duration.
    const durationMs = (currentMedia?.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentIndex, media]);

  if (media.length === 0) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold">Aguardando mídia...</h1>
      </div>
    );
  }

  const currentItem = media[currentIndex];

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      
      {/* Media Layer */}
      <div className="absolute inset-0 z-0">
        {media.map((m, idx) => (
          <div
            key={m._key}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {m.type === 'video' ? (
              <video 
                src={api.defaults.baseURL + m.url} 
                className="w-full h-full object-cover"
                autoPlay={idx === currentIndex}
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={api.defaults.baseURL + m.url} 
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
              <div className="text-white text-3xl font-black tracking-tighter flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2 py-1 rounded">TV</span>
                <span>DLOG</span>
              </div>
            </div>
          </div>

          {/* News Ticker */}
          {settings.news_enabled && news.length > 0 && (
            <div className="bg-blue-600/90 backdrop-blur-md text-white h-16 flex items-center shadow-2xl border-t border-blue-400/30 overflow-hidden">
              <div className="px-6 py-2 bg-blue-800 h-full flex items-center justify-center font-bold text-xl z-10 shadow-lg shrink-0">
                ÚLTIMAS NOTÍCIAS
              </div>
              <div className="ticker-wrap flex-1 flex items-center h-full text-2xl font-medium tracking-wide">
                <div className="ticker">
                  {news.join(' • ')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
