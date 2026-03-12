<?php

namespace App\Security;

use App\Repositories\BaseRepository;

class AuditService
{
    private BaseRepository $auditRepository;

    public function __construct(BaseRepository $auditRepository)
    {
        $this->auditRepository = $auditRepository;
    }

    /**
     * @param int|null $userId User performing the action
     * @param string $action Action name (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
     * @param string $entityType Entity affected (e.g., 'EXPEDIENTE', 'USER')
     * @param string|null $entityId ID of the entity affected
     * @param string $ipAddress IP of the requester
     * @param array|null $oldData Data before change
     * @param array|null $newData Data after change
     */
    public function log(
        ?int $userId, 
        string $action, 
        string $entityType, 
        ?string $entityId, 
        string $ipAddress, 
        ?array $oldData = null, 
        ?array $newData = null
    ): void {
        $data = [
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'ip_address' => $ipAddress,
            'old_data' => $oldData ? json_encode($oldData) : null,
            'new_data' => $newData ? json_encode($newData) : null,
        ];

        $this->auditRepository->create($data);
    }
}
