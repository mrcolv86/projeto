
import React, { useRef, useState, useEffect } from "react";
import { SystemSettings } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode, MapPin, Users, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPageUrl } from "@/utils"; // Adicionado import

export default function QRCodeGenerator({ table, open, onOpenChange }) {
  const qrRef = useRef(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await SystemSettings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // Generate the proper menu URL with table parameter
  const customerMenuPageUrl = createPageUrl('CustomerMenu');
  const menuUrl = `${window.location.origin}${customerMenuPageUrl}?table=${table.qr_code}`;
  
  // Generate QR code URL using a QR code service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&margin=10&data=${encodeURIComponent(menuUrl)}`;

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `mesa-${table.number}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const businessName = settings?.business_name || "BierServ";
    const businessSubtitle = settings?.business_subtitle || "Cervejaria Digital";
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - Mesa ${table.number}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              text-align: center; 
              padding: 20px;
              background: white;
              color: #1e293b;
            }
            .qr-container { 
              max-width: 400px; 
              margin: 0 auto; 
              border: 3px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              background: white;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              margin-bottom: 20px;
            }
            .business-name {
              color: #0f172a;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .business-subtitle {
              color: #64748b;
              font-size: 14px;
              margin-bottom: 20px;
            }
            .table-info {
              margin-bottom: 20px;
              padding: 16px;
              background: #f8fafc;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .table-number {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .table-details {
              color: #475569;
              font-size: 14px;
              line-height: 1.5;
            }
            .qr-code {
              margin: 20px 0;
              padding: 12px;
              background: white;
              border-radius: 12px;
              border: 2px solid #e2e8f0;
              display: inline-block;
            }
            .instructions {
              margin-top: 20px;
              padding: 16px;
              background: #f1f5f9;
              border-radius: 12px;
              font-size: 14px;
              color: #475569;
              line-height: 1.5;
            }
            .instructions-title {
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 8px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="header">
              <div class="business-name">${businessName}</div>
              <div class="business-subtitle">${businessSubtitle}</div>
            </div>
            
            <div class="table-number">Mesa ${table.number}</div>
            
            <div class="table-info">
              <div class="table-details">
                <div><strong>Capacidade:</strong> ${table.capacity} pessoas</div>
                ${table.location ? `<div><strong>Localização:</strong> ${table.location}</div>` : ''}
                <div><strong>Código:</strong> ${table.qr_code}</div>
              </div>
            </div>
            
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code Mesa ${table.number}" style="width: 250px; height: 250px;" />
            </div>
            
            <div class="instructions">
              <div class="instructions-title">Como usar:</div>
              <div>
                1. Abra a câmera do seu celular<br>
                2. Aponte para o QR Code<br>
                3. Toque no link que aparecer<br>
                4. Acesse nosso cardápio digital!
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const openPreview = () => {
    window.open(menuUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200 dark:border-slate-700 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <QrCode className="w-5 h-5" />
            QR Code - Mesa {table.number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Table Info */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-800 dark:text-slate-100">Informações da Mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-200">
                  Capacidade: {table.capacity} pessoas
                </span>
              </div>
              {table.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-200">
                    {table.location}
                  </span>
                </div>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg font-mono">
                {table.qr_code}
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <div className="text-center">
            <div className="inline-block p-3 bg-white rounded-xl shadow-lg border border-slate-200 dark:border-slate-600">
              <img 
                ref={qrRef}
                src={qrCodeUrl}
                alt={`QR Code Mesa ${table.number}`}
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Clientes escaneiam este código para acessar o cardápio
            </p>
          </div>

          {/* URL Preview */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Link do cardápio:</div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all bg-white dark:bg-slate-700 p-2 rounded border">
              {menuUrl}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={openPreview} variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
              <ExternalLink className="w-3 h-3 mr-1" />
              Ver
            </Button>
            <Button onClick={downloadQR} variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
              <Download className="w-3 h-3 mr-1" />
              Baixar
            </Button>
            <Button onClick={printQR} size="sm" className="bg-slate-700 hover:bg-slate-800 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-800 rounded-xl">
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
