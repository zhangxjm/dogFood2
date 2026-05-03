import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';

const TOOLS = {
  SELECT: 'select',
  PENCIL: 'pencil',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  TEXT: 'text',
  ERASER: 'eraser'
};

const Whiteboard = forwardRef(({ socket, currentRoom }, ref) => {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState(TOOLS.PENCIL);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentShape, setCurrentShape] = useState(null);

  useImperativeHandle(ref, () => ({
    setTool: (tool) => {
      setCurrentTool(tool);
      updateCanvasMode(tool);
    },
    setStrokeWidth: (width) => {
      setStrokeWidth(width);
    },
    setStrokeColor: (color) => {
      setStrokeColor(color);
    },
    setFillColor: (color) => {
      setFillColor(color);
    },
    clearCanvas: () => {
      if (canvasRef.current) {
        canvasRef.current.clear();
        canvasRef.current.renderAll();
      }
    },
    addRemoteElement: (elementData) => {
      if (canvasRef.current && elementData) {
        fabric.util.enlivenObjects([elementData], (objects) => {
          objects.forEach((obj) => {
            canvasRef.current.add(obj);
          });
          canvasRef.current.renderAll();
        });
      }
    },
    updateElement: (elementId, updates) => {
      if (canvasRef.current) {
        const obj = canvasRef.current.getObjects().find(o => o.id === elementId);
        if (obj) {
          obj.set(updates);
          canvasRef.current.renderAll();
        }
      }
    },
    deleteElement: (elementId) => {
      if (canvasRef.current) {
        const obj = canvasRef.current.getObjects().find(o => o.id === elementId);
        if (obj) {
          canvasRef.current.remove(obj);
          canvasRef.current.renderAll();
        }
      }
    },
    deleteSelected: () => {
      if (canvasRef.current) {
        const activeObject = canvasRef.current.getActiveObject();
        if (activeObject) {
          const elementId = activeObject.id;
          canvasRef.current.remove(activeObject);
          canvasRef.current.discardActiveObject();
          canvasRef.current.renderAll();
          return { id: elementId };
        }
      }
      return null;
    },
    loadElements: (elements) => {
      if (canvasRef.current && elements) {
        canvasRef.current.clear();
        fabric.util.enlivenObjects(elements, (objects) => {
          objects.forEach((obj) => {
            canvasRef.current.add(obj);
          });
          canvasRef.current.renderAll();
        });
      }
    },
    zoomIn: () => {
      if (canvasRef.current) {
        const newZoom = Math.min(zoom * 1.2, 5);
        setZoom(newZoom);
        canvasRef.current.setZoom(newZoom);
      }
    },
    zoomOut: () => {
      if (canvasRef.current) {
        const newZoom = Math.max(zoom / 1.2, 0.2);
        setZoom(newZoom);
        canvasRef.current.setZoom(newZoom);
      }
    },
    resetZoom: () => {
      if (canvasRef.current) {
        setZoom(1);
        canvasRef.current.setZoom(1);
        canvasRef.current.absolutePan({ x: 0, y: 0 });
      }
    },
    getCanvasElements: () => {
      if (canvasRef.current) {
        return canvasRef.current.getObjects().map(obj => obj.toJSON());
      }
      return [];
    }
  }));

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const canvas = new fabric.Canvas('whiteboard-canvas', {
      isDrawingMode: currentTool === TOOLS.PENCIL,
      selection: currentTool === TOOLS.SELECT,
      width: canvasContainerRef.current.clientWidth,
      height: canvasContainerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      freeDrawingCursor: 'crosshair'
    });

    canvas.freeDrawingBrush.color = strokeColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    canvasRef.current = canvas;

    const handleResize = () => {
      if (canvasContainerRef.current && canvasRef.current) {
        canvasRef.current.setWidth(canvasContainerRef.current.clientWidth);
        canvasRef.current.setHeight(canvasContainerRef.current.clientHeight);
        canvasRef.current.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvasRef.current) {
        canvasRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const handleMouseDown = (options) => {
      const pointer = canvas.getPointer(options.e);
      setStartX(pointer.x);
      setStartY(pointer.y);
      setIsDrawing(true);

      if (currentTool === TOOLS.SELECT) {
        return;
      }

      if (currentTool === TOOLS.ERASER) {
        const target = canvas.findTarget(options.e);
        if (target) {
          const elementId = target.id;
          canvas.remove(target);
          canvas.renderAll();
          if (socket && currentRoom) {
            socket.emit('delete-element', { 
              roomId: currentRoom.roomId, 
              elementId 
            });
          }
        }
        return;
      }

      let shape;
      const elementId = uuidv4();

      switch (currentTool) {
        case TOOLS.RECTANGLE:
          shape = new fabric.Rect({
            id: elementId,
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: fillColor === 'transparent' ? 'rgba(0,0,0,0)' : fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            selectable: true
          });
          break;

        case TOOLS.CIRCLE:
          shape = new fabric.Circle({
            id: elementId,
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: fillColor === 'transparent' ? 'rgba(0,0,0,0)' : fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            selectable: true
          });
          break;

        case TOOLS.LINE:
          shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            id: elementId,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            selectable: true
          });
          break;

        case TOOLS.TEXT:
          shape = new fabric.IText('Type here...', {
            id: elementId,
            left: pointer.x,
            top: pointer.y,
            fill: strokeColor,
            fontSize: 24,
            fontFamily: 'Arial',
            selectable: true
          });
          canvas.add(shape);
          canvas.setActiveObject(shape);
          shape.enterEditing();
          if (socket && currentRoom) {
            const elementData = shape.toJSON();
            socket.emit('draw', { 
              roomId: currentRoom.roomId, 
              element: elementData 
            });
          }
          setIsDrawing(false);
          return;
      }

      if (shape && currentTool !== TOOLS.TEXT) {
        canvas.add(shape);
        setCurrentShape(shape);
      }
    };

    const handleMouseMove = (options) => {
      if (!isDrawing || !currentShape) return;

      const pointer = canvas.getPointer(options.e);

      switch (currentTool) {
        case TOOLS.RECTANGLE:
          currentShape.set({
            width: Math.abs(pointer.x - startX),
            height: Math.abs(pointer.y - startY),
            left: Math.min(pointer.x, startX),
            top: Math.min(pointer.y, startY)
          });
          break;

        case TOOLS.CIRCLE:
          const radius = Math.sqrt(
            Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
          );
          currentShape.set({
            radius: radius,
            left: startX - radius,
            top: startY - radius
          });
          break;

        case TOOLS.LINE:
          currentShape.set({
            x2: pointer.x,
            y2: pointer.y
          });
          break;
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (isDrawing && currentShape && currentTool !== TOOLS.TEXT && currentTool !== TOOLS.PENCIL) {
        if (socket && currentRoom) {
          const elementData = currentShape.toJSON();
          socket.emit('draw', { 
            roomId: currentRoom.roomId, 
            element: elementData 
          });
        }
      }
      setIsDrawing(false);
      setCurrentShape(null);
    };

    const handlePathCreated = (e) => {
      const path = e.path;
      path.set({
        id: uuidv4(),
        selectable: true
      });
      canvas.renderAll();
      
      if (socket && currentRoom) {
        const elementData = path.toJSON();
        socket.emit('draw', { 
          roomId: currentRoom.roomId, 
          element: elementData 
        });
      }
    };

    const handleObjectModified = (e) => {
      const obj = e.target;
      if (obj && socket && currentRoom) {
        const elementData = obj.toJSON();
        socket.emit('update-element', { 
          roomId: currentRoom.roomId, 
          elementId: obj.id,
          updates: elementData
        });
      }
    };

    const handleMouseDownForPan = (options) => {
      if (options.e.button === 1 || (options.e.ctrlKey && options.e.button === 0)) {
        setPanning(true);
        const pointer = canvas.getPointer(options.e);
        setLastPosX(pointer.x);
        setLastPosY(pointer.y);
        canvas.selection = false;
        options.e.preventDefault();
      }
    };

    const handleMouseMoveForPan = (options) => {
      if (!panning) return;
      
      const pointer = canvas.getPointer(options.e);
      const vpt = canvas.viewportTransform;
      
      vpt[4] += pointer.x - lastPosX;
      vpt[5] += pointer.y - lastPosY;
      
      canvas.requestRenderAll();
      setLastPosX(pointer.x);
      setLastPosY(pointer.y);
    };

    const handleMouseUpForPan = () => {
      setPanning(false);
      if (canvasRef.current) {
        canvasRef.current.selection = currentTool === TOOLS.SELECT;
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);

    canvas.on('mouse:down', handleMouseDownForPan);
    canvas.on('mouse:move', handleMouseMoveForPan);
    canvas.on('mouse:up', handleMouseUpForPan);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('mouse:down', handleMouseDownForPan);
      canvas.off('mouse:move', handleMouseMoveForPan);
      canvas.off('mouse:up', handleMouseUpForPan);
    };
  }, [currentTool, strokeColor, fillColor, strokeWidth, socket, currentRoom, startX, startY, isDrawing, currentShape, zoom, panning, lastPosX, lastPosY]);

  const updateCanvasMode = (tool) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    switch (tool) {
      case TOOLS.SELECT:
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        break;
      case TOOLS.PENCIL:
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
        break;
      default:
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        break;
    }
  };

  useEffect(() => {
    updateCanvasMode(currentTool);
  }, [currentTool]);

  useEffect(() => {
    if (canvasRef.current && canvasRef.current.freeDrawingBrush) {
      canvasRef.current.freeDrawingBrush.color = strokeColor;
      canvasRef.current.freeDrawingBrush.width = strokeWidth;
    }
  }, [strokeColor, strokeWidth]);

  return (
    <div 
      ref={canvasContainerRef}
      className="flex-1 relative overflow-hidden bg-gray-100"
      style={{ cursor: currentTool === TOOLS.SELECT ? 'default' : 'crosshair' }}
    >
      <canvas id="whiteboard-canvas" className="absolute inset-0" />
      
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-1.5 text-sm text-gray-600 shadow-sm">
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';

export default Whiteboard;
