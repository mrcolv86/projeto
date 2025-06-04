
import React, { useState, useEffect } from "react";
import { Invoice, Order, Product, Table, SystemSettings } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar as CalendarIcon, // Renomeado para evitar conflito com a entidade Calendar
  Download,
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  Filter,
  Search,
  ExternalLink,
  Eye
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import InvoiceDetailModal from "../components/reports/InvoiceDetailModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({ from: null, to: null }); // Novo estado para range personalizado
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, ordersData, tablesData, settingsData] = await Promise.all([
        Invoice.list("-created_date"),
        Order.list("-created_date"),
        Table.list(),
        SystemSettings.list()
      ]);
      setInvoices(invoicesData);
      setOrders(ordersData);
      setTables(tablesData);
      if (settingsData.length > 0) {
        setSystemSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "week":
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) }; // Corrigido para 7 dias incluindo hoje
      case "month":
        return { start: startOfMonth(now), end: endOfDay(now) }; // Corrigido para do início do mês até hoje
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          return {
            start: startOfDay(customDateRange.from),
            end: endOfDay(customDateRange.to)
          };
        }
        // Se custom mas sem datas, retorna nulo para não filtrar ou um default
        return { start: null, end: null };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const { start, end } = getDateRange();
    if (!start || !end) return true; // Não filtra se o range customizado não estiver completo

    const invoiceDate = new Date(invoice.created_date);
    const dateMatch = invoiceDate >= start && invoiceDate <= end;
    const paymentMatch = paymentMethod === "all" || invoice.payment_method === paymentMethod;
    const searchMatch = searchTerm === "" ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());

    return dateMatch && paymentMatch && searchMatch;
  });

  const calculateStats = () => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
    const totalServiceFee = filteredInvoices.reduce((sum, inv) => sum + (inv.service_fee || 0), 0);
    const paidInvoices = filteredInvoices.filter(inv => inv.payment_status === "pago");

    return {
      totalInvoices: filteredInvoices.length,
      totalRevenue,
      totalTax,
      totalServiceFee,
      paidInvoices: paidInvoices.length,
      pendingRevenue: filteredInvoices
        .filter(inv => inv.payment_status === "pendente")
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    };
  };

  const getTableNumberFromInvoice = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table?.number || "N/A";
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const businessInfoForModal = systemSettings ? {
    name: systemSettings.business_name,
    logo: systemSettings.logo_url
  } : null;

  const stats = calculateStats();

  // Funções de Tradução para Filtros
  const translatePaymentMethod = (value) => {
    switch (value) {
      case "all": return "Todos";
      case "dinheiro": return "Dinheiro";
      case "cartao_credito": return "Cartão Crédito";
      case "cartao_debito": return "Cartão Débito";
      case "pix": return "PIX";
      default: return value;
    }
  };

  const getDisplayDateRangeString = () => {
    if (dateRange === "custom") {
      if (customDateRange.from && customDateRange.to) {
        return `${format(customDateRange.from, "dd/MM/yy", { locale: ptBR })} - ${format(customDateRange.to, "dd/MM/yy", { locale: ptBR })}`;
      }
      return "Personalizado";
    }
    // Para as opções pré-definidas, mantemos a tradução
    switch (dateRange) {
      case "today": return "Hoje";
      case "yesterday": return "Ontem";
      case "week": return "Última Semana";
      case "month": return "Este Mês";
      default: return dateRange;
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { start: currentRangeStart, end: currentRangeEnd } = getDateRange();
  const displayDateRangeString = getDisplayDateRangeString();

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-indigo-50/30 via-blue-50/20 to-cyan-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Relatórios Fiscais
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Controle financeiro e relatórios de vendas
            </p>
          </div>
          <Link
            to={createPageUrl(`FiscalReportPrintPage?startDate=${currentRangeStart?.toISOString() || ''}&endDate=${currentRangeEnd?.toISOString() || ''}&displayDateRange=${encodeURIComponent(displayDateRangeString)}&paymentMethod=${translatePaymentMethod(paymentMethod)}&searchTerm=${searchTerm}`)}
            target="_blank"
            className={`${(!currentRangeStart || !currentRangeEnd) && dateRange === "custom" ? "pointer-events-none opacity-50" : ""}`}
          >
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              disabled={(!currentRangeStart || !currentRangeEnd) && dateRange === "custom"}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório PDF
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-[280px] justify-start text-left font-normal ${
                        !customDateRange.from && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "dd/MM/yy", { locale: ptBR })} - {format(customDateRange.to, "dd/MM/yy", { locale: ptBR })}
                          </>
                        ) : (
                          format(customDateRange.from, "dd/MM/yy", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione o intervalo</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from || new Date()}
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <div className="flex items-center gap-2">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por cliente ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total de Invoices",
              value: stats.totalInvoices,
              subtitle: "Período selecionado",
              icon: FileText,
              gradient: "from-indigo-500 to-indigo-600",
              bgGradient: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20"
            },
            {
              title: "Faturamento",
              value: `R$ ${stats.totalRevenue.toFixed(2)}`,
              subtitle: "Receita total",
              icon: DollarSign,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
            },
            {
              title: "Impostos",
              value: `R$ ${stats.totalTax.toFixed(2)}`,
              subtitle: "Total de impostos",
              icon: Receipt,
              gradient: "from-orange-500 to-orange-600",
              bgGradient: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
            },
            {
              title: "Taxa de Serviço",
              value: `R$ ${stats.totalServiceFee.toFixed(2)}`,
              subtitle: "10% sobre vendas",
              icon: TrendingUp,
              gradient: "from-blue-500 to-blue-600",
              bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            }
          ].map((stat, index) => (
            <Card
              key={stat.title}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stat.value}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invoices Table */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              Invoices Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Invoice</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Mesa</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Pagamento</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice, index) => (
                    <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200">
                          #{invoice.invoice_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Mesa {getTableNumberFromInvoice(invoice.table_id)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300">
                          {invoice.customer_name || "Cliente Anônimo"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-lg text-green-600 dark:text-green-400">
                          R$ {invoice.total_amount?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {invoice.payment_method?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          invoice.payment_status === "pago"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : invoice.payment_status === "pendente"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }>
                          {invoice.payment_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(invoice.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredInvoices.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-400 opacity-50" />
                  <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">
                    Nenhum invoice encontrado
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Ajuste os filtros ou aguarde novos fechamentos de mesa
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          invoice={selectedInvoice}
          businessInfo={businessInfoForModal}
        />
      )}
    </div>
  );
}
