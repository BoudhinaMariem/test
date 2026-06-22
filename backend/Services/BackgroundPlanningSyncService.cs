namespace Triweb.Api.Services;

public sealed class BackgroundPlanningSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackgroundPlanningSyncService> _logger;

    public BackgroundPlanningSyncService(
        IServiceProvider serviceProvider,
        ILogger<BackgroundPlanningSyncService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(15));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();

                var syncService = scope.ServiceProvider
                    .GetRequiredService<PlanningSyncService>();

                await syncService.SyncPlanningAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur dans BackgroundPlanningSyncService");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }
}