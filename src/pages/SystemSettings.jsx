
import React, { useState, useEffect } from "react";
import { SystemSettings, User, Order, Invoice, Table } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle }
from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  Building2, 
  Palette, 
  Link as LinkIcon,
  Image,
  Phone,
  Mail,
  MapPin,
  Globe,
  RotateCcw,
  CheckCircle,
  UploadCloud,
  Database,
  Download,
  Trash2,
  CalendarDays,
  AlertTriangle,
  ShoppingCart,
  Calculator
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadFile } from "@/api/integrations"; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // State for Data Management - changed to date range
  const [selectedDateRange, setSelectedDateRange] = useState({
    from: new Date(),
    to: new Date()
  });
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [showDeleteOrdersDialog, setShowDeleteOrdersDialog] = useState(false);
  const [deleteOrdersConfirmationText, setDeleteOrdersConfirmationText] = useState("");
  const [showClearInvoicesDialog, setShowClearInvoicesDialog] = useState(false);
  const [clearInvoicesConfirmationText, setClearInvoicesConfirmationText] = useState("");
  const [tables, setTables] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, settingsData, tablesData] = await Promise.all([
        User.me(),
        SystemSettings.list(),
        Table.list()
      ]);
      
      setUser(userData);
      setTables(tablesData);
      
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      } else {
        // Create default settings
        const defaultSettings = {
          business_name: "BierServ",
          business_subtitle: "Cervejaria Digital",
          logo_url: "",
          primary_color: "amber",
          menu_url: window.location.origin,
          contact_info: {},
          features: {
            show_prices_public: true,
            allow_online_orders: false,
            require_table_selection: true
          },
          tax_settings: {
            tax_percentage: 5.0,
            service_fee_percentage: 10.0
          }
        };
        const created = await SystemSettings.create(defaultSettings);
        setSettings(created);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let updatedSettings = { ...settings };

    if (logoFile) {
      setIsUploadingLogo(true);
      try {
        const { file_url } = await UploadFile({ file: logoFile });
        updatedSettings.logo_url = file_url;
        setLogoFile(null);
      } catch (error) {
        console.error("Error uploading logo:", error);
        alert("Falha ao fazer upload do logo. As outras configurações serão salvas.");
      }
      setIsUploadingLogo(false);
    }

    try {
      await SystemSettings.update(updatedSettings.id, updatedSettings);
      setSettings(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateContactInfo = (field, value) => {
    setSettings(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }));
  };

  const updateFeatures = (field, value) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: value
      }
    }));
  };

  // Helper function to create PDF content
  const generateOrdersPDF = (ordersData, dateRange) => {
    const businessName = settings?.business_name || "BierServ";
    const businessSubtitle = settings?.business_subtitle || "Cervejaria Digital";
    
    const getTableNumber = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        return table?.number || tableId;
    };

    const totalOrders = ordersData.length;
    const totalAmount = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const averageTicket = totalOrders > 0 ? (totalAmount / totalOrders) : 0;
    const totalItemsSold = ordersData.reduce((sum, order) => sum + (order.items?.length || 0), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Pedidos</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #1e293b;
              font-size: 14px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .business-name {
              font-size: 28px;
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 8px;
            }
            .business-subtitle {
              font-size: 16px;
              color: #64748b;
              margin-bottom: 20px;
            }
            .report-title {
              font-size: 22px;
              font-weight: bold;
              color: #1e293b;
            }
            .date-range {
              font-size: 16px;
              color: #475569;
              margin-top: 8px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 20px;
              margin: 30px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
            }
            .orders-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .orders-table th {
              background: #1e293b;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 12px;
              text-transform: uppercase;
            }
            .orders-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 12px;
            }
            .orders-table tr:nth-child(even) {
              background: #f8fafc;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pendente { background: #fef3c7; color: #92400e; }
            .status-preparando { background: #dbeafe; color: #1e40af; }
            .status-pronto { background: #d1fae5; color: #047857; }
            .status-entregue { background: #f3f4f6; color: #374151; }
            .status-cancelado { background: #fee2e2; color: #dc2626; }
            .total-row {
              background: #1e293b !important;
              color: white;
              font-weight: bold;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="business-name">${businessName}</div>
            <div class="business-subtitle">${businessSubtitle}</div>
            <div class="report-title">Relatório de Pedidos</div>
            <div class="date-range">
              ${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total de Pedidos</div>
              <div class="summary-value">${totalOrders}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Valor Total</div>
              <div class="summary-value">R$ ${totalAmount.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Ticket Médio</div>
              <div class="summary-value">R$ ${averageTicket.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Itens Vendidos</div>
              <div class="summary-value">${totalItemsSold}</div>
            </div>
          </div>
          
          <table class="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mesa</th>
                <th>Data/Hora</th>
                <th>Status</th>
                <th>Itens</th>
                <th style="text-align: right;">Total</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${ordersData.map(order => `
                <tr>
                  <td>${order.id.slice(-8)}</td>
                  <td>${getTableNumber(order.table_id)}</td>
                  <td>${format(new Date(order.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                  <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                  <td>${order.items?.length || 0}</td>
                  <td style="text-align: right; font-weight: bold;">R$ ${(order.total_amount || 0).toFixed(2)}</td>
                  <td>${(order.customer_notes || '-').length > 50 ? (order.customer_notes.substring(0, 47) + '...') : (order.customer_notes || '-')}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5"><strong>TOTAL GERAL</strong></td>
                <td style="text-align: right;"><strong>R$ ${totalAmount.toFixed(2)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 12px;">
            Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Sistema BierServ
          </div>
        </body>
      </html>
    `;
    
    return htmlContent;
  };

  // Updated export function for PDF
  const handleExportOrders = async () => {
    if (!selectedDateRange.from || !selectedDateRange.to) {
      alert("Por favor, selecione um período válido para exportar.");
      return;
    }
    
    setDataActionLoading(true);
    try {
      const startDate = startOfDay(selectedDateRange.from);
      const endDate = endOfDay(selectedDateRange.to);
      
      console.log("Exportando pedidos para período:", {
        from: format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR }),
        to: format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR }),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      let ordersToExport = [];
      
      try {
        console.log("Tentativa 1: Filtrando via API...");
        ordersToExport = await Order.filter({
          created_date_gte: startDate.toISOString(),
          created_date_lte: endDate.toISOString(),
        }, "-created_date");
        console.log(`Tentativa 1: ${ordersToExport.length} pedidos encontrados via API.`);
      } catch (apiFilterError) {
        console.warn("Tentativa 1: Erro ao filtrar via API. Tentando fallback.", apiFilterError);
        ordersToExport = [];
      }
      
      // Fallback: if API filter doesn't return results or fails, try fetching all and filtering client-side
      if (ordersToExport.length === 0) {
        console.log("Tentativa 2: API não retornou pedidos. Buscando lista geral e filtrando no cliente...");
        const allOrders = await Order.list("-created_date", 500);
        console.log(`Tentativa 2: ${allOrders.length} pedidos totais recebidos para filtro manual.`);
        ordersToExport = allOrders.filter(order => {
          const orderDate = new Date(order.created_date);
          return orderDate >= startDate && orderDate <= endDate;
        });
        console.log(`Tentativa 2: ${ordersToExport.length} pedidos encontrados após filtro manual.`);
      }

      if (ordersToExport.length === 0) {
        alert(`Nenhum pedido encontrado para o período de ${format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })} a ${format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR })}.`);
        setDataActionLoading(false);
        return;
      }

      // Generate PDF
      const htmlContent = generateOrdersPDF(ordersToExport, selectedDateRange);
      
      // Create and download PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto print/save as PDF
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      alert(`Relatório PDF gerado com ${ordersToExport.length} pedidos para o período de ${format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })} a ${format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR })}!`);
    } catch (error) {
      console.error("Erro ao exportar pedidos:", error);
      alert(`Falha ao exportar pedidos: ${error.message}`);
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleDeleteOrdersConfirmed = async () => {
    if (deleteOrdersConfirmationText !== "EXCLUIR") {
      alert("Texto de confirmação incorreto.");
      return;
    }
    if (!selectedDateRange.from || !selectedDateRange.to) {
      alert("O período selecionado é inválido. Operação cancelada.");
      setDataActionLoading(false);
      setShowDeleteOrdersDialog(false);
      setDeleteOrdersConfirmationText("");
      return;
    }
    
    setDataActionLoading(true);
    setShowDeleteOrdersDialog(false);
    try {
      const startDate = startOfDay(selectedDateRange.from);
      const endDate = endOfDay(selectedDateRange.to);

      console.log("Excluindo pedidos para período:", {
        from: format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR }),
        to: format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR }),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      let ordersToDelete = [];
      
      try {
        console.log("Tentativa 1 (exclusão): Filtrando via API...");
        ordersToDelete = await Order.filter({
          created_date_gte: startDate.toISOString(),
          created_date_lte: endDate.toISOString(),
        });
        console.log(`Tentativa 1 (exclusão): ${ordersToDelete.length} pedidos encontrados via API para excluir.`);
      } catch (apiFilterError) {
        console.warn("Tentativa 1 (exclusão): Erro ao filtrar via API. Tentando fallback.", apiFilterError);
        ordersToDelete = [];
      }

      // Fallback: if API filter doesn't return results or fails, try fetching all and filtering client-side
      if (ordersToDelete.length === 0) {
        console.log("Tentativa 2 (exclusão): API não retornou pedidos. Buscando lista geral e filtrando no cliente...");
        const allOrders = await Order.list("-created_date", 500);
        console.log(`Tentativa 2 (exclusão): ${allOrders.length} pedidos totais recebidos para filtro manual.`);
        ordersToDelete = allOrders.filter(order => {
          const orderDate = new Date(order.created_date);
          return orderDate >= startDate && orderDate <= endDate;
        });
        console.log(`Tentativa 2 (exclusão): ${ordersToDelete.length} pedidos encontrados após filtro manual para excluir.`);
      }

      if (ordersToDelete.length === 0) {
        alert(`Nenhum pedido encontrado para excluir no período de ${format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })} a ${format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR })}.`);
        setDataActionLoading(false);
        setDeleteOrdersConfirmationText("");
        return;
      }

      let deletedCount = 0;
      for (const order of ordersToDelete) {
        await Order.delete(order.id);
        deletedCount++;
      }
      
      alert(`${deletedCount} pedidos do período de ${format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })} a ${format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR })} foram excluídos com sucesso.`);
    } catch (error) {
      console.error("Erro ao excluir pedidos:", error);
      alert(`Falha ao excluir pedidos: ${error.message}`);
    } finally {
      setDataActionLoading(false);
      setDeleteOrdersConfirmationText("");
    }
  };
  
  const handleClearInvoicesConfirmed = async () => {
    if (clearInvoicesConfirmationText !== "LIMPAR TUDO") {
        alert("Texto de confirmação incorreto.");
        return;
    }
    setDataActionLoading(true);
    setShowClearInvoicesDialog(false);
    try {
        const allInvoices = await Invoice.list();
        if (allInvoices.length === 0) {
            alert("Nenhum invoice encontrado para limpar.");
            setDataActionLoading(false);
            setClearInvoicesConfirmationText("");
            return;
        }
        let clearedCount = 0;
        for (const invoice of allInvoices) {
            await Invoice.delete(invoice.id);
            clearedCount++;
        }
        alert(`${clearedCount} invoices foram limpos com sucesso.`);

    } catch (error) {
        console.error("Erro ao limpar invoices:", error);
        alert("Falha ao limpar invoices.");
    } finally {
        setDataActionLoading(false);
        setClearInvoicesConfirmationText("");
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-stone-50 to-zinc-50 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Configurações do Sistema
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Personalize a identidade e configurações do seu estabelecimento
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || isUploadingLogo || dataActionLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            {saving || isUploadingLogo ? (
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isUploadingLogo ? "Enviando logo..." : saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
          </Button>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="grid w-full grid-cols-responsive-tabs bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <TabsTrigger value="branding" className="rounded-lg">
              <Building2 className="w-4 h-4 mr-2" />
              Identidade Visual
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg">
              <Phone className="w-4 h-4 mr-2" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-lg">
              <Settings className="w-4 h-4 mr-2" />
              Funcionalidades
            </TabsTrigger>
            <TabsTrigger value="data_management" className="rounded-lg">
              <Database className="w-4 h-4 mr-2" />
              Gerenciamento de Dados
            </TabsTrigger>
          </TabsList>
          <style jsx>{`
            .grid-cols-responsive-tabs {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
          `}</style>

          <TabsContent value="branding" className="mt-6">
            <div className="grid gap-4">
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5" />
                    Identidade do Negócio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_name" className="text-sm font-medium">Nome do Estabelecimento</Label>
                      <Input
                        id="business_name"
                        value={settings.business_name || ""}
                        onChange={(e) => updateSettings({ business_name: e.target.value })}
                        placeholder="Nome do seu negócio"
                        className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="business_subtitle" className="text-sm font-medium">Slogan/Subtítulo</Label>
                      <Input
                        id="business_subtitle"
                        value={settings.business_subtitle || ""}
                        onChange={(e) => updateSettings({ business_subtitle: e.target.value })}
                        placeholder="Slogan ou descrição"
                        className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="logo_upload" className="text-sm font-medium">Logotipo</Label>
                    <div className="mt-1 flex items-center gap-4">
                      {settings.logo_url && (
                        <img src={settings.logo_url} alt="Logo Preview" className="w-16 h-16 rounded-md object-contain border p-1"/>
                      )}
                      <Input
                        id="logo_upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="block w-full text-sm text-slate-500 dark:text-slate-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-amber-50 file:text-amber-700
                          hover:file:bg-amber-100 dark:file:bg-amber-900/30 dark:file:text-amber-300 dark:hover:file:bg-amber-800/40"
                      />
                    </div>
                    {logoFile && (
                        <p className="text-xs text-slate-500 mt-1">Arquivo selecionado: {logoFile.name}. Será enviado ao salvar.</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="primary_color" className="text-sm font-medium">Cor Primária</Label>
                    <Select 
                      value={settings.primary_color || "amber"} 
                      onValueChange={(value) => updateSettings({ primary_color: value })}
                    >
                      <SelectTrigger className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="amber">Âmbar (Atual)</SelectItem>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="purple">Roxo</SelectItem>
                        <SelectItem value="red">Vermelho</SelectItem>
                        <SelectItem value="orange">Laranja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={settings.contact_info?.phone || ""}
                      onChange={(e) => updateContactInfo("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.contact_info?.email || ""}
                      onChange={(e) => updateContactInfo("email", e.target.value)}
                      placeholder="contato@exemplo.com"
                      className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Endereço
                  </Label>
                  <Textarea
                    id="address"
                    value={settings.contact_info?.address || ""}
                    onChange={(e) => updateContactInfo("address", e.target.value)}
                    placeholder="Rua Exemplo, 123 - Bairro - Cidade - CEP"
                    className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={settings.contact_info?.website || ""}
                    onChange={(e) => updateContactInfo("website", e.target.value)}
                    placeholder="https://www.exemplo.com"
                    className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Configurações do Cardápio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-sm font-medium">Mostrar Preços Publicamente</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Exibe os preços no cardápio digital público
                      </p>
                    </div>
                    <Switch
                      checked={settings.features?.show_prices_public || false}
                      onCheckedChange={(checked) => updateFeatures("show_prices_public", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-sm font-medium">Requerer Seleção de Mesa</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Clientes precisam escanear QR Code da mesa
                      </p>
                    </div>
                    <Switch
                      checked={settings.features?.require_table_selection || false}
                      onCheckedChange={(checked) => updateFeatures("require_table_selection", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-sm font-medium">Permitir Pedidos Online</Label>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Clientes podem fazer pedidos pelo cardápio digital
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">Em desenvolvimento</Badge>
                    </div>
                    <Switch
                      checked={settings.features?.allow_online_orders || false}
                      onCheckedChange={(checked) => updateFeatures("allow_online_orders", checked)}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Nova seção de configurações fiscais */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="w-5 h-5" />
                    Configurações Fiscais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tax_percentage" className="text-sm font-medium">Percentual de Impostos (%)</Label>
                      <Input
                        id="tax_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.tax_settings?.tax_percentage || 5.0}
                        onChange={(e) => updateSettings({
                          ...settings,
                          tax_settings: {
                            ...settings.tax_settings,
                            tax_percentage: parseFloat(e.target.value) || 0
                          }
                        })}
                        placeholder="5.0"
                        className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Impostos aplicados sobre o subtotal das vendas
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="service_fee_percentage" className="text-sm font-medium">Taxa de Serviço (%)</Label>
                      <Input
                        id="service_fee_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.tax_settings?.service_fee_percentage || 10.0}
                        onChange={(e) => updateSettings({
                          ...settings,
                          tax_settings: {
                            ...settings.tax_settings,
                            service_fee_percentage: parseFloat(e.target.value) || 0
                          }
                        })}
                        placeholder="10.0"
                        className="mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Taxa de serviço aplicada sobre o subtotal das vendas
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Importante</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Essas configurações afetam o cálculo de impostos e taxas de serviço em todos os novos invoices gerados. 
                          Invoices já criados não serão alterados.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data_management" className="mt-6">
            <div className="space-y-6">
              {/* Order Management Card */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5" />
                    Gerenciamento de Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="order_date_range" className="text-sm font-medium flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Selecionar Período para Pedidos
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1 border-slate-300 dark:border-slate-600 focus:ring-slate-500 rounded-xl"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {selectedDateRange.from ? (
                            selectedDateRange.to ? (
                              <>
                                {format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                              </>
                            ) : (
                              format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            "Selecione o período"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          defaultMonth={selectedDateRange.from}
                          selected={selectedDateRange}
                          onSelect={setSelectedDateRange}
                          numberOfMonths={2}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleExportOrders}
                      disabled={dataActionLoading || !selectedDateRange.from || !selectedDateRange.to}
                      className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
                    >
                      {dataActionLoading ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      Exportar Relatório PDF
                    </Button>
                    
                    {user?.role_level === 'admin' && (
                      <AlertDialog open={showDeleteOrdersDialog} onOpenChange={setShowDeleteOrdersDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            disabled={dataActionLoading || !selectedDateRange.from || !selectedDateRange.to}
                            className="flex-1 rounded-xl"
                            onClick={() => {
                                if (!selectedDateRange.from || !selectedDateRange.to) {
                                    alert("Por favor, selecione um período válido.");
                                    return;
                                }
                                setShowDeleteOrdersDialog(true);
                            }}
                          >
                            {dataActionLoading ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Excluir Pedidos do Período
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/>Confirmar Exclusão de Pedidos</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível e excluirá todos os pedidos do período{' '}
                              <strong>
                                {selectedDateRange.from && selectedDateRange.to
                                  ? `${format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR })} a ${format(selectedDateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                                  : "Período Inválido"}
                              </strong>
                              . Para confirmar, digite "EXCLUIR" no campo abaixo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Input
                            placeholder='Digite EXCLUIR para confirmar'
                            value={deleteOrdersConfirmationText}
                            onChange={(e) => setDeleteOrdersConfirmationText(e.target.value)}
                            className="my-2 border-red-500 focus:ring-red-500"
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteOrdersConfirmationText("")}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteOrdersConfirmed}
                              disabled={deleteOrdersConfirmationText !== "EXCLUIR"}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Confirmar Exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                   {user?.role_level !== 'admin' && (
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Apenas administradores podem excluir pedidos.</p>
                   )}
                </CardContent>
              </Card>

              {/* Data Clearing Card */}
              {user?.role_level === 'admin' && (
                <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-red-300 dark:border-red-700 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      Limpeza de Histórico (Ações Perigosas)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                      <Label className="text-sm font-medium text-red-700 dark:text-red-300">Limpar Histórico de Invoices</Label>
                      <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                        Esta ação excluirá permanentemente todos os invoices registrados no sistema. Isso afetará seus relatórios fiscais.
                      </p>
                       <AlertDialog open={showClearInvoicesDialog} onOpenChange={setShowClearInvoicesDialog}>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" disabled={dataActionLoading} className="w-full rounded-xl">
                                {dataActionLoading ? <RotateCcw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Limpar Todos os Invoices
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/>Confirmar Limpeza Total de Invoices</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é <strong>EXTREMAMENTE PERIGOSA</strong> e irreversível. Todos os invoices serão permanentemente excluídos.
                              Para confirmar, digite "LIMPAR TUDO" no campo abaixo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                           <Input
                            placeholder='Digite LIMPAR TUDO para confirmar'
                            value={clearInvoicesConfirmationText}
                            onChange={(e) => setClearInvoicesConfirmationText(e.target.value)}
                            className="my-2 border-red-500 focus:ring-red-500"
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setClearInvoicesConfirmationText("")}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleClearInvoicesConfirmed}
                              disabled={clearInvoicesConfirmationText !== "LIMPAR TUDO"}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Confirmar Limpeza Total
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
