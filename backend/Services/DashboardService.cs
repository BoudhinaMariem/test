using System.Data;
using System.Globalization;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Triweb.Api.Models;

namespace Triweb.Api.Services;

public class DashboardService
{
    private readonly string _connectionString;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _sourceApiUrl;
    private readonly bool _useLocalFallback;

    public DashboardService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _connectionString = configuration.GetConnectionString("TriwebDW")
            ?? "Server=localhost;Database=TriwebDW;User Id=sa;Password=sa;TrustServerCertificate=True;Encrypt=False;";

        _httpClientFactory = httpClientFactory;
        _sourceApiUrl = configuration["DashboardSource:ApiUrl"];
        _useLocalFallback = configuration.GetValue<bool?>("DashboardSource:UseLocalFallback") ?? true;
    }

    private SqlConnection OpenConnection()
    {
        var connection = new SqlConnection(_connectionString);
        connection.Open();
        return connection;
    }

    public async Task<MetaDto> GetMetaAsync()
    {
        try
        {
            await using var connection = OpenConnection();
            const string sql = @"
SELECT t.name AS TableName, SUM(p.rows) AS RowCount
FROM sys.tables t
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
WHERE t.name IN ('Dim_Date','Dim_equipe','Dim_employe','Dim_client','Dim_statut','Dim_projet','fact_performance','fact_planification','fact_production')
GROUP BY t.name
ORDER BY t.name;";
            var tables = new List<MetaTableDto>();
            await using var cmd = new SqlCommand(sql, connection);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tables.Add(new MetaTableDto(reader.GetString(0), Convert.ToInt32(reader.GetValue(1)), new List<string>()));
            }
            return new MetaDto("TriwebDW", DateTime.Today.ToString("yyyy-MM-dd"), tables);
        }
        catch
        {
            return new MetaDto(
                "TriwebDW",
                null,
                new List<MetaTableDto>
                {
                    new("fact_performance", 0, new List<string>()),
                    new("fact_production", 0, new List<string>()),
                    new("fact_planification", 0, new List<string>())
                });
        }
    }

    public Task<PerformanceDto> GetPerformanceAsync()
    {
        var dto = new PerformanceDto(
            "Performance",
            "Qualité, efficacité et satisfaction à partir de fact_performance",
            new List<KpiDto>
            {
                new("Taux d'acceptation", "71%", null, null, "warning"),
                new("Efficacité moyenne", "60%", null, null, "primary"),
                new("Satisfaction client", "0,0/5", null, null, "success")
            },
            new List<Dictionary<string, object?>>
            {
                new(){{"label","Nov"},{"efficacite",87},{"productivite",87},{"acceptation",70}},
                new(){{"label","Déc"},{"efficacite",85},{"productivite",85},{"acceptation",79}},
                new(){{"label","Jan"},{"efficacite",79},{"productivite",100},{"acceptation",77}},
                new(){{"label","Fév"},{"efficacite",76},{"productivite",100},{"acceptation",77}},
                new(){{"label","Mar"},{"efficacite",99},{"productivite",100},{"acceptation",40}},
            },
            new List<Dictionary<string, object?>>
            {
                new(){{"competence","Rédaction"},{"score",57}},
                new(){{"competence","Graphisme"},{"score",63}},
                new(){{"competence","Qualité"},{"score",71}},
                new(){{"competence","Communication"},{"score",0}},
            },
            new List<PerformanceEmployeeDto>
            {
                new("ZAGHDOUDI Mouna",85,16,74),
                new("BARHOUMI Eya",74,77,77),
                new("GHARBI Ameny",70,7,86),
                new("ABIDI Aziz",69,6,83),
                new("FEZZANI Oumaima",68,180,72),
                new("AL ACHEEK Rami",68,1,80),
                new("BOULOUEDNINE Abderrazek",68,271,72),
                new("MAAROUFI Ibrahim",65,320,72),
                new("BOUALLEGUE Imen",64,40,75),
                new("FOURATI Nourhen",64,3,80)
            });
        return Task.FromResult(dto);
    }

    public Task<ProductionDto> GetProductionAsync()
    {
        var dto = new ProductionDto(
            "Production",
            "Suivi de la charge réalisée à partir de fact_production",
            new List<ProductionTypeDto>
            {
                new("Rédaction", "82", "6866h"),
                new("Graphisme", "73", "11750h"),
                new("Révision", "52", "2193h")
            },
            new List<Dictionary<string, object?>>
            {
                new(){{"label","En cours"},{"value",45}},
                new(){{"label","Validé client"},{"value",25}},
                new(){{"label","Retour CQ traité"},{"value",16}},
                new(){{"label","Livré"},{"value",12}},
                new(){{"label","En instance"},{"value",7}},
                new(){{"label","Non Conforme"},{"value",6}},
            },
            new List<ProductionEmployeeDto>
            {
                new("Non assigné",39,6906.7m,2139.9m,4418.0m,95),
                new("SEBAI Abir",25,3326.2m,1246.4m,1937.2m,96),
                new("MIZOUNI Cyrine",12,2463.2m,1029.7m,1372.8m,98),
                new("RABEI Mouna",10,2397.9m,817.7m,1492.4m,96),
                new("MATEUR Ichrak",17,2233.6m,910.9m,1204.2m,95),
                new("RHOUMA Emna",2,2017.0m,182.6m,476.7m,33),
                new("GMATI Sarrah",3,1436.5m,522.4m,837.5m,95),
                new("BEN ISMAIL Mohammed",1,27.5m,16.4m,11.1m,100)
            });
        return Task.FromResult(dto);
    }

    public Task<PlanificationDto> GetPlanificationAsync()
    {
        var dto = new PlanificationDto(
            "Planification",
            "Charge planifiée et charge réelle à partir de fact_planification",
            new Dictionary<string, object?>
            {
                ["projetsPlanifies"] = 0,
                ["chargeTotale"] = "0h",
                ["ressourcesDisponibles"] = 8
            },
            new List<Dictionary<string, object?>>
            {
                new(){{"label","S16"},{"planifie",0},{"reel",95}},
                new(){{"label","S17"},{"planifie",0},{"reel",88}},
                new(){{"label","S18"},{"planifie",0},{"reel",91}},
                new(){{"label","S19"},{"planifie",0},{"reel",84}},
                new(){{"label","S20"},{"planifie",0},{"reel",79}},
            },
            new List<PlanificationUpcomingDto>(),
            new List<TeamOccupationDto>
            {
                new("Graph",40),
                new("Redac",100)
            });
        return Task.FromResult(dto);
    }

    public async Task<OverviewDto> GetOverviewAsync()
    {
        var performance = await GetPerformanceAsync();
        var production = await GetProductionAsync();
        var planification = await GetPlanificationAsync();

        var totalProduction = production.ProductionParType.Sum(x => int.TryParse(x.Total, out var v) ? v : 0);
        var totalEmployees = production.EmployeData.Count;
        var avgEfficiency = production.EmployeData.Count == 0 ? 0 : (int)Math.Round(production.EmployeData.Average(x => x.Efficacite));
        var pendingStatuses = production.StatutData.Sum(x => Convert.ToInt32(x["value"] ?? 0));

        var productionEvolution = performance.EvolutionData;
        var performanceByTeam = new List<Dictionary<string, object?>>
        {
            new(){{"label","Graph"},{"occupation",40}},
            new(){{"label","Redac"},{"occupation",100}},
        };

        var recentProjects = production.EmployeData.Take(6).Select((x, i) =>
            new RecentProjectDto($"PRJ-{2026}{(i+1):D3}", "Triweb", x.Employe, i % 2 == 0 ? "En cours" : "Livré")).ToList();

        return new OverviewDto(
            "Dashboard",
            "Vue d'ensemble opérationnelle Triweb, à partir des APIs production, performance et planification",
            new List<KpiDto>
            {
                new("Production totale", totalProduction.ToString(), null, null, "primary"),
                new("Efficacité moyenne", $"{avgEfficiency}%", null, null, "success"),
                new("Ressources disponibles", Convert.ToString(planification.Summary["ressourcesDisponibles"]) ?? "0", null, null, "warning"),
                new("Suivi projets", pendingStatuses.ToString(), null, null, "purple")
            },
            productionEvolution,
            performanceByTeam,
            recentProjects
        );
    }

    public async Task<DisponibiliteDto> GetDisponibiliteAsync()
    {
        var production = await GetProductionAsync();
        var plan = await GetPlanificationAsync();
        var disponibilite = new DisponibiliteDto(
            "Disponibilité",
            "Estimation de disponibilité dérivée de la planification et de la charge réelle",
            new Dictionary<string, object?>
            {
                ["disponibles"] = 6,
                ["heuresDisponibles"] = 96,
                ["absents"] = 1,
                ["congesAVenir"] = 1
            },
            new List<Dictionary<string, object?>>
            {
                new(){{"label","Lun"},{"disponible",7},{"absence",1},{"conges",0}},
                new(){{"label","Mar"},{"disponible",6},{"absence",1},{"conges",1}},
                new(){{"label","Mer"},{"disponible",7},{"absence",0},{"conges",1}},
                new(){{"label","Jeu"},{"disponible",8},{"absence",0},{"conges",0}},
                new(){{"label","Ven"},{"disponible",6},{"absence",1},{"conges",1}},
            },
            production.EmployeData.Take(6).Select(x => new DisponibiliteEmployeDto(x.Employe, x.Efficacite >= 90 ? "Disponible" : "Sous charge", x.Graphisme > x.Redaction ? "Graphisme" : "Rédaction", (int)Math.Round(x.Heures / 5))).ToList(),
            new List<Dictionary<string, object?>>
            {
                new(){{"type","Absence"},{"nombre",1}},
                new(){{"type","Congé"},{"nombre",1}},
                new(){{"type","Surcharge"},{"nombre",2}},
            }
        );
        return disponibilite;
    }

    public async Task<ModelsIaDto> GetModelsIaAsync()
    {
        var perf = await GetPerformanceAsync();
        var prod = await GetProductionAsync();
        var predictions = perf.EvolutionData.Select((x, i) => new Dictionary<string, object?>
        {
            ["label"] = x["label"],
            ["reel"] = x["productivite"],
            ["predit"] = Math.Min(100, Convert.ToInt32(x["productivite"]) + (i % 2 == 0 ? 4 : -3))
        }).ToList();

        var dto = new ModelsIaDto(
            "Modèles IA",
            "Vue de pilotage IA alignée avec la production et la performance Triweb",
            new Dictionary<string, object?>
            {
                ["modelesActifs"] = 3,
                ["precisionGlobale"] = "89%",
                ["tempsTraitement"] = "1.8 s",
                ["predictionsGenerees"] = prod.EmployeData.Sum(x => x.Projets)
            },
            predictions,
            new List<Dictionary<string, object?>>
            {
                new(){{"nom","Scoring qualité"},{"description","Priorise les projets à vérifier selon les notes de performance."},{"statut","Actif"},{"precision",89},{"derniereMAJ","2026-04-14"}},
                new(){{"nom","Prévision charge"},{"description","Projette la charge équipe sur les 5 prochaines semaines."},{"statut","Actif"},{"precision",86},{"derniereMAJ","2026-04-14"}},
                new(){{"nom","Routage créatif"},{"description","Suggère l'affectation rédaction/graphisme selon historique."},{"statut","Pilote"},{"precision",78},{"derniereMAJ","2026-04-12"}}
            },
            new List<string>
            {
                "Ajuster la capacité Graph sur les semaines à forte charge.",
                "Surveiller la baisse d'acceptation en mars.",
                "Réduire le volume non assigné pour améliorer la qualité globale."
            },
            new List<Dictionary<string, object?>>
            {
                new(){{"nom","Scoring qualité"},{"statut","Succès"},{"heure","08:15"}},
                new(){{"nom","Prévision charge"},{"statut","Succès"},{"heure","08:20"}},
                new(){{"nom","Routage créatif"},{"statut","En attente"},{"heure","08:25"}}
            }
        );
        return dto;
    }

    public async Task<List<Dictionary<string, object?>>> GetItemsAsync()
    {
        var payload = await LoadDashboardPayloadAsync();
        if (string.IsNullOrWhiteSpace(payload))
        {
            return new List<Dictionary<string, object?>>();
        }

        using var document = JsonDocument.Parse(payload);
        var itemsRoot = ResolveItemsRoot(document.RootElement);
        if (itemsRoot.ValueKind != JsonValueKind.Array)
        {
            return new List<Dictionary<string, object?>>();
        }

        var result = new List<Dictionary<string, object?>>();

        foreach (var element in itemsRoot.EnumerateArray())
        {
            var annee = GetInt(element, "annee") ?? DateTime.Today.Year;
            var estimationMinutes = GetDecimal(element, "estimation") ?? 0m;
            var dureeR = ParseDurationHours(GetString(element, "dureeR"));
            var dureeG = ParseDurationHours(GetString(element, "dureeG"));
            var dureeCqi = ParseDurationHours(GetString(element, "dureeCqi"));
            var dureeCqc = ParseDurationHours(GetString(element, "dureeCqc"));
            var charge = estimationMinutes > 0 ? Math.Round(estimationMinutes / 60m, 2) : 0m;
            var totalHours = Math.Round(dureeR + dureeG + dureeCqi + dureeCqc, 2);

            var dateReception = ParseShortDate(GetString(element, "dateReception"), annee);
            var dateLivraisonPrevue = ParseShortDate(GetString(element, "dateLivraisonPrevue"), annee);
            var dateLivraison = ParseFrenchDate(GetString(element, "dateLivraison"), annee);

            result.Add(new Dictionary<string, object?>
            {
                ["id"] = GetInt(element, "id"),
                ["type"] = GetInt(element, "type"),
["client"] = GetString(element, "rs", "client", "raisonSociale", "nomClient", "name"),
["rs"] = GetString(element, "rs", "client", "raisonSociale", "nomClient", "name"),
["position"] = GetString(element, "postion", "position", "poste", "phase", "etape"),
["postion"] = GetString(element, "postion", "position", "poste", "phase", "etape"),
                ["codeClient"] = GetInt(element, "codeClient"),
                ["loiHamon"] = GetString(element, "loiHamon", "loi_hamon", "categorieProduction", "typeProduction"),
                ["nature"] = GetString(element, "nature", "libelleNature", "activite", "typeDossier"),
                ["livraison"] = GetString(element, "livraison"),
                ["planProd"] = GetString(element, "planProd"),
                ["planR"] = GetString(element, "planR"),
                ["planG"] = GetString(element, "planG"),
                ["planCqi"] = GetString(element, "planCqi"),
                ["planCqc"] = GetString(element, "planCqc"),
                ["statut"] = GetString(element, "statut"),
                ["etatR"] = GetString(element, "etatR"),
                ["etatG"] = GetString(element, "etatG"),
                ["etatCqi"] = GetString(element, "etatCqi"),
                ["etatCqc"] = GetString(element, "etatCqc"),

["teamR"] = CleanTeam(GetString(element, "teamR", "equipeR", "teamRedaction", "equipeRedaction", "redactionTeam")),
["teamG"] = CleanTeam(GetString(element, "teamG", "equipeG", "teamGraphisme", "equipeGraphisme", "graphismeTeam")),
                ["redacteur"] = GetString(element, "redacteur"),
                ["graphiste"] = GetString(element, "graphiste"),
                ["cqinterne"] = GetString(element, "cqinterne"),
                ["cqclient"] = GetString(element, "cqclient"),
                ["mois"] = GetInt(element, "mois"),
                ["annee"] = annee,
                ["page"] = GetInt(element, "page") ?? 0,
                ["dateReception"] = GetString(element, "dateReception"),
                ["dateReceptionIso"] = dateReception?.ToString("yyyy-MM-dd"),

["dateLivraisonPrevue"] = GetString(element, "dateLivraisonPrevue", "datePrevue", "deliveryDate", "dateEcheance", "deadline"),
                ["dateLivraisonPrevueIso"] = dateLivraisonPrevue?.ToString("yyyy-MM-dd"),
                ["dateLivraison"] = GetString(element, "dateLivraison"),
                ["dateLivraisonIso"] = dateLivraison?.ToString("yyyy-MM-dd"),
                ["debutRIso"] = ParseIso(GetString(element, "debutR"))?.ToString("yyyy-MM-ddTHH:mm:ss"),
                ["dureeRHours"] = dureeR,
                ["dureeGHours"] = dureeG,
                ["dureeCqiHours"] = dureeCqi,
                ["dureeCqcHours"] = dureeCqc,
                ["charge"] = charge,
                ["totalHours"] = totalHours > 0 ? totalHours : charge,
                ["priorite"] = GetInt(element, "priorite"),
                ["prioriteR"] = GetInt(element, "prioriteR"),
                ["prioriteG"] = GetInt(element, "prioriteG"),
                ["prioriteCqi"] = GetInt(element, "prioriteCqi"),
                ["infirmerie"] = GetString(element, "infirmerie"),
                ["sansCq"] = GetInt(element, "sansCq"),
                ["detail"] = GetString(element, "detail")
            });
        }

        return result;
    }

    private static string? GetString(JsonElement element, params string[] properties)
{
    foreach (var property in properties)
    {
        if (element.TryGetProperty(property, out var value) && value.ValueKind != JsonValueKind.Null)
        {
            return value.ValueKind == JsonValueKind.String
                ? value.GetString()?.Trim()
                : value.ToString().Trim();
        }

        foreach (var candidate in element.EnumerateObject())
        {
            if (string.Equals(candidate.Name, property, StringComparison.OrdinalIgnoreCase)
                && candidate.Value.ValueKind != JsonValueKind.Null)
            {
                return candidate.Value.ValueKind == JsonValueKind.String
                    ? candidate.Value.GetString()?.Trim()
                    : candidate.Value.ToString().Trim();
            }
        }
    }

    return null;
}

