'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  LayoutGrid, 
  Package, 
  Users, 
  FileText, 
  Plus, 
  Search,
  DollarSign,
  Ruler,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Download,
  Copy,
  Calculator,
  Wrench,
  Paintbrush,
  Hammer,
  Zap,
  Droplets,
  Wind,
  Home,
  Layers,
  Settings,
  ChevronRight,
  Save,
  X,
  Check,
  Upload
} from 'lucide-react';
import type { Project, Room, LineItemData, LaborCodeData, Estimate, EstimateLineItem, Division, DivisionWithCategories, LineItem, Material, Labor } from '@/lib/types';
import { ImportPanel } from '@/components/ImportPanel';

// Dashboard Component
function Dashboard({ 
  projects, 
  onSelectProject 
}: { 
  projects: Project[]; 
  onSelectProject: (project: Project) => void;
}) {
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + p.totalBudget, 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalProjects}</div>
            <p className="text-xs text-blue-600 mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Active Projects</CardTitle>
            <Wrench className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.activeProjects}</div>
            <p className="text-xs text-amber-600 mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.completedProjects}</div>
            <p className="text-xs text-green-600 mt-1">Finished</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              ${stats.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 mt-1">Combined value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest construction and renovation projects</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet. Create your first project to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onSelectProject(project)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Home className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.clientName || 'No client'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      project.status === 'completed' ? 'default' :
                      project.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Projects Manager Component
function ProjectsManager({ 
  projects,
  onRefresh,
  onSelectProject 
}: { 
  projects: Project[];
  onRefresh: () => void;
  onSelectProject: (project: Project) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
    projectType: 'renovation',
    totalBudget: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        address: '',
        projectType: 'renovation',
        totalBudget: 0,
      });
      onRefresh();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      onRefresh();
    }
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      clientPhone: project.clientPhone || '',
      address: project.address || '',
      projectType: project.projectType,
      totalBudget: project.totalBudget,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage your construction and renovation projects</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingProject(null); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingProject ? 'Edit Project' : 'New Project'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type</Label>
                  <select
                    id="projectType"
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="renovation">Renovation</option>
                    <option value="new_construction">New Construction</option>
                    <option value="remodel">Remodel</option>
                    <option value="addition">Addition</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Budget ($)</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingProject ? 'Update' : 'Create'} Project</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingProject(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.projectType.replace('_', ' ')}</CardDescription>
                </div>
                <Badge variant={
                  project.status === 'completed' ? 'default' :
                  project.status === 'in_progress' ? 'secondary' : 'outline'
                }>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.clientName && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{project.clientName}</span>
                </div>
              )}
              {project.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{project.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">${project.totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>{project.rooms?.length || 0} rooms</span>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => onSelectProject(project)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(project)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(project.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Layout Editor Component
function LayoutEditor({ 
  project,
  onRefresh 
}: { 
  project: Project | null;
  onRefresh: () => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    roomType: 'bedroom',
    length: 10,
    width: 10,
    height: 8,
    notes: '',
  });

  // Use rooms from project directly
  const rooms = project?.rooms || [];

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomFormData,
          projectId: project.id,
          positionX: rooms.length * 170 + 20,
          positionY: 20,
        }),
      });
      const newRoom = await response.json();
      setShowRoomForm(false);
      setRoomFormData({
        name: '',
        roomType: 'bedroom',
        length: 10,
        width: 10,
        height: 8,
        notes: '',
      });
      onRefresh();
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
      setSelectedRoom(null);
      onRefresh();
    }
  };

  const roomTypeColors: Record<string, string> = {
    kitchen: 'bg-orange-100 border-orange-300',
    bathroom: 'bg-cyan-100 border-cyan-300',
    bedroom: 'bg-purple-100 border-purple-300',
    living_room: 'bg-green-100 border-green-300',
    dining_room: 'bg-amber-100 border-amber-300',
    office: 'bg-blue-100 border-blue-300',
    garage: 'bg-gray-100 border-gray-300',
    basement: 'bg-slate-100 border-slate-300',
    attic: 'bg-yellow-100 border-yellow-300',
    other: 'bg-slate-100 border-slate-300',
  };

  const scale = 8; // pixels per foot

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Layout Editor</h2>
          <p className="text-muted-foreground">
            {project ? `Design layout for ${project.name}` : 'Select a project to edit layout'}
          </p>
        </div>
        {project && (
          <Button onClick={() => setShowRoomForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        )}
      </div>

      {!project ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Select a project from the Projects tab to use the layout editor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Canvas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Floor Plan
              </CardTitle>
              <CardDescription>
                Visual layout of {rooms.length} rooms. Click a room to edit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="relative border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 overflow-auto"
                style={{ minHeight: '400px' }}
              >
                {/* Grid background */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                    backgroundSize: `${scale}px ${scale}px`,
                  }}
                />
                
                {/* Rooms */}
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`absolute cursor-pointer transition-all hover:shadow-lg ${
                      roomTypeColors[room.roomType] || 'bg-slate-100 border-slate-300'
                    } ${selectedRoom?.id === room.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''} border-2 rounded-lg`}
                    style={{
                      left: room.positionX,
                      top: room.positionY,
                      width: room.length * scale,
                      height: room.width * scale,
                    }}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="p-1 h-full flex flex-col justify-between">
                      <div className="text-xs font-medium truncate">{room.name}</div>
                      <div className="text-xs opacity-70">
                        {room.length}' x {room.width}'
                      </div>
                    </div>
                  </div>
                ))}

                {rooms.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Add rooms to create your floor plan</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Room Details */}
          <div className="space-y-4">
            {showRoomForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Room</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddRoom} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomName">Room Name *</Label>
                      <Input
                        id="roomName"
                        value={roomFormData.name}
                        onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                        placeholder="e.g., Master Bedroom"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomType">Room Type</Label>
                      <select
                        id="roomType"
                        value={roomFormData.roomType}
                        onChange={(e) => setRoomFormData({ ...roomFormData, roomType: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="kitchen">Kitchen</option>
                        <option value="bathroom">Bathroom</option>
                        <option value="bedroom">Bedroom</option>
                        <option value="living_room">Living Room</option>
                        <option value="dining_room">Dining Room</option>
                        <option value="office">Office</option>
                        <option value="garage">Garage</option>
                        <option value="basement">Basement</option>
                        <option value="attic">Attic</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="length">Length (ft)</Label>
                        <Input
                          id="length"
                          type="number"
                          value={roomFormData.length}
                          onChange={(e) => setRoomFormData({ ...roomFormData, length: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="width">Width (ft)</Label>
                        <Input
                          id="width"
                          type="number"
                          value={roomFormData.width}
                          onChange={(e) => setRoomFormData({ ...roomFormData, width: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height (ft)</Label>
                        <Input
                          id="height"
                          type="number"
                          value={roomFormData.height}
                          onChange={(e) => setRoomFormData({ ...roomFormData, height: parseFloat(e.target.value) || 8 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <textarea
                        id="notes"
                        value={roomFormData.notes}
                        onChange={(e) => setRoomFormData({ ...roomFormData, notes: e.target.value })}
                        className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Add Room</Button>
                      <Button type="button" variant="outline" onClick={() => setShowRoomForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : selectedRoom ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedRoom.name}
                    <Badge variant="outline">{selectedRoom.roomType.replace('_', ' ')}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Floor Area</p>
                      <p className="text-lg font-semibold">{selectedRoom.floorArea} sq ft</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Wall Area</p>
                      <p className="text-lg font-semibold">{selectedRoom.wallArea} sq ft</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Dimensions</p>
                      <p className="text-lg font-semibold">{selectedRoom.length}' x {selectedRoom.width}'</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Height</p>
                      <p className="text-lg font-semibold">{selectedRoom.height}'</p>
                    </div>
                  </div>
                  {selectedRoom.notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Notes:</p>
                      <p>{selectedRoom.notes}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => handleDeleteRoom(selectedRoom.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Ruler className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Click a room to view details</p>
                </CardContent>
              </Card>
            )}

            {/* Room Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Room Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(roomTypeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${color.split(' ')[0]} border ${color.split(' ')[1]}`} />
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Material Browser Component
function MaterialsBrowser({ onAddToEstimate }: { onAddToEstimate: (material: LineItemData) => void }) {
  const [materials, setMaterials] = useState<LineItemData[]>([]);
  const [divisions, setDivisions] = useState<DivisionWithCategories[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryTree, setShowCategoryTree] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedDivision !== 'all') params.append('division', selectedDivision);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        
        const response = await fetch(`/api/materials?${params.toString()}`);
        const data = await response.json();
        setMaterials(data.materials || []);
        setDivisions(data.divisions || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
      setLoading(false);
    };
    fetchMaterials();
  }, [search, selectedDivision, selectedCategory]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const toggleDivision = (code: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedDivisions(newExpanded);
  };

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDivisionSelect = (code: string) => {
    setSelectedDivision(code === selectedDivision ? 'all' : code);
    setSelectedCategory('all');
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId === selectedCategory ? 'all' : catId);
  };

  const handleSubcategorySelect = (subcatId: string) => {
    setSelectedCategory(subcatId === selectedCategory ? 'all' : subcatId);
  };

  // Get current selection display
  const getCurrentSelection = () => {
    if (selectedCategory !== 'all') {
      // Find the category name
      for (const div of divisions) {
        for (const cat of div.categories) {
          if (cat.id === selectedCategory) return cat.name;
          for (const subcat of cat.subcategories) {
            if (subcat.id === selectedCategory) return `${cat.name} > ${subcat.name}`;
          }
        }
      }
    }
    if (selectedDivision !== 'all') {
      const div = divisions.find(d => d.code === selectedDivision);
      return div ? `${div.code} - ${div.name}` : 'All Categories';
    }
    return 'All Categories';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cost Items Database</h2>
          <p className="text-muted-foreground">Browse CSI MasterFormat construction items with material, labor & equipment costs</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {materials.length} items
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowCategoryTree(!showCategoryTree)}
          className="flex items-center gap-2"
        >
          <Layers className="h-4 w-4" />
          {showCategoryTree ? 'Hide' : 'Show'} Categories
        </Button>
      </div>

      {/* Current Selection */}
      {(selectedDivision !== 'all' || selectedCategory !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          <Badge variant="secondary" className="flex items-center gap-1">
            {getCurrentSelection()}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => {
                setSelectedDivision('all');
                setSelectedCategory('all');
              }}
            />
          </Badge>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Category Tree Sidebar */}
        {showCategoryTree && (
          <Card className="lg:col-span-1 h-fit max-h-[70vh] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>CSI Categories</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => {
                    setSelectedDivision('all');
                    setSelectedCategory('all');
                  }}
                >
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[55vh]">
                <div className="p-2">
                  {/* All Items */}
                  <button
                    className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                      selectedDivision === 'all' && selectedCategory === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      setSelectedDivision('all');
                      setSelectedCategory('all');
                    }}
                  >
                    <Package className="h-4 w-4" />
                    All Items
                  </button>

                  {/* Divisions and Categories */}
                  {divisions.map((div) => (
                    <div key={div.code} className="mt-1">
                      {/* Division Header */}
                      <button
                        className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${
                          selectedDivision === div.code && selectedCategory === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-slate-100 font-medium'
                        }`}
                        onClick={() => handleDivisionSelect(div.code)}
                      >
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${
                            expandedDivisions.has(div.code) ? 'rotate-90' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDivision(div.code);
                          }}
                        />
                        <span className="text-xs text-muted-foreground w-6">{div.code}</span>
                        <span className="truncate">{div.name}</span>
                      </button>

                      {/* Categories under Division */}
                      {expandedDivisions.has(div.code) && (
                        <div className="ml-4 border-l-2 border-slate-200 pl-2 mt-1">
                          {div.categories.map((cat) => (
                            <div key={cat.id}>
                              {/* Category Header */}
                              <button
                                className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 transition-colors ${
                                  selectedCategory === cat.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-slate-50'
                                }`}
                                onClick={() => handleCategorySelect(cat.id)}
                              >
                                {cat.subcategories.length > 0 && (
                                  <ChevronRight 
                                    className={`h-3 w-3 transition-transform ${
                                      expandedCategories.has(cat.id) ? 'rotate-90' : ''
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCategory(cat.id);
                                    }}
                                  />
                                )}
                                {cat.subcategories.length === 0 && <span className="w-3" />}
                                <span className="truncate">{cat.name}</span>
                              </button>

                              {/* Subcategories */}
                              {expandedCategories.has(cat.id) && cat.subcategories.length > 0 && (
                                <div className="ml-4 border-l border-slate-100 pl-2">
                                  {cat.subcategories.map((subcat) => (
                                    <button
                                      key={subcat.id}
                                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center gap-2 transition-colors ${
                                        selectedCategory === subcat.id
                                          ? 'bg-primary/10 text-primary'
                                          : 'hover:bg-slate-50 text-muted-foreground'
                                      }`}
                                      onClick={() => handleSubcategorySelect(subcat.id)}
                                    >
                                      <span className="w-3" />
                                      <span className="truncate">{subcat.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Materials Grid */}
        <div className={showCategoryTree ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {loading ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading cost items...</p>
            </div>
          ) : materials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No items found matching your criteria</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch('');
                    setSelectedDivision('all');
                    setSelectedCategory('all');
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {materials.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {item.divisionCode} - {item.division}
                            </Badge>
                          </div>
                          {item.parentCategory && (
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.parentCategory} → {item.category}
                              </Badge>
                            </div>
                          )}
                          {!item.parentCategory && item.category && (
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddToEstimate(item)}
                        title="Add to estimate"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Material:</span>
                        <span className="font-medium">{formatCurrency(item.materialCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor:</span>
                        <span className="font-medium">{formatCurrency(item.laborCost)}</span>
                      </div>
                      {item.equipmentCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equipment:</span>
                          <span className="font-medium">{formatCurrency(item.equipmentCost)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">per {item.unit}:</span>
                        <span className="font-bold text-green-600">{formatCurrency(item.unitPrice)}</span>
                      </div>
                    </div>
                    {item.variants && item.variants.length > 1 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Variants available:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.variants.slice(0, 3).map(v => (
                            <Badge key={v.id} variant="secondary" className="text-xs">
                              {v.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Labor Browser Component
function LaborBrowser({ onAddToEstimate }: { onAddToEstimate: (labor: LaborCodeData) => void }) {
  const [laborItems, setLaborItems] = useState<LaborCodeData[]>([]);
  const [trades, setTrades] = useState<{ name: string; count: number }[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabor = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedTrade !== 'all') params.append('trade', selectedTrade);
        
        const response = await fetch(`/api/labor?${params.toString()}`);
        const data = await response.json();
        setLaborItems(data.laborItems || []);
        setTrades(data.trades || []);
      } catch (error) {
        console.error('Error fetching labor:', error);
      }
      setLoading(false);
    };
    fetchLabor();
  }, [search, selectedTrade]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const tradeIcons: Record<string, React.ReactNode> = {
    Carpenters: <Hammer className="h-4 w-4" />,
    Electricians: <Zap className="h-4 w-4" />,
    Plumbers: <Droplets className="h-4 w-4" />,
    Painters: <Paintbrush className="h-4 w-4" />,
    'HVAC Technician': <Wind className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Labor Database</h2>
          <p className="text-muted-foreground">Browse construction labor rates and tasks</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {laborItems.length} labor items
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search labor tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={selectedTrade}
          onChange={(e) => setSelectedTrade(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background min-w-[200px]"
        >
          <option value="all">All Trades</option>
          {trades.map((trade) => (
            <option key={trade.name} value={trade.name}>
              {trade.name} ({trade.count})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading labor items...</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {laborItems.map((labor) => (
            <Card key={labor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded bg-slate-100 mt-0.5">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{labor.codeName}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {labor.laborCode}
                        </Badge>
                        <Badge variant={labor.isCrew ? "default" : "secondary"} className="text-xs">
                          {labor.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddToEstimate(labor)}
                    title="Add to estimate"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {labor.description && (
                  <p className="text-xs text-muted-foreground mb-2">{labor.description}</p>
                )}
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-semibold text-green-600">
                    {labor.baseHourlyRate ? formatCurrency(labor.baseHourlyRate) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Estimate Builder Component
function EstimateBuilder({ 
  project,
  onRefresh 
}: { 
  project: Project | null;
  onRefresh: () => void;
}) {
  // Get estimate and line items from project
  const projectEstimate = project?.estimates?.[0] || null;
  const projectLineItems = projectEstimate?.lineItems || [];
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    itemType: 'material',
    category: '',
    description: '',
    quantity: 1,
    unit: 'each',
    unitPrice: 0,
    markup: 0,
    roomId: '',
  });
  
  // Update estimate when project changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (projectEstimate) {
        setEstimate(projectEstimate);
        setLineItems(projectLineItems);
      } else {
        setEstimate(null);
        setLineItems([]);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [projectEstimate?.id]);

  const createNewEstimate = async () => {
    if (!project) return;
    
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          name: `${project.name} - Estimate`,
          status: 'draft',
          profitMargin: 0.2,
          taxRate: 0.08,
          lineItems: [],
        }),
      });
      const newEstimate = await response.json();
      setEstimate(newEstimate);
      onRefresh();
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
  };

  const addLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estimate || !project) return;
    
    const totalPrice = itemForm.quantity * itemForm.unitPrice * (1 + itemForm.markup / 100);
    
    try {
      const response = await fetch('/api/line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          estimateId: estimate.id,
          roomId: itemForm.roomId || project.rooms[0]?.id,
          totalPrice,
        }),
      });
      const newItem = await response.json();
      setLineItems([...lineItems, newItem]);
      setShowForm(false);
      setItemForm({
        itemType: 'material',
        category: '',
        description: '',
        quantity: 1,
        unit: 'each',
        unitPrice: 0,
        markup: 0,
        roomId: project.rooms[0]?.id || '',
      });
      updateEstimateTotals([...lineItems, newItem]);
    } catch (error) {
      console.error('Error adding line item:', error);
    }
  };

  const removeLineItem = async (id: string) => {
    try {
      await fetch(`/api/line-items?id=${id}`, { method: 'DELETE' });
      const newItems = lineItems.filter(item => item.id !== id);
      setLineItems(newItems);
      updateEstimateTotals(newItems);
    } catch (error) {
      console.error('Error removing line item:', error);
    }
  };

  const updateEstimateTotals = async (items: LineItem[]) => {
    if (!estimate) return;
    
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
    const taxAmount = subtotal * (estimate.taxRate || 0.08);
    const profitAmount = subtotal * (estimate.profitMargin || 0.2);
    const totalAmount = subtotal + taxAmount + profitAmount;
    
    const response = await fetch(`/api/estimates/${estimate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtotal,
        taxAmount,
        totalAmount,
      }),
    });
    const updated = await response.json();
    setEstimate(updated);
  };

  const exportEstimate = async () => {
    if (!estimate) return;
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId: estimate.id }),
      });
      const html = await response.text();
      
      // Create a blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estimate-${estimate.id.slice(-8)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting estimate:', error);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const groupedItems = lineItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, LineItem[]>);

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Estimate Builder</h2>
            <p className="text-muted-foreground">Create detailed cost estimates</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Select a project from the Projects tab to create an estimate</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Estimate Builder</h2>
          <p className="text-muted-foreground">
            {estimate ? `Estimate for ${project.name}` : `Create estimate for ${project.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {estimate && (
            <>
              <Button variant="outline" onClick={exportEstimate}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </>
          )}
          {!estimate && (
            <Button onClick={createNewEstimate}>
              <FileText className="h-4 w-4 mr-2" />
              Create Estimate
            </Button>
          )}
        </div>
      </div>

      {estimate && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Line Items */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Line Items ({lineItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No line items yet. Add materials and labor from the database tabs.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase">
                          {category} ({items.length})
                        </h4>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div 
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{item.description}</p>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                  <span>{item.quantity} {typeof item.unit === 'string' ? item.unit : item.unit?.unitName}</span>
                                  <span>@ {formatCurrency(item.unitPrice ?? 0)}</span>
                                  {item.room && <span>Room: {item.room.name}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-semibold">{formatCurrency(item.totalPrice ?? 0)}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeLineItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estimate Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Materials</span>
                    <span>{formatCurrency(lineItems.filter(i => i.itemType === 'material').reduce((s, i) => s + (i.totalPrice ?? 0), 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Labor</span>
                    <span>{formatCurrency(lineItems.filter(i => i.itemType === 'labor').reduce((s, i) => s + (i.totalPrice ?? 0), 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Other</span>
                    <span>{formatCurrency(lineItems.filter(i => i.itemType === 'other').reduce((s, i) => s + (i.totalPrice ?? 0), 0))}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(estimate.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({(estimate.taxRate * 100).toFixed(1)}%)</span>
                  <span>{formatCurrency(estimate.taxAmount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit ({(estimate.profitMargin * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency((estimate.subtotal ?? 0) * estimate.profitMargin)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(estimate.totalAmount ?? 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Client:</strong> {project.clientName || 'Not specified'}</p>
                <p><strong>Address:</strong> {project.address || 'Not specified'}</p>
                <p><strong>Rooms:</strong> {project.rooms?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {showForm && (
        <Card className="fixed inset-4 z-50 max-w-lg mx-auto my-auto h-fit shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add Line Item</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={addLineItem} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={itemForm.itemType === 'material' ? 'default' : 'outline'}
                      onClick={() => setItemForm({ ...itemForm, itemType: 'material' })}
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Material
                    </Button>
                    <Button
                      type="button"
                      variant={itemForm.itemType === 'labor' ? 'default' : 'outline'}
                      onClick={() => setItemForm({ ...itemForm, itemType: 'labor' })}
                      className="flex-1"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Labor
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    placeholder="e.g., Flooring, Electrical"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="e.g., Oak hardwood flooring"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      value={itemForm.unit}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="each">Each</option>
                      <option value="sq_ft">Sq Ft</option>
                      <option value="linear_ft">Linear Ft</option>
                      <option value="gallon">Gallon</option>
                      <option value="hour">Hour</option>
                      <option value="sq">Square (100 sq ft)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price ($)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={itemForm.unitPrice}
                      onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="markup">Markup (%)</Label>
                    <Input
                      id="markup"
                      type="number"
                      value={itemForm.markup}
                      onChange={(e) => setItemForm({ ...itemForm, markup: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                {project.rooms && project.rooms.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <select
                      id="room"
                      value={itemForm.roomId}
                      onChange={(e) => setItemForm({ ...itemForm, roomId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      {project.rooms.map((room) => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(itemForm.quantity * itemForm.unitPrice * (1 + itemForm.markup / 100))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Item</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Main App Component
export default function EstimatingApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
      if (selectedProject) {
        const updated = data.find((p: Project) => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProjects();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const handleSelectProject = async (project: Project) => {
    try {
      const response = await fetch(`/api/projects/${project.id}`);
      const fullProject = await response.json();
      setSelectedProject(fullProject);
      setActiveTab('layout');
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const handleAddMaterialToEstimate = (material: Material) => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    setActiveTab('estimate');
  };

  const handleAddLaborToEstimate = (labor: LaborCodeData) => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    setActiveTab('estimate');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-400 animate-pulse" />
          <p className="text-slate-600">Loading estimating application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">BuildEstimate Pro</h1>
                <p className="text-xs text-slate-500">Construction Estimating</p>
              </div>
            </div>
            {selectedProject && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Home className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{selectedProject.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProject(null)}
                  className="h-5 w-5 p-0 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="labor" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Labor</span>
            </TabsTrigger>
            <TabsTrigger value="estimate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Estimate</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard projects={projects} onSelectProject={handleSelectProject} />
          </TabsContent>

          <TabsContent value="projects" className="mt-0">
            <ProjectsManager 
              projects={projects} 
              onRefresh={fetchProjects}
              onSelectProject={handleSelectProject}
            />
          </TabsContent>

          <TabsContent value="layout" className="mt-0">
            <LayoutEditor project={selectedProject} onRefresh={fetchProjects} />
          </TabsContent>

          <TabsContent value="materials" className="mt-0">
            <MaterialsBrowser onAddToEstimate={handleAddMaterialToEstimate} />
          </TabsContent>

          <TabsContent value="labor" className="mt-0">
            <LaborBrowser onAddToEstimate={handleAddLaborToEstimate} />
          </TabsContent>

          <TabsContent value="estimate" className="mt-0">
            <EstimateBuilder project={selectedProject} onRefresh={fetchProjects} />
          </TabsContent>

          <TabsContent value="import" className="mt-0">
            <ImportPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>BuildEstimate Pro - Professional Construction Estimating</p>
            <p>Cost Items Database: 10,000+ items</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
