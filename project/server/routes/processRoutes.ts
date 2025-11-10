import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get all processes
router.get('/', async (req, res) => {
  try {
    const { data: processes, error } = await supabase
      .from('processes')
      .select('*');

    if (error) throw error;

    res.status(200).json(processes);
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
});

// Get a specific process with steps
router.get('/:processId', async (req, res) => {
  try {
    const { processId } = req.params;

    const { data: process, error } = await supabase
      .from('processes')
      .select('*')
      .eq('id', processId)
      .single();

    if (error) throw error;

    const { data: steps, error: stepsError } = await supabase
      .from('process_steps')
      .select('*')
      .eq('process_id', processId)
      .order('order', { ascending: true });

    if (stepsError) throw stepsError;

    res.status(200).json({
      ...process,
      steps: steps || [],
    });
  } catch (error) {
    console.error('Error fetching process:', error);
    res.status(500).json({ error: 'Failed to fetch process' });
  }
});

// Start a new process execution
router.post('/start', async (req, res) => {
  try {
    const { shipment_id } = req.body;
    const user_id = req.body.user.id;

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user_id)
      .eq('active', true)
      .single();

    if (sessionError) return res.status(400).json({ error: 'No active session found' });

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipment_id)
      .single();

    if (shipmentError || !shipment)
      return res.status(404).json({ error: 'Shipment not found' });

    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('*')
      .or(`type.eq.${shipment.type},type.eq.both`)
      .single();

    if (processError || !process)
      return res.status(404).json({ error: 'No suitable process found for this shipment type' });

    const { data: processExecution, error: executionError } = await supabase
      .from('process_executions')
      .insert({
        process_id: process.id,
        shipment_id,
        user_id,
        session_id: session.id,
        status: 'in_progress',
        current_step: 1,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (executionError) throw executionError;

    const { data: steps, error: stepsError } = await supabase
      .from('process_steps')
      .select('*')
      .eq('process_id', process.id)
      .order('order', { ascending: true });

    if (stepsError) throw stepsError;

    const stepExecutions = (steps || []).map((step) => ({
      process_execution_id: processExecution.id,
      step_id: step.id,
      status: 'pending',
    }));

    const { error: stepExecutionError } = await supabase
      .from('process_step_executions')
      .insert(stepExecutions);

    if (stepExecutionError) throw stepExecutionError;

    await supabase.from('shipments').update({ status: 'in_progress' }).eq('id', shipment_id);

    res.status(201).json(processExecution);
  } catch (error) {
    console.error('Error starting process:', error);
    res.status(500).json({ error: 'Failed to start process' });
  }
});

// ✅ Fix aquí: quitar el paréntesis extra
router.post('/execution/:executionId/complete-step', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { step_id } = req.body;
    const user_id = req.body.user.id;

    const { data: execution, error: executionError } = await supabase
      .from('process_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (executionError || !execution)
      return res.status(404).json({ error: 'Process execution not found' });

    await supabase
      .from('process_step_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('process_execution_id', executionId)
      .eq('step_id', step_id);

    const { data: process, error: processError } = await supabase
      .from('processes')
      .select('*, process_steps(*)') // ✅ aquí estaba el error de paréntesis
      .eq('id', execution.process_id)
      .single();

    if (processError) throw processError;

    const isLastStep = execution.current_step === process.process_steps.length;

    if (isLastStep) {
      await supabase
        .from('process_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', executionId);

      await supabase
        .from('shipments')
        .update({ status: 'completed' })
        .eq('id', execution.shipment_id);
    } else {
      await supabase
        .from('process_executions')
        .update({
          current_step: execution.current_step + 1,
        })
        .eq('id', executionId);
    }

    res.status(200).json({ success: true, completed: isLastStep });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({ error: 'Failed to complete step' });
  }
});

export default router;
