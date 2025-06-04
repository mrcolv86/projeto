import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cast, Tv, Loader2, Check, X } from "lucide-react"; // Changed Chromecast to Cast
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChromecastButton({ url, title = "BierServ Menu" }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [connection, setConnection] = useState(null);

  // Check if Presentation API is supported
  const isPresentationSupported = typeof window !== "undefined" && 
    "presentation" in navigator && 
    "PresentationRequest" in window;

  useEffect(() => {
    if (isPresentationSupported) {
      // Monitor for available presentation displays
      const request = new PresentationRequest([url]);
      
      request.addEventListener('connectionavailable', (event) => {
        const conn = event.connection;
        setConnection(conn);
        setIsConnected(true);
        
        conn.addEventListener('close', () => {
          setIsConnected(false);
          setConnection(null);
        });
      });

      // Get available devices
      request.getAvailability().then((availability) => {
        availability.addEventListener('change', () => {
          setAvailableDevices(availability.value ? ['chromecast'] : []); // Keep internal logic name
        });
        setAvailableDevices(availability.value ? ['chromecast'] : []); // Keep internal logic name
      });
    }
  }, [url]);

  const startCasting = async () => {
    if (!isPresentationSupported) {
      // Fallback: open in new window
      window.open(url, '_blank', 'fullscreen=yes');
      return;
    }

    setIsConnecting(true);
    
    try {
      const request = new PresentationRequest([url]);
      const conn = await request.start();
      
      setConnection(conn);
      setIsConnected(true);
      setShowDeviceList(false);
      
      // Handle connection events
      conn.addEventListener('connect', () => {
        console.log('Connected to display');
      });
      
      conn.addEventListener('close', () => {
        setIsConnected(false);
        setConnection(null);
      });
      
      conn.addEventListener('terminate', () => {
        setIsConnected(false);
        setConnection(null);
      });
      
    } catch (error) {
      console.error('Failed to start presentation:', error);
      // Fallback: open in new window
      window.open(url, '_blank', 'fullscreen=yes');
    } finally {
      setIsConnecting(false);
    }
  };

  const stopCasting = () => {
    if (connection) {
      connection.terminate();
      setConnection(null);
      setIsConnected(false);
    }
  };

  const handleCastClick = () => {
    if (isConnected) {
      stopCasting();
    } else if (availableDevices.length > 1) {
      setShowDeviceList(true);
    } else {
      startCasting();
    }
  };

  return (
    <>
      <Button
        onClick={handleCastClick}
        disabled={isConnecting}
        className={`relative ${
          isConnected 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : isConnected ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <Cast className="w-4 h-4 mr-2" /> // Changed from Chromecast
        )}
        
        {isConnecting 
          ? "Conectando..." 
          : isConnected 
            ? "Desconectar TV" 
            : "Transmitir para TV"
        }
        
        {availableDevices.length > 0 && !isConnected && (
          <Badge className="ml-2 bg-green-500 text-white text-xs">
            {availableDevices.length}
          </Badge>
        )}
      </Button>

      {/* Device Selection Dialog */}
      <Dialog open={showDeviceList} onOpenChange={setShowDeviceList}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5" />
              Selecionar Dispositivo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Escolha o dispositivo para exibir o cardápio:
            </p>
            
            <div className="space-y-2">
              <Button
                onClick={startCasting}
                variant="outline"
                className="w-full justify-start"
              >
                <Cast className="w-4 h-4 mr-3" /> {/* Changed from Chromecast */}
                Google Chromecast
              </Button>
              
              <Button
                onClick={() => {
                  window.open(url, '_blank', 'fullscreen=yes');
                  setShowDeviceList(false);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Tv className="w-4 h-4 mr-3" />
                Abrir em Nova Aba
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}