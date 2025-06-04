

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, SystemSettings } from "@/api/entities"; // Added SystemSettings
import {
  Beer,
  LayoutDashboard,
  Menu,
  Users,
  Settings,
  BarChart3,
  QrCode,
  Sun,
  Moon,
  Globe,
  User as UserIcon,
  LogOut,
  ShoppingCart,
  Tv,
  FileText // Added FileText for PDF export
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    roles: ["admin", "manager", "waiter"]
  },
  {
    title: "Cardápio Digital",
    url: createPageUrl("Menu"),
    icon: Menu,
    roles: ["admin", "manager", "waiter"]
  },
  {
    title: "Exportar Menu PDF", // Added PDF Export
    url: createPageUrl("MenuPDF"),
    icon: FileText,
    roles: ["admin", "manager"]
  },
  {
    title: "Display para TV",
    url: createPageUrl("DisplaySettings"),
    icon: Tv,
    roles: ["admin", "manager"]
  },
  {
    title: "Mesas & QR Codes",
    url: createPageUrl("Tables"),
    icon: QrCode,
    roles: ["admin", "manager", "waiter"]
  },
  {
    title: "Pedidos",
    url: createPageUrl("Orders"),
    icon: ShoppingCart,
    roles: ["admin", "manager", "waiter"]
  },
  {
    title: "Configurações",
    url: createPageUrl("SystemSettings"),
    icon: Settings,
    roles: ["admin", "manager"]
  },
  {
    title: "Relatórios",
    url: createPageUrl("Reports"),
    icon: BarChart3,
    roles: ["admin", "manager"]
  },
  {
    title: "Usuários",
    url: createPageUrl("Users"),
    icon: Users,
    roles: ["admin"]
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("pt");

  useEffect(() => {
    loadUser();
    loadSystemSettings();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      if (userData.preferences) {
        setTheme(userData.preferences.theme || "light");
        setLanguage(userData.preferences.language || "pt");
      }
    } catch (error) {
      // User not authenticated, this is fine for public pages
      console.log("User not authenticated or page is public.");
    }
  };

  const loadSystemSettings = async () => {
    try {
      const settingsData = await SystemSettings.list();
      if (settingsData.length > 0) {
        setSystemSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading system settings:", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (user) {
      await User.updateMyUserData({
        preferences: {
          ...user.preferences,
          theme: newTheme
        }
      });
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === "pt" ? "en" : "pt";
    setLanguage(newLang);
    if (user) {
      await User.updateMyUserData({
        preferences: {
          ...user.preferences,
          language: newLang
        }
      });
    }
  };

  const handleLogout = async () => {
    await User.logout();
  };

  const filteredNavItems = navigationItems.filter(item =>
    !user || item.roles.includes(user.role_level || "waiter")
  );

  const businessName = systemSettings?.business_name || "BierServ";
  const businessSubtitle = systemSettings?.business_subtitle || "Cervejaria Digital";
  const logoUrl = systemSettings?.logo_url;

  // If it's the TV Display page or Customer Menu page, render only its content for fullscreen
  if (currentPageName === "MenuDisplay" || currentPageName === "CustomerMenu") {
    return (
      <div className={`${theme === "dark" ? "dark" : ""}`}>
        <style>
            {`
            /* Estilos globais para MenuDisplay e CustomerMenu */
            html, body, #__next {
              width: 100% !important; /* Largura total */
              margin: 0 !important;
              padding: 0 !important;
              overflow-x: hidden !important; /* Evitar scroll horizontal */
              background: ${theme === "dark" || currentPageName === "MenuDisplay" 
                ? "linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #334155 100%)" /* Sempre escuro para TV */
                : "linear-gradient(135deg, hsl(220, 18%, 96%) 0%, hsl(220, 15%, 93%) 35%, hsl(220, 12%, 90%) 100%)" /* Claro para Cardápio Cliente */
              };
              /* Default height and overflow to allow scroll for CustomerMenu */
              height: auto !important;
              overflow-y: auto !important; /* Allow vertical scroll by default */
            }
            ${currentPageName === "MenuDisplay" ? `
            html, body, #__next { /* Estilos específicos para fullscreen do MenuDisplay */
                height: 100vh !important;
                width: 100vw !important;
                overflow: hidden !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
            }
            ` : ""}
          `}
        </style>
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${theme === "dark" ? "dark" : ""}`}>
        <style>
          {`
            :root {
              --primary: ${theme === "dark" ? "43 96% 56%" : "220 85% 50%"}; /* Azul mais saturado no claro */
              --primary-foreground: ${theme === "dark" ? "20 14.3% 4.1%" : "0 0% 100%"};
              --background: ${theme === "dark" ? "222 84% 5%" : "220 15% 97%"}; /* Fundo mais neutro */
              --foreground: ${theme === "dark" ? "210 40% 98%" : "220 20% 15%"}; /* Texto muito mais escuro */
              --card: ${theme === "dark" ? "222 84% 5%" : "0 0% 100%"};
              --card-foreground: ${theme === "dark" ? "210 40% 98%" : "220 20% 15%"}; /* Texto do card mais escuro */
              --popover: ${theme === "dark" ? "222 84% 5%" : "0 0% 100%"};
              --popover-foreground: ${theme === "dark" ? "210 40% 98%" : "220 20% 15%"};
              --secondary: ${theme === "dark" ? "217 33% 17%" : "220 10% 92%"}; /* Cinza mais escuro */
              --secondary-foreground: ${theme === "dark" ? "210 40% 98%" : "220 25% 25%"}; /* Texto secundário mais escuro */
              --muted: ${theme === "dark" ? "217 33% 17%" : "220 10% 90%"}; /* Fundo muted mais escuro */
              --muted-foreground: ${theme === "dark" ? "215 20% 65%" : "220 15% 40%"}; /* Texto muted mais escuro */
              --accent: ${theme === "dark" ? "217 33% 17%" : "220 85% 60%"}; /* Accent mais vibrante */
              --accent-foreground: ${theme === "dark" ? "210 40% 98%" : "220 20% 15%"};
              --destructive: ${theme === "dark" ? "0 72% 51%" : "0 80% 55%"};
              --destructive-foreground: ${theme === "dark" ? "210 40% 98%" : "0 0% 100%"};
              --border: ${theme === "dark" ? "217 33% 17%" : "220 15% 85%"}; /* Bordas mais definidas */
              --input: ${theme === "dark" ? "217 33% 17%" : "220 15% 88%"};
              --ring: ${theme === "dark" ? "215 25% 27%" : "220 85% 50%"};
              --radius: 0.75rem;
            }
            
            .dark {
              background: linear-gradient(135deg, #1e293b 0%, #334155 35%, #475569 100%);
              color: hsl(var(--foreground));
            }
            
            body {
              background: ${theme === "dark" 
                ? "linear-gradient(135deg, #1e293b 0%, #334155 35%, #475569 100%)" 
                : "linear-gradient(135deg, hsl(220, 18%, 96%) 0%, hsl(220, 15%, 93%) 35%, hsl(220, 12%, 90%) 100%)" /* Gradiente mais sutil e sofisticado */
              };
            }

            @keyframes slideInLeft {
              from {
                opacity: 0;
                transform: translateX(-20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes shimmer {
              0% {
                background-position: -200px 0;
              }
              100% {
                background-position: calc(200px + 100%) 0;
              }
            }

            .animate-slide-in-left {
              animation: slideInLeft 0.4s ease-out forwards;
            }

            .animate-fade-in-up {
              animation: fadeInUp 0.5s ease-out forwards;
            }

            .animate-scale-in {
              animation: scaleIn 0.3s ease-out forwards;
            }

            .glass-effect {
              background: ${theme === "dark" 
                ? "rgba(30, 41, 59, 0.85)" 
                : "rgba(255, 255, 255, 0.95)" /* Mais opaco para melhor contraste */
              };
              backdrop-filter: blur(16px);
              border: 1px solid ${theme === "dark" 
                ? "rgba(148, 163, 184, 0.2)" 
                : "rgba(148, 163, 184, 0.25)" /* Bordas mais visíveis */
              };
            }

            .hover-lift {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .hover-lift:hover {
              transform: translateY(-2px);
              box-shadow: ${theme === "dark" 
                ? "0 10px 25px rgba(0, 0, 0, 0.3)" 
                : "0 8px 25px rgba(0, 0, 0, 0.12)" /* Sombras mais pronunciadas */
              };
            }

            .nav-item-animate {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
            }

            .nav-item-animate::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: ${theme === "dark" 
                ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" 
                : "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" /* Efeito hover mais visível */
              };
              transition: left 0.5s;
            }

            .nav-item-animate:hover::before {
              left: 100%;
            }

            .gradient-text {
              background: ${theme === "dark" 
                ? "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)" 
                : "linear-gradient(135deg, hsl(220, 30%, 25%) 0%, hsl(220, 35%, 20%) 100%)" /* Gradiente de texto mais escuro e elegante */
              };
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
            }

            /* Melhorias específicas para textos no modo claro */
            .text-slate-600 {
              color: ${theme === "dark" ? "rgb(148 163 184)" : "rgb(75 85 99)"} !important; /* Texto mais escuro */
            }
            
            .text-slate-700 {
              color: ${theme === "dark" ? "rgb(100 116 139)" : "rgb(55 65 81)"} !important; /* Texto mais escuro */
            }
            
            .text-amber-600 {
              color: ${theme === "dark" ? "rgb(217 119 6)" : "rgb(180 83 9)"} !important; /* Amber mais escuro */
            }
            
            .text-amber-700 {
              color: ${theme === "dark" ? "rgb(180 83 9)" : "rgb(146 64 14)"} !important; /* Amber mais escuro */
            }

            /* Melhor contraste para cards e elementos */
            .bg-white\\/90 {
              background-color: ${theme === "dark" ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.98)"} !important;
            }
            
            .bg-gradient-to-br {
              ${theme === "light" ? `
                background-image: linear-gradient(to bottom right, 
                  rgba(248, 250, 252, 0.8), 
                  rgba(241, 245, 249, 0.6), 
                  rgba(226, 232, 240, 0.4)) !important;
              ` : ""}
            }
          `}
        </style>
        
        <Sidebar className="glass-effect border-r-0 shadow-xl animate-slide-in-left">
          <SidebarHeader className="border-b border-slate-200/20 dark:border-slate-700/20 p-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-scale-in">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded-sm" />
                ) : (
                  <Beer className="w-6 h-6 text-white drop-shadow-sm" />
                )}
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg gradient-text">{businessName}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{businessSubtitle}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-3 py-3 mb-2">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavItems.map((item, index) => (
                    <SidebarMenuItem key={item.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <SidebarMenuButton 
                        asChild 
                        className={`nav-item-animate hover-lift rounded-xl mb-1 transition-all duration-300 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-lg shadow-blue-500/25 dark:from-slate-700 dark:to-slate-800 dark:text-white dark:shadow-slate-500/25' 
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className={`w-4 h-4 transition-transform duration-300 ${location.pathname === item.url ? 'scale-110' : ''}`} />
                          <span className="font-medium text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/20 dark:border-slate-700/20 p-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-300 hover-lift">
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="w-8 h-8 ring-2 ring-slate-300 dark:ring-slate-600">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-bold text-sm dark:from-slate-600 dark:to-slate-800 dark:text-white">
                          {user.full_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 capitalize font-medium">
                          {user.role_level || "waiter"}
                        </p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 glass-effect border-slate-200 dark:border-slate-700">
                  <DropdownMenuItem onClick={toggleTheme} className="hover:bg-slate-100 dark:hover:bg-slate-700/50">
                    {theme === "light" ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                    {theme === "light" ? "Modo Escuro" : "Modo Claro"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleLanguage} className="hover:bg-slate-100 dark:hover:bg-slate-700/50">
                    <Globe className="w-4 h-4 mr-2" />
                    {language === "pt" ? "English" : "Português"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => User.login()} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl dark:from-slate-600 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:to-slate-900 dark:text-white">
                <UserIcon className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50/50 via-stone-50/30 to-zinc-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900">
          <header className="glass-effect border-b border-slate-200/30 dark:border-slate-700/30 px-4 py-3 md:hidden shadow-lg">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-lg transition-all duration-300 hover:scale-105" />
              <h1 className="text-lg font-bold gradient-text">{businessName}</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

