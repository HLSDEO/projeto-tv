import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Power, Clock, GripVertical } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [media, setMedia] = useState([]);
  const [settings, setSettings] = useState({ news_enabled: true });
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [intervalInput, setIntervalInput] = useState('15');
  const [timeLeft, setTimeLeft] = useState(0);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mediaRes, settingsRes] = await Promise.all([
        api.get('/api/media'),
        api.get('/api/settings')
      ]);
      setMedia(mediaRes.data);
      setSettings(settingsRes.data);
      setCityInput(settingsRes.data.weather_city || 'Brasília');
      setIntervalInput(String(settingsRes.data.sync_interval || 15));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duration', 10);

    try {
      await api.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchData();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar?')) return;
    try {
      await api.delete(`/api/media/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleUpdateMedia = async (m, updates) => {
    try {
      const updated = { ...m, ...updates };
      await api.put(`/api/media/${m.id}`, {
        duration: updated.duration,
        active: updated.active,
        order: updated.order
      });
      fetchData();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const [syncing, setSyncing] = useState(false);

  // Sync Timer Countdown
  useEffect(() => {
    if (!settings.sync_interval) return;
    setTimeLeft(settings.sync_interval * 60);
  }, [settings.sync_interval]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (timeLeft === 0 && settings.sync_interval) {
        handleSyncTV(true); // Silent sync on timer zero
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, settings.sync_interval]);

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSyncTV = async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      await api.post('/api/settings/sync');
      if (!silent) {
        alert('Sinal de sincronização enviado para todas as TVs com sucesso!');
      }
      if (settings.sync_interval) {
        setTimeLeft(settings.sync_interval * 60);
      }
    } catch (err) {
      console.error('Failed to sync TV', err);
      if (!silent) {
        alert('Falha ao enviar sinal de sincronização.');
      }
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  const toggleNews = async () => {
    try {
      await api.put('/api/settings', {
        news_enabled: !settings.news_enabled,
        weather_enabled: settings.weather_enabled,
        weather_city: settings.weather_city,
        sync_interval: settings.sync_interval || 15
      });
      fetchData();
    } catch (err) {
      console.error('Settings update failed', err);
    }
  };

  const toggleWeather = async () => {
    try {
      await api.put('/api/settings', {
        news_enabled: settings.news_enabled,
        weather_enabled: !settings.weather_enabled,
        weather_city: settings.weather_city || cityInput,
        sync_interval: settings.sync_interval || 15
      });
      fetchData();
    } catch (err) {
      console.error('Settings update failed', err);
    }
  };

  const handleCitySave = async () => {
    if (!cityInput.trim()) {
      alert('Por favor, informe uma cidade válida.');
      return;
    }
    try {
      await api.put('/api/settings', {
        news_enabled: settings.news_enabled,
        weather_enabled: settings.weather_enabled,
        weather_city: cityInput,
        sync_interval: settings.sync_interval || 15
      });
      fetchData();
      alert('Cidade climática atualizada com sucesso!');
    } catch (err) {
      console.error('Settings update failed', err);
      alert('Falha ao atualizar a cidade.');
    }
  };

  const handleIntervalSave = async () => {
    const val = parseInt(intervalInput);
    if (isNaN(val) || val < 1) {
      alert('Por favor, informe um tempo de sincronização válido (mínimo 1 minuto).');
      return;
    }
    try {
      await api.put('/api/settings', {
        news_enabled: settings.news_enabled,
        weather_enabled: settings.weather_enabled,
        weather_city: settings.weather_city || cityInput,
        sync_interval: val
      });
      fetchData();
      alert('Tempo de sincronização atualizado com sucesso!');
    } catch (err) {
      console.error('Settings update failed', err);
      alert('Falha ao atualizar o tempo de sincronização.');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchData();
    } catch (err) {
      console.error('Logo upload failed', err);
      alert(err.response?.data?.detail || 'Falha ao enviar logotipo.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Tem certeza que deseja remover o logotipo personalizado? A TV voltará a exibir o logotipo padrão.')) return;
    try {
      await api.delete('/api/settings/logo');
      fetchData();
    } catch (err) {
      console.error('Logo delete failed', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-zinc-800 p-6 rounded-xl border border-zinc-700">
          <h1 className="text-2xl font-bold">Painel Administrativo TV</h1>
          <div className="flex items-center gap-4">
            <div className="bg-zinc-700/50 px-4 py-2 rounded border border-zinc-700 text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Próxima Sincronização: <span className="font-bold text-blue-400 font-mono">{formatTimeLeft()}</span></span>
            </div>
            <button 
              onClick={() => handleSyncTV(false)}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 rounded font-semibold transition flex items-center gap-2"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar TV'}
            </button>
            <button 
              onClick={() => window.open('/', '_blank')}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-medium transition"
            >
              Ver TV
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Upload & Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Settings Panel */}
          <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-6">
            <h2 className="text-xl font-semibold mb-2">Configurações Globais</h2>
            
            {/* Notícias Setting */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
              <div>
                <p className="font-medium">Notícias (Ticker)</p>
                <p className="text-sm text-zinc-400">Exibir barra rolando com notícias do G1 na TV</p>
              </div>
              <button
                onClick={toggleNews}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                  settings.news_enabled ? 'bg-green-500' : 'bg-zinc-600'
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                    settings.news_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Tempo/Clima Setting */}
            <div className="p-4 bg-zinc-900 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Previsão do Tempo</p>
                  <p className="text-sm text-zinc-400">Exibir clima dinâmico da wttr.in ao lado das notícias</p>
                </div>
                <button
                  onClick={toggleWeather}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                    settings.weather_enabled ? 'bg-green-500' : 'bg-zinc-600'
                  }`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                      settings.weather_enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {settings.weather_enabled && (
                <div className="pt-2 flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Cidade para o Clima</label>
                    <input
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Ex: Brasília"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleCitySave}
                    className="self-end px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>

            {/* Logotipo Setting */}
            <div className="p-4 bg-zinc-900 rounded-lg space-y-4">
              <div>
                <p className="font-medium">Logotipo da TV</p>
                <p className="text-sm text-zinc-400">Substitua o logotipo de texto "TV DLOG" por uma imagem personalizada no canto inferior esquerdo</p>
              </div>
              
              {settings.logo_url ? (
                <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/60">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black/40 rounded flex items-center justify-center overflow-hidden border border-zinc-700">
                      <img 
                        src={api.defaults.baseURL + settings.logo_url} 
                        className="w-full h-full object-contain" 
                        alt="Logo Customizada" 
                      />
                    </div>
                    <span className="text-sm text-zinc-400 font-medium truncate max-w-[180px]">Logo ativa</span>
                  </div>
                  <button
                    onClick={handleLogoDelete}
                    className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg border border-red-500/20 transition flex items-center gap-2 text-sm font-semibold"
                    title="Excluir logotipo"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 border border-blue-500/30"
                  >
                    <Upload className="w-5 h-5" />
                    {uploadingLogo ? 'Enviando...' : 'Fazer Upload da Logo'}
                  </button>
                  <input
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
              )}
            </div>

            {/* Tempo de Sincronização Setting */}
            <div className="p-4 bg-zinc-900 rounded-lg space-y-4">
              <div>
                <p className="font-medium">Intervalo de Sincronização Automática</p>
                <p className="text-sm text-zinc-400">Defina o tempo (em minutos) para a atualização automática da TV</p>
              </div>
              <div className="pt-2 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Tempo (minutos)</label>
                  <input
                    type="number"
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                    placeholder="Ex: 15"
                    min="1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleIntervalSave}
                  className="self-end px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>

          {/* Upload Panel */}
          <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
            <h2 className="text-xl font-semibold mb-4">Nova Mídia</h2>
            <div 
              className="border-2 border-dashed border-zinc-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
              <p className="text-zinc-300 font-medium">Clique para fazer upload</p>
              <p className="text-sm text-zinc-500 mt-2">Suporta Imagens e Vídeos</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/mp4,video/webm"
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>
            {uploading && <p className="text-blue-400 mt-4 text-center animate-pulse">Enviando arquivo...</p>}
          </div>
        </div>

        {/* Media List */}
        <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
          <h2 className="text-xl font-semibold mb-6">Mídias Cadastradas</h2>
          <div className="space-y-4">
            {media.map((m, idx) => (
              <div key={m.id} className={`flex items-center gap-4 p-4 rounded-lg border ${m.active ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-75'}`}>
                <GripVertical className="text-zinc-600 cursor-grab" />
                
                <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0 relative">
                  {m.type === 'video' ? (
                    <video src={api.defaults.baseURL + m.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={api.defaults.baseURL + m.url} className="w-full h-full object-cover" alt="" />
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-xs font-bold uppercase">
                    {m.type}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.original_name}</p>
                  <p className="text-sm text-zinc-500">Ordem: {m.order}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <input
                      type="number"
                      value={m.duration}
                      onChange={(e) => handleUpdateMedia(m, { duration: parseInt(e.target.value) || 1 })}
                      className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-center"
                      min="1"
                    />
                    <span className="text-sm text-zinc-400">segundos</span>
                  </div>

                  <button
                    onClick={() => handleUpdateMedia(m, { active: !m.active })}
                    className={`p-2 rounded-full transition ${m.active ? 'text-green-500 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-500/10'}`}
                    title={m.active ? "Desativar" : "Ativar"}
                  >
                    <Power className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition"
                    title="Apagar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {media.length === 0 && (
              <p className="text-center text-zinc-500 py-8">Nenhuma mídia cadastrada ainda.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
