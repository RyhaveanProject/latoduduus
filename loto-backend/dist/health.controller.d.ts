export declare class HealthController {
    root(): {
        status: string;
        service: string;
        timestamp: string;
    };
    rootHead(): void;
    check(): {
        status: string;
        timestamp: string;
        uptime: number;
    };
    apiInfo(): {
        status: string;
        service: string;
        version: string;
        message: string;
        docs: string | undefined;
        timestamp: string;
    };
}
//# sourceMappingURL=health.controller.d.ts.map