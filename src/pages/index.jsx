import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Menu from "./Menu";

import Orders from "./Orders";

import Tables from "./Tables";

import MenuDisplay from "./MenuDisplay";

import DisplaySettings from "./DisplaySettings";

import SystemSettings from "./SystemSettings";

import CustomerMenu from "./CustomerMenu";

import Reports from "./Reports";

import BierServPrompt from "./BierServPrompt";

import MenuPDF from "./MenuPDF";

import Users from "./Users";

import FiscalReportPrintPage from "./FiscalReportPrintPage";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Menu: Menu,
    
    Orders: Orders,
    
    Tables: Tables,
    
    MenuDisplay: MenuDisplay,
    
    DisplaySettings: DisplaySettings,
    
    SystemSettings: SystemSettings,
    
    CustomerMenu: CustomerMenu,
    
    Reports: Reports,
    
    BierServPrompt: BierServPrompt,
    
    MenuPDF: MenuPDF,
    
    Users: Users,
    
    FiscalReportPrintPage: FiscalReportPrintPage,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Menu" element={<Menu />} />
                
                <Route path="/Orders" element={<Orders />} />
                
                <Route path="/Tables" element={<Tables />} />
                
                <Route path="/MenuDisplay" element={<MenuDisplay />} />
                
                <Route path="/DisplaySettings" element={<DisplaySettings />} />
                
                <Route path="/SystemSettings" element={<SystemSettings />} />
                
                <Route path="/CustomerMenu" element={<CustomerMenu />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/BierServPrompt" element={<BierServPrompt />} />
                
                <Route path="/MenuPDF" element={<MenuPDF />} />
                
                <Route path="/Users" element={<Users />} />
                
                <Route path="/FiscalReportPrintPage" element={<FiscalReportPrintPage />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}