import { useState } from 'react';
import { 
  MousePointer2, 
  Pencil, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Trash2, 
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

const TOOLS = {
  SELECT: 'select',
  PENCIL: 'pencil',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TEXT: 'text',
  ERASER: 'eraser'
};

const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E'
];

const STROKE_WIDTHS = [1, 2, 3, 4, 5, 8, 10, 15, 20];

function Toolbar({ socket, currentRoom, canvasRef }) {
  const [currentTool, setCurrentTool] = useState(TOOLS.PENCIL);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);

  const handleToolChange = (tool) => {
    setCurrentTool(tool);
    if (canvasRef.current) {
      canvasRef.current.setTool(tool);
    }
  };

  const handleClearCanvas = () => {
    if (canvasRef.current && socket && currentRoom) {
      canvasRef.current.clearCanvas();
      socket.emit('clear-canvas', { roomId: currentRoom.roomId });
    }
  };

  const handleZoomIn = () => {
    if (canvasRef.current) {
      canvasRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (canvasRef.current) {
      canvasRef.current.zoomOut();
    }
  };

  const handleResetZoom = () => {
    if (canvasRef.current) {
      canvasRef.current.resetZoom();
    }
  };

  const handleDeleteSelected = () => {
    if (canvasRef.current && socket && currentRoom) {
      const element = canvasRef.current.deleteSelected();
      if (element) {
        socket.emit('delete-element', { 
          roomId: currentRoom.roomId, 
          elementId: element.id 
        });
      }
    }
  };

  const isToolActive = (tool) => currentTool === tool;

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 shadow-sm">
      {/* Selection Tools */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => handleToolChange(TOOLS.SELECT)}
          className={`toolbar-button ${isToolActive(TOOLS.SELECT) ? 'active' : ''}`}
          title="Select (V)"
        >
          <MousePointer2 size={20} />
        </button>
      </div>

      <div className="w-10 h-px bg-gray-200 my-1" />

      {/* Drawing Tools */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => handleToolChange(TOOLS.PENCIL)}
          className={`toolbar-button ${isToolActive(TOOLS.PENCIL) ? 'active' : ''}`}
          title="Pencil (P)"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => handleToolChange(TOOLS.RECTANGLE)}
          className={`toolbar-button ${isToolActive(TOOLS.RECTANGLE) ? 'active' : ''}`}
          title="Rectangle (R)"
        >
          <Square size={20} />
        </button>
        <button
          onClick={() => handleToolChange(TOOLS.CIRCLE)}
          className={`toolbar-button ${isToolActive(TOOLS.CIRCLE) ? 'active' : ''}`}
          title="Circle (C)"
        >
          <Circle size={20} />
        </button>
        <button
          onClick={() => handleToolChange(TOOLS.LINE)}
          className={`toolbar-button ${isToolActive(TOOLS.LINE) ? 'active' : ''}`}
          title="Line (L)"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={() => handleToolChange(TOOLS.TEXT)}
          className={`toolbar-button ${isToolActive(TOOLS.TEXT) ? 'active' : ''}`}
          title="Text (T)"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => handleToolChange(TOOLS.ERASER)}
          className={`toolbar-button ${isToolActive(TOOLS.ERASER) ? 'active' : ''}`}
          title="Eraser (E)"
        >
          <Eraser size={20} />
        </button>
      </div>

      <div className="w-10 h-px bg-gray-200 my-1" />

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleDeleteSelected}
          className="toolbar-button text-red-500 hover:bg-red-50"
          title="Delete Selected (Delete)"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={handleClearCanvas}
          className="toolbar-button text-red-500 hover:bg-red-50"
          title="Clear Canvas"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="w-10 h-px bg-gray-200 my-1" />

      {/* Zoom Controls */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="toolbar-button"
          title="Zoom In (+)"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="toolbar-button"
          title="Zoom Out (-)"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleResetZoom}
          className="toolbar-button"
          title="Reset Zoom"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Color Picker */}
      <div className="flex flex-col gap-1 items-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer" 
             style={{ backgroundColor: strokeColor }}
             title="Stroke Color"
        />
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
             style={{ backgroundColor: fillColor === 'transparent' ? '#ffffff' : fillColor }}
             title="Fill Color"
        />
      </div>

      {/* Stroke Width */}
      <div className="mt-2 mb-2">
        <select
          value={strokeWidth}
          onChange={(e) => {
            setStrokeWidth(Number(e.target.value));
            if (canvasRef.current) {
              canvasRef.current.setStrokeWidth(Number(e.target.value));
            }
          }}
          className="w-10 text-xs border border-gray-300 rounded px-1 py-1 text-center"
          title="Stroke Width"
        >
          {STROKE_WIDTHS.map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Toolbar;
