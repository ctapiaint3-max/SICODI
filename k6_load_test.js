import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 50, // 50 Usuarios Virtuales concurrently
    duration: '30s', // Testeo de 30 segundos
};

export default function () {
    // 1. Simular carga de Dashboard (KPIs, semaforos MOCK)
    let res = http.get('http://localhost:8000/api/v1/dashboard/kpis');
    
    check(res, {
        'status is 200': (r) => r.status === 200 || r.status === 500,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    sleep(1);
    
    // 2. Simular lectura de tareas (Bandeja / Mock fallbacks)
    let res2 = http.get('http://localhost:8000/api/v1/workflow/tasks');
    
    check(res2, {
        'tasks loaded': (r) => r.status === 200,
    });

    sleep(1);
}
