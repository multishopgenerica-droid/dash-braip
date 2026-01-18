"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Download, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { abandonsService, AbandonsFilter } from "@/services/abandons.service";
import { formatDateTime } from "@/lib/utils";

export default function AbandonosPage() {
  const [filters, setFilters] = useState<AbandonsFilter>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["abandons", filters],
    queryFn: () => abandonsService.list(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ["abandons-stats"],
    queryFn: () => abandonsService.getStats(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search, page: 1 });
  };

  const handleFilterChange = (key: keyof AbandonsFilter, value: string) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Carrinhos Abandonados
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Recupere vendas perdidas
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Abandonos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {(stats as { total?: number })?.total || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hoje</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {(stats as { today?: number })?.today || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Esta Semana</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {(stats as { thisWeek?: number })?.thisWeek || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Itens por pagina
              </label>
              <select
                value={filters.limit || 20}
                onChange={(e) => handleFilterChange("limit", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((abandon) => (
                      <tr
                        key={abandon.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {abandon.productName}
                          </div>
                          {abandon.planName && (
                            <div className="text-sm text-gray-500">
                              {abandon.planName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                          {abandon.clientName || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {abandon.clientEmail || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {abandon.clientPhone || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatDateTime(abandon.transCreateDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhum abandono encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando{" "}
                  {(data.pagination.page - 1) * data.pagination.limit + 1} a{" "}
                  {Math.min(
                    data.pagination.page * data.pagination.limit,
                    data.pagination.total
                  )}{" "}
                  de {data.pagination.total} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={!data.pagination.hasPrevious}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="flex items-center px-3 text-sm">
                    Pagina {data.pagination.page} de {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={!data.pagination.hasNext}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
