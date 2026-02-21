// CAD Utilities for Layout Editor
// Smart snapping, wall detection, door swing calculations

export interface Point {
  x: number;
  y: number;
}

export interface WallSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  direction: 'top' | 'right' | 'bottom' | 'left';
  angle: number; // in degrees
  roomId: string;
  roomName?: string;
}

export interface SnapResult {
  point: Point;
  type: 'wall' | 'corner' | 'grid' | 'center' | 'edge';
  wallId?: string;
  wallPosition?: number; // 0-1 position along wall
  wallSegment?: WallSegment;
  distance: number;
}

export interface DoorSwing {
  startAngle: number;
  endAngle: number;
  centerX: number;
  centerY: number;
  radius: number;
  direction: 'cw' | 'ccw'; // clockwise or counter-clockwise
}

export interface ElementPlacement {
  x: number;
  y: number;
  rotation: number;
  wallId?: string;
  wallPosition?: number;
  snappedTo: 'wall' | 'free' | 'grid';
}

const SCALE_FACTOR = 20; // pixels per foot
const SNAP_TOLERANCE = 1.5; // feet - how close to snap
const WALL_THICKNESS = 0.5; // feet

/**
 * Convert world coordinates (feet) to canvas coordinates (pixels)
 */
export function worldToCanvas(point: Point, scaleFactor: number = SCALE_FACTOR): Point {
  return {
    x: point.x * scaleFactor,
    y: point.y * scaleFactor,
  };
}

/**
 * Convert canvas coordinates (pixels) to world coordinates (feet)
 */
export function canvasToWorld(point: Point, scaleFactor: number = SCALE_FACTOR): Point {
  return {
    x: point.x / scaleFactor,
    y: point.y / scaleFactor,
  };
}

/**
 * Get wall segments from a room
 */
export function getWallSegmentsFromRoom(room: {
  id: string;
  name: string;
  positionX: number;
  positionY: number;
  length: number;
  width: number;
}): WallSegment[] {
  const x = room.positionX;
  const y = room.positionY;
  const w = room.length;
  const h = room.width;

  return [
    {
      id: `${room.id}-wall-0`,
      startX: x,
      startY: y,
      endX: x + w,
      endY: y,
      length: w,
      direction: 'top',
      angle: 0,
      roomId: room.id,
      roomName: room.name,
    },
    {
      id: `${room.id}-wall-1`,
      startX: x + w,
      startY: y,
      endX: x + w,
      endY: y + h,
      length: h,
      direction: 'right',
      angle: 90,
      roomId: room.id,
      roomName: room.name,
    },
    {
      id: `${room.id}-wall-2`,
      startX: x + w,
      startY: y + h,
      endX: x,
      endY: y + h,
      length: w,
      direction: 'bottom',
      angle: 180,
      roomId: room.id,
      roomName: room.name,
    },
    {
      id: `${room.id}-wall-3`,
      startX: x,
      startY: y + h,
      endX: x,
      endY: y,
      length: h,
      direction: 'left',
      angle: 270,
      roomId: room.id,
      roomName: room.name,
    },
  ];
}

/**
 * Calculate distance from point to line segment
 */
export function distanceToSegment(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // Line is a point
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }

  // Project point onto line
  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projection = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return Math.sqrt(
    Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2)
  );
}

/**
 * Get closest point on a line segment
 */
export function closestPointOnSegment(point: Point, lineStart: Point, lineEnd: Point): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return lineStart;
  }

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Find the best snap point for a given position
 */
