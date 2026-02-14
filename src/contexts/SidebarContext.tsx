import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    autoCollapse: boolean;
    setAutoCollapse: (auto: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [autoCollapse, setAutoCollapse] = useState(false);

    return (
        <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, autoCollapse, setAutoCollapse }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
