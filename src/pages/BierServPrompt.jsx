import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

export default function BierServPrompt() {
  const promptContent = `# BierServ - Sistema Completo para Cervejarias

## Visão Geral
O BierServ é uma plataforma digital completa para gestão de cervejarias, desenvolvida para ser **escalável e vendida a múltiplos estabelecimentos**. O sistema oferece cardápio digital, gestão de pedidos, controle de mesas, relatórios fiscais e muito mais.

## Funcionalidades Principais

### 🍺 **Cardápio Digital**
- **Gestão de Categorias**: Organize produtos por tipo (Pilsen, Weizen, IPA, etc.)
- **Gestão de Produtos**: Adicione produtos com múltiplas variações de volume e preço
- **Upload de Imagens**: Sistema integrado para upload de fotos dos produtos
- **Disponibilidade**: Controle de produtos disponíveis/indisponíveis
- **Preview em Tempo Real**: Visualize como o cardápio aparece para os clientes

### 📺 **Display para TV**
- **Cardápio para Televisão**: Exibição otimizada para TVs e projetores
- **Sem Distrações**: Interface limpa focada apenas no cardápio
- **Rotação Automática**: Troca automaticamente entre categorias
- **Configurável**: Escolha quais categorias exibir e tempo de rotação
- **Chromecast/Fire TV**: Compatível com dispositivos de transmissão
- **URLs Públicas**: Links diretos para acesso em qualquer dispositivo

### 📱 **Cardápio do Cliente (QR Code)**
- **Acesso via QR Code**: Cada mesa possui QR code único
- **Interface Mobile**: Otimizada para smartphones
- **Carrinho de Compras**: Sistema completo de pedidos
- **Observações**: Campo para comentários especiais do cliente
- **Finalização de Pedido**: Envio direto para a cozinha

### 🛎️ **Sistema de Pedidos**
- **Alertas Sonoros**: Notificações sonoras para novos pedidos
- **Pop-ups de 3 segundos**: Alertas visuais não intrusivos
- **Status em Tempo Real**: Pendente → Preparando → Pronto → Entregue
- **Filtros Avançados**: Por mesa, status, data
- **Gestão de Garçons**: Atribuição de responsáveis

### 🪑 **Gestão de Mesas**
- **QR Codes Únicos**: Geração automática para cada mesa
- **Status das Mesas**: Livre, Ocupada, Reservada
- **Capacidade**: Controle de lugares por mesa
- **Localização**: Organização por área do estabelecimento
- **Impressão de QR Codes**: Para colocar nas mesas físicas

### 💰 **Sistema Fiscal e Invoices**
- **Fechamento de Mesa**: Agrupamento automático de todos os pedidos
- **Cálculo Automático**: Subtotal, impostos, taxa de serviço
- **Múltiplos Pagamentos**: Dinheiro, cartão, PIX
- **Relatórios Fiscais**: Por período, método de pagamento
- **Exportação**: Dados para contabilidade

### 📊 **Dashboard e Relatórios**
- **Visão Geral**: Estatísticas do dia em tempo real
- **Faturamento**: Receita total e ticket médio
- **Mesas Ativas**: Controle de ocupação
- **Produtos Populares**: Análise de vendas
- **Relatórios Detalhados**: Exportação de dados

### ⚙️ **Sistema Escalável e Configurável**
- **Multi-tenant**: Cada cervejaria tem suas configurações
- **Identidade Visual**: Logo, cores, nome do estabelecimento
- **Personalização Completa**: Textos, idiomas, moedas
- **Configurações por Estabelecimento**:
  - Nome e subtítulo do negócio
  - Logo personalizado
  - Cores da interface
  - Informações de contato
  - Configurações de exibição
  - Preferências de funcionamento

### 👥 **Gestão de Usuários**
- **Níveis de Acesso**: Admin, Gerente, Garçom
- **Permissões Granulares**: Controle fino de funcionalidades
- **Perfis Personalizados**: Tema claro/escuro, idioma
- **Autenticação Segura**: Login via Google

## Tecnologias Utilizadas

### Frontend
- **React** com hooks modernos
- **Tailwind CSS** para estilização responsiva
- **Shadcn/UI** para componentes elegantes
- **Lucide React** para ícones consistentes
- **Framer Motion** para animações suaves
- **Date-fns** para manipulação de datas

### Backend (Base44 Platform)
- **Entidades Dinâmicas**: Sistema flexível de dados
- **APIs REST**: Integração simplificada
- **Upload de Arquivos**: Sistema nativo de storage
- **Autenticação**: Sistema integrado de usuários

### Integrações
- **QR Code Generator**: API externa para geração
- **Presentation API**: Para Chromecast/TV
- **Audio API**: Para notificações sonoras
- **File Upload**: Sistema nativo da plataforma

## Modelo de Negócio SaaS

### Escalabilidade
- **Multi-estabelecimento**: Um sistema, múltiplos clientes
- **Configuração Independente**: Cada cervejaria tem suas configurações
- **Domínios Personalizados**: URLs próprias para cada cliente
- **Dados Isolados**: Segurança e privacidade garantidas

### Customização por Cliente
- **Branding Completo**: Logo, cores, textos
- **Funcionalidades Modulares**: Ative/desative recursos
- **Planos Diferentes**: Básico, Profissional, Enterprise
- **Suporte Personalizado**: Para cada nível de plano

### Monetização
- **Assinatura Mensal/Anual**: Modelo SaaS recorrente
- **Planos Escalonados**: Por número de mesas/pedidos
- **Setup Fee**: Taxa única de implementação
- **Treinamento**: Serviços adicionais de consultoria

## Próximos Passos de Desenvolvimento

### Funcionalidades Avançadas
1. **Sistema de Reservas**: Agendamento de mesas online
2. **Programa de Fidelidade**: Pontos e recompensas
3. **Integração com Delivery**: iFood, Uber Eats, Rappi
4. **Analytics Avançados**: Machine Learning para insights
5. **App Mobile Nativo**: Para garçons e gestores

### Integrações Externas
1. **Sistemas de Pagamento**: PagSeguro, Mercado Pago
2. **ERPs**: Integração com sistemas existentes
3. **Emissão de NFe**: Notas fiscais automáticas
4. **WhatsApp Business**: Notificações via chat
5. **Google Analytics**: Tracking de comportamento

### Melhorias de UX/UI
1. **Tema Personalizado**: Cores da marca do cliente
2. **Modo Offline**: Funcionamento sem internet
3. **PWA**: Progressive Web App para instalação
4. **Acessibilidade**: WCAG 2.1 compliance
5. **Internacionalização**: Múltiplos idiomas

## Arquitetura do Sistema

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Base44        │    │   Integrações   │
│   (React SPA)   │◄──►│   Platform      │◄──►│   Externas      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   • Dashboard   │    │   • Entities    │    │   • QR Codes    │
│   • Cardápio    │    │   • Users       │    │   • Payments    │
│   • Pedidos     │    │   • Files       │    │   • Analytics   │
│   • Mesas       │    │   • APIs        │    │   • Notifications│
│   • Relatórios  │    │   • Auth        │    │   • Fiscal      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Como Implementar para Novos Clientes

### 1. **Setup Inicial**
\`\`\`bash
# Clone do projeto base
git clone [repository]
cd bierserv-platform

# Configuração do cliente
npm run setup-client --name="Cervejaria XYZ"
\`\`\`

### 2. **Configuração da Cervejaria**
- Upload do logo
- Definição de cores
- Configuração de mesas
- Cadastro de produtos
- Treinamento da equipe

### 3. **Go-Live**
- Testes de integração
- Impressão de QR codes
- Treinamento final
- Suporte pós-implementação

## Suporte e Manutenção

### Níveis de Suporte
- **Básico**: Email, 48h resposta
- **Profissional**: Chat, 24h resposta
- **Enterprise**: Telefone, 4h resposta, gerente dedicado

### Atualizações
- **Automáticas**: Patches de segurança
- **Opcionais**: Novas funcionalidades
- **Personalizadas**: Desenvolvimentos específicos

---

**BierServ - Transformando a experiência em cervejarias através da tecnologia** 🍺`;

  const downloadPrompt = () => {
    const element = document.createElement("a");
    const file = new Blob([promptContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = "BierServ_Platform_Prompt.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 via-stone-50 to-zinc-50 dark:from-slate-900 dark:via-slate-800 dark:to-zinc-900 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Documentação do Sistema BierServ
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Prompt completo para apresentação e comercialização da plataforma
            </p>
          </div>
          <button
            onClick={downloadPrompt}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Markdown
          </button>
        </div>

        {/* Content */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <FileText className="w-5 h-5" />
              Conteúdo do Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                {promptContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}