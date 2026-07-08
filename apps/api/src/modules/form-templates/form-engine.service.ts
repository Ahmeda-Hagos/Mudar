import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { IStorageService, IStorageServiceToken } from '../storage/storage.service.interface';
import { FormTemplate, Application } from '@prisma/client';

@Injectable()
export class FormEngineService {
  constructor(
    @Inject(IStorageServiceToken)
    private readonly storageService: IStorageService,
  ) {}

  /**
   * Loads a base PDF template, parses field values, and writes them using pdf-lib.
   */
  async fillPdfForm(
    tenantId: string,
    template: FormTemplate,
    application: Application,
    filledState: Record<string, { value: string }>,
  ): Promise<Buffer> {
    // Decode template PDF base64 string
    const base64Data = template.pdfBase64.includes(',')
      ? template.pdfBase64.split(',')[1]
      : template.pdfBase64;
    const pdfBytes = Buffer.from(base64Data, 'base64');
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    for (const [fieldName, fieldData] of Object.entries(filledState)) {
      if (!fieldData.value) continue;
      
      try {
        const field = form.getTextField(fieldName);
        field.setText(String(fieldData.value));
      } catch (err) {
        try {
          const dropdown = form.getDropdown(fieldName);
          dropdown.select(String(fieldData.value));
        } catch {
          // Ignore unsupported AcroForm fields
        }
      }
    }

    const completedBytes = await pdfDoc.save();
    return Buffer.from(completedBytes);
  }
}
