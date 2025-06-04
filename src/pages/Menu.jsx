import React, { useState, useEffect } from "react";
import { Product, Category } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Beer, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CategoryManager from "../components/menu/CategoryManager";
import ProductManager from "../components/menu/ProductManager";
import MenuPreview from "../components/menu/MenuPreview";

export default function Menu() {
  const [activeTab, setActiveTab] = useState("preview");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        Category.list("sort_order"),
        Product.list("sort_order")
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-amber-200 rounded w-64"></div>
            <div className="h-96 bg-amber-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
              Cardápio Digital
            </h1>
            <p className="text-amber-700 dark:text-amber-300">
              Gerencie categorias, produtos e visualize o cardápio
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-gray-900/50">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Beer className="w-4 h-4" />
              Visualizar Cardápio
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Produtos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            <MenuPreview categories={categories} products={products} />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryManager 
              categories={categories} 
              onUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductManager 
              products={products}
              categories={categories}
              onUpdate={loadData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}