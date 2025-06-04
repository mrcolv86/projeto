
import React, { useState, useEffect } from "react";
import { Invoice, Table, SystemSettings } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FiscalReportPrintPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState(null);
  const [tables, setTables] = useState([]);
  const [reportParams, setReportParams] = useState({
    startDate: null,
    endDate: null,
    displayDateRange: '',
    paymentMethod: 'Todos',
    searchTerm: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startDateISO = params.get("startDate");
    const endDateISO = params.get("endDate");
    
    setReportParams({
      startDate: startDateISO ? new Date(startDateISO) : null,
      endDate: endDateISO ? new Date(endDateISO) : null,
      displayDateRange: decodeURIComponent(params.get("displayDateRange") || "N/A"),
      paymentMethod: params.get("paymentMethod") || "Todos",
      searchTerm: params.get("searchTerm") || "",
    });
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, settingsData, tablesData] = await Promise.all([
        Invoice.list("-created_date"), // Fetch all initially, filter client-side based on params
        SystemSettings.list(),
        Table.list()
      ]);
      setInvoices(invoicesData);
      setTables(tablesData);
      if (settingsData.length > 0) {
        setSystemSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const getTableNumber = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table?.number || "N/A";
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Only proceed if dates are valid. If not, don't include any invoices.
    if (!reportParams.startDate || !reportParams.endDate) return false; 

    const invoiceDate = new Date(invoice.created_date);
    const dateMatch = invoiceDate >= reportParams.startDate && invoiceDate <= reportParams.endDate;
    
    const paymentMatch = reportParams.paymentMethod === "Todos" || 
                         invoice.payment_method === reportParams.paymentMethod.toLowerCase().replace(' ', '_');
    
    const searchMatch = reportParams.searchTerm === "" ||
      invoice.invoice_number?.toLowerCase().includes(reportParams.searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(reportParams.searchTerm.toLowerCase());

    return dateMatch && paymentMatch && searchMatch;
  });
  
  const calculateTotals = () => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0);
    const totalServiceFee = filteredInvoices.reduce((sum, inv) => sum + (inv.service_fee || 0), 0);
    return { totalRevenue, totalTax, totalServiceFee, count: filteredInvoices.length };
  };

  const totals = calculateTotals();

  useEffect(() => {
    if (!loading && filteredInvoices.length > 0) {
      // Delay print slightly to ensure content is rendered
      setTimeout(() => window.print(), 500);
    }
  }, [loading, filteredInvoices]); // Re-run when loading status or filtered invoices change

  if (loading) {
    return <div className="p-10 text-center">Carregando relatório...</div>;
  }

  const businessName = systemSettings?.business_name || "BierServ";
  const businessSubtitle = systemSettings?.business_subtitle || "Cervejaria Digital";
  const logoUrl = systemSettings?.logo_url;

  return (
    <div className="p-4 md:p-8 bg-white text-gray-800 printable-area">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .printable-area {
            box-shadow: none;
            border: none;
            width: 100%;
            padding: 10mm; /* Adjust as needed for print margins */
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        .printable-area {
          max-width: 800px;
          margin: 20px auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          border: 1px solid #ddd;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <header className="text-center mb-8 border-b pb-6">
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />}
        <h1 className="text-3xl font-bold text-gray-900">{businessName}</h1>
        {businessSubtitle && <p className="text-md text-gray-600">{businessSubtitle}</p>}
        <h2 className="text-2xl font-semibold mt-4 text-gray-800">Relatório Fiscal</h2>
        <div className="mt-2 text-sm text-gray-500">
          <p>Período: {reportParams.displayDateRange}</p>
          <p>Método de Pagamento: {reportParams.paymentMethod}</p>
          {reportParams.searchTerm && <p>Busca: "{reportParams.searchTerm}"</p>}
        </div>
      </header>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500">Nenhum invoice encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <>
          <section className="mb-8 p-4 bg-gray-50 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Resumo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Total de Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">R$ {totals.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Impostos</p>
                <p className="text-2xl font-bold text-orange-600">R$ {totals.totalTax.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Taxa de Serviço</p>
                <p className="text-2xl font-bold text-blue-600">R$ {totals.totalServiceFee.toFixed(2)}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Detalhes dos Invoices</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mesa</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total (R$)</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Pagamento</th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-sm font-mono text-gray-700">{invoice.invoice_number}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">M {getTableNumber(invoice.table_id)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">{invoice.customer_name || "N/A"}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(invoice.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm font-bold text-right text-green-700">{invoice.total_amount?.toFixed(2)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-center text-gray-700 capitalize">{invoice.payment_method?.replace('_', ' ')}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.payment_status === "pago" ? "bg-green-100 text-green-800" : 
                          invoice.payment_status === "pendente" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        }`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <footer className="mt-12 pt-6 border-t text-center text-xs text-gray-500 no-print">
        Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })} por BierServ.
      </footer>
    </div>
  );
}
