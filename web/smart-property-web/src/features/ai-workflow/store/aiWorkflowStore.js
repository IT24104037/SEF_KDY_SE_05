import { useState, useCallback } from "react";
import {
  startPlannerWorkflow,
  getWorkflowById,
  getWorkflowByRequestId,
  getWorkflowLogs,
} from "../services/aiWorkflowService";

export function useAiWorkflowState() {
  const [workflow, setWorkflow] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const startPlanner = useCallback(async (maintenanceRequestId) => {
    setStarting(true);
    setError(null);
    try {
      const data = await startPlannerWorkflow(maintenanceRequestId);
      setWorkflow(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setStarting(false);
    }
  }, []);

  const loadWorkflowByRequestId = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkflowByRequestId(requestId);
      setWorkflow(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWorkflowById = useCallback(async (workflowId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkflowById(workflowId);
      setWorkflow(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async (workflowId) => {
    try {
      const data = await getWorkflowLogs(workflowId);
      setLogs(data || []);
      return data;
    } catch (err) {
      console.error("Failed to load logs:", err.message);
      return [];
    }
  }, []);

  return {
    workflow,
    logs,
    loading,
    starting,
    error,
    startPlanner,
    loadWorkflowByRequestId,
    loadWorkflowById,
    loadLogs,
  };
}
