
// PDF Structure Analyzer - Analyzes PDF internal structure
export function analyzePdfStructure(pdfData: Uint8Array): any {
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfData);
  
  console.log('🔍 Analyzing PDF structure...');
  
  // Find PDF objects and streams
  const objects = pdfString.match(/\d+\s+\d+\s+obj[\s\S]*?endobj/gi) || [];
  const streams = pdfString.match(/stream[\s\S]*?endstream/gi) || [];
  const textObjects = pdfString.match(/BT[\s\S]*?ET/gi) || [];
  
  // Analyze compression and encoding
  const hasFlateEncode = pdfString.includes('/FlateDecode');
  const hasASCIIHex = pdfString.includes('/ASCIIHexDecode');
  const hasASCII85 = pdfString.includes('/ASCII85Decode');
  
  // Find font information
  const fonts = pdfString.match(/\/Font[\s\S]*?\/F\d+/gi) || [];
  
  // Find pages
  const pages = pdfString.match(/\/Type\s*\/Page\b/gi) || [];
  
  const analysis = {
    totalObjects: objects.length,
    totalStreams: streams.length,
    textObjects: textObjects.length,
    hasCompression: hasFlateEncode || hasASCIIHex || hasASCII85,
    compressionTypes: {
      flate: hasFlateEncode,
      asciiHex: hasASCIIHex,
      ascii85: hasASCII85
    },
    fonts: fonts.length,
    pages: pages.length,
    sampleTextObject: textObjects.length > 0 ? textObjects[0].substring(0, 200) : null,
    sampleStream: streams.length > 0 ? streams[0].substring(0, 200) : null
  };
  
  console.log('Structure analysis complete:', analysis);
  return analysis;
}
