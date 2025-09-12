import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, RotateCw, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropProps {
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropSize?: { width: number; height: number };
}

interface ImagePosition {
  x: number;
  y: number;
}

const ImageCrop: React.FC<ImageCropProps> = ({
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 1,
  cropSize = { width: 200, height: 200 }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // Calculate initial scale to fit image in container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      const initialScale = Math.min(scaleX, scaleY) * 0.8; // 80% of container
      
      setScale(initialScale);
      
      // Center the image within the container
      const imageWidth = img.naturalWidth * initialScale;
      const imageHeight = img.naturalHeight * initialScale;
      const centerX = (containerWidth - imageWidth) / 2;
      const centerY = (containerHeight - imageHeight) / 2;
      
      setImagePosition({ x: centerX, y: centerY });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setImagePosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05; // Slower zoom for better control
    setScale(prev => Math.max(0.2, Math.min(3, prev * delta)));
  }, []);

  // Add wheel event listener with proper options
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) {
      console.error('Missing refs:', { canvas: !!canvasRef.current, image: !!imageRef.current, container: !!containerRef.current });
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const container = containerRef.current;
    
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    if (!img.complete || img.naturalWidth === 0) {
      console.error('Image not loaded yet');
      return;
    }
    
    console.log('Crop debug:', {
      imagePosition,
      scale,
      cropSize,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      imageNaturalWidth: img.naturalWidth,
      imageNaturalHeight: img.naturalHeight
    });
    
    // Set canvas size to desired crop size
    canvas.width = cropSize.width;
    canvas.height = cropSize.height;
    
    // Calculate crop area position (centered in container)
    const cropX = (container.clientWidth - cropSize.width) / 2;
    const cropY = (container.clientHeight - cropSize.height) / 2;
    
    // Calculate the scaled image dimensions
    const scaledImageWidth = img.naturalWidth * scale;
    const scaledImageHeight = img.naturalHeight * scale;
    
    // Calculate source coordinates on the original image
    // We need to find where the crop area intersects with the scaled image
    const sourceX = Math.max(0, (cropX - imagePosition.x) / scale);
    const sourceY = Math.max(0, (cropY - imagePosition.y) / scale);
    
    // Calculate how much of the crop area is actually visible in the image
    const visibleCropWidth = Math.min(
      cropSize.width,
      scaledImageWidth - Math.max(0, cropX - imagePosition.x)
    );
    const visibleCropHeight = Math.min(
      cropSize.height,
      scaledImageHeight - Math.max(0, cropY - imagePosition.y)
    );
    
    const sourceWidth = visibleCropWidth / scale;
    const sourceHeight = visibleCropHeight / scale;
    
    console.log('Crop calculations:', {
      cropX,
      cropY,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      visibleCropWidth,
      visibleCropHeight
    });
    
    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the cropped image
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      visibleCropWidth,
      visibleCropHeight
    );
    
    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Crop successful, blob size:', blob.size);
        onCrop(blob);
      } else {
        console.error('Failed to create blob from canvas');
      }
    }, 'image/jpeg', 0.9);
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetImage = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // Reset scale to fit image in container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      const initialScale = Math.min(scaleX, scaleY) * 0.8;
      
      setScale(initialScale);
      
      // Center the image
      const imageWidth = img.naturalWidth * initialScale;
      const imageHeight = img.naturalHeight * initialScale;
      const centerX = (containerWidth - imageWidth) / 2;
      const centerY = (containerHeight - imageHeight) / 2;
      
      setImagePosition({ x: centerX, y: centerY });
      setRotation(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Crop Image</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Image Container */}
            <div className="flex-1">
              <div
                ref={containerRef}
                className="relative w-full h-96 bg-neutral-100 rounded-lg overflow-hidden"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className={`absolute select-none transition-transform duration-100 ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    left: imagePosition.x,
                    top: imagePosition.y,
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                  onLoad={handleImageLoad}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  draggable={false}
                />
                
                {/* Fixed Crop Area */}
                <div
                  className="absolute border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: cropSize.width,
                    height: cropSize.height
                  }}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-neutral-400 rounded-full" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-neutral-400 rounded-full" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-neutral-400 rounded-full" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-neutral-400 rounded-full" />
                </div>
                
                {/* Overlay mask */}
                <div className="absolute inset-0 bg-black/30 pointer-events-none">
                  <div
                    className="bg-transparent"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: cropSize.width,
                      height: cropSize.height
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Hidden Canvas for Cropping */}
            <canvas
              ref={canvasRef}
              className="hidden"
              style={{ display: 'none' }}
            />
            
            {/* Controls */}
            <div className="w-full lg:w-64 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Controls</h4>
                <div className="space-y-2">
                  <div className="space-y-3">
                    {/* Zoom Slider */}
                    <div>
                      <label className="text-xs text-neutral-600 mb-2 block">
                        Zoom: {Math.round(scale * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="3"
                        step="0.05"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((scale - 0.2) / (3 - 0.2)) * 100}%, #e5e7eb ${((scale - 0.2) / (3 - 0.2)) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                    
                    {/* Quick Zoom Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(0.5)}
                        className="text-xs px-2"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(1)}
                        className="text-xs px-2"
                      >
                        100%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(2)}
                        className="text-xs px-2"
                      >
                        200%
                      </Button>
                    </div>
                    
                    {/* Fine Zoom Controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(prev => Math.max(0.2, prev - 0.05))}
                        className="flex-1"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(prev => Math.min(3, prev + 0.05))}
                        className="flex-1"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={rotateImage}
                      className="flex-1"
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetImage}
                      className="flex-1"
                    >
                      Reset
                    </Button>
                  </div>
                  
                  <div className="text-xs text-neutral-500 mt-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <Move className="h-3 w-3" />
                      <span>Drag image to position</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ZoomIn className="h-3 w-3" />
                      <span>Scroll to zoom</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">Crop Size</h4>
                <div className="text-xs text-neutral-600">
                  <div>Width: {cropSize.width}px</div>
                  <div>Height: {cropSize.height}px</div>
                  <div>Aspect Ratio: {aspectRatio}:1</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCrop} className="flex-1">
                  Apply Crop
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImageCrop;