export function findSnapPoint(
  point: Point,
  walls: WallSegment[],
  gridSize: number = 1,
  snapTolerance: number = SNAP_TOLERANCE
): SnapResult | null {
  let bestSnap: SnapResult | null = null;
  let minDistance = snapTolerance;

  // Check walls
  for (const wall of walls) {
    const wallStart = { x: wall.startX, y: wall.startY };
    const wallEnd = { x: wall.endX, y: wall.endY };
    const distance = distanceToSegment(point, wallStart, wallEnd);

    if (distance < minDistance) {
      const closestPoint = closestPointOnSegment(point, wallStart, wallEnd);
      
      // Calculate wall position (0-1)
      const wallLength = Math.sqrt(
        Math.pow(wallEnd.x - wallStart.x, 2) + Math.pow(wallEnd.y - wallStart.y, 2)
      );
      const positionOnWall = Math.sqrt(
        Math.pow(closestPoint.x - wallStart.x, 2) + Math.pow(closestPoint.y - wallStart.y, 2)
      );
      const wallPosition = wallLength > 0 ? positionOnWall / wallLength : 0;

      minDistance = distance;
      bestSnap = {
        point: closestPoint,
        type: 'wall',
        wallId: wall.id,
        wallPosition,
        wallSegment: wall,
        distance,
      };
    }
  }

  // Check corners
  for (const wall of walls) {
    const corners = [
      { x: wall.startX, y: wall.startY },
      { x: wall.endX, y: wall.endY },
    ];

    for (const corner of corners) {
      const distance = Math.sqrt(
        Math.pow(point.x - corner.x, 2) + Math.pow(point.y - corner.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestSnap = {
          point: corner,
          type: 'corner',
          wallId: wall.id,
          distance,
        };
      }
    }
  }

  // If no wall snap, check grid
  if (!bestSnap) {
    const gridSnap = {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
    const distance = Math.sqrt(
      Math.pow(point.x - gridSnap.x, 2) + Math.pow(point.y - gridSnap.y, 2)
    );

    if (distance < snapTolerance) {
      bestSnap = {
        point: gridSnap,
        type: 'grid',
        distance,
      };
    }
  }

  return bestSnap;
}

/**
 * Calculate door swing arc
 */
export function calculateDoorSwing(
  doorPosition: Point,
  doorWidth: number,
  wallAngle: number, // wall angle in degrees
  swingDirection: 'left' | 'right' = 'right',
  swingAngle: number = 90 // typically 90 or 180 degrees
): DoorSwing {
  const radius = doorWidth;
  
  // Door hinge position (center of door edge on wall)
  const hingeOffset = 0; // Door starts at hinge
  
  // Calculate swing angles based on wall direction and swing direction
  let startAngle: number;
  let endAngle: number;
  
  // Normalize wall angle to 0-360
  const normalizedWallAngle = ((wallAngle % 360) + 360) % 360;
  
  if (swingDirection === 'right') {
    // Door swings clockwise
    startAngle = normalizedWallAngle;
    endAngle = normalizedWallAngle + swingAngle;
  } else {
    // Door swings counter-clockwise
    startAngle = normalizedWallAngle - swingAngle;
    endAngle = normalizedWallAngle;
  }

  return {
    startAngle,
    endAngle,
    centerX: doorPosition.x,
    centerY: doorPosition.y,
    radius,
    direction: swingDirection === 'right' ? 'cw' : 'ccw',
  };
}

/**
 * Get door position on wall (calculates x, y and rotation)
 */
export function getDoorPositionOnWall(
  wall: WallSegment,
  wallPosition: number, // 0-1
  doorWidth: number
): { x: number; y: number; rotation: number } {
  // Calculate position along wall
  const x = wall.startX + (wall.endX - wall.startX) * wallPosition;
  const y = wall.startY + (wall.endY - wall.startY) * wallPosition;
  
  // Rotation is perpendicular to wall (door opens into room)
  const rotation = wall.angle;

  return { x, y, rotation };
}

/**
 * Calculate element dimensions based on type
 */
export function getElementDimensions(
  elementType: string,
  subType: string | null
): { width: number; height: number } {
  const defaults: Record<string, { width: number; height: number }> = {
    'door-interior': { width: 3, height: 0.5 },
    'door-exterior': { width: 3.5, height: 0.5 },
    'door-double': { width: 6, height: 0.5 },
    'door-sliding': { width: 6, height: 0.5 },
    'window-standard': { width: 4, height: 0.3 },
    'window-picture': { width: 6, height: 0.3 },
    'window-bay': { width: 8, height: 0.3 },
    'light-ceiling': { width: 1, height: 1 },
    'light-recessed': { width: 0.5, height: 0.5 },
    'switch-single': { width: 0.5, height: 0.5 },
    'outlet-standard': { width: 0.5, height: 0.5 },
    'fixture-sink': { width: 2, height: 2 },
    'fixture-toilet': { width: 2.5, height: 3 },
    'vent-supply': { width: 1, height: 1 },
  };

  const key = `${elementType}-${subType || 'standard'}`;
  return defaults[key] || { width: 2, height: 2 };
}

/**
 * Check if element type requires wall placement
 */
export function requiresWallPlacement(elementType: string): boolean {
  const wallRequiredTypes = ['door', 'window'];
  return wallRequiredTypes.includes(elementType);
}

/**
 * Calculate the angle between two points
 */
export function angleBetweenPoints(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Check if a point is inside a room
 */
export function isPointInsideRoom(
  point: Point,
  room: { positionX: number; positionY: number; length: number; width: number }
): boolean {
  return (
    point.x >= room.positionX &&
    point.x <= room.positionX + room.length &&
    point.y >= room.positionY &&
    point.y <= room.positionY + room.width
  );
}

/**
 * Find which room contains a point
 */
export function findRoomForPoint(
  point: Point,
  rooms: Array<{
    id: string;
    positionX: number;
    positionY: number;
    length: number;
    width: number;
  }>
): string | null {
  for (const room of rooms) {
    if (isPointInsideRoom(point, room)) {
      return room.id;
    }
  }
  return null;
}

/**
 * Generate SVG arc path for door swing
 */
export function generateDoorSwingPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Convert to radians
  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;
  
  // Calculate arc points
  const x1 = centerX + radius * Math.cos(start);
  const y1 = centerY + radius * Math.sin(start);
  const x2 = centerX + radius * Math.cos(end);
  const y2 = centerY + radius * Math.sin(end);
  
  // Determine if it's a large arc (> 180 degrees)
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  
  // Sweep direction: 1 for clockwise, 0 for counter-clockwise
  const sweepFlag = endAngle > startAngle ? 1 : 0;
  
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2} Z`;
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Rotate a point around an origin
 */
export function rotatePoint(point: Point, origin: Point, angleDegrees: number): Point {
  const angle = degreesToRadians(angleDegrees);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

/**
 * Get normalized rotation (0-360)
 */
export function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

/**
 * Snap rotation to common angles (0, 90, 180, 270)
 */
export function snapRotation(rotation: number, snapIncrement: number = 45): number {
  return Math.round(rotation / snapIncrement) * snapIncrement;
}

/**
 * Calculate distance between two points
 */
export function distanceBetweenPoints(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
