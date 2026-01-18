"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { salesService, SalesFilter } from "@/services/sales.service";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "Todos os Status" },
  { value: "1", label: "Aguardando Pagamento" },
  { value: "2", label: "Pagamento Aprovado" },
  { value: "3", label: "Cancelada" },
  { value: "4", label: "Chargeback" },
  { value: "5", label: "Devolvida" },
  { value: "6", label: "Em Analise" },
  { value: "7", label: "Estorno Pendente" },
  { value: "8", label: "Em Processamento" },
];

const STATUS_COLORS: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-800",
  2: "bg-green-100 text-green-800",
  3: "bg-red-100 text-red-800",
  4: "bg-red-100 text-red-800",
  5: "bg-orange-100 text-orange-800",
  6: "bg-blue-100 text-blue-800",
  7: "bg-purple-100 text-purple-800",
  8: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<number, string> = {
  1: "Aguardando",
  2: "Aprovado",
  3: "Cancelada",
  4: "Chargeback",
  5: "Devolvida",
  6: "Em Analise",
  7: "Estorno",
  8: "Processando",
};

const PAYMENT_LABELS: Record<number, string> = {
  1: "Boleto",
  2: "Cartao",
  3: "PIX",
  4: "After Pay",
};

export default function VendasPage() {
  const [filters, setFilters] = useState<SalesFilter>({
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sales", filters],
    queryFn: () => salesService.list(filters),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search, page: 1 });
  };

  const handleFilterChange = (key: keyof SalesFilter, value: string) => {
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
            Vendas
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie todas as suas vendas
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <Download className="h-4 w-4" />
          Exportar
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

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
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.data && data.data.length > 0 ? (
                    data.data.map((sale) => (
                      <tr
                        key={sale.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.productName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.transKey}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {sale.clientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.clientEmail}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(sale.transTotalValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                          {PAYMENT_LABELS[sale.paymentType] || "N/A"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              STATUS_COLORS[sale.transStatusCode] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {STATUS_LABELS[sale.transStatusCode] || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {formatDateTime(sale.transCreateDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Nenhuma venda encontrada
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
