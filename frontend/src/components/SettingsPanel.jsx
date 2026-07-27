import { useState, useRef } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { getAssetUrl } from '../services/api';

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onUploadLogo,
  onDeleteLogo,
  uploadingLogo,
  cityInput,
  setCityInput,
  onCitySave,
  intervalInput,
  setIntervalInput,
  onIntervalSave
}) {
  const logoInputRef = useRef(null);
  const [pendingAction, setPendingAction] = useState(null); // 'news', 'weather', 'city', 'logoDelete', 'logoBlur', 'logoPosition', 'clockPosition', 'newsPosition', 'interval'

  const runAction = async (actionName, fn) => {
    if (pendingAction) return;
    setPendingAction(actionName);
    try {
      await fn();
    } finally {
      setPendingAction(null);
    }
  };

  const toggleNews = () => {
    runAction('news', () => onUpdateSettings({
      ...settings,
      news_enabled: !settings.news_enabled,
    }));
  };

  const toggleWeather = () => {
    runAction('weather', () => onUpdateSettings({
      ...settings,
      weather_enabled: !settings.weather_enabled,
    }));
  };

  const toggleLogoBlur = () => {
    runAction('logoBlur', () => onUpdateSettings({
      ...settings,
      logo_blur_enabled: !settings.logo_blur_enabled
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUploadLogo(file);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCitySave = () => {
    runAction('city', () => onCitySave());
  };

  const handleIntervalSave = () => {
    runAction('interval', () => onIntervalSave());
  };

  const handleLogoDelete = () => {
    if (!window.confirm('Tem certeza que deseja remover o logotipo personalizado? A TV voltará a exibir o logotipo padrão.')) return;
    runAction('logoDelete', () => onDeleteLogo());
  };

  const handleLogoPositionChange = (e) => {
    const val = e.target.value;
    runAction('logoPosition', () => onUpdateSettings({ ...settings, logo_position: val }));
  };

  const handleClockPositionChange = (e) => {
    const val = e.target.value;
    runAction('clockPosition', () => onUpdateSettings({ ...settings, clock_position: val }));
  };

  const handleNewsPositionChange = (e) => {
    const val = e.target.value;
    runAction('newsPosition', () => onUpdateSettings({ ...settings, news_position: val }));
  };

  const isPending = pendingAction !== null || uploadingLogo;

  return (
    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-6">
      <h2 className="text-xl font-semibold mb-2">Configurações Globais</h2>
      
      {/* Notícias Setting */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
        <div>
          <p className="font-medium">Notícias (Ticker)</p>
          <p className="text-sm text-zinc-400">Exibir barra rolando com notícias na TV</p>
        </div>
        <button
          onClick={toggleNews}
          disabled={isPending}
          className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors disabled:opacity-50 cursor-pointer ${
            settings.news_enabled ? 'bg-green-500' : 'bg-zinc-600'
          }`}
        >
          <div
            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform flex items-center justify-center ${
              settings.news_enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          >
            {pendingAction === 'news' && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-650" />}
          </div>
        </button>
      </div>

      {/* Tempo/Clima Setting */}
      <div className="p-4 bg-zinc-900 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Previsão do Tempo</p>
            <p className="text-sm text-zinc-400">Exibir clima dinâmico ao lado das notícias</p>
          </div>
          <button
            onClick={toggleWeather}
            disabled={isPending}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors disabled:opacity-50 cursor-pointer ${
              settings.weather_enabled ? 'bg-green-500' : 'bg-zinc-600'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform flex items-center justify-center ${
                settings.weather_enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {pendingAction === 'weather' && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-650" />}
            </div>
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
                disabled={isPending}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleCitySave}
              disabled={isPending}
              className="self-end px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm font-semibold rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {pendingAction === 'city' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Logotipo Setting */}
      <div className="p-4 bg-zinc-900 rounded-lg space-y-4">
        <div>
          <p className="font-medium">Logotipo da TV</p>
          <p className="text-sm text-zinc-400">Substitua o logotipo por uma imagem personalizada no canto superior esquerdo</p>
        </div>
        
        {settings.logo_url ? (
          <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/60">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black/40 rounded flex items-center justify-center overflow-hidden border border-zinc-700">
                <img 
                  src={getAssetUrl(settings.logo_url)} 
                  className="w-full h-full object-contain" 
                  alt="Logo Customizada" 
                />
              </div>
              <span className="text-sm text-zinc-400 font-medium truncate max-w-[180px]">Logo ativa</span>
            </div>
            <button
              onClick={handleLogoDelete}
              disabled={isPending}
              className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg border border-red-500/20 transition flex items-center gap-2 text-sm font-semibold cursor-pointer disabled:opacity-50"
              title="Excluir logotipo"
            >
              {pendingAction === 'logoDelete' ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Remover
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 border border-blue-500/30 cursor-pointer disabled:opacity-50"
            >
              {uploadingLogo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Fazer Upload da Logo</span>
                </>
              )}
            </button>
            <input
              type="file"
              ref={logoInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={isPending}
            />
          </div>
        )}

        {/* Switch para Fundo Borrado (Blur) */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div>
            <p className="font-medium text-sm">Fundo Borrado (Blur)</p>
            <p className="text-xs text-zinc-400">Exibir fundo semitransparente com desfoque atrás do logotipo</p>
          </div>
          <button
            onClick={toggleLogoBlur}
            disabled={isPending}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors disabled:opacity-50 cursor-pointer ${
              settings.logo_blur_enabled ? 'bg-green-500' : 'bg-zinc-600'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform flex items-center justify-center ${
                settings.logo_blur_enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {pendingAction === 'logoBlur' && <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-650" />}
            </div>
          </button>
        </div>
      </div>

      {/* Posicionamento dos Componentes */}
      <div className="p-4 bg-zinc-900 rounded-lg space-y-4">
        <div>
          <p className="font-medium">Posicionamento dos Componentes</p>
          <p className="text-sm text-zinc-400">Personalize onde cada elemento será exibido na tela da TV</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 pt-2">
          {/* Logo Position */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Posição do Logotipo</label>
            <div className="relative">
              <select
                value={settings.logo_position || 'top-left'}
                onChange={handleLogoPositionChange}
                disabled={isPending}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="top-left">Superior Esquerdo</option>
                <option value="top-right">Superior Direito</option>
                <option value="bottom-left">Inferior Esquerdo</option>
                <option value="bottom-right">Inferior Direito</option>
              </select>
              {pendingAction === 'logoPosition' && (
                <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
          </div>

          {/* Clock Position */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Posição do Relógio</label>
            <div className="relative">
              <select
                value={settings.clock_position || 'top-right'}
                onChange={handleClockPositionChange}
                disabled={isPending}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="top-left">Superior Esquerdo</option>
                <option value="top-right">Superior Direito</option>
                <option value="bottom-left">Inferior Esquerdo</option>
                <option value="bottom-right">Inferior Direito</option>
              </select>
              {pendingAction === 'clockPosition' && (
                <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
          </div>

          {/* News Position */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Posição da Barra de Notícias</label>
            <div className="relative">
              <select
                value={settings.news_position || 'bottom'}
                onChange={handleNewsPositionChange}
                disabled={isPending}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="top">Superior (Topo)</option>
                <option value="bottom">Inferior (Rodapé)</option>
              </select>
              {pendingAction === 'newsPosition' && (
                <Loader2 className="absolute right-8 top-2.5 w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
          </div>
        </div>
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
              disabled={isPending}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleIntervalSave}
            disabled={isPending}
            className="self-end px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm font-semibold rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {pendingAction === 'interval' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
