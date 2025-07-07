import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Info, FileText, Wrench } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg p-2 shadow-lg">
        <div className="flex gap-2">
          <Link to="/">
            <Button 
              variant={isActive("/") ? "default" : "ghost"} 
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Início
            </Button>
          </Link>
          <Link to="/docs">
            <Button 
              variant={isActive("/docs") ? "default" : "ghost"} 
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Docs
            </Button>
          </Link>
          <Link to="/tools">
            <Button 
              variant={isActive("/tools") ? "default" : "ghost"} 
              size="sm"
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              Tools
            </Button>
          </Link>
          <Link to="/about">
            <Button 
              variant={isActive("/about") ? "default" : "ghost"} 
              size="sm"
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Sobre
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};