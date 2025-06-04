
import React, { useState, useEffect } from "react";
import { Order, Table, Product, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beer, Users, Clock, TrendingUp, Table as TableIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeTables: 0,
    avgOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [orders, tables] = await Promise.all([
        Order.list("-created_date", 50),
        Table.list()
      ]);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => 
        new Date(order.created_date) >= today
      );

      const totalRevenue = todayOrders.reduce((sum, order) => 
        sum + (order.total_amount || 0), 0
      );

      const activeTables = tables.filter(table => 
        table.status === "ocupada"
      ).length;

      setStats({
        totalOrders: todayOrders.length,
        totalRevenue,
        activeTables,
        avgOrderValue: todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0
      });

      setRecentOrders(orders.slice(0, 10));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gradient-to-r from-amber-200 to-orange-200 dark:from-amber-800 to-orange-800 rounded-xl w-64 shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50/30 via-stone-50/20 to-zinc-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 dark:from-slate-300 dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Visão geral da cervejaria - {format(new Date(), "EEEE, d MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Pedidos Hoje",
              value: stats.totalOrders,
              subtitle: "Total de pedidos hoje",
              icon: Beer,
              gradient: "from-blue-500 to-blue-600",
              bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            },
            {
              title: "Faturamento",
              value: `R$ ${stats.totalRevenue.toFixed(2)}`,
              subtitle: "Receita do dia",
              icon: DollarSign,
              gradient: "from-emerald-500 to-emerald-600",
              bgGradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
            },
            {
              title: "Mesas Ativas",
              value: stats.activeTables,
              subtitle: "Mesas ocupadas",
              icon: TableIcon,
              gradient: "from-purple-500 to-purple-600",
              bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            },
            {
              title: "Ticket Médio",
              value: `R$ ${stats.avgOrderValue.toFixed(2)}`,
              subtitle: "Valor médio por pedido",
              icon: TrendingUp,
              gradient: "from-slate-500 to-slate-600",
              bgGradient: "from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20"
            }
          ].map((stat, index) => (
            <Card 
              key={stat.title} 
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in-up hover-lift rounded-2xl`}
              style={{ animationDelay: `${index * 0.1}s` }}
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

        {/* Recent Orders */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/50 dark:border-slate-700/50 shadow-lg animate-fade-in-up hover-lift rounded-2xl" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-500/10 to-slate-600/10 dark:from-slate-700/20 dark:to-slate-800/20 rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-stone-50 dark:from-slate-800/20 dark:to-slate-700/20 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                      <Beer className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        Mesa #{order.table_id?.slice(-4) || "N/A"}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {format(new Date(order.created_date), "HH:mm", { locale: ptBR })} - 
                        {order.items?.length || 0} itens
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} font-semibold px-3 py-1 rounded-full`}>
                      {order.status}
                    </Badge>
                    <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                      R$ {order.total_amount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-center py-8 animate-fade-in-up">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Beer className="w-8 h-8 text-slate-600 dark:text-slate-400 opacity-60" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-slate-600 dark:text-slate-400">Os pedidos aparecerão aqui conforme chegarem</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
