import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';
import mediaService from '../services/mediaService';
import settingsService from '../services/settingsService';

import Header from '../components/Header';
import SettingsPanel from '../components/SettingsPanel';
import UploadPanel from '../components/UploadPanel';
import MediaList from '../components/MediaList';

export default function AdminDashboard() {
  const [media, setMedia] = useState([]);
  const [settings, setSettings] = useState({ 
    news_enabled: true, 
    logo_blur_enabled: true,
    logo_position: 'top-left',
    clock_position: 'top-right',
    news_position: 'bottom'
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [intervalInput, setIntervalInput] = useState('15');
  const [timeLeft, setTimeLeft] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [mediaData, settingsData] = await Promise.all([
        mediaService.getAllMedia(),
        settingsService.getSettings()
      ]);
      setMedia(mediaData);
      setSettings(settingsData);
      setCityInput(settingsData.weather_city || 'Brasília');
      setIntervalInput(String(settingsData.sync_interval || 15));
      if (settingsData.sync_interval) {
        setTimeLeft(settingsData.sync_interval * 60);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleUpload = async (file) => {
    setUploading(true);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg)$/i.test(file.name);
    const defaultDuration = isVideo ? 0 : 10;
    try {
      await mediaService.uploadMedia(file, defaultDuration);
      fetchData();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar?')) return;
    try {
      await mediaService.deleteMedia(id);
      fetchData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleUpdateMedia = async (m, updates) => {
    try {
      const updated = { ...m, ...updates };
      await mediaService.updateMedia(m.id, updated.duration, updated.active, updated.order);
      fetchData();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleSyncTV = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      await settingsService.triggerSync();
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
  }, [settings.sync_interval]);

  // Sync Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      if (timeLeft === 0 && settings.sync_interval) {
        setTimeout(() => {
          handleSyncTV(true); // Silent sync on timer zero
        }, 0);
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, settings.sync_interval, handleSyncTV]);

  const handleUpdateSettings = async (updatedSettings) => {
    try {
      await settingsService.updateSettings(
        updatedSettings.news_enabled,
        updatedSettings.weather_enabled,
        updatedSettings.weather_city || cityInput,
        updatedSettings.sync_interval || parseInt(intervalInput) || 15,
        updatedSettings.logo_blur_enabled !== undefined ? updatedSettings.logo_blur_enabled : settings.logo_blur_enabled,
        updatedSettings.logo_position || settings.logo_position || 'top-left',
        updatedSettings.clock_position || settings.clock_position || 'top-right',
        updatedSettings.news_position || settings.news_position || 'bottom'
      );
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
    await handleUpdateSettings({ ...settings, weather_city: cityInput });
    alert('Cidade climática atualizada com sucesso!');
  };

  const handleIntervalSave = async () => {
    const val = parseInt(intervalInput);
    if (isNaN(val) || val < 1) {
      alert('Por favor, informe um tempo de sincronização válido (mínimo 1 minuto).');
      return;
    }
    await handleUpdateSettings({ ...settings, sync_interval: val });
    alert('Tempo de sincronização atualizado com sucesso!');
  };

  const handleLogoUpload = async (file) => {
    setUploadingLogo(true);
    try {
      await settingsService.uploadLogo(file);
      fetchData();
    } catch (err) {
      console.error('Logo upload failed', err);
      alert(err.response?.data?.detail || 'Falha ao enviar logotipo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Tem certeza que deseja remover o logotipo personalizado? A TV voltará a exibir o logotipo padrão.')) return;
    try {
      await settingsService.deleteLogo();
      fetchData();
    } catch (err) {
      console.error('Logo delete failed', err);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const baseURL = api.defaults.baseURL || '';

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header
          syncing={syncing}
          onSync={() => handleSyncTV(false)}
          timeLeft={timeLeft}
          onLogout={handleLogout}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SettingsPanel
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUploadLogo={handleLogoUpload}
            onDeleteLogo={handleLogoDelete}
            uploadingLogo={uploadingLogo}
            cityInput={cityInput}
            setCityInput={setCityInput}
            onCitySave={handleCitySave}
            intervalInput={intervalInput}
            setIntervalInput={setIntervalInput}
            onIntervalSave={handleIntervalSave}
            baseURL={baseURL}
          />
          <UploadPanel onUpload={handleUpload} uploading={uploading} />
        </div>

        <MediaList
          media={media}
          onUpdate={handleUpdateMedia}
          onDelete={handleDelete}
          baseURL={baseURL}
        />
      </div>
    </div>
  );
}
