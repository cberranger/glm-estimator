'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  LayoutGrid, Plus, Trash2, Home, Eye, EyeOff, Lock, Unlock, 
  DoorOpen, Square, Lightbulb, SwitchCamera, Plug, Bath, Thermometer,
  Grid3X3, Move, Layers, Frame, ArrowUp, ArrowDown
} from 'lucide-react';
import type { Project, Room, LayoutLayer, LayoutElement, ElementTypeDefinition, DEFAULT_LAYERS } from '@/lib/types';
import { ELEMENT_TYPES } from '@/lib/types';

// Element icon component
function ElementIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    door: <DoorOpen className={className} />,
    window: <Frame className={className} />,
    stair: <ArrowUp className={className} />,
    light: <Lightbulb className={className} />,
    switch: <SwitchCamera className={className} />,
    outlet: <Plug className={className} />,
    fixture: <Bath className={className} />,
    vent: <Grid3X3 className={className} />,
    thermostat: <Thermometer className={className} />,
    furniture: <Square className={className} />,
  };
  return icons[type] || <Square className={className} />;
}

// Group element types by trade
const ELEMENT_GROUPS = {
  architectural: {
    name: 'Architectural',
    color: '#8B4513',
    elements: ELEMENT_TYPES.filter(e => e.layerType === 'architectural'),
  },
  electrical: {
    name: 'Electrical', 
    color: '#FFD700',
    elements: ELEMENT_TYPES.filter(e => e.layerType === 'electrical'),
  },
  plumbing: {
    name: 'Plumbing',
    color: '#1E90FF',
    elements: ELEMENT_TYPES.filter(e => e.layerType === 'plumbing'),
  },
  hvac: {
    name: 'HVAC',
    color: '#808080',
    elements: ELEMENT_TYPES.filter(e => e.layerType === 'hvac'),
  },
  finishes: {
    name: 'Finishes',
    color: '#D2691E',
    elements: ELEMENT_TYPES.filter(e => e.layerType === 'finishes'),
  },
};

