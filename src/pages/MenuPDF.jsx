import React, { useState, useEffect } from "react";
import { Product, Category, SystemSettings } from "@/api/entities";
import { Beer, Coffee, Wine, Percent, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MenuPDF() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, productsData, settingsData] = await Promise.all([
        Category.list("sort_order"),
        Product.list("sort_order"),
        SystemSettings.list(),
      ]);
      
      setCategories(categoriesData.filter(cat => cat.is_active));
      setProducts(productsData.filter(prod => prod.is_available));
      
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading menu data for PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = (categoryId) => {
    return products.filter(product => product.category_id === categoryId);
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("pilsen") || name.includes("weizen") || name.includes("beer") || name.includes("cerveja")) return Beer;
    if (name.includes("coffee") || name.includes("café")) return Coffee;
    if (name.includes("wine") || name.includes("vinho")) return Wine;
    return Beer;
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Beer className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-bounce" />
          <p className="text-lg text-gray-600">Carregando cardápio para impressão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="A4-page-container bg-white text-black p-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .A4-page-container, .A4-page-container * {
            visibility: visible;
          }
          .A4-page-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 10mm;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
          .product-card-pdf {
            page-break-inside: avoid;
          }
          h1, h2, h3, p, span, div {
            color: #000 !important;
            -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
          }
           .price-variant-pdf span {
             color: #000 !important; 
           }
           .category-header-pdf {
             page-break-after: avoid;
           }
        }
        .A4-page-container {
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border: 1px solid #ddd;
        }
      `}</style>

      <Button onClick={() => window.print()} className="no-print fixed top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow-lg z-50">
        Imprimir / Salvar PDF
      </Button>

      <header className="text-center mb-10 border-b-2 border-gray-300 pb-6">
        {settings.logo_url && (
          <img src={settings.logo_url} alt={settings.business_name} className="h-24 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-4xl font-bold text-gray-800">{settings.business_name}</h1>
        {settings.business_subtitle && (
          <p className="text-xl text-gray-600 mt-1">{settings.business_subtitle}</p>
        )}
      </header>
      
      <div className="space-y-10">
        {categories.map((category) => {
          const categoryProducts = getProductsByCategory(category.id);
          if (categoryProducts.length === 0) return null;
          const Icon = getCategoryIcon(category.name);

          return (
            <section key={category.id} className="category-section-pdf mb-8 break-inside-avoid">
              <div className="category-header-pdf flex items-start justify-between mb-4 border-b border-gray-200 pb-2">
                <div className="flex items-center">
                  <Icon className="w-7 h-7 mr-3 text-gray-700" />
                  <h2 className="text-3xl font-semibold text-gray-700">{category.name}</h2>
                </div>
              </div>
              {category.description && (
                <p className="text-gray-600 mb-4 italic text-sm">{category.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryProducts.map((product) => (
                  <div key={product.id} className="product-card-pdf border border-gray-200 rounded-lg p-4 shadow-sm break-inside-avoid">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="text-xl font-medium text-gray-800">{product.name}</h3>
                            {product.description && (
                            <p className="text-xs text-gray-500 mt-1 mb-2">{product.description}</p>
                            )}

                            {/* IBU e ABV do produto */}
                            <div className="flex flex-wrap gap-2 mt-2 mb-2">
                              {product.ibu != null && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                                  <Activity className="w-3 h-3 mr-1" /> {product.ibu} IBU
                                </span>
                              )}
                              {product.abv != null && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded-full">
                                  <Percent className="w-3 h-3 mr-1" /> {product.abv}% ABV
                                </span>
                              )}
                            </div>

                            {/* Harmonizações do produto */}
                            {product.harmonizacoes && product.harmonizacoes.length > 0 && (
                              <div className="mt-2 mb-2">
                                <span className="text-xs font-semibold text-gray-700 mr-1">Harmoniza com:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {product.harmonizacoes.map((tag, index) => (
                                    <span key={index} className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                    </div>
                    
                    {product.price_variants && product.price_variants.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {product.price_variants.map((variant, index) => (
                          <div key={index} className="price-variant-pdf flex justify-between items-baseline text-sm border-t border-gray-100 pt-1">
                            <span className="text-gray-700">{variant.volume}</span>
                            <span className="font-semibold text-gray-800">
                              R$ {variant.price?.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="text-center mt-12 pt-6 border-t-2 border-gray-300">
        {settings.contact_info?.phone && <p className="text-sm text-gray-500">Telefone: {settings.contact_info.phone}</p>}
        {settings.contact_info?.address && <p className="text-sm text-gray-500">Endereço: {settings.contact_info.address}</p>}
        <p className="text-xs text-gray-400 mt-4">Cardápio gerado em: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
      </footer>
    </div>
  );
}