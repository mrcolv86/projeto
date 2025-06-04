import React, { useState } from "react";
import { Category } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Eye, EyeOff, UploadCloud, Image as ImageIcon, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations"; // Import UploadFile

export default function CategoryManager({ categories, onUpdate }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "", // Continuará armazenando a URL após o upload
    sort_order: 0,
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState(null); // Para o upload de imagem
  const [uploading, setUploading] = useState(false);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      image_url: category.image_url || "",
      sort_order: category.sort_order || 0,
      is_active: category.is_active !== false,
    });
    setSelectedFile(null);
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      image_url: "",
      sort_order: categories.length,
      is_active: true,
    });
    setSelectedFile(null);
    setShowDialog(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Opcional: Mostrar preview local da imagem
      // setFormData(prev => ({ ...prev, image_url: URL.createObjectURL(file) }));
    }
  };
  
  // Função auxiliar para salvar, reutilizada por handleSave
  const saveCategoryData = async (categoryData) => {
    try {
      if (editingCategory) {
        await Category.update(editingCategory.id, categoryData);
      } else {
        await Category.create(categoryData);
      }
      setShowDialog(false);
      onUpdate(); // Atualiza a lista de categorias na página pai
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erro ao salvar categoria."); // Feedback para o usuário
    } finally {
        setUploading(false); // Garante que uploading seja false no final
    }
  };


  const handleSave = async () => {
    setUploading(true);
    try {
        if (selectedFile) {
            const { file_url } = await UploadFile({ file: selectedFile });
            // Atualiza formData com a nova URL antes de salvar
            const categoryData = {
                 ...formData,
                 image_url: file_url
            };
            await saveCategoryData(categoryData);
        } else {
            // Nenhuma nova imagem selecionada, salva os dados existentes (incluindo image_url se já houver)
            await saveCategoryData(formData);
        }
    } catch (error) {
        console.error("Error during save process:", error);
        // Não precisa de alert aqui se saveCategoryData já tiver
        setUploading(false); // Garante que uploading seja desativado em caso de erro no upload
    }
  };


  const handleDelete = async (categoryId) => {
    if (confirm("Tem certeza que deseja excluir esta categoria? Produtos nesta categoria não serão excluídos, mas perderão a associação.")) {
      try {
        await Category.delete(categoryId);
        onUpdate();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const toggleActive = async (category) => {
    try {
      await Category.update(category.id, {
        ...category,
        is_active: !category.is_active
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating category active state:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            Gerenciar Categorias
          </h2>
          <p className="text-amber-600 dark:text-amber-400">
            Organize o cardápio em categorias
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4">
                  {category.image_url ? (
                     <img src={category.image_url} alt={category.name} className="w-12 h-12 rounded-lg object-cover"/>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                       <Package className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                        {category.name}
                      </h3>
                      <Badge className={category.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {category.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-amber-600 dark:text-amber-400 text-sm mb-1">
                      {category.description || "Sem descrição"}
                    </p>
                    {/* IBU e ABV foram removidos da categoria */}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(category)}
                    className="hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    {category.is_active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                    className="hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="hover:bg-red-100 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800">
            <CardContent className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-amber-400 opacity-50" />
              <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Nenhuma categoria criada
              </h3>
              <p className="text-amber-600 dark:text-amber-400 mb-4">
                Crie sua primeira categoria para organizar o cardápio
              </p>
              <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Categoria
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Pilsen - Weizen"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição da categoria..."
              />
            </div>
            <div>
              <Label htmlFor="image_upload_category">Imagem da Categoria</Label>
              <div className="mt-1 flex items-center gap-4">
                <Input
                  id="image_upload_category"
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
              {(formData.image_url && !selectedFile) && ( // Mostra imagem existente se não houver novo arquivo selecionado
                <div className="mt-2 relative w-24 h-24">
                  <img src={formData.image_url} alt="Preview" className="rounded-md object-cover w-full h-full"/>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 w-5 h-5 p-0"
                    onClick={() => {setFormData({...formData, image_url: ""}); setSelectedFile(null);}}
                  >
                    <Trash2 className="w-3 h-3"/>
                  </Button>
                </div>
              )}
               {selectedFile && ( // Mostra preview do arquivo selecionado ou nome
                  <div className="mt-2">
                    {selectedFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="rounded-md object-cover w-24 h-24"/>
                    ) : (
                        <p className="text-xs text-slate-500 mt-1">Arquivo selecionado: {selectedFile.name}</p>
                    )}
                  </div>
               )}
            </div>
            {/* Campos IBU e ABV removidos daqui */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active">Categoria ativa</Label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={uploading} className="bg-amber-600 hover:bg-amber-700">
                {uploading ? <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : (editingCategory ? "Atualizar" : "Criar")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}