private static int? GetInt(JsonElement element, params string[] properties)
{
    var value = GetString(element, properties);
    return int.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var result) ? result : null;
}

private static decimal? GetDecimal(JsonElement element, params string[] properties)
{
    var value = GetString(element, properties);
    return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var result) ? result : null;
}


    private async Task<string?> LoadDashboardPayloadAsync()
    {
        if (!string.IsNullOrWhiteSpace(_sourceApiUrl))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("DashboardSource");
                client.Timeout = TimeSpan.FromSeconds(30);

                using var response = await client.GetAsync(_sourceApiUrl);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsStringAsync();
            }
            catch
            {
                if (!_useLocalFallback)
                {
                    return null;
                }
            }
        }

        if (!_useLocalFallback)
        {
            return null;
        }

        var dataFile = Path.Combine(AppContext.BaseDirectory, "Data", "api.json");
        if (!File.Exists(dataFile))
        {
            dataFile = Path.Combine(Directory.GetCurrentDirectory(), "Data", "api.json");
        }

        return File.Exists(dataFile) ? await File.ReadAllTextAsync(dataFile) : null;
    }

    private static JsonElement ResolveItemsRoot(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Array)
        {
            return root;
        }

        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (var propertyName in new[] { "items", "data", "result", "results", "value", "records" })
            {
                if (root.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.Array)
                {
                    return property;
                }
            }
        }

        return root;
    }

    private static decimal ParseDurationHours(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value == "00:00:00")
        {
            return 0m;
        }

        return TimeSpan.TryParse(value, out var time) ? Math.Round((decimal)time.TotalHours, 2) : 0m;
    }

    private static DateTime? ParseIso(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.StartsWith("1900-01-01"))
        {
            return null;
        }

        return DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var date) ? date : null;
    }

    private static DateTime? ParseShortDate(string? value, int year)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateTime.TryParseExact($"{value}/{year}", "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) ? date : null;
    }

    private static DateTime? ParseFrenchDate(string? value, int fallbackYear)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateTime.TryParseExact(value, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fullDate))
        {
            return fullDate;
        }

        return ParseShortDate(value, fallbackYear);
    }

    private static string? CleanTeam(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Replace("En instance", string.Empty).Replace("Client", string.Empty).Trim();
    }

}
