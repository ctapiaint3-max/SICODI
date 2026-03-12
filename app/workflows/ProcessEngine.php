<?php

namespace App\Workflows;

use Exception;

class ProcessEngine
{
    // These constants represent typical BPMN-like node types
    public const NODE_START_EVENT = 'START_EVENT';
    public const NODE_USER_TASK = 'USER_TASK';
    public const NODE_SERVICE_TASK = 'SERVICE_TASK';
    public const NODE_EXCLUSIVE_GATEWAY = 'EXCLUSIVE_GATEWAY';
    public const NODE_PARALLEL_GATEWAY = 'PARALLEL_GATEWAY';
    public const NODE_END_EVENT = 'END_EVENT';

    // Represents the workflow definition mapping states (nodes) and allowed transitions
    private array $workflowDefinition;

    public function __construct(array $workflowDefinition)
    {
        $this->workflowDefinition = $workflowDefinition;
    }

    /**
     * Determine what the next possible nodes/states are from the current state
     */
    public function getNextPossibleStates(string $currentState): array
    {
        if (!isset($this->workflowDefinition['transitions'][$currentState])) {
            return [];
        }
        
        return $this->workflowDefinition['transitions'][$currentState];
    }

    /**
     * Validates if transitioning from currentState to targetState is permitted
     */
    public function canTransition(string $currentState, string $targetState): bool
    {
        $allowedTransitions = $this->getNextPossibleStates($currentState);
        
        foreach ($allowedTransitions as $transition) {
            if ($transition['target'] === $targetState) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Evaluates a condition for Exclusive Gateways
     */
    public function evaluateCondition(array $context, string $conditionExpression): bool
    {
        // extremely basic expression evaluator for demo purposes (e.g. "prioridad === ALTA")
        // In a real robust system, use Symfony ExpressionLanguage or similar
        extract($context);
        
        try {
            return eval("return ($conditionExpression);");
        } catch (\Throwable $t) {
            return false;
        }
    }

    /**
     * Rutea flujos "EXCLUSIVE_GATEWAY": Evalúa arreglos booleanos mutables y devuelve una única ruta ganadora
     */
    public function executeExclusiveGateway(string $gatewayNode, array $context): ?string
    {
        $possiblePaths = $this->getNextPossibleStates($gatewayNode);
        foreach ($possiblePaths as $path) {
            if (isset($path['condition']) && $this->evaluateCondition($context, $path['condition'])) {
                 return $path['target']; // First match wins
            }
        }
        // Fallback default route si existe
        foreach ($possiblePaths as $path) {
             if (isset($path['isDefault']) && $path['isDefault']) return $path['target'];
        }
        return null;
    }

    /**
     * Rutea flujos "PARALLEL_GATEWAY": Devuelve todas las ramas divididas simultáneamente sin condición
     */
    public function executeParallelGatewaySplit(string $gatewayNode): array
    {
        $possiblePaths = $this->getNextPossibleStates($gatewayNode);
        $targets = [];
        foreach ($possiblePaths as $path) {
             $targets[] = $path['target'];
        }
        return $targets; // Retorna N tareas que el TaskManager deberá spawnear a la vez
    }
}
