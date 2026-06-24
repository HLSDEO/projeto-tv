import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import authService from '../services/authService';
import Header from '../components/Header';
import { RefreshCw, Search, Calendar, ShieldAlert } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  // Pagination States
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

  // Extract unique action types and entity types for filtering dropdowns
  const actionTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.action));
    return ['ALL', ...Array.from(types)];
  }, [logs]);

  const entityTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.entity_type));
    return ['ALL', ...Array.from(types)];
  }, [logs]);

  // Filter logs based on search and dropdown parameters
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAction, selectedEntity]);

  // Paginated logs
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

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header onLogout={handleLogout} />

        <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              Auditoria de Eventos
            </h2>

            <button
              onClick={() => fetchLogs(false)}
              disabled={loading}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 border border-zinc-650 rounded-lg text-sm font-semibold transition flex items-center gap-2"
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
                      {log.username || <span className="text-zinc-550 italic">sistema</span>}
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
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-xs font-semibold transition"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-650 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-xs font-semibold transition"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
