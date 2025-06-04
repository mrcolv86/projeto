
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Users as UsersIcon, ShieldCheck, ChefHat, UserCog, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // User being edited
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await User.list();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setSelectedRole(user.role_level || "waiter");
    setShowEditDialog(true);
  };

  const handleSaveUserRole = async () => {
    if (!currentUser || !selectedRole) return;
    try {
      await User.update(currentUser.id, { 
        ...currentUser, 
        role_level: selectedRole 
      });
      setShowEditDialog(false);
      loadUsers(); 
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Erro ao atualizar a função do usuário.");
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === "gal@base44.com") {
        if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Este usuário pode ser um administrador ou membro da equipe Base44. A exclusão pode ter implicações.`)) {
            return;
        }
    } else if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação é irreversível.`)) {
        return;
    }

    try {
        await User.delete(userId);
        alert(`Usuário ${userEmail} excluído com sucesso.`);
        loadUsers(); // Recarregar a lista de usuários
    } catch (error) {
        console.error(`Error deleting user ${userEmail}:`, error);
        alert(`Erro ao excluir o usuário ${userEmail}. Detalhes: ${error.message}. Este usuário pode precisar ser removido através do painel de administração da Base44.`);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500 text-white"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</Badge>;
      case "manager":
        return <Badge className="bg-blue-500 text-white"><UserCog className="w-3 h-3 mr-1" /> Gerente</Badge>;
      case "waiter":
        return <Badge className="bg-green-500 text-white"><ChefHat className="w-3 h-3 mr-1" /> Garçom</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-stone-50 to-zinc-50 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <UsersIcon className="w-7 h-7" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Visualize e edite as funções dos usuários do sistema.
            </p>
          </div>
          {/* Button to invite users can be added here if platform supports inviting via UI */}
        </div>

        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role_level)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          className="hover:bg-slate-100 dark:hover:bg-slate-700 mr-2"
                          title="Editar Função"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                Nenhum usuário encontrado. Convide usuários através do painel da Base44.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Editar Função do Usuário</DialogTitle>
          </DialogHeader>
          {currentUser && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Usuário</Label>
                <p className="text-slate-700 dark:text-slate-200 font-semibold">{currentUser.full_name || currentUser.email}</p>
              </div>
              <div>
                <Label htmlFor="role_level" className="text-sm font-medium">Função</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role_level" className="w-full mt-1">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="waiter">Garçom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveUserRole} className="bg-emerald-600 hover:bg-emerald-700 text-white">Salvar Função</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
