
import React, { useState, useEffect, useCallback } from "react";
import { Product, Category, SystemSettings } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beer, Coffee, Wine, Wifi, WifiOff, Percent, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function MenuDisplay() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados para rotação de categorias
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  // Estados para paginação de produtos dentro de uma categoria
  const [currentProductPageIndex, setCurrentProductPageIndex] = useState(0);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Preferências de display (serão carregadas de SystemSettings)
  const [displayPrefs, setDisplayPrefs] = useState({
    displayed_category_ids: [],
    slide_interval_seconds: 10,
    auto_rotate_slides: true,
    show_prices_on_display: true,
    show_descriptions_on_display: true,
    show_harmonizations_on_display: true, // Added default
    // Novas prefs para paginação de produtos
    paginate_products: true,
    products_per_page: 6,
    auto_rotate_product_pages: true,
    product_page_interval_seconds: 8
  });

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [categoriesData, productsData, settingsData] = await Promise.all([
        Category.list("sort_order"),
        Product.list("sort_order"),
        SystemSettings.list()
      ]);

      const currentAppSettings = settingsData.length > 0 ? settingsData[0] : {};
      setAppSettings(currentAppSettings);

      // Atualizar displayPrefs com os valores do banco de dados
      if (currentAppSettings.display_preferences) {
        setDisplayPrefs(prev => ({
          ...prev,
          ...currentAppSettings.display_preferences,
          // Ensure new fields from outline are also set from DB if available, otherwise use current defaults
          show_harmonizations_on_display: currentAppSettings.display_preferences.show_harmonizations_on_display !== undefined ? currentAppSettings.display_preferences.show_harmonizations_on_display : prev.show_harmonizations_on_display,
          paginate_products: currentAppSettings.display_preferences.paginate_products !== undefined ? currentAppSettings.display_preferences.paginate_products : prev.paginate_products,
          products_per_page: currentAppSettings.display_preferences.products_per_page !== undefined ? currentAppSettings.display_preferences.products_per_page : prev.products_per_page,
          auto_rotate_product_pages: currentAppSettings.display_preferences.auto_rotate_product_pages !== undefined ? currentAppSettings.display_preferences.auto_rotate_product_pages : prev.auto_rotate_product_pages,
          product_page_interval_seconds: currentAppSettings.display_preferences.product_page_interval_seconds !== undefined ? currentAppSettings.display_preferences.product_page_interval_seconds : prev.product_page_interval_seconds,
        }));
      }

      let activeCategories = categoriesData.filter(cat => cat.is_active);
      // Use the potentially updated displayPrefs for filtering
      const effectiveDisplayCatIds = (currentAppSettings.display_preferences?.displayed_category_ids && currentAppSettings.display_preferences.displayed_category_ids.length > 0)
        ? currentAppSettings.display_preferences.displayed_category_ids
        : displayPrefs.displayed_category_ids; // Fallback to current state defaults if not in DB

      if (effectiveDisplayCatIds && effectiveDisplayCatIds.length > 0) {
        activeCategories = activeCategories.filter(cat =>
          effectiveDisplayCatIds.includes(cat.id)
        );
      }

      const availableProducts = productsData.filter(prod => prod.is_available);

      setCategories(activeCategories);
      setProducts(availableProducts);

      if (currentCategoryIndex >= activeCategories.length && activeCategories.length > 0) {
        setCurrentCategoryIndex(0);
      } else if (activeCategories.length === 0) {
        setCurrentCategoryIndex(0);
      }
      setCurrentProductPageIndex(0); // Resetar página de produto ao recarregar dados

    } catch (error) {
      console.error("Error loading menu data:", error);
    } finally {
      if (isInitial) {
        setLoading(false);
        setInitialLoadComplete(true);
      } else {
        setLoading(false); // Para recargas periódicas
      }
    }
  }, [currentCategoryIndex, displayPrefs.displayed_category_ids]); // Added displayPrefs fields as dependencies to ensure useCallback captures latest values

  useEffect(() => {
    loadData(true); // Initial load

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const dataRefreshInterval = setInterval(() => loadData(false), 300000);

    // --- Início da Lógica de Fullscreen ---
    const requestAppFullScreen = () => {
      const elem = document.documentElement; // Elemento raiz (html)
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.warn(`MenuDisplay: Erro ao tentar tela cheia: ${err.message} (${err.name})`);
        });
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen().catch(err => console.warn(`MenuDisplay: Firefox fullscreen error: ${err.message}`));
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari, Opera */
        elem.webkitRequestFullscreen().catch(err => console.warn(`MenuDisplay: Webkit fullscreen error: ${err.message}`));
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen().catch(err => console.warn(`MenuDisplay: MS fullscreen error: ${err.message}`));
      }
    };

    // Tenta entrar em tela cheia quando o componente é montado.
    // Isso pode ser bloqueado por alguns navegadores se não for originado de uma interação do usuário.
    // No entanto, para ambientes de TV ou "casting", pode funcionar.
    if (document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled) {
        // A API está disponível, então podemos tentar.
        // Um pequeno delay pode ajudar em alguns casos, permitindo que a página renderize primeiro.
        const fullscreenTimeout = setTimeout(requestAppFullScreen, 500);
        // Limpeza do timeout se o componente for desmontado antes
        // return () => clearTimeout(fullscreenTimeout); // Removido para não conflitar com o outro return
    } else {
        console.warn("MenuDisplay: API de tela cheia não está habilitada neste navegador/ambiente.");
    }
    // --- Fim da Lógica de Fullscreen ---

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataRefreshInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Opcional: Sair da tela cheia se o componente for desmontado,
      // mas para um display de TV, geralmente não é necessário.
      // if (document.exitFullscreen) { document.exitFullscreen(); }
      // else if (document.mozCancelFullScreen) { /* Firefox */ document.mozCancelFullScreen(); }
      // else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */ document.webkitExitFullscreen(); }
      // else if (document.msExitFullscreen) { /* IE/Edge */ document.msExitFullscreen(); }
    };
  }, [loadData]); // Usar loadData aqui

  // Timer para rotação de CATEGORIAS
  useEffect(() => {
    if (!initialLoadComplete || categories.length <= 1 || !displayPrefs.auto_rotate_slides) return;

    const categoryTimer = setInterval(() => {
      setCurrentCategoryIndex(prev => (prev + 1) % categories.length);
      setCurrentProductPageIndex(0); // Resetar página de produto ao mudar de categoria
    }, (displayPrefs.slide_interval_seconds || 10) * 1000);

    return () => clearInterval(categoryTimer);
  }, [initialLoadComplete, categories, displayPrefs.auto_rotate_slides, displayPrefs.slide_interval_seconds]);

  const currentCategory = initialLoadComplete && categories.length > 0 ? categories[currentCategoryIndex] : null;
  const productsForCurrentCategory = currentCategory
    ? products.filter(p => p.category_id === currentCategory.id && p.is_available)
    : [];

  const totalProductPages = displayPrefs.paginate_products && currentCategory && productsForCurrentCategory.length > 0
    ? Math.ceil(productsForCurrentCategory.length / (displayPrefs.products_per_page || 6)) // Ajustado para usar o default 6
    : 1;

  // Timer para rotação de PÁGINAS DE PRODUTOS
  useEffect(() => {
    if (!initialLoadComplete || !currentCategory || totalProductPages <= 1 || !displayPrefs.auto_rotate_product_pages) {
      return;
    }

    const productPageTimer = setInterval(() => {
      setCurrentProductPageIndex(prev => (prev + 1) % totalProductPages);
    }, (displayPrefs.product_page_interval_seconds || 8) * 1000);

    return () => clearInterval(productPageTimer);
  }, [initialLoadComplete, currentCategory, totalProductPages, displayPrefs.auto_rotate_product_pages, displayPrefs.product_page_interval_seconds]);


  const getPaginatedProducts = () => {
    if (!currentCategory || !displayPrefs.paginate_products) {
      return productsForCurrentCategory;
    }
    const startIndex = currentProductPageIndex * (displayPrefs.products_per_page || 6); // Ajustado para usar o default 6
    const endIndex = startIndex + (displayPrefs.products_per_page || 6); // Ajustado para usar o default 6
    return productsForCurrentCategory.slice(startIndex, endIndex);
  };

  const visibleProducts = getPaginatedProducts();

  const changeProductPage = (direction) => {
    setCurrentProductPageIndex(prev => {
      const newPage = prev + direction;
      if (newPage < 0) return totalProductPages - 1;
      if (newPage >= totalProductPages) return 0;
      return newPage;
    });
  };

  const getCategoryIcon = (categoryName = "") => {
    const name = categoryName.toLowerCase();
    if (name.includes("pilsen") || name.includes("weizen") || name.includes("beer") || name.includes("cerveja")) return Beer;
    if (name.includes("coffee") || name.includes("café")) return Coffee;
    if (name.includes("wine") || name.includes("vinho")) return Wine;
    return Beer;
  };

  if (loading && !initialLoadComplete) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Beer className="w-10 h-10" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-3">Carregando Cardápio...</h2>
          <p className="text-slate-300 text-lg lg:text-xl">Preparando o melhor para você</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        html, body, #__next {
          height: 100vh !important;
          width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: #0f172a; /* Cor de fundo do gradiente escuro */
          position: fixed !important; /* Forçar posicionamento fixo */
          top: 0 !important;
          left: 0 !important;
        }
      `}</style>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white">
        {/* Header */}
        <div className="bg-black/50 backdrop-blur-md border-b border-slate-700/40 px-3 py-2 md:px-4 md:py-3 rounded-t-lg flex-shrink-0">
          <div className="flex justify-between items-center max-w-full mx-auto">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-200 to-slate-400 rounded-lg flex items-center justify-center shadow-lg p-1">
                {appSettings?.logo_url ? (
                  <img src={appSettings.logo_url} alt="Logo" className="w-full h-full object-contain rounded-sm"/>
                ) : (
                  <Beer className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-slate-900" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {appSettings?.business_name || "BierServ"}
                </h1>
                {appSettings?.business_subtitle && (
                  <p className="text-base md:text-lg lg:text-xl text-slate-300 font-medium">
                    {appSettings.business_subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs md:text-sm lg:text-base ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {isOnline ? <Wifi className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" /> : <WifiOff className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />}
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
              <div className="text-right">
                <div className="text-lg md:text-xl lg:text-2xl font-bold">
                  {format(currentTime, "HH:mm")}
                </div>
                <div className="text-xs md:text-sm lg:text-base text-slate-300">
                  {format(currentTime, "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-grow overflow-y-auto p-2 md:p-3">
          {!initialLoadComplete && loading && (
               <div className="text-center py-10">
                  <p className="text-slate-300 text-lg lg:text-xl">Aguardando dados iniciais...</p>
               </div>
          )}
          {initialLoadComplete && categories.length === 0 && !loading && (
            <div className="text-center py-12 md:py-20">
              <Beer className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 text-slate-400 opacity-50" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Cardápio em Preparação</h2>
              <p className="text-slate-300 text-md md:text-lg lg:text-xl">
                Nenhum item configurado para exibição ou produtos sendo atualizados.
              </p>
            </div>
          )}

          {initialLoadComplete && categories.length > 0 && currentCategory && (
            <>
              {/* Indicadores de Rotação de Categoria */}
              {categories.length > 1 && displayPrefs.auto_rotate_slides && (
                <div className="flex justify-center mb-2 md:mb-4">
                  <div className="flex gap-1.5 md:gap-2">
                    {categories.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => { setCurrentCategoryIndex(index); setCurrentProductPageIndex(0); }}
                        className={`w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                          index === currentCategoryIndex
                            ? "bg-white scale-125 shadow-sm"
                            : "bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Ir para categoria ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="max-w-full mx-auto">
                <div className="text-center mb-2 md:mb-4"> {/* Diminuído margin bottom */}
                  <div className="flex justify-center items-center gap-3 mb-2 md:mb-3">
                    {(() => {
                      const IconComponent = getCategoryIcon(currentCategory.name);
                      return (
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
                          <IconComponent className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                        </div>
                      );
                    })()}
                   <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                      {currentCategory.name}
                    </h2>
                  </div>
                  {currentCategory.description && displayPrefs.show_descriptions_on_display && (
                    <p className="text-sm md:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed px-2 mb-1 md:mb-2">
                      {currentCategory.description}
                    </p>
                  )}
                </div>

                {/* PRODUCT GRID (2 Columns, Horizontal Cards) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-2 md:gap-x-3 gap-y-2 md:gap-y-3 pb-2">
                  {visibleProducts.map((product) => (
                    <div key={product.id} className="group">
                      <Card className="bg-white/10 backdrop-blur-md border-white/15 hover:bg-white/15 transition-all duration-300 overflow-hidden h-full flex shadow-lg hover:shadow-xl rounded-lg">
                        {/* Image Section */}
                        {product.image_url ? (
                          <div className="w-2/5 md:w-1/3 flex-shrink-0 bg-black/10 flex items-center justify-center p-1.5 md:p-2 relative">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-auto max-h-[100px] md:max-h-[120px] lg:max-h-[130px] object-contain group-hover:scale-105 transition-transform duration-500" // Reduced max-h
                            />
                            {product.coming_soon && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-amber-600/90 text-white font-bold text-xs md:text-sm lg:text-base px-3 py-1 rounded-md transform -rotate-12 shadow-lg backdrop-blur-sm border border-amber-500">
                                  Em Breve
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                           <div className="w-2/5 md:w-1/3 flex-shrink-0 bg-slate-700/50 flex items-center justify-center p-1.5 md:p-2 relative">
                              <Beer className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white/30" />
                              {product.coming_soon && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-amber-600/90 text-white font-bold text-xs md:text-sm lg:text-base px-3 py-1 rounded-md transform -rotate-12 shadow-lg backdrop-blur-sm border border-amber-500">
                                    Em Breve
                                  </div>
                                </div>
                              )}
                           </div>
                        )}

                        {/* Content Section */}
                        <CardContent className="p-2 md:p-3 flex-grow flex flex-col justify-between"> {/* Reduced padding */}
                          <div>
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-50 mb-1 group-hover:text-white transition-colors leading-tight">
                              {product.name}
                            </h3>

                            {displayPrefs.show_descriptions_on_display && product.description && (
                              <p className="text-sm md:text-base lg:text-lg text-slate-300 mb-1.5 leading-snug max-h-10 md:max-h-12 lg:max-h-14 overflow-hidden"> {/* Reduced max-h */}
                                {product.description}
                              </p>
                            )}

                            {/* IBU, ABV, and Harmonizacoes in a single flex row */}
                            <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5 mb-1.5">
                              {product.ibu != null && (
                                <Badge variant="outline" className="border-teal-500/70 text-teal-200 bg-teal-900/50 text-xs md:text-sm lg:text-base px-2 py-1">
                                  <Activity className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 mr-1" /> {product.ibu} IBU
                                </Badge>
                              )}
                              {product.abv != null && (
                                <Badge variant="outline" className="border-pink-500/70 text-pink-200 bg-pink-900/50 text-xs md:text-sm lg:text-base px-2 py-1">
                                  <Percent className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 mr-1" /> {product.abv}% ABV
                                </Badge>
                              )}
                              {displayPrefs.show_harmonizations_on_display && product.harmonizacoes && product.harmonizacoes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {product.harmonizacoes.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-[10px] md:text-xs lg:text-sm bg-amber-900/50 text-amber-200 px-2 py-0.5">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {product.harmonizacoes.length > 2 && (
                                    <Badge variant="secondary" className="text-[10px] md:text-xs lg:text-sm bg-gray-800/50 text-gray-300 px-1.5 py-0.5">
                                      +{product.harmonizacoes.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Price Variants - Showing up to 2 with smaller font */}
                          {displayPrefs.show_prices_on_display && product.price_variants && product.price_variants.length > 0 && !product.coming_soon && (
                            <div className="space-y-1 mt-auto">
                              {product.price_variants.slice(0, 2).map((variant, variantIndex) => (
                                <div
                                  key={variantIndex}
                                  className="flex justify-between items-center p-1 bg-black/30 rounded text-sm md:text-base lg:text-lg border border-white/10 backdrop-blur-sm" /* Reduced padding */
                                >
                                  <span className="font-medium text-slate-100 truncate max-w-[70px] md:max-w-[100px] lg:max-w-[120px]" title={variant.volume}>
                                    {variant.volume}
                                  </span>
                                  <span className="text-base md:text-lg lg:text-xl font-bold text-green-300 drop-shadow-sm">
                                    R$ {variant.price?.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {/* Show indicator if there are more variants */}
                              {product.price_variants.length > 2 && (
                                <div className="text-center">
                                  <span className="text-xs text-slate-400">
                                    +{product.price_variants.length - 2} opções
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Coming Soon Message instead of prices */}
                          {product.coming_soon && (
                            <div className="mt-auto">
                              <div className="p-1.5 bg-amber-900/30 rounded text-center border border-amber-700/50"> {/* Reduced padding */}
                                <span className="text-sm md:text-base lg:text-lg font-bold text-amber-200">
                                  Em Breve
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Navegação e Indicadores de Página de Produtos */}
                {displayPrefs.paginate_products && totalProductPages > 1 && (
                  <div className="flex items-center justify-center mt-2 md:mt-3 space-x-2 md:space-x-3">
                    {!displayPrefs.auto_rotate_product_pages && (
                      <Button variant="outline" size="icon" onClick={() => changeProductPage(-1)} className="bg-white/10 hover:bg-white/20 border-white/20 h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9">
                        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                      </Button>
                    )}
                    {Array.from({ length: totalProductPages }).map((_, pageIndex) => (
                      <button
                        key={pageIndex}
                        onClick={() => setCurrentProductPageIndex(pageIndex)}
                        className={`w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                          pageIndex === currentProductPageIndex
                            ? "bg-white scale-125"
                            : "bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Ir para página de produtos ${pageIndex + 1}`}
                      />
                    ))}
                    {!displayPrefs.auto_rotate_product_pages && (
                      <Button variant="outline" size="icon" onClick={() => changeProductPage(1)} className="bg-white/10 hover:bg-white/20 border-white/20 h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9">
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                      </Button>
                    )}
                  </div>
                )}

                {initialLoadComplete && productsForCurrentCategory.length === 0 && !loading && (
                  <div className="text-center py-12 md:py-20">
                    <Beer className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-4 text-slate-400 opacity-50" />
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-300 mb-2">
                      Categoria Vazia
                    </h3>
                    <p className="text-slate-400 text-sm md:text-base lg:text-lg">
                      Nenhum produto disponível nesta categoria no momento.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/60 backdrop-blur-sm border-t border-slate-700/50 px-3 py-1.5 md:px-4 md:py-2 rounded-b-lg flex-shrink-0">
          <div className="flex justify-center items-center">
            <p className="text-slate-300 text-xs md:text-sm lg:text-base font-medium">
              {appSettings?.business_name || "BierServ"} - Cardápio Digital
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
