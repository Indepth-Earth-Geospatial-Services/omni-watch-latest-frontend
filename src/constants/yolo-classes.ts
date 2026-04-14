// YOLO COCO Dataset Classes for Surveillance
// Class IDs and names for incident detection

export interface YOLOClass {
  id: number;
  name: string;
  category: 'person' | 'vehicle' | 'object';
  icon: string;
  color: string;
}

export const SURVEILLANCE_CLASSES: YOLOClass[] = [
  // Persons
  { id: 0, name: 'Person', category: 'person', icon: 'fa-user', color: 'red' },

  // Vehicles
  { id: 1, name: 'Bicycle', category: 'vehicle', icon: 'fa-bicycle', color: 'blue' },
  { id: 2, name: 'Car', category: 'vehicle', icon: 'fa-car', color: 'blue' },
  { id: 3, name: 'Motorcycle', category: 'vehicle', icon: 'fa-motorcycle', color: 'blue' },
  { id: 5, name: 'Bus', category: 'vehicle', icon: 'fa-bus', color: 'blue' },
  { id: 7, name: 'Truck', category: 'vehicle', icon: 'fa-truck', color: 'blue' },

  // Objects
  { id: 14, name: 'Bird', category: 'object', icon: 'fa-dove', color: 'green' },
  { id: 15, name: 'Cat', category: 'object', icon: 'fa-cat', color: 'green' },
  { id: 16, name: 'Dog', category: 'object', icon: 'fa-dog', color: 'green' },
  { id: 24, name: 'Backpack', category: 'object', icon: 'fa-backpack', color: 'yellow' },
  { id: 26, name: 'Handbag', category: 'object', icon: 'fa-shopping-bag', color: 'yellow' },
  { id: 28, name: 'Suitcase', category: 'object', icon: 'fa-suitcase', color: 'yellow' },
  { id: 32, name: 'Sports Ball', category: 'object', icon: 'fa-baseball-ball', color: 'green' },
  { id: 39, name: 'Bottle', category: 'object', icon: 'fa-wine-bottle', color: 'yellow' },
  { id: 41, name: 'Cup', category: 'object', icon: 'fa-mug-hot', color: 'yellow' },
  { id: 43, name: 'Knife', category: 'object', icon: 'fa-utensil-knife', color: 'red' },
  { id: 73, name: 'Laptop', category: 'object', icon: 'fa-laptop', color: 'yellow' },
  { id: 76, name: 'Keyboard', category: 'object', icon: 'fa-keyboard', color: 'yellow' },
];

// Get class by ID
export function getClassById(id: number): YOLOClass | undefined {
  return SURVEILLANCE_CLASSES.find(c => c.id === id);
}

// Get class IDs by category
export function getClassIdsByCategory(category: 'person' | 'vehicle' | 'object'): number[] {
  return SURVEILLANCE_CLASSES
    .filter(c => c.category === category)
    .map(c => c.id);
}

// Get all class IDs
export function getAllClassIds(): number[] {
  return SURVEILLANCE_CLASSES.map(c => c.id);
}
