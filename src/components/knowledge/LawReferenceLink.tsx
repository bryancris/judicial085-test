
import React from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface LawReferenceLinkProps {
  citation: string;
  searchTerm?: string;
  children?: React.ReactNode;
}

const LawReferenceLink: React.FC<LawReferenceLinkProps> = ({ 
  citation, 
  searchTerm = "", 
  children 
}) => {
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
