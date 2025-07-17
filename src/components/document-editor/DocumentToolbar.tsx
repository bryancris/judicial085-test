
import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  MoreHorizontal,
  Palette
} from "lucide-react";

interface DocumentToolbarProps {
  onFormatText: (command: string, value?: string) => void;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({ onFormatText }) => {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button variant="ghost" size="sm" onClick={() => onFormatText('undo')}>
        <Undo className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('redo')}>
        <Redo className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <select className="border rounded px-2 py-1 text-sm bg-white">
        <option>Normal text</option>
        <option>Heading 1</option>
        <option>Heading 2</option>
        <option>Heading 3</option>
      </select>
      
      <select className="border rounded px-2 py-1 text-sm bg-white ml-2">
        <option>Arial</option>
        <option>Times New Roman</option>
        <option>Calibri</option>
        <option>Georgia</option>
      </select>
      
      <select className="border rounded px-2 py-1 text-sm bg-white ml-2">
        <option>11</option>
        <option>12</option>
        <option>14</option>
        <option>16</option>
        <option>18</option>
      </select>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button variant="ghost" size="sm" onClick={() => onFormatText('bold')}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('italic')}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('underline')}>
        <Underline className="h-4 w-4" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            {/* Neutral Colors */}
            <div className="grid grid-cols-10 gap-1">
              {['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Red Colors */}
            <div className="grid grid-cols-10 gap-1">
              {['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#9900ff', '#ff00ff', '#ff0099'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Light Variations */}
            <div className="grid grid-cols-10 gap-1">
              {['#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#e1d5f0', '#f4c2c2', '#f9cb9c'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Medium Variations */}
            <div className="grid grid-cols-10 gap-1">
              {['#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#d5a6bd', '#e06666', '#f6b26b'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Dark Variations */}
            <div className="grid grid-cols-10 gap-1">
              {['#cc4125', '#e06666', '#e69138', '#f1c232', '#93c47d', '#76a5af', '#6d9eeb', '#c27ba0', '#cc0000', '#e69138'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Darker Variations */}
            <div className="grid grid-cols-10 gap-1">
              {['#a61c00', '#cc0000', '#b45f06', '#bf9000', '#6aa84f', '#45818e', '#3c78d8', '#a64d79', '#990000', '#b45f06'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Darkest Variations */}
            <div className="grid grid-cols-10 gap-1">
              {['#85200c', '#990000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#741b47', '#660000', '#783f04'].map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => onFormatText('foreColor', color)}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom Color Section */}
            <div className="pt-2 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">Custom</div>
              <button 
                className="w-full py-2 px-3 text-sm border border-border rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {/* TODO: Implement custom color picker */}}
              >
                + Custom color
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button variant="ghost" size="sm" onClick={() => onFormatText('justifyLeft')}>
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('justifyCenter')}>
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('justifyRight')}>
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('justifyFull')}>
        <AlignJustify className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button variant="ghost" size="sm" onClick={() => onFormatText('insertUnorderedList')}>
        <List className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormatText('insertOrderedList')}>
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DocumentToolbar;
