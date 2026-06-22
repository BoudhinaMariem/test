using Microsoft.AspNetCore.Mvc;
using Triweb.Api.Models;
using Triweb.Api.Services;

namespace Triweb.Api.Controllers
{
    [ApiController]
    [Route("api/ml-models")]
    public class MlModelsController : ControllerBase
    {
        private readonly MlApiService _mlApiService;
        private readonly ILogger<MlModelsController> _logger;

        public MlModelsController(
            MlApiService mlApiService,
            ILogger<MlModelsController> logger)
        {
            _mlApiService = mlApiService;
            _logger = logger;
        }

        [HttpGet("health")]
        public async Task<IActionResult> Health()
        {
            try
            {
                var json = await _mlApiService.HealthAsync();
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur health ML API");

                return StatusCode(500, new
                {
                    message = "ML API inaccessible",
                    detail = ex.Message,
                    stack = ex.StackTrace
                });
            }
        }

        [HttpPost("predict/retard")]
        public async Task<IActionResult> PredictRetard([FromBody] MlPredictionRequestDto payload)
        {
            try
            {
                var json = await _mlApiService.PredictRetardAsync(payload);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur prédiction retard");

                return StatusCode(500, new
                {
                    message = "Erreur prédiction retard",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("predict/charge")]
        public async Task<IActionResult> PredictCharge([FromBody] MlPredictionRequestDto payload)
        {
            try
            {
                var json = await _mlApiService.PredictChargeAsync(payload);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur prédiction charge");

                return StatusCode(500, new
                {
                    message = "Erreur prédiction charge",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("predict/affectation")]
        public async Task<IActionResult> PredictAffectation([FromBody] MlPredictionRequestDto payload)
        {
            try
            {
                var json = await _mlApiService.PredictAffectationAsync(payload);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur prédiction affectation");

                return StatusCode(500, new
                {
                    message = "Erreur prédiction affectation",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("predict/all")]
        public async Task<IActionResult> PredictAll([FromBody] MlPredictionRequestDto payload)
        {
            try
            {
                var json = await _mlApiService.PredictAllAsync(payload);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur prédiction ML globale");

                return StatusCode(500, new
                {
                    message = "Erreur prédiction ML globale",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("predict/planning-risk")]
        public async Task<IActionResult> PredictPlanningRisk([FromBody] MlPredictionRequestDto payload)
        {
            try
            {
                var json = await _mlApiService.PostRawAsync("predict/planning-risk", payload);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erreur prédiction risque planning");

                return StatusCode(500, new
                {
                    message = "Erreur prédiction risque planning",
                    detail = ex.Message
                });
            }
        }
    }
}