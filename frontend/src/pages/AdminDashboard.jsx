import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';
import mediaService from '../services/mediaService';
import settingsService from '../services/settingsService';
import birthdayService from '../services/birthdayService';

import Header from '../components/Header';
import SettingsPanel from '../components/SettingsPanel';
import UploadPanel from '../components/UploadPanel';
import MediaList from '../components/MediaList';

const monthNames = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro"
};

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
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  // Birthday report states
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [filterType, setFilterType] = useState('month'); // 'month' or 'period'
  const [birthdayMonth, setBirthdayMonth] = useState(String(new Date().getMonth() + 1));
  const [startMonth, setStartMonth] = useState('1');
  const [endMonth, setEndMonth] = useState('12');
  const [birthdays, setBirthdays] = useState([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);
  const [birthdayError, setBirthdayError] = useState('');

  const handleFetchBirthdays = async () => {
    setLoadingBirthdays(true);
    setBirthdayError('');
    try {
      const params = {};
      if (filterType === 'month') {
        params.month = parseInt(birthdayMonth);
      } else {
        params.start_month = parseInt(startMonth);
        params.end_month = parseInt(endMonth);
      }
      const data = await birthdayService.getBirthdays(params);
      setBirthdays(data);
    } catch (err) {
      console.error('Error fetching birthdays', err);
      setBirthdayError('Erro ao buscar aniversariantes. Tente novamente.');
    } finally {
      setLoadingBirthdays(false);
    }
  };

  const handleExportExcel = () => {
    if (!birthdays || birthdays.length === 0) return;
    const title = filterType === 'month' 
      ? `Relatório de Aniversariantes - ${monthNames[birthdayMonth]}`
      : `Relatório de Aniversariantes - Período ${monthNames[startMonth]} a ${monthNames[endMonth]}`;
    const filename = filterType === 'month'
      ? `aniversariantes_${monthNames[birthdayMonth].toLowerCase()}.xls`
      : `aniversariantes_periodo_${monthNames[startMonth].toLowerCase()}_a_${monthNames[endMonth].toLowerCase()}.xls`;
      
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; }
          th { background-color: #10b981; color: white; font-weight: bold; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Nome do Servidor</th>
              <th>Data de Nascimento</th>
            </tr>
          </thead>
          <tbody>
            ${birthdays.map(item => `
              <tr>
                <td>${item.NO_PESSOA}</td>
                <td>${item.DT_NASCIMENTO}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!birthdays || birthdays.length === 0) return;
    const reference = filterType === 'month'
      ? `Mês de referência: ${monthNames[birthdayMonth]}`
      : `Período: ${monthNames[startMonth]} a ${monthNames[endMonth]}`;
      
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Aniversariantes</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 5px; }
            h2 { color: #4b5563; font-size: 16px; font-weight: normal; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f3f4f6; color: #1e3a8a; font-weight: bold; text-align: left; border-bottom: 2px solid #cbd5e1; }
            th, td { border: 1px solid #e5e7eb; padding: 12px 10px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; font-size: 11px; color: #9ca3af; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Aniversariantes</h1>
          <h2>${reference}</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 70%;">Nome do Servidor</th>
                <th style="width: 30%;">Data de Nascimento</th>
              </tr>
            </thead>
            <tbody>
              ${birthdays.map(item => `
                <tr>
                  <td>${item.NO_PESSOA}</td>
                  <td>${item.DT_NASCIMENTO}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} | TV DLOG</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


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
      await fetchData();
      showToast('Mídia enviada com sucesso!', 'success');
      await handleSyncTV(true); // silent sync to update TVs
    } catch (err) {
      console.error('Upload failed', err);
      showToast('Falha ao enviar arquivo de mídia.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await mediaService.deleteMedia(id);
      await fetchData();
      showToast('Mídia excluída com sucesso!', 'success');
      await handleSyncTV(true); // silent sync to update TVs
    } catch (err) {
      console.error('Delete failed', err);
      showToast('Falha ao excluir mídia.', 'error');
    }
  };

  const handleUpdateMedia = async (m, updates) => {
    try {
      const updated = { ...m, ...updates };
      await mediaService.updateMedia(
        m.id,
        updated.duration,
        updated.active,
        updated.order,
        updated.scheduled_start ?? null
      );
      await fetchData();
      
      // Determine what was updated to show a tailored message
      if (updates.active !== undefined) {
        showToast(updates.active ? 'Mídia ativada com sucesso!' : 'Mídia desativada com sucesso!', 'success');
      } else if (updates.scheduled_start !== undefined) {
        showToast(updates.scheduled_start ? 'Início agendado atualizado com sucesso!' : 'Agendamento removido!', 'success');
      } else {
        showToast('Mídia atualizada com sucesso!', 'success');
      }
      
      await handleSyncTV(true); // silent sync to update TVs
    } catch (err) {
      console.error('Update failed', err);
      showToast('Falha ao atualizar mídia.', 'error');
    }
  };

  const handleReorder = async (orderedIds) => {
    try {
      await mediaService.reorderMedia(orderedIds);
      await fetchData();
      showToast('Nova ordem das mídias salva com sucesso!', 'success');
      await handleSyncTV(true); // silent sync to update TVs
    } catch (err) {
      console.error('Reorder failed', err);
      showToast('Erro ao salvar reordenação das mídias.', 'error');
    }
  };

  const handleSyncTV = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      await settingsService.triggerSync();
      if (!silent) {
        showToast('Sinal de sincronização enviado para todas as TVs com sucesso!', 'success');
      }
      if (settings.sync_interval) {
        setTimeLeft(settings.sync_interval * 60);
      }
    } catch (err) {
      console.error('Failed to sync TV', err);
      showToast('Falha ao enviar sinal de sincronização.', 'error');
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
      await fetchData();
      showToast('Configurações atualizadas com sucesso!', 'success');
      await handleSyncTV(true); // Notify TVs of settings changes
    } catch (err) {
      console.error('Settings update failed', err);
      showToast('Falha ao atualizar configurações.', 'error');
    }
  };

  const handleCitySave = async () => {
    if (!cityInput.trim()) {
      showToast('Por favor, informe uma cidade válida.', 'error');
      return;
    }
    await handleUpdateSettings({ ...settings, weather_city: cityInput });
  };

  const handleIntervalSave = async () => {
    const val = parseInt(intervalInput);
    if (isNaN(val) || val < 1) {
      showToast('Por favor, informe um tempo de sincronização válido (mínimo 1 minuto).', 'error');
      return;
    }
    await handleUpdateSettings({ ...settings, sync_interval: val });
  };

  const handleLogoUpload = async (file) => {
    setUploadingLogo(true);
    try {
      await settingsService.uploadLogo(file);
      await fetchData();
      showToast('Logotipo atualizado com sucesso!', 'success');
      await handleSyncTV(true); // Notify TVs
    } catch (err) {
      console.error('Logo upload failed', err);
      showToast(err.response?.data?.detail || 'Falha ao enviar logotipo.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      await settingsService.deleteLogo();
      await fetchData();
      showToast('Logotipo removido com sucesso!', 'success');
      await handleSyncTV(true); // Notify TVs
    } catch (err) {
      console.error('Logo delete failed', err);
      showToast('Falha ao remover logotipo.', 'error');
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
          onOpenBirthdays={() => setShowBirthdayModal(true)}
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
          onReorder={handleReorder}
          baseURL={baseURL}
        />
      </div>

      {/* Birthday Modal */}
      {showBirthdayModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🎂 Relatório de Aniversariantes
              </h3>
              <button
                onClick={() => {
                  setShowBirthdayModal(false);
                  setBirthdays([]);
                  setBirthdayError('');
                }}
                className="text-zinc-400 hover:text-white transition text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="py-4">
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Tipo de Filtro
              </label>
              <div className="flex gap-2 mb-4 bg-zinc-900 p-1 rounded-lg border border-zinc-700/60 w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('month');
                    setBirthdays([]);
                  }}
                  className={`px-4 py-1.5 rounded text-xs font-semibold transition ${
                    filterType === 'month' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Mês Único
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('period');
                    setBirthdays([]);
                  }}
                  className={`px-4 py-1.5 rounded text-xs font-semibold transition ${
                    filterType === 'period' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Período (Intervalo)
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end border-t border-zinc-700/40 pt-4">
                {filterType === 'month' ? (
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Selecione o Mês dos Aniversariantes
                    </label>
                    <select
                      value={birthdayMonth}
                      onChange={(e) => setBirthdayMonth(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {Object.entries(monthNames).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 w-full grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Mês Inicial
                      </label>
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {Object.entries(monthNames).map(([key, name]) => (
                          <option key={key} value={key}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Mês Final
                      </label>
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                        {Object.entries(monthNames).map(([key, name]) => (
                          <option key={key} value={key}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleFetchBirthdays}
                  disabled={loadingBirthdays}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm font-semibold rounded transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingBirthdays ? 'Carregando...' : 'Receber Informação'}
                </button>
              </div>
            </div>

            {birthdayError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm mb-4">
                {birthdayError}
              </div>
            )}

            {/* Report Area */}
            <div className="flex-1 overflow-y-auto min-h-[200px] border border-zinc-700/60 rounded-lg bg-zinc-900/50 p-2">
              {loadingBirthdays ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                  Buscando dados no banco corporativo...
                </div>
              ) : birthdays.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-700 text-zinc-400 text-xs font-semibold">
                      <th className="py-2 px-3">Nome do Servidor</th>
                      <th className="py-2 px-3 text-right">Data de Nascimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {birthdays.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition">
                        <td className="py-2 px-3 font-medium text-white">{item.NO_PESSOA}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{item.DT_NASCIMENTO}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full py-12 text-zinc-500 text-sm">
                  Nenhum dado carregado. Escolha o mês/período e clique em "Receber Informação".
                </div>
              )}
            </div>

            {/* Footer controls for PDF/Excel */}
            <div className="flex flex-wrap justify-between items-center pt-4 border-t border-zinc-700 mt-4 gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={birthdays.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold rounded transition flex items-center gap-1.5 cursor-pointer"
                >
                  📊 Exportar Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={birthdays.length === 0}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold rounded transition flex items-center gap-1.5 cursor-pointer"
                >
                  📄 Exportar PDF
                </button>
              </div>
              <button
                onClick={() => {
                  setShowBirthdayModal(false);
                  setBirthdays([]);
                  setBirthdayError('');
                }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-auto max-w-sm border-zinc-700/80 animate-fade-in ${
              t.type === 'success'
                ? 'bg-zinc-950/90 border-emerald-500/35 text-emerald-400'
                : t.type === 'error'
                ? 'bg-zinc-950/90 border-rose-500/35 text-rose-400'
                : 'bg-zinc-950/90 border-blue-500/35 text-blue-400'
            }`}
          >
            {t.type === 'success' && (
              <span className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20 text-xs font-bold">✓</span>
            )}
            {t.type === 'error' && (
              <span className="w-5 h-5 bg-rose-500/10 rounded-full flex items-center justify-center shrink-0 border border-rose-500/20 text-xs font-bold">⚠</span>
            )}
            {t.type === 'info' && (
              <span className="w-5 h-5 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 border border-blue-500/20 text-xs font-bold">ℹ</span>
            )}
            <span className="text-sm font-semibold text-white select-none">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
