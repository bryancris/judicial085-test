
import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface LawReferenceLinkProps {
  citation: string;
  url?: string | null;
  searchTerm?: string;
  children?: React.ReactNode;
}

const LawReferenceLink: React.FC<LawReferenceLinkProps> = ({ 
  citation, 
  url = null,
  searchTerm = "", 
  children 
}) => {
  // If we have a direct URL (likely a PDF), use that as an external link
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-600 hover:underline hover:text-blue-800 group"
      >
        {children || citation}
        <FileText className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100" />
      </a>
    );
  }
  
  // Otherwise, fall back to knowledge search
  const encodedSearch = encodeURIComponent(citation);
  const searchUrl = `/knowledge?search=${encodedSearch}`;
  
  return (
    <Link
      to={searchUrl}
      className="inline-flex items-center text-blue-600 hover:underline hover:text-blue-800 group"
    >
      {children || citation}
      <ExternalLink className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100" />
    </Link>
  );
};

export default LawReferenceLink;
