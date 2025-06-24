
import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  MoreHorizontal
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
