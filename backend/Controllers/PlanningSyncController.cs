using Microsoft.AspNetCore.Mvc;
using Triweb.Api.Services;

namespace Triweb.Api.Controllers;

[ApiController]
[Route("api/planning-sync")]
public sealed class PlanningSyncController : ControllerBase
{
    private readonly PlanningSyncService _planningSyncService;

    public PlanningSyncController(PlanningSyncService planningSyncService)
    {
        _planningSyncService = planningSyncService;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run(CancellationToken cancellationToken)
    {
        await _planningSyncService.SyncPlanningAsync(cancellationToken);

        return Ok(new
        {
            message = "Synchronisation planification terminée."
        });
    }
}