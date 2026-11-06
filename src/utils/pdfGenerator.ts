import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePdfFromElement(
  element: HTMLElement, 
  filename: string = 'Nota_de_Entrega.pdf'
): Promise<boolean> {
  try {
    // Render element into canvas
    const canvas = await html2canvas(element, {
      scale: 2.5, // Crisp 300dpi-equivalent resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Fit to page
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF with html2canvas/jsPDF:', error);
    // Fallback: trigger native window print
    window.print();
    return false;
  }
}
