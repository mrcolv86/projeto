import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Calendar, Hash, User, Tag, DollarSign, Percent, CreditCard, Printer } from "lucide-react";

export default function InvoiceDetailModal({ isOpen, onClose, invoice, businessInfo }) {
  if (!invoice) return null;

  const printInvoiceDetail = () => {
    const printWindow = window.open('', '_blank');
    // Basic HTML structure for printing. Can be greatly enhanced.
    printWindow.document.write('<html><head><title>Detalhe da Invoice</title>');
    printWindow.document.write('<style>body{font-family: Arial, sans-serif; margin: 20px;} .section{margin-bottom:15px;} .item{border-bottom:1px solid #eee; padding:5px 0;} .total-line{font-weight:bold; margin-top:10px;} h2,h3{color:#333;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h2>Detalhes da Invoice: ${invoice.invoice_number}</h2>`);
    if (businessInfo) {
        printWindow.document.write(`<h3>${businessInfo.name || 'Seu Estabelecimento'}</h3>`);
        if (businessInfo.logo) printWindow.document.write(`<img src="${businessInfo.logo}" alt="logo" style="max-height: 50px; margin-bottom:10px;" />`);
    }
    printWindow.document.write(`<div class="section"><strong>Cliente:</strong> ${invoice.customer_name || 'N/A'}</div>`);
    printWindow.document.write(`<div class="section"><strong>Data:</strong> ${format(new Date(invoice.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>`);
    printWindow.document.write(`<div class="section"><strong>Status:</strong> <span style="padding:3px 6px; border-radius:4px; background-color:${invoice.payment_status === 'pago' ? '#dcfce7' : '#fffbeb'}; color:${invoice.payment_status === 'pago' ? '#166534' : '#b45309'};">${invoice.payment_status}</span></div>`);
    printWindow.document.write(`<div class="section"><strong>Método:</strong> ${invoice.payment_method?.replace('_', ' ')}</div>`);
    
    printWindow.document.write('<h3>Itens:</h3>');
    invoice.items?.forEach(item => {
        printWindow.document.write(`<div class="item">${item.quantity}x ${item.product_name} (${item.volume}) - R$ ${item.total_price?.toFixed(2)}</div>`);
    });

    printWindow.document.write(`<div class="total-line section">Subtotal: R$ ${invoice.subtotal?.toFixed(2)}</div>`);
    if (invoice.service_fee > 0) printWindow.document.write(`<div class="total-line">Taxa de Serviço: R$ ${invoice.service_fee?.toFixed(2)}</div>`);
    if (invoice.tax_amount > 0) printWindow.document.write(`<div class="total-line">Impostos: R$ ${invoice.tax_amount?.toFixed(2)}</div>`);
    printWindow.document.write(`<div class="total-line" style="font-size:1.2em;">Total: R$ ${invoice.total_amount?.toFixed(2)}</div>`);
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center text-slate-800 dark:text-slate-100">
            <FileText className="w-5 h-5 mr-2" />
            Detalhes da Invoice: #{invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Data:</span>
                <span className="ml-1 text-slate-900 dark:text-slate-100">{format(new Date(invoice.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center">
                <Hash className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Mesa:</span>
                <span className="ml-1 text-slate-900 dark:text-slate-100">{invoice.table_id?.slice(-4) || "N/A"}</span> {/* Placeholder for table number */}
              </div>
              <div className="flex items-center col-span-2">
                <User className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Cliente:</span>
                <span className="ml-1 text-slate-900 dark:text-slate-100">{invoice.customer_name || "Cliente Anônimo"}</span>
              </div>
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Status:</span>
                <Badge className={`ml-1 capitalize ${
                    invoice.payment_status === "pago" 
                      ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                  }`}>{invoice.payment_status}</Badge>
              </div>
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Método:</span>
                <span className="ml-1 text-slate-900 dark:text-slate-100 capitalize">{invoice.payment_method?.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">Itens Consumidos:</h4>
              <div className="space-y-1 text-sm">
                {invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-700 dark:text-slate-300">{item.quantity}x {item.product_name} ({item.volume})</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">R$ {item.total_price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-700 dark:text-slate-300">Subtotal:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">R$ {invoice.subtotal?.toFixed(2)}</span>
              </div>
              {invoice.service_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Taxa de Serviço (10%):</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">R$ {invoice.service_fee?.toFixed(2)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Impostos:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">R$ {invoice.tax_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-300 dark:border-slate-600 mt-2">
                <span className="text-slate-800 dark:text-slate-100">TOTAL:</span>
                <span className="text-emerald-600 dark:text-emerald-400">R$ {invoice.total_amount?.toFixed(2)}</span>
              </div>
            </div>
            {invoice.notes && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold mb-1 text-slate-800 dark:text-slate-100">Observações:</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">{invoice.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} className="dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700">Fechar</Button>
          <Button onClick={printInvoiceDetail} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}