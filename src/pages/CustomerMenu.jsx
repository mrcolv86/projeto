
import React, { useState, useEffect } from "react";
import { Product, Category, SystemSettings, Table, Order, ServiceRequest } from "@/api/entities"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  MapPin,
  Beer,
  Coffee,
  Wine,
  CheckCircle,
  BellRing,
  Percent,
  Activity,
  AlertTriangle, 
  User as UserIcon, 
  Phone,
  Check,
  Menu as MenuIcon,
  X
} from "lucide-react"; 

// New UI component imports from the outline
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CustomerMenu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [currentTable, setCurrentTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerNotes, setCustomerNotes] = useState("");
  
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableQRCode = urlParams.get("table");
    
    if (tableQRCode) {
      loadTableAndMenu(tableQRCode);
    } else {
      loadMenuOnly();
    }
  }, []);

  const [showFloatingCartButton, setShowFloatingCartButton] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowFloatingCartButton(true);
      } else {
        setShowFloatingCartButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const loadTableAndMenu = async (qrCode) => {
    setLoading(true);
    try {
      const tablesResult = await Table.filter({ qr_code: qrCode });
      const table = tablesResult.length > 0 ? tablesResult[0] : null;

      const [categoriesData, productsData, settingsData] = await Promise.all([
        Category.list("sort_order"),
        Product.list("sort_order"),
        SystemSettings.list()
      ]);

      setCurrentTable(table);

      const activeCategories = categoriesData.filter(cat => cat.is_active);
      const availableProducts = productsData.filter(prod => prod.is_available);
      
      setCategories(activeCategories);
      setProducts(availableProducts);
      
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
      
    } catch (error) {
      console.error("Error loading table and menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuOnly = async () => {
    setLoading(true);
    try {
      const [categoriesData, productsData, settingsData] = await Promise.all([
        Category.list("sort_order"),
        Product.list("sort_order"),
        SystemSettings.list()
      ]);

      const activeCategories = categoriesData.filter(cat => cat.is_active);
      const availableProducts = productsData.filter(prod => prod.is_available);
      
      setCategories(activeCategories);
      setProducts(availableProducts);
      
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId) => {
    return products.filter(product => 
      product.category_id === categoryId && product.is_available
    );
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("pilsen") || name.includes("weizen") || name.includes("beer") || name.includes("cerveja")) {
      return Beer;
    }
    if (name.includes("coffee") || name.includes("café")) {
      return Coffee;
    }
    if (name.includes("wine") || name.includes("vinho")) {
      return Wine;
    }
    return Beer;
  };

  const addToCart = (product, variant) => {
    const cartItem = {
      product_id: product.id,
      product_name: product.name,
      volume: variant.volume,
      price: variant.price,
      quantity: 1,
      total: variant.price
    };

    const existingItemIndex = cart.findIndex(
      item => item.product_id === product.id && item.volume === variant.volume
    );

    setCart(prev => {
      if (existingItemIndex >= 0) {
        const updatedCart = [...prev];
        updatedCart[existingItemIndex].quantity += 1;
        updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
        return updatedCart;
      } else {
        return [...prev, cartItem];
      }
    });
  };

  const removeFromCart = (productId, volume) => {
    const existingItemIndex = cart.findIndex(
      item => item.product_id === productId && item.volume === volume
    );

    setCart(prev => {
      if (existingItemIndex >= 0) {
        const updatedCart = [...prev];
        if (updatedCart[existingItemIndex].quantity > 1) {
          updatedCart[existingItemIndex].quantity -= 1;
          updatedCart[existingItemIndex].total = updatedCart[existingItemIndex].quantity * updatedCart[existingItemIndex].price;
        } else {
          updatedCart.splice(existingItemIndex, 1);
        }
        return updatedCart;
      }
      return prev; 
    });
  };

  const getCartItemQuantity = (productId, volume) => {
    const item = cart.find(item => item.product_id === productId && item.volume === volume);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const submitOrder = async () => { 
    if (settings?.features?.require_table_selection && !currentTable) {
      alert("É necessário escanear o QR Code da mesa para fazer um pedido.");
      return;
    }
    
    if (cart.length === 0) {
      alert("Adicione itens ao carrinho antes de finalizar o pedido.");
      return;
    }

    setSubmittingOrder(true);
    setOrderSubmitted(false);
    setShowOrderSuccess(false);

    const orderItems = cart.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      volume: item.volume,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));

    const orderData = {
      table_id: currentTable?.id, 
      table_number: currentTable?.number,
      items: orderItems,
      total_amount: getTotalAmount(),
      customer_notes: customerNotes,
      status: "pendente", 
    };

    try {
      await Order.create(orderData);
      
      if (currentTable && currentTable.status === "livre") {
        await Table.update(currentTable.id, { 
          ...currentTable, 
          status: "ocupada" 
        });
      }
      
      setCart([]);
      setCustomerNotes("");
      setOrderSubmitted(true);
      setShowOrderSuccess(true);
      setIsCartSheetOpen(false); // Close cart sheet on successful order
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Erro ao enviar pedido. Por favor, tente novamente."); 
    } finally {
      setSubmittingOrder(false);
    }
  };

  const callWaiter = async () => { 
    if (settings?.features?.require_table_selection && !currentTable) {
      alert("É necessário escanear o QR Code de uma mesa para chamar o garçom.");
      return;
    }
    setCallingWaiter(true); 
    setWaiterCalled(false); 
    try {
      await ServiceRequest.create({
        table_id: currentTable.id,
        table_number: currentTable.number,
        request_type: "call_waiter",
        status: "pending"
      });
      setWaiterCalled(true); 
      setTimeout(() => setWaiterCalled(false), 7000); 
    } catch (error) {
      console.error("Error calling waiter:", error);
      alert("Erro ao chamar garçom. Tente novamente."); 
    } finally {
      setCallingWaiter(false);
    }
  };

  const businessName = settings?.business_name || "BierServ";
  const businessSubtitle = settings?.business_subtitle || "Cervejaria Digital";
  const showPrices = settings?.features?.show_prices_public !== false;
  const logoUrl = settings?.logo_url;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Beer className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Carregando Cardápio...</h2>
          <p className="text-slate-500 dark:text-slate-400">Um momento, estamos preparando o melhor para você.</p>
        </div>
      </div>
    );
  }
  
  if (settings && settings.features?.require_table_selection && !currentTable) {
     const urlParams = new URLSearchParams(window.location.search);
     const tableCodeParam = urlParams.get('table');
     
     if (tableCodeParam) { 
        return (
          <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-red-900/30 dark:to-orange-900/30 flex items-center justify-center p-6 text-center">
            <div>
                <div className="w-24 h-24 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Mesa Inválida ou Não Encontrada</h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg mb-6 max-w-md mx-auto">
                    O QR Code escaneado não corresponde a uma mesa válida ({tableCodeParam}). Por favor, tente escanear novamente ou chame um atendente.
                </p>
                <Button onClick={() => window.location.href = window.location.origin + window.location.pathname} variant="outline" className="dark:text-white">
                    Tentar Novamente Sem Mesa
                </Button>
            </div>
          </div>
        );
     } else {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 flex items-center justify-center p-6 text-center">
            <div>
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShoppingCart className="w-12 h-12 text-amber-500 dark:text-amber-400" /> 
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Bem-vindo ao {businessName}!</h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg mb-6 max-w-md mx-auto">
                    Para visualizar nosso cardápio e fazer pedidos, por favor, escaneie o QR Code disponível em sua mesa.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Se precisar de ajuda, chame um de nossos atendentes.
                </p>
            </div>
          </div>
        );
     }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 pb-20 sm:pb-24"> 
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={businessName} className="h-10 w-auto rounded-md"/>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-lg flex items-center justify-center shadow-md">
                  <Beer className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-50">{businessName}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{businessSubtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentTable && (
                <Button 
                  onClick={callWaiter}
                  variant="outline" 
                  size="sm" 
                  className={`rounded-lg ${waiterCalled ? 'border-green-500 text-green-600 bg-green-50/50 dark:bg-green-900/30 dark:border-green-400 dark:text-green-400' : 'border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-900/30'}`}
                  disabled={callingWaiter || waiterCalled}
                >
                  {callingWaiter ? <div className="w-3 h-3 mr-1.5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /> :
                   waiterCalled ? <CheckCircle className="w-3 h-3 mr-1.5" /> : 
                   <BellRing className="w-3 h-3 mr-1.5" />}
                  {callingWaiter ? "Chamando..." : waiterCalled ? "Chamado!" : "Garçom"}
                </Button>
              )}
              
              {(settings?.features?.require_table_selection ? currentTable : true) && (
                <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="relative rounded-lg px-3 py-1.5 text-xs sm:text-sm shadow-md hover:shadow-lg dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                      <ShoppingCart className="w-3.5 h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Carrinho</span>
                      {cart.length > 0 && (
                        <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 text-xs px-1.5 py-0.5 rounded-full shadow-md bg-red-600 text-white">
                          {cart.reduce((acc, item) => acc + item.quantity, 0)}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg bg-white dark:bg-slate-800 flex flex-col">
                    <SheetHeader>
                      <SheetTitle className="text-slate-800 dark:text-slate-50">Seu Pedido</SheetTitle>
                      {currentTable && (
                        <SheetDescription className="text-slate-500 dark:text-slate-400">
                          Mesa {currentTable.number} - Revise seus itens
                        </SheetDescription>
                      )}
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2"> 
                      {cart.length === 0 ? (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">Seu carrinho está vazio.</p>
                      ) : (
                        cart.map((item) => (
                          <div key={item.product_id + item.volume} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate" title={`${item.product_name} (${item.volume})`}>{item.product_name}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{item.volume}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="icon"
                                variant="outline"
                                className="w-7 h-7 p-0 rounded-md border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                onClick={() => removeFromCart(item.product_id, item.volume)}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="w-6 text-center font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="w-7 h-7 p-0 rounded-md border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                onClick={() => {
                                  const product = products.find(p => p.id === item.product_id);
                                  const variant = product?.price_variants?.find(v => v.volume === item.volume);
                                  if (product && variant) addToCart(product, variant);
                                }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                              {showPrices && (
                                <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400 w-16 text-right tabular-nums">
                                  R$ {item.total.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Textarea
                        placeholder="Observações do pedido (ex: sem cebola, ponto da carne, etc.)"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="text-sm rounded-lg border-slate-300 dark:border-slate-600 focus:ring-slate-500 mb-4 h-20"
                        rows={2}
                      />
                      
                      <div className="flex justify-between items-center text-lg font-bold mb-4">
                        <span className="text-slate-800 dark:text-slate-100">Total:</span>
                        {showPrices && (
                          <span className="text-emerald-600 dark:text-emerald-400">R$ {getTotalAmount().toFixed(2)}</span>
                        )}
                      </div>
                      <Button
                        onClick={submitOrder} 
                        disabled={submittingOrder || cart.length === 0 || (settings?.features?.require_table_selection && !currentTable)} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-base shadow-md hover:shadow-lg transition-shadow"
                      >
                        {submittingOrder ? (
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 mr-2" />
                        )}
                        {submittingOrder ? "Enviando..." : "Finalizar Pedido"}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>

          {currentTable && (
            <div className="mt-3 p-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-600/50">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">Mesa {currentTable.number}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{currentTable.capacity} lugares</span>
                </div>
                {currentTable.location && (
                  <span className="text-slate-600 dark:text-slate-300 hidden sm:inline">{currentTable.location}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-[83px] md:top-[85px] z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-2.5">
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0].id} className="w-full">
              <TabsList className="flex gap-2 overflow-x-auto scrollbar-hide bg-transparent p-0 rounded-none border-b border-slate-200 dark:border-slate-700">
                {categories.map((category) => {
                  const IconComponent = getCategoryIcon(category.name);
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className={`flex-shrink-0 flex-col py-2 px-3 text-xs sm:text-sm transition-all duration-200 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-700 dark:data-[state=active]:border-slate-50 data-[state=active]:text-slate-800 dark:data-[state=active]:text-slate-50 
                        ${'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100'}`}
                    >
                      <IconComponent className="w-4 h-4 mb-1" />
                      {category.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {categories.map((category) => {
                const categoryProducts = getProductsByCategory(category.id);
                return (
                  <TabsContent key={category.id} value={category.id} className="pt-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 max-w-2xl mx-auto">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                      {categoryProducts.length === 0 ? (
                        <div className="text-center py-16 col-span-full">
                          <Beer className="w-20 h-20 mx-auto mb-6 text-slate-400/70 opacity-60" />
                          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                            Ops! Categoria Vazia
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400">
                            Nenhum produto encontrado nesta categoria no momento.
                          </p>
                        </div>
                      ) : (
                        categoryProducts.map((product) => (
                          <Card key={product.id} className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/80 dark:border-slate-700/70 shadow-lg rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl">
                            {product.image_url && (
                              <div className="h-40 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center">
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                                />
                              </div>
                            )}
                            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                              <div>
                                <h3 className="text-md sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1 truncate" title={product.name}>
                                  {product.name}
                                </h3>
                                {product.description && (
                                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 leading-snug line-clamp-2">
                                    {product.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2 mt-2">
                                  {product.ibu != null && (
                                    <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-600 dark:text-teal-300 bg-white/50 dark:bg-slate-800/50">
                                      <Activity className="w-3 h-3 mr-1" /> {product.ibu} IBU
                                    </Badge>
                                  )}
                                  {product.abv != null && (
                                    <Badge variant="outline" className="border-pink-300 text-pink-700 dark:border-pink-600 dark:text-pink-300 bg-white/50 dark:bg-slate-800/50">
                                      <Percent className="w-3 h-3 mr-1" /> {product.abv}% ABV
                                    </Badge>
                                  )}
                                </div>

                                {product.harmonizacoes && product.harmonizacoes.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 mb-1">Harmoniza com:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {product.harmonizacoes.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {product.price_variants && product.price_variants.length > 0 && (
                                <div className="space-y-2.5 mt-auto pt-3">
                                  {product.price_variants.map((variant, index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-700/60 rounded-lg border border-slate-200/70 dark:border-slate-600/50"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                                          {variant.volume}
                                        </span>
                                        {showPrices && (
                                          <span className="text-sm sm:text-md font-bold text-emerald-600 dark:text-emerald-400">
                                            R$ {variant.price?.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {(settings?.features?.require_table_selection ? currentTable : true) && showPrices && ( 
                                        <div className="flex items-center gap-2">
                                          {getCartItemQuantity(product.id, variant.volume) > 0 ? (
                                            <div className="flex items-center gap-1.5">
                                              <Button
                                                size="icon"
                                                variant="outline"
                                                className="w-6 h-6 p-0 rounded-md border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                                onClick={() => removeFromCart(product.id, variant.volume)}
                                              >
                                                <Minus className="w-3.5 h-3.5" />
                                              </Button>
                                              <span className="w-5 text-center font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                                                {getCartItemQuantity(product.id, variant.volume)}
                                              </span>
                                              <Button
                                                size="icon"
                                                variant="outline"
                                                className="w-6 h-6 p-0 rounded-md border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                                onClick={() => addToCart(product, variant)}
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button
                                              size="sm"
                                              onClick={() => addToCart(product, variant)}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-1.5 text-xs shadow-md hover:shadow-lg transition-shadow"
                                            >
                                              <Plus className="w-3.5 h-3.5 sm:mr-1" />
                                              <span className="hidden sm:inline">Adicionar</span>
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-2">Nenhuma categoria disponível.</p>
          )}
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-6">
        {!categories.length && !loading && (
             <div className="text-center py-16 col-span-full">
                <Beer className="w-20 h-20 mx-auto mb-6 text-slate-400/70 opacity-60" />
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Nenhum Produto Disponível
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                    Parece que não há produtos cadastrados ou ativos no momento.
                </p>
            </div>
        )}
      </main>

      <footer className="container mx-auto px-4 py-6">
        {settings?.contact_info && (
          <div className="mt-8 p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 text-center shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-50 mb-3">Informações de Contato</h3>
            <div className="space-y-2 text-slate-700 dark:text-slate-200">
              {settings.contact_info.phone && (
                <p className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> 
                  {settings.contact_info.phone}
                </p>
              )}
              {settings.contact_info.address && (
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {settings.contact_info.address}
                </p>
              )}
            </div>
          </div>
        )}
      </footer>

      {/* Success Dialog */}
      <Dialog open={showOrderSuccess} onOpenChange={setShowOrderSuccess}>
        <DialogContent className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-green-600 dark:text-green-400">
              <CheckCircle className="w-8 h-8" />
              Pedido Enviado!
            </DialogTitle>
            <DialogDescription className="mt-2 text-slate-600 dark:text-slate-300 text-base">
              Seu pedido foi enviado com sucesso. 
              Aguarde e nosso garçom irá atendê-lo em breve.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowOrderSuccess(false)} className="bg-green-600 hover:bg-green-700 text-white">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button */}
      {(settings?.features?.require_table_selection ? currentTable : true) && showFloatingCartButton && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <Button
            onClick={() => setIsCartSheetOpen(true)}
            size="lg"
            className="rounded-full shadow-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-800 text-white p-4 h-16 w-16"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 text-sm px-2 py-1 rounded-full shadow-md bg-red-600 text-white">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
