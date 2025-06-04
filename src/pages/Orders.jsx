
import React, { useState, useEffect } from "react";
import { Order, Table, User, ServiceRequest } from "@/api/entities"; // Removido Product pois não é usado diretamente aqui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  User as UserIcon,
  MapPin,
  RefreshCw,
  Filter,
  Beer,
  BellRing,
  Archive, // Novo ícone para arquivar
  ArchiveRestore // Novo ícone para restaurar arquivados
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// URL for the notification sound
const NOTIFICATION_SOUND_URL = 'https://cdn.pixabay.com/download/audio/2025/04/24/audio_44374da14f.mp3?filename=notification-alert-8-331718.mp3';

// Chave para o localStorage
const ARCHIVED_ORDER_IDS_KEY = 'bierServ_archivedOrderIds';

// OrderNotification Component
const OrderNotification = ({ show, orderData, onClose }) => {
  useEffect(() => {
    if (show && orderData) {
      const audio = new Audio(NOTIFICATION_SOUND_URL);
      audio.volume = 0.5; // Adjust volume as needed
      audio.play().then(() => {
        console.log("Order notification sound played.");
      }).catch(e => console.error('Order notification sound play failed:', e.message));

      const timer = setTimeout(() => onClose(), 5000); // Notification stays for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show, orderData, onClose]);

  if (!show || !orderData) return null;
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <Card className="bg-gradient-to-r from-amber-500 to-orange-600 border-none shadow-2xl text-white min-w-[280px] sm:min-w-80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5" />
            Novo Pedido!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-md font-semibold">Mesa {orderData.table_number || "N/A"}</p>
            <p className="text-sm opacity-90">{orderData.items?.length || 0} itens</p>
            <p className="text-lg font-bold">R$ {orderData.total_amount?.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ServiceNotification Component
const ServiceNotification = ({ show, requestData, onClose }) => {
  useEffect(() => {
    if (show && requestData) {
      const audio = new Audio(NOTIFICATION_SOUND_URL);
      audio.volume = 0.4; // Adjust volume as needed
      audio.play().then(() => {
        console.log("Service request notification sound played.");
      }).catch(e => console.error('Service request notification sound play failed:', e.message));

      const timer = setTimeout(() => onClose(), 5000); // Notification stays for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show, requestData, onClose]);

  if (!show || !requestData) return null;
  return (
    <div className="fixed top-4 left-4 z-50 animate-slide-in-left">
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none shadow-2xl text-white min-w-[280px] sm:min-w-80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="w-5 h-5" />
            Chamada de Garçom!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-md font-semibold">Mesa {requestData.table_number || "N/A"}</p>
            <p className="text-sm opacity-90">Cliente solicita atendimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [serviceRequests, setServiceRequests] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [tableFilter, setTableFilter] = useState("all");

    const [lastCheckedOrderId, setLastCheckedOrderId] = useState(null);
    const [lastCheckedServiceRequestId, setLastCheckedServiceRequestId] = useState(null);
    const [processedOrderIds, setProcessedOrderIds] = useState(new Set());
    const [processedRequestIds, setProcessedRequestIds] = useState(new Set());

    const [showOrderNotification, setShowOrderNotification] = useState(false);
    const [showServiceNotification, setShowServiceNotification] = useState(false);
    const [orderNotificationData, setOrderNotificationData] = useState(null);
    const [serviceNotificationData, setServiceNotificationData] = useState(null);

    useEffect(() => {
        loadUser();
        loadData(true);

        const interval = setInterval(() => {
            loadData(false);
        }, 10000); // Check for new data every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const loadUser = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
        } catch (error) {
            console.log("User not authenticated");
        }
    };

    const loadData = async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        try {
            const [ordersDataFromApi, serviceRequestsData, tablesData] = await Promise.all([
                Order.list("-created_date", 100), // Aumentar um pouco o limite para ter mais margem
                ServiceRequest.list("-created_date", 20),
                Table.list()
            ]);

            setTables(tablesData); // Ensure tables are loaded for number lookup

            // Filtrar pedidos arquivados
            const archivedIdsString = localStorage.getItem(ARCHIVED_ORDER_IDS_KEY);
            const archivedIds = archivedIdsString ? JSON.parse(archivedIdsString) : [];
            const filteredApiOrders = ordersDataFromApi.filter(order => !archivedIds.includes(order.id));

            // Process new orders for notification (usar dados brutos da API para notificação, mas filtrar para visualização)
            if (ordersDataFromApi.length > 0) { // Notificação baseada nos dados brutos da API
                const latestOrder = ordersDataFromApi[0];
                if (latestOrder.id !== lastCheckedOrderId) { // A new "latest order" has arrived or changed
                    if (latestOrder.status === "pendente" && !processedOrderIds.has(latestOrder.id)) {
                        const tableForOrder = tablesData.find(t => t.id === latestOrder.table_id);
                        setProcessedOrderIds(prev => new Set(prev).add(latestOrder.id)); // Mark as processed before showing
                        setOrderNotificationData({
                            ...latestOrder,
                            table_number: tableForOrder?.number || "Desconhecida"
                        });
                        setShowOrderNotification(true);
                    }
                }
                setLastCheckedOrderId(latestOrder.id); // Update last checked order ID
            }
            setOrders(filteredApiOrders); // Definir o estado com os pedidos já filtrados

            // Process new service requests for notification
            if (serviceRequestsData.length > 0) {
                const latestRequest = serviceRequestsData[0];
                if (latestRequest.id !== lastCheckedServiceRequestId) { // A new "latest request"
                    if (latestRequest.status === 'pending' && !processedRequestIds.has(latestRequest.id)) {
                        setProcessedRequestIds(prev => new Set(prev).add(latestRequest.id)); // Mark as processed
                        setServiceNotificationData({
                            ...latestRequest,
                            table_number: latestRequest.table_number || "Desconhecida" // table_number should exist
                        });
                        setShowServiceNotification(true);
                    }
                }
                setLastCheckedServiceRequestId(latestRequest.id); // Update last checked request ID
            }
            setServiceRequests(serviceRequestsData);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                console.error(`Order with ID ${orderId} not found for update.`);
                return;
            }
            await Order.update(orderId, {
                ...order, // Spread existing order data
                status: newStatus,
                waiter_id: user?.id || order.waiter_id // Keep existing waiter_id if no user is logged in or user has no id
            });
            // Optimistically update UI
            setOrders(prevOrders => prevOrders.map(o =>
                o.id === orderId ? { ...o, status: newStatus, waiter_id: user?.id || order.waiter_id } : o
            ));
        } catch (error) {
            console.error("Error updating order status:", error);
            loadData(false); // Reload data on error to ensure consistency
        }
    };

    const acknowledgeServiceRequest = async (requestId) => {
        try {
            const request = serviceRequests.find(r => r.id === requestId);
            if (!request) {
                console.error(`Service request with ID ${requestId} not found.`);
                return;
            }
            await ServiceRequest.update(requestId, {
                ...request, // Spread existing request data
                status: "acknowledged"
            });
            // Optimistically update UI
            setServiceRequests(prev =>
                prev.map(r => r.id === requestId ? { ...r, status: "acknowledged" } : r)
            );
        } catch (error) {
            console.error("Error acknowledging service request:", error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pendente: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
            preparando: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
            pronto: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
            entregue: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700",
            cancelado: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        };
        return colors[status] || colors.pendente;
    };

    const getStatusIcon = (status) => {
        const icons = {
            pendente: Clock,
            preparando: ChefHat,
            pronto: CheckCircle,
            entregue: CheckCircle,
            cancelado: XCircle
        };
        const IconComponent = icons[status] || Clock;
        return <IconComponent className="w-4 h-4" />;
    };

    const getTableNumber = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        return table?.number || "N/A"; // Return "N/A" if table not found for robustness
    };

    const getTableLocation = (tableId) => {
        const table = tables.find(t => t.id === tableId);
        return table?.location || "";
    };

    const handleArchiveResolvedOrders = () => { // Renomeado para refletir que arquiva entregues e cancelados
      const ordersToArchive = orders
        .filter(order => order.status === "entregue" || order.status === "cancelado")
        .map(order => order.id);

      if (ordersToArchive.length === 0) {
        alert("Nenhum pedido entregue ou cancelado para arquivar.");
        return;
      }

      const archivedIdsString = localStorage.getItem(ARCHIVED_ORDER_IDS_KEY);
      const currentArchivedIds = archivedIdsString ? JSON.parse(archivedIdsString) : [];
      
      const newArchivedIds = [...new Set([...currentArchivedIds, ...ordersToArchive])];
      localStorage.setItem(ARCHIVED_ORDER_IDS_KEY, JSON.stringify(newArchivedIds));
      
      loadData(false); 
      alert(`${ordersToArchive.length} pedido(s) entregue(s)/cancelado(s) foram arquivados visualmente.`);
    };

    const handleRestoreArchivedOrders = () => {
        const archivedIdsString = localStorage.getItem(ARCHIVED_ORDER_IDS_KEY);
        if (!archivedIdsString || JSON.parse(archivedIdsString).length === 0) {
            alert("Nenhum pedido arquivado para restaurar.");
            return;
        }
        localStorage.removeItem(ARCHIVED_ORDER_IDS_KEY);
        loadData(true); // Forçar reload para mostrar tudo
        alert("Visualização de pedidos arquivados restaurada.");
    };

    const filteredOrders = orders.filter(order => { // 'orders' já está filtrado pelo localStorage
        const statusMatch = activeTab === "all" || order.status === activeTab;
        const tableMatch = tableFilter === "all" || order.table_id === tableFilter;
        return statusMatch && tableMatch;
    });

    const groupedOrders = {
        pendente: filteredOrders.filter(o => o.status === "pendente"),
        preparando: filteredOrders.filter(o => o.status === "preparando"),
        pronto: filteredOrders.filter(o => o.status === "pronto"),
        entregue: filteredOrders.filter(o => o.status === "entregue"), 
        cancelado: filteredOrders.filter(o => o.status === "cancelado")
    };

    const pendingServiceRequests = serviceRequests.filter(r => r.status === "pending");

    if (loading && orders.length === 0 && serviceRequests.length === 0) { // Show loader if all main data is empty and loading
        return (
            <div className="p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-7 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 dark:to-orange-800 rounded-lg w-56"></div>
                        <div className="grid gap-4">
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-yellow-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
            <OrderNotification
                show={showOrderNotification}
                orderData={orderNotificationData}
                onClose={() => setShowOrderNotification(false)}
            />
            <ServiceNotification
                show={showServiceNotification}
                requestData={serviceNotificationData}
                onClose={() => setShowServiceNotification(false)}
            />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 animate-fade-in-up">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-2">
                            Pedidos
                        </h1>
                        <p className="text-amber-700 dark:text-amber-300 text-md">
                            Gerencie todos os pedidos (atualiza a cada 10s)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleArchiveResolvedOrders} variant="outline" size="icon" title="Arquivar Pedidos Entregues/Cancelados" className="hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover-lift">
                            <Archive className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleRestoreArchivedOrders} variant="outline" size="icon" title="Mostrar Pedidos Arquivados" className="hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover-lift">
                            <ArchiveRestore className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => loadData(true)} variant="outline" size="icon" title="Atualizar Pedidos" className="hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover-lift">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {pendingServiceRequests.length > 0 && (
                    <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 animate-fade-in-up shadow-lg">
                        <CardHeader className="pb-2 pt-3">
                            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2 text-lg">
                                <BellRing className="w-5 h-5" />
                                Chamados de Garçom Pendentes ({pendingServiceRequests.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-3">
                            {pendingServiceRequests.map(request => (
                                <div key={request.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-600">
                                    <div>
                                        <span className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Mesa {request.table_number || getTableNumber(request.table_id)}</span>
                                        <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">
                                            {format(new Date(request.created_date), "HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-500 text-blue-600 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-800/50 text-xs px-2 py-1"
                                        onClick={() => acknowledgeServiceRequest(request.id)}
                                    >
                                        Marcar como Atendido
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap gap-3 items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-md shadow-md">
                            <Filter className="w-3 h-3 text-white" />
                        </div>
                        <Select value={tableFilter} onValueChange={setTableFilter}>
                            <SelectTrigger className="w-36 border-amber-300 dark:border-amber-700 focus:ring-amber-500 text-sm">
                                <SelectValue placeholder="Filtrar mesa" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
                                <SelectItem value="all">Todas as mesas</SelectItem>
                                {tables.map((table) => (
                                    <SelectItem key={table.id} value={table.id}>
                                        Mesa {table.number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-amber-200 dark:border-amber-800 rounded-xl p-0.5">
                        {[
                            { value: "all", icon: ShoppingCart, label: "Todos", count: filteredOrders.length }, // Usar filteredOrders para contagem
                            { value: "pendente", icon: Clock, label: "Pendente", count: groupedOrders.pendente.length },
                            { value: "preparando", icon: ChefHat, label: "Preparando", count: groupedOrders.preparando.length },
                            { value: "pronto", icon: CheckCircle, label: "Pronto", count: groupedOrders.pronto.length },
                            { value: "entregue", icon: CheckCircle, label: "Entregue", count: groupedOrders.entregue.length }, // Contará os entregues não arquivados
                            { value: "cancelado", icon: XCircle, label: "Cancelado", count: groupedOrders.cancelado.length }
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all duration-300 text-xs sm:text-sm py-1.5 px-2"
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <Badge variant={activeTab === tab.value ? "secondary" : "outline"} className="text-xs px-1.5 py-0.5 bg-white/20">
                                    {tab.count}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-4">
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {filteredOrders.map((order, index) => (
                                <Card
                                    key={order.id}
                                    className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-amber-200/50 dark:border-amber-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up hover-lift rounded-xl overflow-hidden"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                                        <div className="flex flex-row justify-between items-start gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-md flex items-center justify-center shadow-sm">
                                                    <ShoppingCart className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                                                        Mesa {getTableNumber(order.table_id)}
                                                        <Badge className={`${getStatusColor(order.status)} font-medium px-1.5 py-0.5 rounded-full text-xs shadow-sm`}>
                                                            {getStatusIcon(order.status)}
                                                            <span className="ml-0.5">{order.status}</span>
                                                        </Badge>
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 mt-1">
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Clock className="w-3 h-3" />
                                                            {format(new Date(order.created_date), "HH:mm dd/MM", { locale: ptBR })}
                                                        </span>
                                                        {getTableLocation(order.table_id) && (
                                                            <span className="flex items-center gap-1 font-medium">
                                                                <MapPin className="w-3 h-3" />
                                                                {getTableLocation(order.table_id)}
                                                            </span>
                                                        )}
                                                        {order.waiter_id && (
                                                            <span className="flex items-center gap-1 font-medium">
                                                                <UserIcon className="w-3 h-3" />
                                                                Garçom
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                                    R$ {order.total_amount?.toFixed(2)}
                                                </div>
                                                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                                    {order.items?.length || 0} itens
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-2 p-4">
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-md p-2 border border-amber-200/50 dark:border-amber-800/50">
                                            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1.5 text-sm flex items-center gap-1.5">
                                                <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-sm flex items-center justify-center">
                                                    <Beer className="w-2.5 h-2.5 text-white" />
                                                </div>
                                                Itens do Pedido
                                            </h4>
                                            <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin">
                                                {order.items?.map((item, index_item) => (
                                                    <div key={index_item} className="flex justify-between items-center py-1 px-1.5 bg-white/70 dark:bg-slate-800/70 rounded text-xs border border-amber-200/30 dark:border-amber-700/30">
                                                        <div>
                                                            <span className="font-medium text-amber-900 dark:text-amber-100">
                                                                {item.quantity}x {item.product_name}
                                                            </span>
                                                            <span className="text-amber-700 dark:text-amber-400 ml-0.5 text-xs font-medium">
                                                                ({item.volume})
                                                            </span>
                                                        </div>
                                                        <span className="font-semibold text-sm text-amber-800 dark:text-amber-200">
                                                            R$ {item.total?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {order.customer_notes && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                                                <div className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-sm flex items-center justify-center">
                                                        <UserIcon className="w-2 h-2 text-white" />
                                                    </div>
                                                    Observações:
                                                </div>
                                                <div className="text-xs text-blue-700 dark:text-blue-400 font-medium max-h-16 overflow-y-auto scrollbar-thin">
                                                    {order.customer_notes}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                                            {order.status === "pendente" && (
                                                <>
                                                    <Button
                                                        onClick={() => updateOrderStatus(order.id, "preparando")}
                                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-md hover-lift text-xs px-2 py-1 h-auto"
                                                        size="xs"
                                                    >
                                                        <ChefHat className="w-3 h-3 mr-1" />
                                                        Preparar
                                                    </Button>
                                                    <Button
                                                        onClick={() => updateOrderStatus(order.id, "cancelado")}
                                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-md hover-lift text-xs px-2 py-1 h-auto"
                                                        size="xs"
                                                    >
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Cancelar
                                                    </Button>
                                                </>
                                            )}

                                            {order.status === "preparando" && (
                                                <Button
                                                    onClick={() => updateOrderStatus(order.id, "pronto")}
                                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-md hover-lift text-xs px-2 py-1 h-auto"
                                                    size="xs"
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Pronto
                                                </Button>
                                            )}

                                            {order.status === "pronto" && (
                                                <Button
                                                    onClick={() => updateOrderStatus(order.id, "entregue")}
                                                    className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-md hover-lift text-xs px-2 py-1 h-auto"
                                                    size="xs"
                                                >
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Entregue
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredOrders.length === 0 && (
                                 <Card className="col-span-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-amber-200/50 dark:border-amber-700/50 rounded-xl animate-fade-in-up">
                                  <CardContent className="text-center py-12">
                                    <div className="w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <ShoppingCart className="w-10 h-10 text-amber-700 dark:text-amber-300 opacity-60" />
                                    </div>
                                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                                      Nenhum pedido para exibir
                                    </h3>
                                    <p className="text-amber-700 dark:text-amber-400 text-md">
                                      {activeTab === "all" ? "Não há pedidos ativos ou alguns pedidos entregues ou cancelados podem estar arquivados." : `Não há pedidos com status "${activeTab}" ou podem estar arquivados.`}
                                      <br/>
                                      Use o botão <ArchiveRestore className="inline w-4 h-4 mx-1" /> para ver pedidos arquivados.
                                    </p>
                                  </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <style jsx>{`
                @keyframes slide-in-right {
                  from {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }
                .animate-slide-in-right {
                  animation: slide-in-right 0.3s ease-out;
                }
                @keyframes slide-in-left {
                  from {
                    transform: translateX(-100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }
                .animate-slide-in-left {
                  animation: slide-in-left 0.3s ease-out;
                }
                .scrollbar-thin {
                  scrollbar-width: thin;
                  scrollbar-color: #fbbf24 #fef3c7; /* amber-400 amber-100 */
                }
                .scrollbar-thin::-webkit-scrollbar {
                  width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                  background: #fef3c7; /* amber-100 */
                  border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                  background-color: #fbbf24; /* amber-400 */
                  border-radius: 10px;
                  border: 2px solid #fef3c7; /* amber-100 */
                }
                .dark .scrollbar-thin {
                    scrollbar-color: #a16207 #3f3f46; /* amber-700 zinc-700 */
                }
                .dark .scrollbar-thin::-webkit-scrollbar-track {
                    background: #3f3f46; /* zinc-700 */
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: #a16207; /* amber-700 */
                    border: 2px solid #3f3f46; /* zinc-700 */
                }

            `}</style>
        </div>
    );
}
