import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import authService from '../services/authService';
import Header from '../components/Header';
import { RefreshCw, Search, Calendar, ShieldAlert, Download, Trash2, Copy, Terminal, ArrowDown, Loader2 } from 'lucide-react';

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'server'
  
  // Database Audit Logs States
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtering States (Audit Logs)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  // Pagination States (Audit Logs)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const navigate = useNavigate();

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const logsData = await adminService.getAuditLogs();
      setLogs(logsData);
    } catch (err) {
      if (err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      } else {
        setError('Falha ao buscar logs de auditoria do sistema.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Extract unique action types and entity types for filtering dropdowns (Audit Logs)
  const actionTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.action));
    return ['ALL', ...Array.from(types)];
  }, [logs]);

  const entityTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.entity_type));
    return ['ALL', ...Array.from(types)];
  }, [logs]);

  // Filter logs based on search and dropdown parameters (Audit Logs)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchText = 
        (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchEntity = selectedEntity === 'ALL' || log.entity_type === selectedEntity;

      return matchText && matchAction && matchEntity;
    });
  }, [logs, searchTerm, selectedAction, selectedEntity]);

  // Reset page when filters change (Audit Logs)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAction, selectedEntity]);

  // Paginated logs (Audit Logs)
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const formatTimestamp = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR');
    } catch (e) {
      return isoString;
    }
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATE_USER':
      case 'LOGIN_SUCCESS':
      case 'UPLOAD_MEDIA':
        return 'bg-green-500/10 border border-green-500/20 text-green-400';
      case 'DELETE_USER':
      case 'LOGIN_FAILED':
      case 'DELETE_MEDIA':
        return 'bg-red-500/10 border border-red-500/20 text-red-400';
      case 'UPDATE_USER':
      case 'UPDATE_MEDIA':
      case 'UPDATE_SETTING':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
      default:
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-400';
    }
  };

  // Server Logs States
  const [serverLogs, setServerLogs] = useState([]);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverLevel, setServerLevel] = useState('ALL');
  const [serverSearch, setServerSearch] = useState('');
  const [serverLimit, setServerLimit] = useState(200);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleRef = useRef(null);

  const fetchServerLogs = useCallback(async (silent = false) => {
    if (!silent) setServerLoading(true);
    setServerError('');
    try {
      const logsData = await adminService.getServerLogs({
        limit: serverLimit,
        level: serverLevel === 'ALL' ? undefined : serverLevel,
        search: serverSearch || undefined
      });
      setServerLogs(logsData);
    } catch (err) {
      if (err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      } else {
        setServerError('Falha ao buscar logs do servidor.');
      }
    } finally {
      if (!silent) setServerLoading(false);
    }
  }, [serverLimit, serverLevel, serverSearch, navigate]);

  // Fetch server logs when active tab or parameters change
  useEffect(() => {
    if (activeTab === 'server') {
      fetchServerLogs(false);
    }
  }, [activeTab, fetchServerLogs]);

  // Auto refresh logic
  useEffect(() => {
    if (activeTab !== 'server' || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchServerLogs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, autoRefresh, fetchServerLogs]);

  // Scroll to bottom logic
  useEffect(() => {
    if (activeTab === 'server' && autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [serverLogs, activeTab, autoScroll]);

  const [clearingLogs, setClearingLogs] = useState(false);
  const [downloadingLogs, setDownloadingLogs] = useState(false);

  const handleClearServerLogs = async () => {
    if (clearingLogs) return;
    if (!window.confirm('Tem certeza de que deseja apagar todos os logs do servidor? Essa ação não pode ser desfeita.')) {
      return;
    }
    setClearingLogs(true);
    try {
      await adminService.clearServerLogs();
      setServerLogs([]);
      alert('Logs apagados com sucesso!');
    } catch (err) {
      alert('Falha ao apagar logs do servidor.');
    } finally {
      setClearingLogs(false);
    }
  };

  const handleDownloadServerLogs = async () => {
    if (downloadingLogs) return;
    setDownloadingLogs(true);
    try {
      const blobData = await adminService.downloadServerLogs();
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'backend.log');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Falha ao baixar arquivo de logs.');
    } finally {
      setDownloadingLogs(false);
    }
  };

  const handleCopyServerLogs = () => {
    if (serverLogs.length === 0) return;
    navigator.clipboard.writeText(serverLogs.join('\n'));
    alert('Logs copiados para a área de transferência!');
  };

  const formatLogLine = (line) => {
    const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+-\s+(.*)$/);
    if (match) {
      const [, timestamp, level, source, message] = match;
      let levelClass = 'text-blue-400 font-bold';
      if (level === 'ERROR') levelClass = 'text-red-500 font-bold animate-pulse';
      if (level === 'WARNING') levelClass = 'text-amber-500 font-bold';
      if (level === 'DEBUG') levelClass = 'text-zinc-500 font-bold';
      
      return (
        <div className="py-0.5 border-b border-zinc-900/60 hover:bg-zinc-900/40 flex flex-wrap gap-x-2 items-start font-mono text-[11px] leading-4">
          <span className="text-zinc-500 select-none">[{timestamp}]</span>
          <span className={`${levelClass} select-none`}>[{level}]</span>
          <span className="text-purple-400 select-none">[{source}]</span>
          <span className="text-zinc-250 break-all">{message}</span>
        </div>
      );
    }
    
    let textColor = 'text-zinc-300';
    if (line.toLowerCase().includes('traceback') || line.startsWith('  File "') || line.includes('error:')) {
      textColor = 'text-red-400 font-semibold';
    }
    return <div className={`py-0.5 whitespace-pre-wrap font-mono text-[11px] leading-4 ${textColor}`}>{line}</div>;
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header onLogout={handleLogout} />

        <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-700 pb-px gap-4">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              📊 Auditoria de Eventos
            </button>
            <button
              onClick={() => setActiveTab('server')}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'server'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              📝 Logs do Servidor (Console)
            </button>
          </div>

          {activeTab === 'audit' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                  Auditoria de Eventos
                </h2>

                <button
                  onClick={() => fetchLogs(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 border border-zinc-650 rounded-lg text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por usuário, detalhes, IP..."
                    className="w-full bg-zinc-800 border border-zinc-750 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Action Select */}
                <div>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-750 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todas as Ações</option>
                    {actionTypes.filter(act => act !== 'ALL').map(act => (
                      <option key={act} value={act}>{act}</option>
                    ))}
                  </select>
                </div>

                {/* Entity Select */}
                <div>
                  <select
                    value={selectedEntity}
                    onChange={(e) => setSelectedEntity(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-750 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todas as Entidades</option>
                    {entityTypes.filter(ent => ent !== 'ALL').map(ent => (
                      <option key={ent} value={ent}>{ent}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-900/50">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-800 text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Ação</th>
                      <th className="px-6 py-4">Entidade</th>
                      <th className="px-6 py-4">IP</th>
                      <th className="px-6 py-4">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-sm">
                    {paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/20">
                        <td className="px-6 py-4 text-zinc-300 font-mono text-xs whitespace-nowrap flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-200">
                          {log.username || <span className="text-zinc-500 italic">sistema</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {log.entity_type}{log.entity_id ? ` (#${log.entity_id})` : ''}
                        </td>
                        <td className="px-6 py-4 text-zinc-450 font-mono text-xs">
                          {log.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 text-zinc-300 font-medium">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                          {loading ? 'Carregando registros...' : 'Nenhum registro encontrado para os filtros selecionados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-zinc-400">
                    Página <span className="font-bold text-zinc-200">{currentPage}</span> de <span className="font-bold text-zinc-200">{totalPages}</span> ({filteredLogs.length} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  Logs do Servidor (Tempo Real)
                </h2>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyServerLogs}
                    disabled={serverLogs.length === 0 || clearingLogs || downloadingLogs}
                    className="px-3 py-2 bg-zinc-700 hover:bg-zinc-650 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Copiar para a área de transferência"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </button>
                  <button
                    onClick={handleDownloadServerLogs}
                    disabled={serverLogs.length === 0 || clearingLogs || downloadingLogs}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {downloadingLogs ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Baixando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Baixar Completo</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClearServerLogs}
                    disabled={clearingLogs || downloadingLogs}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {clearingLogs ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Limpando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Limpar Logs</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fetchServerLogs(false)}
                    disabled={serverLoading || clearingLogs || downloadingLogs}
                    className="px-3 py-2 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 border border-zinc-650 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-blue-400 ${serverLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>
              </div>

              {serverError && (
                <div className="p-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {serverError}
                </div>
              )}

              {/* Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                {/* Search */}
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
                  <input
                    type="text"
                    value={serverSearch}
                    onChange={(e) => setServerSearch(e.target.value)}
                    placeholder="Buscar nos logs do servidor..."
                    className="w-full bg-zinc-800 border border-zinc-750 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Level Selector */}
                <div>
                  <select
                    value={serverLevel}
                    onChange={(e) => setServerLevel(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-750 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todos os Níveis</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                </div>

                {/* Limit Selector */}
                <div>
                  <select
                    value={serverLimit}
                    onChange={(e) => setServerLimit(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-750 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="100">Últimas 100 linhas</option>
                    <option value="200">Últimas 200 linhas</option>
                    <option value="500">Últimas 500 linhas</option>
                    <option value="1000">Últimas 1000 linhas</option>
                  </select>
                </div>
              </div>

              {/* Console window */}
              <div className="relative">
                <div
                  ref={consoleRef}
                  className="bg-black/90 text-zinc-300 font-mono text-xs p-4 rounded-xl border border-zinc-850 h-[500px] overflow-y-auto space-y-1 leading-relaxed select-text"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {serverLogs.map((line, idx) => (
                    <div key={idx}>{formatLogLine(line)}</div>
                  ))}
                  {serverLogs.length === 0 && (
                    <div className="text-zinc-600 italic py-12 text-center select-none font-mono">
                      {serverLoading ? 'Carregando logs...' : 'Nenhum log encontrado para os critérios selecionados.'}
                    </div>
                  )}
                </div>
                
                {/* Floating controls inside console */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-1.5 rounded-lg shadow-lg">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer px-2 select-none">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    Auto-refresh (5s)
                  </label>
                  <div className="w-px h-4 bg-zinc-800"></div>
                  <button
                    type="button"
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`p-1 rounded hover:bg-zinc-800 transition cursor-pointer ${autoScroll ? 'text-emerald-400' : 'text-zinc-500'}`}
                    title={autoScroll ? 'Auto-scroll ativado' : 'Auto-scroll desativado'}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
