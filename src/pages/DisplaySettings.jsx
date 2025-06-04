
import React, { useState, useEffect } from "react";
import { SystemSettings, Category } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Tv, 
  Settings, 
  Play, 
  ExternalLink,
  Monitor,
  Clock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  ListChecks, 
  RotateCw,
  Sparkles // Icon for harmonizations
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";

export default function DisplaySettings() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Efeito para carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, categoriesData] = await Promise.all([
        SystemSettings.list(),
        Category.list("sort_order")
      ]);
      
      if (settingsData.length > 0) {
        // Garante que display_preferences exista e tenha os novos campos com defaults se não vierem do DB
        const loadedSettings = settingsData[0];
        loadedSettings.display_preferences = {
          displayed_category_ids: [],
          slide_interval_seconds: 10,
          auto_rotate_slides: true,
          show_prices_on_display: true,
          show_descriptions_on_display: true,
          show_harmonizations_on_display: true, // Added default
          paginate_products: false,
          products_per_page: 4,
          auto_rotate_product_pages: false,
          product_page_interval_seconds: 7,
          ...(loadedSettings.display_preferences || {}) // Sobrescreve defaults com valores do DB
        };
        setSettings(loadedSettings);
      } else {
        // Cria default settings com as novas preferências
        const defaultSettings = {
          business_name: "BierServ",
          business_subtitle: "Cervejaria Digital",
          display_preferences: {
            displayed_category_ids: [],
            slide_interval_seconds: 10,
            auto_rotate_slides: true,
            show_prices_on_display: true,
            show_descriptions_on_display: true,
            show_harmonizations_on_display: true, // Added default
            paginate_products: false,
            products_per_page: 4,
            auto_rotate_product_pages: false,
            product_page_interval_seconds: 7
          }
        };
        const created = await SystemSettings.create(defaultSettings);
        setSettings(created);
      }
      
      setCategories(categoriesData.filter(cat => cat.is_active));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Garante que todos os campos de display_preferences são enviados, mesmo que não alterados
      const settingsToSave = {
        ...settings,
        display_preferences: {
          // Defaults para garantir que não sejam nulos se o usuário desmarcar e não houver valor salvo
          displayed_category_ids: settings.display_preferences?.displayed_category_ids || [],
          slide_interval_seconds: settings.display_preferences?.slide_interval_seconds || 10,
          auto_rotate_slides: settings.display_preferences?.auto_rotate_slides ?? true,
          show_prices_on_display: settings.display_preferences?.show_prices_on_display ?? true,
          show_descriptions_on_display: settings.display_preferences?.show_descriptions_on_display ?? true,
          show_harmonizations_on_display: settings.display_preferences?.show_harmonizations_on_display ?? true, // Added
          paginate_products: settings.display_preferences?.paginate_products ?? false,
          products_per_page: settings.display_preferences?.products_per_page || 4,
          auto_rotate_product_pages: settings.display_preferences?.auto_rotate_product_pages ?? false,
          product_page_interval_seconds: settings.display_preferences?.product_page_interval_seconds || 7,
        }
      };
      await SystemSettings.update(settings.id, settingsToSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateDisplayPreference = (key, value) => {
    setSettings(prev => ({
      ...prev,
      display_preferences: {
        ...(prev.display_preferences || {}), // Garante que display_preferences exista
        [key]: value
      }
    }));
  };

  const toggleCategoryDisplay = (categoryId) => {
    const currentIds = settings.display_preferences.displayed_category_ids || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter(id => id !== categoryId)
      : [...currentIds, categoryId];
    
    updateDisplayPreference('displayed_category_ids', newIds);
  };

  const openTVDisplay = () => {
    const displayUrl = `${window.location.origin}${createPageUrl('MenuDisplay')}`;
    window.open(displayUrl, '_blank', 'fullscreen=yes,scrollbars=no,menubar=no,toolbar=no');
  };

  if (loading || !settings) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Assegura que display_preferences existe com os campos defaults
  const displayPrefs = settings.display_preferences || {
    displayed_category_ids: [],
    slide_interval_seconds: 10,
    auto_rotate_slides: true,
    show_prices_on_display: true,
    show_descriptions_on_display: true,
    show_harmonizations_on_display: true, // Added
    paginate_products: false,
    products_per_page: 4,
    auto_rotate_product_pages: false,
    product_page_interval_seconds: 7
  };

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-stone-50 to-zinc-50 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Configurações do Display para TV
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configure como o cardápio será exibido em TVs e projetores
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={openTVDisplay}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Display TV
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-1">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Exibição
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Eye className="w-5 h-5" />
                  Categorias para Exibição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Selecione quais categorias serão exibidas no display da TV. Se nenhuma for selecionada, todas as categorias ativas serão mostradas.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        displayPrefs.displayed_category_ids?.includes(category.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      onClick={() => toggleCategoryDisplay(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {displayPrefs.displayed_category_ids?.includes(category.id) ? (
                            <Eye className="w-5 h-5 text-blue-500" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">
                      Nenhuma categoria ativa encontrada. 
                      <br />
                      Vá para o Cardápio Digital para criar categorias.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Rotation Settings (Categories) */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Clock className="w-5 h-5" />
                    Rotação de Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-rotate" className="text-slate-700 dark:text-slate-300">
                      Rotação Automática de Categorias
                    </Label>
                    <Switch
                      id="auto-rotate"
                      checked={displayPrefs.auto_rotate_slides}
                      onCheckedChange={(checked) => updateDisplayPreference('auto_rotate_slides', checked)}
                    />
                  </div>
                  
                  {displayPrefs.auto_rotate_slides && (
                    <div className="space-y-2">
                      <Label htmlFor="interval" className="text-slate-700 dark:text-slate-300">
                        Intervalo (segundos)
                      </Label>
                      <Input
                        id="interval"
                        type="number"
                        value={displayPrefs.slide_interval_seconds || 10}
                        onChange={(e) => updateDisplayPreference('slide_interval_seconds', parseInt(e.target.value))}
                        min="5"
                        max="60"
                        className="border-slate-300 dark:border-slate-600"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Info Settings */}
              <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <Settings className="w-5 h-5" />
                    Informações Exibidas (Geral)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-prices" className="text-slate-700 dark:text-slate-300">
                      Mostrar Preços
                    </Label>
                    <Switch
                      id="show-prices"
                      checked={displayPrefs.show_prices_on_display}
                      onCheckedChange={(checked) => updateDisplayPreference('show_prices_on_display', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-descriptions" className="text-slate-700 dark:text-slate-300">
                      Mostrar Descrições
                    </Label>
                    <Switch
                      id="show-descriptions"
                      checked={displayPrefs.show_descriptions_on_display}
                      onCheckedChange={(checked) => updateDisplayPreference('show_descriptions_on_display', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-harmonizations" className="text-slate-700 dark:text-slate-300">
                      Exibir Harmonizações
                    </Label>
                    <Switch
                      id="show-harmonizations"
                      checked={displayPrefs.show_harmonizations_on_display}
                      onCheckedChange={(checked) => updateDisplayPreference('show_harmonizations_on_display', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Pagination and Rotation Settings */}
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <ListChecks className="w-5 h-5" />
                  Paginação de Produtos na Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="paginate-products" className="text-slate-700 dark:text-slate-300">
                    Habilitar Paginação de Produtos
                  </Label>
                  <Switch
                    id="paginate-products"
                    checked={displayPrefs.paginate_products}
                    onCheckedChange={(checked) => updateDisplayPreference('paginate_products', checked)}
                  />
                </div>
                {displayPrefs.paginate_products && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="products-per-page" className="text-slate-700 dark:text-slate-300">
                        Produtos por Página (Exibição TV)
                      </Label>
                      <Input
                        id="products-per-page"
                        type="number"
                        value={displayPrefs.products_per_page || 4}
                        onChange={(e) => updateDisplayPreference('products_per_page', parseInt(e.target.value))}
                        min="2" 
                        max="10" 
                        step="2" 
                        className="border-slate-300 dark:border-slate-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-rotate-product-pages" className="text-slate-700 dark:text-slate-300">
                        Rotação Automática de Páginas de Produtos
                      </Label>
                      <Switch
                        id="auto-rotate-product-pages"
                        checked={displayPrefs.auto_rotate_product_pages}
                        onCheckedChange={(checked) => updateDisplayPreference('auto_rotate_product_pages', checked)}
                      />
                    </div>
                    {displayPrefs.auto_rotate_product_pages && (
                       <div className="space-y-2">
                        <Label htmlFor="product-page-interval" className="text-slate-700 dark:text-slate-300">
                          Intervalo Rotação de Páginas de Produtos (segundos)
                        </Label>
                        <Input
                          id="product-page-interval"
                          type="number"
                          value={displayPrefs.product_page_interval_seconds || 7}
                          onChange={(e) => updateDisplayPreference('product_page_interval_seconds', parseInt(e.target.value))}
                          min="3"
                          max="30"
                          className="border-slate-300 dark:border-slate-600"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Tv className="w-5 h-5" />
                  Preview do Display
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-8 border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <Tv className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Display para TV
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Clique no botão abaixo para abrir o display em uma nova aba.
                      <br />
                      Ideal para TVs, projetores e dispositivos Chromecast.
                    </p>
                    <Button 
                      onClick={openTVDisplay}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Abrir Display em Nova Aba
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <Badge variant="outline" className="mb-2">
                        Categorias
                      </Badge>
                      <p className="text-slate-600 dark:text-slate-400">
                        {displayPrefs.displayed_category_ids?.length > 0 
                          ? `${displayPrefs.displayed_category_ids.length} selecionadas`
                          : "Todas as ativas"
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="mb-2">
                        Rotação
                      </Badge>
                      <p className="text-slate-600 dark:text-slate-400">
                        {displayPrefs.auto_rotate_slides 
                          ? `${displayPrefs.slide_interval_seconds}s (Cat.)`
                          : "Desabilitada (Cat.)"
                        }
                        {displayPrefs.paginate_products && displayPrefs.auto_rotate_product_pages && (
                          ` / ${displayPrefs.product_page_interval_seconds}s (Prod.)`
                        )}
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="mb-2">
                        Paginação Prod.
                      </Badge>
                      <p className="text-slate-600 dark:text-slate-400">
                        {displayPrefs.paginate_products 
                          ? `Sim (${displayPrefs.products_per_page}/pág)` 
                          : "Não"}
                      </p>
                    </div>
                     <div className="text-center">
                      <Badge variant="outline" className="mb-2 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Harmonizações
                      </Badge>
                      <p className="text-slate-600 dark:text-slate-400">
                        {displayPrefs.show_harmonizations_on_display ? "Sim" : "Não"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
