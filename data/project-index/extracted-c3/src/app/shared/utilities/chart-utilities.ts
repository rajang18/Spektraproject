import html2canvas from "html2canvas";

export class ChartUtilities {
public isloadingstart:boolean=false;
    generatePNG(element: any, fileName: string) {
        if (element) {
            // this.isloadingstart=true;
            html2canvas(element).then(canvas => {
                this.isloadingstart=false;
                const dataURL = canvas.toDataURL('image/png');
                this.downloadImage(dataURL, fileName);
            });
        }
    }

    generateSVG(element: any, fileName: string) {
        const svgElement = element.querySelector('svg');
        if (svgElement) {
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const dataURL = URL.createObjectURL(svgBlob);
            this.downloadImage(dataURL, fileName);
        }
    }

    downloadImage(dataURL: string, filename: string) {
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    generateCSV(data: any[], filename: string = 'data') {
        let csvData = this.convertToCSV(data);
    
        let blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
        let url = URL.createObjectURL(blob);
    
        let a = document.createElement('a');
        a.href = url;
        a.download = filename + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

    private convertToCSV(data: any[]): string {
        const header = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        return header + '\n' + rows.join('\n');
    }
      
}

