import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, RotateCcw, Search, Filter, Download } from "lucide-react";

interface UINode {
  id: string;
  label: string;
  type: string;
  level: number;
  parent?: string;
  children: string[];
  description?: string;
  color: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
}

export default function UIStructurePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<UINode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<UINode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize UI structure data
  useEffect(() => {
    const structureData = generateUIStructureData();
    setNodes(structureData.nodes);
    setConnections(structureData.connections);
  }, []);

  // Canvas drawing and interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw connections
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (fromNode && toNode) {
        drawConnection(ctx, fromNode, toNode);
      }
    });

    // Draw nodes
    const filteredNodes = getFilteredNodes();
    filteredNodes.forEach(node => {
      drawNode(ctx, node, node.id === selectedNode?.id);
    });

    ctx.restore();
  }, [nodes, connections, selectedNode, searchTerm, filterType, zoom, panX, panY]);

  const generateUIStructureData = () => {
    const nodeTypes = {
      'app': '#8B5CF6',           // Purple
      'provider': '#06B6D4',      // Cyan
      'router': '#10B981',        // Emerald
      'page': '#F59E0B',          // Amber
      'component': '#EF4444',     // Red
      'layout': '#3B82F6',        // Blue
      'ui-element': '#84CC16',    // Lime
      'utility': '#6B7280',       // Gray
      'data': '#EC4899'           // Pink
    };

    const rawNodes: Omit<UINode, 'x' | 'y'>[] = [
      // Root
      { id: 'app', label: 'SecuraCert App', type: 'app', level: 0, children: ['providers', 'router'], color: nodeTypes.app, description: 'Root application container' },
      
      // Providers
      { id: 'providers', label: 'Providers', type: 'provider', level: 1, parent: 'app', children: ['query-client', 'theme-provider', 'tooltip-provider'], color: nodeTypes.provider, description: 'Application providers' },
      { id: 'query-client', label: 'Query Client', type: 'provider', level: 2, parent: 'providers', children: [], color: nodeTypes.provider, description: 'TanStack Query for data fetching' },
      { id: 'theme-provider', label: 'Theme Provider', type: 'provider', level: 2, parent: 'providers', children: [], color: nodeTypes.provider, description: '7 theme system with localStorage' },
      { id: 'tooltip-provider', label: 'Tooltip Provider', type: 'provider', level: 2, parent: 'providers', children: [], color: nodeTypes.provider, description: 'Radix UI tooltips' },
      
      // Router
      { id: 'router', label: 'Router', type: 'router', level: 1, parent: 'app', children: ['auth-check', 'routes'], color: nodeTypes.router, description: 'Wouter routing system' },
      { id: 'auth-check', label: 'Auth Check', type: 'router', level: 2, parent: 'router', children: ['login-page'], color: nodeTypes.router, description: 'Authentication guard' },
      { id: 'login-page', label: 'Login Page', type: 'page', level: 3, parent: 'auth-check', children: [], color: nodeTypes.page, description: 'User authentication' },
      
      // Main Routes
      { id: 'routes', label: 'Protected Routes', type: 'router', level: 2, parent: 'router', children: ['dashboard', 'quiz-routes', 'content-routes', 'admin'], color: nodeTypes.router, description: 'Authenticated user routes' },
      
      // Dashboard
      { id: 'dashboard', label: 'Dashboard', type: 'page', level: 3, parent: 'routes', children: ['header', 'dashboard-hero', 'learning-selector', 'activity-sidebar', 'mastery-meter'], color: nodeTypes.page, description: 'Main dashboard page' },
      { id: 'header', label: 'Header', type: 'layout', level: 4, parent: 'dashboard', children: ['nav-menu', 'user-menu', 'theme-toggle', 'mobile-menu'], color: nodeTypes.layout, description: 'Global navigation header' },
      { id: 'nav-menu', label: 'Navigation Menu', type: 'component', level: 5, parent: 'header', children: [], color: nodeTypes.component, description: 'Desktop navigation with dropdowns' },
      { id: 'user-menu', label: 'User Menu', type: 'component', level: 5, parent: 'header', children: [], color: nodeTypes.component, description: 'User account dropdown' },
      { id: 'theme-toggle', label: 'Theme Toggle', type: 'component', level: 5, parent: 'header', children: [], color: nodeTypes.component, description: '7 theme selector' },
      { id: 'mobile-menu', label: 'Mobile Menu', type: 'component', level: 5, parent: 'header', children: [], color: nodeTypes.component, description: 'Responsive hamburger menu' },
      
      // Dashboard Components
      { id: 'dashboard-hero', label: 'Dashboard Hero', type: 'component', level: 4, parent: 'dashboard', children: ['ai-insights', 'quick-actions'], color: nodeTypes.component, description: 'Overview cards and AI assistant' },
      { id: 'ai-insights', label: 'AI Insights', type: 'ui-element', level: 5, parent: 'dashboard-hero', children: [], color: nodeTypes['ui-element'], description: 'HELEN AI recommendations' },
      { id: 'quick-actions', label: 'Quick Actions', type: 'ui-element', level: 5, parent: 'dashboard-hero', children: [], color: nodeTypes['ui-element'], description: 'Instant quiz creation' },
      
      { id: 'learning-selector', label: 'Learning Mode Selector', type: 'component', level: 4, parent: 'dashboard', children: ['mode-cards', 'category-grid', 'session-config'], color: nodeTypes.component, description: 'Quiz configuration interface' },
      { id: 'mode-cards', label: 'Mode Cards', type: 'ui-element', level: 5, parent: 'learning-selector', children: [], color: nodeTypes['ui-element'], description: 'Study vs Quiz mode selection' },
      { id: 'category-grid', label: 'Category Grid', type: 'ui-element', level: 5, parent: 'learning-selector', children: [], color: nodeTypes['ui-element'], description: 'Certification category selection' },
      { id: 'session-config', label: 'Session Config', type: 'ui-element', level: 5, parent: 'learning-selector', children: [], color: nodeTypes['ui-element'], description: 'Question count and time settings' },
      
      { id: 'activity-sidebar', label: 'Activity Sidebar', type: 'component', level: 4, parent: 'dashboard', children: ['recent-quizzes', 'study-guide-gen'], color: nodeTypes.component, description: 'Recent activity and actions' },
      { id: 'recent-quizzes', label: 'Recent Quizzes', type: 'ui-element', level: 5, parent: 'activity-sidebar', children: [], color: nodeTypes['ui-element'], description: 'Last 3 completed quizzes' },
      { id: 'study-guide-gen', label: 'Study Guide Generator', type: 'ui-element', level: 5, parent: 'activity-sidebar', children: [], color: nodeTypes['ui-element'], description: 'AI-powered study materials' },
      
      { id: 'mastery-meter', label: 'Mastery Meter', type: 'component', level: 4, parent: 'dashboard', children: [], color: nodeTypes.component, description: 'Certification mastery progress' },
      
      // Quiz Routes
      { id: 'quiz-routes', label: 'Quiz Routes', type: 'router', level: 3, parent: 'routes', children: ['quiz-page', 'results-page', 'review-page'], color: nodeTypes.router, description: 'Learning session pages' },
      { id: 'quiz-page', label: 'Quiz Interface', type: 'page', level: 4, parent: 'quiz-routes', children: ['question-display', 'answer-selection', 'progress-bar'], color: nodeTypes.page, description: 'Interactive quiz taking' },
      { id: 'question-display', label: 'Question Display', type: 'ui-element', level: 5, parent: 'quiz-page', children: [], color: nodeTypes['ui-element'], description: 'Question text and options' },
      { id: 'answer-selection', label: 'Answer Selection', type: 'ui-element', level: 5, parent: 'quiz-page', children: [], color: nodeTypes['ui-element'], description: 'Interactive answer choices' },
      { id: 'progress-bar', label: 'Progress Bar', type: 'ui-element', level: 5, parent: 'quiz-page', children: [], color: nodeTypes['ui-element'], description: 'Quiz completion progress' },
      
      { id: 'results-page', label: 'Results Page', type: 'page', level: 4, parent: 'quiz-routes', children: ['score-display', 'performance-chart'], color: nodeTypes.page, description: 'Quiz results and analysis' },
      { id: 'score-display', label: 'Score Display', type: 'ui-element', level: 5, parent: 'results-page', children: [], color: nodeTypes['ui-element'], description: 'Score and pass/fail status' },
      { id: 'performance-chart', label: 'Performance Chart', type: 'ui-element', level: 5, parent: 'results-page', children: [], color: nodeTypes['ui-element'], description: 'Category breakdown visualization' },
      
      { id: 'review-page', label: 'Review Page', type: 'page', level: 4, parent: 'quiz-routes', children: [], color: nodeTypes.page, description: 'Question review and explanations' },
      
      // Content Routes
      { id: 'content-routes', label: 'Content Routes', type: 'router', level: 3, parent: 'routes', children: ['achievements-page', 'accessibility-page', 'lecture-page'], color: nodeTypes.router, description: 'Educational content pages' },
      { id: 'achievements-page', label: 'Achievements', type: 'page', level: 4, parent: 'content-routes', children: ['badge-system', 'level-progress', 'achievement-tabs'], color: nodeTypes.page, description: 'Gamification center' },
      { id: 'badge-system', label: 'Badge System', type: 'component', level: 5, parent: 'achievements-page', children: [], color: nodeTypes.component, description: '90+ achievement badges' },
      { id: 'level-progress', label: 'Level Progress', type: 'component', level: 5, parent: 'achievements-page', children: [], color: nodeTypes.component, description: 'XP and level visualization' },
      { id: 'achievement-tabs', label: 'Achievement Tabs', type: 'ui-element', level: 5, parent: 'achievements-page', children: [], color: nodeTypes['ui-element'], description: 'Earned vs Progress tabs' },
      
      { id: 'accessibility-page', label: 'Accessibility Tools', type: 'page', level: 4, parent: 'content-routes', children: ['contrast-analyzer'], color: nodeTypes.page, description: 'WCAG compliance tools' },
      { id: 'contrast-analyzer', label: 'Contrast Analyzer', type: 'component', level: 5, parent: 'accessibility-page', children: [], color: nodeTypes.component, description: 'Color contrast testing' },
      
      { id: 'lecture-page', label: 'Lecture Page', type: 'page', level: 4, parent: 'content-routes', children: [], color: nodeTypes.page, description: 'AI-generated study content' },
      
      // Admin
      { id: 'admin', label: 'Admin Dashboard', type: 'page', level: 3, parent: 'routes', children: ['tenant-sidebar', 'admin-tabs'], color: nodeTypes.page, description: 'Multi-tenant administration' },
      { id: 'tenant-sidebar', label: 'Tenant Sidebar', type: 'component', level: 4, parent: 'admin', children: [], color: nodeTypes.component, description: 'Organization selector' },
      { id: 'admin-tabs', label: 'Admin Tabs', type: 'component', level: 4, parent: 'admin', children: ['overview-tab', 'categories-tab', 'questions-tab', 'users-tab'], color: nodeTypes.component, description: 'Management interface tabs' },
      { id: 'overview-tab', label: 'Overview', type: 'ui-element', level: 5, parent: 'admin-tabs', children: [], color: nodeTypes['ui-element'], description: 'Tenant statistics' },
      { id: 'categories-tab', label: 'Categories', type: 'ui-element', level: 5, parent: 'admin-tabs', children: [], color: nodeTypes['ui-element'], description: 'Certification management' },
      { id: 'questions-tab', label: 'Questions', type: 'ui-element', level: 5, parent: 'admin-tabs', children: [], color: nodeTypes['ui-element'], description: 'Question bank management' },
      { id: 'users-tab', label: 'Users', type: 'ui-element', level: 5, parent: 'admin-tabs', children: [], color: nodeTypes['ui-element'], description: 'User administration' }
    ];

    // Calculate positions using force-directed layout
    const positionedNodes = calculateNodePositions(rawNodes);
    
    // Generate connections
    const connections: Connection[] = [];
    rawNodes.forEach(node => {
      if (node.parent) {
        connections.push({ from: node.parent, to: node.id });
      }
    });

    return { nodes: positionedNodes, connections };
  };

  const calculateNodePositions = (rawNodes: Omit<UINode, 'x' | 'y'>[]): UINode[] => {
    const centerX = 600;
    const centerY = 400;
    const levelSpacing = 150;
    const angleSpacing = Math.PI * 2;

    // Group nodes by level
    const nodesByLevel: { [level: number]: Omit<UINode, 'x' | 'y'>[] } = {};
    rawNodes.forEach(node => {
      if (!nodesByLevel[node.level]) {
        nodesByLevel[node.level] = [];
      }
      nodesByLevel[node.level].push(node);
    });

    // Position nodes
    const positionedNodes: UINode[] = [];
    
    Object.keys(nodesByLevel).forEach(levelStr => {
      const level = parseInt(levelStr);
      const levelNodes = nodesByLevel[level];
      const radius = level * levelSpacing + 100;
      
      levelNodes.forEach((node, index) => {
        const angle = (index / levelNodes.length) * angleSpacing + (level * 0.5);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        positionedNodes.push({
          ...node,
          x,
          y
        });
      });
    });

    return positionedNodes;
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: UINode, isSelected: boolean) => {
    const radius = getNodeRadius(node.type);
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Draw selection ring
    if (isSelected) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const words = node.label.split(' ');
    if (words.length > 1 && radius < 25) {
      // Multi-line text for smaller nodes
      words.forEach((word, index) => {
        ctx.fillText(word, node.x, node.y + (index - words.length/2 + 0.5) * 14);
      });
    } else {
      ctx.fillText(node.label, node.x, node.y);
    }
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, fromNode: UINode, toNode: UINode) => {
    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const getNodeRadius = (type: string) => {
    const radii = {
      'app': 40,
      'provider': 25,
      'router': 30,
      'page': 35,
      'component': 25,
      'layout': 30,
      'ui-element': 20,
      'utility': 20,
      'data': 25
    };
    return radii[type as keyof typeof radii] || 20;
  };

  const getFilteredNodes = () => {
    return nodes.filter(node => {
      const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || node.type === filterType;
      return matchesSearch && matchesFilter;
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (event.clientX - rect.left - panX) / zoom;
    const clickY = (event.clientY - rect.top - panY) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((clickX - node.x) ** 2 + (clickY - node.y) ** 2);
      return distance <= getNodeRadius(node.type);
    });

    setSelectedNode(clickedNode || null);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX - panX, y: event.clientY - panY });
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPanX(event.clientX - dragStart.x);
      setPanY(event.clientY - dragStart.y);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'ui-structure.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-full mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">UI Structure Visualization</h1>
          <p className="text-muted-foreground">
            Interactive map of the SecuraCert application architecture
          </p>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="app">App</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="router">Router</SelectItem>
              <SelectItem value="page">Page</SelectItem>
              <SelectItem value="component">Component</SelectItem>
              <SelectItem value="layout">Layout</SelectItem>
              <SelectItem value="ui-element">UI Element</SelectItem>
              <SelectItem value="utility">Utility</SelectItem>
              <SelectItem value="data">Data</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom * 1.2)}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(zoom / 1.2)}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportImage}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-[600px] cursor-move"
                  onClick={handleCanvasClick}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Node Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: 'app', color: '#8B5CF6', label: 'Application' },
                  { type: 'provider', color: '#06B6D4', label: 'Provider' },
                  { type: 'router', color: '#10B981', label: 'Router' },
                  { type: 'page', color: '#F59E0B', label: 'Page' },
                  { type: 'component', color: '#EF4444', label: 'Component' },
                  { type: 'layout', color: '#3B82F6', label: 'Layout' },
                  { type: 'ui-element', color: '#84CC16', label: 'UI Element' },
                  { type: 'utility', color: '#6B7280', label: 'Utility' }
                ].map(item => (
                  <div key={item.type} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Node Info */}
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Node</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="font-medium">{selectedNode.label}</div>
                    <Badge variant="secondary" className="mt-1">
                      {selectedNode.type}
                    </Badge>
                  </div>
                  {selectedNode.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedNode.description}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Level: {selectedNode.level}
                  </div>
                  {selectedNode.children.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Children: {selectedNode.children.length}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Click nodes to view details</p>
                <p>• Drag to pan the view</p>
                <p>• Use zoom controls to scale</p>
                <p>• Search to highlight nodes</p>
                <p>• Filter by node type</p>
                <p>• Export as PNG image</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}