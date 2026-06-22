using System.Text.Json.Serialization;

namespace Triweb.Api.Models;

public sealed class MlPredictionRequestDto
{
    [JsonPropertyName("position")]
    public string Position { get; set; } = string.Empty;

    [JsonPropertyName("statut")]
    public string Statut { get; set; } = string.Empty;

    [JsonPropertyName("loi_type")]
    public string LoiType { get; set; } = string.Empty;

    [JsonPropertyName("nature")]
    public string Nature { get; set; } = string.Empty;

    [JsonPropertyName("etat_r")]
    public string EtatR { get; set; } = string.Empty;

    [JsonPropertyName("etat_g")]
    public string EtatG { get; set; } = string.Empty;

    [JsonPropertyName("team_r")]
    public string TeamR { get; set; } = string.Empty;

    [JsonPropertyName("team_g")]
    public string TeamG { get; set; } = string.Empty;

    [JsonPropertyName("page")]
    public double Page { get; set; }

    [JsonPropertyName("charge")]
    public double Charge { get; set; }

    [JsonPropertyName("total_heures")]
    public double TotalHeures { get; set; }

    [JsonPropertyName("jours_restants")]
    public double JoursRestants { get; set; }
}