export function LayoutEditor({ 
  project,
  onRefresh 
}: { 
  project: Project | null;
  onRefresh: () => void;
}) {
  // State
  const [layers, setLayers] = useState<LayoutLayer[]>([]);
  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedElement, setSelectedElement] = useState<LayoutElement | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [activeElementGroup, setActiveElementGroup] = useState<string>('architectural');
  const [selectedElementType, setSelectedElementType] = useState<ElementTypeDefinition | null>(null);
  
  // Drag state
  const [draggingRoom, setDraggingRoom] = useState<Room | null>(null);
  const [draggingElement, setDraggingElement] = useState<LayoutElement | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localRooms, setLocalRooms] = useState<Room[]>([]);
  const [localElements, setLocalElements] = useState<LayoutElement[]>([]);
  
  // Canvas state
  const [canvasRef, setCanvasRef] = useState<HTMLDivElement | null>(null);
  
  const rooms = project?.rooms || [];
  const scale = 8; // pixels per foot

  // Load layers and elements
  useEffect(() => {
    if (project) {
      // Load layers
      fetch(`/api/layers?projectId=${project.id}`)
        .then(res => res.json())
        .then(data => setLayers(data))
        .catch(console.error);
      
      // Load elements
      fetch(`/api/elements?projectId=${project.id}`)
        .then(res => res.json())
        .then(data => setElements(data))
        .catch(console.error);
    }
  }, [project]);

  // Sync local state with props
  useEffect(() => {
    setLocalRooms(rooms);
  }, [rooms]);

  useEffect(() => {
    setLocalElements(elements);
  }, [elements]);

  // Room form state
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    roomType: 'bedroom',
    length: 12,
    width: 12,
    height: 8,
    notes: '',
  });

  // Room type colors
  const roomTypeColors: Record<string, string> = {
    kitchen: 'bg-orange-100 border-orange-400',
    bathroom: 'bg-cyan-100 border-cyan-400',
    bedroom: 'bg-purple-100 border-purple-400',
    living_room: 'bg-green-100 border-green-400',
    dining_room: 'bg-amber-100 border-amber-400',
    office: 'bg-blue-100 border-blue-400',
    garage: 'bg-gray-100 border-gray-400',
    basement: 'bg-slate-200 border-slate-400',
    attic: 'bg-yellow-100 border-yellow-400',
    other: 'bg-stone-100 border-stone-400',
  };

  // Handlers
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    const floorArea = roomFormData.length * roomFormData.width;
    const perimeter = 2 * (roomFormData.length + roomFormData.width);
    const wallArea = perimeter * roomFormData.height;

    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomFormData,
          projectId: project.id,
          floorArea,
          wallArea,
          positionX: localRooms.length * 120 + 20,
          positionY: 20,
        }),
      });
      setShowRoomForm(false);
      setRoomFormData({ name: '', roomType: 'bedroom', length: 12, width: 12, height: 8, notes: '' });
      onRefresh();
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('Delete this room?')) {
      await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      setSelectedRoom(null);
      onRefresh();
    }
  };

  // Drag handlers for rooms
  const handleRoomMouseDown = (e: React.MouseEvent, room: Room) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingRoom(room);
    setSelectedRoom(room);
    setSelectedElement(null);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef) return;
    const rect = canvasRef.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left);
    const y = Math.max(0, e.clientY - rect.top);

    if (draggingRoom) {
      setLocalRooms(prev => prev.map(r => 
        r.id === draggingRoom.id ? { ...r, positionX: x - dragOffset.x, positionY: y - dragOffset.y } : r
      ));
    } else if (draggingElement) {
      setLocalElements(prev => prev.map(el => 
        el.id === draggingElement.id ? { ...el, positionX: x - dragOffset.x, positionY: y - dragOffset.y } : el
      ));
    }
  }, [canvasRef, draggingRoom, draggingElement, dragOffset]);

  const handleMouseUp = useCallback(async () => {
    if (draggingRoom) {
      const room = localRooms.find(r => r.id === draggingRoom.id);
      if (room) {
        await fetch(`/api/rooms/${room.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionX: room.positionX, positionY: room.positionY }),
        });
      }
      setDraggingRoom(null);
    }
    if (draggingElement) {
      const element = localElements.find(el => el.id === draggingElement.id);
      if (element) {
        await fetch(`/api/elements/${element.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positionX: element.positionX, positionY: element.positionY }),
        });
      }
      setDraggingElement(null);
    }
  }, [draggingRoom, draggingElement, localRooms, localElements]);

  // Element drag
  const handleElementMouseDown = (e: React.MouseEvent, element: LayoutElement) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingElement(element);
    setSelectedElement(element);
    setSelectedRoom(null);
  };

  // Add element to canvas
  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (!project || !selectedElementType || !canvasRef) return;
    if (draggingRoom || draggingElement) return;
    
    // Check if clicking on a room
    const target = e.target as HTMLElement;
    if (target.closest('[data-room]') || target.closest('[data-element]')) return;
    
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find the appropriate layer
    let layer = layers.find(l => l.tradeType === selectedElementType.layerType);
    if (!layer && layers.length > 0) {
      layer = layers[0];
    }
    if (!layer) return;

    try {
      const response = await fetch('/api/elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          layerId: layer.id,
          elementType: selectedElementType.type,
          subType: selectedElementType.subType,
          category: selectedElementType.category,
          positionX: x,
          positionY: y,
          width: selectedElementType.defaultWidth,
          height: selectedElementType.defaultHeight,
          color: selectedElementType.defaultColor,
          icon: selectedElementType.icon,
        }),
      });
      const newElement = await response.json();
      setLocalElements(prev => [...prev, newElement]);
      setElements(prev => [...prev, newElement]);
    } catch (error) {
      console.error('Error adding element:', error);
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (confirm('Delete this element?')) {
      await fetch(`/api/elements/${elementId}`, { method: 'DELETE' });
      setSelectedElement(null);
      setElements(prev => prev.filter(e => e.id !== elementId));
      setLocalElements(prev => prev.filter(e => e.id !== elementId));
    }
  };

  // Toggle layer visibility
  const toggleLayerVisibility = async (layer: LayoutLayer) => {
    const updated = await fetch(`/api/layers/${layer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !layer.isVisible }),
    }).then(res => res.json());
    setLayers(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  // Get visible layers
  const visibleLayerIds = layers.filter(l => l.isVisible).map(l => l.id);
  const visibleElements = localElements.filter(el => visibleLayerIds.includes(el.layerId));

  if (!project) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Select a project to use the layout editor</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Layout Editor</h2>
          <p className="text-muted-foreground text-sm">{project.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRoomForm(!showRoomForm)}>
            <Plus className="h-4 w-4 mr-1" /> Room
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Left Panel - Layers & Elements */}
        <div className="col-span-3 space-y-4 overflow-hidden">
          {/* Layers Panel */}
          <Card className="h-40">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" /> Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <ScrollArea className="h-24">
                {layers.map(layer => (
                  <div key={layer.id} className="flex items-center gap-2 py-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: layer.color }} />
                    <span className="text-xs flex-1 truncate">{layer.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => toggleLayerVisibility(layer)}
                    >
                      {layer.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Element Palette */}
          <Card className="flex-1 overflow-hidden">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Elements</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3 overflow-hidden">
              <div className="flex gap-1 mb-2 flex-wrap">
                {Object.entries(ELEMENT_GROUPS).map(([key, group]) => (
                  <Button
                    key={key}
                    variant={activeElementGroup === key ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 text-xs px-2"
                    style={activeElementGroup === key ? { backgroundColor: group.color } : {}}
                    onClick={() => setActiveElementGroup(key)}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="grid grid-cols-2 gap-1">
                  {ELEMENT_GROUPS[activeElementGroup as keyof typeof ELEMENT_GROUPS]?.elements.map((el, idx) => (
                    <Button
                      key={`${el.type}-${el.subType}-${idx}`}
                      variant={selectedElementType?.subType === el.subType && selectedElementType?.type === el.type ? 'default' : 'ghost'}
                      size="sm"
                      className="h-auto py-2 flex-col items-start gap-0"
                      onClick={() => setSelectedElementType(selectedElementType?.subType === el.subType ? null : el)}
                    >
                      <div className="flex items-center gap-1 w-full">
                        <ElementIcon type={el.type} className="h-3 w-3" />
                        <span className="text-[10px] truncate">{el.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Center - Canvas */}
        <Card className="col-span-6 overflow-hidden">
          <CardContent className="p-2 h-full">
            <div 
              ref={setCanvasRef}
              className="relative w-full h-full border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-auto select-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              style={{ cursor: selectedElementType ? 'crosshair' : 'default' }}
            >
              {/* Grid */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                  backgroundSize: `${scale}px ${scale}px`,
                }}
              />

              {/* Rooms */}
              {localRooms.map(room => (
                <div
                  key={room.id}
                  data-room
                  className={`absolute cursor-move transition-shadow border-2 rounded-lg ${
                    roomTypeColors[room.roomType] || 'bg-slate-100 border-slate-300'
                  } ${selectedRoom?.id === room.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                  style={{
                    left: room.positionX,
                    top: room.positionY,
                    width: room.length * scale,
                    height: room.width * scale,
                    zIndex: draggingRoom?.id === room.id ? 100 : 1,
                  }}
                  onMouseDown={(e) => handleRoomMouseDown(e, room)}
                >
                  <div className="p-1 h-full flex flex-col justify-between pointer-events-none">
                    <div className="text-[10px] font-medium truncate">{room.name}</div>
                    <div className="text-[9px] opacity-60">{room.length}'×{room.width}'</div>
                  </div>
                </div>
              ))}

              {/* Elements */}
              {visibleElements.map(element => (
                <div
                  key={element.id}
                  data-element
                  className={`absolute cursor-move flex items-center justify-center ${
                    selectedElement?.id === element.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: element.positionX,
                    top: element.positionY,
                    width: Math.max(element.width * scale, 16),
                    height: Math.max(element.height * scale, 16),
                    backgroundColor: element.color || '#666',
                    zIndex: draggingElement?.id === element.id ? 101 : 10,
                    transform: `rotate(${element.rotation || 0}deg)`,
                  }}
                  onMouseDown={(e) => handleElementMouseDown(e, element)}
                  title={element.label || `${element.elementType} - ${element.subType}`}
                >
                  <ElementIcon type={element.elementType} className="h-3 w-3 text-white drop-shadow" />
                </div>
              ))}

              {/* Empty state */}
              {localRooms.length === 0 && visibleElements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Click a room type above, then click here to place it</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Details */}
        <div className="col-span-3 space-y-4 overflow-hidden">
          {/* Add Room Form */}
          {showRoomForm && (
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">Add Room</CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <form onSubmit={handleAddRoom} className="space-y-2">
                  <Input
                    placeholder="Room name"
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                    required
                    className="h-8 text-sm"
                  />
                  <select
                    value={roomFormData.roomType}
                    onChange={(e) => setRoomFormData({ ...roomFormData, roomType: e.target.value })}
                    className="w-full h-8 px-2 rounded-md border text-sm"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="bathroom">Bathroom</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="living_room">Living Room</option>
                    <option value="dining_room">Dining Room</option>
                    <option value="office">Office</option>
                    <option value="garage">Garage</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="grid grid-cols-3 gap-1">
                    <Input type="number" placeholder="L" value={roomFormData.length} 
                      onChange={(e) => setRoomFormData({ ...roomFormData, length: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm" />
                    <Input type="number" placeholder="W" value={roomFormData.width}
                      onChange={(e) => setRoomFormData({ ...roomFormData, width: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm" />
                    <Input type="number" placeholder="H" value={roomFormData.height}
                      onChange={(e) => setRoomFormData({ ...roomFormData, height: parseFloat(e.target.value) || 8 })}
                      className="h-8 text-sm" />
                  </div>
                  <div className="flex gap-1">
                    <Button type="submit" size="sm" className="flex-1">Add</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowRoomForm(false)}>X</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Room Details */}
          {selectedRoom && !showRoomForm && (
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  {selectedRoom.name}
                  <Badge variant="outline" className="text-xs">{selectedRoom.roomType}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-muted-foreground">Area</span>
                    <p className="font-medium">{selectedRoom.floorArea} sq ft</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-muted-foreground">Size</span>
                    <p className="font-medium">{selectedRoom.length}'×{selectedRoom.width}'</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteRoom(selectedRoom.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete Room
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Element Details */}
          {selectedElement && !showRoomForm && (
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ElementIcon type={selectedElement.elementType} />
                  {selectedElement.elementType} - {selectedElement.subType}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3 space-y-2">
                <div className="text-xs space-y-1">
                  <p>Size: {selectedElement.width}' × {selectedElement.height}'</p>
                  {selectedElement.label && <p>Label: {selectedElement.label}</p>}
                  {selectedElement.notes && <p>Notes: {selectedElement.notes}</p>}
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDeleteElement(selectedElement.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!selectedRoom && !selectedElement && !showRoomForm && (
            <Card>
              <CardContent className="py-4 px-3 text-xs text-muted-foreground space-y-1">
                <p><strong>Rooms:</strong> Click Add Room button</p>
                <p><strong>Elements:</strong> Select from palette, click canvas</p>
                <p><strong>Move:</strong> Drag rooms/elements</p>
                <p><strong>Layers:</strong> Toggle visibility above</p>
              </CardContent>
            </Card>
          )}

          {/* Room Legend */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs">Room Types</CardTitle>
            </CardHeader>
            <CardContent className="py-1 px-3">
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {Object.entries(roomTypeColors).slice(0, 8).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded ${color.split(' ')[0]} border ${color.split(' ')[1]}`} />
                    <span className="capitalize truncate">{type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
