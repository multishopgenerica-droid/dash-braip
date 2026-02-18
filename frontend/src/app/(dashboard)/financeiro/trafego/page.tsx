'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialService,
  formatCurrency,
  TrafficSpend,
  TrafficPlatform,
  TRAFFIC_PLATFORM_LABELS,
} from '@/services/financial.service';
import { Plus, Pencil, Trash2, X, TrendingUp, Target, MousePointer, Eye } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = Object.keys(TRAFFIC_PLATFORM_LABELS) as TrafficPlatform[];

const formatDateSafe = (isoDate: string) => {
  const [y, m, d] = isoDate.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

function TrafficModal({
  traffic,
  onClose,
  onSave,
}: {
  traffic?: TrafficSpend | null;
  onClose: () => void;
  onSave: (data: Partial<TrafficSpend>) => void;
}) {
  const [formData, setFormData] = useState({
    platform: traffic?.platform || 'META_ADS',
    campaignName: traffic?.campaignName || '',
    date: traffic?.date ? traffic.date.split('T')[0] : new Date().toISOString().split('T')[0],
    spend: traffic?.spend ? traffic.spend / 100 : 0,
    impressions: traffic?.impressions || 0,
    clicks: traffic?.clicks || 0,
    conversions: traffic?.conversions || 0,
    revenue: traffic?.revenue ? traffic.revenue / 100 : 0,
    notes: traffic?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date) {
      toast.error('Data é obrigatória');
      return;
    }

    onSave({
      ...formData,
      spend: Math.round(formData.spend * 100),
      revenue: Math.round(formData.revenue * 100),
      date: new Date(formData.date + 'T12:00:00').toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {traffic ? 'Editar Gasto de Tráfego' : 'Novo Gasto de Tráfego'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Plataforma *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as TrafficPlatform })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {TRAFFIC_PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Data *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nome da Campanha</label>
            <input
              type="text"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              placeholder="Ex: Black Friday 2024"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Gasto (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.spend}
                onChange={(e) => setFormData({ ...formData, spend: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Receita (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Impressões</label>
              <input
                type="number"
                min="0"
                value={formData.impressions}
                onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Cliques</label>
              <input
                type="number"
                min="0"
                value={formData.clicks}
                onChange={(e) => setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Conversões</label>
              <input
                type="number"
                min="0"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TrafegoPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTraffic, setSelectedTraffic] = useState<TrafficSpend | null>(null);
  const [filters, setFilters] = useState({
    platform: '',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['traffic', filters],
    queryFn: () =>
      financialService.listTraffic({
        ...filters,
        platform: filters.platform || undefined,
      } as Record<string, string | number>),
  });

  const { data: platformData } = useQuery({
    queryKey: ['traffic-platforms'],
    queryFn: () => financialService.getTrafficByPlatform(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<TrafficSpend>) => financialService.createTraffic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic'] });
      queryClient.invalidateQueries({ queryKey: ['traffic-platforms'] });
      toast.success('Gasto de tráfego criado com sucesso!');
      setShowModal(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao criar gasto de tráfego';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TrafficSpend> }) =>
      financialService.updateTraffic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic'] });
      queryClient.invalidateQueries({ queryKey: ['traffic-platforms'] });
      toast.success('Gasto de tráfego atualizado com sucesso!');
      setShowModal(false);
      setSelectedTraffic(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const message = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Erro ao atualizar gasto de tráfego';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialService.deleteTraffic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traffic'] });
      queryClient.invalidateQueries({ queryKey: ['traffic-platforms'] });
      toast.success('Gasto de tráfego excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir gasto de tráfego'),
  });

  const handleSave = (formData: Partial<TrafficSpend>) => {
    if (selectedTraffic) {
      updateMutation.mutate({ id: selectedTraffic.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (traffic: TrafficSpend) => {
    setSelectedTraffic(traffic);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este gasto de tráfego?')) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate totals from filtered table data (respects platform filter)
  const totalSpend = data?.data?.reduce((sum: number, t: TrafficSpend) => sum + t.spend, 0) || 0;
  const totalRevenue = data?.data?.reduce((sum: number, t: TrafficSpend) => sum + t.revenue, 0) || 0;
  const totalConversions = data?.data?.reduce((sum: number, t: TrafficSpend) => sum + t.conversions, 0) || 0;
  const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tráfego</h1>
          <p className="text-zinc-400">Gerencie seus gastos com anúncios</p>
        </div>
        <button
          onClick={() => {
            setSelectedTraffic(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition"
        >
          <Plus className="h-4 w-4" />
          Novo Gasto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-900/50 p-2">
              <Target className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Gasto Total</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalSpend)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-900/50 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Receita</p>
              <p className="text-xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-900/50 p-2">
              <MousePointer className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Conversões</p>
              <p className="text-xl font-bold text-white">{totalConversions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-900/50 p-2">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">ROAS</p>
              <p className="text-xl font-bold text-white">{overallRoas}x</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {platformData && platformData.length > 0 && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Por Plataforma</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformData.map((platform) => (
              <div
                key={platform.platform}
                className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4"
              >
                <p className="text-sm text-zinc-400">
                  {TRAFFIC_PLATFORM_LABELS[platform.platform as TrafficPlatform] || platform.platform}
                </p>
                <p className="text-lg font-bold text-white mt-1">
                  {formatCurrency(platform.spend)}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">ROAS: {platform.roas}x</span>
                  <span className="text-emerald-400">{platform.conversions} conv.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filters.platform}
          onChange={(e) => setFilters({ ...filters, platform: e.target.value, page: 1 })}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Todas as Plataformas</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {TRAFFIC_PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Plataforma</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Campanha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Gasto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Métricas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">ROAS</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                  Carregando...
                </td>
              </tr>
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                  Nenhum gasto de tráfego encontrado
                </td>
              </tr>
            ) : (
              data?.data.map((traffic) => {
                const roas = traffic.spend > 0 ? (traffic.revenue / traffic.spend).toFixed(2) : '0.00';
                return (
                  <tr key={traffic.id} className="hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-white">
                      {formatDateSafe(traffic.date as string)}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {TRAFFIC_PLATFORM_LABELS[traffic.platform]}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{traffic.campaignName || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {formatCurrency(traffic.spend)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-zinc-400" title="Impressões">
                          <Eye className="h-3 w-3 inline mr-1" />
                          {traffic.impressions.toLocaleString()}
                        </span>
                        <span className="text-zinc-400" title="Cliques">
                          <MousePointer className="h-3 w-3 inline mr-1" />
                          {traffic.clicks.toLocaleString()}
                        </span>
                        <span className="text-emerald-400" title="Conversões">
                          {traffic.conversions}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          parseFloat(roas) >= 1 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {roas}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(traffic)}
                          className="p-2 text-zinc-400 hover:text-white transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(traffic.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(data.pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setFilters({ ...filters, page: i + 1 })}
              className={`px-3 py-1 rounded ${
                filters.page === i + 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <TrafficModal
          traffic={selectedTraffic}
          onClose={() => {
            setShowModal(false);
            setSelectedTraffic(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
