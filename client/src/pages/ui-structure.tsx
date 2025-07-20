import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ChevronRight, ChevronLeft, RotateCcw, Database, Router, Layout, Component, Zap, Globe, Settings } from "lucide-react";

interface UINode {
  id: string;
  label: string;
  type: string;
  level: number;
  description: string;
  children?: string[];
}

const UIStructurePage = () => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('app');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Define the complete application hierarchy
  const applicationNodes: UINode[] = [
    // Level 0 - Root
    { 
      id: 'app', 
      label: 'SecuraCert App', 
      type: 'app', 
      level: 0, 
      description: 'Root application container with React and TypeScript',
      children: ['providers', 'router']
    },
    
    // Level 1 - Main Architecture
    { 
      id: 'providers', 
      label: 'Providers', 
      type: 'provider', 
      level: 1, 
      description: 'Application-wide providers for state and context',
      children: ['query-client', 'theme-provider', 'tooltip-provider']
    },
    { 
      id: 'router', 
      label: 'Router', 
      type: 'router', 
      level: 1, 
      description: 'Wouter routing system for navigation',
      children: ['auth-check', 'routes']
    },
    
    // Level 2 - Providers
    { 
      id: 'query-client', 
      label: 'Query Client', 
      type: 'provider', 
      level: 2, 
      description: 'TanStack Query for server state management and caching',
      children: []
    },
    { 
      id: 'theme-provider', 
      label: 'Theme Provider', 
      type: 'provider', 
      level: 2, 
      description: '7 theme system with localStorage persistence',
      children: []
    },
    { 
      id: 'tooltip-provider', 
      label: 'Tooltip Provider', 
      type: 'provider', 
      level: 2, 
      description: 'Radix UI tooltips for enhanced UX',
      children: []
    },
    
    // Level 2 - Router Components
    { 
      id: 'auth-check', 
      label: 'Auth Check', 
      type: 'router', 
      level: 2, 
      description: 'Authentication guard for protected routes',
      children: []
    },
    { 
      id: 'routes', 
      label: 'Protected Routes', 
      type: 'router', 
      level: 2, 
      description: 'Authenticated user application routes',
      children: ['login-page', 'dashboard', 'quiz-routes', 'admin', 'achievements', 'accessibility']
    },
    
    // Level 3 - Main Pages
    { 
      id: 'login-page', 
      label: 'Login Page', 
      type: 'page', 
      level: 3, 
      description: 'User authentication with registration and login forms',
      children: []
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      type: 'page', 
      level: 3, 
      description: 'Main dashboard with progress tracking and quick actions',
      children: ['dashboard-hero', 'activity-sidebar', 'learning-mode-selector']
    },
    { 
      id: 'quiz-routes', 
      label: 'Quiz System', 
      type: 'router', 
      level: 3, 
      description: 'Learning session pages and quiz interface',
      children: ['quiz-page', 'results-page', 'review-page']
    },
    { 
      id: 'admin', 
      label: 'Admin Dashboard', 
      type: 'page', 
      level: 3, 
      description: 'Multi-tenant administration system',
      children: ['tenant-management', 'question-management', 'user-management']
    },
    { 
      id: 'achievements', 
      label: 'Achievements', 
      type: 'page', 
      level: 3, 
      description: 'Gamification system with badges and progress tracking',
      children: []
    },
    { 
      id: 'accessibility', 
      label: 'Accessibility', 
      type: 'page', 
      level: 3, 
      description: 'WCAG compliance checker and contrast analyzer',
      children: []
    },
    
    // Level 4 - Dashboard Components
    { 
      id: 'dashboard-hero', 
      label: 'Dashboard Hero', 
      type: 'component', 
      level: 4, 
      description: 'Main dashboard cards with progress metrics and AI assistant',
      children: []
    },
    { 
      id: 'activity-sidebar', 
      label: 'Activity Sidebar', 
      type: 'component', 
      level: 4, 
      description: 'Recent activity, progress tracking, and quick actions',
      children: []
    },
    { 
      id: 'learning-mode-selector', 
      label: 'Learning Mode Selector', 
      type: 'component', 
      level: 4, 
      description: 'Certification selection and quiz configuration',
      children: []
    },
    
    // Level 4 - Quiz System
    { 
      id: 'quiz-page', 
      label: 'Quiz Interface', 
      type: 'page', 
      level: 4, 
      description: 'Interactive quiz interface with immediate feedback',
      children: []
    },
    { 
      id: 'results-page', 
      label: 'Results Page', 
      type: 'page', 
      level: 4, 
      description: 'Quiz results with performance analytics and recommendations',
      children: []
    },
    { 
      id: 'review-page', 
      label: 'Review Page', 
      type: 'page', 
      level: 4, 
      description: 'Detailed answer review with explanations',
      children: []
    },
    
    // Level 4 - Admin Components
    { 
      id: 'tenant-management', 
      label: 'Tenant Management', 
      type: 'component', 
      level: 4, 
      description: 'Multi-organization management with statistics',
      children: []
    },
    { 
      id: 'question-management', 
      label: 'Question Management', 
      type: 'component', 
      level: 4, 
      description: 'Comprehensive question database administration',
      children: []
    },
    { 
      id: 'user-management', 
      label: 'User Management', 
      type: 'component', 
      level: 4, 
      description: 'User administration and role management',
      children: []
    }
  ];

  const nodeMap = useMemo(() => {
    return applicationNodes.reduce((map, node) => {
      map[node.id] = node;
      return map;
    }, {} as Record<string, UINode>);
  }, []);

  const currentNode = nodeMap[currentNodeId];
  const parentNode = applicationNodes.find(node => node.children?.includes(currentNodeId));
  const childNodes = currentNode?.children?.map(childId => nodeMap[childId]).filter(Boolean) || [];

  const getNodeColor = (type: string) => {
    const colors = {
      'app': 'bg-purple-500',
      'provider': 'bg-cyan-500',
      'router': 'bg-emerald-500',
      'page': 'bg-amber-500',
      'component': 'bg-red-500',
      'layout': 'bg-blue-500',
      'ui-element': 'bg-lime-500',
      'utility': 'bg-gray-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getNodeIcon = (type: string) => {
    const icons = {
      'app': Globe,
      'provider': Settings,
      'router': Router,
      'page': Layout,
      'component': Component,
      'layout': Layout,
      'ui-element': Zap,
      'utility': Database,
    };
    const IconComponent = icons[type as keyof typeof icons] || Component;
    return <IconComponent className="w-5 h-5" />;
  };

  const filteredNodes = useMemo(() => {
    const nodesToFilter = [currentNode, ...childNodes].filter(Boolean);
    return nodesToFilter.filter(node => {
      const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || node.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [currentNode, childNodes, searchTerm, filterType]);

  const navigateToNode = (nodeId: string) => {
    setCurrentNodeId(nodeId);
  };

  const navigateUp = () => {
    if (parentNode) {
      setCurrentNodeId(parentNode.id);
    }
  };

  const resetView = () => {
    setCurrentNodeId('app');
    setSearchTerm("");
    setFilterType("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">UI Structure Visualization</h1>
            <p className="text-muted-foreground mt-2">
              Explore the SecuraCert application architecture. Navigate through components and understand the system structure.
            </p>
          </div>

          {/* Navigation Breadcrumb */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={navigateUp}
                  disabled={!parentNode}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Up
                </Button>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Level {currentNode?.level}</span>
                  <ChevronRight className="w-4 h-4" />
                  <Badge variant="secondary">{currentNode?.type}</Badge>
                  <span className="font-medium text-foreground">{currentNode?.label}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetView}
                  className="ml-auto"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search components..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Filter by Type</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="app">App</SelectItem>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="router">Router</SelectItem>
                        <SelectItem value="page">Page</SelectItem>
                        <SelectItem value="component">Component</SelectItem>
                        <SelectItem value="layout">Layout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Currently viewing: <span className="font-medium">{currentNode?.label}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {childNodes.length} child components
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Current Node */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${getNodeColor(currentNode?.type || '')} flex items-center justify-center text-white`}>
                        {getNodeIcon(currentNode?.type || '')}
                      </div>
                      <div>
                        <div className="text-xl">{currentNode?.label}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          Level {currentNode?.level} • {currentNode?.type}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{currentNode?.description}</p>
                  </CardContent>
                </Card>

                {/* Child Nodes */}
                {childNodes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Child Components ({childNodes.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredNodes.slice(1).map((node) => (
                        <Card 
                          key={node.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigateToNode(node.id)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full ${getNodeColor(node.type)} flex items-center justify-center text-white flex-shrink-0`}>
                                {getNodeIcon(node.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{node.label}</div>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {node.type}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {node.description}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-xs text-muted-foreground">
                                    Level {node.level}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Children Message */}
                {childNodes.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        This component has no child components.
                      </p>
                      {parentNode && (
                        <Button 
                          variant="outline" 
                          onClick={navigateUp}
                          className="mt-4"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Back to {parentNode.label}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UIStructurePage;