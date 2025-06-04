
import React, { useState, useEffect } from "react";
import { Invoice, Order, SystemSettings, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  DollarSign, 
  Calculator, 
  User as UserIcon,
  FileText,
  Printer,
  Download,
  CheckCircle
} from "lucide-react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function InvoiceGenerator({ table, orders, open, onOpenChange, onInvoiceCreated }) {
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pendente");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(true);
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    loadSystemSettings();
  }, []);

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

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `INV${timestamp}`;
  };

  const calculateInvoiceData = () => {
    // Agregar todos os itens dos pedidos
    const allItems = [];
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const existingItem = allItems.find(
            ai => ai.product_name === item.product_name && ai.volume === item.volume
          );
          
          if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.total_price = existingItem.quantity * existingItem.unit_price;
          } else {
            allItems.push({
              product_name: item.product_name,
              volume: item.volume,
              quantity: item.quantity,
              unit_price: item.price || (item.total / item.quantity),
              total_price: item.total || (item.price * item.quantity)
            });
          }
        });
      }
    });

    const subtotal = allItems.reduce((sum, item) => sum + item.total_price, 0);
    
    // Usar configurações do sistema para calcular taxas
    const serviceFeePercentage = systemSettings?.tax_settings?.service_fee_percentage || 10.0;
    const taxPercentage = systemSettings?.tax_settings?.tax_percentage || 5.0;
    
    const serviceFee = serviceFeeEnabled ? subtotal * (serviceFeePercentage / 100) : 0;
    const taxAmount = subtotal * (taxPercentage / 100);
    const totalAmount = subtotal + serviceFee + taxAmount;

    return {
      items: allItems,
      subtotal,
      serviceFee,
      taxAmount,
      totalAmount,
      serviceFeePercentage,
      taxPercentage
    };
  };

  const handleGenerateInvoice = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const invoiceData = calculateInvoiceData();
      
      const invoice = {
        table_id: table.id,
        invoice_number: generateInvoiceNumber(),
        customer_name: customerName || "Cliente Anônimo",
        customer_document: customerDocument,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        service_fee: invoiceData.serviceFee,
        total_amount: invoiceData.totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "pendente" ? "pendente" : "pago",
        notes: notes,
        waiter_id: user.id,
        closed_at: new Date().toISOString()
      };

      await Invoice.create(invoice);
      
      // Marcar pedidos como entregues
      for (const order of orders) {
        if (order.status !== "entregue") {
          await Order.update(order.id, { ...order, status: "entregue" });
        }
      }

      onInvoiceCreated(invoice);
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = () => {
    const invoiceData = calculateInvoiceData();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Mesa ${table.number}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 20px;
              background: white;
              color: #1e293b;
              line-height: 1.6;
            }
            .invoice-container { 
              max-width: 600px; 
              margin: 0 auto; 
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              background: white;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .business-name {
              color: #0f172a;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .invoice-title {
              color: #475569;
              font-size: 18px;
              font-weight: 600;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 16px;
              background: #f8fafc;
              border-radius: 12px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #e2e8f0;
              padding: 12px;
              text-align: left;
            }
            .items-table th {
              background: #f1f5f9;
              font-weight: bold;
              color: #1e293b;
            }
            .totals {
              margin-top: 20px;
              padding: 16px;
              background: #f8fafc;
              border-radius: 12px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 4px 0;
            }
            .total-final {
              font-size: 18px;
              font-weight: bold;
              border-top: 2px solid #1e293b;
              padding-top: 8px;
              margin-top: 8px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="business-name">${systemSettings?.business_name || "BierServ"}</div>
              <div class="invoice-title">NOTA FISCAL / INVOICE</div>
            </div>
            
            <div class="info-section">
              <div>
                <strong>Mesa:</strong> ${table.number}<br>
                <strong>Data:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}<br>
                <strong>Invoice:</strong> ${generateInvoiceNumber()}
              </div>
              <div>
                <strong>Cliente:</strong> ${customerName || "Cliente Anônimo"}<br>
                ${customerDocument ? `<strong>Documento:</strong> ${customerDocument}<br>` : ''}
                <strong>Pagamento:</strong> ${paymentMethod.replace('_', ' ')}
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Volume</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.volume}</td>
                    <td>${item.quantity}</td>
                    <td>R$ ${item.unit_price.toFixed(2)}</td>
                    <td>R$ ${item.total_price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>R$ ${invoiceData.subtotal.toFixed(2)}</span>
              </div>
              ${serviceFeeEnabled ? `
              <div class="total-line">
                <span>Taxa de Serviço (${invoiceData.serviceFeePercentage}%):</span>
                <span>R$ ${invoiceData.serviceFee.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-line">
                <span>Impostos (${invoiceData.taxPercentage}%):</span>
                <span>R$ ${invoiceData.taxAmount.toFixed(2)}</span>
              </div>
              <div class="total-line total-final">
                <span>TOTAL:</span>
                <span>R$ ${invoiceData.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            ${notes ? `
            <div style="margin-top: 20px; padding: 16px; background: #f1f5f9; border-radius: 12px;">
              <strong>Observações:</strong><br>
              ${notes}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
              Obrigado pela preferência!<br>
              Sistema BierServ - Cervejaria Digital
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const invoiceData = calculateInvoiceData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200 dark:border-slate-700 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Receipt className="w-5 h-5" />
            Gerar Invoice - Mesa {table.number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="customer_name" className="text-sm font-medium">Nome do Cliente</Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo (opcional)"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="customer_document" className="text-sm font-medium">CPF/CNPJ</Label>
                <Input
                  id="customer_document"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  placeholder="000.000.000-00 (opcional)"
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Summary */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Itens Consumidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex-1">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 ml-2">
                        ({item.volume})
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      R$ {item.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calculation Summary */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700 dark:text-slate-300">Subtotal:</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  R$ {invoiceData.subtotal.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700 dark:text-slate-300">Taxa de Serviço ({invoiceData.serviceFeePercentage}%):</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  R$ {invoiceData.serviceFee.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-700 dark:text-slate-300">Impostos ({invoiceData.taxPercentage}%):</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  R$ {invoiceData.taxAmount.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-t border-slate-300 dark:border-slate-600">
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">TOTAL:</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {invoiceData.totalAmount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method" className="text-sm font-medium">Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais (opcional)"
              className="rounded-xl"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={printInvoice}
              variant="outline"
              className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              <Printer className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {loading ? (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {loading ? "Gerando..." : "Gerar Invoice"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
