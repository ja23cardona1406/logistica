import express from 'express';
import axios from 'axios';
import { supabase } from '../index';
import { NLPQuery, NLPResponse } from '../../src/types';

const router = express.Router();

// Process a query through the NLP service
router.post('/query', async (req, res) => {
  try {
    const { query }: NLPQuery = req.body;
    const user_id = req.body.user.id;
    
    // Mock NLP service response for development purposes
    // In production, this would call an external NLP service
    const nlpServiceUrl = process.env.NLP_SERVICE_URL;
    const nlpServiceApiKey = process.env.NLP_SERVICE_API_KEY;
    
    let nlpResponse: NLPResponse;
    
    if (nlpServiceUrl && nlpServiceApiKey) {
      // Call external NLP service
      try {
        const response = await axios.post(
          nlpServiceUrl,
          { query },
          {
            headers: {
              'Authorization': `Bearer ${nlpServiceApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        nlpResponse = response.data;
      } catch (err) {
        console.error('Error calling external NLP service:', err);
        // Fallback to mock response
        nlpResponse = getMockNLPResponse(query);
      }
    } else {
      // Use mock response for development
      nlpResponse = getMockNLPResponse(query);
    }
    
    // Log the query for analytics
    const { error: logError } = await supabase
      .from('assistant_logs')
      .insert({
        user_id,
        query,
        detected_intent: nlpResponse.intent,
        confidence: nlpResponse.confidence,
        created_at: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Error logging assistant query:', logError);
    }
    
    res.status(200).json(nlpResponse);
  } catch (error) {
    console.error('Error processing assistant query:', error);
    res.status(500).json({ error: 'Failed to process assistant query' });
  }
});

// Helper function to generate mock NLP responses for development
function getMockNLPResponse(query: string): NLPResponse {
  const lowercaseQuery = query.toLowerCase();
  
  // Simple keyword matching for demonstration
  if (lowercaseQuery.includes('proceso') && lowercaseQuery.includes('exportación')) {
    return {
      intent: 'process_inquiry',
      confidence: 0.92,
      answer: 'Para los procesos de exportación, debes asegurarte de verificar los siguientes documentos: factura comercial, lista de empaque, certificado de origen y documento de transporte. Recuerda que cada tipo de mercancía puede requerir documentación adicional.',
      processId: 'proc_export_123',
      imageUrl: 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
    };
  } else if (lowercaseQuery.includes('error') || lowercaseQuery.includes('problema')) {
    return {
      intent: 'error_help',
      confidence: 0.88,
      answer: 'Si encuentras un error en el proceso, debes reportarlo inmediatamente usando el botón "Reportar problema". Describe el error con detalle para que el administrador pueda resolverlo rápidamente. En caso de errores críticos, también puedes contactar directamente al supervisor de turno.'
    };
  } else if (lowercaseQuery.includes('escanear') || lowercaseQuery.includes('código')) {
    return {
      intent: 'scan_help',
      confidence: 0.95,
      answer: 'Para escanear un código, asegúrate de que la cámara esté limpia y que haya buena iluminación. Mantén el dispositivo a unos 15-20 cm del código y asegúrate de que todo el código sea visible en la pantalla. Si tienes problemas, puedes intentar mejorar la iluminación o limpiar el código si está dañado.'
    };
  } else {
    return {
      intent: 'general_inquiry',
      confidence: 0.75,
      answer: 'Puedo ayudarte con información sobre los procesos de importación y exportación, escaneo de códigos, reportes de problemas y más. Por favor, sé más específico sobre qué información necesitas.'
    };
  }
}

export default router;