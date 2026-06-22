using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Triweb.Api.Services;

namespace Triweb.Api.Controllers;

[ApiController]
[Route("api/chatbot")]
public sealed class ChatbotController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatbotController> _logger;
    private readonly DashboardService _dashboardService;

    public ChatbotController(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ChatbotController> logger,
        DashboardService dashboardService)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _dashboardService = dashboardService;
    }

    [HttpGet("debug-context")]
    public async Task<IActionResult> DebugContext()
    {
        var businessContext = await BuildBusinessContextAsync();
        return Ok(businessContext);
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask(
        [FromBody] ChatbotAskRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest(new
            {
                success = false,
                answer = "Question vide."
            });
        }

        try
        {
            var mlBaseUrl = _configuration["MlApi:BaseUrl"] ?? "http://localhost:8000";

            var businessContext = await BuildBusinessContextAsync();

            var payload = new
            {
                question = request.Question,
                businessContext
            };

            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            });

            using var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.PostAsync(
                $"{mlBaseUrl.TrimEnd('/')}/chatbot/ask",
                content,
                cancellationToken);

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Erreur FastAPI chatbot. Status={StatusCode}, Body={Body}",
                    response.StatusCode,
                    responseContent);

                return StatusCode((int)response.StatusCode, new
                {
                    success = false,
                    answer = "Erreur FastAPI chatbot.",
                    detail = responseContent
                });
            }

            return Content(responseContent, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur backend chatbot");

            return StatusCode(500, new
            {
                success = false,
                answer = "Erreur backend chatbot.",
                detail = ex.Message
            });
        }
    }

    private async Task<object> BuildBusinessContextAsync()
    {
        var meta = await _dashboardService.GetMetaAsync();
        var overview = await _dashboardService.GetOverviewAsync();
        var planification = await _dashboardService.GetPlanificationAsync();
        var production = await _dashboardService.GetProductionAsync();
        var performance = await _dashboardService.GetPerformanceAsync();
        var disponibilite = await _dashboardService.GetDisponibiliteAsync();
        var modelsIa = await _dashboardService.GetModelsIaAsync();

        var items = await _dashboardService.GetItemsAsync();

        var simplifiedItems = items
            .Take(120)
            .Select(SimplifyItem)
            .ToList();

        var totalDossiers = items.Count;

        var dossiersNonAffectes = items.Count(item =>
        {
            var teamR = Normalize(GetValue(item, "teamR", "TeamR"));
            var teamG = Normalize(GetValue(item, "teamG", "TeamG"));
            var position = Normalize(GetValue(item, "position", "postion", "Position", "Postion"));

            return string.IsNullOrWhiteSpace(teamR)
                || string.IsNullOrWhiteSpace(teamG)
                || teamR.Contains("non affect")
                || teamG.Contains("non affect")
                || teamG.Contains("cdc")
                || position.Contains("non affect");
        });

        var dossiersAffectesProduction = items.Count(item =>
        {
            var position = Normalize(GetValue(item, "position", "postion", "Position", "Postion"));
            var etatR = Normalize(GetValue(item, "etatR", "EtatR"));
            var etatG = Normalize(GetValue(item, "etatG", "EtatG"));

            return position.Contains("production")
                && (
                    etatR.Contains("affect")
                    || etatG.Contains("affect")
                    || etatR.Contains("cours")
                    || etatG.Contains("cours")
                );
        });

        var dossiersFinalises = items.Count(item =>
        {
            var statut = Normalize(GetValue(item, "statut", "Statut", "status"));
            return statut.Contains("livr")
                || statut.Contains("valid");
        });

        var retoursCq = items.Count(item =>
        {
            var statut = Normalize(GetValue(item, "statut", "Statut", "status"));
            var position = Normalize(GetValue(item, "position", "postion", "Position", "Postion"));
            var etatR = Normalize(GetValue(item, "etatR", "EtatR"));
            var etatG = Normalize(GetValue(item, "etatG", "EtatG"));
            var etatCqi = Normalize(GetValue(item, "etatCqi", "etatCQI", "EtatCqi"));
            var etatCqc = Normalize(GetValue(item, "etatCqc", "etatCQC", "EtatCqc"));

            return statut.Contains("retour")
                || position.Contains("retour")
                || etatR.Contains("retour")
                || etatG.Contains("retour")
                || etatCqi.Contains("retour")
                || etatCqc.Contains("retour")
                || statut.Contains("non conforme");
        });

        var dossiersUrgents = items.Count(item =>
        {
            var statut = Normalize(GetValue(item, "statut", "Statut", "status"));
            var dateValue = GetValue(item, "dateLivraisonPrevue", "DateLivraisonPrevue", "deadline", "dateEcheance");

            if (statut.Contains("urgent"))
                return true;

            if (dateValue == null)
                return false;

            if (!DateTime.TryParse(dateValue.ToString(), out var datePrevue))
                return false;

            var days = (datePrevue.Date - DateTime.Today).Days;
            return days >= 0 && days <= 1;
        });

        var pagesLivreesAujourdhui = items
            .Where(item =>
            {
                var dateValue = GetValue(item, "dateLivraison", "DateLivraison");

                if (dateValue == null)
                    return false;

                if (!DateTime.TryParse(dateValue.ToString(), out var dateLivraison))
                    return false;

                return dateLivraison.Date == DateTime.Today;
            })
            .Sum(item => ToDouble(GetValue(item, "page", "Page", "pages")));

        var chargeParEquipe = items
            .Select(item => new
            {
                Equipe = GetTeamName(item),
                Charge = ToDouble(GetValue(item, "charge", "Charge")),
                Pages = ToDouble(GetValue(item, "page", "Page", "pages"))
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.Equipe))
            .GroupBy(x => x.Equipe)
            .Select(group => new
            {
                equipe = group.Key,
                nbDossiers = group.Count(),
                chargeTotale = Math.Round(group.Sum(x => x.Charge), 2),
                pagesTotales = Math.Round(group.Sum(x => x.Pages), 2)
            })
            .OrderByDescending(x => x.nbDossiers)
            .Take(10)
            .ToList();

        var equipePlusChargee = chargeParEquipe.FirstOrDefault();

        var repartitionParPosition = items
            .GroupBy(item => (GetValue(item, "position", "postion", "Position", "Postion")?.ToString() ?? "Non défini"))
            .Select(group => new
            {
                position = group.Key,
                count = group.Count()
            })
            .OrderByDescending(x => x.count)
            .Take(10)
            .ToList();

        var repartitionParStatut = items
            .GroupBy(item => (GetValue(item, "statut", "Statut", "status")?.ToString() ?? "Non défini"))
            .Select(group => new
            {
                statut = group.Key,
                count = group.Count()
            })
            .OrderByDescending(x => x.count)
            .Take(10)
            .ToList();

        return new
        {
            source = "triweb-dashboard-and-planification-dynamic-data",
            generatedAt = DateTime.UtcNow,

            indicateursPrincipaux = new
            {
                totalDossiers,
                dossiersAffectesProduction,
                dossiersNonAffectes,
                dossiersFinalises,
                pagesLivreesAujourdhui,
                retoursCq,
                dossiersUrgents,
                equipePlusChargee
            },

            analyses = new
            {
                chargeParEquipe,
                repartitionParPosition,
                repartitionParStatut
            },

            dashboard = new
            {
                meta,
                overview,
                production,
                performance,
                disponibilite,
                modelsIa
            },

            planification = new
            {
                summary = planification,
                totalItemsLoaded = items.Count
            }
        };
    }


    private static string Normalize(object? value)
    {
        if (value == null)
            return string.Empty;

        return value
            .ToString()!
            .Trim()
            .ToLowerInvariant()
            .Replace("é", "e")
            .Replace("è", "e")
            .Replace("ê", "e")
            .Replace("à", "a")
            .Replace("ù", "u")
            .Replace("ç", "c");
    }

    private static double ToDouble(object? value)
    {
        if (value == null)
            return 0;

        var text = value.ToString();

        if (string.IsNullOrWhiteSpace(text))
            return 0;

        text = text.Replace(",", ".");

        return double.TryParse(
            text,
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out var result)
            ? result
            : 0;
    }

    private static string GetTeamName(Dictionary<string, object?> item)
    {
        var teamR = GetValue(item, "teamR", "TeamR")?.ToString();
        var teamG = GetValue(item, "teamG", "TeamG")?.ToString();

        if (!string.IsNullOrWhiteSpace(teamR))
            return teamR;

        if (!string.IsNullOrWhiteSpace(teamG))
            return teamG;

        return "Non affecté";
    }

    private static object SimplifyItem(Dictionary<string, object?> item)
    {
        return new
        {
            id = GetValue(item, "id", "Id"),
            client = GetValue(item, "client", "Client", "rs", "RS"),
            codeClient = GetValue(item, "codeClient", "CodeClient"),
            statut = GetValue(item, "statut", "Statut", "status"),
            position = GetValue(item, "position", "postion", "Position", "Postion"),
            nature = GetValue(item, "nature", "Nature"),
            loiHamon = GetValue(item, "loiHamon", "LoiHamon"),
            teamR = GetValue(item, "teamR", "TeamR"),
            teamG = GetValue(item, "teamG", "TeamG"),
            etatR = GetValue(item, "etatR", "EtatR"),
            etatG = GetValue(item, "etatG", "EtatG"),
            etatCqi = GetValue(item, "etatCqi", "etatCQI", "EtatCqi"),
            etatCqc = GetValue(item, "etatCqc", "etatCQC", "EtatCqc"),
            page = GetValue(item, "page", "Page", "pages"),
            charge = GetValue(item, "charge", "Charge"),
            dateLivraisonPrevue = GetValue(item, "dateLivraisonPrevue", "DateLivraisonPrevue"),
            dateLivraison = GetValue(item, "dateLivraison", "DateLivraison")
        };
    }

    private static object? GetValue(
        Dictionary<string, object?> item,
        params string[] keys)
    {
        foreach (var key in keys)
        {
            if (item.TryGetValue(key, out var value) && value != null)
            {
                return value;
            }
        }

        return null;
    }
}

public sealed class ChatbotAskRequest
{
    public string Question { get; set; } = string.Empty;
}