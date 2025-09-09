import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { DataRow, ExportOptions } from "../types";

export class ExportUtils {
  /**
   * Exports the dashboard to a multi-page PDF with specific layout rules.
   * - Page 1: Contains all KPI cards.
   * - Subsequent pages: Each contains a single chart.
   */
  static async exportToPDF(filename: string = "dashboard-export.pdf") {
    try {
      const pdf = new jsPDF("l", "mm", "a4"); // Landscape A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Helper function to render an element onto a canvas and add it to the PDF
      const addElementToPdf = async (
        element: HTMLElement,
        pdfInstance: jsPDF
      ) => {
        const canvas = await html2canvas(element, {
          // --- QUALITY IMPROVEMENT ---
          // Render at 3x the normal resolution for a sharper image.
          // This is the most important setting for PDF quality.
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: window.getComputedStyle(document.body)
            .backgroundColor,
        });

        // Use maximum PNG quality (1.0)
        const imgData = canvas.toDataURL("image/png", 1.0);
        const ratio = canvas.width / canvas.height;

        const margin = 15;
        let imgWidth = pdfWidth - margin * 2;
        let imgHeight = imgWidth / ratio;

        if (imgHeight > pdfHeight - margin * 2) {
          imgHeight = pdfHeight - margin * 2;
          imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        pdfInstance.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      };

      const elementsToPrint: HTMLElement[] = [];

      const kpiContainer = document.getElementById("kpi-cards-container");
      if (
        kpiContainer &&
        kpiContainer.offsetParent !== null &&
        kpiContainer.clientHeight > 20
      ) {
        elementsToPrint.push(kpiContainer);
      }

      const chartContainers = document.querySelectorAll(
        ".printable-chart-container"
      );
      chartContainers.forEach((chart) => {
        const element = chart as HTMLElement;
        if (element.offsetParent !== null && element.clientHeight > 20) {
          elementsToPrint.push(element);
        }
      });

      if (elementsToPrint.length === 0) {
        console.warn("No visible content found to export to PDF.");
        alert(
          "No content to export. Please make sure charts and KPIs are visible."
        );
        return;
      }

      for (let i = 0; i < elementsToPrint.length; i++) {
        const element = elementsToPrint[i];
        if (i > 0) {
          pdf.addPage();
        }
        await addElementToPdf(element, pdf);
      }

      pdf.save(filename);
    } catch (error) {
      console.error("Export to PDF failed:", error);
      alert(
        "An error occurred while exporting to PDF. Please check the console for details."
      );
      throw new Error("Failed to export PDF");
    }
  }

  static async exportToPNG(
    elementId: string,
    filename: string = "dashboard-export.png"
  ) {
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error("Element not found");
      const canvas = await html2canvas(element, {
        // --- QUALITY IMPROVEMENT ---
        // Also increase scale for PNG export for consistency.
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Export to PNG failed:", error);
      throw new Error("Failed to export PNG");
    }
  }

  static exportToCSV(data: DataRow[], filename: string = "dashboard-data.csv") {
    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export to CSV failed:", error);
      throw new Error("Failed to export CSV");
    }
  }

  static exportToJSON(
    data: DataRow[],
    filename: string = "dashboard-data.json"
  ) {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], {
        type: "application/json;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export to JSON failed:", error);
      throw new Error("Failed to export JSON");
    }
  }

  static async exportDashboard(
    options: ExportOptions,
    data: DataRow[],
    currency: string = "INR"
  ) {
    const timestamp = new Date().toISOString().split("T")[0];

    switch (options.format) {
      case "pdf":
        if (options.includeCharts) {
          await this.exportToPDF(`dashboard-${timestamp}.pdf`);
        }
        break;
      case "png":
        if (options.includeCharts) {
          await this.exportToPNG(
            "dashboard-content",
            `dashboard-${timestamp}.png`
          );
        }
        break;
      case "csv":
        if (options.includeData) {
          this.exportToCSV(data, `dashboard-data-${timestamp}.csv`);
        }
        break;
      case "json":
        if (options.includeData) {
          this.exportToJSON(data, `dashboard-data-${timestamp}.json`);
        }
        break;
    }
  }
}
