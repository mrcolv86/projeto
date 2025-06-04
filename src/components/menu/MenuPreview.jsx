import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beer, Coffee, Wine, Percent, Activity } from "lucide-react";

export default function MenuPreview({ categories, products }) {
  const getProductsByCategory = (categoryId) => {
    return products.filter(product => 
      product.category_id === categoryId && product.is_available
    );
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("pilsen") || name.includes("weizen") || name.includes("beer") || name.includes("cerveja")) return Beer;
    if (name.includes("coffee") || name.includes("café")) return Coffee;
    if (name.includes("wine") || name.includes("vinho")) return Wine;
    return Beer;
  };

  const activeCategories = categories.filter(cat => cat.is_active);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-4">
          Preview do Cardápio
        </h2>
        <p className="text-amber-600 dark:text-amber-400">
          Visualização de como o cardápio aparecerá para os clientes
        </p>
      </div>

      {activeCategories.map((category) => {
        const categoryProducts = getProductsByCategory(category.id);
        if (categoryProducts.length === 0) return null;
        
        const IconComponent = getCategoryIcon(category.name);

        return (
          <div key={category.id} className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {category.name}
                </h3>
              </div>
              {category.description && (
                <p className="text-amber-600 dark:text-amber-400 mb-4 max-w-2xl mx-auto">
                  {category.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <Card key={product.id} className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    {product.image_url && (
                      <div className="w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
                      {product.name}
                    </CardTitle>
                    {product.description && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        {product.description}
                      </p>
                    )}
                    
                    {/* IBU e ABV do produto */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {product.ibu != null && (
                        <Badge variant="outline" className="border-teal-400 text-teal-700 dark:border-teal-600 dark:text-teal-300">
                          <Activity className="w-3 h-3 mr-1" /> {product.ibu} IBU
                        </Badge>
                      )}
                      {product.abv != null && (
                        <Badge variant="outline" className="border-pink-400 text-pink-700 dark:border-pink-600 dark:text-pink-300">
                          <Percent className="w-3 h-3 mr-1" /> {product.abv}% ABV
                        </Badge>
                      )}
                    </div>

                    {/* Harmonizações do produto */}
                    {product.harmonizacoes && product.harmonizacoes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">Harmoniza com:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.harmonizacoes.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    {product.price_variants && product.price_variants.length > 0 && (
                      <div className="space-y-2">
                        {product.price_variants.map((variant, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                            <span className="font-medium text-amber-900 dark:text-amber-100">
                              {variant.volume}
                            </span>
                            <span className="text-lg font-bold text-amber-800 dark:text-amber-200">
                              R$ {variant.price?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {activeCategories.length === 0 && (
        <div className="text-center py-20">
          <Beer className="w-20 h-20 mx-auto mb-6 text-amber-400 opacity-50" />
          <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-3">
            Nenhuma categoria ativa
          </h3>
          <p className="text-amber-600 dark:text-amber-400">
            Ative pelo menos uma categoria para visualizar o cardápio
          </p>
        </div>
      )}
    </div>
  );
}