
import React, { useState, useEffect } from "react";
import { Table, Order } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  Plus,
  MapPin,
  Users,
  RefreshCw,
  Download,
  Eye,
  ShoppingCart,
  Settings,
  Receipt,
  DollarSign,
  TrendingUp,
  ListOrdered, // Novo ícone para gerenciar mesas
  Edit2, // Ícone para editar no diálogo
  XCircle // Ícone para excluir no diálogo
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Adicionado para descrição do diálogo
  DialogFooter // Adicionado para o diálogo de gerenciamento
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table as ShadcnTable, // Renomeado para evitar conflito com entidade Table
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"; // Para o diálogo de gerenciamento
import QRCodeGenerator from "../components/tables/QRCodeGenerator";
import InvoiceGenerator from "../components/tables/InvoiceGenerator";

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTableOrders, setSelectedTableOrders] = useState([]);
  const [formData, setFormData] = useState({
    number: "",
    capacity: 4,
    location: "",
    status: "livre"
  });
  const [showManageTablesDialog, setShowManageTablesDialog] = useState(false);

  useEffect(() => {
    loadData(true); // Initial load

    const intervalId = setInterval(() => {
      loadData(false); // Subsequent loads are not "initial"
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  const loadData = async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const [tablesData, ordersData] = await Promise.all([
        Table.list("number"),
        Order.list("-created_date") // Carregar todos os pedidos recentes
      ]);
      setTables(tablesData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      number: table.number || "",
      capacity: table.capacity || 4,
      location: table.location || "",
      status: table.status || "livre"
    });
    setShowDialog(true); // Abre o diálogo de edição/criação existente
    setShowManageTablesDialog(false); // Fecha o diálogo de gerenciamento se estiver aberto
  };

  const handleCreate = () => {
    setEditingTable(null);
    setFormData({
      number: "",
      capacity: 4,
      location: "",
      status: "livre"
    });
    setShowDialog(true);
  };

  const generateQRCode = () => {
    const qrCode = `QR${Date.now().toString().slice(-6)}`;
    return qrCode;
  };

  const handleSave = async () => {
    try {
      const tableData = {
        ...formData,
        qr_code: editingTable?.qr_code || generateQRCode()
      };

      if (editingTable) {
        await Table.update(editingTable.id, tableData);
      } else {
        await Table.create(tableData);
      }
      setShowDialog(false);
      loadData(true); // Ensure a full refresh after save
    } catch (error) {
      console.error("Error saving table:", error);
    }
  };

  const handleDelete = async (tableId) => {
    if (confirm("Tem certeza que deseja excluir esta mesa? Esta ação é irreversível.")) {
      try {
        await Table.delete(tableId);
        loadData(true); // Recarrega as mesas
      } catch (error) {
        console.error("Error deleting table:", error);
        alert("Erro ao excluir a mesa. Verifique se não há pedidos ou invoices associados.");
      }
    }
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const table = tables.find(t => t.id === tableId);
      await Table.update(tableId, { ...table, status: newStatus });
      loadData(false); // No need for initial load (spinner) for status update
    } catch (error) {
      console.error("Error updating table status:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      livre: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      ocupada: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      reservada: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
    };
    return colors[status] || colors.livre;
  };

  const getActiveOrdersForTable = (tableId) => {
    // Esta função retorna apenas pedidos que ainda não foram finalizados (para exibição da lista de pedidos ativos)
    return orders.filter(order =>
      order.table_id === tableId &&
      !["entregue", "cancelado"].includes(order.status)
    );
  };

  // Nova função para verificar se a mesa TEVE pedidos (mesmo que finalizados)
  // Isso é usado para determinar se os botões "Invoice" e "Fechar" devem ser mostrados.
  // Uma mesa só pode ser fechada se teve consumo.
  const hasTableHadAnyOrdersInSession = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return false;

    // Verifica se existe QUALQUER pedido para esta mesa, independentemente do status.
    const allOrdersForTable = orders.filter(order => order.table_id === tableId);

    // Se a mesa estiver ocupada, qualquer pedido (mesmo entregue) justifica o fechamento.
    // Se estiver livre, mas teve pedidos, ainda pode ser necessário gerar um invoice (caso raro).
    return allOrdersForTable.length > 0 &&
           (table.status === 'ocupada' ||
            table.status === 'reservada' ||
            allOrdersForTable.some(o => o.status !== 'cancelado'));
  };

  // Função para obter todos os pedidos de uma mesa para o Invoice (incluindo os já entregues)
  const getAllOrdersForInvoice = (tableId) => {
    return orders.filter(order =>
      order.table_id === tableId && order.status !== "cancelado" // Não incluir cancelados no invoice
    );
  };

  const getTableConsumption = (tableId) => {
    // A prévia do consumo deve considerar apenas pedidos ativos para não confundir
    const activeTableOrders = getActiveOrdersForTable(tableId);
    const totalAmount = activeTableOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalItems = activeTableOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    return { totalAmount, totalItems, orderCount: activeTableOrders.length };
  };

  const showQR = (table) => {
    setSelectedTable(table);
    setShowQRDialog(true);
  };

  const showInvoice = (table) => {
    // Usar getAllOrdersForInvoice para popular o invoice
    const tableOrdersForInvoice = getAllOrdersForInvoice(table.id);
    if (tableOrdersForInvoice.length === 0) {
      alert("Esta mesa não possui consumo registrado para gerar invoice.");
      return;
    }
    setSelectedTable(table);
    setSelectedTableOrders(tableOrdersForInvoice);
    setShowInvoiceDialog(true);
  };

  // New function to close table and generate invoice
  const closeTableAndGenerateInvoice = (table) => {
    // Usar getAllOrdersForInvoice para popular o invoice ao fechar
    const tableOrdersForInvoice = getAllOrdersForInvoice(table.id);
    if (tableOrdersForInvoice.length === 0) {
      alert("Esta mesa não possui consumo registrado para fechar.");
      return;
    }
    setSelectedTable(table);
    setSelectedTableOrders(tableOrdersForInvoice);
    setShowInvoiceDialog(true); // O diálogo de invoice também lida com o fechamento da mesa
  };

  const handleInvoiceCreated = async (invoice) => {
    // Update table status to free
    if (selectedTable) {
        // Mark orders associated with the invoice as 'entregue' if they are not 'cancelado'
        // And update table status to 'livre'
        const ordersToUpdate = orders.filter(o => o.table_id === selectedTable.id && o.status !== 'cancelado');
        for (const order of ordersToUpdate) {
            if(order.status !== 'entregue'){ // Only update if not already delivered
                 await Order.update(order.id, { ...order, status: "entregue" });
            }
        }
        await Table.update(selectedTable.id, {
            ...selectedTable,
            status: "livre"
        });
    }
    loadData(true); // Recarregar dados para refletir as mudanças
    alert(`Invoice ${invoice.invoice_number} gerado com sucesso! Mesa ${selectedTable?.number || ''} liberada.`);
    setShowInvoiceDialog(false);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-xl w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-yellow-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-3">
              Mesas & QR Codes
            </h1>
            <p className="text-amber-700 dark:text-amber-300 text-lg">
              Gerencie mesas, status e códigos QR (atualiza a cada 15s)
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => loadData(true)} variant="outline" size="icon" className="hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover-lift">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setShowManageTablesDialog(true)} variant="outline" className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl hover-lift">
              <ListOrdered className="w-4 h-4 mr-2" />
              Gerenciar Mesas
            </Button>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover-lift">
              <Plus className="w-4 h-4 mr-2" />
              Nova Mesa
            </Button>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table, index) => {
            const activeOrders = getActiveOrdersForTable(table.id);
            const consumption = getTableConsumption(table.id);
            const canCloseTable = hasTableHadAnyOrdersInSession(table.id);

            return (
              <Card 
                key={table.id} 
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-amber-200/50 dark:border-amber-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up hover-lift rounded-2xl overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-3 mb-2">
                        Mesa {table.number}
                        <Badge className={`${getStatusColor(table.status)} font-semibold px-3 py-1 rounded-full shadow-sm`}>
                          {table.status}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-amber-700 dark:text-amber-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-3 h-3" />
                          {table.capacity} lugares
                        </span>
                        {table.location && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3" />
                            {table.location}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 p-4">
                  {/* Consumption Preview - mais compacto */}
                  {consumption.orderCount > 0 && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-800/50">
                      <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-md flex items-center justify-center">
                          <DollarSign className="w-2.5 h-2.5 text-white" />
                        </div>
                        Consumo Atual:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                            R$ {consumption.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                            {consumption.totalItems}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">Itens</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Orders - mais compacto */}
                  {activeOrders.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-2.5 h-2.5 text-white" />
                        </div>
                        Pedidos Ativos: {activeOrders.length}
                      </div>
                      <div className="space-y-1">
                        {activeOrders.slice(0, 2).map((order) => (
                          <div key={order.id} className="text-xs text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-slate-800/50 p-2 rounded-md">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{order.items?.length || 0} itens - R$ {order.total_amount?.toFixed(2)}</span>
                              <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700">
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {activeOrders.length > 2 && (
                          <div className="text-xs text-blue-500 dark:text-blue-400 font-medium text-center">
                            +{activeOrders.length - 2} mais...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Actions - mais compacto */}
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-md flex items-center justify-center">
                        <Settings className="w-2.5 h-2.5 text-white" />
                      </div>
                      Status:
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { status: "livre", label: "Livre", color: "from-green-500 to-green-600" },
                        { status: "ocupada", label: "Ocupada", color: "from-red-500 to-red-600" },
                        { status: "reservada", label: "Reservada", color: "from-yellow-500 to-yellow-600" }
                      ].map((statusOption) => (
                        <Button
                          key={statusOption.status}
                          onClick={() => updateTableStatus(table.id, statusOption.status)}
                          className={`text-xs py-1.5 rounded-lg transition-all duration-300 hover-lift ${
                            table.status === statusOption.status
                              ? `bg-gradient-to-r ${statusOption.color} text-white shadow-md`
                              : "bg-white/50 dark:bg-slate-800/50 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                          }`}
                          size="sm"
                        >
                          {statusOption.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons - mais compacto */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Button
                      onClick={() => showQR(table)}
                      variant="outline"
                      size="sm"
                      className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg hover-lift px-2 sm:px-3 flex-1 xs:flex-none"
                    >
                      <Eye className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Ver QR</span>
                    </Button>

                    {canCloseTable && (
                      <>
                        <Button
                          onClick={() => showInvoice(table)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg hover-lift px-2 sm:px-3 flex-1 xs:flex-none"
                        >
                          <Receipt className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">Invoice</span>
                        </Button>
                        <Button
                          onClick={() => closeTableAndGenerateInvoice(table)}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg hover-lift px-2 sm:px-3 flex-1 xs:flex-none"
                        >
                          <TrendingUp className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">Fechar</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {tables.length === 0 && (
            <div className="col-span-full animate-fade-in-up">
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-amber-200/50 dark:border-amber-700/50 rounded-2xl">
                <CardContent className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-12 h-12 text-amber-700 dark:text-amber-300 opacity-60" />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-3">
                    Nenhuma mesa criada
                  </h3>
                  <p className="text-amber-700 dark:text-amber-400 mb-6 text-lg">
                    Crie sua primeira mesa para começar
                  </p>
                  <Button onClick={handleCreate} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover-lift">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Mesa
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-amber-200 dark:border-amber-800 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-900 dark:text-amber-100">
                {editingTable ? "Editar Mesa" : "Nova Mesa"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="number" className="text-amber-900 dark:text-amber-100 font-semibold">Número da Mesa</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="Ex: 1, A1, VIP01"
                  className="border-amber-300 dark:border-amber-700 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="capacity" className="text-amber-900 dark:text-amber-100 font-semibold">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 4})}
                  className="border-amber-300 dark:border-amber-700 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-amber-900 dark:text-amber-100 font-semibold">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Área Principal, Terraço, VIP"
                  className="border-amber-300 dark:border-amber-700 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-amber-900 dark:text-amber-100 font-semibold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className="border-amber-300 dark:border-amber-700 focus:ring-amber-500 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-amber-200 dark:border-amber-800 rounded-xl">
                    <SelectItem value="livre">Livre</SelectItem>
                    <SelectItem value="ocupada">Ocupada</SelectItem>
                    <SelectItem value="reservada">Reservada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)} className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl hover-lift">
                  {editingTable ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        {selectedTable && (
          <QRCodeGenerator
            table={selectedTable}
            open={showQRDialog}
            onOpenChange={setShowQRDialog}
          />
        )}

        {/* Invoice Generator Dialog */}
        {selectedTable && (
          <InvoiceGenerator
            table={selectedTable}
            orders={selectedTableOrders}
            open={showInvoiceDialog}
            onOpenChange={setShowInvoiceDialog}
            onInvoiceCreated={handleInvoiceCreated}
          />
        )}

        {/* Dialog de Gerenciamento de Mesas */}
        <Dialog open={showManageTablesDialog} onOpenChange={setShowManageTablesDialog}>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-amber-200 dark:border-amber-800 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <ListOrdered className="w-5 h-5" />
                Gerenciar Mesas
              </DialogTitle>
              <DialogDescription className="text-amber-700 dark:text-amber-300">
                Visualize, edite ou exclua mesas existentes.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4">
              <ShadcnTable className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-amber-900 dark:text-amber-100">Número</TableHead>
                    <TableHead className="text-amber-900 dark:text-amber-100">Status</TableHead>
                    <TableHead className="text-amber-900 dark:text-amber-100 hidden sm:table-cell">Capacidade</TableHead>
                    <TableHead className="text-amber-900 dark:text-amber-100 hidden md:table-cell">Localização</TableHead>
                    <TableHead className="text-right text-amber-900 dark:text-amber-100">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.sort((a, b) => (a.number || "").localeCompare(b.number || "")).map((table) => (
                    <TableRow key={table.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                      <TableCell className="font-medium text-amber-800 dark:text-amber-200">{table.number}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(table.status)} text-xs`}>{table.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-amber-700 dark:text-amber-300">{table.capacity}</TableCell>
                      <TableCell className="hidden md:table-cell text-amber-700 dark:text-amber-300">{table.location || "N/A"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(table)} className="border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800/30 h-8 w-8">
                          <Edit2 className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(table.id)} className="border-red-300 dark:border-red-600 hover:bg-red-100 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400 h-8 w-8">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ShadcnTable>
              {tables.length === 0 && (
                <p className="text-center py-8 text-amber-700 dark:text-amber-300">Nenhuma mesa cadastrada.</p>
              )}
            </ScrollArea>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowManageTablesDialog(false)} className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
