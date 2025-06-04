
import React, { useState, useEffect, useCallback } from "react";
import { Product } from "@/api/entities";
import { SystemSettings } from "@/api/entities"; // Import SystemSettings
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Beer, Eye, EyeOff, UploadCloud, Image as ImageIcon, RotateCcw, Percent, Activity, Tag as TagIcon, X, ListPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations";

export default function ProductManager({ products, categories, onUpdate }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    image_url: "",
    price_variants: [{ volume: "", price: 0 }],
    is_available: true,
    coming_soon: false, // Added coming_soon field
    sort_order: 0,
    ibu: null,
    abv: null,
    harmonizacoes: []
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [systemSettingsInstance, setSystemSettingsInstance] = useState(null);
  const [globalVolumeVariations, setGlobalVolumeVariations] = useState([]);
  const [showVolumeVariationSuggestions, setShowVolumeVariationSuggestions] = useState(false);

  const [globalHarmonizationTags, setGlobalHarmonizationTags] = useState([]);
  const [currentHarmonizacaoInput, setCurrentHarmonizacaoInput] = useState("");
  const [showHarmonizacaoSuggestions, setShowHarmonizacaoSuggestions] = useState(false);

  // Novos estados para templates de variações com preço
  const [globalPriceVariationTemplates, setGlobalPriceVariationTemplates] = useState([]);
  const [showPriceTemplatesSuggestions, setShowPriceTemplatesSuggestions] = useState(false);
  
  const [isSystemSettingsLoading, setIsSystemSettingsLoading] = useState(true);

  const loadSystemSettings = useCallback(async () => {
    setIsSystemSettingsLoading(true);
    try {
      const settingsList = await SystemSettings.list();
      if (settingsList.length > 0) {
        const currentSettings = settingsList[0];
        setSystemSettingsInstance(currentSettings);
        setGlobalVolumeVariations(currentSettings.global_volume_variation_names || []);
        setGlobalHarmonizationTags(currentSettings.global_harmonization_tags || []);
        setGlobalPriceVariationTemplates(currentSettings.global_price_variation_templates || []);
      } else {
        // Handle case where no settings exist, though ideally one should always exist
        console.warn("SystemSettings não encontradas. Criando uma padrão implicitamente (idealmente deveria ser criada na inicialização do app).");
        // Potentially create one if absolutely necessary, or rely on defaults
        setGlobalVolumeVariations([]);
        setGlobalHarmonizationTags([]);
        setGlobalPriceVariationTemplates([]);
      }
    } catch (error) {
      console.error("Erro ao carregar SystemSettings:", error);
    } finally {
      setIsSystemSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystemSettings();
  }, [loadSystemSettings]);

  // --- Volume Variation Management ---
  const saveGlobalVolumeVariationName = async (volumeName) => {
    if (!volumeName || volumeName.trim() === '' || isSystemSettingsLoading || !systemSettingsInstance) return;
    const normalizedName = volumeName.trim();
    
    if (globalVolumeVariations.includes(normalizedName)) return;

    const updatedVariations = [...globalVolumeVariations, normalizedName].sort();
    setGlobalVolumeVariations(updatedVariations);

    try {
      await SystemSettings.update(systemSettingsInstance.id, {
        ...systemSettingsInstance,
        global_volume_variation_names: updatedVariations
      });
    } catch (error) {
      console.error('Erro ao atualizar SystemSettings com nova variação de volume:', error);
      // Consider re-fetching or reverting local state if saving fails
    }
  };
  
  const addSavedVolumeVariation = (savedVolumeName) => {
    setFormData(prev => ({
      ...prev,
      price_variants: [...prev.price_variants, { volume: savedVolumeName, price: 0 }]
    }));
    setShowVolumeVariationSuggestions(false);
  };

  // --- Price Variation Template Management ---
  // This function is not directly called from the UI, but its logic is incorporated
  // into `saveProductData` and the `useEffect` that extracts data from products.
  const addPriceVariationTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      price_variants: [...prev.price_variants, { volume: template.volume, price: template.price }]
    }));
    setShowPriceTemplatesSuggestions(false);
  };

  // --- Harmonization Tag Management ---
  const saveGlobalHarmonizationTag = async (tag) => {
    if (!tag || tag.trim() === '' || isSystemSettingsLoading || !systemSettingsInstance) return;
    const normalizedTag = tag.trim();

    if (globalHarmonizationTags.includes(normalizedTag)) return;

    const updatedTags = [...globalHarmonizationTags, normalizedTag].sort();
    setGlobalHarmonizationTags(updatedTags);
    
    try {
      await SystemSettings.update(systemSettingsInstance.id, {
        ...systemSettingsInstance,
        global_harmonization_tags: updatedTags
      });
    } catch (error) {
      console.error('Erro ao atualizar SystemSettings com nova tag de harmonização:', error);
      // Consider re-fetching or reverting local state if saving fails
    }
  };

  const handleAddHarmonizacao = (tagToAdd = currentHarmonizacaoInput) => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag !== "" && !formData.harmonizacoes.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        harmonizacoes: [...prev.harmonizacoes, trimmedTag]
      }));
      // A tag será salva globalmente quando o produto for salvo, se for nova.
    }
    setCurrentHarmonizacaoInput("");
    setShowHarmonizacaoSuggestions(false);
  };

  const handleRemoveHarmonizacao = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      harmonizacoes: prev.harmonizacoes.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Extrai e define variações, templates e tags globais a partir dos produtos existentes
  // se as listas globais estiverem vazias e os produtos já carregados.
  // Isso ajuda a popular as sugestões com dados já existentes.
  useEffect(() => {
    if (!isSystemSettingsLoading && products.length > 0 && systemSettingsInstance) {
      let newGlobalVolumes = new Set(systemSettingsInstance.global_volume_variation_names || []);
      let newGlobalTags = new Set(systemSettingsInstance.global_harmonization_tags || []);
      let newGlobalTemplates = [...(systemSettingsInstance.global_price_variation_templates || [])]; // Initialize with existing
      let changed = false;

      products.forEach(product => {
        product.price_variants?.forEach(variant => {
          if (variant.volume && variant.volume.trim() && !newGlobalVolumes.has(variant.volume.trim())) {
            newGlobalVolumes.add(variant.volume.trim());
            changed = true;
          }
          
          // Adicionar template de variação se não existir (volume + price)
          if (variant.volume && variant.volume.trim() && variant.price != null && variant.price >= 0) {
            const existingTemplate = newGlobalTemplates.find(
              template => template.volume === variant.volume.trim() && template.price === variant.price
            );
            if (!existingTemplate) {
              newGlobalTemplates.push({ volume: variant.volume.trim(), price: variant.price });
              changed = true;
            }
          }
        });
        product.harmonizacoes?.forEach(tag => {
          if (tag && tag.trim() && !newGlobalTags.has(tag.trim())) {
            newGlobalTags.add(tag.trim());
            changed = true;
          }
        });
      });

      if (changed) {
        const sortedVolumes = Array.from(newGlobalVolumes).sort();
        const sortedTags = Array.from(newGlobalTags).sort();
        // Sort templates by volume then by price
        const sortedTemplates = newGlobalTemplates.sort((a, b) => {
          if (a.volume < b.volume) return -1;
          if (a.volume > b.volume) return 1;
          return a.price - b.price;
        });
        
        setGlobalVolumeVariations(sortedVolumes);
        setGlobalHarmonizationTags(sortedTags);
        setGlobalPriceVariationTemplates(sortedTemplates);
        
        // Atualiza SystemSettings no banco
        const updateSettings = async () => {
          try {
            await SystemSettings.update(systemSettingsInstance.id, {
              ...systemSettingsInstance,
              global_volume_variation_names: sortedVolumes,
              global_harmonization_tags: sortedTags,
              global_price_variation_templates: sortedTemplates // Add to SystemSettings update
            });
          } catch (error) {
            console.error("Erro ao atualizar SystemSettings com dados extraídos dos produtos:", error);
          }
        };
        updateSettings();
      }
    }
  }, [products, systemSettingsInstance, isSystemSettingsLoading]);


  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      category_id: product.category_id || "",
      description: product.description || "",
      image_url: product.image_url || "",
      price_variants: product.price_variants && product.price_variants.length > 0 ? product.price_variants : [{ volume: "", price: 0 }],
      is_available: product.is_available !== false,
      coming_soon: product.coming_soon || false, // Added coming_soon
      sort_order: product.sort_order || 0,
      ibu: product.ibu === undefined ? null : product.ibu,
      abv: product.abv === undefined ? null : product.abv,
      harmonizacoes: product.harmonizacoes || []
    });
    setSelectedFile(null);
    setCurrentHarmonizacaoInput("");
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      description: "",
      image_url: "",
      price_variants: [{ volume: "", price: 0 }],
      is_available: true,
      coming_soon: false, // Added coming_soon
      sort_order: products.length,
      ibu: null,
      abv: null,
      harmonizacoes: []
    });
    setSelectedFile(null);
    setCurrentHarmonizacaoInput("");
    setShowDialog(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const saveProductData = async (productData) => {
    let newGlobalVolumesToAdd = [];
    let newGlobalTagsToAdd = [];
    let newGlobalTemplatesToAdd = []; // New array for new templates

    if (productData.price_variants && Array.isArray(productData.price_variants)) {
      productData.price_variants.forEach(variant => {
        if (variant.volume && variant.volume.trim() && !globalVolumeVariations.includes(variant.volume.trim())) {
          newGlobalVolumesToAdd.push(variant.volume.trim());
        }
        
        // Verificar se o template (volume + preço) já existe globalmente
        if (variant.volume && variant.volume.trim() && variant.price != null && variant.price >= 0) {
          const existingTemplate = globalPriceVariationTemplates.find(
            template => template.volume === variant.volume.trim() && template.price === variant.price
          );
          // E também verificar se já foi adicionado para ser salvo nesta operação
          const alreadyAdding = newGlobalTemplatesToAdd.find(
            template => template.volume === variant.volume.trim() && template.price === variant.price
          );
          if (!existingTemplate && !alreadyAdding) {
            newGlobalTemplatesToAdd.push({ volume: variant.volume.trim(), price: variant.price });
          }
        }
      });
    }
    if (productData.harmonizacoes && Array.isArray(productData.harmonizacoes)) {
      productData.harmonizacoes.forEach(tag => {
        if (tag && tag.trim() && !globalHarmonizationTags.includes(tag.trim())) {
          newGlobalTagsToAdd.push(tag.trim());
        }
      });
    }
    
    // Salvar o produto primeiro
    try {
      if (editingProduct) {
        await Product.update(editingProduct.id, productData);
      } else {
        await Product.create(productData);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto.");
      setUploading(false);
      return; // Interrompe se o salvamento do produto falhar
    }

    // Se o produto foi salvo e há novos itens globais, atualiza SystemSettings
    if ((newGlobalVolumesToAdd.length > 0 || newGlobalTagsToAdd.length > 0 || newGlobalTemplatesToAdd.length > 0) && systemSettingsInstance) {
      const updatedGlobalVolumes = [...new Set([...globalVolumeVariations, ...newGlobalVolumesToAdd])].sort();
      const updatedGlobalTags = [...new Set([...globalHarmonizationTags, ...newGlobalTagsToAdd])].sort();
      
      // Combine existing and new templates, filter for unique ones, then sort
      const combinedTemplates = [...globalPriceVariationTemplates, ...newGlobalTemplatesToAdd];
      const updatedGlobalTemplates = combinedTemplates
        .filter((template, index, self) => 
          index === self.findIndex(t => t.volume === template.volume && t.price === template.price)
        )
        .sort((a, b) => {
          if (a.volume < b.volume) return -1;
          if (a.volume > b.volume) return 1;
          return a.price - b.price;
        });

      setGlobalVolumeVariations(updatedGlobalVolumes); // Atualiza estado local imediatamente
      setGlobalHarmonizationTags(updatedGlobalTags);   // Atualiza estado local imediatamente
      setGlobalPriceVariationTemplates(updatedGlobalTemplates); // Atualiza estado local imediatamente

      try {
        await SystemSettings.update(systemSettingsInstance.id, {
          ...systemSettingsInstance,
          global_volume_variation_names: updatedGlobalVolumes,
          global_harmonization_tags: updatedGlobalTags,
          global_price_variation_templates: updatedGlobalTemplates // Save to DB
        });
      } catch (error) {
        console.error('Erro ao atualizar SystemSettings com novos itens globais:', error);
        // Considerar como lidar com essa falha - os itens foram adicionados localmente mas não no DB global
      }
    }
    
    setShowDialog(false);
    onUpdate(); // Refresh product list
    setUploading(false);
  };

  const handleSave = async () => {
    setUploading(true);
    const finalFormData = {
      ...formData,
      price_variants: formData.price_variants.filter(v => v.volume && v.volume.trim() !== "" && v.price != null && v.price >= 0),
      ibu: formData.ibu === '' || isNaN(parseFloat(formData.ibu)) ? null : parseFloat(formData.ibu),
      abv: formData.abv === '' || isNaN(parseFloat(formData.abv)) ? null : parseFloat(formData.abv)
    };

    try {
      if (selectedFile) {
        const { file_url } = await UploadFile({ file: selectedFile });
        await saveProductData({ ...finalFormData, image_url: file_url });
      } else {
        await saveProductData(finalFormData);
      }
    } catch (error) {
      console.error("Error during save process:", error);
      setUploading(false); 
    }
  };

  const handleDelete = async (productId) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await Product.delete(productId);
        onUpdate();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const toggleAvailable = async (product) => {
    try {
      await Product.update(product.id, {
        ...product, 
        price_variants: product.price_variants || [], 
        harmonizacoes: product.harmonizacoes || [],   
        is_available: !product.is_available
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating product availability:", error);
      alert("Erro ao atualizar disponibilidade: " + error.message);
    }
  };

  const addPriceVariant = () => {
    setFormData({
      ...formData,
      price_variants: [...formData.price_variants, { volume: "", price: 0 }]
    });
  };

  const removePriceVariant = (index) => {
    setFormData({
      ...formData,
      price_variants: formData.price_variants.filter((_, i) => i !== index)
    });
  };

  const updatePriceVariant = (index, field, value) => {
    const variants = [...formData.price_variants];
    variants[index] = { ...variants[index], [field]: value };
    setFormData({ ...formData, price_variants: variants });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "Categoria não encontrada";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            Gerenciar Produtos
          </h2>
          <p className="text-amber-600 dark:text-amber-400">
            Adicione e edite produtos do cardápio
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {product.image_url ? (
                     <div className="relative">
                       <img src={product.image_url} alt={product.name} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-contain"/>
                       {product.coming_soon && (
                         <div className="absolute inset-0 flex items-center justify-center">
                           <div className="bg-amber-600/90 text-white font-bold text-[8px] px-1 py-0.5 rounded transform -rotate-12 shadow-sm">
                             Em Breve
                           </div>
                         </div>
                       )}
                     </div>
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center relative">
                      <Beer className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      {product.coming_soon && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-amber-600/90 text-white font-bold text-[8px] px-1 py-0.5 rounded transform -rotate-12 shadow-sm">
                            Em Breve
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-md md:text-lg font-semibold text-amber-900 dark:text-amber-100">
                        {product.name}
                      </h3>
                      <Badge className={`${product.is_available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"} text-xs px-1.5 py-0.5 md:px-2 md:py-1`}>
                        {product.is_available ? "Disponível" : "Indisponível"}
                      </Badge>
                      {product.coming_soon && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                          Em Breve
                        </Badge>
                      )}
                    </div>
                    <p className="text-amber-600 dark:text-amber-400 text-xs md:text-sm mb-1 md:mb-2">
                      {getCategoryName(product.category_id)}
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs md:text-sm mb-2 md:mb-3">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-1 md:gap-2 text-xs mb-2">
                        {product.ibu != null && (
                            <Badge variant="outline" className="border-teal-300 text-teal-700 dark:border-teal-600 dark:text-teal-300">
                            <Activity className="w-3 h-3 mr-1" /> {product.ibu} IBU
                            </Badge>
                        )}
                        {product.abv != null && (
                            <Badge variant="outline" className="border-pink-300 text-pink-700 dark:border-pink-600 dark:text-pink-300">
                            <Percent className="w-3 h-3 mr-1" /> {product.abv}% ABV
                            </Badge>
                        )}
                    </div>
                    {product.harmonizacoes && product.harmonizacoes.length > 0 && (
                        <div className="mb-2">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 mr-1">Harmoniza com:</span>
                            {product.harmonizacoes.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {product.price_variants && product.price_variants.length > 0 && (
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {product.price_variants.map((variant, index) => (
                          <Badge key={index} variant="outline" className="border-amber-300 text-amber-800 text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                            {variant.volume} - R$ {variant.price?.toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 self-start sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAvailable(product)}
                    className="hover:bg-amber-100 dark:hover:bg-amber-900/30 w-8 h-8 md:w-auto md:h-auto"
                  >
                    {product.is_available ? (
                      <EyeOff className="w-3 h-3 md:w-4 md:h-4" />
                    ) : (
                      <Eye className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(product)}
                    className="hover:bg-amber-100 dark:hover:bg-amber-900/30 w-8 h-8 md:w-auto md:h-auto"
                  >
                    <Edit className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    className="hover:bg-red-100 text-red-600 hover:text-red-700 w-8 h-8 md:w-auto md:h-auto"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="text-center py-12">
              <Beer className="w-16 h-16 mx-auto mb-4 text-amber-400 opacity-50" />
              <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Nenhum produto criado
              </h3>
              <p className="text-amber-600 dark:text-amber-400 mb-4">
                Adicione produtos ao cardápio
              </p>
              <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Produto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Pilsen Artesanal"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({...formData, category_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição detalhada do produto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ibu_product">IBU (Opcional)</Label>
                <Input
                  id="ibu_product"
                  type="number"
                  value={formData.ibu === null ? '' : formData.ibu}
                  onChange={(e) => setFormData({...formData, ibu: e.target.value})}
                  placeholder="Ex: 40"
                />
              </div>
              <div>
                <Label htmlFor="abv_product">ABV (%) (Opcional)</Label>
                <Input
                  id="abv_product"
                  type="number"
                  step="0.1"
                  value={formData.abv === null ? '' : formData.abv}
                  onChange={(e) => setFormData({...formData, abv: e.target.value})}
                  placeholder="Ex: 5.5"
                />
              </div>
            </div>
            
            {/* Harmonizações Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="harmonizacoes_input">Harmonizações (Tags - Opcional)</Label>
                {globalHarmonizationTags.length > 0 && (
                   <Button 
                    type="button" 
                    onClick={() => setShowHarmonizacaoSuggestions(!showHarmonizacaoSuggestions)} 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                    disabled={isSystemSettingsLoading}
                  >
                    <ListPlus className="w-3 h-3 mr-1" />
                    Usar Tag Salva
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="harmonizacoes_input"
                  value={currentHarmonizacaoInput}
                  onChange={(e) => setCurrentHarmonizacaoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddHarmonizacao();
                    }
                  }}
                  placeholder="Digite uma tag e Enter"
                />
                <Button type="button" onClick={() => handleAddHarmonizacao()} variant="outline" size="sm">Adicionar</Button>
              </div>
              {showHarmonizacaoSuggestions && globalHarmonizationTags.length > 0 && (
                <div className="mt-2 mb-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">Tags Salvas:</p>
                  <div className="flex flex-wrap gap-1">
                    {globalHarmonizationTags.map((tag, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-800/30"
                        onClick={() => handleAddHarmonizacao(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.harmonizacoes.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 hover:bg-red-200 dark:hover:bg-red-700 rounded-full"
                      onClick={() => handleRemoveHarmonizacao(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="image_upload_product">Imagem do Produto</Label>
              <div className="mt-1 flex items-center gap-4">
                <Input
                  id="image_upload_product"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-amber-50 file:text-amber-700
                    hover:file:bg-amber-100 dark:file:bg-amber-900/30 dark:file:text-amber-300 dark:hover:file:bg-amber-800/40"
                />
              </div>
              {(formData.image_url && !selectedFile) && (
                <div className="mt-2 relative w-32 h-32">
                  <img src={formData.image_url} alt="Preview" className="rounded-md object-contain w-full h-full"/>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 w-6 h-6 p-0"
                    onClick={() => {setFormData({...formData, image_url: ""}); setSelectedFile(null);}}
                  >
                    <Trash2 className="w-3 h-3"/>
                  </Button>
                </div>
              )}
               {selectedFile && (
                  <div className="mt-2">
                    {selectedFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview Atual" className="rounded-md object-contain w-32 h-32"/>
                    ) : (
                        <p className="text-xs text-slate-500 mt-1">Arquivo selecionado: {selectedFile.name}</p>
                    )}
                  </div>
               )}
            </div>

            {/* Price Variants Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Variações de Preço</Label>
                <div className="flex gap-2">
                  {globalPriceVariationTemplates.length > 0 && (
                    <Button 
                      type="button" 
                      onClick={() => setShowPriceTemplatesSuggestions(!showPriceTemplatesSuggestions)} 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      disabled={isSystemSettingsLoading}
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      Usar Template
                    </Button>
                  )}
                  {globalVolumeVariations.length > 0 && (
                    <Button 
                      type="button" 
                      onClick={() => setShowVolumeVariationSuggestions(!showVolumeVariationSuggestions)} 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      disabled={isSystemSettingsLoading}
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      Usar Volume Salvo
                    </Button>
                  )}
                  <Button type="button" onClick={addPriceVariant} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Variação
                  </Button>
                </div>
              </div>
              
              {/* Templates de Variação Completos (Volume + Preço) */}
              {showPriceTemplatesSuggestions && globalPriceVariationTemplates.length > 0 && (
                <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Templates Salvos (Volume + Preço):</p>
                  <div className="flex flex-wrap gap-2">
                    {globalPriceVariationTemplates.map((template, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto px-2 py-1 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-800/30"
                        onClick={() => addPriceVariationTemplate(template)}
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{template.volume}</span>
                          <span className="text-xs">R$ {template.price.toFixed(2)}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Volumes Salvos (Apenas Volume) */}
              {showVolumeVariationSuggestions && globalVolumeVariations.length > 0 && (
                <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Volumes Salvos:</p>
                  <div className="flex flex-wrap gap-1">
                    {globalVolumeVariations.map((volumeName, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-800/30"
                        onClick={() => addSavedVolumeVariation(volumeName)}
                      >
                        {volumeName}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {formData.price_variants.map((variant, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Volume (ex: 300ml)"
                      value={variant.volume}
                      onChange={(e) => updatePriceVariant(index, 'volume', e.target.value)}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Preço (R$)"
                      value={variant.price}
                      onChange={(e) => updatePriceVariant(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                    {formData.price_variants.length > 1 && ( // Allow removing if it's not the only one
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePriceVariant(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                 {formData.price_variants.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-2">Adicione pelo menos uma variação de preço.</p>
                 )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
              />
              <Label htmlFor="is_available">Produto disponível</Label>
            </div>

            {/* Coming Soon Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="coming_soon"
                checked={formData.coming_soon}
                onCheckedChange={(checked) => setFormData({...formData, coming_soon: checked})}
              />
              <Label htmlFor="coming_soon">Em breve (exibe faixa sobre a imagem)</Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploading || isSystemSettingsLoading} className="bg-amber-600 hover:bg-amber-700">
                {uploading ? <><RotateCcw className="w-4 h-4 mr-2 animate-spin" />Processando...</> : (editingProduct ? "Atualizar" : "Criar")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
