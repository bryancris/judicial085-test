
import React from 'react';

const PrintStyles: React.FC = () => {
  return (
    <style>
      {`
        @media print {
          @page {
            margin: 1in;
            size: letter;
          }
          
          .print-hide {
            display: none !important;
          }
          
          .print-show {
            display: block !important;
          }
          
          .print-document-title {
            font-size: 18pt !important;
            font-weight: bold !important;
            margin-bottom: 24px !important;
            text-align: center !important;
            border-bottom: 2px solid #333 !important;
            padding-bottom: 12px !important;
            color: black !important;
          }
          
          .print-document-content {
            font-size: 12pt !important;
            line-height: 1.6 !important;
            color: black !important;
            background: white !important;
          }
          
          .print-document-content h1 { 
            font-size: 16pt !important; 
            margin: 18px 0 12px 0 !important; 
          }
          .print-document-content h2 { 
            font-size: 14pt !important; 
            margin: 16px 0 10px 0 !important; 
          }
          .print-document-content h3 { 
            font-size: 13pt !important; 
            margin: 14px 0 8px 0 !important; 
          }
          .print-document-content p { 
            margin: 8px 0 !important; 
          }
          .print-document-content ul, .print-document-content ol { 
            margin: 8px 0 !important; 
            padding-left: 24px !important; 
          }
          .print-document-content li { 
            margin: 4px 0 !important; 
          }
          
          /* Prevent orphans and widows */
          .print-document-content p, .print-document-content li { 
            orphans: 2; 
            widows: 2; 
          }
          .print-document-content h1, .print-document-content h2, .print-document-content h3 { 
            page-break-after: avoid; 
          }
          
          body {
            font-family: Arial, sans-serif !important;
            background: white !important;
            color: black !important;
          }
        }
      `}
    </style>
  );
};

export default PrintStyles;
